begin;
-- All functional writes below concern a fresh UUID and are rolled back.
-- Existing accounts provide identities only; their data is not modified.
create temp table lifecycle_remote_probe(owner_id uuid,guest_id uuid,event_id uuid,reactivation_id uuid,deletion_id uuid,category_id uuid) on commit drop;
insert into lifecycle_remote_probe
select identities[1],identities[2],gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),
    (select id from public.categories where is_active order by id limit 1)
from (select array_agg(id order by id) as identities from (select id from public.profiles order by id limit 2) p) p;
grant select on lifecycle_remote_probe to authenticated;
do $$
declare p lifecycle_remote_probe%rowtype; v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
begin
    select * into p from lifecycle_remote_probe;
    if p.owner_id is null or p.guest_id is null or p.category_id is null then raise exception 'two_existing_accounts_and_category_required'; end if;
    perform set_config('request.jwt.claim.sub',p.owner_id::text,true);
    insert into public.events(id,organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
    values(p.event_id,p.owner_id,p.category_id,'Migration verification (rollback)','Temporary transaction-only fixture',v_now+interval '2 days',v_now+interval '3 days','Buenos Aires',-34.6,-58.4,3);
end;
$$;
set local role authenticated;
do $$
declare p lifecycle_remote_probe%rowtype; v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'; v_denied boolean := false;
begin
    select * into p from lifecycle_remote_probe;
    perform set_config('request.jwt.claim.sub',p.guest_id::text,true);
    perform public.register_for_event(p.event_id);
    begin
        perform public.delete_event(p.event_id,p.deletion_id);
    exception when insufficient_privilege then v_denied := true;
    end;
    if not v_denied then raise exception 'foreign_delete_not_denied'; end if;
    perform set_config('request.jwt.claim.sub',p.owner_id::text,true);
    perform public.archive_event(p.event_id);
    perform public.reactivate_event(p.event_id,p.reactivation_id,'Migration verification (rollback)','Temporary transaction-only fixture',
        v_now+interval '4 days',v_now+interval '5 days',p.category_id,3,'Buenos Aires',-34.6,-58.4,null,'public');
    if not public.get_event_operation(p.reactivation_id,p.event_id,'reactivate') then raise exception 'reactivation_receipt_missing'; end if;
    perform set_config('request.jwt.claim.sub',p.guest_id::text,true);
    if not exists(select 1 from public.event_participations where event_id=p.event_id and user_id=p.guest_id and status='cancelled') then raise exception 'registration_not_reset'; end if;
    perform public.register_for_event(p.event_id);
    perform set_config('request.jwt.claim.sub',p.owner_id::text,true);
    perform public.reactivate_event(p.event_id,p.reactivation_id,'Migration verification (rollback)','Temporary transaction-only fixture',
        v_now+interval '4 days',v_now+interval '5 days',p.category_id,3,'Buenos Aires',-34.6,-58.4,null,'public');
    perform set_config('request.jwt.claim.sub',p.guest_id::text,true);
    if not exists(select 1 from public.event_participations where event_id=p.event_id and user_id=p.guest_id and status='confirmed') then raise exception 'retry_reset_new_registration'; end if;
    perform set_config('request.jwt.claim.sub',p.owner_id::text,true);
    v_denied := false;
    begin
        perform public.delete_event(p.event_id,p.deletion_id);
    exception when raise_exception then if sqlerrm<>'event_not_closed' then raise; end if; v_denied := true;
    end;
    if not v_denied then raise exception 'active_delete_not_denied'; end if;
    perform public.archive_event(p.event_id);
    perform public.delete_event(p.event_id,p.deletion_id);
    perform public.delete_event(p.event_id,p.deletion_id);
    if not public.get_event_operation(p.deletion_id,p.event_id,'delete') then raise exception 'delete_receipt_missing'; end if;
    perform set_config('request.jwt.claim.sub',p.guest_id::text,true);
    if public.get_event_operation(p.deletion_id,p.event_id,'delete') then raise exception 'foreign_receipt_leaked'; end if;
end;
$$;
reset role;
do $$
declare p lifecycle_remote_probe%rowtype;
begin
    select * into p from lifecycle_remote_probe;
    if exists(select 1 from public.events where id=p.event_id)
        or exists(select 1 from public.event_participations where event_id=p.event_id)
        or exists(select 1 from public.conversations where event_id=p.event_id) then raise exception 'fixture_dependencies_remain'; end if;
end;
$$;
rollback;
select 'PASS' as result,'Two existing identities via SET ROLE; new transaction-only fixture; reactivation/re-registration/idempotency/owner-only closed deletion; all writes rolled back' as verification;
