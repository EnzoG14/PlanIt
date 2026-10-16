begin read only;
select jsonb_build_object(
 'server_version',current_setting('server_version'),
 'audited_at',clock_timestamp(),
 'migrations',(select jsonb_agg(jsonb_build_object('version',version,'name',name) order by version) from supabase_migrations.schema_migrations),
 'functions',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'body',p.prosrc,
   'config',p.proconfig,'definer',p.prosecdef,'anon_execute',has_function_privilege('anon',p.oid,'execute'),
   'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),
   'service_execute',has_function_privilege('service_role',p.oid,'execute')) order by p.proname)
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname in ('public','planit_private') and p.proname in (
    'can_read_story_event','can_read_story','guard_r7_story','publish_event_story','get_event_stories',
    'get_r7_story_image_target','register_r7_media','check_r7_file','check_r7_claim_trigger','can_read_r7_media','check_r7_story_trigger')),
 'story_table',(select jsonb_build_object('rls',c.relrowsecurity,'anon_select',has_table_privilege('anon',c.oid,'select'),
   'authenticated_select',has_table_privilege('authenticated',c.oid,'select'),
   'authenticated_insert',has_table_privilege('authenticated',c.oid,'insert'),
   'authenticated_update',has_table_privilege('authenticated',c.oid,'update'),
   'authenticated_delete',has_table_privilege('authenticated',c.oid,'delete')) from pg_class c where c.oid=to_regclass('public.stories')),
 'columns',(select jsonb_agg(jsonb_build_object('name',column_name,'type',data_type,'nullable',is_nullable) order by ordinal_position)
   from information_schema.columns where table_schema='public' and table_name='stories'),
 'constraints',(select jsonb_agg(jsonb_build_object('name',conname,'type',contype,'definition',pg_get_constraintdef(oid)) order by conname)
   from pg_constraint where conrelid=to_regclass('public.stories')),
 'indexes',(select jsonb_agg(to_jsonb(i) order by indexname) from pg_indexes i where schemaname='public' and tablename='stories'),
 'triggers',(select jsonb_agg(jsonb_build_object('name',tgname,'definition',pg_get_triggerdef(oid)) order by tgname)
   from pg_trigger where not tgisinternal and tgrelid=to_regclass('public.stories')),
 'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p
   where schemaname='storage' or (schemaname='public' and tablename in ('stories','files')))
) as metadata;
commit;
