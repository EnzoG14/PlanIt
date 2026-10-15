-- R6 B7: current, authorized event names; notification text never grants access.
begin;

create or replace function public.get_notification_target(p_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
    select case
        when n.type = 'event_full' then
            case when n.conversation_id is null and e.organizer_id = (select auth.uid())
                and e.archived_at is null then '/events/' || e.id::text end
        when n.type = 'follow_request' and n.event_id is null and n.conversation_id is null
            then '/me/follow-requests'
        when n.conversation_id is not null then
            case when c.kind = 'event' then '/events/' || c.event_id::text || '/chat'
                when c.kind = 'direct' and n.type = 'direct_message' then '/messages/' || c.id::text end
        else '/events/' || e.id::text end
    from public.notifications n
    left join public.conversations c on c.id = n.conversation_id
    left join public.events e on e.id = n.event_id
    where n.id = p_id and n.recipient_id = (select auth.uid());
$$;

-- Keep the wire shape and historical producer unchanged. Both query paths use
-- the same current title, including notices created before this migration.
create or replace function public.get_notifications(p_before_at timestamp default null, p_before_id uuid default null)
returns table (id uuid, type text, title text, body text, read_at timestamp, created_at timestamp, target text)
language plpgsql stable security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_cursor' using errcode = '22023'; end if;
    return query select n.id, n.type,
        case when n.type = 'event_full' then coalesce(e.title, 'Cupo completo') else n.title end,
        n.body, n.read_at, n.created_at, public.get_notification_target(n.id)
        from public.notifications n
        left join public.events e on n.type = 'event_full' and n.conversation_id is null
            and e.id = n.event_id and e.organizer_id = (select auth.uid()) and e.archived_at is null
        where n.recipient_id = (select auth.uid())
        and (p_before_at is null or (n.created_at, n.id) < (p_before_at, p_before_id))
        order by n.created_at desc, n.id desc limit 31;
end;
$$;

create or replace function public.get_notification_changes(p_ids uuid[])
returns table (id uuid, type text, title text, body text, read_at timestamp, created_at timestamp, target text)
language plpgsql stable security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if p_ids is null or cardinality(p_ids) > 100 then raise exception 'invalid_ids' using errcode = '22023'; end if;
    return query select n.id, n.type,
        case when n.type = 'event_full' then coalesce(e.title, 'Cupo completo') else n.title end,
        n.body, n.read_at, n.created_at, public.get_notification_target(n.id)
        from public.notifications n
        left join public.events e on n.type = 'event_full' and n.conversation_id is null
            and e.id = n.event_id and e.organizer_id = (select auth.uid()) and e.archived_at is null
        where n.id = any(p_ids) and n.recipient_id = (select auth.uid())
        order by n.created_at desc, n.id desc;
end;
$$;

revoke all on function public.get_notification_target(uuid), public.get_notifications(timestamp,uuid),
    public.get_notification_changes(uuid[]) from public, anon, authenticated;
grant execute on function public.get_notification_target(uuid), public.get_notifications(timestamp,uuid),
    public.get_notification_changes(uuid[]) to authenticated;

commit;
