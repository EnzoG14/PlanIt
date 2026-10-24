select jsonb_build_object(
  'migration_applied',exists(select 1 from supabase_migrations.schema_migrations where version='20261024221340'),
  'functions',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'search_path',p.proconfig,
    'anon_execute',has_function_privilege('anon',p.oid,'execute'),
    'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),
    'service_execute',has_function_privilege('service_role',p.oid,'execute'),
    'body_sha256',encode(extensions.digest(replace(p.prosrc,E'\r\n',E'\n'),'sha256'),'hex')) order by n.nspname,p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname in
    ('get_event_operation','reactivate_event','delete_event','allow_event_media_insert','guard_deleted_event_file','guard_deleted_event_id',
     'claim_event_media_gc','get_event_media_gc_target','complete_event_media_gc','fail_event_media_gc')),
  'tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,
    'authenticated_select',has_table_privilege('authenticated',c.oid,'select'),
    'authenticated_write',has_table_privilege('authenticated',c.oid,'insert,update,delete')) order by c.relname)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='planit_private' and c.relname in('event_operations','event_media_gc_jobs')),
  'direct_event_delete',has_table_privilege('authenticated','public.events','delete'),
  'storage_guard',exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='event_media_no_deleted_event' and permissive='RESTRICTIVE'),
  'event_operations_empty',not exists(select 1 from planit_private.event_operations),
  'event_gc_empty',not exists(select 1 from planit_private.event_media_gc_jobs)
) as verification;
