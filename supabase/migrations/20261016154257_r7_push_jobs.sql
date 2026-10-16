-- R7 B10: complementary outbox. No remote application or scheduler activation.
begin;

create table planit_private.push_jobs (
    notification_id uuid not null references public.notifications(id) on delete restrict,
    subscription_id uuid not null references public.push_subscriptions(id) on delete restrict,
    state text not null default 'pending' check (state in ('pending','processing','sent','failed','discarded')),
    attempts integer not null default 0 check (attempts between 0 and 5),
    created_at timestamp not null,
    next_attempt_at timestamp not null,
    expires_at timestamp not null,
    lease_token uuid,
    lease_until timestamp,
    delivery_subscription_updated_at timestamp,
    finished_at timestamp,
    last_error_code text check (last_error_code in ('expired','disabled','unavailable','gone','rate_limited','provider_error','timeout','network_error','permanent','invalid_delivery')),
    primary key (notification_id, subscription_id),
    check (expires_at > created_at),
    check ((state = 'processing' and lease_token is not null and lease_until is not null)
        or (state <> 'processing' and lease_token is null and lease_until is null)),
    check ((state in ('sent','failed','discarded')) = (finished_at is not null))
);
alter table planit_private.push_jobs enable row level security;
revoke all on planit_private.push_jobs from public, anon, authenticated, service_role;
create index push_jobs_subscription on planit_private.push_jobs(subscription_id);
create index push_jobs_ready on planit_private.push_jobs(next_attempt_at,created_at)
    where state in ('pending','processing');
create index push_jobs_retention on planit_private.push_jobs(finished_at) where finished_at is not null;

-- Explicit catalog: only these three types have producers on the B9 baseline.
create function planit_private.enqueue_notification_push() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
begin
    if new.type not in ('direct_message','follow_request','event_full') then return new; end if;
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
create trigger notifications_enqueue_push after insert on public.notifications
    for each row execute function planit_private.enqueue_notification_push();

-- Public wrappers are service-only because Edge reaches PostgreSQL through REST.
-- No caller-supplied recipient identity. All joins derive it from notifications.
create function public.enqueue_missing_push_jobs(p_limit integer default 100) returns integer
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
    where n.type in ('direct_message','follow_request','event_full') and s.disabled_at is null
        and s.created_at <= n.created_at and n.created_at <= v_now
        and n.created_at > v_now - interval '15 minutes'
        and not exists (select 1 from planit_private.push_jobs j where j.notification_id=n.id and j.subscription_id=s.id)
    order by n.created_at,n.id,s.id limit p_limit on conflict do nothing;
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

create function public.claim_push_jobs(p_limit integer default 100) returns setof jsonb
language plpgsql security definer set search_path = '' as $$
declare v_now timestamp; v_job planit_private.push_jobs%rowtype;
begin
    if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_limit' using errcode='22023'; end if;
    -- Clear a bounded group of terminal candidates without letting an expired
    -- prefix starve live jobs. Never steal a still-active lease.
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    with stale as (
        select j.notification_id,j.subscription_id from planit_private.push_jobs j
        where (j.state='pending' or (j.state='processing' and j.lease_until<=v_now))
            and (j.expires_at<=v_now or j.attempts>=5 or not exists (
                select 1 from public.push_subscriptions s where s.id=j.subscription_id and s.disabled_at is null))
        order by j.next_attempt_at,j.created_at limit 100 for update skip locked
    )
    update planit_private.push_jobs j set state=case when j.attempts>=5 then 'failed' else 'discarded' end,
        finished_at=v_now,lease_token=null,lease_until=null,
        last_error_code=case when j.expires_at<=v_now then 'expired' when j.attempts>=5 then 'timeout' else 'disabled' end
    from stale where j.notification_id=stale.notification_id and j.subscription_id=stale.subscription_id;
    for v_job in select * from planit_private.push_jobs
        where ((state='pending' and next_attempt_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'))
            or (state='processing' and lease_until <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')))
            and expires_at > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') and attempts<5
            and exists (select 1 from public.push_subscriptions s where s.id=subscription_id and s.disabled_at is null)
        order by next_attempt_at,created_at,notification_id,subscription_id limit p_limit for update skip locked
    loop
        v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
        if v_job.expires_at <= v_now or v_job.attempts >= 5
            or not exists(select 1 from public.push_subscriptions s where s.id=v_job.subscription_id and s.disabled_at is null) then
            update planit_private.push_jobs set state=case when attempts>=5 then 'failed' else 'discarded' end,
                finished_at=v_now, lease_token=null,lease_until=null,
                last_error_code=case when expires_at<=v_now then 'expired' when attempts>=5 then 'timeout' else 'disabled' end
            where notification_id=v_job.notification_id and subscription_id=v_job.subscription_id;
        else
            update planit_private.push_jobs set state='processing',attempts=attempts+1,
                lease_token=gen_random_uuid(),lease_until=v_now+interval '60 seconds',
                delivery_subscription_updated_at=null
            where notification_id=v_job.notification_id and subscription_id=v_job.subscription_id
            returning * into v_job;
            return next jsonb_build_object('notification_id',v_job.notification_id,'subscription_id',v_job.subscription_id,'lease_token',v_job.lease_token);
        end if;
    end loop;
end;
$$;

create function public.get_push_job_delivery(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid) returns jsonb
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
        or v_notice.id is null or v_sub.user_id is distinct from v_notice.recipient_id then
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

create function public.complete_push_job(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid) returns void
language sql security definer set search_path = '' as $$
    update planit_private.push_jobs set state='sent',finished_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires',
        lease_token=null,lease_until=null,last_error_code=null
    where notification_id=p_notification_id and subscription_id=p_subscription_id and state='processing'
        and lease_token=p_lease_token and delivery_subscription_updated_at is not null
        and lease_until>(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires');
$$;

create function public.fail_push_job(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid,p_error_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_job planit_private.push_jobs%rowtype; v_now timestamp; v_terminal boolean;
begin
    if p_error_code is null or p_error_code not in ('gone','rate_limited','provider_error','timeout','network_error','permanent','invalid_delivery') then
        raise exception 'invalid_error_code' using errcode='22023';
    end if;
    select * into v_job from planit_private.push_jobs where notification_id=p_notification_id and subscription_id=p_subscription_id for update;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if not found or v_job.state<>'processing' or v_job.lease_token is distinct from p_lease_token or v_job.lease_until<=v_now then return; end if;
    if p_error_code='gone' then
        -- An old response must not disable renewed keys. Other jobs revalidate the subscription before I/O.
        update public.push_subscriptions set disabled_at=v_now,updated_at=v_now
        where id=p_subscription_id and disabled_at is null and updated_at=v_job.delivery_subscription_updated_at;
    end if;
    v_terminal := p_error_code in ('gone','permanent','invalid_delivery') or v_job.attempts>=5 or v_job.expires_at<=v_now;
    update planit_private.push_jobs set state=case when v_terminal then 'failed' else 'pending' end,
        finished_at=case when v_terminal then v_now end,lease_token=null,lease_until=null,last_error_code=p_error_code,
        next_attempt_at=v_now + make_interval(secs => (30 * power(2,v_job.attempts-1))::integer + floor(random()*11)::integer)
    where notification_id=p_notification_id and subscription_id=p_subscription_id;
end;
$$;

revoke all on function public.enqueue_missing_push_jobs(integer),public.claim_push_jobs(integer),
    public.get_push_job_delivery(uuid,uuid,uuid),public.complete_push_job(uuid,uuid,uuid),
    public.fail_push_job(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.enqueue_missing_push_jobs(integer),public.claim_push_jobs(integer),
    public.get_push_job_delivery(uuid,uuid,uuid),public.complete_push_job(uuid,uuid,uuid),
    public.fail_push_job(uuid,uuid,uuid,text) to service_role;
commit;
