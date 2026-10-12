-- R3 block 4. Prepared locally; remote application requires separate approval.
begin;

-- A controlled projection is needed: own-row RLS deliberately does not expose
-- other participants or full profiles. Authorization also runs for an empty list.
create function public.get_event_attendees(
    p_event_id uuid, p_status text default 'confirmed', p_search text default '', p_offset integer default 0
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if not exists (select 1 from public.events where id = p_event_id and organizer_id = auth.uid()) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if p_status is null or p_status not in ('confirmed', 'removed') or p_search is null
        or char_length(p_search) > 120 or p_offset is null or p_offset < 0 then
        raise exception 'invalid_attendees_query' using errcode = '22023';
    end if;
    return (
        with page as materialized (
            select p.id as participation_id, p.user_id, p.status, profile.display_name, profile.username,
                lower(profile.display_name) as sort_name
            from public.event_participations p join public.profiles profile on profile.id = p.user_id
            where p.event_id = p_event_id and p.status = p_status
                and strpos(lower(profile.display_name), lower(btrim(p_search))) > 0
            order by lower(profile.display_name), p.id limit 31 offset p_offset
        )
        select jsonb_build_object(
            'title', e.title, 'capacity', e.capacity,
            'event_state', case when e.archived_at is not null then 'archived'
                when e.cancelled_at is not null then 'cancelled'
                when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end,
            'confirmed_count', (select count(*) from public.event_participations where event_id = e.id and status = 'confirmed'),
            'removed_count', (select count(*) from public.event_participations where event_id = e.id and status = 'removed'),
            'has_more', (select count(*) > 30 from page),
            'attendees', coalesce((select jsonb_agg(to_jsonb(visible) - 'sort_name' order by sort_name, participation_id)
                from (select * from page order by sort_name, participation_id limit 30) visible), '[]'::jsonb)
        )
        from public.events e
        where e.id = p_event_id
    );
end;
$$;

-- Same event -> participation lock order as registration, withdrawal and chat.
-- Definer avoids granting general UPDATE or exposing unrelated participant rows.
create function public.remove_participant(p_event_id uuid, p_participation_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_status text;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if v_event.archived_at is not null or v_event.cancelled_at is not null
        or v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        raise exception 'event_closed' using errcode = 'P0001';
    end if;
    select status into v_status from public.event_participations
        where id = p_participation_id and event_id = p_event_id for update;
    if not found then raise exception 'attendee_unavailable' using errcode = 'P0001'; end if;
    if v_status = 'removed' then return; end if;
    if v_status <> 'confirmed' then raise exception 'attendee_not_confirmed' using errcode = 'P0001'; end if;
    update public.event_participations set status = 'removed' where id = p_participation_id;
    -- Existing trigger records exactly one organizer_removal with auth.uid().
    -- Any trigger failure rolls back the transition and occupancy change.
end;
$$;
revoke all on function public.get_event_attendees(uuid,text,text,integer), public.remove_participant(uuid,uuid) from public, anon, authenticated;
grant execute on function public.get_event_attendees(uuid,text,text,integer), public.remove_participant(uuid,uuid) to authenticated;
commit;
