begin read only;
select p.prosrc as body,p.prosecdef as definer,p.proconfig as config,
    has_function_privilege('anon',p.oid,'execute') as anon_execute,
    has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
    (select relrowsecurity from pg_class where oid='storage.objects'::regclass) as storage_rls,
    exists(select 1 from supabase_migrations.schema_migrations where version='20261016182333') as migration_applied
from pg_proc p where p.oid='planit_private.can_upload_r7_media(text,text,jsonb)'::regprocedure;
commit;
