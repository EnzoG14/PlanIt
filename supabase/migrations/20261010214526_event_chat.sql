-- R2 block 2. Pending remote approval. No Realtime publication changes.
begin;
create table public.conversations (
    id uuid primary key default gen_random_uuid(),
    kind text not null default 'event' check (kind = 'event'),
    event_id uuid not null unique references public.events(id) on delete restrict,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
);
alter table public.conversations enable row level security;
revoke all on public.conversations from public, anon, authenticated;
grant select on public.conversations to authenticated;
-- Direct conversations will require their own membership model in R5.
create function planit_private.can_read_event_chat(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (
        select 1 from public.events e where e.id = p_event_id and
        (e.organizer_id = auth.uid() or exists (select 1 from public.event_participations p
            where p.event_id = e.id and p.user_id = auth.uid() and p.status = 'confirmed'))
    );
$$;
revoke all on function planit_private.can_read_event_chat(uuid) from public, anon, authenticated;
grant execute on function planit_private.can_read_event_chat(uuid) to authenticated;
create policy conversations_read_member on public.conversations for select to authenticated
    using (planit_private.can_read_event_chat(event_id));

create table public.messages (
    id uuid primary key,
    conversation_id uuid not null references public.conversations(id) on delete restrict,
    sender_id uuid not null references public.profiles(id) on delete restrict,
    body text not null check (char_length(body) between 1 and 2000 and body ~ '[^[:space:]]'),
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
);
alter table public.messages enable row level security;
revoke all on public.messages from public, anon, authenticated;
grant select on public.messages to authenticated;
create policy messages_read_member on public.messages for select to authenticated
    using (exists (select 1 from public.conversations c where c.id = conversation_id));
create index messages_conversation_created_idx on public.messages(conversation_id, created_at desc, id desc);
create index messages_sender_idx on public.messages(sender_id);

create function planit_private.create_event_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    insert into public.conversations(event_id) values (new.id) on conflict (event_id) do nothing;
    return new;
end;
$$;
revoke all on function planit_private.create_event_conversation() from public, anon, authenticated;
create trigger events_create_conversation after insert on public.events
    for each row execute function planit_private.create_event_conversation();
insert into public.conversations(event_id) select id from public.events on conflict (event_id) do nothing;

-- Minimal authorized header, including server-derived state; no participant identities.
create function public.get_event_chat(p_event_id uuid)
returns table (conversation_id uuid, title text, event_state text)
language plpgsql security definer set search_path = '' as $$
begin
    if not planit_private.can_read_event_chat(p_event_id) then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    return query select c.id, e.title,
        case when e.archived_at is not null then 'archived' when e.cancelled_at is not null then 'cancelled'
        when e.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end
        from public.events e join public.conversations c on c.event_id = e.id where e.id = p_event_id;
end;
$$;
-- Definer only to project social sender names, never SELECT profiles for third parties.
create function public.get_event_chat_messages(p_event_id uuid, p_before_at timestamp default null, p_before_id uuid default null)
returns table (id uuid, sender_id uuid, body text, created_at timestamp, display_name text, username text)
language plpgsql security definer set search_path = '' as $$
begin
    if not planit_private.can_read_event_chat(p_event_id) then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_cursor'; end if;
    return query select m.id, m.sender_id, m.body, m.created_at, p.display_name, p.username
        from public.messages m join public.conversations c on c.id = m.conversation_id
        join public.profiles p on p.id = m.sender_id where c.event_id = p_event_id
        and (p_before_at is null or (m.created_at, m.id) < (p_before_at, p_before_id))
        order by m.created_at desc, m.id desc limit 51;
end;
$$;
-- No direct INSERT/UPDATE/DELETE grants: REST cannot bypass membership/state checks.
create function public.send_event_chat_message(p_event_id uuid, p_message_id uuid, p_body text) returns uuid
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
revoke all on function public.get_event_chat(uuid), public.get_event_chat_messages(uuid,timestamp,uuid), public.send_event_chat_message(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.get_event_chat(uuid), public.get_event_chat_messages(uuid,timestamp,uuid), public.send_event_chat_message(uuid,uuid,text) to authenticated;
commit;
