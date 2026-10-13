import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
const toolsRoot = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(toolsRoot, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(toolsRoot, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/suggestions-${Date.now()}`)
const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port; await new Promise(resolve => probe.close(resolve))
const clients = [], results = []; let started = false
const aId = '20000000-0000-4000-8000-000000000001', bId = '20000000-0000-4000-8000-000000000002'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await c.connect(); clients.push(c); return c }
async function role(c, id) { await c.query('reset role'); await c.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await c.query(`set role ${id ? 'authenticated' : 'anon'}`) }
const suggestions = async (c, lat = null, lng = null, limit = 20) => (await c.query('select * from public.get_suggested_events($1,$2,$3)', [lat, lng, limit])).rows
const ids = rows => rows.map(row => row.id)
const interests = async (c, cats) => c.query('select * from public.set_my_category_interests($1)', [cats])
try {
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
  for (const file of migrations) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  const fn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.get_suggested_events(double precision,double precision,integer)'::regprocedure")).rows[0]
  assert.equal(fn.prosecdef, false); assert.ok(fn.proconfig.includes('search_path=""'))
  for (const id of [aId, bId]) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  const cats = (await admin.query('select id from public.categories order by id limit 3')).rows.map(row => row.id)
  const a = await connect(), b = await connect(), anon = await connect()
  await role(a, aId); await role(b, bId); await role(anon, null)
  await assert.rejects(suggestions(anon), /permission denied/)
  await role(b, null); await b.query('set role authenticated'); assert.deepEqual(await suggestions(b), []); await role(b, bId)
  check('Full replay; invoker/empty search_path, anon denied, missing identity returns nothing')
  await assert.rejects(suggestions(a, 0, null), /invalid_origin/)
  await assert.rejects(suggestions(a, 91, 0), /invalid_origin/)
  await assert.rejects(suggestions(a, NaN, 0), /invalid_origin/)
  for (const limit of [0, 21, null]) await assert.rejects(suggestions(a, null, null, limit), /invalid_limit/)
  check('Origin is optional, finite and all-or-nothing; output limit 1..20')
  await admin.query('begin') // fixes all fixture times to this transaction, never production
  const now = (await admin.query("select transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires' as t")).rows[0].t
  const add = async (title, cat, days, lat = 0, lng = 0, visibility = 'public') => {
    const id = (await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
    values($1,$2,$3,'Fixture', (transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires') + $4 * interval '1 day',
    (transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires') + $4 * interval '1 day' + interval '2 hours','Buenos Aires',$5,$6,10,$7) returning id`, [aId, cat, title, Math.max(1, days), lat, lng, visibility])).rows[0].id
    if (days < 1) await admin.query(`update public.events set starts_at=(transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires') + $2 * interval '1 day',
      ends_at=(transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires') + $2 * interval '1 day' + interval '2 hours' where id=$1`, [id,days])
    return id
  }
  const near = await add('Near matching', cats[0], 2, 0, 0)
  const farther = await add('Far matching', cats[0], 2, 0, 1)
  const sooner = await add('Sooner matching', cats[1], 1, 0, 0)
  const distant = await add('Other distant future', cats[2], 9, 0, 1)
  const soonOther = await add('Other soon', cats[2], 3, 0, 1)
  const nearOther = await add('Other near', cats[2], 9, 0, 0)
  const ongoing = await add('Ongoing', cats[0], -.02, 0, 1)
  const hidden = await add('Hidden owned', cats[0], 1, 0, 0, 'unlisted')
  const cancelled = await add('Cancelled', cats[0], 1)
  await admin.query("update public.events set cancelled_at=(transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires') where id=$1", [cancelled])
  const archived = await add('Archived', cats[0], 1)
  await admin.query("update public.events set cancelled_at=(transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires'),archived_at=(transaction_timestamp() at time zone 'America/Argentina/Buenos_Aires') where id=$1", [archived])
  const ended = await add('Ended', cats[0], -2)
  const tie1 = await add('Tie 1', cats[0], 15, 0, 1), tie2 = await add('Tie 2', cats[0], 15, 0, 1)
  await admin.query('update public.events set starts_at=(select starts_at from public.events where id=$1), ends_at=(select ends_at from public.events where id=$1) where id=$2', [tie1,tie2])
  const justInside = await add('Inside 50km', cats[2], 9, 49.99/6371*180/Math.PI, 0)
  const justOutside = await add('Outside 50km', cats[2], 9, 50.01/6371*180/Math.PI, 0)
  const dateInside = await add('Inside 7 days', cats[2], 6.99, 0, 1), dateOutside = await add('Outside 7 days', cats[2], 7.01, 0, 1)
  await admin.query('commit')
  await interests(a, [cats[0], cats[1]])
  let rows = await suggestions(a, 0, 0)
  assert.deepEqual(ids(rows).slice(0, 3), [sooner, near, ongoing])
  assert.ok(ids(rows).indexOf(near) < ids(rows).indexOf(farther))
  assert.ok(rows.every(row => row.has_interests))
  assert.ok(!ids(rows).includes(distant)); assert.ok(ids(rows).includes(soonOther)); assert.ok(ids(rows).includes(nearOther))
  assert.ok(![hidden,cancelled,archived,ended,justOutside,dateOutside].some(id => ids(rows).includes(id)))
  assert.ok(ids(rows).includes(justInside)); assert.ok(ids(rows).includes(dateInside))
  assert.deepEqual(ids(rows).filter(id => [tie1,tie2].includes(id)), [tie1,tie2].sort())
  check('CA-02/03: two interests; affinity, proximity, date, 50km/7-day boundaries; deterministic starts_at/id ties; exclude hidden owned/closed')
  rows = await suggestions(a)
  assert.equal(rows.find(r => r.id === near).distance_km, null)
  assert.ok(!ids(rows).includes(nearOther)); assert.ok(ids(rows).includes(ongoing))
  assert.deepEqual(ids(await suggestions(a)), ids(rows))
  await interests(b, [cats[2]])
  assert.deepEqual(ids(await suggestions(a)), ids(rows)); assert.notDeepEqual(ids(await suggestions(b)), ids(rows))
  await interests(a, [cats[2]]); assert.ok(ids(await suggestions(a)).includes(distant))
  check('No GPS means no distance; ongoing eligible; reproducible ordering; interests recompute; B cannot change A results')
  await b.query('select public.register_for_event($1)', [near])
  assert.ok(ids(await suggestions(b)).includes(near))
  await admin.query('update public.categories set is_active=false where id=$1', [cats[2]])
  assert.ok((await suggestions(a)).find(r => r.id === distant)?.matches_interest)
  await admin.query('update public.categories set is_active=true where id=$1', [cats[2]])
  check('Own and confirmed events stay eligible; saved inactive interests still provide affinity')
  await interests(a, [])
  rows = await suggestions(a)
  assert.ok(rows.every(r => !r.has_interests))
  assert.equal(rows[0].id, ongoing)
  assert.deepEqual(ids(await suggestions(a,0,0)), ids(rows))
  assert.equal((await a.query('select * from public.get_suggested_events()')).rowCount, 6)
  check('No-interest fallback is chronological and explicitly general, default six; GPS does not disguise personalization')
  await admin.query('update public.events set cancelled_at=(statement_timestamp() at time zone \'America/Argentina/Buenos_Aires\') where cancelled_at is null')
  assert.deepEqual(await suggestions(a), [])
  check('CA-04: no available events is an empty list')
  const first30 = []
  for (let i=0;i<35;i++) first30.push(await add(`Earlier irrelevant ${i}`, cats[2], 9+i/100, 0, 1))
  const beyond = await add('Relevant beyond first 30', cats[0], 20, 0, 1)
  await interests(a, [cats[0]])
  assert.deepEqual(ids(await suggestions(a)), [beyond])
  await admin.query('update public.events set cancelled_at=(statement_timestamp() at time zone \'America/Argentina/Buenos_Aires\') where id=$1', [beyond])
  assert.deepEqual(await suggestions(a), [])
  check('Ranking precedes LIMIT: relevant event beyond first 30; no arbitrary fallback with interests, cancellation disappears on requery')
  const plan = (await a.query('explain (analyze, buffers, format text) select * from public.get_suggested_events()')).rows
  const output = process.env.PLANIT_SQL_OUTPUT ?? 'docs/design/verification/r4-block-4/sql'
  await mkdir(output, { recursive: true }); await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Real local embedded PostgreSQL; simulated Auth/Storage and JWT claims; no HTTP JWT or remote writes', version, migrations, fixtureTime:now, plan, results }, null, 2))
} finally {
  for (const c of clients) { try { await c.end() } catch { /* cleanup */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'immediate', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
