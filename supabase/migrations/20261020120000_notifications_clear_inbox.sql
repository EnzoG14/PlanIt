-- Persistent inbox clearing preserves notification and push-job history.
begin;
alter table public.notifications add column dismissed_at timestamp without time zone;
-- Existing SELECT/UPDATE policies restrict every operation to auth.uid().
-- Column-scoped privileges prevent changing recipient, content or targets.
grant update (dismissed_at) on public.notifications to authenticated;
create function planit_private.stamp_notification_dismissed() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
    new.dismissed_at := coalesce(old.dismissed_at, clock_timestamp() at time zone 'America/Argentina/Buenos_Aires');
    new.read_at := coalesce(old.read_at, new.dismissed_at);
    return new;
end;
$$;
revoke all on function planit_private.stamp_notification_dismissed() from public, anon, authenticated;
create trigger notifications_stamp_dismissed before update of dismissed_at on public.notifications
    for each row execute function planit_private.stamp_notification_dismissed();

create function public.clear_notifications() returns void
language plpgsql security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    update public.notifications set dismissed_at = clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'
        where recipient_id = (select auth.uid()) and dismissed_at is null;
end;
$$;
revoke all on function public.clear_notifications() from public, anon, authenticated;
grant execute on function public.clear_notifications() to authenticated;

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
    where n.dismissed_at is null and n.id = p_id and n.recipient_id = (select auth.uid());
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
        where n.dismissed_at is null and n.recipient_id = (select auth.uid())
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
        where n.dismissed_at is null and n.id = any(p_ids) and n.recipient_id = (select auth.uid())
        order by n.created_at desc, n.id desc;
end;
$$;


create index notifications_visible_recipient_created_idx
    on public.notifications(recipient_id, created_at desc, id desc) where dismissed_at is null;
-- A queued Push must recheck whether the notice is still in the inbox.
create or replace function public.get_push_job_delivery(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    v_job planit_private.push_jobs%rowtype; v_sub public.push_subscriptions%rowtype;
    v_notice public.notifications%rowtype; v_conv public.conversations%rowtype;
    v_title text := 'Nuevo aviso en PlanIt'; v_body text := 'Abrí PlanIt para consultar tus notificaciones.';
    v_target text := '/notifications'; v_preview boolean; v_name text; v_text text; v_peer uuid; v_now timestamp;
begin
    select * into v_job from planit_private.push_jobs where notification_id=p_notification_id and subscription_id=p_subscription_id for update;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if not found or v_job.state<>'processing' or v_job.lease_token is distinct from p_lease_token
        or v_job.lease_until<=v_now then return null; end if;
    select * into v_sub from public.push_subscriptions where id=p_subscription_id;
    select * into v_notice from public.notifications where id=p_notification_id;
    if v_job.expires_at<=v_now or v_sub.disabled_at is not null or v_sub.id is null
        or v_notice.id is null or v_notice.dismissed_at is not null or v_sub.user_id is distinct from v_notice.recipient_id then
        update planit_private.push_jobs set state='discarded',finished_at=v_now,lease_token=null,lease_until=null,last_error_code='unavailable'
        where notification_id=p_notification_id and subscription_id=p_subscription_id;
        return null;
    end if;
    -- Fail closed on missing preference. B9 creates it during explicit opt-in.
    select coalesce((select show_previews from public.push_preferences where user_id=v_notice.recipient_id),false) into v_preview;
    if v_notice.type='direct_message' then
        select * into v_conv from public.conversations where id=v_notice.conversation_id and kind='direct'
            and v_notice.recipient_id in (user_low_id,user_high_id);
        if found then
            v_peer := case when v_conv.user_low_id=v_notice.recipient_id then v_conv.user_high_id else v_conv.user_low_id end;
            if not exists(select 1 from public.user_blocks where
                (blocker_id=v_peer and blocked_id=v_notice.recipient_id) or (blocker_id=v_notice.recipient_id and blocked_id=v_peer)) then
                v_target := '/messages/' || v_conv.id::text;
                if v_preview then
                    select p.display_name,m.body into v_name,v_text from public.messages m
                    join public.profiles p on p.id=m.sender_id
                    where m.id=v_notice.id and m.conversation_id=v_conv.id and m.sender_id=v_peer;
                    if found and nullif(btrim(v_name),'') is not null and nullif(btrim(v_text),'') is not null then
                        v_title := 'Mensaje de ' || v_name; v_body := v_text;
                    end if;
                end if;
            end if;
        end if;
    elsif v_notice.type='follow_request' and v_notice.event_id is null and v_notice.conversation_id is null then
        v_target := '/me/follow-requests';
        if v_preview then v_title := 'Nueva solicitud de seguimiento'; v_body := 'Revisá tus solicitudes pendientes en PlanIt.'; end if;
    elsif v_notice.type='event_full' and v_notice.conversation_id is null then
        select title into v_name from public.events where id=v_notice.event_id
            and organizer_id=v_notice.recipient_id and archived_at is null;
        if found then
            v_target := '/events/' || v_notice.event_id::text;
            if v_preview then v_title := 'Cupo completo'; v_body := v_name || ' alcanzó su cupo máximo.'; end if;
        end if;
    end if;
    update planit_private.push_jobs set delivery_subscription_updated_at=v_sub.updated_at
        where notification_id=p_notification_id and subscription_id=p_subscription_id;
    return jsonb_build_object('endpoint',v_sub.endpoint,'p256dh',v_sub.p256dh,'auth',v_sub.auth,
        'ttl',greatest(0,floor(extract(epoch from (v_job.expires_at-v_now)))),
        'payload',jsonb_build_object('version',1,'notification_id',v_notice.id,'recipient_id',v_notice.recipient_id,
            'title',v_title,'body',v_body,'target',v_target));
end;
$$;
commit;
