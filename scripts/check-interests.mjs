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
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/interests-${Date.now()}`)
const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port; await new Promise(resolve => probe.close(resolve))
const clients = [], results = []; let started = false
const aId = '20000000-0000-4000-8000-000000000001', bId = '20000000-0000-4000-8000-000000000002'
const missing = '20000000-0000-4000-8000-000000000099'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await c.connect(); clients.push(c); return c }
async function role(c, id) { await c.query('reset role'); await c.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await c.query(`set role ${id ? 'authenticated' : 'anon'}`) }
const set = async (c, ids) => (await c.query('select * from public.set_my_category_interests($1::uuid[])', [ids])).rows.map(row => row.category_id).sort()
const own = async c => (await c.query('select category_id from public.user_category_interests order by category_id')).rows.map(row => row.category_id)
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
  check('Complete migration replay, including blocks 1/2 and new interests table')
  const fn = (await admin.query("select prosecdef,proconfig from pg_proc where oid='public.set_my_category_interests(uuid[])'::regprocedure")).rows[0]
  assert.equal(fn.prosecdef, true); assert.ok(fn.proconfig.includes('search_path=""'))
  assert.equal((await admin.query("select relrowsecurity from pg_class where oid='public.user_category_interests'::regclass")).rows[0].relrowsecurity, true)
  for (const id of [aId, bId]) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  const cats = (await admin.query('select id from public.categories order by id limit 3')).rows.map(row => row.id)
  assert.equal(cats.length, 3)
  const a = await connect(), b = await connect(), anon = await connect()
  await role(a, aId); await role(b, bId); await role(anon, null)
  assert.deepEqual(await set(a, []), [])
  assert.deepEqual(await set(a, [cats[0]]), [cats[0]])
  assert.deepEqual(await set(a, cats), [...cats].sort())
  const created = (await a.query('select category_id,created_at from public.user_category_interests order by category_id')).rows
  assert.deepEqual(await set(a, cats), [...cats].sort())
  assert.deepEqual((await a.query('select category_id,created_at from public.user_category_interests order by category_id')).rows, created)
  check('CA-01/02: 0/1/N selection, repeated save has no duplicates and preserves created_at')
  await set(b, [cats[2]])
  assert.deepEqual(await own(a), [...cats].sort()); assert.deepEqual(await own(b), [cats[2]])
  assert.equal((await a.query('select * from public.user_category_interests where user_id=$1', [bId])).rowCount, 0)
  for (const c of [a, b, anon]) {
    for (const sql of [`insert into public.user_category_interests(user_id,category_id) values('${bId}','${cats[0]}')`,
      `update public.user_category_interests set user_id='${bId}'`, 'delete from public.user_category_interests']) await assert.rejects(c.query(sql), /permission denied/)
  }
  await assert.rejects(anon.query('select * from public.user_category_interests'), /permission denied/)
  await assert.rejects(set(anon, []), /permission denied/)
  await role(anon, missing); await assert.rejects(set(anon, []), /interests_profile_required/)
  await anon.query("select set_config('request.jwt.claim.sub','',false)"); await assert.rejects(set(anon, []), /interests_auth_required/)
  check('CA-03: A/B own-only RLS; cross-account SELECT returns zero; all REST writes and anon denied; auth/profile guards')
  for (const ids of [null, [null], [cats[0], cats[0]], [missing], [cats[0], missing]]) {
    await assert.rejects(set(a, ids), /interests_invalid_selection|interests_category_unavailable/)
    assert.deepEqual(await own(a), [...cats].sort())
  }
  await assert.rejects(set(a, ['not-a-uuid']), /invalid input syntax/)
  check('CA-04: null/duplicate/unknown/malformed IDs fail without partial changes')
  await admin.query('update public.categories set is_active=false where id=$1', [cats[0]])
  assert.deepEqual(await set(a, [cats[0], cats[1]]), [cats[0], cats[1]].sort())
  await assert.rejects(set(b, [cats[0], cats[2]]), /interests_category_unavailable/)
  assert.deepEqual(await own(b), [cats[2]])
  await set(a, [cats[1]]); await assert.rejects(set(a, [cats[0], cats[1]]), /interests_category_unavailable/)
  check('Inactive saved interest retained until removal; inactive new/re-added selection rejected atomically')
  await admin.query(`create function public.interests_test_failure() returns trigger language plpgsql as $$ begin raise exception 'fixture_insert_failure'; end $$;
    create trigger interests_test_failure before insert on public.user_category_interests for each row execute function public.interests_test_failure();`)
  await assert.rejects(set(a, [cats[2]]), /fixture_insert_failure/)
  assert.deepEqual(await own(a), [cats[1]])
  await admin.query('drop trigger interests_test_failure on public.user_category_interests; drop function public.interests_test_failure()')
  check('CA-04: forced INSERT failure after DELETE rolls back the entire replacement')
  await set(a, []); const second = await connect(); await role(second, aId)
  await a.query('begin'); await set(a, [cats[1]])
  const queued = set(second, [cats[2]])
  let blocked = false
  for (let i = 0; i < 30; i++) {
    blocked = (await admin.query('select wait_event_type from pg_stat_activity where pid=$1', [second.processID])).rows[0]?.wait_event_type === 'Lock'
    if (blocked) break
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.equal(blocked, true); await a.query('commit'); assert.deepEqual(await queued, [cats[2]])
  assert.deepEqual(await own(a), [cats[2]]); assert.deepEqual(await own(b), [cats[2]])
  check('Concurrent replacements of an initially empty account serialize; last completed replacement wins without a union')
  await a.query('begin'); await set(a, [cats[1]])
  const categoryWriter = await connect(); const deactivate = categoryWriter.query('update public.categories set is_active=false where id=$1', [cats[1]])
  blocked = false
  for (let i = 0; i < 30; i++) {
    blocked = (await admin.query('select wait_event_type from pg_stat_activity where pid=$1', [categoryWriter.processID])).rows[0]?.wait_event_type === 'Lock'
    if (blocked) break
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.equal(blocked, true); await a.query('commit'); await deactivate
  assert.deepEqual(await set(a, [cats[1]]), [cats[1]])
  check('Category deactivation waits for a validated save; saved inactive preference remains valid')
  const reloaded = await connect(); await role(reloaded, aId); assert.deepEqual(await own(reloaded), [cats[1]])
  await set(reloaded, []); assert.deepEqual(await own(a), []); assert.deepEqual(await own(b), [cats[2]])
  check('CA-02/03: fresh authenticated connection recovers persisted preference; clear does not affect B')
  const types = (await admin.query("select data_type from information_schema.columns where table_name='user_category_interests' and column_name='created_at'")).rows
  assert.equal(types[0].data_type, 'timestamp without time zone')
  check('created_at follows Argentina timestamp convention; table/FKs/PK replay successfully')
  const output = process.env.PLANIT_SQL_OUTPUT ?? 'docs/design/verification/r4-block-3/sql'
  await mkdir(output, { recursive: true }); await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Real local embedded PostgreSQL; simulated Auth/Storage and JWT claims; no HTTP JWT or remote writes', version, migrations, results }, null, 2))
} finally {
  for (const c of clients) { try { await c.end() } catch { /* cleanup */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'immediate', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
