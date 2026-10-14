import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'
pg.types.setTypeParser(20, Number) // Local fixture counts are safely below Number.MAX_SAFE_INTEGER.

// Real PostgreSQL process, independent TCP clients. No remote URL is accepted.
const run = promisify(execFile)
const directory = resolve(`.participation-test-tools.local/data-${Date.now()}`)
const probe = createServer()
await new Promise(resolve => probe.listen(0,'127.0.0.1',resolve))
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
let started = false
const clients = []
const results = []
async function connect() { const c = new pg.Client({host:'127.0.0.1',port,user:'postgres',database:'postgres',connectionTimeoutMillis:5000}); await c.connect(); clients.push(c); return c }
const owner = '20000000-0000-4000-8000-000000000001'
const alice = '20000000-0000-4000-8000-000000000002'
const bob = '20000000-0000-4000-8000-000000000003'
const eve = '20000000-0000-4000-8000-000000000004'
const check = (name) => { results.push({ test: name, result: 'PASS' }); console.log(`PASS: ${name}`) }
try {
  // Inherit Windows environment; the wrapper overwrites SYSTEMROOT/PATH.
  await run(initdb,['-D',directory,'-U','postgres','-A','trust','--encoding=UTF8','--locale=C'],{windowsHide:true,timeout:30000})
  await run(pg_ctl,['-D',directory,'-l',`${directory}/server.log`,'-o',`-h 127.0.0.1 -p ${port}`,'-w','start'],{windowsHide:true,timeout:30000})
  started = true
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
  for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) {
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql)
  }
  check('Replay all versioned migrations on clean PostgreSQL (Auth/Storage scaffolding)')
  assert.equal((await admin.query("select count(*)::int n from pg_tables where schemaname='public' and tablename in ('event_participations','participation_history') and rowsecurity")).rows[0].n,2)
  for (const name of ['register_for_event','leave_event','get_event_participation_summary']) {
    const fn=(await admin.query("select prosecdef,proconfig from pg_proc where oid=$1::regprocedure",[`public.${name}(uuid)`])).rows[0]
    assert.equal(fn.prosecdef,true); assert.ok(fn.proconfig.some(setting=>setting==='search_path=""'))
  }
  check('Both tables RLS-enabled; definer endpoints have empty search_path')
  for (const id of [owner,alice,bob,eve]) await admin.query('insert into auth.users values ($1,$2)',[id,{display_name:'Prueba'}])
  async function role(c,id) { await c.query('reset role'); await c.query("select set_config('request.jwt.claim.sub',$1,false)",[id ?? '']); await c.query(`set role ${id ? 'authenticated' : 'anon'}`) }
  async function event(capacity=1) {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
    return (await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      select id,'Prueba cupos','Fixture local','2099-10-11 20:00','2099-10-11 22:00','Dirección',-34.6,-58.38,$1 from public.categories limit 1 returning id`,[capacity])).rows[0].id
  }
  const a = await connect(); const b = await connect(); const stranger = await connect()
  await role(a,alice); await role(b,bob); await role(stranger,eve)
  const rpc = (c,name,id) => c.query(`select public.${name}($1)`,[id])
  const summary = async (c,id) => (await c.query('select * from public.get_event_participation_summary($1)',[id])).rows[0]
  const id = await event(2)
  await rpc(a,'register_for_event',id); await rpc(a,'register_for_event',id)
  assert.equal((await admin.query('select count(*)::int n from public.participation_history')).rows[0].n,1)
  const participation = (await a.query('select * from public.event_participations')).rows[0]
  await assert.rejects(rpc(stranger,'leave_event',id),/not_participating/)
  await assert.rejects(stranger.query("update public.event_participations set status='cancelled' where id=$1",[participation.id]),/permission denied/)
  assert.equal((await stranger.query('select * from public.event_participations')).rowCount,0)
  assert.equal((await stranger.query('select * from public.participation_history')).rowCount,0)
  await rpc(a,'leave_event',id); await rpc(a,'leave_event',id)
  assert.equal((await summary(b,id)).available_spots,2)
  await rpc(a,'register_for_event',id)
  assert.equal((await a.query('select id from public.event_participations')).rows[0].id,participation.id)
  assert.deepEqual((await a.query('select previous_status,new_status from public.participation_history order by created_at')).rows,
    [{previous_status:null,new_status:'confirmed'},{previous_status:'confirmed',new_status:'cancelled'},{previous_status:'cancelled',new_status:'confirmed'}])
  check('Registration / lost-response retry / leave / retry / rejoin: unique row, three actual history transitions, released capacity, no foreign leave')
  await role(stranger,owner); await assert.rejects(rpc(stranger,'register_for_event',id),/organizer_cannot_register/)
  assert.equal((await summary(stranger,id)).confirmed_count,1)
  assert.deepEqual(Object.keys(await summary(stranger,id)).sort(),['available_spots','capacity','confirmed_count','event_state','is_organizer','own_status'])
  check('Organizer excluded; summary has exactly six safe fields without participant identities')
  await role(stranger,null)
  for (const name of ['register_for_event','leave_event','get_event_participation_summary']) await assert.rejects(rpc(stranger,name,id),/permission denied/)
  for (const table of ['event_participations','participation_history']) await assert.rejects(stranger.query(`select * from public.${table}`),/permission denied/)
  await role(stranger,eve)
  for (const sql of ["insert into public.event_participations(event_id,user_id,status) values ($1,$2,'confirmed')",
    "insert into public.participation_history(participation_id,new_status,changed_by,reason) values ($1,'confirmed',$2,'fake')"]) {
    await assert.rejects(stranger.query(sql,[id,eve]),/permission denied/)
  }
  await assert.rejects(stranger.query('delete from public.event_participations'),/permission denied/)
  await role(stranger,alice); await stranger.query("select set_config('request.jwt.claim.sub','',false)")
  for (const name of ['register_for_event','leave_event','get_event_participation_summary']) await assert.rejects(rpc(stranger,name,id),/authentication_required/)
  check('Anonymous / missing JWT / direct mutations / history forgery denied; own-only RLS')
  await admin.query("update public.event_participations set status='removed' where id=$1",[participation.id])
  await assert.rejects(rpc(a,'register_for_event',id),/rejoin_requires_approval/)
  await rpc(a,'leave_event',id)
  assert.equal((await summary(a,id)).own_status,'removed')
  await assert.rejects(admin.query("update public.event_participations set status='pending' where id=$1",[participation.id]),/check constraint/)
  await assert.rejects(admin.query("insert into public.event_participations(event_id,user_id,status) values ($1,$2,'confirmed')",[id,alice]),/unique constraint/)
  await assert.rejects(admin.query('delete from public.events where id=$1',[id]),/foreign key constraint/)
  check('Removed cannot rejoin/leave into cancelled; status/unique/FK constraints retain history')
  for (const [change,message] of [["visibility='unlisted'",'event_unavailable'],["cancelled_at=now()",'event_cancelled'],
    ["cancelled_at=now(),archived_at=now()",'event_cancelled'],["starts_at='2020-01-01',ends_at='2020-01-02'",'event_ended']]) {
    const invalid = await event(); await admin.query(`update public.events set ${change} where id=$1`,[invalid])
    await assert.rejects(rpc(b,'register_for_event',invalid),new RegExp(message))
    if (message !== 'event_ended') await assert.rejects(summary(b,invalid),/event_unavailable/)
  }
  check('Hidden / cancelled / archived / ended events reject registration and unauthorized summaries')
  const retained = await event(); await rpc(b,'register_for_event',retained)
  await admin.query('update public.events set cancelled_at=now(),archived_at=now() where id=$1',[retained])
  assert.equal((await summary(b,retained)).event_state,'archived')
  assert.equal((await b.query('select id from public.events where id=$1',[retained])).rowCount,1)
  await rpc(b,'leave_event',retained)
  check('Participant retains authorized detail and can leave after archive')
  const rollback = await event()
  await admin.query("alter table public.participation_history add constraint test_history_failure check(reason <> 'registration') not valid")
  await assert.rejects(rpc(a,'register_for_event',rollback),/check constraint/)
  assert.equal((await admin.query('select * from public.event_participations where event_id=$1',[rollback])).rowCount,0)
  await admin.query('alter table public.participation_history drop constraint test_history_failure')
  check('Forced history failure rolls back participation in same transaction')
  const concurrency = []
  const pids = [a.processID,b.processID]
  assert.notEqual(...pids)
  for (let round=0;round<10;round++) {
    const contested = await event()
    await admin.query('begin'); await admin.query('select id from public.events where id=$1 for update',[contested])
    // Both independent connections submit before the gate lock is released.
    const contenders = Promise.allSettled([rpc(a,'register_for_event',contested),rpc(b,'register_for_event',contested)])
    let waiting = false
    for (let attempt=0;attempt<100;attempt++) {
      const locks = await admin.query("select pid from pg_stat_activity where pid=any($1::int[]) and wait_event_type='Lock'",[pids])
      if (locks.rowCount===2) { waiting=true; break }
      await new Promise(r=>setTimeout(r,10))
    }
    await admin.query('commit')
    const outcomes = await contenders
    assert.equal(waiting,true,'Both clients must be simultaneously waiting on real PostgreSQL locks')
    assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1)
    assert.match(outcomes.find(r=>r.status==='rejected').reason.message,/event_full/)
    const count = (await admin.query(`select count(*)::int n from public.event_participations where event_id=$1 and status='confirmed'`,[contested])).rows[0].n
    assert.equal(count,1)
    assert.equal((await admin.query('select count(*)::int n from public.participation_history h join public.event_participations p on p.id=h.participation_id where p.event_id=$1',[contested])).rows[0].n,1)
    concurrency.push({round,pids,bothWaiting:true,confirmed:count,outcomes:outcomes.map(r=>r.status)})
  }
  check('10 REAL simultaneous last-place races: distinct backend PIDs, both lock-waiting, exactly one confirms / one event_full, one history')
  const dual = await event()
  await role(b,alice)
  await Promise.all([rpc(a,'register_for_event',dual),rpc(b,'register_for_event',dual)])
  assert.equal((await admin.query('select * from public.event_participations where event_id=$1',[dual])).rowCount,1)
  check('Same-user concurrent retries are idempotent on independent connections')
  await a.query('begin isolation level repeatable read')
  await assert.rejects(rpc(a,'register_for_event',dual),error=>error.code==='40001' && error.message==='retry_read_committed')
  await a.query('rollback')
  check('Frozen REPEATABLE READ snapshot explicitly rejected instead of risking stale capacity count')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/participations-r1'
  await mkdir(out,{recursive:true})
  await writeFile(`${out}/postgres-results.json`,JSON.stringify({version,environment:'Local PostgreSQL; Auth/Storage scaffolding, no Supabase HTTP',results,concurrency},null,2))
} finally {
  for (const c of clients) { try { await c.query('rollback'); await c.end() } catch { /* Close every test connection. */ } }
  if (started) await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})
}
