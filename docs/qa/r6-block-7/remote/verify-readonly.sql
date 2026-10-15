begin read only;
set local role anon;
do $checks$ begin
 begin perform public.get_notification_target(null); raise exception 'unexpected_anon_execute'; exception when insufficient_privilege then null; end;
end $checks$;
reset role;
set local role authenticated;
do $checks$ begin
 if auth.uid() is not null then raise exception 'unexpected_uid'; end if;
 begin perform public.get_notifications(); raise exception 'unexpected_list_access'; exception when insufficient_privilege then null; end;
 begin perform public.get_notification_changes(array[]::uuid[]); raise exception 'unexpected_changes_access'; exception when insufficient_privilege then null; end;
 if public.get_notification_target(null) is not null then raise exception 'unexpected_target'; end if;
end $checks$;
reset role;
with expected(name,body) as (values ('get_notification_target',$expected$
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
$expected$),
('get_notifications',$expected$
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
$expected$),
('get_notification_changes',$expected$
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
$expected$))
select jsonb_build_object(
 'server_version',current_setting('server_version'),
 'migration_count',(select count(*) from supabase_migrations.schema_migrations),
 'migration_recorded',exists(select 1 from supabase_migrations.schema_migrations where version='20261015201034'),
 'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'body_matches_git',replace(p.prosrc,chr(13),'')=replace(e.body,chr(13),''),'security_invoker',not p.prosecdef,'stable',p.provolatile='s','search_path_empty',p.proconfig=array['search_path=""'],'anon_execute',has_function_privilege('anon',p.oid,'execute'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),'public_execute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),'arguments',pg_get_function_arguments(p.oid),'result',pg_get_function_result(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace join expected e on e.name=p.proname where n.nspname='public'),
 'notification_rls',(select relrowsecurity from pg_class where oid='public.notifications'::regclass),
 'notification_policies',(select jsonb_agg(jsonb_build_object('name',policyname,'cmd',cmd,'qual',qual,'with_check',with_check)) from pg_policies where schemaname='public' and tablename='notifications'),
 'notification_realtime_publication',exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'),
 'client_notice_insert',has_table_privilege('authenticated','public.notifications','insert'),
 'client_notice_delete',has_table_privilege('authenticated','public.notifications','delete'),
 'producer_body_preserved',(select replace(prosrc,chr(13),'')=replace($producer$
declare
    v_event public.events%rowtype;
begin
    if new.status <> 'confirmed' then return new; end if;
    if tg_op = 'UPDATE' then
        if old.status = 'confirmed' then return new; end if;
    end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;

    -- Reentrant lock: the invoking RPC already owns it. Later SQL statements
    -- see competitors committed before that lock was obtained (READ COMMITTED).
    select * into v_event from public.events where id = new.event_id for update;
    if not found or new.user_id = v_event.organizer_id
        or v_event.cancelled_at is not null or v_event.archived_at is not null
        or v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        return new;
    end if;
    if (select count(*) from public.event_participations p
        where p.event_id = new.event_id and p.status = 'confirmed'
            and p.user_id <> v_event.organizer_id) = v_event.capacity then
        insert into public.notifications(recipient_id, event_id, type, title, body)
        values (v_event.organizer_id, v_event.id, 'event_full', 'Cupo completo',
            'Tu evento alcanzó su cupo máximo de inscripciones confirmadas.');
    end if;
    -- Never swallow insert errors: participation, history, rejoin resolution and
    -- notification must commit or roll back together. A subsequent free→full
    -- transition is a new D07 episode, even for the same participant.
    return new;
end;
$producer$,chr(13),'') from pg_proc where oid='planit_private.notify_event_full()'::regprocedure),
 'producer_trigger_preserved',exists(select 1 from pg_trigger where tgname='participations_notify_event_full' and tgrelid='public.event_participations'::regclass and tgenabled='O'),
 'history_trigger_preserved',exists(select 1 from pg_trigger where tgname='participations_record_history' and tgrelid='public.event_participations'::regclass and tgenabled='O'),
 'public_tables_without_rls',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
 'anon_target_call','DENIED 42501 in read-only transaction',
 'authenticated_no_uid_list_and_changes','DENIED 42501 in read-only transaction',
 'authenticated_no_uid_target','NULL in read-only transaction'
) as verification;
rollback;
