begin;
do $$
declare
    v_users uuid[];
    v_category uuid;
    v_id uuid := gen_random_uuid();
    v_bad_id uuid := gen_random_uuid();
    v_start timestamp := (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') + interval '1 day';
    v_rejected boolean;
begin
    select array_agg(id) into v_users from (select id from public.profiles order by created_at limit 2) p;
    if cardinality(v_users) <> 2 then raise exception 'Two existing profiles required'; end if;
    select id into v_category from public.categories where is_active order by slug limit 1;
    perform set_config('request.jwt.claim.sub', v_users[1]::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub',v_users[1],'role','authenticated')::text, true);
    execute 'set local role authenticated';
    perform public.create_event(v_id,'Migration verification','Temporary transaction, rolled back',v_start,v_start+interval '2 hours',v_category,10,'Verification address',-34.6,-58.38);
    if not exists (select 1 from public.events where id=v_id and organizer_id=v_users[1] and visibility='public') then raise exception 'Identity/readback verification failed'; end if;
    perform public.create_event(v_id,'Migration verification','Temporary transaction, rolled back',v_start,v_start+interval '2 hours',v_category,10,'Verification address',-34.6,-58.38);
    if (select count(*) from public.events where id=v_id) <> 1 then raise exception 'Retry duplicated event'; end if;
    v_rejected := false;
    begin
        perform public.create_event(v_bad_id,'Invalid','Invalid dates',v_start-interval '2 days',v_start,v_category,10,'Address',-34.6,-58.38);
    exception when sqlstate 'P0001' then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Past start accepted'; end if;
    v_rejected := false;
    begin
        perform public.create_event(v_bad_id,'Invalid','Invalid capacity',v_start,v_start+interval '2 hours',v_category,0,'Address',-34.6,-58.38);
    exception when check_violation then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Zero capacity accepted'; end if;
    v_rejected := false;
    begin
        insert into public.events(organizer_id) values (v_users[2]);
    exception when insufficient_privilege then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Organizer identity writable'; end if;
    v_rejected := false;
    begin
        perform public.create_event(v_bad_id,'Invalid','Missing image',v_start,v_start+interval '2 hours',v_category,10,'Address',-34.6,-58.38,null,array[v_users[1]::text || '/missing-verification.png']);
    exception when sqlstate 'P0001' then v_rejected := true;
    end;
    if not v_rejected or exists (select 1 from public.events where id=v_bad_id) then raise exception 'Missing image failed to roll back event'; end if;
    perform set_config('request.jwt.claim.sub', v_users[2]::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub',v_users[2],'role','authenticated')::text, true);
    if not exists (select 1 from public.events where id=v_id and visibility='public' and latitude between -35 and -34 and longitude between -59 and -58 and cancelled_at is null and archived_at is null) then raise exception 'Public event hidden from second user'; end if;
    v_rejected := false;
    begin
        update public.events set title='Unauthorized' where id=v_id;
    exception when insufficient_privilege then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Cross-owner update accepted'; end if;
    execute 'set local role anon';
    v_rejected := false;
    begin
        perform public.create_event(gen_random_uuid(),'Invalid','Anonymous',v_start,v_start+interval '2 hours',v_category,10,'Address',-34.6,-58.38);
    exception when insufficient_privilege then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Anonymous RPC accepted'; end if;
end;
$$;
rollback;
select 'PASS: remote create/readback, identity, idempotency, validation rollback, missing-image rollback, public geographic read by second user, cross-owner write denial, anonymous denial. All test changes rolled back.' as verification;
