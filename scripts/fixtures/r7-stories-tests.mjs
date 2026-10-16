  const publish=(client,id,fid,eventId=eid)=>value(client,'select public.publish_event_story($1,$2,$3)',[eventId,id,fid]);
  const list=(client=a,eventId=eid,cursor=null,limit=30)=>value(client,'select public.get_event_stories($1,$2,$3,$4)',[eventId,cursor?.created_at??null,cursor?.id??null,limit]);
  const service=await connect();await service.query('set role service_role');
  const target=(id,viewer=aId,client=service)=>value(client,'select public.get_r7_story_image_target($1,$2)',[viewer,id]);
  const prepared=async(client=a,uid=aId,eventId=eid,purpose='story',verify=true)=>{
    const r=await value(client,'select public.reserve_event_media_upload($1,$2,$3,$4,$5,$6)',[eventId,randomUUID(),randomUUID(),purpose,'image/png',1024]);
    await store(client,r,uid);
    if(verify){
      const t=await value(service,'select public.get_r7_media_validation_target($1,$2)',[uid,r.file_id]);
      await service.query('select public.complete_r7_media_validation($1,$2,$3,$4,$5)',[uid,r.file_id,t.object_id,t.etag,'a'.repeat(64)]);
    }
    return r;
  };
  const r=await prepared(),sid=randomUUID();
  const before=await value(admin,"select clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'");
  assert.equal(await publish(a,sid,r.file_id),sid);
  const second=await prepared(b,bId),sid2=randomUUID();await publish(b,sid2,second.file_id);
  const after=await value(admin,"select clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'");
  let page=await list();assert.equal(page.items.length,2);
  const first=page.items.find(s=>s.id===sid);
  assert.equal(first.author_id,aId);assert.equal(first.storage_path,r.storage_path);
  assert.ok(new Date(first.created_at)>=before && new Date(first.created_at)<=after);
  assert.equal(new Date(first.expires_at)-new Date(first.created_at),86400000);
  assert.equal((await list(b)).items.length,2);
  assert.equal(await value(admin,'select count(*)::int from public.stories'),2);
  const empty=await event();assert.deepEqual((await list(a,empty)).items,[]);
  for(const client of [c,d,e,f,missing,anon]){
    await denied(list(client));await denied(publish(client,randomUUID(),r.file_id));
  }
  for(const client of [a,b,anon]){
    await denied(client.query('insert into public.stories(id,event_id,author_id,file_id,created_at,expires_at) values($1,$2,$3,$4,localtimestamp,localtimestamp)',[randomUUID(),eid,aId,r.file_id]));
    await denied(client.query('update public.stories set expires_at=localtimestamp'));
    await denied(client.query('delete from public.stories'));
    await denied(target(sid,aId,client));
  }
  assert.deepEqual(await target(sid,bId),await target(sid));
  for(const viewer of [cId,dId,users[4],users[5],null])assert.equal(await target(sid,viewer),null);
  assert.equal(await target(randomUUID()),null);
  await denied(list(f,randomUUID()));
  record('R7-B4-TC-01/03 SQL: organizer and confirmed publish exactly one verified image, server author and 24h timestamps; C/D/E/F/missing/anon denied, direct DML/service target denied; authorized empty event');

  for(const [client,expected] of [[a,1],[b,1],[c,0],[d,0],[e,0],[f,0],[missing,0]]){
    assert.equal((await client.query('select * from public.stories where id=$1',[sid])).rowCount,expected);
    assert.equal((await client.query('select * from public.files where id=$1',[r.file_id])).rowCount,expected);
    for(const op of ['object.get_authenticated','object.sign','object.list','object.get_authenticated_info','object.info','object.get','object.render_image']){
      await client.query("select set_config('test.storage_operation',$1,false)",[op]);
      assert.equal((await client.query('select * from storage.objects where name=$1',[r.storage_path])).rowCount,op==='object.get_authenticated'?expected:0);
    }
  }
  const participant=await value(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[eid,bId]);
  await a.query('select public.remove_participant($1,$2)',[eid,participant]);
  await denied(list(b));await denied(publish(b,sid2,second.file_id));assert.equal(await target(sid,bId),null);
  const request=await value(b,'select public.request_rejoin($1)',[eid]);
  await a.query('select public.resolve_rejoin($1,$2,$3)',[eid,request,'approved']);
  await admin.query("update public.events set visibility='unlisted' where id=$1",[eid]);
  assert.equal((await list(b)).items.length,2);
  await admin.query("update public.event_access_grants set status='revoked',revoked_at=localtimestamp where event_id=$1 and user_id=$2",[eid,bId]);
  await denied(list(b));assert.equal(await target(sid,bId),null);
  await denied(list(e));
  await admin.query("update public.event_access_grants set status='active',revoked_at=null where event_id=$1 and user_id=$2",[eid,bId]);
  await admin.query("update public.events set visibility='public' where id=$1",[eid]);
  await block(a,bId);page=await list(a);
  assert.equal(page.items.find(s=>s.id===sid2).display_name,'Perfil no disponible');
  assert.equal(page.items.find(s=>s.id===sid2).username,'');
  assert.ok(!JSON.stringify(page).includes('birth_date'));
  await unblock(a,bId);
  record('R7-B4-TC-02 SQL: event isolation, table/files/Storage exact GET-only policy scaffold; removed author and revoked hidden grant denied, link-only denied; social blocking masks identity');

  const race=await connect();await role(race,aId);
  const concurrent=await prepared(),cid=randomUUID();
  assert.deepEqual(await Promise.all([publish(a,cid,concurrent.file_id),publish(race,cid,concurrent.file_id)]),[cid,cid]);
  assert.equal(await value(admin,'select count(*)::int from public.stories where id=$1',[cid]),1);
  const original=await value(admin,'select row_to_json(s) from public.stories s where id=$1',[sid]);
  assert.equal(await publish(a,sid,r.file_id),sid);
  assert.deepEqual(await value(admin,'select row_to_json(s) from public.stories s where id=$1',[sid]),original);
  const alternate=await prepared();
  await assert.rejects(publish(a,sid,alternate.file_id),/story_conflict/);
  await assert.rejects(publish(b,sid,second.file_id),/story_conflict/);
  await assert.rejects(publish(a,randomUUID(),r.file_id),/media_conflict/);
  const chat=await prepared(a,aId,eid,'chat'),mid=randomUUID();
  await a.query('select public.send_event_chat_message_v2($1,$2,null,$3)',[eid,mid,chat.file_id]);
  await denied(publish(a,randomUUID(),chat.file_id));
  await denied(a.query('select public.send_event_chat_message_v2($1,$2,null,$3)',[eid,randomUUID(),r.file_id]));
  await assert.rejects(admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[eid,r.file_id]),/media_conflict/);
  await denied(publish(a,randomUUID(),r.file_id,empty));
  await a.query('begin isolation level repeatable read');
  await assert.rejects(publish(a,randomUUID(),alternate.file_id),e=>e.code==='40001');await a.query('rollback');
  record('R7-B4-TC-04 SQL: simultaneous publish/retry commits once; original UUID/payload preserves times; alternate file/author/reused claim/other event/chat/gallery refused; transaction isolation enforced');

  const cross=await prepared(a,aId,empty),local=await prepared(),globalId=randomUUID();
  const collision=await Promise.allSettled([publish(a,globalId,local.file_id),publish(race,globalId,cross.file_id,empty)]);
  assert.equal(collision.filter(r=>r.status==='fulfilled').length,1);
  assert.match(collision.find(r=>r.status==='rejected').reason.message,/story_conflict/);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=any($1::uuid[])',[[local.file_id,cross.file_id]]),1);
  const removalEvent=await event();await b.query('select public.register_for_event($1)',[removalEvent]);
  const removedUpload=await prepared(b,bId,removalEvent),lateB=await connect();await role(lateB,bId);
  await a.query('begin');
  await a.query('select public.remove_participant($1,$2)',[removalEvent,await value(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[removalEvent,bId])]);
  const removedPublish=publish(lateB,randomUUID(),removedUpload.file_id,removalEvent);
  await a.query('commit');await denied(removedPublish);
  record('Global UUID collision across events rolls back losing file/claim; concurrent removal under event lock prevents a waiting author publication');

  const unverified=await prepared(a,aId,eid,'story',false);
  await assert.rejects(publish(a,randomUUID(),unverified.file_id),/image_verification_required/);
  const absent=await prepared();await admin.query('delete from storage.objects where name=$1',[absent.storage_path]);
  await assert.rejects(publish(a,randomUUID(),absent.file_id),/upload_unavailable/);
  const malformed=await prepared();await admin.query("update storage.objects set metadata=jsonb_set(metadata,'{size}','1') where name=$1",[malformed.storage_path]);
  await assert.rejects(publish(a,randomUUID(),malformed.file_id),/invalid_image/);
  const rollback=await prepared(),rid=randomUUID();
  await admin.query(`create function public.test_story_failure() returns trigger language plpgsql as $$ begin raise exception 'injected_final_insert'; end $$;
    create trigger test_story_failure before insert on public.stories for each row execute function public.test_story_failure()`);
  await assert.rejects(publish(a,rid,rollback.file_id),/injected_final_insert/);
  await admin.query('drop trigger test_story_failure on public.stories; drop function public.test_story_failure()');
  assert.equal(await value(admin,'select count(*)::int from public.stories where id=$1',[rid]),0);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=$1',[rollback.file_id]),0);
  assert.equal(await value(admin,'select count(*)::int from planit_private.media_claims where file_id=$1',[rollback.file_id]),0);
  assert.equal((await state(a,rollback)).state,'reserved');await publish(a,rid,rollback.file_id);
  // Reverse integrity: privileged direct mutations still cannot detach a story.
  await assert.rejects(admin.query('delete from public.stories where id=$1',[rid]),/media_conflict/);
  await assert.rejects(admin.query('delete from planit_private.media_claims where file_id=$1',[rollback.file_id]),/media_conflict/);
  await assert.rejects(admin.query('update public.stories set file_id=$1 where id=$2',[alternate.file_id,rid]),/immutable_story/);
  record('Atomic rollback after final insert failure; object retained and retry succeeds; missing/malformed/unverified rejected; reverse claim/story invariants enforced');

  // Deterministic keyset pages, including equal timestamp tie-breaks.
  for(let i=0;i<5;i++){const upload=await prepared();await publish(a,randomUUID(),upload.file_id);}
  await admin.query('alter table public.stories disable trigger stories_guard');
  await admin.query("update public.stories set created_at=t.n,expires_at=t.n+interval '24 hours' from (select clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' n) t where event_id=$1",[eid]);
  await admin.query('alter table public.stories enable trigger stories_guard');
  let cursor=null,ids=[];
  do {page=await list(a,eid,cursor,2);ids.push(...page.items.map(s=>s.id));cursor=page.next_cursor;} while(cursor);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids.length,await value(admin,'select count(*)::int from public.stories where event_id=$1',[eid]));
  await invalid(list(a,eid,{created_at:'2026-10-16T00:00:00'},30));await invalid(list(a,eid,null,51));await invalid(list(a,eid,null,0));
  record('Bounded deterministic keyset pagination and empty next_cursor; partial cursor/out-of-range limit rejected');

  // Event -> participation -> reservation ordering: closure/removal wins lock.
  const late=await prepared();
  await admin.query('begin');await admin.query('select 1 from public.events where id=$1 for update',[eid]);
  const waiting=publish(race,randomUUID(),late.file_id);
  await admin.query('update public.events set cancelled_at=localtimestamp where id=$1',[eid]);await admin.query('commit');
  await assert.rejects(waiting,/event_read_only/);
  assert.ok((await list()).items.length>0);assert.ok(await target(sid));
  assert.equal(await publish(a,sid,r.file_id),sid);
  await admin.query('update public.events set archived_at=localtimestamp where id=$1',[eid]);
  assert.ok((await list()).items.length>0);assert.ok(await target(sid));
  await assert.rejects(publish(a,randomUUID(),late.file_id),/event_read_only/);
  await admin.query("update public.events set cancelled_at=null,archived_at=null,starts_at=localtimestamp-interval '2 days',ends_at=localtimestamp-interval '1 day' where id=$1",[eid]);
  assert.ok((await list()).items.length>0);await assert.rejects(publish(a,randomUUID(),late.file_id),/event_read_only/);
  record('D03 + human confirmation: ended/cancelled/archived deny new publish, preserve authorized stories and identical retry; closure while publish waits is rejected');

  // Controlled admin-only temporal fixture; restore immutable trigger immediately.
  // No runtime clock override or client timestamp input exists in production.
  await admin.query('alter table public.stories disable trigger stories_guard');
  await admin.query("update public.stories set created_at=t.n-interval '23 hours 59 minutes 59 seconds',expires_at=t.n+interval '1 second' from (select clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' n) t where id=$1",[sid]);
  assert.ok(await target(sid));
  await admin.query("update public.stories set created_at=t.n-interval '24 hours',expires_at=t.n from (select clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' n) t where id=$1",[sid]);
  await admin.query('alter table public.stories enable trigger stories_guard');
  assert.ok(!(await list()).items.some(s=>s.id===sid));assert.equal(await target(sid),null);assert.equal(await target(sid,bId),null);
  for(const client of [a,b]){
    await client.query("select set_config('test.storage_operation','object.get_authenticated',false)");
    assert.equal((await client.query('select * from storage.objects where name=$1',[r.storage_path])).rowCount,0);
    assert.equal((await client.query('select * from public.files where id=$1',[r.file_id])).rowCount,0);
    assert.equal((await client.query('select * from public.stories where id=$1',[sid])).rowCount,0);
  }
  assert.equal(await publish(a,sid,r.file_id),sid);assert.equal(await target(sid),null);
  assert.equal(await value(admin,'select count(*)::int from storage.objects where name=$1',[r.storage_path]),1);
  record('TTL server filter independent of GC: expired story/files/object denied to author and confirmed, service target null; retry never renews TTL; physical bytes retained for B6');

  const acl=(await admin.query("select p.proname,p.proconfig,has_function_privilege('anon',p.oid,'execute') as anon_execute from pg_proc p where p.proname in ('publish_event_story','get_event_stories','get_r7_story_image_target','can_read_story','can_read_story_event','guard_r7_story','check_r7_story_trigger')")).rows;
  assert.equal(acl.length,7);assert.ok(acl.every(f=>!f.anon_execute&&f.proconfig.includes('search_path=""')));
  assert.equal(await value(admin,"select relrowsecurity from pg_class where oid='public.stories'::regclass"),true);
  assert.equal((await admin.query("select 1 from pg_policies where schemaname='storage' and cmd='SELECT'")).rowCount,2);
  await writeFile(out+'/inventory.json',JSON.stringify({acl,policies:(await admin.query("select * from pg_policies where tablename in ('stories','objects','files')")).rows},null,2)+'\n');
  record('RLS/ACL/search_path verified; exactly two existing disjoint Storage SELECT policies, no uploader bypass added');
