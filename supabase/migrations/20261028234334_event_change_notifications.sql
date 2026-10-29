-- Local migration only. No historical notifications or remote execution.
begin;

-- Authorized event RPCs already hold the event lock and run READ COMMITTED.
-- INVOKER inherits those controlled writes; no browser INSERT privilege needed.
create function planit_private.notify_event_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
    v_type text;
    v_title text;
    v_body text;
    v_changes text[] := '{}';
begin
    if old.cancelled_at is null and new.cancelled_at is not null then
        v_type := 'event_cancelled';
        v_title := 'Evento cancelado';
        v_body := 'Se canceló “' || new.title || '”.';
    elsif old.cancelled_at is null and new.cancelled_at is null
        and old.archived_at is null and new.archived_at is null then
        if old.title is distinct from new.title then v_changes := array_append(v_changes, 'nombre'); end if;
        if old.description is distinct from new.description then v_changes := array_append(v_changes, 'descripción'); end if;
        if old.starts_at is distinct from new.starts_at or old.ends_at is distinct from new.ends_at then
            v_changes := array_append(v_changes, 'fecha y horario');
        end if;
        if old.location_name is distinct from new.location_name or old.address is distinct from new.address
            or old.latitude is distinct from new.latitude or old.longitude is distinct from new.longitude then
            v_changes := array_append(v_changes, 'lugar');
        end if;
        if cardinality(v_changes) = 0 then return new; end if;
        v_type := 'event_update';
        v_title := 'Evento actualizado';
        v_body := 'Se actualizó “' || new.title || '”. Cambios: ' || array_to_string(v_changes, ', ')
            || '. Revisá los datos del evento.';
    else
        -- Reactivation and archive-only transitions are not new updates.
        return new;
    end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    insert into public.notifications(recipient_id, event_id, type, title, body)
        select p.user_id, new.id, v_type, v_title, v_body
        from public.event_participations p
        where p.event_id = new.id and p.status = 'confirmed' and p.user_id <> new.organizer_id;
    -- No exception handler: the event and every inbox entry commit together.
    return new;
end;
$$;
revoke all on function planit_private.notify_event_change() from public, anon, authenticated, service_role;
create trigger events_notify_change after update on public.events
    for each row execute function planit_private.notify_event_change();


-- Extend both queue producers; preserve leases, TTL, retries and ACLs.
create or replace function planit_private.enqueue_notification_push() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
begin
    if new.type not in ('direct_message','follow_request','event_full','event_update','event_cancelled') then return new; end if;
    begin
        insert into planit_private.push_jobs(notification_id,subscription_id,created_at,next_attempt_at,expires_at)
        select new.id,s.id,new.created_at,v_now,new.created_at + interval '15 minutes'
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
    select n.id,s.id,n.created_at,v_now,n.created_at + interval '15 minutes'
    from public.notifications n join public.push_subscriptions s on s.user_id=n.recipient_id
    where n.type in ('direct_message','follow_request','event_full','event_update','event_cancelled') and s.disabled_at is null
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
