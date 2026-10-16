begin read only;
select jsonb_build_object(
  'audited_at', clock_timestamp(),
  'extensions', (select jsonb_agg(jsonb_build_object('name', extname, 'version', extversion) order by extname) from pg_extension where extname in ('pg_cron', 'pg_net', 'pgcrypto')),
  'cron_table_exists', to_regclass('cron.job') is not null,
  'private_schema_exists', to_regnamespace('planit_private') is not null,
  'storage_operation_helpers', (select jsonb_agg(jsonb_build_object(
    'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid),
    'definition', pg_get_functiondef(p.oid)) order by p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='storage' and p.proname in ('allow_only_operation','allow_any_operation'))
) as infrastructure;
rollback;
