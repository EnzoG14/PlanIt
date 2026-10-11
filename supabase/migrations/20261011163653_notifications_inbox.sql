-- R2 block 4: inbox only. No producers, seeds, push or remote execution.
begin;
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_id uuid not null references public.profiles(id) on delete restrict,
    actor_id uuid references public.profiles(id) on delete restrict,
    event_id uuid references public.events(id) on delete restrict,
    conversation_id uuid references public.conversations(id) on delete restrict,
    type text not null check (char_length(type) between 1 and 60 and type ~ '[^[:space:]]'),
    title text not null check (char_length(title) between 1 and 160 and title ~ '[^[:space:]]'),
    body text check (char_length(body) <= 3000),
    read_at timestamp,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
);
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read_own on public.notifications for select to authenticated
    using (recipient_id = (select auth.uid()));
create policy notifications_mark_own on public.notifications for update to authenticated
    using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create index notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc, id desc);
create index notifications_actor_idx on public.notifications(actor_id) where actor_id is not null;
create index notifications_event_idx on public.notifications(event_id) where event_id is not null;
create index notifications_conversation_idx on public.notifications(conversation_id) where conversation_id is not null;

-- Even direct REST updates can only mark as read, never choose a date or undo it.
create function planit_private.stamp_notification_read() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
    new.read_at := coalesce(old.read_at, clock_timestamp() at time zone 'America/Argentina/Buenos_Aires');
    return new;
end;
$$;
revoke all on function planit_private.stamp_notification_read() from public, anon, authenticated;
create trigger notifications_stamp_read before update of read_at on public.notifications
    for each row execute function planit_private.stamp_notification_read();

-- The joins inherit existing event/chat RLS; a notification never grants access.
create function public.get_notification_target(p_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
    select case when n.conversation_id is not null then '/events/' || c.event_id::text || '/chat'
        else '/events/' || e.id::text end
    from public.notifications n
    left join public.conversations c on c.id = n.conversation_id
    left join public.events e on e.id = n.event_id
    where n.id = p_id and n.recipient_id = (select auth.uid());
$$;
create function public.get_notifications(p_before_at timestamp default null, p_before_id uuid default null)
returns table (id uuid, type text, title text, body text, read_at timestamp, created_at timestamp, target text)
language plpgsql stable security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_cursor' using errcode = '22023'; end if;
    return query select n.id, n.type, n.title, n.body, n.read_at, n.created_at, public.get_notification_target(n.id)
        from public.notifications n where n.recipient_id = (select auth.uid())
        and (p_before_at is null or (n.created_at, n.id) < (p_before_at, p_before_id))
        order by n.created_at desc, n.id desc limit 31;
end;
$$;
create function public.mark_notification_read(p_id uuid) returns timestamp
language plpgsql security invoker set search_path = '' as $$
declare v_read_at timestamp;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    update public.notifications set read_at = clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'
        where id = p_id and recipient_id = (select auth.uid()) returning read_at into v_read_at;
    if not found then raise exception 'notification_unavailable' using errcode = '42501'; end if;
    return v_read_at;
end;
$$;
revoke all on function public.get_notifications(timestamp,uuid), public.get_notification_target(uuid), public.mark_notification_read(uuid) from public, anon, authenticated;
grant execute on function public.get_notifications(timestamp,uuid), public.get_notification_target(uuid), public.mark_notification_read(uuid) to authenticated;
commit;
