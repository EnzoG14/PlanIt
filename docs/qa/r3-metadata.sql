-- Read-only metadata, one result because CLI returns only the final rowset.
begin read only;
select jsonb_build_object(
'bucket', (select jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types)) from storage.buckets where id='event_media'),
'migrations', (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from (
select version, name from supabase_migrations.schema_migrations order by version) q),
'tables', (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from (
select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname) q),
'functions', (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from (
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments, p.prosecdef, p.proconfig,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
  md5(replace(pg_get_functiondef(p.oid), chr(13), '')) as definition_hash
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' order by p.proname, arguments) q),
'policies', (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from (
select tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname in ('public','storage') order by schemaname, tablename, policyname) q),
'table_grants', (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from (
select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated') order by table_name, grantee, privilege_type) q),
'column_grants', (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from (
select grantee, table_name, column_name, privilege_type from information_schema.column_privileges where table_schema='public' and grantee in ('anon','authenticated') order by table_name, column_name, grantee, privilege_type) q)
) as metadata;
rollback;
