begin read only;
select version() as server_version, p.proname,p.prosecdef,p.provolatile,p.proconfig,
 has_function_privilege('anon',p.oid,'execute') as anon_execute,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
 pg_get_functiondef(p.oid) as definition,
 (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) as tables_without_rls
from pg_proc p where p.oid='public.get_my_event_occupancy(uuid)'::regprocedure;
rollback;
