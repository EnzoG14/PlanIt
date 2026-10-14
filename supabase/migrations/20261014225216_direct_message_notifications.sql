-- B8 extension explicitly requested by the owner; remote application separate.
begin;

-- Executes inside send_direct_message's authorized transaction. A retry of an
-- existing message performs no INSERT and therefore generates no second notice.
-- Generic content remains safe if the participants later block each other.
create function planit_private.notify_direct_message() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare v_recipient uuid;
begin
    select case when c.user_low_id = new.sender_id then c.user_high_id else c.user_low_id end
        into v_recipient from public.conversations c
        where c.id = new.conversation_id and c.kind = 'direct'
            and new.sender_id in (c.user_low_id, c.user_high_id);
    if not found then return new; end if;
    insert into public.notifications(id, recipient_id, conversation_id, type, title, body)
    values (new.id, v_recipient, new.conversation_id, 'direct_message',
        'Nuevo mensaje privado', 'Recibiste un mensaje privado. Abrí la conversación para leerlo.');
    return new;
end;
$$;
revoke all on function planit_private.notify_direct_message() from public, anon, authenticated;
create trigger messages_notify_direct_message after insert on public.messages
    for each row execute function planit_private.notify_direct_message();

-- INVOKER joins retain conversation membership RLS; an arbitrary notification
-- cannot grant access. Historical DM stays readable while blocked by contract.
create or replace function public.get_notification_target(p_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
    select case
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
revoke all on function public.get_notification_target(uuid) from public, anon, authenticated;
grant execute on function public.get_notification_target(uuid) to authenticated;

-- Existing notifications RLS/publication/counter suffice. No historical backfill.
commit;
