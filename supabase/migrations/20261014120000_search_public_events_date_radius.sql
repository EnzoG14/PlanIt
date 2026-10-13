-- Release 4, block 2 (R4-03/R4-04). Created in Git; NOT applied to any remote project.
begin;

-- Extends the block-1 search with an Argentina date/range on starts_at (A02)
-- and a great-circle radius around an origin. Replaces the 9-argument
-- signature with a 14-argument one (the new parameters default to null).
-- Dates: p_date_from/p_date_to are calendar days in Argentina; a single day
-- is from = to. Range is [from 00:00, day after "to" 00:00) over starts_at
-- only; ends_at never decides a match. Radius: p_origin_* and p_radius_km are
-- all-or-nothing; a bounding box prefilter (wrapping the antimeridian) runs
-- first and Haversine (R = 6371 km) confirms. Bounds, date and radius are
-- AND-ed in the same query, before the limit.
drop function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision);

create function public.search_public_events(
    p_query text default null,
    p_category_ids uuid[] default null,
    p_before_starts_at timestamp default null,
    p_before_id uuid default null,
    p_limit integer default 30,
    p_south double precision default null,
    p_north double precision default null,
    p_west double precision default null,
    p_east double precision default null,
    p_date_from date default null,
    p_date_to date default null,
    p_origin_lat double precision default null,
    p_origin_lng double precision default null,
    p_radius_km double precision default null
) returns table (
    id uuid, organizer_id uuid, title text, description text,
    starts_at timestamp, ends_at timestamp, address text, location_name text,
    latitude double precision, longitude double precision, capacity integer,
    category_id uuid, visibility text, cancelled_at timestamp, archived_at timestamp,
    category_name text, image_path text
) language plpgsql stable security invoker set search_path = '' as $$
declare
    c_earth_km constant double precision := 6371;
    v_query text := nullif(btrim(coalesce(p_query, '')), '');
    v_pattern text;
    v_categories uuid[] := case when coalesce(cardinality(p_category_ids), 0) = 0 then null else p_category_ids end;
    v_bounds integer := (p_south is not null)::integer + (p_north is not null)::integer
        + (p_west is not null)::integer + (p_east is not null)::integer;
    v_radius integer := (p_origin_lat is not null)::integer + (p_origin_lng is not null)::integer
        + (p_radius_km is not null)::integer;
    v_from timestamp;
    v_to_exclusive timestamp;
    v_angle double precision;
    v_dlat double precision;
    v_dlon double precision;
    v_lat_min double precision;
    v_lat_max double precision;
    v_lon_any boolean := true;
    v_lon_w double precision;
    v_lon_e double precision;
begin
    if (select auth.uid()) is null then
        return;
    end if;
    if v_query is not null and char_length(v_query) > 100 then
        raise exception 'search_query_too_long' using errcode = '22023';
    end if;
    if v_categories is not null and cardinality(v_categories) > 50 then
        raise exception 'search_too_many_categories' using errcode = '22023';
    end if;
    if (p_before_starts_at is null) <> (p_before_id is null) then
        raise exception 'search_invalid_cursor' using errcode = '22023';
    end if;
    if v_bounds not in (0, 4) or (v_bounds = 4 and not (
        p_south between -90 and 90 and p_north between p_south and 90
        and p_west between -180 and 180 and p_east between -180 and 180)) then
        raise exception 'search_invalid_bounds' using errcode = '22023';
    end if;

    -- Dates: "to" needs "from"; no inverted range; years kept in a sane window.
    if p_date_to is not null and p_date_from is null then
        raise exception 'search_invalid_dates' using errcode = '22023';
    end if;
    if p_date_from is not null then
        if p_date_from not between date '2000-01-01' and date '2100-12-31'
            or (p_date_to is not null and (p_date_to < p_date_from or p_date_to > date '2100-12-31')) then
            raise exception 'search_invalid_dates' using errcode = '22023';
        end if;
        v_from := p_date_from::timestamp;
        v_to_exclusive := (coalesce(p_date_to, p_date_from) + 1)::timestamp;
    end if;

    -- Radius: all-or-nothing, finite, > 0, bounded; origin on the globe.
    if v_radius not in (0, 3) or (v_radius = 3 and not (
        p_origin_lat between -90 and 90 and p_origin_lng between -180 and 180
        and p_radius_km > 0 and p_radius_km <= 20000)) then
        raise exception 'search_invalid_radius' using errcode = '22023';
    end if;
    if v_radius = 3 then
        v_angle := p_radius_km / c_earth_km;
        v_dlat := degrees(v_angle);
        v_lat_min := p_origin_lat - v_dlat * 1.001;
        v_lat_max := p_origin_lat + v_dlat * 1.001;
        -- Longitude window only when the circle stays clear of the poles and
        -- spans less than half the globe; otherwise latitude + Haversine decide.
        if v_lat_max < 90 and v_lat_min > -90 and v_angle < pi() / 2 then
            v_dlon := degrees(asin(least(1, sin(v_angle) / cos(radians(p_origin_lat))))) * 1.001;
            if v_dlon < 179 then
                v_lon_any := false;
                v_lon_w := p_origin_lng - v_dlon;
                v_lon_e := p_origin_lng + v_dlon;
                if v_lon_w < -180 then v_lon_w := v_lon_w + 360; end if;
                if v_lon_e > 180 then v_lon_e := v_lon_e - 360; end if;
            end if;
        end if;
    end if;

    if v_query is not null then
        v_pattern := '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    end if;

    return query
    select e.id, e.organizer_id, e.title, e.description,
        e.starts_at, e.ends_at, e.address, e.location_name,
        e.latitude, e.longitude, e.capacity, e.category_id,
        e.visibility, e.cancelled_at, e.archived_at, c.name,
        (select f.storage_path
         from public.event_images i
         join public.files f on f.id = i.file_id
         where i.event_id = e.id
         order by i.sort_order
         limit 1)
    from public.events e
    join public.categories c on c.id = e.category_id
    where e.visibility = 'public'
        and e.cancelled_at is null
        and e.archived_at is null
        and e.ends_at > (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and (v_pattern is null
            or e.title ilike v_pattern escape '\'
            or e.description ilike v_pattern escape '\')
        and (v_categories is null or (c.is_active and e.category_id = any(v_categories)))
        and (v_bounds = 0 or (
            e.latitude between p_south and p_north
            and case when p_west <= p_east then e.longitude between p_west and p_east
                     else e.longitude >= p_west or e.longitude <= p_east end))
        and (v_from is null or (e.starts_at >= v_from and e.starts_at < v_to_exclusive))
        and (v_radius = 0 or (
            e.latitude between v_lat_min and v_lat_max
            and (v_lon_any or case when v_lon_w <= v_lon_e then e.longitude between v_lon_w and v_lon_e
                                   else e.longitude >= v_lon_w or e.longitude <= v_lon_e end)
            and 2 * c_earth_km * asin(least(1, sqrt(
                power(sin(radians(e.latitude - p_origin_lat) / 2), 2)
                + cos(radians(p_origin_lat)) * cos(radians(e.latitude))
                * power(sin(radians(e.longitude - p_origin_lng) / 2), 2)))) <= p_radius_km))
        and (p_before_starts_at is null or (e.starts_at, e.id) > (p_before_starts_at, p_before_id))
    order by e.starts_at, e.id
    limit least(greatest(coalesce(p_limit, 30), 1), 100) + 1;
end;
$$;

revoke all on function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision, date, date, double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision, date, date, double precision, double precision, double precision) to authenticated;
comment on function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision, date, date, double precision, double precision, double precision) is 'R4-01..04: public-only combined search (text, category OR, bounds, Argentina day/range on starts_at, great-circle radius, keyset cursor). Invoker; RLS applies.';

commit;
