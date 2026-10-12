-- R3 block 5. Local migration; remote application requires separate approval.
begin;

-- Controlled writes: clients keep no generic UPDATE/DELETE privilege on events.
create function public.cancel_event(p_event_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if v_event.archived_at is not null then raise exception 'event_archived' using errcode = 'P0001'; end if;
    if v_event.cancelled_at is not null then return v_event.id; end if;
    if v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        raise exception 'event_ended' using errcode = 'P0001';
    end if;
    update public.events set cancelled_at = (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        where id = v_event.id;
    return v_event.id;
end;
$$;

create function public.archive_event(p_event_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_now timestamp;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if v_event.archived_at is not null then return v_event.id; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    -- Cancellation precedes archive in this transaction. Any later failure rolls
    -- both writes back; registrations and chat share this event-row lock.
    if v_event.cancelled_at is null and v_event.ends_at > v_now then
        update public.events set cancelled_at = v_now where id = v_event.id;
    end if;
    update public.events set archived_at = v_now where id = v_event.id;
    return v_event.id;
end;
$$;

-- Read-only source capability, authorized even for public events belonging to
-- someone else. No dates, photos, closure state or related rows are projected.
create function public.get_event_duplicate_source(p_event_id uuid)
returns table (title text, description text, category_id uuid, location_name text,
    address text, latitude double precision, longitude double precision, capacity integer)
language plpgsql stable security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    return query select e.title, e.description, e.category_id, e.location_name,
        e.address, e.latitude, e.longitude, e.capacity
        from public.events e where e.id = p_event_id and e.organizer_id = auth.uid();
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
end;
$$;

revoke all on function public.cancel_event(uuid), public.archive_event(uuid),
    public.get_event_duplicate_source(uuid) from public, anon, authenticated;
grant execute on function public.cancel_event(uuid), public.archive_event(uuid),
    public.get_event_duplicate_source(uuid) to authenticated;
commit;
