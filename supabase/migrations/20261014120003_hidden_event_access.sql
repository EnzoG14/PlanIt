-- R4 block 5. Local only; no remote application authorized.
-- No link generation/redemption, visibility RPC or access-management UX yet.
begin;
create table public.event_access_links (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete restrict,
    created_by uuid not null references public.profiles(id) on delete restrict,
    token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    revoked_at timestamp,
    unique (id, event_id),
    check (revoked_at is null or revoked_at >= created_at)
);
alter table public.event_access_links enable row level security;
revoke all on public.event_access_links from public, anon, authenticated;
-- No client SELECT, including organizers: never expose hashes through REST.
create unique index event_access_links_one_active_idx on public.event_access_links(event_id) where revoked_at is null;
create index event_access_links_event_idx on public.event_access_links(event_id);
create index event_access_links_creator_idx on public.event_access_links(created_by);

create table public.event_access_grants (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete restrict,
    user_id uuid not null references public.profiles(id) on delete restrict,
    source_link_id uuid,
    status text not null default 'active' check (status in ('active','revoked')),
    granted_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    revoked_at timestamp,
    restored_at timestamp,
    updated_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    unique (event_id, user_id),
    foreign key (source_link_id, event_id) references public.event_access_links(id, event_id) on delete restrict,
    check ((status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null)),
    check (revoked_at is null or revoked_at >= granted_at),
    check (restored_at is null or restored_at >= granted_at),
    check (updated_at >= granted_at)
);
alter table public.event_access_grants enable row level security;
revoke all on public.event_access_grants from public, anon, authenticated;
grant select on public.event_access_grants to authenticated;
create index event_access_grants_user_idx on public.event_access_grants(user_id, event_id);
create index event_access_grants_link_idx on public.event_access_grants(source_link_id, event_id) where source_link_id is not null;
create trigger event_access_grants_touch_updated_at before update on public.event_access_grants
    for each row execute function planit_private.touch_updated_at();
create policy event_access_grants_select_own on public.event_access_grants for select to authenticated
    using (user_id = (select auth.uid()) or exists (
        select 1 from public.events e where e.id = event_id and e.organizer_id = (select auth.uid())
    ));

-- The single detail predicate bypasses RLS only for these indexed lookups,
-- avoiding events -> grants -> events recursion; caller cannot supply identity.
create function planit_private.can_view_event(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select (select auth.uid()) is not null and exists (
        select 1 from public.events e where e.id = p_event_id and (
            e.organizer_id = (select auth.uid())
            or (e.visibility = 'unlisted' and exists (
                select 1 from public.event_access_grants g where g.event_id = e.id
                    and g.user_id = (select auth.uid()) and g.status = 'active'
            ))
            or (e.visibility = 'public' and (
                (e.cancelled_at is null and e.archived_at is null)
                or exists (select 1 from public.event_participations p
                    where p.event_id = e.id and p.user_id = (select auth.uid()))
            ))
        )
    );
$$;
revoke all on function planit_private.can_view_event(uuid) from public, anon, authenticated;
grant execute on function planit_private.can_view_event(uuid) to authenticated;
drop policy events_select_authenticated on public.events;
drop policy events_select_participating on public.events;
create policy events_select_authenticated on public.events for select to authenticated
    -- INSERT RETURNING must authorize its own NEW row, which a STABLE table
    -- lookup cannot see yet in the command snapshot. Grants still use one helper.
    using (organizer_id = (select auth.uid()) or planit_private.can_view_event(id));
-- event_images -> events -> predicate; files -> visible association OR uploader;
-- storage.objects -> visible file OR owner. These existing policies inherit it.

-- Internal invariant, not a visibility endpoint: any future controlled UPDATE
-- must preserve confirmed access atomically and must never resurrect revoked.
create function planit_private.protect_event_visibility() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if old.visibility = new.visibility then return new; end if;
    if auth.uid() is null or old.organizer_id <> auth.uid() then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    -- UPDATE already holds event lock. Same event -> participation -> grant order.
    if new.visibility = 'unlisted' then
        perform 1 from public.event_participations where event_id = new.id and status = 'confirmed' order by id for update;
        if exists (select 1 from public.event_participations p join public.event_access_grants g
            on g.event_id = p.event_id and g.user_id = p.user_id
            where p.event_id = new.id and p.status = 'confirmed' and g.status = 'revoked') then
            raise exception 'confirmed_access_revoked' using errcode = 'P0001';
        end if;
        insert into public.event_access_grants(event_id,user_id)
            select new.id,p.user_id from public.event_participations p where p.event_id = new.id and p.status = 'confirmed'
            on conflict (event_id,user_id) do nothing;
    else
        -- D12: invalidate only links, never individual grants or participation.
        update public.event_access_links set revoked_at = clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'
            where event_id = new.id and revoked_at is null;
    end if;
    return new;
end;
$$;
revoke all on function planit_private.protect_event_visibility() from public, anon, authenticated;
create trigger events_protect_visibility before update of visibility on public.events
    for each row execute function planit_private.protect_event_visibility();

create or replace function planit_private.can_read_event_chat(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select planit_private.can_view_event(p_event_id) and exists (
        select 1 from public.events e where e.id = p_event_id and
        (e.organizer_id = auth.uid() or exists (select 1 from public.event_participations p
            where p.event_id = e.id and p.user_id = auth.uid() and p.status = 'confirmed'))
    );
$$;
create or replace function public.get_event_participation_summary(p_event_id uuid)
returns table (confirmed_count bigint, capacity integer, available_spots bigint, own_status text, is_organizer boolean, event_state text)
language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    return query
    select counts.total, e.capacity, greatest(e.capacity - counts.total, 0::bigint), own.status,
        e.organizer_id = auth.uid(),
        case when e.archived_at is not null then 'archived' when e.cancelled_at is not null then 'cancelled'
            when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end
    from public.events e
    left join public.event_participations own on own.event_id = e.id and own.user_id = auth.uid()
    cross join lateral (select count(*) as total from public.event_participations p where p.event_id = e.id and p.status = 'confirmed') counts
    where e.id = p_event_id and planit_private.can_view_event(e.id);
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
end;
$$;

create or replace function public.get_event_organizer(p_event_id uuid)
returns table (display_name text, username text)
language sql stable security definer set search_path = '' as $$
    select profile.display_name, profile.username
    from public.events event
    join public.profiles profile on profile.id = event.organizer_id
    where (select auth.uid()) is not null
        and event.id = p_event_id
        and planit_private.can_view_event(event.id);
$$;

create or replace function public.register_for_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_event public.events%rowtype;
    v_status text;
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    -- Counts after a waited lock need a fresh snapshot. Supabase/PostgREST uses
    -- READ COMMITTED; reject frozen snapshots rather than risk oversubscription.
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    -- Always event first, participation second. Subsequent statements see committed
    -- competitors under READ COMMITTED.
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if v_event.visibility = 'unlisted' and not planit_private.can_view_event(p_event_id) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if v_event.organizer_id = v_user then raise exception 'organizer_cannot_register' using errcode = 'P0001'; end if;
    if v_event.archived_at is not null or v_event.cancelled_at is not null then raise exception 'event_cancelled' using errcode = 'P0001'; end if;
    if v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then raise exception 'event_ended' using errcode = 'P0001'; end if;
    select status into v_status from public.event_participations where event_id = p_event_id and user_id = v_user;
    if v_status = 'removed' then raise exception 'rejoin_requires_approval' using errcode = 'P0001'; end if;
    if v_status = 'confirmed' then return; end if;
    if (select count(*) from public.event_participations where event_id = p_event_id and status = 'confirmed') >= v_event.capacity then
        raise exception 'event_full' using errcode = 'P0001';
    end if;
    if v_status = 'cancelled' then
        update public.event_participations set status = 'confirmed' where event_id = p_event_id and user_id = v_user;
    else
        insert into public.event_participations(event_id, user_id, status) values (p_event_id, v_user, 'confirmed');
    end if;
end;
$$;

create or replace function public.send_event_chat_message(p_event_id uuid, p_message_id uuid, p_body text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_conversation uuid;
    v_existing public.messages%rowtype;
    -- ASCII and Unicode whitespace (including non-breaking spaces) are not text.
    v_body text := btrim(p_body, E' \t\n\r\f\v' || U&'\0085\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode = '40001'; end if;
    if p_message_id is null or v_body is null or char_length(v_body) not between 1 and 2000 or v_body !~ '[^[:space:]]' then
        raise exception 'invalid_message';
    end if;
    -- Same lock order as register/leave; locks state updates until send finishes.
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    -- Lock membership too, including future removal operations that update its row.
    if v_event.organizer_id <> auth.uid() then
        perform 1 from public.event_participations where event_id = p_event_id and user_id = auth.uid() and status = 'confirmed' for update;
        if not found then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    end if;
    if not planit_private.can_read_event_chat(p_event_id) then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    select id into v_conversation from public.conversations where event_id = p_event_id;
    select * into v_existing from public.messages where id = p_message_id;
    if found then
        if v_existing.sender_id = auth.uid() and v_existing.conversation_id = v_conversation and v_existing.body = v_body then return v_existing.id; end if;
        raise exception 'message_id_conflict';
    end if;
    if v_event.cancelled_at is not null or v_event.archived_at is not null
        or v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then raise exception 'chat_read_only'; end if;
    insert into public.messages(id, conversation_id, sender_id, body) values (p_message_id, v_conversation, auth.uid(), v_body);
    return p_message_id;
end;
$$;

create or replace function public.get_my_rejoin_status(p_event_id uuid) returns jsonb
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
    if not planit_private.can_view_event(p_event_id) then
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

create or replace function public.request_rejoin(p_event_id uuid) returns uuid
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
    if not planit_private.can_view_event(p_event_id) then raise exception 'event_unavailable' using errcode = '42501'; end if;
    select * into v_part from public.event_participations where event_id = p_event_id and user_id = auth.uid() for update;
    if not found or v_part.status <> 'removed' or v_event.organizer_id = auth.uid() then raise exception 'rejoin_not_removed' using errcode = 'P0001'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_event.cancelled_at is not null or v_event.archived_at is not null or v_event.ends_at <= v_now then raise exception 'event_closed' using errcode = 'P0001'; end if;
    select * into v_request from public.event_rejoin_requests where participation_id = v_part.id order by requested_at desc, id desc limit 1 for update;
    if v_request.status = 'pending' then raise exception 'rejoin_already_pending' using errcode = 'P0001'; end if;
    if v_request.status = 'rejected' and v_request.resolved_at + interval '7 days' > v_now then raise exception 'rejoin_cooldown' using errcode = 'P0001'; end if;
    insert into public.event_rejoin_requests(participation_id, requested_at) values(v_part.id, v_now) returning id into v_id;
    return v_id;
end;
$$;

create or replace function public.resolve_rejoin(p_event_id uuid, p_request_id uuid, p_decision text) returns void
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
        if v_event.visibility = 'unlisted' and not exists (select 1 from public.event_access_grants g
            where g.event_id = p_event_id and g.user_id = v_part.user_id and g.status = 'active') then
            raise exception 'event_access_required' using errcode = '42501';
        end if;
        if v_event.cancelled_at is not null or v_event.archived_at is not null or v_event.ends_at <= v_now then raise exception 'event_closed' using errcode = 'P0001'; end if;
        if (select count(*) from public.event_participations where event_id=p_event_id and status='confirmed') >= v_event.capacity then raise exception 'event_full' using errcode = 'P0001'; end if;
        update public.event_participations set status='confirmed' where id=v_part.id;
    end if;
    -- Human-approved exception: rejection is allowed after closure; no transition is fabricated.
    update public.event_rejoin_requests set status=p_decision, resolved_at=v_now, reviewed_by=auth.uid() where id=p_request_id;
end;
$$;

-- No hidden-event existence oracle through the withdrawal endpoint either.
create or replace function public.leave_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    perform 1 from public.events where id = p_event_id for update;
    if not found or not planit_private.can_view_event(p_event_id) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if not exists (select 1 from public.event_participations where event_id = p_event_id and user_id = v_user) then
        raise exception 'not_participating' using errcode = 'P0001';
    end if;
    update public.event_participations set status = 'cancelled'
        where event_id = p_event_id and user_id = v_user and status = 'confirmed';
end;
$$;

-- CREATE OR REPLACE preserves existing signatures/ACLs; restate least privilege.
revoke all on function public.get_event_participation_summary(uuid), public.get_event_organizer(uuid),
    public.register_for_event(uuid), public.leave_event(uuid), public.send_event_chat_message(uuid,uuid,text),
    public.get_my_rejoin_status(uuid), public.request_rejoin(uuid), public.resolve_rejoin(uuid,uuid,text)
    from public, anon, authenticated;
grant execute on function public.get_event_participation_summary(uuid), public.get_event_organizer(uuid),
    public.register_for_event(uuid), public.leave_event(uuid), public.send_event_chat_message(uuid,uuid,text),
    public.get_my_rejoin_status(uuid), public.request_rejoin(uuid), public.resolve_rejoin(uuid,uuid,text)
    to authenticated;
commit;
