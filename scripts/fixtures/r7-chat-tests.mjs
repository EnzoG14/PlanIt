  const publish=(client,id,body=null,fid=null,eventId=eid)=>value(client,'select public.send_event_chat_message_v2($1,$2,$3,$4)',[eventId,id,body,fid]);
  const history=(client=a,eventId=eid,before=null)=>client.query('select * from public.get_event_chat_messages_v2($1,$2,$3)',[eventId,before?.created_at??null,before?.id??null]);
  const service=await connect();await service.query('set role service_role');
  const prepared=async(client=a,uid=aId)=>{
    const r=await reserve(client);await store(client,r,uid);
    const t=await value(service,'select public.get_r7_media_validation_target($1,$2)',[uid,r.file_id]);
    await service.query('select public.complete_r7_media_validation($1,$2,$3,$4,$5)',[uid,r.file_id,t.object_id,t.etag,'a'.repeat(64)]);
    return r;
  };
  const image=await prepared();const mid=randomUUID();
  assert.equal(await publish(a,mid,null,image.file_id),mid);
  const combined=await prepared(b,bId),both=randomUUID();
  await publish(b,both,'  Con imagen  ',combined.file_id);
  const text=randomUUID();await publish(a,text,'  Texto  ');
  let rows=(await history()).rows;assert.equal(rows.length,3);
  assert.equal(rows.find(m=>m.id===mid).body,null);
  assert.equal(rows.find(m=>m.id===mid).storage_path,image.storage_path);
  assert.equal(rows.find(m=>m.id===both).body,'Con imagen');
  assert.equal(rows.find(m=>m.id===text).attachment_id,null);
  assert.equal((await history(b)).rowCount,3);
  for(const client of [c,d,e,f,missing,anon]){
    await denied(history(client));await denied(publish(client,randomUUID(),'Forbidden',image.file_id));
    await denied(client.query('insert into public.message_attachments(id,message_id,file_id) values($1,$2,$3)',[randomUUID(),mid,image.file_id]));
    if(![anon,missing].includes(client)){
      assert.equal((await client.query('select * from public.message_attachments')).rowCount,0);
      assert.equal((await client.query('select * from public.files where id=$1',[image.file_id])).rowCount,0);
    }
  }
  for(const client of [a,b,anon])await denied(client.query('select planit_private.register_r7_media($1,$2)',[image.file_id,randomUUID()]));
  await denied(publish(a,randomUUID(),null,combined.file_id));
  await denied(publish(a,randomUUID(),'x',image.file_id,await event()));
  for(const body of [null,'  ','\u00a0\u2003'])await assert.rejects(publish(a,randomUUID(),body),/invalid_message/);
  await assert.rejects(publish(a,randomUUID(),'x'.repeat(2001)),/invalid_message/);
  record('R7-B2-TC-01 SQL: organizer/confirmed text, image-only, combined and history; pending/removed/grant-only/stranger/missing JWT/anon denied; no forged REST table writes (SQL roles)');

  const race=await connect();await role(race,aId);
  assert.deepEqual(await Promise.all([publish(a,mid,null,image.file_id),publish(race,mid,null,image.file_id)]),[mid,mid]);
  const simultaneous=await prepared(),sid=randomUUID();
  assert.deepEqual(await Promise.all([publish(a,sid,null,simultaneous.file_id),publish(race,sid,null,simultaneous.file_id)]),[sid,sid]);
  await assert.rejects(publish(a,mid,'Different',image.file_id),/message_id_conflict/);
  const alternative=await prepared();await assert.rejects(publish(a,mid,null,alternative.file_id),/message_id_conflict/);
  await assert.rejects(publish(b,mid,null,image.file_id),/message_id_conflict/);
  assert.equal(await value(admin,'select count(*)::int from public.messages where id=$1',[sid]),1);
  // Commit succeeded, response discarded: reconnect/retry keeps the same identity.
  const reconnect=await connect();await role(reconnect,aId);
  assert.equal(await publish(reconnect,sid,null,simultaneous.file_id),sid);
  await a.query('begin isolation level repeatable read');
  await assert.rejects(publish(a,randomUUID(),'x'),error=>error.code==='40001');await a.query('rollback');
  record('R7-B2-TC-03 SQL: concurrent initial sends, identical retry/reconnect after commit, changed body/file/author conflict, READ COMMITTED enforced');

  const secondEvent=await event();
  const secondReservation=await value(race,'select public.reserve_event_media_upload($1,$2,$3,$4,$5,$6)',[secondEvent,randomUUID(),randomUUID(),'chat','image/png',1024]);
  await store(race,secondReservation);
  const secondTarget=await value(service,'select public.get_r7_media_validation_target($1,$2)',[aId,secondReservation.file_id]);
  await service.query('select public.complete_r7_media_validation($1,$2,$3,$4,$5)',[aId,secondReservation.file_id,secondTarget.object_id,secondTarget.etag,'a'.repeat(64)]);
  const firstReservation=await prepared(),globalId=randomUUID();
  const globalResults=await Promise.allSettled([publish(a,globalId,null,firstReservation.file_id),publish(race,globalId,null,secondReservation.file_id,secondEvent)]);
  assert.equal(globalResults.filter(r=>r.status==='fulfilled').length,1);
  assert.match(globalResults.find(r=>r.status==='rejected').reason.message,/message_id_conflict/);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=any($1::uuid[])',[[firstReservation.file_id,secondReservation.file_id]]),1);
  record('Global UUID collision across two events is a neutral message_id_conflict with one committed file/message');

  // Force the LAST insert to fail, after files/claim/message were written.
  const rollback=await prepared(),rollbackId=randomUUID();
  await admin.query(`create function public.test_attachment_failure() returns trigger language plpgsql as $$ begin raise exception 'injected_final_insert'; end $$;
    create trigger test_attachment_failure before insert on public.message_attachments for each row execute function public.test_attachment_failure()`);
  await assert.rejects(publish(a,rollbackId,null,rollback.file_id),/injected_final_insert/);
  await admin.query('drop trigger test_attachment_failure on public.message_attachments; drop function public.test_attachment_failure()');
  for(const [table,column,id] of [['messages','id',rollbackId],['files','id',rollback.file_id],['message_attachments','message_id',rollbackId]])
    assert.equal(await value(admin,'select count(*)::int from public.'+table+' where '+column+'=$1',[id]),0);
  assert.equal(await value(admin,'select count(*)::int from planit_private.media_claims where file_id=$1',[rollback.file_id]),0);
  assert.equal((await state(a,rollback)).state,'reserved');
  assert.equal(await value(admin,'select count(*)::int from storage.objects where name=$1',[rollback.storage_path]),1);
  // Retry intact upload; no compensation DELETE after an uncertain response.
  await publish(a,rollbackId,null,rollback.file_id);
  const unverified=await reserve();await store(a,unverified);
  await assert.rejects(publish(a,randomUUID(),null,unverified.file_id),/image_verification_required/);
  const malformed=await prepared();await admin.query("update storage.objects set metadata=jsonb_set(metadata,'{size}','1') where name=$1",[malformed.storage_path]);
  await assert.rejects(publish(a,randomUUID(),null,malformed.file_id),/invalid_image/);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=$1',[malformed.file_id]),0);
  const absent=await prepared();await admin.query('delete from storage.objects where name=$1',[absent.storage_path]);
  await assert.rejects(publish(a,randomUUID(),null,absent.file_id),/upload_unavailable/);
  const stories=await reserve(a,randomUUID(),randomUUID(),'story');await denied(publish(a,randomUUID(),null,stories.file_id));
  await assert.rejects(publish(a,randomUUID(),null,image.file_id),/media_conflict/);
  record('R7-B2-TC-04 SQL: injected final insert rolls back message/file/claim/attachment/reservation; Storage object retained and retry succeeds; unverified/missing/malformed/reused/story upload rejected');

  const direct=await dm(a,bId);const dmId=randomUUID();await send(a,direct,dmId,'DM conservado');
  await assert.rejects(send(a,direct,randomUUID(),null));
  await denied(publish(a,randomUUID(),null,image.file_id,direct));
  await assert.rejects(admin.query('insert into public.messages(id,conversation_id,sender_id,body) values($1,$2,$3,null)',[randomUUID(),direct,aId]),e=>e.code==='23514');
  const oldId=randomUUID();await a.query('select public.send_event_chat_message($1,$2,$3)',[eid,oldId,'Legacy']);
  assert.equal(await value(a,'select public.send_event_chat_message($1,$2,$3)',[eid,oldId,'Legacy']),oldId);
  assert.ok((await a.query('select * from public.get_event_chat_messages($1)',[eid])).rows.every(m=>m.body!==null));
  assert.equal(await value(admin,"select count(*)::int from public.notifications where type='direct_message' and id=$1",[dmId]),1);
  await send(a,direct,dmId,'DM conservado');
  assert.equal(await value(admin,"select count(*)::int from public.notifications where id=$1",[dmId]),1);
  assert.equal(await value(admin,"select count(*)::int from public.notifications where conversation_id=$1",[conversation]),0);
  record('R7-B2-TC-02 SQL: DM text notification single, NULL DM/direct media rejected, R2 text API/retry and v1 non-null history preserved');

  // Identical timestamps exercise the UUID tie breaker across the 51 lookahead.
  for(let i=0;i<55;i++)await publish(a,randomUUID(),'Page '+i);
  await admin.query("update public.messages set created_at='2026-10-16 10:00' where conversation_id=$1",[conversation]);
  const page1=(await history()).rows;assert.equal(page1.length,51);
  const page2=(await history(a,eid,page1.at(-1))).rows;
  const all=[...page1,...page2];assert.equal(new Set(all.map(m=>m.id)).size,all.length);
  assert.equal(all.length,await value(admin,'select count(*)::int from public.messages where conversation_id=$1',[conversation]));
  await assert.rejects(a.query('select * from public.get_event_chat_messages_v2($1,null,$2)',[eid,mid]),/invalid_cursor/);
  assert.ok(Object.keys(all[0]).every(k=>!['birth_date','sex','email','verified_sha256'].includes(k)));
  record('Versioned projection: equal timestamps, descending UUID cursor, 51 lookahead without duplicates or omissions; social allowlist only');

  const waitForEventLock=async(client)=>{
    const pid=client.processID;
    for(let i=0;i<100;i++){
      if(await value(admin,'select cardinality(pg_blocking_pids($1))>0',[pid]))return;
      await new Promise(r=>setTimeout(r,10));
    }
    assert.fail('Expected an observed PostgreSQL lock wait');
  };
  const revoked=await prepared(b,bId),revokedId=randomUUID();
  await admin.query('begin');await admin.query('select 1 from public.events where id=$1 for update',[eid]);
  const waitingRemoval=publish(b,revokedId,null,revoked.file_id);const removalCheck=denied(waitingRemoval);await waitForEventLock(b);
  await admin.query("update public.event_participations set status='removed' where event_id=$1 and user_id=$2",[eid,bId]);await admin.query('commit');await removalCheck;
  await denied(history(b));await denied(publish(b,both,'Con imagen',combined.file_id));
  assert.equal(await value(admin,'select count(*)::int from public.messages where id=$1',[revokedId]),0);
  const late=await prepared(),lateId=randomUUID();
  await admin.query('begin');await admin.query('select 1 from public.events where id=$1 for update',[eid]);
  const waitingClose=publish(race,lateId,null,late.file_id);const closeCheck=assert.rejects(waitingClose,/chat_read_only/);await waitForEventLock(race);
  await admin.query('update public.events set cancelled_at=localtimestamp where id=$1',[eid]);await admin.query('commit');await closeCheck;
  assert.equal(await publish(a,mid,null,image.file_id),mid);
  assert.equal(await value(admin,'select count(*)::int from public.messages where id=$1',[lateId]),0);
  assert.ok((await history()).rowCount>0);
  record('Concurrent event closure/removal wins event lock; no late inserts; authorized identical retry/history after closure preserved; removed retry denied');
  const acl=(await admin.query(`select p.proname,p.proconfig,has_function_privilege('anon',p.oid,'execute') as anon_execute,
    has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute
    from pg_proc p where p.proname in ('send_event_chat_message_v2','get_event_chat_messages_v2')`)).rows;
  assert.equal(acl.length,2);assert.ok(acl.every(r=>!r.anon_execute&&r.authenticated_execute&&r.proconfig.includes('search_path=""')));
  await writeFile(out+'/api-acl.json',JSON.stringify(acl,null,2)+'\n');
  record('New RPC grants exactly authenticated, empty search_path; no new table/Storage grants or DM media endpoint');
