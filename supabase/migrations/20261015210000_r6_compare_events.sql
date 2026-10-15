begin;

-- R6 block 8. Batch counterpart of get_my_event_occupancy(uuid): same confirmed
-- count, capacity, availability and percentage expression, evaluated for 2..10
-- unique events in one statement. A definer aggregate is necessary because RLS
-- exposes only one's own participation rows.
create function public.get_my_events_occupancy(p_event_ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_result jsonb;
begin
    if v_user is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if p_event_ids is null or array_ndims(p_event_ids) is distinct from 1
        or cardinality(p_event_ids) not between 2 and 10
        or array_position(p_event_ids, null) is not null
        or (select count(distinct x) from unnest(p_event_ids) as x) <> cardinality(p_event_ids) then
        raise exception 'invalid_event_selection' using errcode = '22023';
    end if;
    -- Every requested id must belong to the caller before anything is returned:
    -- one foreign or nonexistent id rejects the whole batch with the same error.
    if (select count(*) from public.events e
        where e.id = any (p_event_ids) and e.organizer_id = v_user) <> cardinality(p_event_ids) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    select jsonb_build_object(
        'as_of', statement_timestamp() at time zone 'America/Argentina/Buenos_Aires',
        'events', jsonb_agg(jsonb_build_object(
            'event_id', r.id, 'title', r.title, 'event_state', r.state,
            'capacity', r.capacity, 'confirmed_count', r.confirmed,
            'available_spots', greatest(r.capacity::bigint - r.confirmed, 0::bigint),
            'occupancy_percent', 100::numeric * r.confirmed / nullif(r.capacity, 0),
            'capacity_usable', r.capacity > 0) order by r.ord))
    into v_result
    from (
        select e.id, e.title, e.capacity, ids.ord, count(p.id) as confirmed,
            case when e.archived_at is not null then 'archived'
                when e.cancelled_at is not null then 'cancelled'
                when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended'
                else 'open' end as state
        from unnest(p_event_ids) with ordinality as ids(id, ord)
        join public.events e on e.id = ids.id and e.organizer_id = v_user
        left join public.event_participations p on p.event_id = e.id
            and p.status = 'confirmed' and p.user_id <> e.organizer_id
        group by e.id, ids.ord
    ) r;
    return v_result;
end;
$$;

revoke all on function public.get_my_events_occupancy(uuid[]) from public, anon, authenticated;
grant execute on function public.get_my_events_occupancy(uuid[]) to authenticated;
comment on function public.get_my_events_occupancy(uuid[]) is
    'Owner-only batch of current confirmed registrations for 2..10 unique own events; all-or-nothing, same formula as get_my_event_occupancy.';
commit;
