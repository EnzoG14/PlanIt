begin;

alter table public.push_preferences
    add column event_reminders_enabled boolean not null default true,
    add column event_reminders_disabled_at timestamp;

alter table public.notifications add column reminder_starts_at timestamp;
alter table public.notifications add constraint notifications_reminder_fields_check check (
    (type = 'event_reminder' and event_id is not null and reminder_starts_at is not null)
    or (type <> 'event_reminder' and reminder_starts_at is null)
);
create unique index notifications_event_reminder_idx
    on public.notifications(event_id, recipient_id) where type = 'event_reminder';
create index events_reminder_starts_idx on public.events(starts_at, id)
    where cancelled_at is null and archived_at is null;

create or replace function public.get_my_push_settings() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_preferences public.push_preferences%rowtype;
    v_subscriptions jsonb;
begin
    if v_user_id is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;

    select * into v_preferences from public.push_preferences where user_id = v_user_id;
    select coalesce(jsonb_agg(
        jsonb_build_object('id', s.id, 'created_at', s.created_at,
            'updated_at', s.updated_at, 'disabled_at', s.disabled_at)
        order by s.created_at desc, s.id desc
    ), '[]'::jsonb) into v_subscriptions
    from public.push_subscriptions s
    where s.user_id = v_user_id;

    return jsonb_build_object(
        'show_previews', coalesce(v_preferences.show_previews, true),
        'event_reminders_enabled', coalesce(v_preferences.event_reminders_enabled, true),
        'subscriptions', v_subscriptions
    );
end;
$$;

create function public.set_my_event_reminders(p_enabled boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_now timestamp;
begin
    if v_user_id is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if p_enabled is null then
        raise exception 'invalid_reminder_preference' using errcode = '22023';
    end if;

    -- Order preference writes against the scheduler's recipient snapshot.
    perform pg_advisory_xact_lock_shared(1298462477, 1);
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    insert into public.push_preferences as prefs
        (user_id, show_previews, event_reminders_enabled, event_reminders_disabled_at, updated_at)
    values (v_user_id, true, p_enabled, case when not p_enabled then v_now end, v_now)
    on conflict (user_id) do update set
        event_reminders_enabled = excluded.event_reminders_enabled,
        event_reminders_disabled_at = case when not excluded.event_reminders_enabled
            then greatest(prefs.event_reminders_disabled_at, excluded.event_reminders_disabled_at)
            else prefs.event_reminders_disabled_at end,
        updated_at = greatest(prefs.updated_at, excluded.updated_at);
    return p_enabled;
end;
$$;
revoke all on function public.set_my_event_reminders(boolean) from public, anon, authenticated, service_role;
grant execute on function public.set_my_event_reminders(boolean) to authenticated;

create function planit_private.generate_event_reminders() returns integer
language plpgsql security invoker set search_path = '' as $$
declare
    v_now timestamp;
    v_count integer;
begin
    if not pg_try_advisory_xact_lock(1298462477, 1) then return 0; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    insert into public.notifications(recipient_id, event_id, type, title, body, created_at, reminder_starts_at)
    select p.user_id, e.id, 'event_reminder', 'Recordatorio de evento',
        'Inicio previsto: ' || to_char(e.starts_at, 'DD/MM/YYYY "a las" HH24:MI') || ' (hora argentina).',
        v_now, e.starts_at
    from public.events e
    join public.event_participations p on p.event_id = e.id and p.status = 'confirmed'
    left join public.push_preferences prefs on prefs.user_id = p.user_id
    where e.cancelled_at is null and e.archived_at is null
        and e.starts_at > v_now + interval '45 minutes'
        and e.starts_at <= v_now + interval '60 minutes'
        and p.user_id <> e.organizer_id
        and coalesce(prefs.event_reminders_enabled, true)
        and (e.visibility = 'public' or (e.visibility = 'unlisted' and exists (
            select 1 from public.event_access_grants g where g.event_id = e.id
                and g.user_id = p.user_id and g.status = 'active'
        )))
        and not exists (
            select 1 from public.notifications n where n.type = 'event_reminder'
                and n.event_id = e.id and n.recipient_id = p.user_id
        )
    order by e.starts_at, e.id, p.user_id
    limit 1000
    for share of e, p skip locked
    on conflict (event_id, recipient_id) where type = 'event_reminder' do nothing;

    get diagnostics v_count = row_count;
    return v_count;
end;
$$;
revoke all on function planit_private.generate_event_reminders() from public, anon, authenticated, service_role;

create or replace function planit_private.push_notification_expires_at(p_notice public.notifications) returns timestamp
language sql immutable set search_path = '' as $$
    select case
    when p_notice.type = 'event_reminder' then least(
        p_notice.created_at + interval '15 minutes', p_notice.reminder_starts_at - interval '45 minutes'
    )
    when p_notice.type in (
        'direct_message','follow_request','event_full','event_update','event_cancelled',
        'rejoin_requested','rejoin_approved','rejoin_rejected','participation_removed'
    ) then p_notice.created_at + interval '15 minutes' end;
$$;

create function planit_private.event_reminder_push_notice(p_notice public.notifications) returns jsonb
language sql stable set search_path = '' as $$
    select jsonb_build_object('target', '/events/' || e.id::text, 'title', p_notice.title,
        'body', p_notice.body || ' Evento: “' || e.title || '”.')
    from public.events e
    join public.event_participations p on p.event_id = e.id
        and p.user_id = p_notice.recipient_id and p.status = 'confirmed'
    left join public.push_preferences prefs on prefs.user_id = p_notice.recipient_id
    where e.id = p_notice.event_id and e.starts_at = p_notice.reminder_starts_at
        and e.cancelled_at is null and e.archived_at is null and e.organizer_id <> p_notice.recipient_id
        and coalesce(prefs.event_reminders_enabled, true)
        -- An opt-out cancels jobs already queued even if the user turns reminders back on.
        and (prefs.event_reminders_disabled_at is null or prefs.event_reminders_disabled_at < p_notice.created_at)
        and (e.visibility = 'public' or (e.visibility = 'unlisted' and exists (
            select 1 from public.event_access_grants g where g.event_id = e.id
                and g.user_id = p_notice.recipient_id and g.status = 'active'
        )));
$$;
revoke all on function planit_private.event_reminder_push_notice(public.notifications) from public, anon, authenticated, service_role;

create or replace function planit_private.additional_event_push_notice(p_notice public.notifications) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
    v_event_title text;
    v_target text := '/notifications';
begin
    if p_notice.type = 'event_reminder' then
        return planit_private.event_reminder_push_notice(p_notice);
    end if;
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

commit;
