import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/rejoin-${Date.now()}`)
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r))
const clients = [], results = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002', stranger = '20000000-0000-4000-8000-000000000003'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect(identity) {
  const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' }); await c.connect(); clients.push(c)
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
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$;`)
  for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  for (const id of [owner, guest, stranger]) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  await admin.query("update public.profiles set display_name='Camila Rodríguez',birth_date='2000-01-01',sex='female' where id=$1", [guest])
  const a = await connect(owner), a2 = await connect(owner), b = await connect(guest), c = await connect(stranger), anon = await connect()
  await anon.query('set role anon')
  const create = async (author = owner, capacity = 80) => {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [author])
    return (await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      select id,'Asistentes','Fixture SQL','2099-10-12 20:00','2099-10-12 23:00','Buenos Aires',-34.6,-58.4,$1 from public.categories limit 1 returning id`, [capacity])).rows[0].id
  }
  const list = async (client, id, status = 'confirmed', search = '', offset = 0) => (await client.query('select public.get_event_attendees($1,$2,$3,$4) as data', [id, status, search, offset])).rows[0].data
  const remove = (client, id, participation) => client.query('select public.remove_participant($1,$2)', [id, participation])
  const registration = async (client, id, user = guest) => { await client.query('select public.register_for_event($1)', [id]); return (await admin.query('select id from public.event_participations where event_id=$1 and user_id=$2', [id, user])).rows[0].id }
  const snapshot = async p => (await admin.query('select status,(select count(*) from public.participation_history where participation_id=p.id) as movements from public.event_participations p where id=$1', [p])).rows[0]
  const requests = async (client, id, offset = 0) => (await client.query('select public.get_event_rejoin_requests($1,$2) as data', [id, offset])).rows[0].data
  const own = async (client, id) => (await client.query('select public.get_my_rejoin_status($1) as data', [id])).rows[0].data
  const request = async (client, id) => (await client.query('select public.request_rejoin($1) as id', [id])).rows[0].id
  const resolveRequest = (client, id, r, decision = 'approved') => client.query('select public.resolve_rejoin($1,$2,$3)', [id,r,decision])
  const resolution = async (client, id, r) => (await client.query('select public.get_event_rejoin_resolution($1,$2) as status', [id,r])).rows[0].status
  const removed = async (id, client = b, user = guest) => { const p = await registration(client,id,user); await remove(a,id,p); return p }
  const signatures = ['get_my_rejoin_status(uuid)', 'get_event_rejoin_requests(uuid,integer)', 'request_rejoin(uuid)', 'resolve_rejoin(uuid,uuid,text)', 'get_event_rejoin_resolution(uuid,uuid)']
  for (const signature of signatures) {
    const security = (await admin.query("select prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') as anon,has_function_privilege('authenticated',oid,'EXECUTE') as authenticated from pg_proc where oid=$1::regprocedure", [`public.${signature}`])).rows[0]
    assert.equal(security.prosecdef,true); assert.ok(security.proconfig.includes('search_path=""')); assert.equal(security.anon,false); assert.equal(security.authenticated,true)
  }
  assert.equal((await admin.query("select relrowsecurity from pg_class where oid='public.event_rejoin_requests'::regclass")).rows[0].relrowsecurity,true)
  for (const privilege of ['INSERT','UPDATE','DELETE']) assert.equal((await admin.query("select has_table_privilege('authenticated','public.event_rejoin_requests',$1) as allowed",[privilege])).rows[0].allowed,false)
  check('Full migration replay; RLS, no generic writes, authenticated-only definers with empty search_path')
  const id = await create(), p = await removed(id)
  assert.equal((await own(b,id)).can_request,true)
  const r = await request(b,id)
  await assert.rejects(admin.query('insert into public.event_rejoin_requests(participation_id) values($1)',[p]),/rejoin_requests_one_pending_idx/)
  await assert.rejects(admin.query("insert into public.event_rejoin_requests(participation_id,status) values($1,'rejected')",[p]),/check constraint/)
  assert.equal((await own(b,id)).status,'pending'); assert.equal((await own(b,id)).can_request,false)
  assert.equal((await requests(a,id)).pending_count,1); assert.equal((await list(a,id)).pending_count,1)
  assert.deepEqual(Object.keys((await requests(a,id)).requests[0]).sort(), ['display_name','participation_id','request_id','requested_at','status','username'])
  assert.equal((await b.query('select * from public.event_rejoin_requests')).rowCount,1)
  assert.equal((await a.query('select * from public.event_rejoin_requests')).rowCount,0)
  assert.equal((await c.query('select * from public.event_rejoin_requests')).rowCount,0)
  await assert.rejects(request(b,id),/rejoin_already_pending/)
  await assert.rejects(request(c,id),/rejoin_not_removed/)
  const invalidId = await create(); await registration(b,invalidId)
  await assert.rejects(request(b,invalidId),/rejoin_not_removed/); await b.query('select public.leave_event($1)',[invalidId]); await assert.rejects(request(b,invalidId),/rejoin_not_removed/)
  const missing = await connect(); await missing.query('set role authenticated')
  for (const client of [b,c]) { await assert.rejects(requests(client,id),/event_unavailable/); await assert.rejects(resolveRequest(client,id,r),/event_unavailable/); await assert.rejects(resolution(client,id,r),/event_unavailable/) }
  for (const client of [anon,missing]) {
    const pattern = client === anon ? /permission denied/ : /authentication_required/
    await assert.rejects(requests(client,id),pattern); await assert.rejects(own(client,id),pattern); await assert.rejects(request(client,id),pattern); await assert.rejects(resolveRequest(client,id,r),pattern); await assert.rejects(resolution(client,id,r),pattern)
  }
  const foreign = await create(stranger); await assert.rejects(resolveRequest(a,foreign,r),/event_unavailable/); await assert.rejects(resolveRequest(a,invalidId,r),/rejoin_unavailable/)
  await b.query('begin isolation level repeatable read'); await assert.rejects(request(b,id),/retry_read_committed/); await b.query('rollback')
  await a.query('begin isolation level repeatable read'); await assert.rejects(resolveRequest(a,id,r),/retry_read_committed/); await a.query('rollback')
  await assert.rejects(requests(a,id,-1),/invalid_rejoin_query/); await assert.rejects(requests(a,id,null),/invalid_rejoin_query/); await assert.rejects(resolveRequest(a,id,r,'pending'),/invalid_rejoin_decision/)
  check('R3-08 CA01–03: immediate first request, one pending, confirmed/cancelled/never removed denied; owner projection and cross-account/anon/direct access secured')
  await resolveRequest(a,id,r,'rejected')
  assert.deepEqual(await snapshot(p),{status:'removed',movements:'2'})
  assert.equal((await own(b,id)).status,'rejected'); assert.ok((await own(b,id)).next_eligible_at)
  await assert.rejects(request(b,id),/rejoin_cooldown/)
  await assert.rejects(resolveRequest(a,id,r),/rejoin_already_resolved/)
  const setRejectionAge = async (requestId, interval) => admin.query(`update public.event_rejoin_requests set requested_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '8 days', resolved_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-$2::interval where id=$1`,[requestId,interval])
  await setRejectionAge(r,'7 days - 1 minute'); await assert.rejects(request(b,id),/rejoin_cooldown/)
  await setRejectionAge(r,'7 days'); assert.equal((await own(b,id)).can_request,true)
  const r2 = await request(b,id); await resolveRequest(a,id,r2)
  assert.deepEqual(await snapshot(p),{status:'confirmed',movements:'3'})
  const history = (await admin.query("select previous_status,new_status,changed_by,reason from public.participation_history where participation_id=$1 order by created_at desc limit 1",[p])).rows[0]
  assert.deepEqual(history,{previous_status:'removed',new_status:'confirmed',changed_by:owner,reason:'rejoin_approval'})
  assert.equal(await resolution(a,id,r2),'approved'); assert.equal((await own(b,id)).status,'approved')
  await b.query('select public.send_event_chat_message($1,$2,$3)',[id,randomUUID(),'Reincorporado'])
  await assert.rejects(resolveRequest(a,id,r2,'rejected'),/rejoin_already_resolved/)
  assert.equal((await b.query('select * from public.event_rejoin_requests where participation_id=$1',[p])).rowCount,2)
  check('R3-08 CA04 / R3-09 CA02,04: seven-day boundary, rejection audit without fabricated transition, approval actor/history/chat recovery, immutable resolved requests')
  // Approval then a new removal: no wait is measured from removal or approval.
  await remove(a,id,p); assert.equal((await own(b,id)).can_request,true)
  check('A new removal after approval allows a new immediate request')
  const hidden=await create(), hiddenP=await removed(hidden)
  await admin.query("update public.events set visibility='unlisted' where id=$1",[hidden])
  await assert.rejects(own(b,hidden),/event_unavailable/)
  await assert.rejects(request(b,hidden),/event_unavailable/)
  assert.equal((await b.query('select id from public.events where id=$1',[hidden])).rowCount,0)
  await admin.query('insert into public.event_access_grants(event_id,user_id) values($1,$2)',[hidden,guest])
  assert.equal((await own(b,hidden)).can_request,true); await request(b,hidden)
  await assert.rejects(own(c,hidden),/event_unavailable/)
  assert.equal((await b.query('select id from public.events where id=$1',[hidden])).rowCount,1)
  assert.equal((await snapshot(hiddenP)).status,'removed')
  check('R4: historical holder needs active grant for hidden detail/rejoin; history alone never grants access')
  for (const state of ['ended','cancelled','archived']) {
    const closed = await create(), cp = await removed(closed), cr = await request(b,closed)
    const assignments = { ended: "starts_at='2020-01-01',ends_at='2020-01-02'", cancelled: "cancelled_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'", archived: "archived_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'" }
    if (state === 'archived') await a.query('select public.archive_event($1)',[closed])
    else await admin.query(`update public.events set ${assignments[state]} where id=$1`,[closed])
    assert.equal((await own(b,closed)).can_request,false)
    await assert.rejects(request(b,closed),/event_closed/); await assert.rejects(resolveRequest(a,closed,cr),/event_closed/)
    assert.equal(await resolution(a,closed,cr),'pending')
    await resolveRequest(a,closed,cr,'rejected'); assert.equal(await resolution(a,closed,cr),'rejected'); assert.equal((await snapshot(cp)).status,'removed')
  }
  check('R3-08 CA04 / R3-09 CA05: ended/cancelled/archived block requests and approvals; human-approved rejection after closure retained')
  const fullId = await create(owner,1), fullP = await removed(fullId), fullR = await request(b,fullId)
  await registration(c,fullId,stranger)
  await assert.rejects(resolveRequest(a,fullId,fullR),/event_full/)
  assert.equal(await resolution(a,fullId,fullR),'pending'); assert.equal((await snapshot(fullP)).status,'removed')
  await c.query('select public.leave_event($1)',[fullId]); assert.equal(await resolution(a,fullId,fullR),'pending')
  assert.equal((await snapshot(fullP)).status,'removed'); await resolveRequest(a,fullId,fullR)
  check('R3-09 CA03: full remains pending without reservation; freeing a place does not autoapprove')
  const rollbackId = await create(), rollbackP = await removed(rollbackId), rollbackR = await request(b,rollbackId)
  await admin.query(`create function public.fail_test_history() returns trigger language plpgsql as $$begin raise exception 'fixture_history_failure'; end$$; create trigger fail_test_history before insert on public.participation_history for each row execute function public.fail_test_history();`)
  await assert.rejects(resolveRequest(a,rollbackId,rollbackR),/fixture_history_failure/)
  assert.deepEqual(await snapshot(rollbackP),{status:'removed',movements:'2'}); assert.equal(await resolution(a,rollbackId,rollbackR),'pending')
  await admin.query('drop trigger fail_test_history on public.participation_history; drop function public.fail_test_history()')
  await admin.query(`create function public.fail_test_resolution() returns trigger language plpgsql as $$begin raise exception 'fixture_resolution_failure'; end$$; create trigger fail_test_resolution before update on public.event_rejoin_requests for each row execute function public.fail_test_resolution();`)
  await assert.rejects(resolveRequest(a,rollbackId,rollbackR),/fixture_resolution_failure/)
  assert.deepEqual(await snapshot(rollbackP),{status:'removed',movements:'2'}); assert.equal(await resolution(a,rollbackId,rollbackR),'pending')
  await admin.query('drop trigger fail_test_resolution on public.event_rejoin_requests; drop function public.fail_test_resolution()')
  check('Failure in history or resolution rolls back participation, capacity, history and request together')
  const race = async (first, firstAction, second, secondAction, failure) => {
    await first.query('begin'); await firstAction()
    let settled = false
    const pending = secondAction().then(()=>({ok:true}),error=>({error})).finally(()=>{settled=true})
    await new Promise(r=>setTimeout(r,100)); assert.equal(settled,false)
    await first.query('commit'); const outcome = await pending
    if (failure) assert.match(outcome.error?.message ?? '',failure); else assert.equal(outcome.ok,true)
  }
  let raceId = await create(owner,1), rp = await removed(raceId), rr = await request(b,raceId)
  await race(a,()=>resolveRequest(a,raceId,rr),a2,()=>resolveRequest(a2,raceId,rr),/rejoin_already_resolved/)
  assert.deepEqual(await snapshot(rp),{status:'confirmed',movements:'3'})
  raceId=await create(); await removed(raceId); const b2=await connect(guest)
  await race(b,()=>request(b,raceId),b2,()=>request(b2,raceId),/rejoin_already_pending/)
  for (let i=0;i<4;i++) {
    raceId=await create(owner,1); rp=await removed(raceId); rr=await request(b,raceId)
    if (i%2===0) await race(a,()=>resolveRequest(a,raceId,rr),c,()=>c.query('select public.register_for_event($1)',[raceId]),/event_full/)
    else { await race(c,()=>c.query('select public.register_for_event($1)',[raceId]),a,()=>resolveRequest(a,raceId,rr),/event_full/); assert.equal(await resolution(a,raceId,rr),'pending') }
    assert.equal((await list(a,raceId)).confirmed_count,1)
  }
  raceId=await create(owner,1); await removed(raceId); rr=await request(b,raceId); await removed(raceId,c,stranger); const rrOther=await request(c,raceId)
  await race(a,()=>resolveRequest(a,raceId,rr),a2,()=>resolveRequest(a2,raceId,rrOther),/event_full/)
  assert.equal(await resolution(a,raceId,rrOther),'pending'); assert.equal((await list(a,raceId)).confirmed_count,1)
  for (const close of ['cancel_event','archive_event']) for (const closingFirst of [true,false]) {
    raceId=await create(); rp=await removed(raceId); rr=await request(b,raceId)
    if (closingFirst) { await race(a,()=>a.query(`select public.${close}($1)`,[raceId]),a2,()=>resolveRequest(a2,raceId,rr),/event_closed/); assert.equal(await resolution(a,raceId,rr),'pending') }
    else { await race(a,()=>resolveRequest(a,raceId,rr),a2,()=>a2.query(`select public.${close}($1)`,[raceId])); assert.equal((await snapshot(rp)).status,'confirmed') }
  }
  check('Eleven real blocked-lock races: duplicate resolution/request, approval vs registration both orders, approvals for last seat, cancellation/archive both orders; no overcapacity')
  const paged = await create()
  for (let i=0;i<34;i++) {
    const uid=randomUUID(); await admin.query('insert into auth.users values($1,$2)',[uid,{display_name:`Solicitante ${i}`}]); await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[uid])
    const participation=(await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'removed') returning id",[paged,uid])).rows[0].id
    await admin.query('insert into public.event_rejoin_requests(participation_id) values($1)',[participation])
  }
  const first=await requests(a,paged), second=await requests(a,paged,30)
  assert.equal(first.requests.length,30); assert.equal(first.has_more,true); assert.equal(second.requests.length,4); assert.equal(second.has_more,false)
  assert.equal(new Set([...first.requests,...second.requests].map(r=>r.request_id)).size,34)
  assert.equal(first.pending_count,34)
  check('R3-09 CA01: pending-only pagination with stable date/UUID order, counts and minimal social projection')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-6'
  await mkdir(out,{recursive:true})
  await writeFile(`${out}/postgres-results.json`,JSON.stringify({version,environment:'Isolated real PostgreSQL; Auth/Storage SQL scaffolding; no remote HTTP/JWT',results},null,2))
} finally {
  await Promise.allSettled(clients.map(c=>c.end()))
  if (started) await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})
}
