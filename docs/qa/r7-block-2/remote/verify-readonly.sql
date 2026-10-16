begin read only;
select jsonb_build_object(
 'server_version',version(),
 'migrations',(select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),
 'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'body',p.prosrc,'config',p.proconfig,'definer',p.prosecdef,
 'identity',pg_get_function_identity_arguments(p.oid),'result',pg_get_function_result(p.oid),
 'anon_execute',has_function_privilege('anon',p.oid,'execute'),
 'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute')) order by p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
 and p.proname in ('send_event_chat_message_v2','get_event_chat_messages_v2')),
 'tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,
 'authenticated_insert',has_table_privilege('authenticated',c.oid,'insert'),
 'authenticated_update',has_table_privilege('authenticated',c.oid,'update'),
 'authenticated_delete',has_table_privilege('authenticated',c.oid,'delete')) order by c.relname)
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('files','messages','message_attachments'))
) as metadata;
commit;
