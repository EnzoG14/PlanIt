-- Read-only catalog verification; no users, tokens or business rows returned.
begin read only;
select jsonb_build_object(
  'migrations', (select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),
  'tables', (select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('events','event_access_links','event_access_grants')),
  'functions', (select jsonb_agg(jsonb_build_object(
    'name',n.nspname||'.'||p.proname,'signature',p.oid::regprocedure::text,'definer',p.prosecdef,'config',p.proconfig,
    'source_hash',md5(replace(p.prosrc,chr(13),'')),
    'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
    'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE')))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','planit_private') and p.proname in (
      'can_view_event','protect_event_visibility','can_read_event_chat','get_event_participation_summary',
      'get_event_organizer','register_for_event','send_event_chat_message','get_my_rejoin_status',
      'request_rejoin','resolve_rejoin','leave_event')),
  'policies', (select jsonb_agg(to_jsonb(p)) from (
    select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
    where (schemaname='public' and tablename in ('events','event_access_links','event_access_grants','event_images','files'))
      or (schemaname='storage' and tablename='objects') order by 1,2,3) p),
  'privileges', (select jsonb_agg(jsonb_build_object('role',r,'table',t,
      'select',has_table_privilege(r,t,'SELECT'),'insert',has_table_privilege(r,t,'INSERT'),
      'update',has_table_privilege(r,t,'UPDATE'),'delete',has_table_privilege(r,t,'DELETE')))
    from unnest(array['anon','authenticated']) r
    cross join unnest(array['public.event_access_links','public.event_access_grants']) t),
  'indexes', (select jsonb_agg(jsonb_build_object('table',tablename,'name',indexname,'definition',indexdef))
    from pg_indexes where schemaname='public' and tablename in ('event_access_links','event_access_grants')),
  'constraints', (select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid)))
    from pg_constraint where conrelid in ('public.event_access_links'::regclass,'public.event_access_grants'::regclass)),
  'triggers', (select jsonb_agg(jsonb_build_object('table',tgrelid::regclass::text,'name',tgname,'definition',pg_get_triggerdef(oid)))
    from pg_trigger where not tgisinternal and tgrelid in ('public.events'::regclass,'public.event_access_grants'::regclass)),
  'bucket_private', (select not public from storage.buckets where id='event_media')
) as metadata;
rollback;
