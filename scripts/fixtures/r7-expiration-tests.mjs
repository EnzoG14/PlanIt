  const claim=(client=service)=>value(client,'select public.claim_r7_story_gc()');
  const gcTarget=(job,client=service)=>value(client,'select public.get_r7_story_gc_target($1,$2)',[job.upload_id,job.lease_token]);
  const complete=(job,client=service)=>value(client,'select public.complete_r7_story_gc($1,$2)',[job.upload_id,job.lease_token]);
  const fail=(job,code='storage_error',client=service)=>value(client,'select public.fail_r7_story_gc($1,$2,$3)',[job.upload_id,job.lease_token,code]);
  const age=async(id,interval='24 hours')=>{
    await admin.query('alter table public.stories disable trigger stories_guard');
    try {await admin.query("update public.stories set created_at=t.n-$2::interval,expires_at=t.n-$2::interval+interval '24 hours' from (select clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' n) t where id=$1",[id,interval]);}
    finally {await admin.query('alter table public.stories enable trigger stories_guard');}
  };
  const make=async()=>{const upload=await prepared(),id=randomUUID();await publish(a,id,upload.file_id);return {upload,id};};
  const live=await make(), expired=await make();
  await age(expired.id,'23 hours 59 minutes 59 seconds');assert.ok(await target(expired.id));
  await a.query("select set_config('test.storage_operation','object.get_authenticated',false)");
  assert.equal((await a.query('select * from storage.objects where name=$1',[expired.upload.storage_path])).rowCount,1);
  assert.equal(await claim(),null);
  await age(expired.id);
  assert.equal(await target(expired.id),null);assert.equal(await target(expired.id,bId),null);
  for(const client of [a,b]){
    for(const zone of ['Pacific/Honolulu','Pacific/Kiritimati']){
      await client.query("select set_config('TimeZone',$1,false)",[zone]);
      assert.ok(!(await list(client)).items.some(s=>s.id===expired.id));
      assert.equal((await client.query('select * from public.stories where id=$1',[expired.id])).rowCount,0);
      assert.equal((await client.query('select * from public.files where id=$1',[expired.upload.file_id])).rowCount,0);
      for(const op of ['object.get_authenticated','object.get','object.sign','object.list','object.info','object.render_image']){
        await client.query("select set_config('test.storage_operation',$1,false)",[op]);
        assert.equal((await client.query('select * from storage.objects where name=$1',[expired.upload.storage_path])).rowCount,0);
      }
    }
  }
  assert.equal(await value(admin,'select count(*)::int from storage.objects where name=$1',[expired.upload.storage_path]),1);
  // Exact equality, deterministic expression-level boundary, no sleep flakiness.
  assert.deepEqual((await admin.query("select t.e > t.e-interval '1 microsecond' before, t.e > t.e exact, t.e > t.e+interval '1 microsecond' after from (select expires_at e from public.stories where id=$1)t",[expired.id])).rows[0],{before:true,exact:false,after:false});
  record('TC-01/02 SQL: positive before 24h, strict equality predicate, expired RPC/RLS/reader target denied to author and member before GC; timezone skew and all Storage operations denied (SQL scaffold)');

  for(const client of [a,b,anon,missing]){
    await denied(claim(client));
    const job={upload_id:expired.upload.file_id,lease_token:randomUUID()};
    await denied(gcTarget(job,client));await denied(complete(job,client));await denied(fail(job,'storage_error',client));
    await denied(client.query('select * from planit_private.story_gc_jobs'));
  }
  const job=await claim();assert.equal(job.upload_id,expired.upload.file_id);
  assert.equal(await claim(),null);assert.ok(await gcTarget(job));
  assert.equal(await complete(job),false); // Object remains; cannot discard references.
  assert.equal(await fail(job),true);assert.equal(await gcTarget(job),null);assert.equal(await claim(),null);
  assert.equal(await value(admin,'select count(*)::int from public.stories where id=$1',[expired.id]),1);
  await admin.query("update planit_private.story_gc_jobs set next_attempt_at=localtimestamp-interval '1 day'");
  const retry=await claim();assert.notEqual(retry.lease_token,job.lease_token);
  assert.equal(await complete(job),false);assert.equal(await fail(job),false);
  await invalid(fail(retry,'private error text must never persist'));
  // Test scaffold only: emulates successful Storage API metadata removal.
  await admin.query('delete from storage.objects where name=$1',[expired.upload.storage_path]);
  await admin.query(`create function public.test_gc_failure() returns trigger language plpgsql as $$ begin raise exception 'gc_injected_failure'; end $$;
    create trigger test_gc_failure before delete on public.files for each row execute function public.test_gc_failure()`);
  await assert.rejects(complete(retry),/gc_injected_failure/);
  assert.equal(await value(admin,'select count(*)::int from public.stories where id=$1',[expired.id]),1);
  assert.equal(await value(admin,'select count(*)::int from planit_private.media_claims where file_id=$1',[expired.upload.file_id]),1);
  await admin.query('drop trigger test_gc_failure on public.files;drop function public.test_gc_failure()');
  assert.equal(await complete(retry),true);assert.equal(await complete(retry),false);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=$1',[expired.upload.file_id]),0);
  assert.equal(await value(admin,"select state from planit_private.media_uploads where id=$1",[expired.upload.file_id]),'deleted');
  await assert.rejects(publish(a,expired.id,expired.upload.file_id),/media_conflict/);
  await denied(store(a,expired.upload));
  record('TC-03/04 SQL: service-only ACL, retry/backoff and stale token; Storage metadata required absent; partial DB failure rolls back references; retry completes atomically, immutable tombstone prevents reuse');

  const chat=await prepared(a,aId,eid,'chat'),mid=randomUUID();
  await a.query('select public.send_event_chat_message_v2($1,$2,$3,$4)',[eid,mid,'Keep image and text',chat.file_id]);
  const text=randomUUID();await a.query('select public.send_event_chat_message($1,$2,$3)',[eid,text,'Keep text']);
  const direct=await dm(a,bId);await send(a,direct);
  const legacy=aId+'/'+eid+'/gc-keep.png';
  await store(a,{storage_path:legacy});await a.query('select public.add_event_image($1,$2)',[eid,legacy]);
  const avatar=aId+'/gc-avatar.png';
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{\"mimetype\":\"image/png\",\"size\":1024,\"cacheControl\":\"no-store\"}')",[avatar,aId]);
  await a.query('select public.set_my_avatar($1)',[avatar]);
  const orphan=await prepared(); // Unpublished: separate workflow, never claimed.
  const snapshot=await value(admin,"select jsonb_build_object('messages',(select jsonb_agg(to_jsonb(m) order by id) from public.messages m),'inbox',(select jsonb_agg(to_jsonb(n) order by id) from public.notifications n),'gallery',(select jsonb_agg(to_jsonb(i) order by id) from public.event_images i),'avatar',(select avatar_file_id from public.profiles where id=$1))",[aId]);
  const x=await make(),y=await make();await age(x.id);await age(y.id);
  const service2=await connect();await service2.query('set role service_role');
  const jobs=await Promise.all([claim(service),claim(service2)]);
  assert.equal(new Set(jobs.map(j=>j.upload_id)).size,2);assert.equal(await claim(),null);
  // Existing cross-domain guards also hold while a cleanup lease is active.
  await assert.rejects(admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,1)',[eid,x.upload.file_id]),/media_conflict/);
  await assert.rejects(admin.query('update public.profiles set avatar_file_id=$1 where id=$2',[x.upload.file_id,aId]),e=>e.code==='23514');
  await assert.rejects(publish(a,randomUUID(),x.upload.file_id),/media_conflict/);
  for(const j of jobs){await admin.query('delete from storage.objects where name=$1',[j.storage_path]);assert.equal(await complete(j),true);}
  assert.deepEqual(await value(admin,"select jsonb_build_object('messages',(select jsonb_agg(to_jsonb(m) order by id) from public.messages m),'inbox',(select jsonb_agg(to_jsonb(n) order by id) from public.notifications n),'gallery',(select jsonb_agg(to_jsonb(i) order by id) from public.event_images i),'avatar',(select avatar_file_id from public.profiles where id=$1))",[aId]),snapshot);
  for(const p of [live.upload.storage_path,chat.storage_path,legacy,orphan.storage_path,avatar])assert.equal(await value(admin,'select count(*)::int from storage.objects where name=$1',[p]),1);
  record('TC-03/04 SQL: simultaneous workers disjoint, late publication/gallery/avatar references rejected during lease; active stories, chat image/text, DM, inbox, gallery, avatar and orphan bytes unchanged');

  const crash=await make();await age(crash.id);const abandoned=await claim();
  await admin.query("update planit_private.story_gc_jobs set lease_until=localtimestamp-interval '1 day' where upload_id=$1",[abandoned.upload_id]);
  const recovered=await claim();assert.equal(recovered.upload_id,abandoned.upload_id);assert.notEqual(recovered.lease_token,abandoned.lease_token);
  assert.equal(await complete(abandoned),false);assert.equal(await gcTarget(abandoned),null);
  // Changed storage identity is quarantined rather than deleted.
  await admin.query('update storage.objects set id=$1 where name=$2',[randomUUID(),crash.upload.storage_path]);
  assert.equal(await gcTarget(recovered),null);assert.equal(await complete(recovered),false);
  assert.equal(await value(admin,'select count(*)::int from public.stories where id=$1',[crash.id]),1);
  const acl=(await admin.query("select p.proname,p.proconfig,has_function_privilege('anon',p.oid,'execute') a,has_function_privilege('authenticated',p.oid,'execute') u,has_function_privilege('service_role',p.oid,'execute') s from pg_proc p where p.proname in ('story_gc_target','claim_r7_story_gc','get_r7_story_gc_target','complete_r7_story_gc','fail_r7_story_gc')")).rows;
  assert.equal(acl.length,5);assert.ok(acl.every(p=>!p.a&&!p.u&&p.proconfig.includes('search_path=""')));
  assert.ok(acl.filter(p=>p.proname!=='story_gc_target').every(p=>p.s));
  assert.equal(await value(admin,"select relrowsecurity from pg_class where oid='planit_private.story_gc_jobs'::regclass"),true);
  await writeFile(out+'/inventory.json',JSON.stringify({acl},null,2));
  record('Crash lease recovery and stale ACK fencing; replaced object quarantined; job RLS and least-privilege ACL/search_path verified');
