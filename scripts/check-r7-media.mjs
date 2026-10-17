import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the established isolated, real PostgreSQL bootstrap and shutdown, not
// its social tests. Storage/auth remain explicitly labelled SQL scaffolds.
const source = (await readFile('scripts/check-r5-social.mjs', 'utf8')).replace(/\r\n/g, '\n')
const start = "  assert.equal((await a.query('select * from public.profiles')).rowCount, 1)"
assert.equal(source.split(start).length, 2)
let bootstrap = source.slice(0, source.indexOf(start))
bootstrap = bootstrap.replace('length: 4', 'length: 6')
bootstrap = bootstrap.replace("const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-1'", "const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r7-block-1/sql'")
bootstrap = bootstrap.replace('const files = (await readdir', () => `await admin.query(\`alter table storage.objects add unique(bucket_id,name);
  create function storage.allow_only_operation(text) returns boolean language sql stable as $$
    select coalesce(current_setting('test.storage_operation',true) = $1,false) $$;\`)
  const files = (await readdir`)
const tests = String.raw`
  record('R7-B1-TC-01: all versioned migrations replayed from zero on real PostgreSQL');
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
  const cat=await value(admin,'select id from public.categories limit 1');
  const event=async()=>value(admin,"insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity) values($1,$2,'Media fixture','Fixture',localtimestamp+interval '1 day',localtimestamp+interval '2 days','Fixture',0,0,10) returning id",[aId,cat]);
  const eid=await event();
  await b.query('select public.register_for_event($1)',[eid]);
  const e=await connect(),f=await connect();await role(e,users[4]);await role(f,users[5]);
  for(const [client,uid] of [[c,cId],[d,dId]]){
    await client.query('select public.register_for_event($1)',[eid]);
    const pid=await value(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[eid,uid]);
    await a.query('select public.remove_participant($1,$2)',[eid,pid]);
  }
  await c.query('select public.request_rejoin($1)',[eid]);
  await admin.query('insert into public.event_access_grants(event_id,user_id) values($1,$2)',[eid,users[4]]);
  const conversation=await value(admin,'select id from public.conversations where event_id=$1',[eid]);
  const reserve=(client=a,attempt=randomUUID(),fid=randomUUID(),purpose='chat',mime='image/png',size=1024)=>
    value(client,'select public.reserve_event_media_upload($1,$2,$3,$4,$5,$6)',[eid,attempt,fid,purpose,mime,size]);
  const store=(client,r,owner=aId,metadata={mimetype:'image/png',size:1024,cacheControl:'no-store'})=>
    client.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[r.storage_path,owner,metadata]);
  const state=(client,r)=>value(client,'select public.get_event_media_upload_state($1)',[r.file_id]);
  const r=await reserve();
  assert.deepEqual(await reserve(a,r.attempt_id,r.file_id),r);
  await assert.rejects(reserve(a,r.attempt_id,r.file_id,'chat','image/png',1025),/media_conflict/);
  await assert.rejects(reserve(a,randomUUID(),r.file_id),/media_conflict/);
  for(const client of [c,d,e,f,missing,anon])await denied(reserve(client));
  for(const [mime,size] of [['image/gif',1024],['image/png',0],['image/png',5242881]])await invalid(reserve(a,randomUUID(),randomUUID(),'chat',mime,size));
  const other=await reserve(b);
  await denied(store(a,other));
  await denied(store(a,r,bId));
  await denied(store(a,r,aId,{mimetype:'image/jpeg',size:1024,cacheControl:'no-store'}));
  await denied(store(a,r,aId,{mimetype:'image/png',size:999,cacheControl:'no-store'}));
  await denied(store(a,r,aId,{mimetype:'image/png',size:1024,cacheControl:'max-age=3600'}));
  await store(a,r);
  assert.equal((await state(a,r)).uploaded,true);
  await denied(state(b,r));
  await assert.rejects(store(a,r),e=>e.code==='23505');
  assert.equal((await a.query('update storage.objects set metadata=metadata where name=$1',[r.storage_path])).rowCount,0);
  assert.equal((await a.query('delete from storage.objects where name=$1',[r.storage_path])).rowCount,0);
  for(const op of ['object.get_authenticated','object.sign','object.list','object.info','object.get']){
    await a.query("select set_config('test.storage_operation',$1,false)",[op]);
    assert.equal((await a.query('select * from storage.objects where name=$1',[r.storage_path])).rowCount,0);
  }
  record('Reservation UUID/payload retry, conflict, membership, MIME/size/cache/owner negatives; unpublished uploader GET/sign/list denied (SQL operation scaffold)');

  for(const client of [a,b,anon]){
    await denied(client.query('insert into public.messages(id,conversation_id,sender_id,body) values($1,$2,$3,null)',[randomUUID(),conversation,aId]));
    await denied(client.query('insert into public.message_attachments(id,message_id,file_id) values($1,$2,$3)',[randomUUID(),randomUUID(),r.file_id]));
    await denied(client.query('select planit_private.register_r7_media($1,$2)',[r.file_id,randomUUID()]));
    await denied(client.query('select * from planit_private.media_uploads'));
  }
  await assert.rejects(a.query("insert into public.files(bucket_name,storage_path,mime_type,size_bytes) values('event_media',$1,'image/png',1024)",[r.storage_path]),e=>['42501','23514'].includes(e.code));
  const textId=randomUUID();
  await a.query('select public.send_event_chat_message($1,$2,$3)',[eid,textId,'Texto conservado']);
  assert.equal(await value(a,'select public.send_event_chat_message($1,$2,$3)',[eid,textId,'Texto conservado']),textId);
  const mid=randomUUID();
  await admin.query('begin');
  await assert.rejects(admin.query('select planit_private.register_r7_media($1,$2)',[r.file_id,mid]),/image_verification_required/);
  await admin.query('rollback');
  // Trusted validator is not implemented by B1's permitted SQL/client paths.
  // Explicit local attestation fixture, never evidence of byte validation.
  const service=await connect();await service.query('set role service_role');
  const target=await value(service,'select public.get_r7_media_validation_target($1,$2)',[aId,r.file_id]);
  assert.equal(target.file_id,r.file_id);
  const attest=(client,oid=target.object_id,digest='a'.repeat(64))=>value(client,'select public.complete_r7_media_validation($1,$2,$3,$4,$5)',[aId,r.file_id,oid,target.etag,digest]);
  await denied(attest(a));await denied(attest(anon));await denied(attest(service,randomUUID()));
  assert.equal(await attest(service),true);assert.equal(await attest(service),true);
  await assert.rejects(attest(service,target.object_id,'b'.repeat(64)),/media_conflict/);
  // Trusted fixture exercises B1's private primitive in one transaction. This
  // is not the B2 RPC implementation and cannot be invoked by a user role.
  const publish=async(r,id=mid,body=null)=>{
    await admin.query('begin');
    try{
      await admin.query('select planit_private.register_r7_media($1,$2)',[r.file_id,id]);
      await admin.query('insert into public.messages(id,conversation_id,sender_id,body) values($1,$2,$3,$4)',[id,conversation,aId,body]);
      await admin.query('insert into public.message_attachments(id,message_id,file_id) values($1,$2,$3)',[randomUUID(),id,r.file_id]);
      await admin.query('commit');
    }catch(e){await admin.query('rollback');throw e;}
  };
  await publish(r);
  assert.equal((await a.query('select * from public.get_event_chat_messages($1)',[eid])).rowCount,1);
  for(const client of [a,b,c,d,e,f,missing]){
    const expected=[a,b].includes(client)?1:0;
    assert.equal((await client.query('select * from public.message_attachments where message_id=$1',[mid])).rowCount,expected);
    assert.equal((await client.query('select * from public.files where id=$1',[r.file_id])).rowCount,expected);
    for(const op of ['object.get_authenticated','object.sign','object.list','object.info','object.get','object.get_authenticated_info']){
      await client.query("select set_config('test.storage_operation',$1,false)",[op]);
      assert.equal((await client.query('select * from storage.objects where name=$1',[r.storage_path])).rowCount,op==='object.get_authenticated'?expected:0);
    }
  }
  await b.query('select public.leave_event($1)',[eid]);
  assert.equal((await b.query('select * from public.files where id=$1',[r.file_id])).rowCount,0);
  await b.query('select public.register_for_event($1)',[eid]);
  await assert.rejects(admin.query('delete from public.files where id=$1',[r.file_id]),e=>['23503','23001'].includes(e.code));
  await assert.rejects(admin.query('delete from public.message_attachments where message_id=$1',[mid]),e=>e.code==='23514');
  await admin.query("update public.messages set body='Texto e imagen' where id=$1",[mid]);
  await assert.rejects(admin.query('delete from public.message_attachments where message_id=$1',[mid]),e=>e.code==='23514');
  await assert.rejects(admin.query('delete from planit_private.media_claims where file_id=$1',[r.file_id]),e=>e.code==='23514');
  await assert.rejects(admin.query("update planit_private.media_uploads set state='reserved' where id=$1",[r.file_id]),e=>e.code==='23514');
  await assert.rejects(admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[eid,r.file_id]),e=>e.code==='23514');
  await assert.rejects(admin.query('update public.profiles set avatar_file_id=$1 where id=$2',[r.file_id,aId]),e=>e.code==='23514');
  await assert.rejects(admin.query('insert into public.messages(id,conversation_id,sender_id,body) values($1,$2,$3,null)',[randomUUID(),conversation,aId]),e=>e.code==='23514');
  const direct=await dm(a,bId);
  await send(a,direct);
  await assert.rejects(send(a,direct,randomUUID(),null));
  await assert.rejects(admin.query('insert into public.messages(id,conversation_id,sender_id,body) values($1,$2,$3,null)',[randomUUID(),direct,aId]),e=>e.code==='23514');
  await assert.rejects(admin.query('update public.messages set conversation_id=$1 where id=$2',[direct,mid]),e=>e.code==='23514');
  record('Image-only commit, text+image, v1 text/retry and DM preserved; attachment/claim deletion and cross-domain reassignment rejected, FK RESTRICT and direct DML denied');

  const story=await reserve(a,randomUUID(),randomUUID(),'story');await store(a,story);
  assert.equal((await a.query('select * from storage.objects where name=$1',[story.storage_path])).rowCount,0);
  // Validation is now enforced before cross-domain consistency. Exercise both
  // gates, so the missing attestation cannot mask a broken story/chat guard.
  await assert.rejects(publish(story,randomUUID()),/image_verification_required/);
  const storyTarget=await value(service,'select public.get_r7_media_validation_target($1,$2)',[aId,story.file_id]);
  await value(service,'select public.complete_r7_media_validation($1,$2,$3,$4,$5)',[aId,story.file_id,storyTarget.object_id,storyTarget.etag,'c'.repeat(64)]);
  await assert.rejects(publish(story,randomUUID()),/media_conflict/);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=$1',[story.file_id]),0);
  const broken=await reserve();
  await store(admin,broken,aId,{mimetype:'image/png',size:1,cacheControl:'no-store'});
  await admin.query("update planit_private.media_uploads set verified_sha256=repeat('b',64),verified_at=localtimestamp,verified_object_id=(select id from storage.objects where name=$2) where id=$1",[broken.file_id,broken.storage_path]);
  await assert.rejects(publish(broken,randomUUID()),/invalid_image/);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=$1',[broken.file_id]),0);
  assert.equal((await value(admin,'select state from planit_private.media_uploads where id=$1',[broken.file_id])),'reserved');
  record('B1 story namespace fail-closed; malformed stored metadata publication rolls back all files/claims/domain rows');

  // Preserve gallery/avatar and sharing of legacy files.
  const legacy=aId+'/'+eid+'/legacy.png';
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,'{\"mimetype\":\"image/png\",\"size\":1024}')",[legacy,aId]);
  await a.query('select public.add_event_image($1,$2)',[eid,legacy]);
  const lf=await value(admin,'select id from public.files where storage_path=$1',[legacy]);
  const eid2=await event();
  await admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[eid2,lf]);
  assert.equal((await c.query('select * from storage.objects where name=$1',[legacy])).rowCount,1);
  const avatar=aId+'/avatar.png';
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{\"mimetype\":\"image/png\",\"size\":1024,\"cacheControl\":\"no-store\"}')",[avatar,aId]);
  await a.query('select public.set_my_avatar($1)',[avatar]);
  assert.equal((await a.query('select * from storage.objects where name=$1',[avatar])).rowCount,1);
  const policies=(await admin.query("select policyname,cmd,qual,with_check from pg_policies where schemaname='storage' order by policyname")).rows;
  assert.equal(policies.filter(p=>p.cmd==='SELECT').length,2);
  record('R7-B1-TC-03 SQL: gallery/avatar legacy access and shared gallery references preserved; exactly two SELECT policies (event_media and avatars), no extra permissive OR');

  const raceA=await connect();await role(raceA,aId);
  const rid=randomUUID(),rfid=randomUUID();
  const concurrent=await Promise.all([reserve(a,rid,rfid),reserve(raceA,rid,rfid)]);
  assert.deepEqual(concurrent[0],concurrent[1]);
  await admin.query('begin');await admin.query('select 1 from public.events where id=$1 for update',[eid]);
  const waiting=reserve(raceA);
  await admin.query('update public.events set cancelled_at=localtimestamp where id=$1',[eid]);await admin.query('commit');
  await assert.rejects(waiting,/event_read_only/);
  assert.equal((await a.query('select * from public.get_event_chat_messages($1)',[eid])).rowCount,2);
  await assert.rejects(reserve(),/event_read_only/);
  record('R7-B1-TC-04 SQL: simultaneous retry yields one reservation; event closure wins under lock and late reserve rejected; historical chat retained');
  const inventory=(await admin.query("select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='planit_private' and c.relname in ('media_uploads','media_claims')) or (n.nspname='public' and c.relname='message_attachments')")).rows;
  assert.equal(inventory.length,3);assert.ok(inventory.every(t=>t.relrowsecurity));
  const acl=(await admin.query("select p.proname,has_function_privilege('anon',p.oid,'execute') as anon_execute,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like '%r7%' or p.proname in ('reserve_event_media_upload','get_event_media_upload_state')")).rows;
  assert.ok(acl.every(f=>!f.anon_execute && f.proconfig?.includes('search_path=\"\"')));
  await writeFile(out+'/inventory.json',JSON.stringify({inventory,acl,policies},null,2)+'\n');
  record('RLS enabled from creation, anon EXECUTE revoked, empty search_path verified on R7 functions');
`
const cleanup = source.slice(source.indexOf('} catch (error) {\n  failure ='))
  .replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'5adf8e4',branch:'codex/r7-block-1'")
const temp = 'scripts/.r7-media-run.local.mjs'
await writeFile(temp, bootstrap + tests + cleanup)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [temp], {
    windowsHide: true, timeout: 180000, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PLANIT_TEST_TOOLS_DIR: process.env.PLANIT_TEST_TOOLS_DIR ?? '../.participation-test-tools.local/node_modules' },
  })
  console.log(stdout); if (stderr) console.error(stderr)
} catch (error) { console.error(error.stdout, error.stderr); throw error }
finally { await unlink(temp) }
