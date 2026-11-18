begin;

alter table public.notifications add column rejoin_request_id uuid
    references public.event_rejoin_requests(id) on delete restrict;
create unique index notifications_rejoin_transition_idx
    on public.notifications(rejoin_request_id, type) where rejoin_request_id is not null;

-- The existing RPCs hold the event lock and write the transition and its notice atomically.
create function planit_private.notify_rejoin_transition() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
    v_recipient uuid;
    v_event_id uuid;
    v_type text;
    v_title text;
    v_body text;
begin
    if tg_op = 'INSERT' and new.status = 'pending' then
        v_type := 'rejoin_requested';
        v_title := 'Nueva solicitud de reincorporación';
        v_body := 'Una persona solicitó volver a participar.';
    elsif tg_op = 'UPDATE' and old.status = 'pending' then
        if new.status = 'approved' then
            v_type := 'rejoin_approved';
            v_title := 'Reincorporación aprobada';
            v_body := 'Se confirmó tu inscripción al evento.';
        elsif new.status = 'rejected' then
            v_type := 'rejoin_rejected';
            v_title := 'Reincorporación rechazada';
            v_body := 'El organizador rechazó tu solicitud para volver al evento.';
        end if;
    end if;
    if v_type is null then return new; end if;

    select e.id, case when v_type = 'rejoin_requested' then e.organizer_id else p.user_id end
        into v_event_id, v_recipient
    from public.event_participations p join public.events e on e.id = p.event_id
    where p.id = new.participation_id;

    insert into public.notifications(recipient_id, event_id, rejoin_request_id, type, title, body)
        values (v_recipient, v_event_id, new.id, v_type, v_title, v_body)
        on conflict (rejoin_request_id, type) where rejoin_request_id is not null do nothing;
    return new;
end;
$$;
revoke all on function planit_private.notify_rejoin_transition() from public, anon, authenticated, service_role;
create trigger rejoin_requests_notify_transition after insert or update of status on public.event_rejoin_requests
    for each row execute function planit_private.notify_rejoin_transition();

create function planit_private.notify_participation_removed() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
    insert into public.notifications(recipient_id, event_id, type, title, body)
        select new.user_id, e.id, 'participation_removed', 'Inscripción dada de baja',
            'El organizador dio de baja tu inscripción.'
        from public.events e
        where e.id = new.event_id and e.organizer_id = (select auth.uid())
            and new.user_id <> e.organizer_id;
    return new;
end;
$$;
revoke all on function planit_private.notify_participation_removed() from public, anon, authenticated, service_role;
create trigger participations_notify_removed after update of status on public.event_participations
    for each row when (old.status = 'confirmed' and new.status = 'removed')
    execute function planit_private.notify_participation_removed();

-- The organizer cannot read the request table directly. Check the recipient and
-- event owner before disclosing whether the request linked to their notice is pending.
create function planit_private.has_pending_rejoin_notice(p_notification_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.notifications n
        join public.event_rejoin_requests r on r.id = n.rejoin_request_id
        join public.event_participations p on p.id = r.participation_id and p.event_id = n.event_id
        join public.events e on e.id = p.event_id
        where n.id = p_notification_id and n.type = 'rejoin_requested' and n.dismissed_at is null
            and n.recipient_id = (select auth.uid()) and e.organizer_id = n.recipient_id
            and r.status = 'pending'
    );
$$;
revoke all on function planit_private.has_pending_rejoin_notice(uuid) from public, anon, authenticated, service_role;
grant execute on function planit_private.has_pending_rejoin_notice(uuid) to authenticated;

create or replace function public.get_notification_target(p_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
    select case
        when n.type = 'rejoin_requested' and e.organizer_id = (select auth.uid()) then
            '/events/' || e.id::text || case when planit_private.has_pending_rejoin_notice(n.id)
                then '/rejoin-requests' else '' end
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
        case when n.type = 'event_full' then coalesce(e.title, 'Cupo completo')
            when e.id is not null then n.title || ' · ' || e.title
            else n.title end,
        n.body, n.read_at, n.created_at, public.get_notification_target(n.id)
        from public.notifications n
        left join public.events e on e.id = n.event_id and n.conversation_id is null and (
            (n.type = 'event_full' and e.organizer_id = (select auth.uid()) and e.archived_at is null)
            or n.type in ('rejoin_requested','rejoin_approved','rejoin_rejected','participation_removed','event_reminder')
        )
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
        case when n.type = 'event_full' then coalesce(e.title, 'Cupo completo')
            when e.id is not null then n.title || ' · ' || e.title
            else n.title end,
        n.body, n.read_at, n.created_at, public.get_notification_target(n.id)
        from public.notifications n
        left join public.events e on e.id = n.event_id and n.conversation_id is null and (
            (n.type = 'event_full' and e.organizer_id = (select auth.uid()) and e.archived_at is null)
            or n.type in ('rejoin_requested','rejoin_approved','rejoin_rejected','participation_removed','event_reminder')
        )
        where n.dismissed_at is null and n.id = any(p_ids) and n.recipient_id = (select auth.uid())
        order by n.created_at desc, n.id desc;
end;
$$;


create function planit_private.push_notification_expires_at(p_notice public.notifications) returns timestamp
language sql immutable set search_path = '' as $$
    select case when p_notice.type in (
        'direct_message','follow_request','event_full','event_update','event_cancelled',
        'rejoin_requested','rejoin_approved','rejoin_rejected','participation_removed'
    ) then p_notice.created_at + interval '15 minutes' end;
$$;
revoke all on function planit_private.push_notification_expires_at(public.notifications) from public, anon, authenticated, service_role;

-- Only the delivery RPC calls this, using the recipient stored on the notice.
create function planit_private.additional_event_push_notice(p_notice public.notifications) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
    v_event_title text;
    v_target text := '/notifications';
begin
    if p_notice.type not in ('rejoin_requested','rejoin_approved','rejoin_rejected','participation_removed') then
        return null;
    end if;

    select e.title into v_event_title
    from public.events e
    where e.id = p_notice.event_id and (
        e.organizer_id = p_notice.recipient_id
        or (e.visibility = 'unlisted' and exists (
            select 1 from public.event_access_grants g where g.event_id = e.id
                and g.user_id = p_notice.recipient_id and g.status = 'active'))
        or (e.visibility = 'public' and ((e.cancelled_at is null and e.archived_at is null)
            or exists (select 1 from public.event_participations p
                where p.event_id = e.id and p.user_id = p_notice.recipient_id)))
    );
    if found then
        v_target := '/events/' || p_notice.event_id::text;
        if p_notice.type = 'rejoin_requested' and exists (
            select 1 from public.event_rejoin_requests r
            join public.event_participations p on p.id = r.participation_id
            join public.events e on e.id = p.event_id
            where r.id = p_notice.rejoin_request_id and r.status = 'pending'
                and e.id = p_notice.event_id and e.organizer_id = p_notice.recipient_id
        ) then
            v_target := v_target || '/rejoin-requests';
        end if;
    end if;

    return jsonb_build_object('target', v_target, 'title', p_notice.title,
        'body', case when v_event_title is null then p_notice.body
            else p_notice.body || ' Evento: “' || v_event_title || '”.' end);
end;
$$;
revoke all on function planit_private.additional_event_push_notice(public.notifications) from public, anon, authenticated, service_role;

create or replace function planit_private.enqueue_notification_push() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
    v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    v_expires_at timestamp := planit_private.push_notification_expires_at(new);
begin
    if v_expires_at is null or v_expires_at <= v_now then return new; end if;
    begin
        insert into planit_private.push_jobs(notification_id,subscription_id,created_at,next_attempt_at,expires_at)
        select new.id,s.id,new.created_at,v_now,v_expires_at
        from public.push_subscriptions s where s.user_id=new.recipient_id and s.disabled_at is null
            and s.created_at <= new.created_at and new.created_at <= v_now
            and new.created_at > v_now - interval '15 minutes'
        on conflict do nothing;
    exception when others then
        -- Never log SQLERRM, notification text, endpoints or keys. Backfill repairs this.
        raise warning using message = 'push_enqueue_failed';
    end;
    return new;
end;
$$;
revoke all on function planit_private.enqueue_notification_push() from public,anon,authenticated,service_role;


-- Public wrappers are service-only because Edge reaches PostgreSQL through REST.
-- No caller-supplied recipient identity. All joins derive it from notifications.
create or replace function public.enqueue_missing_push_jobs(p_limit integer default 100) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'; v_count integer;
begin
    if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_limit' using errcode='22023'; end if;
    -- Bounded retention; expired notifications cannot enter the backfill window again.
    delete from planit_private.push_jobs where (notification_id,subscription_id) in (
        select notification_id,subscription_id from planit_private.push_jobs
        where finished_at < v_now - interval '7 days' order by finished_at limit 100
        for update skip locked);
    insert into planit_private.push_jobs(notification_id,subscription_id,created_at,next_attempt_at,expires_at)
    select n.id,s.id,n.created_at,v_now,planit_private.push_notification_expires_at(n)
    from public.notifications n join public.push_subscriptions s on s.user_id=n.recipient_id
    where s.disabled_at is null and planit_private.push_notification_expires_at(n) > v_now
        and s.created_at <= n.created_at and n.created_at <= v_now
        and n.created_at > v_now - interval '15 minutes'
        and not exists (select 1 from planit_private.push_jobs j where j.notification_id=n.id and j.subscription_id=s.id)
    order by n.created_at,n.id,s.id limit p_limit on conflict do nothing;
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

create or replace function public.get_push_job_delivery(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    v_job planit_private.push_jobs%rowtype; v_sub public.push_subscriptions%rowtype;
    v_notice public.notifications%rowtype; v_conv public.conversations%rowtype;
    v_title text := 'Nuevo aviso en PlanIt'; v_body text := 'Abrí PlanIt para consultar tus notificaciones.';
    v_target text := '/notifications'; v_preview boolean; v_name text; v_text text; v_peer uuid; v_now timestamp;
    v_event_notice jsonb;
begin
    select * into v_job from planit_private.push_jobs where notification_id=p_notification_id and subscription_id=p_subscription_id for update;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if not found or v_job.state<>'processing' or v_job.lease_token is distinct from p_lease_token
        or v_job.lease_until<=v_now then return null; end if;
    select * into v_sub from public.push_subscriptions where id=p_subscription_id;
    select * into v_notice from public.notifications where id=p_notification_id;
    if v_job.expires_at<=v_now or v_sub.disabled_at is not null or v_sub.id is null
        or v_notice.id is null or v_notice.dismissed_at is not null or v_sub.user_id is distinct from v_notice.recipient_id
        or coalesce(planit_private.push_notification_expires_at(v_notice) <= v_now, true) then
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
    elsif v_notice.type in ('event_update','event_cancelled') and v_notice.conversation_id is null then
        -- Same visibility rule as can_view_event, using the stored recipient,
        -- never the worker identity or browser-provided identity. Cancellation
        -- and archive preserve historical access; revoked unlisted access does not.
        if exists (select 1 from public.events e where e.id=v_notice.event_id and (
            e.organizer_id=v_notice.recipient_id
            or (e.visibility='unlisted' and exists (
                select 1 from public.event_access_grants g where g.event_id=e.id
                    and g.user_id=v_notice.recipient_id and g.status='active'))
            or (e.visibility='public' and ((e.cancelled_at is null and e.archived_at is null)
                or exists (select 1 from public.event_participations p
                    where p.event_id=e.id and p.user_id=v_notice.recipient_id)))
        )) then
            v_target := '/events/' || v_notice.event_id::text;
            if v_preview then v_title := v_notice.title; v_body := v_notice.body; end if;
        end if;
    elsif v_notice.type='event_full' and v_notice.conversation_id is null then
        select title into v_name from public.events where id=v_notice.event_id
            and organizer_id=v_notice.recipient_id and archived_at is null;
        if found then
            v_target := '/events/' || v_notice.event_id::text;
            if v_preview then v_title := 'Cupo completo'; v_body := v_name || ' alcanzó su cupo máximo.'; end if;
        end if;
    else
        v_event_notice := planit_private.additional_event_push_notice(v_notice);
        if v_event_notice is null then
            update planit_private.push_jobs
            set state='discarded',finished_at=v_now,lease_token=null,lease_until=null,last_error_code='unavailable'
            where notification_id=p_notification_id and subscription_id=p_subscription_id;
            return null;
        end if;
        v_target := coalesce(v_event_notice->>'target', v_target);
        if v_preview then
            v_title := coalesce(v_event_notice->>'title', v_title);
            v_body := coalesce(v_event_notice->>'body', v_body);
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
