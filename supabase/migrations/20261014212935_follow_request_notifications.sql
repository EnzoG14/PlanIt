-- Explicit B7 extension requested by the owner. Remote application is separate.
begin;

-- Runs inside follow_user's authorized transaction; no additional DEFINER
-- privilege or writable client surface. Generic content survives later blocks
-- without leaking names, avatars, actor IDs or withdrawn profile information.
create function planit_private.notify_follow_request() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
    if new.status <> 'pending' then return new; end if;
    if tg_op = 'UPDATE' then
        if old.status = 'pending' and old.request_version = new.request_version then
            return new;
        end if;
    end if;
    insert into public.notifications(id, recipient_id, type, title, body)
    values (new.request_version, new.followed_id, 'follow_request',
        'Nueva solicitud de seguimiento',
        'Recibiste una solicitud de seguimiento. Revisá tus solicitudes pendientes.');
    return new;
end;
$$;
revoke all on function planit_private.notify_follow_request() from public, anon, authenticated;

create trigger user_follows_notify_request
after insert or update of status, request_version on public.user_follows
for each row execute function planit_private.notify_follow_request();

-- Keep the R5 event/direct distinction and existing event/chat authorization.
-- This target is always the recipient's own inbox, even for a resolved request.
create or replace function public.get_notification_target(p_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
    select case
        when n.type = 'follow_request' and n.event_id is null and n.conversation_id is null
            then '/me/follow-requests'
        when n.conversation_id is not null then
            case when c.kind = 'event' then '/events/' || c.event_id::text || '/chat' end
        else '/events/' || e.id::text end
    from public.notifications n
    left join public.conversations c on c.id = n.conversation_id
    left join public.events e on e.id = n.event_id
    where n.id = p_id and n.recipient_id = (select auth.uid());
$$;
revoke all on function public.get_notification_target(uuid) from public, anon, authenticated;
grant execute on function public.get_notification_target(uuid) to authenticated;

-- notifications is already in supabase_realtime, with recipient-only SELECT RLS.
-- No backfill: this migration does not generate notices for historical requests.
commit;
