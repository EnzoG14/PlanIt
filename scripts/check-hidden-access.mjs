import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'

// Real isolated PostgreSQL, with the same explicit SQL Auth/Storage scaffolding
// as earlier checks. SET ROLE is mandatory; this is not HTTP/JWT evidence.
const toolsRoot = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(toolsRoot, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(toolsRoot, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/hidden-${Date.now()}`)
const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port; await new Promise(resolve => probe.close(resolve))
const clients = [], results = [], matrix = []; let started = false
const users = Array.from({ length: 4 }, (_, i) => `20000000-0000-4000-8000-00000000000${i + 1}`)
const [aId, bId, cId, dId] = users
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await c.connect(); clients.push(c); return c }
async function role(c, id) { await c.query('reset role'); await c.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await c.query(`set role ${id ? 'authenticated' : 'anon'}`) }
const summary = (c, id) => c.query('select * from public.get_event_participation_summary($1)', [id])
const denied = promise => assert.rejects(promise, e => e.code === '42501')
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
  for (const file of migrations) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  for (const id of users) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  await role(admin, aId); await admin.query('reset role')
  const cat = (await admin.query('select id from public.categories limit 1')).rows[0].id
  const [a, b, c, d, anon] = await Promise.all(Array.from({ length: 5 }, connect))
  await Promise.all([role(a, aId), role(b, bId), role(c, cId), role(d, dId), role(anon, null)])
  async function event(capacity = 4, visibility = 'public') {
    return (await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
      values($1,$2,'Hidden fixture','Private location fixture',(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '1 day',
      (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '2 days','Fixture address',0,0,$3,$4) returning id`, [aId, cat, capacity, visibility])).rows[0].id
  }
  async function grant(id, uid, status = 'active') {
    await admin.query(`insert into public.event_access_grants(event_id,user_id,status,revoked_at) values($1,$2,$3,
      case when $3='revoked' then clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' end)
      on conflict(event_id,user_id) do update set status=excluded.status,revoked_at=excluded.revoked_at`, [id, uid, status])
  }
  async function part(id, uid, status) {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [uid])
    await admin.query('insert into public.event_participations(event_id,user_id,status) values($1,$2,$3)', [id, uid, status])
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [aId])
  }
  async function photo(id) {
    const path = `${aId}/${id}/${randomUUID()}.png`
    await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,'{\"mimetype\":\"image/png\",\"size\":100}')", [path, aId])
    const file = (await admin.query("insert into public.files(uploaded_by,bucket_name,storage_path,mime_type,size_bytes) values($1,'event_media',$2,'image/png',100) returning id", [aId, path])).rows[0].id
    await admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)', [id, file])
    return { path, file }
  }
  const tables = (await admin.query("select relname,relrowsecurity from pg_class where relname in ('event_access_links','event_access_grants')")).rows
  assert.equal(tables.length, 2); assert.ok(tables.every(t => t.relrowsecurity))
  const functions = (await admin.query(`select p.oid::regprocedure::text as signature,p.prosecdef,p.proconfig,
      has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','planit_private') and p.prosecdef`)).rows
  assert.ok(functions.every(f => f.proconfig?.includes('search_path=""') && !f.anon_execute))
  await denied(b.query('select * from public.event_access_links'))
  await denied(a.query('select token_hash from public.event_access_links'))
  await denied(b.query("insert into public.event_access_grants(event_id,user_id) values($1,$2)", [randomUUID(), bId]))
  await denied(b.query("update public.event_access_grants set status='active'"))
  await role(d, null); await d.query('set role authenticated')
  assert.equal((await d.query('select * from public.events')).rowCount, 0)
  await denied(summary(d, randomUUID())); await role(d, dId)
  const published = randomUUID()
  await a.query(`select public.create_event($1,'Publicación de prueba','Fixture',
    (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '1 day',
    (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '2 days',$2,10,'Fixture',0,0)`, [published, cat])
  assert.equal((await a.query('select id from public.events where id=$1', [published])).rowCount, 1)
  check('Full ordered migration replay; RLS, definer ACL/search_path, no hash SELECT or direct grant mutation')

  // Cartesian denial/allow assertions even for inconsistent historical confirmed
  // + revoked fixtures: authorization must fail closed on existing data too.
  for (const visibility of ['public', 'unlisted']) for (const state of ['open', 'cancelled', 'archived', 'ended'])
    for (const access of ['none', 'active', 'revoked']) for (const participation of ['none', 'confirmed', 'cancelled', 'removed']) {
      const id = await event(4, visibility), media = await photo(id)
      if (access !== 'none') await grant(id, bId, access)
      if (participation !== 'none') await part(id, bId, participation)
      if (state === 'cancelled' || state === 'archived') await admin.query(`update public.events set cancelled_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires',
          archived_at=case when $2='archived' then clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' end where id=$1`, [id, state])
      if (state === 'ended') await admin.query(`update public.events set starts_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '2 days',
        ends_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '1 day' where id=$1`, [id])
      const view = visibility === 'unlisted' ? access === 'active' : ['open', 'ended'].includes(state) || participation !== 'none'
      const chat = view && participation === 'confirmed'
      for (const [sql, value] of [
        ['select * from public.events where id=$1', id],
        ['select * from public.event_images where event_id=$1', id],
        ['select * from public.files where id=$1', media.file],
        ['select * from storage.objects where name=$1', media.path],
        ['select * from public.get_event_organizer($1)', id],
      ]) assert.equal((await b.query(sql, [value])).rowCount > 0, view, `${visibility}/${state}/${access}/${participation}: ${sql}`)
      let listed = false
      for (let offset = 0; offset < 150 && !listed; offset += 30) {
        const page = await b.query("select * from public.get_my_events('participating',$1)", [offset])
        listed = page.rows.some(row => row.id === id)
        if (page.rowCount < 31) break
      }
      assert.equal(listed, view && participation !== 'none', 'Authorized historical list across all pages')
      if (view) { await summary(b, id); await b.query('select public.get_my_rejoin_status($1)', [id]) }
      else {
        await denied(summary(b, id)); await denied(b.query('select public.get_my_rejoin_status($1)', [id]))
        await denied(b.query('select public.request_rejoin($1)', [id]))
        await denied(b.query('select public.leave_event($1)', [id]))
        if (visibility === 'unlisted') await denied(b.query('select public.register_for_event($1)', [id]))
      }
      assert.equal((await b.query('select * from public.conversations where event_id=$1', [id])).rowCount > 0, chat)
      if (chat) { await b.query('select * from public.get_event_chat($1)', [id]); await b.query('select * from public.get_event_chat_messages($1)', [id]) }
      else {
        await denied(b.query('select * from public.get_event_chat($1)', [id]))
        await denied(b.query('select * from public.get_event_chat_messages($1)', [id]))
        await denied(b.query("select public.send_event_chat_message($1,$2,'Forbidden')", [id, randomUUID()]))
      }
      await denied(b.query('select public.get_event_attendees($1)', [id]))
      await denied(b.query('select * from public.get_event_duplicate_source($1)', [id]))
      await summary(a, id); assert.equal((await a.query('select * from public.events where id=$1', [id])).rowCount, 1)
      await denied(summary(anon, id))
      assert.equal((await d.query('select * from public.events where id=$1', [id])).rowCount > 0, visibility === 'public' && ['open', 'ended'].includes(state))
      matrix.push({ visibility, state, access, participation, detail: view, chat, result: 'PASS' })
    }
  check('96 combinations: UUID SELECT, summary/organizer/rejoin, own list, images/files/Storage, chat header/messages/send, owner and stranger/anon')
  for (const client of [a, b]) for (const query of [
    'select * from public.get_home_events()',
    'select * from public.discover_public_events(-1,1,-1,1)',
    'select * from public.search_public_events()',
    'select * from public.get_suggested_events()',
  ]) assert.ok((await client.query(query)).rows.every(row => row.visibility === 'public' && row.cancelled_at === null && row.archived_at === null))
  check('Public-only home/map/search/suggestions even for owner or active grantee')

  const id = await event(), media = await photo(id)
  await b.query('select public.register_for_event($1)', [id]); await c.query('select public.register_for_event($1)', [id])
  await admin.query("update public.events set visibility='unlisted' where id=$1", [id])
  assert.equal((await a.query('select * from public.event_access_grants where event_id=$1', [id])).rowCount, 2)
  assert.equal((await b.query('select * from public.event_access_grants where event_id=$1', [id])).rowCount, 1)
  await b.query("select public.send_event_chat_message($1,$2,'Authorized')", [id, randomUUID()])
  await grant(id, cId, 'revoked') // deliberate inconsistent fixture: no future revoke RPC claimed
  await denied(c.query('select * from public.get_event_chat_messages($1)', [id]))
  assert.equal((await c.query('select * from public.messages where conversation_id=(select id from public.conversations where event_id=$1)', [id])).rowCount, 0)
  await admin.query("insert into public.notifications(recipient_id,event_id,type,title,body) values($1,$2,'fixture','Own historical notice','Delivered historical content')", [cId, id])
  assert.equal((await c.query('select * from public.get_notifications()')).rows[0].target, null)
  const link = (await admin.query('insert into public.event_access_links(event_id,created_by,token_hash) values($1,$2,$3) returning id', [id, aId, 'a'.repeat(64)])).rows[0].id
  await assert.rejects(admin.query('insert into public.event_access_links(event_id,created_by,token_hash) values($1,$2,$3)', [id, aId, 'b'.repeat(64)]), e => e.code === '23505')
  await admin.query("update public.events set visibility='public' where id=$1", [id])
  assert.ok((await admin.query('select revoked_at from public.event_access_links where id=$1', [link])).rows[0].revoked_at)
  await summary(c, id)
  await assert.rejects(admin.query("update public.events set visibility='unlisted' where id=$1", [id]), /confirmed_access_revoked/)
  assert.equal((await admin.query('select visibility from public.events where id=$1', [id])).rows[0].visibility, 'public')
  assert.equal((await admin.query('select status from public.event_access_grants where event_id=$1 and user_id=$2', [id, cId])).rows[0].status, 'revoked')
  const cp = (await admin.query('select id from public.event_participations where event_id=$1 and user_id=$2', [id, cId])).rows[0].id
  await a.query('select public.remove_participant($1,$2)', [id, cp])
  await admin.query("update public.events set visibility='unlisted' where id=$1", [id])
  await denied(summary(c, id)); await denied(c.query('select public.request_rejoin($1)', [id]))
  await grant(id, cId)
  await assert.rejects(c.query('select public.register_for_event($1)', [id]), /rejoin_requires_approval/)
  const request = (await c.query('select public.request_rejoin($1) as id', [id])).rows[0].id
  await grant(id, cId, 'revoked')
  await denied(a.query("select public.resolve_rejoin($1,$2,'approved')", [id, request]))
  assert.equal((await admin.query('select status from public.event_rejoin_requests where id=$1', [request])).rows[0].status, 'pending')
  await grant(id, cId); await a.query("select public.resolve_rejoin($1,$2,'approved')", [id, request])
  assert.equal((await admin.query("select count(*)::int as n from public.participation_history where participation_id=$1 and reason='rejoin_approval'", [cp])).rows[0].n, 1)
  check('A04/A05/D12 round trips: confirmed grants, conflict rollback, revoked preserved, public read, rehide deny; R3 pending approval cannot bypass revoke')

  const publicRevoked = await event()
  await grant(publicRevoked, cId, 'revoked')
  await c.query('select public.register_for_event($1)', [publicRevoked])
  await assert.rejects(admin.query("update public.events set visibility='unlisted' where id=$1", [publicRevoked]), /confirmed_access_revoked/)
  assert.equal((await admin.query('select status from public.event_access_grants where event_id=$1 and user_id=$2', [publicRevoked, cId])).rows[0].status, 'revoked')
  const atomic = await event()
  await b.query('select public.register_for_event($1)', [atomic]); await c.query('select public.register_for_event($1)', [atomic])
  await admin.query(`create function planit_private.fail_fixture_visibility() returns trigger language plpgsql as $$
    begin if new.visibility='unlisted' then raise exception 'fixture_failure_after_grants'; end if; return new; end $$;
    create trigger zz_fixture_failure before update of visibility on public.events for each row execute function planit_private.fail_fixture_visibility();`)
  await assert.rejects(admin.query("update public.events set visibility='unlisted' where id=$1", [atomic]), /fixture_failure_after_grants/)
  assert.equal((await admin.query('select visibility from public.events where id=$1', [atomic])).rows[0].visibility, 'public')
  assert.equal((await admin.query('select * from public.event_access_grants where event_id=$1', [atomic])).rowCount, 0)
  await admin.query('drop trigger zz_fixture_failure on public.events; drop function planit_private.fail_fixture_visibility()')
  check('Public registration ignores revoked without restoring it; forced failure after grant inserts rolls visibility/grants back together')

  const other = await event(), extra = await event()
  await denied(d.query('select * from public.get_event_rejoin_requests($1)', [id]))
  await denied(d.query('select public.get_event_rejoin_resolution($1,$2)', [id, request]))
  await assert.rejects(admin.query('insert into public.event_access_grants(event_id,user_id,source_link_id) values($1,$2,$3)', [other, bId, link]), e => e.code === '23503')
  await assert.rejects(admin.query('insert into public.event_access_links(event_id,created_by,token_hash) values($1,$2,$3)', [other, aId, 'cleartext']), e => e.code === '23514')
  await admin.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)', [extra, media.file])
  await grant(id, cId, 'revoked')
  assert.equal((await c.query('select * from public.event_images where event_id=$1', [id])).rowCount, 0)
  assert.equal((await c.query('select * from public.files where id=$1', [media.file])).rowCount, 1)
  assert.equal((await c.query('select * from storage.objects where name=$1', [media.path])).rowCount, 1)
  check('Cross-event source FK, hash shape, cross-account owner RPCs; legitimate shared public file stays readable without hidden association')

  // Deterministic blocked-lock tests: wait for the contender in pg_stat_activity,
  // then commit/rollback holder. No sleep-based assumption that it is blocked.
  const actor = await connect(); await role(actor, bId)
  async function blocked(holder, contender, action, release = 'commit') {
    const pid = (await contender.query('select pg_backend_pid() as pid')).rows[0].pid
    await holder.query('begin'); await action.before(holder)
    let settled = false
    const pending = action.after(contender).then(value => ({ value }), error => ({ error })).finally(() => { settled = true })
    assert.ok(pid)
    let waiting = false
    for (let attempt = 0; attempt < 200; attempt++) {
      waiting = (await admin.query("select wait_event_type='Lock' as waiting from pg_stat_activity where pid=$1", [pid])).rows[0]?.waiting
      if (waiting || settled) break
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    assert.equal(waiting, true); assert.equal(settled, false)
    await holder.query(release); return pending
  }
  await actor.query("set application_name='hidden-contender'")
  const seat = await event(1, 'unlisted'); await grant(seat, bId); await grant(seat, cId)
  let result = await blocked(c, actor, { before: h => h.query('select public.register_for_event($1)', [seat]), after: t => t.query('select public.register_for_event($1)', [seat]) })
  assert.match(result.error?.message ?? '', /event_full/)
  const revokedRace = await event(1, 'unlisted'); await grant(revokedRace, bId)
  result = await blocked(admin, actor, { before: async h => {
    await h.query('select id from public.events where id=$1 for update', [revokedRace]);
    await h.query("update public.event_access_grants set status='revoked',revoked_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' where event_id=$1", [revokedRace])
  }, after: t => t.query('select public.register_for_event($1)', [revokedRace]) })
  assert.equal(result.error?.code, '42501')
  const rollback = await event(1, 'unlisted'); await grant(rollback, bId)
  result = await blocked(admin, actor, { before: async h => {
    await h.query('select id from public.events where id=$1 for update', [rollback]);
    await h.query("update public.event_access_grants set status='revoked',revoked_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' where event_id=$1", [rollback])
  }, after: t => t.query('select public.register_for_event($1)', [rollback]) }, 'rollback')
  assert.ok(!result.error)
  const hideRace = await event(1)
  result = await blocked(admin, actor, { before: h => h.query("update public.events set visibility='unlisted' where id=$1", [hideRace]), after: t => t.query('select public.register_for_event($1)', [hideRace]) })
  assert.equal(result.error?.code, '42501')
  const registerFirst = await event(1)
  const visibilityWriter = await connect(); await role(visibilityWriter, aId); await visibilityWriter.query('reset role')
  result = await blocked(b, visibilityWriter, {
    before: h => h.query('select public.register_for_event($1)', [registerFirst]),
    after: t => t.query("update public.events set visibility='unlisted' where id=$1", [registerFirst]),
  })
  assert.ok(!result.error)
  assert.equal((await b.query('select * from public.event_access_grants where event_id=$1', [registerFirst])).rows[0].status, 'active')
  check('Real last-seat serialization, revoke/rollback vs register, visibility vs register both orders; event-first locks')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r4-block-5'
  await mkdir(out, { recursive: true })
  const inventory = (await admin.query(`select n.nspname as schema,p.oid::regprocedure::text as signature,p.prosecdef,p.proconfig,
      has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
      has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','planit_private') order by 1,2`)).rows
  const policies = (await admin.query("select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','storage') order by 1,2,3")).rows
  await writeFile(`${out}/postgres-results.json`, JSON.stringify({ version, base: 'dacd893', environment: 'Isolated PostgreSQL; SQL Auth/Storage scaffolding; SET ROLE; no HTTP/JWT', migrations, functions, inventory, policies, matrix, results }, null, 2))
} finally {
  await Promise.allSettled(clients.map(c => c.end()))
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
