begin;

-- RLS exposes only one's participation rows. A definer aggregate is necessary
-- to count the whole event without granting access to other people's rows.
create function public.get_my_event_occupancy(p_event_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_result jsonb;
begin
    if v_user is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    -- Ownership is part of the aggregate source, including zero-participant events.
    -- One statement/snapshot supplies both the event and its current counts.
    select jsonb_build_object(
        'event_id', e.id, 'title', e.title,
        'event_state', case when e.archived_at is not null then 'archived'
            when e.cancelled_at is not null then 'cancelled'
            when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended'
            else 'open' end,
        'as_of', statement_timestamp() at time zone 'America/Argentina/Buenos_Aires',
        'capacity', e.capacity, 'confirmed_count', count(p.id),
        'available_spots', greatest(e.capacity::bigint - count(p.id), 0::bigint),
        'occupancy_percent', 100::numeric * count(p.id) / nullif(e.capacity, 0),
        'capacity_usable', e.capacity > 0
    ) into v_result
    from public.events e
    left join public.event_participations p on p.event_id = e.id
        and p.status = 'confirmed' and p.user_id <> e.organizer_id
    where e.id = p_event_id and e.organizer_id = v_user
    group by e.id;
    if v_result is null then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    return v_result;
end;
$$;

revoke all on function public.get_my_event_occupancy(uuid) from public, anon, authenticated;
grant execute on function public.get_my_event_occupancy(uuid) to authenticated;
comment on function public.get_my_event_occupancy(uuid) is
    'Owner-only current confirmed registrations; Argentina wall time, no historical occupancy or check-in.';
commit;
