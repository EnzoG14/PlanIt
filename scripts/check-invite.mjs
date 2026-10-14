import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'

// R4 block 7: real isolated PostgreSQL with the same explicit SQL Auth/Storage
// scaffolding as the hidden-access check. SET ROLE is mandatory; this is local SQL
// evidence only, NOT HTTP/JWT evidence against the remote project.
const toolsRoot = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(toolsRoot, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(toolsRoot, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/invite-${Date.now()}`)
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

  // --- Catalog / ACL ---
  const fn = (await admin.query(`select p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
      has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,has_function_privilege('public',p.oid,'EXECUTE') as public_execute
    from pg_proc p where p.oid='public.redeem_event_link(text)'::regprocedure`)).rows[0]
  assert.equal(fn.prosecdef, true); assert.ok(fn.proconfig.includes('search_path=""'))
  assert.equal(fn.anon_execute, false); assert.equal(fn.public_execute, false); assert.equal(fn.authenticated_execute, true)
  await denied(redeem(anon, 'a'.repeat(64)))
  check('Migration replay; redeem_event_link is DEFINER with empty search_path, EXECUTE authenticated only; anon denied')

  // --- CA-01 / CA-02 / CA-03 / CA-04 ---
  const id = await event(2), token = await link(id)
  assert.match(token, /^[0-9a-f]{64}$/)
  assert.equal((await admin.query('select count(*)::int as n from public.event_access_links where token_hash=$1', [token])).rows[0].n, 0, 'plain token is never stored')
  assert.equal((await d.query('select * from public.events where id=$1', [id])).rowCount, 0)
  await denied(summary(d, id)); assert.equal((await d.query('select * from public.get_event_organizer($1)', [id])).rowCount, 0)
  assert.equal((await b.query('select * from public.events where id=$1', [id])).rowCount, 0)
  const before = (await a.query('select * from public.get_event_participation_summary($1)', [id])).rows[0]
  assert.equal((await redeem(b, token)).rows[0].id, id)
  const granted = await grants(id, bId)
  assert.equal(granted.length, 1); assert.equal(granted[0].status, 'active'); assert.ok(granted[0].source_link_id)
  assert.equal(await parts(id), 0, 'redeem must not enrol')
  const after = (await summary(b, id)).rows[0]
  assert.equal(after.own_status, null); assert.equal(Number(after.confirmed_count), 0); assert.equal(Number(after.available_spots), Number(before.available_spots))
  assert.equal((await b.query('select * from public.events where id=$1', [id])).rowCount, 1)
  assert.equal((await b.query('select * from public.get_event_organizer($1)', [id])).rowCount, 1)
  check('CA-01: B redeems and gets an active grant, no participation, no capacity used; detail and organizer readable')
  assert.equal((await redeem(b, token)).rows[0].id, id)
  assert.equal((await grants(id, bId)).length, 1)
  assert.equal(await parts(id), 0)
  const relogin = await connect(); await role(relogin, bId)
  assert.equal((await summary(relogin, id)).rowCount, 1)
  assert.equal((await relogin.query('select * from public.events where id=$1', [id])).rowCount, 1)
  check('CA-02: repeated redeem is idempotent (one grant); a fresh session keeps access without the link')
  await denied(b.query('select * from public.get_event_chat($1)', [id]))
  await denied(b.query('select * from public.get_event_chat_messages($1)', [id]))
  await denied(b.query("select public.send_event_chat_message($1,$2,'x')", [id, '40000000-0000-4000-8000-000000000001']))
  await denied(b.query('select public.get_event_attendees($1)', [id]))
  assert.equal((await b.query('select * from public.conversations where event_id=$1', [id])).rowCount, 0)
  await b.query('select public.register_for_event($1)', [id])
  assert.equal(await parts(id), 1, 'registering stays an independent R1 action')
  assert.equal((await b.query('select * from public.get_event_chat($1)', [id])).rowCount > 0, true, 'confirmed participant chat unchanged')
  check('CA-04: grant alone cannot read chat/attendees; Inscribirse is a separate action that needs the grant')
  await denied(d.query('select public.register_for_event($1)', [id]))
  assert.equal((await d.query('select * from public.events where id=$1', [id])).rowCount, 0)
  await denied(summary(d, id)); await denied(summary(anon, id))
  check('CA-03: stranger and anon denied by direct UUID (SELECT, RPC) without redeem')

  // --- Non-enumeration: every failure is byte-identical ---
  const messages = []
  const altered = token.slice(0, 63) + (token.endsWith('0') ? '1' : '0')
  messages.push(await unavailable(redeem(d, altered), 'altered'))
  messages.push(await unavailable(redeem(d, 'not-a-token'), 'malformed'))
  messages.push(await unavailable(redeem(d, null), 'null'))
  messages.push(await unavailable(redeem(d, ''), 'empty'))
  messages.push(await unavailable(redeem(d, token.toUpperCase()), 'uppercase'))
  // --- Rotation: old token dies, previous grant survives ---
  const token2 = await link(id)
  messages.push(await unavailable(redeem(d, token), 'rotated'))
  assert.equal((await grants(id, dId)).length, 0)
  assert.equal((await summary(b, id)).rowCount, 1, 'prior active grant survives rotation')
  // --- Revoked wins absolutely, with old or new token ---
  await admin.query("insert into public.event_access_grants(event_id,user_id,status,revoked_at) values($1,$2,'revoked',clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')", [id, cId])
  messages.push(await unavailable(redeem(c, token2), 'revoked/new token'))
  messages.push(await unavailable(redeem(c, token), 'revoked/old token'))
  assert.equal((await grants(id, cId))[0].status, 'revoked')
  await denied(summary(c, id)); assert.equal((await c.query('select * from public.events where id=$1', [id])).rowCount, 0)
  assert.ok(messages.every(m => m.message === messages[0].message && m.code === messages[0].code && m.detail === messages[0].detail && m.hint === messages[0].hint))
  check('CA-05/R4-09.CA-04: altered/malformed/rotated/revoked all fail with one identical error; revoked is never reactivated, even by a new link')
  // C public round trip (A05) without touching grant or participation
  await admin.query("update public.events set visibility='public' where id=$1", [id])
  assert.equal((await summary(c, id)).rowCount, 1)
  assert.equal((await grants(id, cId))[0].status, 'revoked')
  await unavailable(redeem(d, token2), 'public event, link invalidated by D12')
  await admin.query("update public.events set visibility='unlisted' where id=$1", [id])
  await denied(summary(c, id))
  const token3 = await link(id)
  await unavailable(redeem(c, token3), 'revoked after rehide with brand new link')
  await denied(summary(c, id))
  assert.equal((await redeem(d, token3)).rows[0].id, id)
  assert.equal((await grants(id, dId))[0].status, 'active')
  check('Revoked C: sees the public event, loses it again on rehide, and no new link recovers it; D redeems the fresh link')

  // --- Organizer ---
  const own = await event(); const ownToken = await link(own)
  assert.equal((await redeem(a, ownToken)).rows[0].id, own)
  assert.equal((await grants(own, aId)).length, 0)
  check('Organizer redeeming own link creates no grant')

  // --- Closed events grant nothing ---
  for (const state of ['ended', 'cancelled', 'archived']) {
    const closed = await event(); const closedToken = await link(closed)
    if (state === 'ended') await admin.query(`update public.events set starts_at=${now}-interval '2 days',ends_at=${now}-interval '1 day' where id=$1`, [closed])
    else await admin.query(`update public.events set cancelled_at=${now},archived_at=case when $2='archived' then ${now} end where id=$1`, [closed, state])
    await unavailable(redeem(d, closedToken), state)
    assert.equal((await grants(closed, dId)).length, 0)
  }
  const publicEvent = await event(4, 'public')
  await unavailable(redeem(d, token), 'token of an event that is now public')
  assert.equal((await grants(publicEvent, dId)).length, 0)
  check('Ended/cancelled/archived events and non-hidden events grant no new access')

  // --- Deterministic lock races (wait for the Lock wait in pg_stat_activity) ---
  const actor = await connect(); await role(actor, bId)
  async function blocked(holder, contender, action, release = 'commit') {
    const pid = (await contender.query('select pg_backend_pid() as pid')).rows[0].pid
    await holder.query('begin'); await action.before(holder)
    let settled = false
    const pending = action.after(contender).then(value => ({ value }), error => ({ error })).finally(() => { settled = true })
    let waiting = false
    for (let attempt = 0; attempt < 300; attempt++) {
      waiting = (await admin.query("select wait_event_type='Lock' as waiting from pg_stat_activity where pid=$1", [pid])).rows[0]?.waiting
      if (waiting || settled) break
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    assert.equal(waiting, true); assert.equal(settled, false)
    await holder.query(release); return pending
  }
  // 1) rotation commits first -> queued redeem with the old token fails
  const race1 = await event(); const race1Token = await link(race1)
  const rotator = await connect(); await role(rotator, aId)
  let result = await blocked(rotator, actor, { before: h => h.query('select public.create_or_rotate_event_link($1)', [race1]), after: t => redeem(t, race1Token) })
  assert.equal(result.error?.message, 'invite_unavailable')
  assert.equal((await grants(race1, bId)).length, 0)
  // 2) redeem commits first -> queued rotation succeeds, grant stays, old token dead
  const race2 = await event(); const race2Token = await link(race2)
  const redeemer = await connect(); await role(redeemer, bId)
  result = await blocked(redeemer, a, { before: h => redeem(h, race2Token), after: t => t.query('select public.create_or_rotate_event_link($1) as token', [race2]) })
  assert.ok(!result.error)
  assert.equal((await grants(race2, bId))[0].status, 'active')
  await unavailable(redeem(d, race2Token), 'old token after redeem-first rotation')
  // 3) same user redeems twice concurrently -> one grant, both succeed
  const race3 = await event(); const race3Token = await link(race3)
  result = await blocked(redeemer, actor, { before: h => redeem(h, race3Token), after: t => redeem(t, race3Token) })
  assert.ok(!result.error)
  assert.equal((await grants(race3, bId)).length, 1)
  // 4) revocation commits first -> queued redeem cannot create/resurrect
  const race4 = await event(); const race4Token = await link(race4)
  await redeem(actor, race4Token)
  result = await blocked(admin, actor, {
    before: async h => {
      await h.query('select id from public.events where id=$1 for update', [race4])
      await h.query("update public.event_access_grants set status='revoked',revoked_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' where event_id=$1", [race4])
    },
    after: t => redeem(t, race4Token),
  })
  assert.equal(result.error?.message, 'invite_unavailable')
  assert.equal((await grants(race4, bId))[0].status, 'revoked')
  // 5) visibility change to public commits first -> queued redeem fails
  const race5 = await event(); const race5Token = await link(race5)
  const visibility = await connect(); await role(visibility, aId); await visibility.query('reset role')
  result = await blocked(visibility, actor, { before: h => h.query("update public.events set visibility='public' where id=$1", [race5]), after: t => redeem(t, race5Token) })
  assert.equal(result.error?.message, 'invite_unavailable')
  check('Races: rotate-first denies old token; redeem-first keeps grant and kills the old token; concurrent same-user redeem is one grant; revoke-first and publish-first deny redeem')

  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-7'
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/postgres-results.json`, JSON.stringify({ version, environment: 'Isolated PostgreSQL; SQL Auth/Storage scaffolding; SET ROLE; no HTTP/JWT', migrations, results }, null, 2))
} finally {
  await Promise.allSettled(clients.map(c => c.end()))
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
