begin read only;
do $$
declare p record;
begin
 select * into strict p from pg_proc where oid='public.get_my_event_demographics(uuid)'::regprocedure;
 if not p.prosecdef or p.provolatile<>'s' or p.proconfig<>array['search_path=""']
    or has_function_privilege('anon',p.oid,'execute')
    or not has_function_privilege('authenticated',p.oid,'execute')
    or exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE')
 then raise exception 'demographics_acl_mismatch'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity)
 then raise exception 'public_table_without_rls'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin
   perform public.get_my_event_demographics(null);
   raise exception 'missing_uid_not_rejected';
 exception when insufficient_privilege then
   if sqlerrm<>'authentication_required' then raise; end if;
 end;
 perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
 begin
   perform public.get_my_event_demographics(null);
   raise exception 'null_event_not_rejected';
 exception when insufficient_privilege then
   if sqlerrm<>'event_unavailable' then raise; end if;
 end;
end $$;
select version() as server_version, p.proname, p.prosecdef, p.provolatile, p.proconfig,
 has_function_privilege('anon',p.oid,'execute') as anon_execute,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
 p.prosrc as body,
 (select count(*) from supabase_migrations.schema_migrations) as migration_count,
 'PASS: ACL, missing UID, NULL event and public RLS assertions'::text as verification
from pg_proc p where p.oid='public.get_my_event_demographics(uuid)'::regprocedure;
rollback;
