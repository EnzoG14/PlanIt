-- Runtime smoke only: read-only transaction, no real JWT, no fixture writes.
begin read only;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{}';
set local role authenticated;
do $$
begin
    if exists(select 1 from public.events) then
        raise exception 'missing_identity_reads_events';
    end if;
    if exists(select 1 from public.event_access_grants) then
        raise exception 'missing_identity_reads_grants';
    end if;
    begin
        perform 1 from public.event_access_links;
        raise exception 'hash_table_select_should_fail';
    exception when insufficient_privilege then null;
    end;
    begin
        perform public.get_event_participation_summary('00000000-0000-0000-0000-000000000000');
        raise exception 'summary_should_fail';
    exception when insufficient_privilege then null;
    end;
end;
$$;
select 'PASS' as no_identity_role_smoke, 'SQL role, no real JWT; no persisted data' as evidence_type;
rollback;
