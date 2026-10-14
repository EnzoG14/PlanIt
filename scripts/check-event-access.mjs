import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'

// R4 block 8: real isolated PostgreSQL with the same explicit SQL Auth/Storage
// scaffolding as the hidden-access check. SET ROLE is mandatory; this is local SQL
// evidence only, NOT HTTP/JWT evidence against the remote project.
const toolsRoot = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(toolsRoot, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(toolsRoot, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/event-access-${Date.now()}`)
const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port; await new Promise(resolve => probe.close(resolve))
const clients = [], results = []; let started = false
const users = Array.from({ length: 4 }, (_, i) => `30000000-0000-4000-8000-00000000000${i + 1}`)
const [aId, bId, cId, dId] = users
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await c.connect(); clients.push(c); return c }
async function role(c, id) { await c.query('reset role'); await c.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await c.query(`set role ${id ? 'authenticated' : 'anon'}`) }
const summary = (c, id) => c.query('select * from public.get_event_participation_summary($1)', [id])
const redeem = (c, token) => c.query('select public.redeem_event_link($1) as id', [token])
const denied = promise => assert.rejects(promise, e => e.code === '42501')
const unavailable = async (promise, label) => { const e = await promise.then(() => null, error => error); assert.ok(e, `${label}: must fail`); assert.equal(e.message, 'invite_unavailable', label); assert.equal(e.code, 'P0001', label); return e }
try {
  await mkdir(resolve('.participation-test-tools.local'), { recursive: true })
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  const admin = await connect()
  const version = (await admin.query('select version()')).rows[0].version
  await admin.query(`create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin end $$;`)
  const migrations = (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort()
  assert.ok(migrations.includes('20261014120005_redeem_event_link.sql'))
  for (const file of migrations) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  for (const id of users) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  await role(admin, aId); await admin.query('reset role') // visibility trigger needs the organizer identity
  const cat = (await admin.query('select id from public.categories limit 1')).rows[0].id
  const [a, b, c, d, anon] = await Promise.all(Array.from({ length: 5 }, connect))
  await Promise.all([role(a, aId), role(b, bId), role(c, cId), role(d, dId), role(anon, null)])
  const now = "(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')"
  async function event(capacity = 4, visibility = 'unlisted') {
    return (await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
      values($1,$2,'Invite fixture','Private location fixture',${now}+interval '1 day',${now}+interval '2 days','Fixture address',0,0,$3,$4) returning id`, [aId, cat, capacity, visibility])).rows[0].id
  }
  const link = async id => (await a.query('select public.create_or_rotate_event_link($1) as token', [id])).rows[0].token
  const grants = async (id, uid) => (await admin.query('select * from public.event_access_grants where event_id=$1 and user_id=$2', [id, uid])).rows
  const parts = async id => (await admin.query('select count(*)::int as n from public.event_participations where event_id=$1', [id])).rows[0].n

  const revoke = (actor, id, uid = bId) => actor.query('select public.revoke_event_access($1,$2)', [id, uid])
  const restore = (actor, id, uid = bId) => actor.query('select public.restore_event_access($1,$2)', [id, uid])
  const list = async (actor, id, status = 'active', cursor = null, limit = 30) => (await actor.query('select public.get_event_access_grants($1,$2,$3,$4) as data', [id,status,cursor,limit])).rows[0].data
  const register = (actor, id) => actor.query('select public.register_for_event($1)', [id])
  const part = async (id, uid = bId) => (await admin.query('select * from public.event_participations where event_id=$1 and user_id=$2',[id,uid])).rows[0]
  const history = async id => (await admin.query('select * from public.participation_history where participation_id=$1 order by created_at,id',[id])).rows
  const details = (actor, id) => actor.query('select id from public.events where id=$1',[id])
  const chat = (actor, id) => actor.query('select * from public.get_event_chat($1)',[id])
  const send = (actor, id) => actor.query('select public.send_event_chat_message($1,gen_random_uuid(),$2)',[id,'Fixture message'])
  const grant = async (id, actor = b) => redeem(actor, await link(id))
  const id = await event(1); const token = await link(id)
  await redeem(b,token); await redeem(c,token)
  for (const signature of ['get_event_access_grants(uuid,text,uuid,integer)','revoke_event_access(uuid,uuid)','restore_event_access(uuid,uuid)']) {
    const metadata = (await admin.query(`select prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') as anon,
      has_function_privilege('authenticated',oid,'EXECUTE') as authenticated from pg_proc where oid=$1::regprocedure`,[`public.${signature}`])).rows[0]
    assert.equal(metadata.prosecdef,true); assert.ok(metadata.proconfig.includes('search_path=""')); assert.equal(metadata.anon,false); assert.equal(metadata.authenticated,true)
  }
  for (const actor of [b,c,d,anon]) { await denied(list(actor,id)); await denied(revoke(actor,id)); await denied(restore(actor,id)) }
  const missingIdentity = await connect(); await role(missingIdentity,null); await missingIdentity.query('set role authenticated')
  await denied(list(missingIdentity,id)); await denied(revoke(missingIdentity,id)); await denied(restore(missingIdentity,id))
  assert.equal((await a.query('select birth_date,sex from public.profiles where id=$1',[bId])).rowCount,0)
  check('Authenticated-only empty-search_path definers; A owns; B/C/D/anon cannot list/mutate; no private profile read')

  const first = await list(a,id,'active',null,1), second = await list(a,id,'active',first.next_cursor,1)
  assert.equal(first.grants.length,1); assert.equal(second.grants.length,1); assert.notEqual(first.grants[0].id,second.grants[0].id); assert.equal(second.next_cursor,null)
  assert.deepEqual(Object.keys(first.grants[0]).sort(),['avatar_url','display_name','id','is_confirmed','status','user_id','username'])
  assert.equal(first.grants[0].avatar_url,null)
  for (const limit of [0,51,null]) await assert.rejects(list(a,id,'active',null,limit),e=>e.code==='22023')
  await assert.rejects(list(a,id,'confirmed'),e=>e.code==='22023')
  check('CA-01 safe profile projection, active/revoked filters, stable keyset pagination, bounded arguments')

  await register(b,id)
  const p = await part(id), h = await history(p.id)
  await send(b,id)
  const path = `${aId}/events/${id}/fixture.png`
  await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[path,aId,{mimetype:'image/png',size:100}])
  const file = (await admin.query("insert into public.files(uploaded_by,bucket_name,storage_path,mime_type,size_bytes) values($1,'event_media',$2,'image/png',100) returning id",[aId,path])).rows[0].id
  await admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[id,file])
  const media = actor => actor.query('select id from storage.objects where name=$1',[path])
  assert.equal((await media(b)).rowCount,1)
  await revoke(a,id)
  assert.equal((await part(id)).status,'removed'); assert.equal((await grants(id,bId))[0].status,'revoked')
  const after = await history(p.id); assert.equal(after.length,h.length+1); assert.equal(after.at(-1).changed_by,aId); assert.equal(after.at(-1).reason,'organizer_removal')
  assert.equal((await details(b,id)).rowCount,0); assert.equal((await media(b)).rowCount,0); await denied(chat(b,id)); await denied(send(b,id))
  assert.equal(Number((await summary(a,id)).rows[0].available_spots),1)
  const revoked = (await grants(id,bId))[0]; await revoke(a,id); assert.deepEqual((await grants(id,bId))[0],revoked); assert.equal((await history(p.id)).length,after.length)
  assert.equal((await list(a,id,'revoked')).grants[0].is_confirmed,false)
  await unavailable(redeem(b,token),'same token'); await unavailable(redeem(b,await link(id)),'rotated token')
  assert.equal((await details(c,id)).rowCount,1)
  check('CA-02/03/04 confirmed revocation is atomic, unique history, derived free seat, detail/Storage/chat denied; repeated revoke and regenerated link cannot restore')

  await restore(a,id)
  const restored = (await grants(id,bId))[0]; await restore(a,id); assert.deepEqual((await grants(id,bId))[0],restored)
  assert.equal((await details(b,id)).rowCount,1); assert.equal((await media(b)).rowCount,1); assert.equal((await part(id)).status,'removed')
  await denied(chat(b,id)); await assert.rejects(register(b,id),/rejoin_requires_approval/)
  assert.equal((await history(p.id)).length,after.length); assert.equal(Number((await summary(a,id)).rows[0].available_spots),1)
  await assert.rejects(restore(a,id,dId),/access_grant_missing/); await assert.rejects(revoke(a,id,dId),/access_grant_missing/)
  await link(id); assert.equal((await grants(id,cId))[0].status,'active')
  await revoke(a,id,cId); assert.equal(await part(id,cId),undefined); assert.equal((await grants(id,cId))[0].status,'revoked')
  await restore(a,id,cId); assert.equal(await part(id,cId),undefined)
  check('CA-05 restore changes only grant; no seat/chat/participation restoration; duplicate restore stable; rotation preserves other active grants; missing grants never created')

  // R3 requests/cooldown survive permission changes and still require explicit approval.
  const request = (await b.query('select public.request_rejoin($1) as id',[id])).rows[0].id
  const requestBefore = (await admin.query('select * from public.event_rejoin_requests where id=$1',[request])).rows[0]
  await revoke(a,id); await denied(a.query("select public.resolve_rejoin($1,$2,'approved')",[id,request]))
  await restore(a,id); assert.deepEqual((await admin.query('select * from public.event_rejoin_requests where id=$1',[request])).rows[0],requestBefore)
  await a.query("select public.resolve_rejoin($1,$2,'approved')",[id,request]); assert.equal((await part(id)).status,'confirmed')
  check('R3 pending rejoin/cooldown untouched; approval denied while revoked, restoration alone does not approve')

  const other = await event(); await grant(other); await register(b,other)
  const otherBefore = await part(other), otherGrant = (await grants(other,bId))[0]
  // Injected AFTER history failure must roll back the participation and grant together.
  await admin.query(`create function public.fixture_history_failure() returns trigger language plpgsql as $$ begin raise exception 'fixture_history_failure'; end $$;
    create trigger fixture_history_failure before insert on public.participation_history for each row execute function public.fixture_history_failure();`)
  await assert.rejects(revoke(a,id),/fixture_history_failure/)
  assert.equal((await part(id)).status,'confirmed'); assert.equal((await grants(id,bId))[0].status,'active'); assert.equal((await history(p.id)).at(-1).reason,'rejoin_approval')
  await admin.query('drop trigger fixture_history_failure on public.participation_history; drop function public.fixture_history_failure()')
  await revoke(a,id); assert.deepEqual(await part(other),otherBefore); assert.deepEqual((await grants(other,bId))[0],otherGrant)
  check('History failure rolls back all state; other event participation, grant and seats unaffected')

  for (const closed of ['ended','cancelled','archived']) {
    const e = await event(); await grant(e)
    if (closed === 'ended') await admin.query(`update public.events set starts_at=${now}-interval '2 days',ends_at=${now}-interval '1 day' where id=$1`,[e])
    else await a.query(`select public.${closed==='cancelled'?'cancel_event':'archive_event'}($1)`,[e])
    assert.equal((await list(a,e)).event_state,closed)
    await assert.rejects(revoke(a,e),/event_closed/); await assert.rejects(restore(a,e),/event_closed/)
  }
  const pub = await event(2); await grant(pub); await revoke(a,pub)
  await a.query("select public.set_event_visibility($1,'public')",[pub])
  assert.equal((await details(b,pub)).rowCount,1); await register(b,pub)
  await assert.rejects(list(a,pub),/event_not_hidden/); await assert.rejects(restore(a,pub),/event_not_hidden/)
  await assert.rejects(a.query("select public.set_event_visibility($1,'unlisted')",[pub]),/confirmed_access_revoked/)
  check('Closed hidden events are read-only; A05 public detail permitted with revoked grant; A04 rehide conflict blocked')

  // Wait for actual lock contention, not just simultaneous Promise dispatch.
  const a2 = await connect(); await role(a2,aId)
  async function race(holder, before, contender, after) {
    await holder.query('begin'); await before()
    const pid = (await contender.query('select pg_backend_pid() as pid')).rows[0].pid
    let done = false
    const pending = after().then(value=>({value}),error=>({error})).finally(()=>{done=true})
    let blocked = false
    for (let i=0;i<100&&!done;i++) {
      const state = (await admin.query("select wait_event_type from pg_stat_activity where pid=$1",[pid])).rows[0]
      if (state?.wait_event_type==='Lock') { blocked=true; break }
      await new Promise(r=>setTimeout(r,10))
    }
    await holder.query('commit')
    const result = await pending
    assert.ok(blocked,'contender must really wait on a lock')
    return result
  }
  let e = await event(); await grant(e)
  let result = await race(a,()=>revoke(a,e),b,()=>register(b,e)); assert.equal(result.error?.code,'42501'); assert.equal(await parts(e),0)
  e = await event(); await grant(e)
  result = await race(b,()=>register(b,e),a2,()=>revoke(a2,e)); assert.equal(result.error,undefined); assert.equal((await part(e)).status,'removed'); assert.equal((await history((await part(e)).id)).length,2)
  e = await event(); await grant(e); await register(b,e)
  result = await race(a,()=>revoke(a,e),b,()=>send(b,e)); assert.equal(result.error?.code,'42501')
  await restore(a,e); await b.query('select public.request_rejoin($1)',[e])
  const r = (await admin.query('select id from public.event_rejoin_requests where participation_id=$1',[(await part(e)).id])).rows[0].id
  result = await race(a,()=>revoke(a,e),a2,()=>a2.query("select public.resolve_rejoin($1,$2,'approved')",[e,r])); assert.equal(result.error?.code,'42501')
  await restore(a,e)
  result = await race(a,()=>a.query("select public.resolve_rejoin($1,$2,'approved')",[e,r]),a2,()=>revoke(a2,e)); assert.equal(result.error,undefined); assert.equal((await part(e)).status,'removed')
  await restore(a,e)
  result = await race(a,()=>revoke(a,e),a2,()=>revoke(a2,e)); assert.equal(result.error,undefined)
  const snapshot = (await grants(e,bId))[0]
  result = await race(a,()=>restore(a,e),a2,()=>restore(a2,e)); assert.equal(result.error,undefined); assert.equal((await part(e)).status,'removed')
  assert.equal((await grants(e,bId))[0].status,'active'); assert.notEqual((await grants(e,bId))[0].updated_at,snapshot.updated_at)
  const deadlocks = (await admin.query("select deadlocks from pg_stat_database where datname='postgres'")).rows[0].deadlocks; assert.equal(Number(deadlocks),0)
  check('Seven real-lock races: revoke/register both orders, revoke/chat, revoke/rejoin both orders, double revoke/restore; zero deadlocks')

  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-8'
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/postgres-results.json`,JSON.stringify({version,environment:'Isolated PostgreSQL; SQL Auth/Storage scaffolding; SET ROLE; no HTTP/JWT',migrations,results},null,2))
} finally {
  await Promise.allSettled(clients.map(c=>c.end()))
  if(started) await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})
}
