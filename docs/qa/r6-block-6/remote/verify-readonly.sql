begin read only;
set local role authenticated;
do $checks$ begin
 begin perform planit_private.notify_event_full(); raise exception 'unexpected_client_execute';
 exception when insufficient_privilege then null; end;
end $checks$;
reset role;
select jsonb_build_object(
 'server_version',current_setting('server_version'),
 'body_matches_git',replace(p.prosrc,chr(13),'')=replace($expected$
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
$expected$,chr(13),''),
 'security_invoker',not p.prosecdef,
 'search_path_empty',p.proconfig=array['search_path=""'],
 'anon_execute',has_function_privilege('anon',p.oid,'execute'),
 'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),
 'public_execute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),
 'trigger_enabled',exists(select 1 from pg_trigger where tgname='participations_notify_event_full' and tgrelid='public.event_participations'::regclass and tgenabled='O' and tgfoid=p.oid),
 'trigger_definition',(select pg_get_triggerdef(oid) from pg_trigger where tgname='participations_notify_event_full' and tgrelid='public.event_participations'::regclass),
 'history_trigger_preserved',exists(select 1 from pg_trigger where tgname='participations_record_history' and tgrelid='public.event_participations'::regclass and tgenabled='O'),
 'notification_rls',(select relrowsecurity from pg_class where oid='public.notifications'::regclass),
 'notification_policies',(select jsonb_agg(jsonb_build_object('name',policyname,'cmd',cmd,'qual',qual,'with_check',with_check)) from pg_policies where schemaname='public' and tablename='notifications'),
 'client_notice_insert',has_table_privilege('authenticated','public.notifications','insert'),
 'client_participation_insert',has_table_privilege('authenticated','public.event_participations','insert'),
 'client_participation_update',has_table_privilege('authenticated','public.event_participations','update'),
 'public_tables_without_rls',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
 'migration_count',(select count(*) from supabase_migrations.schema_migrations),
 'migration_recorded',exists(select 1 from supabase_migrations.schema_migrations where version='20261015185020'),
 'authenticated_producer_call','DENIED 42501 in read-only transaction'
) as verification from pg_proc p where p.oid='planit_private.notify_event_full()'::regprocedure;
rollback;
