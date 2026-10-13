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
const directory = resolve(`.participation-test-tools.local/search-${Date.now()}`)
const probe = createServer()
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const clients = []; const results = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001'
const stranger = '20000000-0000-4000-8000-000000000003'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const client = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await client.connect(); clients.push(client); return client }
async function role(client, id) { await client.query('reset role'); await client.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await client.query(`set role ${id ? 'authenticated' : 'anon'}`) }
const search = async (client, args = {}) => {
  const a = { q: null, cats: null, at: null, id: null, limit: 30, b: [null, null, null, null], ...args }
  return (await client.query('select * from public.search_public_events($1,$2,$3,$4,$5,$6,$7,$8,$9)', [a.q, a.cats, a.at, a.id, a.limit, ...a.b])).rows
}
const titles = rows => rows.map(row => row.title).sort()
const ids = rows => rows.map(row => row.id)
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
  const fn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.search_public_events(text,uuid[],timestamp,uuid,integer,double precision,double precision,double precision,double precision)'::regprocedure")).rows[0]
  assert.equal(fn.prosecdef, false); assert.ok(fn.proconfig.includes('search_path=""'))
  check('Replay migrations; search_public_events is SECURITY INVOKER with empty search_path')

  for (const id of [owner, stranger]) await admin.query('insert into auth.users values ($1,$2)', [id, { display_name: 'Prueba' }])
  const a = await connect(); const c = await connect()
  await role(a, owner); await role(c, stranger)
  const [cat1, cat2] = (await admin.query('select id from public.categories where is_active order by name limit 2')).rows.map(row => row.id)
  const inactive = (await admin.query("insert into public.categories(name,slug,is_active) values ('Inactiva R4','inactiva-r4',true) returning id")).rows[0].id
  const add = async (title, description, category, extra = {}) => (await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
    values ($1,$2,$3,$4,$5,$6,'Buenos Aires',$7,$8,10,$9) returning id`, [owner, category, title, description, extra.starts ?? '2099-10-11 20:00', extra.ends ?? '2099-10-11 22:00', extra.lat ?? -34.6, extra.lng ?? -58.38, extra.visibility ?? 'public'])).rows[0].id
  const rock = await add('Festival de Rock', 'Bandas en vivo', cat1)
  const jazz = await add('Noche tranquila', 'Jazz y vinos', cat2, { starts: '2099-10-12 20:00', ends: '2099-10-12 22:00' })
  const pct = await add('100% Entradas', 'Descuento_total', cat1, { starts: '2099-10-13 20:00', ends: '2099-10-13 22:00' })
  const slash = await add('Ruta C:\\datos', 'Barra \\ invertida', cat2, { starts: '2099-10-14 20:00', ends: '2099-10-14 22:00' })
  const inact = await add('Taller antiguo', 'Categoría inactiva', inactive, { starts: '2099-10-15 20:00', ends: '2099-10-15 22:00' })
  const hidden = await add('Rock oculto', 'No listado', cat1, { visibility: 'unlisted' })
  const cancelled = await add('Rock cancelado', 'x', cat1); await admin.query("update public.events set cancelled_at='2026-10-10 12:00' where id=$1", [cancelled])
  const archived = await add('Rock archivado', 'x', cat1); await admin.query("update public.events set cancelled_at='2026-10-10 12:00',archived_at='2026-10-11 22:00' where id=$1", [archived])
  await admin.query('update public.categories set is_active=false where id=$1', [inactive])
  const ended = await add('Rock terminado', 'x', cat1); await admin.query("update public.events set starts_at='2020-10-11 20:00',ends_at='2020-10-11 22:00' where id=$1", [ended])
  const ongoing = await add('Rock en curso', 'x', cat1); await admin.query("update public.events set starts_at='2020-10-11 20:00' where id=$1", [ongoing])
  const far = await add('Rock lejano', 'x', cat1, { starts: '2099-10-16 20:00', ends: '2099-10-16 22:00', lat: 40, lng: 10 })

  assert.deepEqual(titles(await search(a, { q: 'festival' })), ['Festival de Rock'])
  assert.deepEqual(titles(await search(a, { q: 'JAZZ' })), ['Noche tranquila'])
  assert.deepEqual(titles(await search(a, { q: 'FeStIvAl' })), titles(await search(a, { q: 'festival' })))
  check('CA R4-01.01/02: title and description match, case-insensitive, repeated with different text')
  assert.deepEqual(await search(a, { q: 'zzzz-sin-match' }), [])
  assert.ok(!ids(await search(a, { q: 'rock' })).includes(jazz))
  check('CA R4-01.03/04: non-matching events are not returned; no-match query is an empty list, not an error')
  assert.deepEqual(ids(await search(a, { q: '%' })), [pct])
  assert.deepEqual(ids(await search(a, { q: '_' })), [pct])
  assert.deepEqual(ids(await search(a, { q: '\\' })), [slash])
  assert.deepEqual(ids(await search(a, { q: 'Fest%' })), [])
  assert.deepEqual(ids(await search(a, { q: "Fest'; drop table public.events;--" })), [])
  assert.equal((await admin.query('select count(*)::int n from public.events')).rows[0].n, 11)
  check('Wildcards %, _ and \\ are literal; injection text is inert')
  const all = await search(a)
  assert.deepEqual(ids(await search(a, { q: '   ' })), ids(all))
  assert.deepEqual(ids(await search(a, { q: null })), ids(all))
  assert.deepEqual(ids(await search(a, { q: '  festival  ' })), [rock])
  await assert.rejects(search(a, { q: 'x'.repeat(101) }), /search_query_too_long/)
  assert.equal((await search(a, { q: 'x'.repeat(100) })).length, 0)
  check('Blank/null query is neutral, trimmed, and length is bounded in SQL')
  assert.deepEqual(ids(all).sort(), [rock, jazz, pct, slash, inact, ongoing, far].sort())
  assert.ok(![hidden, cancelled, archived, ended].some(id => ids(all).includes(id)))
  check('Universe: public, not cancelled/archived/finished; unlisted never returned; in-progress included')

  assert.deepEqual(ids(await search(a, { cats: [cat1] })).sort(), [rock, pct, ongoing, far].sort())
  assert.deepEqual(ids(await search(a, { cats: [cat1, cat2] })).sort(), [rock, jazz, pct, slash, ongoing, far].sort())
  check('CA R4-02.01: one or several categories (OR)')
  assert.deepEqual(ids(await search(a, { cats: [inactive] })), [])
  assert.deepEqual(ids(await search(a, { cats: [] })), ids(all))
  assert.deepEqual(ids(await search(a, { cats: null })), ids(all))
  check('Inactive categories are ignored; [] and null are neutral (CA R4-02.03: removing a selection restores results)')
  assert.deepEqual(ids(await search(a, { q: 'rock', cats: [cat1] })).sort(), [rock, ongoing, far].sort())
  assert.deepEqual(ids(await search(a, { q: 'rock', cats: [cat2] })), [])
  assert.deepEqual(ids(await search(a, { q: 'rock', cats: [cat1], b: [30, 50, 0, 20] })), [far])
  check('CA R4-02.02/04: text AND categories AND bounds; empty intersection is an empty list')

  assert.deepEqual(ids(await search(c)), ids(all))
  await role(c, null); await assert.rejects(search(c), /permission denied/)
  await role(c, stranger)
  check('A/B authenticated users see the same public result; anonymous is denied')

  const p1 = (await search(a, { limit: 3 }))
  assert.equal(p1.length, 4)
  const page1 = p1.slice(0, 3)
  const p2 = await search(a, { limit: 3, at: page1.at(-1).starts_at, id: page1.at(-1).id })
  const page2 = p2.slice(0, 3)
  const p3 = await search(a, { limit: 3, at: page2.at(-1).starts_at, id: page2.at(-1).id })
  const walked = [...page1, ...page2, ...p3.slice(0, 3)]
  assert.equal(new Set(ids(walked)).size, walked.length)
  assert.deepEqual(ids(walked).sort(), ids(all).sort())
  assert.ok(walked.every((row, index) => index === 0 || walked[index - 1].starts_at <= row.starts_at))
  await assert.rejects(search(a, { at: '2099-10-11 20:00' }), /search_invalid_cursor/)
  await assert.rejects(search(a, { b: [1, 2, null, null] }), /search_invalid_bounds/)
  await assert.rejects(search(a, { b: [50, 10, 0, 1] }), /search_invalid_bounds/)
  check('Keyset cursor is stable with no duplicates; invalid cursor/bounds are rejected')

  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-1'
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/postgres-results.json`, JSON.stringify({ version, environment: 'Local PostgreSQL; test Auth/Storage scaffolding only, no real Supabase Auth/REST/JWT', results }, null, 2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Release every local connection. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
