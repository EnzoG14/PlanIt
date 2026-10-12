-- R3 block 6. Proposed only; remote application requires separate authorization.
begin;
create table public.event_rejoin_requests (
    id uuid primary key default gen_random_uuid(),
    participation_id uuid not null references public.event_participations(id) on delete restrict,
    status text not null default 'pending' check (status in ('pending','approved','rejected')),
    requested_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    resolved_at timestamp,
    reviewed_by uuid references public.profiles(id) on delete restrict,
    check ((status = 'pending' and resolved_at is null and reviewed_by is null)
        or (status in ('approved','rejected') and resolved_at is not null and reviewed_by is not null)),
    check (resolved_at is null or resolved_at >= requested_at)
);
alter table public.event_rejoin_requests enable row level security;
revoke all on public.event_rejoin_requests from public, anon, authenticated;
grant select on public.event_rejoin_requests to authenticated;
create policy rejoin_requests_select_own on public.event_rejoin_requests for select to authenticated
    using (exists (select 1 from public.event_participations p where p.id = participation_id and p.user_id = (select auth.uid())));
create unique index rejoin_requests_one_pending_idx on public.event_rejoin_requests(participation_id) where status = 'pending';
create index rejoin_requests_participation_date_idx on public.event_rejoin_requests(participation_id, requested_at desc, id desc);
create index rejoin_requests_reviewer_idx on public.event_rejoin_requests(reviewed_by) where reviewed_by is not null;

-- Preserve the existing trigger: approvals record exactly one actual transition.
create or replace function planit_private.record_participation_history() returns trigger
language plpgsql set search_path = '' as $$
begin
    if TG_OP = 'INSERT' then
        insert into public.participation_history(participation_id, previous_status, new_status, changed_by, reason)
        values (new.id, null, new.status, auth.uid(),
            case new.status when 'confirmed' then 'registration' when 'cancelled' then 'voluntary_leave' else 'organizer_removal' end);
    elsif old.status is distinct from new.status then
        insert into public.participation_history(participation_id, previous_status, new_status, changed_by, reason)
        values (new.id, old.status, new.status, auth.uid(),
            case when old.status = 'removed' and new.status = 'confirmed' then 'rejoin_approval'
                when new.status = 'confirmed' then 'registration' when new.status = 'cancelled' then 'voluntary_leave' else 'organizer_removal' end);
    end if;
    return new;
end;
$$;

-- Definers are deliberate: no general mutations or access to other profiles.
create function public.get_my_rejoin_status(p_event_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_part public.event_participations%rowtype;
    v_request public.event_rejoin_requests%rowtype;
    v_next timestamp;
    v_now timestamp := statement_timestamp() at time zone 'America/Argentina/Buenos_Aires';
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    select * into v_event from public.events where id = p_event_id;
    select * into v_part from public.event_participations where event_id = p_event_id and user_id = auth.uid();
    if v_event.id is null or not (v_event.organizer_id = auth.uid() or v_part.id is not null
        or (v_event.visibility = 'public' and v_event.cancelled_at is null and v_event.archived_at is null)) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    select * into v_request from public.event_rejoin_requests where participation_id = v_part.id order by requested_at desc, id desc limit 1;
    if v_request.status = 'rejected' then v_next := v_request.resolved_at + interval '7 days'; end if;
    return jsonb_build_object('request_id', v_request.id, 'status', v_request.status,
        'requested_at', v_request.requested_at, 'resolved_at', v_request.resolved_at, 'next_eligible_at', v_next,
        'can_request', coalesce(v_part.status = 'removed' and v_event.organizer_id <> auth.uid()
            and v_event.cancelled_at is null and v_event.archived_at is null and v_event.ends_at > v_now
            and v_request.status is distinct from 'pending' and (v_next is null or v_next <= v_now), false));
end;
$$;

create function public.request_rejoin(p_event_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_part public.event_participations%rowtype;
    v_request public.event_rejoin_requests%rowtype;
    v_now timestamp;
    v_id uuid;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode = '40001'; end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
    select * into v_part from public.event_participations where event_id = p_event_id and user_id = auth.uid() for update;
    if not found or v_part.status <> 'removed' or v_event.organizer_id = auth.uid() then raise exception 'rejoin_not_removed' using errcode = 'P0001'; end if;
    -- The holder retains authorized detail access, including unlisted historical participation.
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_event.cancelled_at is not null or v_event.archived_at is not null or v_event.ends_at <= v_now then raise exception 'event_closed' using errcode = 'P0001'; end if;
    select * into v_request from public.event_rejoin_requests where participation_id = v_part.id order by requested_at desc, id desc limit 1 for update;
    if v_request.status = 'pending' then raise exception 'rejoin_already_pending' using errcode = 'P0001'; end if;
    if v_request.status = 'rejected' and v_request.resolved_at + interval '7 days' > v_now then raise exception 'rejoin_cooldown' using errcode = 'P0001'; end if;
    insert into public.event_rejoin_requests(participation_id, requested_at) values(v_part.id, v_now) returning id into v_id;
    return v_id;
end;
$$;

create function public.get_event_rejoin_requests(p_event_id uuid, p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if not exists (select 1 from public.events where id = p_event_id and organizer_id = auth.uid()) then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if p_offset is null or p_offset < 0 then raise exception 'invalid_rejoin_query' using errcode = '22023'; end if;
    return (
        with page as materialized (
            select r.id as request_id, r.participation_id, r.status, r.requested_at, profile.display_name, profile.username
            from public.event_rejoin_requests r join public.event_participations p on p.id = r.participation_id
            join public.profiles profile on profile.id = p.user_id
            where p.event_id = p_event_id and r.status = 'pending'
            order by r.requested_at desc, r.id desc limit 31 offset p_offset
        )
        select jsonb_build_object('title', e.title, 'capacity', e.capacity,
            'event_state', case when e.archived_at is not null then 'archived' when e.cancelled_at is not null then 'cancelled'
                when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end,
            'confirmed_count', (select count(*) from public.event_participations where event_id = e.id and status = 'confirmed'),
            'pending_count', (select count(*) from public.event_rejoin_requests r join public.event_participations p on p.id=r.participation_id where p.event_id=e.id and r.status='pending'),
            'has_more', (select count(*) > 30 from page),
            'requests', coalesce((select jsonb_agg(to_jsonb(visible) order by requested_at desc, request_id desc)
                from (select * from page order by requested_at desc, request_id desc limit 30) visible), '[]'::jsonb))
        from public.events e where e.id = p_event_id
    );
end;
$$;

create function public.resolve_rejoin(p_event_id uuid, p_request_id uuid, p_decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_part public.event_participations%rowtype;
    v_request public.event_rejoin_requests%rowtype;
    v_now timestamp;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode = '40001'; end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if p_decision is null or p_decision not in ('approved','rejected') then raise exception 'invalid_rejoin_decision' using errcode = '22023'; end if;
    select p.* into v_part from public.event_participations p join public.event_rejoin_requests r on r.participation_id = p.id
        where r.id = p_request_id and p.event_id = p_event_id for update of p;
    if not found then raise exception 'rejoin_unavailable' using errcode = 'P0001'; end if;
    select * into v_request from public.event_rejoin_requests where id = p_request_id for update;
    if v_request.status <> 'pending' then raise exception 'rejoin_already_resolved' using errcode = 'P0001'; end if;
    if v_part.status <> 'removed' then raise exception 'rejoin_not_removed' using errcode = 'P0001'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if p_decision = 'approved' then
        if v_event.cancelled_at is not null or v_event.archived_at is not null or v_event.ends_at <= v_now then raise exception 'event_closed' using errcode = 'P0001'; end if;
        if (select count(*) from public.event_participations where event_id=p_event_id and status='confirmed') >= v_event.capacity then raise exception 'event_full' using errcode = 'P0001'; end if;
        update public.event_participations set status='confirmed' where id=v_part.id;
    end if;
    -- Human-approved exception: rejection is allowed after closure; no transition is fabricated.
    update public.event_rejoin_requests set status=p_decision, resolved_at=v_now, reviewed_by=auth.uid() where id=p_request_id;
end;
$$;
revoke all on function public.get_my_rejoin_status(uuid), public.get_event_rejoin_requests(uuid,integer), public.request_rejoin(uuid), public.resolve_rejoin(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.get_my_rejoin_status(uuid), public.get_event_rejoin_requests(uuid,integer), public.request_rejoin(uuid), public.resolve_rejoin(uuid,uuid,text) to authenticated;
create or replace function public.get_event_attendees(
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
            'pending_count', (select count(*) from public.event_rejoin_requests r join public.event_participations p on p.id = r.participation_id where p.event_id = e.id and r.status = 'pending'),
            'has_more', (select count(*) > 30 from page),
            'attendees', coalesce((select jsonb_agg(to_jsonb(visible) - 'sort_name' order by sort_name, participation_id)
                from (select * from page order by sort_name, participation_id limit 30) visible), '[]'::jsonb)
        )
        from public.events e
        where e.id = p_event_id
    );
end;
$$;

-- Exact read for reconciliation of a lost response; absence from a page is not proof of approval.
create function public.get_event_rejoin_resolution(p_event_id uuid, p_request_id uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_status text;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if not exists (select 1 from public.events where id=p_event_id and organizer_id=auth.uid()) then raise exception 'event_unavailable' using errcode='42501'; end if;
    select r.status into v_status from public.event_rejoin_requests r join public.event_participations p on p.id=r.participation_id where r.id=p_request_id and p.event_id=p_event_id;
    if not found then raise exception 'rejoin_unavailable' using errcode='P0001'; end if;
    return v_status;
end;
$$;
revoke all on function public.get_event_rejoin_resolution(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_event_rejoin_resolution(uuid,uuid) to authenticated;
commit;
