begin read only;
select version() as server_version;
select p.proname,p.prosecdef,p.provolatile,p.proconfig,
 has_function_privilege('anon',p.oid,'execute') as anon_execute,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
 pg_get_functiondef(p.oid) as definition
from pg_proc p where p.oid='public.get_my_event_occupancy(uuid)'::regprocedure;
do $$
begin
 if exists(select 1 from pg_proc p where p.oid='public.get_my_event_occupancy(uuid)'::regprocedure
 and (not p.prosecdef or p.provolatile<>'s' or p.proconfig<>array['search_path=""']
 or has_function_privilege('anon',p.oid,'execute') or not has_function_privilege('authenticated',p.oid,'execute'))) then
 raise exception 'occupancy_acl_mismatch'; end if;
 begin
 perform public.get_my_event_occupancy('00000000-0000-0000-0000-000000000000');
 raise exception 'missing_uid_not_rejected';
 exception when insufficient_privilege then
 if sqlerrm<>'authentication_required' then raise; end if;
 end;
end $$;
select count(*) as tables_without_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
rollback;
