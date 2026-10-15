begin;

-- RLS only exposes one's history. This owner-authorized aggregate intentionally
-- reads all event transitions without granting access to individual records.
create function public.get_my_event_participation_series(
    p_event_id uuid, p_from timestamp, p_to timestamp, p_bucket text
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_owner uuid;
    v_points jsonb;
begin
    if v_user is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    select e.organizer_id into v_owner from public.events e
    where e.id = p_event_id and e.organizer_id = v_user;
    if v_owner is null then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if p_from is null or p_to is null or not isfinite(p_from) or not isfinite(p_to)
        or p_from < timestamp '0001-01-01' or p_to > timestamp '9999-12-31'
        or p_from <> date_trunc('day', p_from) or p_to <> date_trunc('day', p_to)
        or p_from >= p_to or p_to - p_from > interval '366 days'
        or p_bucket is null or p_bucket not in ('day', 'week') then
        raise exception 'invalid_parameters' using errcode = '22023';
    end if;

    -- The interval predicate precedes bucketing: partial Mondays never include
    -- transitions outside [from,to). Week starts Monday in PostgreSQL.
    -- One grouped scan, no query per day. No stock reconstruction or profile read.
    with movements as (
        select date_trunc(p_bucket, h.created_at) as bucket_start,
            count(*) filter (where h.previous_status is null and h.new_status = 'confirmed') as new_confirmations,
            count(*) filter (where h.previous_status in ('cancelled', 'removed') and h.new_status = 'confirmed') as reconfirmations,
            count(*) filter (where h.previous_status = 'confirmed' and h.new_status in ('cancelled', 'removed')) as departures
        from public.event_participations p
        join public.participation_history h on h.participation_id = p.id
        where p.event_id = p_event_id and p.user_id <> v_owner
            and h.created_at >= p_from and h.created_at < p_to
        group by 1
    ), buckets as (
        select b as bucket_start from generate_series(
            date_trunc(p_bucket, p_from), p_to,
            case p_bucket when 'day' then interval '1 day' else interval '1 week' end
        ) b where b < p_to
    )
    select jsonb_agg(jsonb_build_object(
        'bucket_start', b.bucket_start,
        'new_confirmations', coalesce(m.new_confirmations, 0),
        'reconfirmations', coalesce(m.reconfirmations, 0),
        'departures', coalesce(m.departures, 0)
    ) order by b.bucket_start) into v_points
    from buckets b left join movements m using (bucket_start);

    return jsonb_build_object('event_id', p_event_id, 'from', p_from, 'to', p_to,
        'bucket', p_bucket, 'as_of', statement_timestamp() at time zone 'America/Argentina/Buenos_Aires',
        'points', v_points);
end;
$$;
revoke all on function public.get_my_event_participation_series(uuid,timestamp,timestamp,text) from public, anon, authenticated;
grant execute on function public.get_my_event_participation_series(uuid,timestamp,timestamp,text) to authenticated;
comment on function public.get_my_event_participation_series(uuid,timestamp,timestamp,text) is
    'Owner-only registration movements, Argentina wall time [from,to), max366 days; not occupancy or physical attendance.';
commit;
