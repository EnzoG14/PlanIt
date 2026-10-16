begin;
set local role anon;
do $$ begin
  begin perform public.enqueue_missing_push_jobs(1); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.claim_push_jobs(1); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.get_push_job_delivery('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.complete_push_job('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.fail_push_job('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','gone'); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform 1 from planit_private.push_jobs; raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin perform public.enqueue_missing_push_jobs(1); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.claim_push_jobs(1); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.get_push_job_delivery('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.complete_push_job('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform public.fail_push_job('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','gone'); raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
  begin perform 1 from planit_private.push_jobs; raise exception 'unexpected_access'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ begin
  begin perform 1 from planit_private.push_jobs; raise exception 'unexpected_table_access'; exception when insufficient_privilege then null; end;
  begin perform public.claim_push_jobs(0); raise exception 'invalid_limit_accepted'; exception when invalid_parameter_value then null; end;
  if public.get_push_job_delivery('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003') is not null then raise exception 'unexpected_delivery'; end if;
end $$;
reset role;
select 'PASS' as result,'rollback transaction, no fixtures; anon/authenticated denied all five RPCs and queue; service_role RPC validation and missing-job lookup succeed, direct queue denied' as scope;
rollback;
