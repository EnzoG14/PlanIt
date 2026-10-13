import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { randomUUID, createHash } from 'node:crypto'

const root = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(root, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(root, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/links-${Date.now()}`)
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r))
const port = probe.address().port; await new Promise(r => probe.close(r))
const clients = [], results = []; let started = false
const users = Array.from({ length: 3 }, (_, i) => `20000000-0000-4000-8000-00000000000${i + 1}`)
const [owner, confirmed, revoked] = users
const check = name => { results.push({ name, result: 'PASS' }); console.log(`PASS: ${name}`) }
async function connect() { const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' }); await c.connect(); clients.push(c); return c }
async function role(c, uid) { await c.query('reset role'); await c.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? '']); await c.query(`set role ${uid ? 'authenticated' : 'anon'}`) }
const sha = token => createHash('sha256').update(token).digest('hex')
try {
  await mkdir('.participation-test-tools.local', { recursive: true })
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  const admin = await connect()
  await admin.query(`create role anon; create role authenticated; create schema auth; create schema storage;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin end $$;`)
  const migrations = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
  for (const file of migrations) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  for (const uid of users) await admin.query('insert into auth.users values($1,$2)', [uid, { display_name: 'Fixture' }])
  await role(admin, owner); await admin.query('reset role')
  const category = (await admin.query('select id from public.categories limit 1')).rows[0].id
  const a = await connect(), b = await connect(), c = await connect(), anon = await connect(), otherOwnerSession = await connect()
  await Promise.all([role(a, owner), role(b, confirmed), role(c, revoked), role(anon, null), role(otherOwnerSession, owner)])
  const create = async (visibility = 'unlisted', id = randomUUID(), paths = []) => {
    await a.query('select public.create_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [id, 'Fixture', 'Private fixture', '2099-10-12 20:00', '2099-10-12 23:00', category, 10, 'Fixture address', 0, 0, null, paths, visibility]); return id
  }
  const links = async id => (await admin.query('select * from public.event_access_links where event_id=$1 order by created_at,id', [id])).rows
  const visible = async (client, id) => (await client.query('select * from public.events where id=$1', [id])).rowCount > 0
  const rotate = async (client, id) => (await client.query('select public.create_or_rotate_event_link($1) as token', [id])).rows[0].token
  const set = (client, id, v) => client.query('select public.set_event_visibility($1,$2)', [id, v])
  const grants = async id => (await admin.query('select * from public.event_access_grants where event_id=$1 order by user_id', [id])).rows
  const snapshot = async id => ({ event: (await admin.query('select * from public.events where id=$1', [id])).rows, links: await links(id), grants: await grants(id) })
  const id = await create()
  assert.equal(await visible(b, id), false); assert.equal(await visible(a, id), true)
  await create('unlisted', id); assert.equal((await a.query('select count(*) from public.conversations where event_id=$1', [id])).rows[0].count, '1')
  await assert.rejects(create('private'), /invalid_visibility/)
  const bad = randomUUID(); await assert.rejects(create('unlisted', bad, [`${owner}/${bad}/missing.png`]), /invalid_image/); assert.equal(await visible(a, bad), false)
  const legacy = randomUUID(); await a.query('select public.create_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [legacy, 'Legacy', 'Public legacy fixture', '2099-10-12 20:00', '2099-10-12 23:00', category, 10, 'Fixture', 0, 0])
  assert.equal(await visible(b, legacy), true)
  check('Atomic unlisted creation, idempotent UUID/chat, invalid media rollback, legacy public defaults')
  for (const client of [b, c, anon]) {
    await assert.rejects(set(client, id, 'public'), e => e.code === '42501')
    await assert.rejects(rotate(client, id), e => e.code === '42501')
    await assert.rejects(client.query('select public.get_event_link_status($1)', [id]), e => e.code === '42501')
  }
  await assert.rejects(a.query('update public.events set visibility=\'public\' where id=$1', [id]), e => e.code === '42501')
  await assert.rejects(a.query('select token_hash from public.event_access_links'), e => e.code === '42501')
  assert.equal((await a.query('select public.get_event_link_status($1) as active', [id])).rows[0].active, false)
  check('Only owner RPCs, no direct UPDATE or hash SELECT, anon and stranger denied')
  const first = await rotate(a, id); assert.match(first, /^[0-9a-f]{64}$/); assert.equal((await links(id))[0].token_hash, sha(first)); assert.notEqual(first, sha(first))
  const second = await rotate(a, id); assert.notEqual(first, second)
  assert.equal((await links(id)).filter(l => !l.revoked_at).length, 1)
  assert.equal((await links(id)).find(l => l.token_hash === sha(first)).revoked_at !== null, true)
  const beforeFailure = await links(id)
  await admin.query(`create function public.fixture_fail_link() returns trigger language plpgsql as $$ begin raise exception 'fixture_failure'; end $$;
    create trigger fixture_fail_link before insert on public.event_access_links for each row execute function public.fixture_fail_link();`)
  await assert.rejects(rotate(a, id), /fixture_failure/); assert.deepEqual(await links(id), beforeFailure)
  await admin.query('drop trigger fixture_fail_link on public.event_access_links; drop function public.fixture_fail_link()')
  check('256-bit CSPRNG and SHA-256 only, old hash revoked, rotation rollback preserves prior link')
  await a.query('begin'); const third = await rotate(a, id)
  let complete = false
  const queued = rotate(otherOwnerSession, id).then(token => { complete = true; return token })
  let blocked = false
  for (let i = 0; i < 50; i++) {
    blocked = (await admin.query('select cardinality(pg_blocking_pids($1)) > 0 as blocked', [otherOwnerSession.processID])).rows[0].blocked
    if (blocked) break
    await new Promise(r => setTimeout(r, 20))
  }
  assert.equal(blocked, true); assert.equal(complete, false); await a.query('commit'); const fourth = await queued
  assert.notEqual(third, fourth); assert.equal((await links(id)).filter(l => !l.revoked_at).length, 1)
  assert.equal((await links(id)).find(l => !l.revoked_at).token_hash, sha(fourth))
  check('Two real concurrent rotations serialize on event lock, exactly one active hash')
  const transition = await create('public')
  await b.query('select public.register_for_event($1)', [transition])
  await set(a, transition, 'unlisted'); assert.equal((await grants(transition))[0].status, 'active'); assert.equal(await visible(b, transition), true); assert.equal(await visible(c, transition), false)
  await rotate(a, transition); const preserved = await grants(transition)
  await set(a, transition, 'public'); assert.deepEqual(await grants(transition), preserved); assert.equal((await links(transition)).every(l => l.revoked_at), true)
  await c.query('select public.register_for_event($1)', [transition])
  await admin.query("insert into public.event_access_grants(event_id,user_id,status,revoked_at) values($1,$2,'revoked',clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')", [transition, revoked])
  const beforeConflict = await snapshot(transition); await assert.rejects(set(a, transition, 'unlisted'), /confirmed_access_revoked/); assert.deepEqual(await snapshot(transition), beforeConflict)
  await assert.rejects(a.query('select public.update_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [transition, 'Must roll back', 'Fixture', '2099-10-13 20:00', '2099-10-13 23:00', category, 10, 'Fixture', 0, 0, null, 'unlisted']), /confirmed_access_revoked/)
  assert.deepEqual(await snapshot(transition), beforeConflict)
  const participation = (await admin.query('select id from public.event_participations where event_id=$1 and user_id=$2', [transition, revoked])).rows[0].id
  await a.query('select public.remove_participant($1,$2)', [transition, participation])
  await set(a, transition, 'unlisted'); assert.equal(await visible(c, transition), false)
  await set(a, transition, 'public'); assert.equal(await visible(c, transition), true); assert.equal((await grants(transition)).find(g => g.user_id === revoked).status, 'revoked')
  await set(a, transition, 'unlisted'); assert.equal(await visible(c, transition), false)
  check('A04/A05/D12: confirmed preserved, conflict rolls back content/grants/visibility, revoked remains revoked and removed')
  const source = (await a.query('select * from public.get_event_duplicate_source($1)', [id])).rows[0]
  assert.ok(source); await assert.rejects(b.query('select * from public.get_event_duplicate_source($1)', [id]), /event_unavailable|not_event_organizer/)
  const duplicate = await create(); assert.equal((await links(duplicate)).length, 0); assert.equal((await grants(duplicate)).length, 0)
  const hiddenSearch = await a.query("select * from public.search_public_events(p_query => 'Fixture')")
  assert.ok(hiddenSearch.rows.every(e => e.id !== id && e.id !== transition && e.id !== duplicate))
  check('Authorized duplicate source, new events inherit no grants/links; owner hidden events excluded from public search')
  for (const state of ['ended', 'cancelled', 'archived']) {
    const closed = await create(); await rotate(a, closed)
    if (state === 'ended') await admin.query("update public.events set starts_at='2020-01-01',ends_at='2020-01-02' where id=$1", [closed])
    else if (state === 'cancelled') await a.query('select public.cancel_event($1)', [closed])
    else await a.query('select public.archive_event($1)', [closed])
    const before = await links(closed); await assert.rejects(rotate(a, closed), /event_link_closed/); assert.deepEqual(await links(closed), before)
  }
  assert.equal((await admin.query("select count(*) from information_schema.columns where table_name='event_access_links' and column_name='expires_at'")).rows[0].count, '0')
  check('No calendar expiry; end/cancel/archive prohibit generation/rotation without mutating active hash (redemption B7 pending)')
  const inventory = (await admin.query(`select p.oid::regprocedure::text as signature,p.prosecdef,p.proconfig,
    has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('create_event','update_event','set_event_visibility','create_or_rotate_event_link','get_event_link_status')`)).rows
  assert.equal(inventory.length, 5); assert.ok(inventory.every(f => !f.anon_execute && f.proconfig.includes('search_path=""')))
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r4-block-6'
  await mkdir(out, { recursive: true }); await writeFile(`${out}/postgres-results.json`, JSON.stringify({ base: '0428d4f', environment: 'Isolated PostgreSQL, SET ROLE, Auth/Storage SQL scaffolding; no real HTTP/JWT', migrations, inventory, results, redemption: 'NOT RUN: block 7' }, null, 2))
} finally {
  await Promise.allSettled(clients.map(c => c.end()))
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
