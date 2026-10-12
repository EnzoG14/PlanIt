import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

// Isolated real PostgreSQL, no remote URL; Auth/Storage SQL scaffolding only.
const run = promisify(execFile)
const directory = resolve(`.participation-test-tools.local/my-events-${Date.now()}`)
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
  await create(participant, 'Evento del participante')
  assert.equal((await list(a, 'organizing'))[0].id, id)
  assert.deepEqual(await list(a, 'participating'), [])
  assert.deepEqual(await list(b, 'participating'), [])
  await b.query('select public.register_for_event($1)', [id])
  await b.query('select public.register_for_event($1)', [id])
  const original = (await b.query('select id from public.event_participations')).rows[0].id
  assert.equal((await list(b, 'participating'))[0].participation_status, 'confirmed')
  await b.query('select public.leave_event($1)', [id])
  assert.equal((await list(b, 'participating'))[0].participation_status, 'cancelled')
  await b.query('select public.register_for_event($1)', [id])
  assert.equal((await b.query('select id from public.event_participations')).rows[0].id, original)
  assert.equal((await list(b, 'participating')).length, 1)
  assert.equal((await list(b, 'organizing')).length, 1)
  assert.deepEqual(await list(c, 'participating'), [])
  assert.deepEqual(Object.keys((await list(b, 'participating'))[0]).sort(), ['id','title','starts_at','ends_at','location_name','address','category_name','event_state','participation_status','image_path'].sort())
  check('Two identities: creation / registration / leave / rejoin, unique row, role separation, third-party exclusion, minimal projection')
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  const path = `${owner}/event/cover.webp`
  await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values ('event_media',$1,$2,$3)", [path, owner, { mimetype: 'image/webp', size: 10 }])
  const file = (await admin.query("insert into public.files(bucket_name,storage_path,mime_type,size_bytes) values ('event_media',$1,'image/webp',10) returning id", [path])).rows[0].id
  await admin.query('insert into public.event_images(event_id,file_id) values ($1,$2)', [id,file])
  await admin.query("update public.events set starts_at='2020-01-01', ends_at='2020-01-02' where id=$1", [id])
  assert.equal((await list(b, 'participating'))[0].event_state, 'ended')
  await admin.query('update public.events set cancelled_at=now() where id=$1', [id])
  assert.equal((await list(b, 'participating'))[0].event_state, 'cancelled')
  await admin.query('update public.events set archived_at=now() where id=$1', [id])
  await admin.query("update public.event_participations set status='removed' where id=$1", [original])
  const archived = (await list(b, 'participating'))[0]
  assert.equal(archived.event_state, 'archived'); assert.equal(archived.participation_status, 'removed'); assert.equal(archived.image_path, path)
  for (const table of ['events','event_images','files','storage.objects']) {
    const name = table.includes('.') ? table : `public.${table}`
    const filter = table === 'events' ? 'id=$1' : table === 'event_images' ? 'event_id=$1' : table === 'files' ? 'id=$1' : 'name=$1'
    const value = table === 'files' ? file : table === 'storage.objects' ? path : id
    assert.equal((await b.query(`select * from ${name} where ${filter}`, [value])).rowCount, 1)
    assert.equal((await c.query(`select * from ${name} where ${filter}`, [value])).rowCount, 0)
  }
  assert.equal((await list(a, 'organizing'))[0].event_state, 'archived')
  check('Ended / cancelled / archived precedence; own removed history and media retained; stranger cannot read historical event/media')
  for (let n = 0; n < 35; n++) await create(owner, `Paginado ${n}`)
  const page1 = await list(a, 'organizing'); const page2 = await list(a, 'organizing', 30)
  assert.equal(page1.length, 31); assert.equal(page2.length, 6)
  assert.equal(new Set([...page1.slice(0,30), ...page2].map(row => row.id)).size, 36)
  assert.deepEqual((await list(a, 'organizing')).map(row => row.id), page1.map(row => row.id))
  check('31-row lookahead, deterministic tie ordering, complete pagination without duplicates')
  const organizedFn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.get_my_organized_events(text,integer)'::regprocedure")).rows[0]
  assert.equal(organizedFn.prosecdef, false); assert.ok(organizedFn.proconfig.includes('search_path=""'))
  for (const roleName of ['anon', 'service_role']) assert.equal((await admin.query("select has_function_privilege($1,'public.get_my_organized_events(text,integer)','EXECUTE') as allowed", [roleName])).rows[0].allowed, false)
  assert.deepEqual((await organized(a, 'archived')).map(row => row.id), [id])
  assert.equal((await organized(a, 'archived'))[0].image_path, path)
  assert.equal((await organized(a, 'all')).length, 31)
  assert.equal((await organized(a, 'all', 30)).length, 5)
  assert.deepEqual(await organized(a, 'past'), [])
  assert.deepEqual(await organized(a, 'cancelled'), [])
  // These matches are behind 35 future rows in the unfiltered list.
  const ongoingId = await create(owner, 'En curso')
  const endedId = await create(owner, 'Finalizado')
  const cancelledId = await create(owner, 'Cancelado pasado')
  await admin.query("update public.events set starts_at=(statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '1 hour', ends_at=(statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '1 hour' where id=$1", [ongoingId])
  for (const eventId of [endedId, cancelledId]) await admin.query("update public.events set starts_at='2020-01-01',ends_at='2020-01-02' where id=$1", [eventId])
  await admin.query('update public.events set cancelled_at=now() where id=$1', [cancelledId])
  assert.deepEqual((await organized(a, 'past')).map(row => row.id), [endedId])
  assert.deepEqual((await organized(a, 'cancelled')).map(row => row.id), [cancelledId])
  const upcoming = [...(await organized(a, 'upcoming')).slice(0,30), ...await organized(a, 'upcoming',30)]
  assert.equal(upcoming.length,36); assert.ok(upcoming.some(row=>row.id===ongoingId))
  assert.ok(upcoming.every(row=>row.event_state==='open' && row.participation_status===null))
  // At the server's end boundary the event is ended; browser timezone is irrelevant.
  await admin.query("update public.events set ends_at=(statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') where id=$1", [ongoingId])
  assert.ok((await organized(a, 'past')).some(row=>row.id===ongoingId))
  await admin.query('update public.events set archived_at=now() where id=$1', [cancelledId])
  assert.deepEqual(await organized(a, 'cancelled'), [])
  assert.ok((await organized(a, 'archived')).some(row=>row.id===cancelledId && row.event_state==='archived'))
  assert.equal((await organized(b)).length,1)
  assert.ok(!(await organized(b)).some(row=>row.id===endedId))
  assert.deepEqual(await organized(c), [])
  assert.equal((await list(b,'participating'))[0].event_state,'archived')
  await assert.rejects(a.query('update public.events set title=$1 where id=$2',['No permitido',id]),/permission denied/)
  await assert.rejects(a.query('delete from public.events where id=$1',[id]),/permission denied/)
  for (const args of [['invalid',0],[null,0],['all',-1],['all',null]]) await assert.rejects(a.query('select * from public.get_my_organized_events($1,$2)',args), /invalid_list_parameters/)
  await assert.rejects(a.query('select * from public.get_my_organized_events(p_organizer_id => $1)',[participant]), /does not exist/)
  check('R3 filters precede pagination; archived-only history, ongoing/end boundary, state precedence, signed-media path, A/B isolation, invoker/minimal grants and no write privilege')
  for (const args of [['invalid',0], [null,0], ['organizing',-1], ['organizing',null]]) await assert.rejects(a.query('select * from public.get_my_events($1,$2)', args), /invalid_list_parameters/)
  await role(c, null); await assert.rejects(list(c, 'organizing'), /permission denied/)
  await assert.rejects(organized(c), /permission denied/)
  await role(c, stranger); await c.query("select set_config('request.jwt.claim.sub','',false)")
  await assert.rejects(list(c, 'organizing'), /authentication_required/)
  await assert.rejects(organized(c), /authentication_required/)
  check('Invalid section/offset, anon, missing JWT rejected')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-1'
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/postgres-results.json`, JSON.stringify({ version, environment: 'Local PostgreSQL; SQL Auth/Storage scaffolding, no real Auth/REST', results }, null, 2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Release every local connection. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
