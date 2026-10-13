-- R4 block 4. Versioned only; remote application requires separate authorization.
begin;

create function public.get_suggested_events(
    p_origin_lat double precision default null,
    p_origin_lng double precision default null,
    p_limit integer default 6
) returns table (
    id uuid, organizer_id uuid, title text, description text,
    starts_at timestamp, ends_at timestamp, address text, location_name text,
    latitude double precision, longitude double precision, capacity integer,
    category_id uuid, visibility text, cancelled_at timestamp, archived_at timestamp,
    category_name text, image_path text, has_interests boolean,
    matches_interest boolean, distance_km double precision, starts_soon boolean
) language plpgsql stable security invoker set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_now timestamp := statement_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    v_has_interests boolean;
begin
    if v_user_id is null then return; end if;
    if (p_origin_lat is null) <> (p_origin_lng is null)
        or (p_origin_lat is not null and not (
            p_origin_lat between -90 and 90 and p_origin_lng between -180 and 180)) then
        raise exception 'suggestions_invalid_origin' using errcode = '22023';
    end if;
    if p_limit is null or p_limit not between 1 and 20 then
        raise exception 'suggestions_invalid_limit' using errcode = '22023';
    end if;
    select exists(select 1 from public.user_category_interests i where i.user_id = v_user_id)
        into v_has_interests;

    -- All authorized available public candidates are scored BEFORE LIMIT. Own and
    -- confirmed events remain eligible. Saved inactive interests retain affinity.
    -- No-interest fallback is chronological, not disguised personalization.
    return query
    with candidates as (
        select e.*, c.name as category_name,
            exists(select 1 from public.user_category_interests i
                where i.user_id = v_user_id and i.category_id = e.category_id) as affinity,
            case when p_origin_lat is not null then
                2 * 6371 * asin(least(1, sqrt(
                    power(sin(radians(e.latitude - p_origin_lat) / 2), 2)
                    + cos(radians(p_origin_lat)) * cos(radians(e.latitude))
                    * power(sin(radians(e.longitude - p_origin_lng) / 2), 2))))
            end as distance,
            greatest(0, extract(epoch from (e.starts_at - v_now)) / 86400)::double precision as days_until
        from public.events e join public.categories c on c.id = e.category_id
        where e.visibility = 'public' and e.cancelled_at is null and e.archived_at is null
            and e.ends_at > v_now
    ), ranked as (
        select c.*, (case when c.affinity then 100 else 0 end)
            + coalesce(30 * greatest(0, 1 - c.distance / 50), 0)
            + 20 * greatest(0, 1 - c.days_until / 7) as score
        from candidates c
    ), selected as (
        select r.* from ranked r where not v_has_interests or r.score > 0
        order by case when v_has_interests then r.score else 0 end desc, r.starts_at, r.id
        limit p_limit
    )
    select s.id, s.organizer_id, s.title, s.description, s.starts_at, s.ends_at,
        s.address, s.location_name, s.latitude, s.longitude, s.capacity, s.category_id,
        s.visibility, s.cancelled_at, s.archived_at, s.category_name,
        (select f.storage_path from public.event_images i join public.files f on f.id = i.file_id
            where i.event_id = s.id order by i.sort_order limit 1),
        v_has_interests, s.affinity, s.distance, s.days_until < 7
    from selected s
    order by case when v_has_interests then s.score else 0 end desc, s.starts_at, s.id;
end;
$$;
revoke all on function public.get_suggested_events(double precision, double precision, integer) from public, anon, authenticated;
grant execute on function public.get_suggested_events(double precision, double precision, integer) to authenticated;
comment on function public.get_suggested_events(double precision, double precision, integer) is 'R4-06: own interests, public available events; 100 affinity + up to 30 within 50 km + up to 20 within 7 days; score before LIMIT, starts_at/id ties; chronological no-interest fallback. Invoker with RLS.';
commit;
