import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/lifecycle-${Date.now()}`)
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r))
const clients = [], results = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002', stranger = '20000000-0000-4000-8000-000000000003'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect(identity) {
  const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000, query_timeout: 10000 }); await c.connect(); clients.push(c); await c.query("set statement_timeout='8s'")
  if (identity) { await c.query("select set_config('request.jwt.claim.sub',$1,false)", [identity]); await c.query('set role authenticated') }
  return c
}
try {
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  const admin = await connect(), version = (await admin.query('select version()')).rows[0].version
  await admin.query(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage; create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,storage to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb,unique(bucket_id,name));
    alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
    create function storage.allow_only_operation(text) returns boolean language sql stable as $$ select false $$;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$;`)
  for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  for (const id of [owner, guest, stranger]) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  const a = await connect(owner), a2 = await connect(owner), b = await connect(guest), c = await connect(stranger), anon = await connect(), missing = await connect()
  await anon.query('set role anon'); await missing.query('set role authenticated')
  const create = async (author = owner) => {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [author])
    return (await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      select id,'After primaveral','Fixture SQL','2099-10-12 20:00','2099-10-12 23:00','Buenos Aires',-34.6,-58.4,80 from public.categories limit 1 returning id`)).rows[0].id
  }
  const action = (client, id, name = 'cancel') => client.query(`select public.${name}_event($1) as id`, [id])
  const snapshot = async id => (await admin.query(`select to_jsonb(e) as event,
      (select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') from public.event_participations p where p.event_id=e.id) as participations,
      (select coalesce(jsonb_agg(to_jsonb(h) order by h.id),'[]') from public.participation_history h join public.event_participations p on p.id=h.participation_id where p.event_id=e.id) as history,
      (select coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]') from public.event_images i where i.event_id=e.id) as images,
      (select coalesce(jsonb_agg(to_jsonb(f) order by f.id),'[]') from public.files f join public.event_images i on i.file_id=f.id where i.event_id=e.id) as files,
      (select coalesce(jsonb_agg(to_jsonb(m) order by m.id),'[]') from public.messages m join public.conversations c on c.id=m.conversation_id where c.event_id=e.id) as messages,
      (select to_jsonb(c) from public.conversations c where c.event_id=e.id) as conversation from public.events e where e.id=$1`, [id])).rows[0]
  const scalar = async (client, sql, args=[]) => Object.values((await client.query(sql,args)).rows[0])[0]
  const op = async (client,id,request,kind) => scalar(client,'select public.get_event_operation($1,$2,$3)',[request,id,kind])
  const remove = (client,id,request=randomUUID()) => scalar(client,'select public.delete_event($1,$2)',[id,request])
  const category = await scalar(admin,'select id from public.categories limit 1')
  const reactArgs = (id,request) => [id,request,'Reprogramado','Fixture actualizado','2099-11-12 20:00','2099-11-12 23:00',category,2,'Buenos Aires',-34.6,-58.4,'Centro','public']
  const reactivate = (client,args) => scalar(client,'select public.reactivate_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',args)
  const id = await create(), other = await create(stranger)
  await b.query('select public.register_for_event($1)',[id])
  await c.query('select public.register_for_event($1)',[id])
  const removed = await scalar(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[id,stranger])
  await a.query('select public.remove_participant($1,$2)',[id,removed])
  await c.query('select public.request_rejoin($1)',[id])
  await b.query('select public.send_event_chat_message($1,$2,$3)',[id,randomUUID(),'Historial conservado'])
  await admin.query("insert into public.event_access_grants(event_id,user_id,status,revoked_at) values($1,$2,'revoked',clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')",[id,stranger])
  await action(a,id,'archive')
  const before=await snapshot(id), request=randomUUID(), args=reactArgs(id,request)
  for(const client of [b,c,anon,missing]) await assert.rejects(reactivate(client,args),e=>e.code==='42501')
  await assert.rejects(reactivate(a,reactArgs(other,randomUUID())),e=>e.code==='42501')
  await assert.rejects(reactivate(a,[...args.slice(0,4),'2020-01-01',...args.slice(5)]),/start_not_future/)
  await assert.rejects(reactivate(a,[...args.slice(0,5),args[4],...args.slice(6)]),/end_before_start/)
  await assert.rejects(reactivate(a,[...args.slice(0,7),0,...args.slice(8)]),e=>e.code==='23514')
  assert.deepEqual(await snapshot(id),before)
  assert.equal(await op(a,id,request,'reactivate'),false)
  check('Owner, anonymous/missing session, foreign event and date/capacity validation; failures roll back all transitions')
  assert.equal(await reactivate(a,args),id)
  assert.equal(await op(a,id,request,'reactivate'),true)
  assert.equal(await op(b,id,request,'reactivate'),false)
  const after=await snapshot(id)
  assert.equal(after.event.archived_at,null);assert.equal(after.event.cancelled_at,null)
  for(const key of ['messages','conversation','images','files'])assert.deepEqual(after[key],before[key])
  assert.equal(after.participations.find(p=>p.user_id===guest).status,'cancelled')
  assert.equal(after.participations.find(p=>p.user_id===stranger).status,'removed')
  assert.equal(after.history.filter(h=>h.reason==='event_reactivation').length,1)
  assert.equal(await scalar(admin,"select status from public.event_access_grants where event_id=$1 and user_id=$2",[id,stranger]),'revoked')
  assert.equal(await scalar(admin,"select count(*)::int from public.event_rejoin_requests where participation_id=$1 and status='pending'",[removed]),1)
  await assert.rejects(b.query('select public.send_event_chat_message($1,$2,$3)',[id,randomUUID(),'Sin reinscripción']),/chat_unavailable/)
  await b.query('select public.register_for_event($1)',[id])
  await b.query('select public.send_event_chat_message($1,$2,$3)',[id,randomUUID(),'Reinscrito'])
  await reactivate(a,args)
  assert.equal(await scalar(admin,'select status from public.event_participations where event_id=$1 and user_id=$2',[id,guest]),'confirmed')
  await assert.rejects(reactivate(a,[...args.slice(0,2),'Otro título',...args.slice(3)]),/operation_conflict/)
  await assert.rejects(reactivate(a,reactArgs(id,randomUUID())),/event_not_archived/)
  check('Same ID/history/chat retained; fresh registration required, expulsions/revocations/pending requests retained; lost-ACK replay cannot reset new registrations')
  for(const client of [b,c,anon,missing])await assert.rejects(remove(client,id),e=>e.code==='42501')
  await assert.rejects(remove(a,id),/event_not_closed/)
  await assert.rejects(a.query('delete from public.events where id=$1',[id]),e=>e.code==='42501')
  check('Deletion restricted to owner of closed event; generic browser DELETE remains denied')
  // Full media fixtures use SQL Storage/Auth scaffolding and trusted attestation,
  // not a claim of deployed image decoding or actual Storage HTTP deletion.
  const media=await create()
  await b.query('select public.register_for_event($1)',[media])
  const service=await connect();await service.query('set role service_role')
  const prepare=async(purpose,publish=true)=>{
    const r=await scalar(a,'select public.reserve_event_media_upload($1,$2,$3,$4,$5,$6)',[media,randomUUID(),randomUUID(),purpose,'image/png',100])
    await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[r.storage_path,owner,{mimetype:'image/png',size:100,cacheControl:'no-store'}])
    if(publish){
      const t=await scalar(service,'select public.get_r7_media_validation_target($1,$2)',[owner,r.file_id])
      await service.query('select public.complete_r7_media_validation($1,$2,$3,$4,$5)',[owner,r.file_id,t.object_id,t.etag,'a'.repeat(64)])
      if(purpose==='story')await a.query('select public.publish_event_story($1,$2,$3)',[media,randomUUID(),r.file_id])
      else await a.query('select public.send_event_chat_message_v2($1,$2,$3,$4)',[media,randomUUID(),null,r.file_id])
    }
    return r
  }
  const chat=await prepare('chat'),story=await prepare('story'),staging=await prepare('story',false)
  const gallery=`${owner}/${media}/fixture.png`
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[gallery,owner,{mimetype:'image/png',size:100}])
  await a.query('select public.add_event_image($1,$2)',[media,gallery])
  // Retain a shared gallery reference in another event owned by the same person.
  const shared=await create(), sharedFile=await scalar(admin,'select file_id from public.event_images where event_id=$1',[media])
  await a.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[shared,sharedFile])
  const legacy=`${owner}/legacy.png`
  await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[legacy,owner,{mimetype:'image/png',size:100}])
  const legacyFile=await scalar(a,"insert into public.files(bucket_name,storage_path,mime_type,size_bytes) values('event_media',$1,'image/png',100) returning id",[legacy])
  await a.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,1)',[media,legacyFile])
  const loose=`${owner}/${media}/loose.png`
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[loose,owner,{mimetype:'image/png',size:100}])
  const unlinked=`${owner}/${media}/unlinked.png`
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[unlinked,owner,{mimetype:'image/png',size:100}])
  await a.query("insert into public.files(bucket_name,storage_path,mime_type,size_bytes) values('event_media',$1,'image/png',100)",[unlinked])
  const subscription=randomUUID()
  await admin.query("insert into public.push_subscriptions(id,user_id,endpoint,p256dh,auth) values($1,$2,'https://push.example.invalid/fixture','fixture','fixture')",[subscription,owner])
  await admin.query('insert into planit_private.story_gc_jobs(upload_id) values($1)',[story.file_id])
  const notice=await scalar(admin,"insert into public.notifications(recipient_id,event_id,type,title) values($1,$2,'event_full','Cupo completo') returning id",[owner,media])
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.push_jobs where notification_id=$1',[notice]),1)
  await action(a,media,'cancel')
  const deletion=randomUUID()
  await a.query('begin');await remove(a,media,deletion);await a.query('rollback')
  assert.equal(await scalar(admin,'select count(*)::int from public.events where id=$1',[media]),1)
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.event_media_gc_jobs where event_id=$1',[media]),0)
  assert.equal(await op(a,media,deletion,'delete'),false)
  assert.equal(await remove(a,media,deletion),media);assert.equal(await remove(a,media,deletion),media)
  assert.equal(await op(a,media,deletion,'delete'),true)
  assert.equal(await op(c,media,deletion,'delete'),false)
  assert.equal(await scalar(admin,'select count(*)::int from public.events where id=$1',[media]),0)
  assert.equal(await scalar(admin,'select count(*)::int from public.notifications where id=$1',[notice]),0)
  assert.equal(await scalar(admin,'select count(*)::int from public.push_subscriptions where id=$1',[subscription]),1)
  assert.equal(await scalar(admin,'select count(*)::int from public.files where id=$1',[sharedFile]),1)
  assert.equal(await scalar(admin,'select count(*)::int from public.event_images where event_id=$1',[shared]),1)
  assert.equal(await scalar(admin,'select count(*)::int from public.files where storage_path=$1',[unlinked]),0)
  for(const table of ['media_uploads','media_claims'])assert.equal(await scalar(admin,`select count(*)::int from planit_private.${table} where event_id=$1`,[media]),0)
  const paths=(await admin.query('select storage_path from planit_private.event_media_gc_jobs where event_id=$1',[media])).rows.map(r=>r.storage_path).sort()
  assert.deepEqual(paths,[chat.storage_path,story.storage_path,staging.storage_path,loose,legacy,unlinked].sort())
  await assert.rejects(a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[`${owner}/${media}/late.png`,owner,{mimetype:'image/png',size:100}]),e=>e.code==='42501')
  await assert.rejects(a.query("insert into public.files(bucket_name,storage_path,mime_type,size_bytes) values('event_media',$1,'image/png',100)",[loose]),e=>e.code==='42501')
  await assert.rejects(a.query("insert into public.files(bucket_name,storage_path,mime_type,size_bytes) values('event_media',$1,'image/png',100)",[legacy]),e=>e.code==='42501')
  await assert.rejects(admin.query("insert into public.events(id,organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity) values($1,$2,$3,'Resurrect','No','2099-01-01','2099-01-02','BA',0,0,1)",[media,owner,category]),e=>e.code==='42501')
  check('Atomic deletion of full chat/story/reserved/gallery dependencies; rollback and receipts; shared file retained; loose uploads queued; deleted UUID/late upload/relink blocked')
  for(const client of [a,b,anon])await assert.rejects(client.query('select public.claim_event_media_gc()'),e=>e.code==='42501')
  let first=true
  while(true){
    const job=await scalar(service,'select public.claim_event_media_gc()');if(!job)break
    const target=()=>scalar(service,'select public.get_event_media_gc_target($1,$2)',[job.job_id,job.lease_token])
    assert.equal((await target()).storage_path,job.storage_path)
    assert.equal(await scalar(service,'select public.complete_event_media_gc($1,$2)',[job.job_id,job.lease_token]),false)
    if(first){
      await service.query("select public.fail_event_media_gc($1,$2,'storage_error')",[job.job_id,job.lease_token])
      assert.equal(await target(),null)
      await admin.query("update planit_private.event_media_gc_jobs set next_attempt_at=localtimestamp-interval '1 day' where id=$1",[job.job_id]);first=false;continue
    }
    // Storage API side effect is scaffolded locally; production never deletes storage.objects in SQL.
    await admin.query("delete from storage.objects where bucket_id='event_media' and name=$1",[job.storage_path])
    assert.equal(await scalar(service,'select public.complete_event_media_gc($1,$2)',[job.job_id,job.lease_token]),true)
    assert.equal(await scalar(service,'select public.complete_event_media_gc($1,$2)',[job.job_id,job.lease_token]),false)
  }
  assert.equal(await scalar(admin,"select count(*)::int from storage.objects where name=$1",[gallery]),1)
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.event_media_gc_jobs'),0)
  check('Service-only GC; storage-error retry; stale lease fencing; no completion before Storage absence; shared bytes untouched')
  // Real lock race: a lost-ACK replay must wait for registration and leave it intact.
  await a.query('begin');await reactivate(a,args)
  let settled=false;const registering=b.query('select public.register_for_event($1)',[id]).then(()=>{settled=true})
  await new Promise(r=>setTimeout(r,100));assert.equal(settled,true) // replay changes nothing and takes no event lock
  await registering;await a.query('commit')
  const raceId=await create();await action(a,raceId,'archive')
  const raceArgs=reactArgs(raceId,randomUUID())
  await a.query('begin');await reactivate(a,raceArgs)
  let registered=false;const pending=b.query('select public.register_for_event($1)',[raceId]).then(()=>{registered=true})
  await new Promise(r=>setTimeout(r,100));assert.equal(registered,false)
  await a.query('commit');await pending;await reactivate(a,raceArgs)
  assert.equal(await scalar(admin,"select count(*)::int from public.event_participations where event_id=$1 and status='confirmed'",[raceId]),1)
  const deleteId=await create();await action(a,deleteId,'cancel')
  await a.query('begin');await remove(a,deleteId)
  let deleteSettled=false;const retryDelete=remove(a2,deleteId).catch(e=>{assert.equal(e.code,'42501');deleteSettled=true})
  await new Promise(r=>setTimeout(r,100));assert.equal(deleteSettled,false)
  await a.query('commit');await retryDelete
  check('Real transaction races: registration waits for reactivation; operation replay preserves it; concurrent deletion serializes')
  const acl=(await admin.query("select proname,proconfig,has_function_privilege('anon',oid,'execute') as anon from pg_proc where proname in ('reactivate_event','delete_event','get_event_operation','claim_event_media_gc','get_event_media_gc_target','complete_event_media_gc','fail_event_media_gc')")).rows
  assert.equal(acl.length,7);assert.ok(acl.every(r=>!r.anon&&r.proconfig.includes('search_path=""')))
  for(const table of ['event_operations','event_media_gc_jobs']){
    assert.equal(await scalar(admin,'select relrowsecurity from pg_class where oid=$1::regclass',[`planit_private.${table}`]),true)
    await assert.rejects(a.query(`select * from planit_private.${table}`),e=>e.code==='42501')
  }
  const ended=await create()
  await admin.query("update public.events set starts_at='2020-01-01',ends_at='2020-01-02' where id=$1",[ended])
  assert.equal(await remove(a,ended),ended)
  const archived=await create();await action(a,archived,'archive');assert.equal(await remove(a,archived),archived)
  // A Storage INSERT already in flight holds the same event lock as deletion.
  const uploadRace=await create();await action(a,uploadRace,'cancel')
  const uploadPath=`${owner}/${uploadRace}/concurrent.png`
  await a.query('begin')
  await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[uploadPath,owner,{mimetype:'image/png',size:100}])
  let cleaned=false;const cleaning=remove(a2,uploadRace).then(()=>{cleaned=true})
  await new Promise(r=>setTimeout(r,100));assert.equal(cleaned,false)
  await a.query('commit');await cleaning
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.event_media_gc_jobs where storage_path=$1',[uploadPath]),1)
  check('Ended and archived deletion; Push jobs removed but subscription retained; expired-story jobs removed; in-flight Storage upload included after lock wait')
  check('New tables have RLS and no browser privileges; RPCs have empty search_path and no anonymous EXECUTE')
  const out='docs/qa/event-lifecycle'
  await mkdir(out,{recursive:true});await writeFile(`${out}/sql-results.json`,JSON.stringify({version,environment:'Isolated PostgreSQL; SQL Auth/Storage scaffolds; no remote changes',results},null,2)+'\n')
} finally {
  await Promise.allSettled(clients.map(c=>c.query('rollback')))
  await Promise.allSettled(clients.map(c=>c.end()))
  if(started)await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})
}
