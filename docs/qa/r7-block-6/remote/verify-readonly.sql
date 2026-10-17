begin read only;
select jsonb_build_object(
 'server_version',current_setting('server_version'),
 'migrations',(select jsonb_agg(jsonb_build_object('version',version,'name',name) order by version) from supabase_migrations.schema_migrations),
 'functions',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'body',p.prosrc,'config',p.proconfig,
   'definer',p.prosecdef,'anon_execute',has_function_privilege('anon',p.oid,'execute'),
   'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),
   'service_execute',has_function_privilege('service_role',p.oid,'execute')) order by p.proname)
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where p.proname in ('story_gc_target','claim_r7_story_gc','get_r7_story_gc_target','complete_r7_story_gc','fail_r7_story_gc')),
 'table',(select jsonb_build_object('rls',relrowsecurity,'anon_select',has_table_privilege('anon',oid,'select'),
   'authenticated_select',has_table_privilege('authenticated',oid,'select'),
   'service_select',has_table_privilege('service_role',oid,'select')) from pg_class where oid=to_regclass('planit_private.story_gc_jobs')),
 'constraints',(select jsonb_agg(pg_get_constraintdef(oid) order by conname) from pg_constraint where conrelid=to_regclass('planit_private.story_gc_jobs')),
 'indexes',(select jsonb_agg(indexdef order by indexname) from pg_indexes where schemaname='planit_private' and tablename='story_gc_jobs'),
 'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p where schemaname='storage' or tablename in ('files','stories')),
 'read_functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'body',p.prosrc) order by p.proname)
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private')
   and p.proname in ('can_read_story','can_read_r7_media','get_event_stories','get_r7_story_image_target'))
) as metadata;
commit;
