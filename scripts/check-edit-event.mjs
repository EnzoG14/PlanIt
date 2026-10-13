import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import ts from 'typescript'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

// Isolated real PostgreSQL, no remote URL; Auth/Storage SQL scaffolding only.
const run = promisify(execFile)
const directory = resolve(`.participation-test-tools.local/edit-event-${Date.now()}`)
const probe = createServer()
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const clients = []; const results = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001'
const participant = '20000000-0000-4000-8000-000000000002'
const stranger = '20000000-0000-4000-8000-000000000003'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const client = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await client.connect(); clients.push(client); return client }
async function role(client, id) { await client.query('reset role'); await client.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await client.query(`set role ${id ? 'authenticated' : 'anon'}`) }
const list = async (client, section, offset = 0) => (await client.query('select * from public.get_my_events($1,$2)', [section, offset])).rows
const organized = async (client, filter = 'all', offset = 0) => (await client.query('select * from public.get_my_organized_events($1,$2)', [filter, offset])).rows
const compiled = ts.transpileModule(await readFile('src/features/events/validation.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const { eventDateMinimums } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
assert.deepEqual(eventDateMinimums({start_date:'2099-10-12',start_time:'23:59',end_date:'2099-10-13'},new Date('2026-10-12T02:59:30Z')),{start_date:'2026-10-12',start_time:undefined,end_date:'2099-10-13',end_time:'00:00'})
assert.equal(eventDateMinimums({start_date:'2026-10-12',start_time:'12:00',end_date:'2026-10-12'},new Date('2026-10-12T14:00:00Z')).end_time,'12:01')
check('Native date/time minima use Argentina and roll over midnight; end follows start')
try {
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 })
  started = true
  const admin = await connect()
  const version = (await admin.query('select version()')).rows[0].version
  await admin.query(`create role anon; create role authenticated; create role service_role;
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
  for (const file of (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql)
  }
  const fn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.get_my_events(text,integer)'::regprocedure")).rows[0]
  assert.equal(fn.prosecdef, false); assert.ok(fn.proconfig.includes('search_path=""'))
  check('Replay migrations; invoker function, empty search_path')
  for (const id of [owner, participant, stranger]) await admin.query('insert into auth.users values ($1,$2)', [id, { display_name: 'Prueba' }])
  const a = await connect(); const b = await connect(); const c = await connect()
  await role(a, owner); await role(b, participant); await role(c, stranger)
  assert.deepEqual(await list(c, 'organizing'), []); assert.deepEqual(await list(c, 'participating'), [])
  async function create(user = owner, title = 'Encuentro local') {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [user])
    return (await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      select id,$1,'Fixture SQL','2099-10-11 20:00','2099-10-11 22:00','Buenos Aires',-34.6,-58.38,10 from public.categories limit 1 returning id`, [title])).rows[0].id
  }
  const id = await create()
  const category = (await admin.query('select category_id from public.events where id=$1',[id])).rows[0].category_id
  const sql = 'select public.update_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)'
  const values = [id,'Título editado','Descripción editada','2099-10-12 23:30','2099-10-13 03:00',category,10,'Dirección nueva',-34.5,-58.4,'Lugar nuevo']
  const edit = (client, override={}) => { const args=[...values]; for(const [key,value] of Object.entries(override)) args[Number(key)]=value; return client.query(sql,args) }
  const state = async () => (await admin.query('select * from public.events where id=$1',[id])).rows[0]
  const signature = 'public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text)'
  const security = (await admin.query('select prosecdef,proconfig from pg_proc where oid=$1::regprocedure',[signature])).rows[0]
  assert.equal(security.prosecdef,true); assert.ok(security.proconfig.includes('search_path=""'))
  assert.equal((await admin.query("select has_function_privilege('anon',$1,'EXECUTE') allowed",[signature])).rows[0].allowed,false)
  assert.equal((await admin.query("select has_table_privilege('authenticated','public.events','UPDATE') allowed")).rows[0].allowed,false)
  await edit(a)
  const saved=await state();assert.equal(saved.id,id);assert.equal(saved.organizer_id,owner);assert.equal(saved.title,values[1]);assert.equal(saved.starts_at.getDate(),12);assert.equal(saved.ends_at.getDate(),13)
  assert.equal((await organized(a))[0].title,values[1])
  assert.equal((await b.query('select title from public.events where id=$1',[id])).rows[0].title,values[1])
  const chat = (await admin.query('select id from public.conversations where event_id=$1',[id])).rows[0].id
  await edit(a);assert.equal((await admin.query('select id from public.conversations where event_id=$1',[id])).rows[0].id,chat)
  check('Organizer edits same ID; Argentina overnight timestamps, detail/list readback; retries retain one event/chat')
  for(const [overrides,pattern] of [[{3:'2020-01-01',4:'2020-01-02'},/start_not_future/],[{4:'2099-10-12 20:00'},/end_before_start/],[{3:'infinity'},/start_not_future/],[{6:0},/invalid_capacity/],[{1:' '},/check constraint/],[{2:null},/null value/],[{8:100},/check constraint/],[{5:null},/category_inactive/]]) {
    const before=await state();await assert.rejects(edit(a,overrides),pattern);assert.deepEqual(await state(),before)
  }
  await admin.query('update public.categories set is_active=false where id=$1',[category]);await assert.rejects(edit(a),/category_inactive/);await admin.query('update public.categories set is_active=true where id=$1',[category])
  await b.query('select public.register_for_event($1)',[id]);await c.query('select public.register_for_event($1)',[id])
  await assert.rejects(edit(a,{6:1}),/capacity_below_confirmed/)
  await edit(a,{6:2});assert.equal((await state()).capacity,2)
  const histories=Number((await admin.query('select count(*) from public.participation_history')).rows[0].count)
  await edit(a,{6:3});assert.equal(Number((await admin.query('select count(*) from public.participation_history')).rows[0].count),histories)
  check('Invalid fields/dates/category rollback; capacity equals confirmed allowed, smaller denied; participation/history unchanged')
  await assert.rejects(edit(b),/not_event_organizer/);await assert.rejects(edit(a,{0:'30000000-0000-4000-8000-999999999999'}),/event_unavailable/)
  await assert.rejects(a.query('update public.events set title=$1 where id=$2',['Directo',id]),/permission denied/)
  await assert.rejects(a.query('delete from public.events where id=$1',[id]),/permission denied/)
  await role(c,null);await assert.rejects(edit(c),/permission denied/);await role(c,stranger);await c.query("select set_config('request.jwt.claim.sub','',false)");await assert.rejects(edit(c),/authentication_required/);await role(c,stranger)
  await a.query('begin isolation level repeatable read');await assert.rejects(edit(a),/retry_read_committed/);await a.query('rollback')
  check('B/anon/missing identity/nonexistent event/direct UPDATE and DELETE denied; frozen snapshot rejected')
  for(const mutation of ["cancelled_at='2026-10-11'","archived_at='2026-10-11',cancelled_at='2026-10-11'","starts_at='2020-01-01',ends_at='2099-10-13'","starts_at='2020-01-01',ends_at='2020-01-02'"]) {
    await admin.query(`update public.events set ${mutation} where id=$1`,[id]);const before=await state();await assert.rejects(edit(a),/event_not_editable/);assert.deepEqual(await state(),before)
    await admin.query("update public.events set cancelled_at=null,archived_at=null,starts_at='2099-10-12 23:30',ends_at='2099-10-13 03:00' where id=$1",[id])
  }
  check('Cancelled/archived/ongoing/ended cannot be edited or reopened')
  await c.query('select public.leave_event($1)',[id]);await edit(a,{6:2})
  // Observe a real database lock wait, not timing assumptions.
  async function blocked(client) {
    const pid=(await admin.query('select pid from pg_stat_activity where application_name=$1',[client])).rows[0]?.pid
    assert.ok(pid)
    for(let n=0;n<100;n++) { const row=(await admin.query('select cardinality(pg_blocking_pids($1)) n',[pid])).rows[0];if(row.n>0)return;await new Promise(resolve=>setTimeout(resolve,20)) }
    throw new Error('Expected lock wait did not occur')
  }
  await a.query("set application_name='edit-owner'");await c.query("set application_name='edit-guest'")
  await a.query('begin');await edit(a,{6:1})
  const registration=c.query('select public.register_for_event($1)',[id]).then(()=>null,error=>error)
  await blocked('edit-guest');await a.query('commit');assert.match((await registration).message,/event_full/)
  assert.equal((await state()).capacity,1)
  check('Race: reduction locks first; registration waits then fails full')
  await edit(a,{6:2});await c.query('begin');await c.query('select public.register_for_event($1)',[id])
  const reduction=edit(a,{6:1}).then(()=>null,error=>error)
  await blocked('edit-owner');await c.query('commit');assert.match((await reduction).message,/capacity_below_confirmed/)
  assert.equal((await state()).capacity,2)
  check('Race: registration locks first; reduction waits then sees committed confirmed count and fails')
  const out=process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-2';await mkdir(out,{recursive:true});await writeFile(`${out}/postgres-results.json`,JSON.stringify({version,environment:'Isolated local PostgreSQL, Auth/Storage scaffolding; no remote business writes or HTTP/JWT',results},null,2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Release connections. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
