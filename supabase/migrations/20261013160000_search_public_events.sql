-- Release 4, block 1 (R4-01/R4-02). Created in Git; NOT applied to any remote project.
begin;

-- One authenticated, public-only discovery query shared by Inicio and Mapa.
-- Text matches title OR description (case-insensitive, accent-sensitive: the
-- unaccent extension is not installed). The term is escaped so %, _ and \ are
-- literal. Categories are OR-ed together and AND-ed with the text; null or an
-- empty array is neutral, inactive categories are ignored. Optional bounds make
-- the map use the same filter; the (starts_at, id) keyset serves Inicio.
-- Universe: public, not cancelled/archived, not finished (ends_at in the future).
-- Block 2 extends this signature with date/radius parameters (default null).
create function public.search_public_events(
    p_query text default null,
    p_category_ids uuid[] default null,
    p_before_starts_at timestamp default null,
    p_before_id uuid default null,
    p_limit integer default 30,
    p_south double precision default null,
    p_north double precision default null,
    p_west double precision default null,
    p_east double precision default null
) returns table (
    id uuid, organizer_id uuid, title text, description text,
    starts_at timestamp, ends_at timestamp, address text, location_name text,
    latitude double precision, longitude double precision, capacity integer,
    category_id uuid, visibility text, cancelled_at timestamp, archived_at timestamp,
    category_name text, image_path text
) language plpgsql stable security invoker set search_path = '' as $$
declare
    v_query text := nullif(btrim(coalesce(p_query, '')), '');
    v_pattern text;
    v_categories uuid[] := case when coalesce(cardinality(p_category_ids), 0) = 0 then null else p_category_ids end;
    v_bounds integer := (p_south is not null)::integer + (p_north is not null)::integer
        + (p_west is not null)::integer + (p_east is not null)::integer;
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
        and (p_before_starts_at is null or (e.starts_at, e.id) > (p_before_starts_at, p_before_id))
    order by e.starts_at, e.id
    limit least(greatest(coalesce(p_limit, 30), 1), 100) + 1;
end;
$$;

revoke all on function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision) to authenticated;
comment on function public.search_public_events(text, uuid[], timestamp, uuid, integer, double precision, double precision, double precision, double precision) is 'R4-01/02: public-only combined search (text OR-title/description, category OR, optional bounds, keyset cursor). Invoker; RLS applies.';

commit;
