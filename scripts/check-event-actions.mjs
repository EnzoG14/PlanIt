import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/actions-${Date.now()}`)
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r))
const clients = [], results = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002', stranger = '20000000-0000-4000-8000-000000000003'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect(identity) {
  const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' }); await c.connect(); clients.push(c)
  if (identity) { await c.query("select set_config('request.jwt.claim.sub',$1,false)", [identity]); await c.query('set role authenticated') }
  return c
}
try {
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  const admin = await connect(), version = (await admin.query('select version()')).rows[0].version
  await admin.query(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage; create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,storage to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$;`)
  for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await admin.query(sql) }
  for (const id of [owner, guest, stranger]) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: 'Prueba' }])
  const a = await connect(owner), a2 = await connect(owner), b = await connect(guest), c = await connect(stranger), anon = await connect(), missing = await connect()
  await anon.query('set role anon'); await missing.query('set role authenticated')
  const create = async (author = owner) => {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [author])
    return (await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      select id,'After primaveral','Fixture SQL','2099-10-12 20:00','2099-10-12 23:00','Buenos Aires',-34.6,-58.4,80 from public.categories limit 1 returning id`)).rows[0].id
  }
  const action = (client, id, name = 'cancel') => client.query(`select public.${name}_event($1) as id`, [id])
  const source = async (client, id) => (await client.query('select * from public.get_event_duplicate_source($1)', [id])).rows[0]
  const snapshot = async id => (await admin.query(`select to_jsonb(e) as event,
      (select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') from public.event_participations p where p.event_id=e.id) as participations,
      (select coalesce(jsonb_agg(to_jsonb(h) order by h.id),'[]') from public.participation_history h join public.event_participations p on p.id=h.participation_id where p.event_id=e.id) as history,
      (select coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]') from public.event_images i where i.event_id=e.id) as images,
      (select coalesce(jsonb_agg(to_jsonb(f) order by f.id),'[]') from public.files f join public.event_images i on i.file_id=f.id where i.event_id=e.id) as files,
      (select coalesce(jsonb_agg(to_jsonb(m) order by m.id),'[]') from public.messages m join public.conversations c on c.id=m.conversation_id where c.event_id=e.id) as messages,
      (select to_jsonb(c) from public.conversations c where c.event_id=e.id) as conversation from public.events e where e.id=$1`, [id])).rows[0]
  const row = async id => (await admin.query('select cancelled_at::text,archived_at::text from public.events where id=$1', [id])).rows[0]
  for (const name of ['cancel_event', 'archive_event', 'get_event_duplicate_source']) {
    const security = (await admin.query("select prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') as anon,has_function_privilege('authenticated',oid,'EXECUTE') as authenticated from pg_proc where oid=$1::regprocedure", [`public.${name}(uuid)`])).rows[0]
    assert.equal(security.prosecdef, name !== 'get_event_duplicate_source'); assert.ok(security.proconfig.includes('search_path=""')); assert.equal(security.anon, false); assert.equal(security.authenticated, true)
  }
  for (const table of ['events', 'event_participations', 'participation_history', 'files', 'event_images', 'messages', 'conversations']) {
    assert.equal((await admin.query('select relrowsecurity from pg_class where oid=$1::regclass', [`public.${table}`])).rows[0].relrowsecurity, true)
    for (const privilege of ['UPDATE', 'DELETE']) assert.equal((await admin.query("select has_table_privilege('authenticated',$1,$2) as allowed", [`public.${table}`, privilege])).rows[0].allowed, false)
  }
  check('Full migration replay; RLS and direct grants preserved; controlled writes and invoker source; authenticated-only EXECUTE and empty search_path')
  const id = await create(), foreign = await create(stranger)
  for (const client of [b, c]) { for (const name of ['cancel', 'archive']) await assert.rejects(action(client, id, name), /event_unavailable/); await assert.rejects(source(client, id), /event_unavailable/) }
  for (const name of ['cancel', 'archive']) {
    await assert.rejects(action(a, foreign, name), /event_unavailable/); await assert.rejects(action(a, randomUUID(), name), /event_unavailable/)
    await assert.rejects(action(anon, id, name), /permission denied/); await assert.rejects(action(missing, id, name), /authentication_required/)
    await a.query('begin isolation level repeatable read'); await assert.rejects(action(a, id, name), /retry_read_committed/); await a.query('rollback')
  }
  await assert.rejects(source(anon, id), /permission denied/); await assert.rejects(source(missing, id), /authentication_required/)
  await assert.rejects(a.query('delete from public.events where id=$1', [id]), /permission denied/)
  await assert.rejects(a.query('update public.events set cancelled_at=now() where id=$1', [id]), /permission denied/)
  check('Owner-only RPC including public foreign source, nonexistent source, anon, missing identity, frozen snapshots; REST-equivalent UPDATE/DELETE denied')
  await b.query('select public.register_for_event($1)', [id]); await b.query('select public.send_event_chat_message($1,$2,$3)', [id, randomUUID(), 'Mensaje previo'])
  const path = `${owner}/${id}/fixture.png`
  await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)", [path, owner, { mimetype: 'image/png', size: 100 }])
  await a.query('select public.add_event_image($1,$2)', [id, path])
  const before = await snapshot(id)
  await action(a, id); const once = await row(id); await action(a, id); assert.deepEqual(await row(id), once)
  const after = await snapshot(id); for (const key of ['participations', 'history', 'images', 'files', 'messages', 'conversation']) assert.deepEqual(after[key], before[key])
  for (const key of Object.keys(before.event).filter(k => !['cancelled_at', 'updated_at'].includes(k))) assert.deepEqual(after.event[key], before.event[key])
  await assert.rejects(c.query('select public.register_for_event($1)', [id]), /event_cancelled/)
  await assert.rejects(b.query('select public.send_event_chat_message($1,$2,$3)', [id, randomUUID(), 'Denied']), /chat_read_only/)
  assert.equal((await b.query('select * from public.get_event_chat_messages($1)', [id])).rowCount, 1)
  assert.equal((await a.query('select * from public.get_event_chat_messages($1)', [id])).rowCount, 1)
  assert.equal((await c.query('select * from public.events where id=$1', [id])).rowCount, 0)
  assert.equal((await b.query('select * from public.events where id=$1', [id])).rowCount, 1)
  check('Cancellation idempotent; all data retained unchanged; closed registration/chat writes rejected; historical owner/member reads and stranger isolation')
  await action(a, id, 'archive'); const archived = await row(id); assert.equal(archived.cancelled_at, once.cancelled_at); await action(a, id, 'archive'); assert.deepEqual(await row(id), archived)
  await assert.rejects(action(a, id), /event_archived/)
  assert.ok(!(await a.query("select * from public.get_my_organized_events('all')")).rows.some(x => x.id === id))
  assert.ok((await a.query("select * from public.get_my_organized_events('archived')")).rows.some(x => x.id === id))
  assert.ok(!(await a.query('select * from public.get_home_events()')).rows.some(x => x.id === id))
  for (const key of ['participations', 'history', 'images', 'files', 'messages', 'conversation']) assert.deepEqual((await snapshot(id))[key], before[key])
  const live = await create(); await action(a, live, 'archive'); assert.ok((await row(live)).cancelled_at); assert.ok((await row(live)).archived_at)
  const ended = await create(); await admin.query("update public.events set starts_at='2000-01-01',ends_at='2001-01-01' where id=$1", [ended]); await assert.rejects(action(a, ended), /event_ended/); await action(a, ended, 'archive'); assert.equal((await row(ended)).cancelled_at, null)
  const ongoing = await create(); await admin.query("update public.events set starts_at='2020-01-01' where id=$1", [ongoing]); await action(a, ongoing)
  check('Archive cancels only unfinished events atomically; cancelled mark preserved; ended only archive/duplicate; ongoing cancellation; active lists exclude archive and own historical filter retains it')
  const rollbackId = await create(), rollbackBefore = await snapshot(rollbackId)
  await admin.query(`create function public.fail_test_archive() returns trigger language plpgsql as $$begin if new.archived_at is not null then raise exception 'fixture_archive_failure'; end if; return new; end$$;
    create trigger fail_test_archive before update on public.events for each row execute function public.fail_test_archive();`)
  await assert.rejects(action(a, rollbackId, 'archive'), /fixture_archive_failure/); assert.deepEqual(await snapshot(rollbackId), rollbackBefore)
  await admin.query('drop trigger fail_test_archive on public.events; drop function public.fail_test_archive()')
  check('Injected second-write archive failure rolls back cancellation, archive and updated_at; no partial state')
  const original = await snapshot(id), counts = (await admin.query('select count(*) from public.events')).rows[0]
  const input = await source(a, id); assert.deepEqual(Object.keys(input).sort(), ['title', 'description', 'category_id', 'location_name', 'address', 'latitude', 'longitude', 'capacity'].sort())
  assert.deepEqual((await admin.query('select count(*) from public.events')).rows[0], counts)
  const newId = randomUUID()
  const publish = (start = '2099-11-01 20:00') => a.query('select public.create_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [newId, input.title, input.description, start, '2099-11-01 23:00', input.category_id, input.capacity, input.address, input.latitude, input.longitude, input.location_name, []])
  await assert.rejects(publish('2000-01-01'), /start_not_future/); assert.equal((await admin.query('select * from public.events where id=$1', [newId])).rowCount, 0)
  await publish(); await publish(); const duplicate = await snapshot(newId)
  assert.notEqual(newId, id); assert.equal(duplicate.event.organizer_id, owner); assert.equal(duplicate.event.cancelled_at, null); assert.equal(duplicate.event.archived_at, null)
  for (const key of ['participations', 'history', 'images', 'files', 'messages']) assert.deepEqual(duplicate[key], [])
  assert.notEqual(duplicate.conversation.id, original.conversation.id); assert.deepEqual(await snapshot(id), original)
  await source(a, ended); await source(a, ongoing)
  check('Owner-only minimal duplicate source reads create nothing; dates enforced by create_event; fresh ID/owner/empty conversation, no photos/relations; idempotent publish and original unchanged in all historical states')
  async function waitLock(client) {
    const deadline = Date.now() + 5000
    while (Date.now() < deadline) { if ((await admin.query('select wait_event_type from pg_stat_activity where pid=$1', [client.processID])).rows[0]?.wait_event_type === 'Lock') return; await new Promise(r => setTimeout(r, 10)) }
    throw Error('Competing operation did not reach lock')
  }
  async function race(firstClient, firstAction, secondClient, secondAction, reject = null) {
    await firstClient.query('begin'); await firstAction()
    const observed = secondAction().then(value => ({ value }), error => ({ error }))
    await waitLock(secondClient); await firstClient.query('commit'); const result = await observed
    if (reject) { assert.ok(result.error); assert.match(result.error.message, reject) } else if (result.error) throw result.error
  }
  for (const name of ['cancel', 'archive']) {
    let raceId = await create()
    await race(a, () => action(a, raceId, name), b, () => b.query('select public.register_for_event($1)', [raceId]), /event_cancelled/)
    raceId = await create()
    await race(b, () => b.query('select public.register_for_event($1)', [raceId]), a, () => action(a, raceId, name)); assert.equal((await snapshot(raceId)).participations.length, 1)
    raceId = await create(); await b.query('select public.register_for_event($1)', [raceId])
    await race(a, () => action(a, raceId, name), b, () => b.query('select public.send_event_chat_message($1,$2,$3)', [raceId, randomUUID(), 'After close']), /chat_read_only/)
    raceId = await create(); await b.query('select public.register_for_event($1)', [raceId])
    await race(b, () => b.query('select public.send_event_chat_message($1,$2,$3)', [raceId, randomUUID(), 'Before close']), a, () => action(a, raceId, name)); assert.equal((await snapshot(raceId)).messages.length, 1)
    raceId = await create(); await race(a, () => action(a, raceId, name), a2, () => action(a2, raceId, name))
  }
  let raceId = await create(); await race(a, () => action(a, raceId), a2, () => action(a2, raceId, 'archive')); assert.ok((await row(raceId)).archived_at)
  raceId = await create(); await race(a, () => action(a, raceId, 'archive'), a2, () => action(a2, raceId), /event_archived/)
  check('Twelve real lock races: cancel/archive versus registration, chat and same close in both orders; cancel versus archive in both orders')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-5'
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/postgres-results.json`, JSON.stringify({ version, environment: 'Real isolated PostgreSQL; Auth/Storage SQL scaffolding; no remote HTTP/JWT', results }, null, 2))
} finally {
  await Promise.allSettled(clients.map(c => c.end()))
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
