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
const run = promisify(execFile)
const directory = resolve(`.participation-test-tools.local/home-${Date.now()}`)
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
const page = async (client, startsAt = null, id = null, limit = 30) => (await client.query('select * from public.get_home_events($1,$2,$3)', [startsAt, id, limit])).rows
const organizer = async (client, id) => (await client.query('select * from public.get_event_organizer($1)', [id])).rows
try {
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 })
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
  for (const file of (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8')
    if (sql.trim()) await admin.query(sql)
  }
  const homeFn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.get_home_events(timestamp,uuid,integer)'::regprocedure")).rows[0]
  const organizerFn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.get_event_organizer(uuid)'::regprocedure")).rows[0]
  assert.equal(homeFn.prosecdef, false); assert.ok(homeFn.proconfig.includes('search_path=""'))
  assert.equal(organizerFn.prosecdef, true); assert.ok(organizerFn.proconfig.includes('search_path=""'))
  check('Replay migrations; home invoker and organizer projection definer use empty search_path')

  for (const id of [owner, participant, stranger]) await admin.query('insert into auth.users values ($1,$2)', [id, { display_name: 'Prueba' }])
  await admin.query("update public.profiles set display_name='Organizadora visible',username='organizadora',visibility='private',birth_date='1990-01-01',sex='female',bio='dato privado' where id=$1", [owner])
  const a = await connect(); const b = await connect(); const c = await connect()
  await role(a, owner); await role(b, participant); await role(c, stranger)
  const categories = (await admin.query('select id,name from public.categories where is_active order by name')).rows
  const ids = []
  for (let n = 0; n < 34; n++) {
    const category = categories[n % 2]
    ids.push((await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      values ($1,$2,$3,'Prueba local','2099-10-11 20:00'::timestamp + ($4::text || ' minutes')::interval,'2099-10-11 22:00'::timestamp + ($4::text || ' minutes')::interval,'Buenos Aires',-34.6,-58.38,10) returning id`, [owner, category.id, `Evento ${String(n).padStart(2, '0')}`, n])).rows[0].id)
  }
  const accessibleEvent = ids[0]
  await b.query('select public.register_for_event($1)', [accessibleEvent])
  const path = `${owner}/${accessibleEvent}/cover.webp`
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values ('event_media',$1,$2,$3)", [path, owner, { mimetype: 'image/webp', size: 10 }])
  const fileId = (await admin.query("insert into public.files(uploaded_by,bucket_name,storage_path,mime_type,size_bytes) values ($1,'event_media',$2,'image/webp',10) returning id", [owner,path])).rows[0].id
  await admin.query('insert into public.event_images(event_id,file_id,sort_order) values ($1,$2,0)', [accessibleEvent,fileId])
  const first = await page(a)
  assert.equal(first.length, 31)
  const visible = first.slice(0, 30)
  assert.ok(visible.every((row,index) => index === 0 || visible[index - 1].starts_at < row.starts_at || (visible[index - 1].starts_at.getTime() === row.starts_at.getTime() && visible[index - 1].id.localeCompare(row.id) < 0)))
  assert.equal(new Set(visible.map(row => row.id)).size, 30)
  assert.ok(visible.every(row => categories.some(category => category.id === row.category_id && category.name === row.category_name)))
  assert.equal(visible.find(row => row.id === accessibleEvent).image_path, path)
  const second = await page(a, visible.at(-1).starts_at, visible.at(-1).id)
  assert.equal(second.length, 4)
  assert.equal(new Set([...visible, ...second].map(row => row.id)).size, 34)
  check('Upcoming events are deterministically ordered, grouped with their stored categories, and keyset-paginated without gaps')

  await admin.query("update public.events set starts_at='2020-10-11 20:00',ends_at='2020-10-11 22:00' where id=$1", [ids[1]])
  await admin.query("update public.events set cancelled_at='2026-10-10 12:00' where id=$1", [ids[2]])
  await admin.query("update public.events set cancelled_at='2026-10-10 12:00',archived_at='2026-10-11 22:00' where id=$1", [ids[3]])
  const filtered = await page(a, null, null, 100)
  assert.ok(!filtered.some(row => [ids[1], ids[2], ids[3]].includes(row.id)))
  assert.deepEqual(await page(c, null, null, 30).then(rows => rows.map(row => row.id)), (await page(a, null, null, 30)).map(row => row.id))
  await role(c, null); await assert.rejects(page(c), /permission denied/)
  check('Past, cancelled, and archived events are excluded; authenticated access is required')

  await role(c, stranger)
  assert.deepEqual(await organizer(b, accessibleEvent), [{ display_name: 'Organizadora visible', username: 'organizadora' }])
  assert.deepEqual(Object.keys((await organizer(b, accessibleEvent))[0]).sort(), ['display_name','username'])
  assert.equal((await c.query('select birth_date,sex,bio from public.profiles where id=$1', [owner])).rowCount, 0)
  const privateEvent = (await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
    values ($1,$2,'Oculto','Prueba local','2099-10-11 20:00','2099-10-11 22:00','Buenos Aires',-34.6,-58.38,10,'unlisted') returning id`, [owner, categories[0].id])).rows[0].id
  assert.deepEqual(await organizer(c, privateEvent), [])
  assert.equal((await c.query('select id from public.events where id=$1', [privateEvent])).rowCount, 0)
  assert.equal((await c.query('select id from public.events where id=$1', [ids[2]])).rowCount, 0)
  check('Organizer projection exposes only social name/username to an event participant; strangers cannot resolve unlisted organizers or read private profile fields')

  await role(c, null); await assert.rejects(organizer(c, accessibleEvent), /permission denied/)
  await role(c, stranger)
  assert.deepEqual(await page(c, '2099-10-11 20:00', null), [])
  check('Incomplete page cursor returns no data')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/home-event-detail'
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/postgres-results.json`, JSON.stringify({ version, environment: 'Local PostgreSQL; test Auth/Storage scaffolding only, no real Supabase Auth/REST', results }, null, 2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Release every local connection. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
