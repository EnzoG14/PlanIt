begin read only;
select jsonb_build_object(
 'server_version',current_setting('server_version'),
 'audited_at',clock_timestamp(),
 'indexes',(select jsonb_agg(to_jsonb(i) order by tablename,indexname) from pg_indexes i where schemaname='public'),
 'triggers',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',t.tgname,'definition',pg_get_triggerdef(t.oid)) order by n.nspname,c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth') and not t.tgisinternal),
 'schema_usage',(select jsonb_agg(jsonb_build_object('schema',nspname,'anon',has_schema_privilege('anon',oid,'usage'),'authenticated',has_schema_privilege('authenticated',oid,'usage'))) from pg_namespace where nspname in ('public','planit_private')),
 'migrations',(select jsonb_agg(jsonb_build_object('version',version,'name',name) order by version) from supabase_migrations.schema_migrations),
 'tables',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'kind',c.relkind,'rls',c.relrowsecurity) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','planit_private') and c.relkind in ('r','v','m')),
 'columns',(select jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type,'nullable',is_nullable) order by table_name,ordinal_position) from information_schema.columns where table_schema='public'),
 'functions',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_arguments(p.oid),'identity_arguments',pg_get_function_identity_arguments(p.oid),'result',pg_get_function_result(p.oid),'definer',p.prosecdef,'config',p.proconfig,'anon_execute',has_function_privilege('anon',p.oid,'execute'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),'definition',pg_get_functiondef(p.oid)) order by n.nspname,p.proname,p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'),
 'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p where schemaname in ('public','storage')),
 'constraints',(select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) order by c.conrelid::regclass::text,c.conname) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'),
 'table_grants',(select jsonb_agg(to_jsonb(g) order by table_name,grantee,privilege_type) from information_schema.role_table_grants g where table_schema='public' and grantee in ('anon','authenticated','PUBLIC')),
 'column_grants',(select jsonb_agg(to_jsonb(g) order by table_name,column_name,grantee,privilege_type) from information_schema.role_column_grants g where table_schema='public' and grantee in ('anon','authenticated','PUBLIC')),
 'buckets',(select jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types)) from storage.buckets),
 'publications',(select jsonb_agg(to_jsonb(t) order by pubname,schemaname,tablename) from pg_publication_tables t where pubname='supabase_realtime')
) as metadata;
rollback;
