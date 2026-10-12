-- R3 block 2. Local migration only; remote application requires authorization.
begin;

-- Definer is needed to lock events without granting client UPDATE and to count
-- all confirmed participations without exposing other users' rows through RLS.
create function public.update_event(
    p_event_id uuid, p_title text, p_description text, p_starts_at timestamp,
    p_ends_at timestamp, p_category_id uuid, p_capacity integer, p_address text,
    p_latitude double precision, p_longitude double precision, p_location_name text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_event public.events%rowtype;
    v_now timestamp;
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    -- Same lock as registration/leave. Count AFTER lock using a fresh snapshot.
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if v_event.organizer_id <> v_user then raise exception 'not_event_organizer' using errcode = '42501'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_event.cancelled_at is not null or v_event.archived_at is not null or v_event.starts_at <= v_now then
        raise exception 'event_not_editable' using errcode = 'P0001';
    end if;
    if p_starts_at is null or p_ends_at is null or not isfinite(p_starts_at) or not isfinite(p_ends_at)
        or p_starts_at <= v_now then raise exception 'start_not_future' using errcode = 'P0001'; end if;
    if p_ends_at <= p_starts_at then raise exception 'end_before_start' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.categories where id = p_category_id and is_active) then
        raise exception 'category_inactive' using errcode = 'P0001';
    end if;
    if p_capacity is null or p_capacity < 1 then raise exception 'invalid_capacity' using errcode = '23514'; end if;
    if p_capacity < (select count(*) from public.event_participations where event_id = p_event_id and status = 'confirmed') then
        raise exception 'capacity_below_confirmed' using errcode = 'P0001';
    end if;
    -- Existing NOT NULL/CHECK/FK constraints validate remaining content atomically.
    update public.events set title = btrim(p_title), description = btrim(p_description),
        starts_at = p_starts_at, ends_at = p_ends_at, category_id = p_category_id,
        capacity = p_capacity, address = btrim(p_address), latitude = p_latitude,
        longitude = p_longitude, location_name = nullif(btrim(p_location_name), '')
    where id = p_event_id;
    return p_event_id;
end;
$$;
revoke all on function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text) from public, anon, authenticated;
grant execute on function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text) to authenticated;
comment on function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text) is
    'R3: organizer-only editing before original start, event lock + confirmed count, no direct UPDATE grants.';
commit;
