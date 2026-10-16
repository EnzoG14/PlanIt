begin read only;
select jsonb_build_object(
  'server_version',current_setting('server_version'),
  'audited_at',clock_timestamp(),
  'migrations',(select jsonb_agg(jsonb_build_object('version',version,'name',name) order by version) from supabase_migrations.schema_migrations),
  'tables',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,
      'anon_select',has_table_privilege('anon',c.oid,'select'),
      'authenticated_select',has_table_privilege('authenticated',c.oid,'select'),
      'authenticated_insert',has_table_privilege('authenticated',c.oid,'insert'),
      'authenticated_update',has_table_privilege('authenticated',c.oid,'update'),
      'authenticated_delete',has_table_privilege('authenticated',c.oid,'delete')) order by n.nspname,c.relname)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where (n.nspname='public' and c.relname in ('messages','message_attachments'))
      or (n.nspname='planit_private' and c.relname in ('media_uploads','media_claims'))),
  'body_nullable',(select not attnotnull from pg_attribute where attrelid='public.messages'::regclass and attname='body'),
  'functions',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,
      'body',p.prosrc,'definer',p.prosecdef,'config',p.proconfig,
      'anon_execute',has_function_privilege('anon',p.oid,'execute'),
      'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),
      'service_execute',has_function_privilege('service_role',p.oid,'execute')) order by n.nspname,p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','planit_private') and p.prokind='f'
      and (p.proname like '%r7%' or p.proname in ('reserve_event_media_upload','get_event_media_upload_state','validate_event_file','get_event_chat_messages'))),
  'constraints',(select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) order by c.conname)
    from pg_constraint c where c.conrelid in ('public.message_attachments'::regclass,'planit_private.media_uploads'::regclass,'planit_private.media_claims'::regclass)),
  'triggers',(select jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'definition',pg_get_triggerdef(t.oid)) order by t.tgname)
    from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and (t.tgname like '%r7%')),
  'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p
    where schemaname='storage' or (schemaname='public' and tablename in ('files','message_attachments'))),
  'storage_helpers',(select jsonb_agg(jsonb_build_object('name',p.proname,'definition',pg_get_functiondef(p.oid)))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='storage' and p.proname='allow_only_operation')
) as metadata;
rollback;
