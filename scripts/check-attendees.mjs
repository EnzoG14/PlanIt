import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/attendees-${Date.now()}`)
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
  await admin.query("update public.profiles set display_name='Camila Rodríguez',birth_date='2000-01-01',sex='female' where id=$1", [guest])
  const a = await connect(owner), a2 = await connect(owner), b = await connect(guest), c = await connect(stranger), anon = await connect()
  await anon.query('set role anon')
  const create = async (author = owner, capacity = 80) => {
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [author])
    return (await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
      select id,'Asistentes','Fixture SQL','2099-10-12 20:00','2099-10-12 23:00','Buenos Aires',-34.6,-58.4,$1 from public.categories limit 1 returning id`, [capacity])).rows[0].id
  }
  const list = async (client, id, status = 'confirmed', search = '', offset = 0) => (await client.query('select public.get_event_attendees($1,$2,$3,$4) as data', [id, status, search, offset])).rows[0].data
  const remove = (client, id, participation) => client.query('select public.remove_participant($1,$2)', [id, participation])
  const registration = async (client, id, user = guest) => { await client.query('select public.register_for_event($1)', [id]); return (await admin.query('select id from public.event_participations where event_id=$1 and user_id=$2', [id, user])).rows[0].id }
  const snapshot = async p => (await admin.query('select status,(select count(*) from public.participation_history where participation_id=p.id) as movements from public.event_participations p where id=$1', [p])).rows[0]
  const signatures = ['public.get_event_attendees(uuid,text,text,integer)', 'public.remove_participant(uuid,uuid)']
  for (const signature of signatures) {
    const security = (await admin.query("select prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') as anon,has_function_privilege('authenticated',oid,'EXECUTE') as authenticated from pg_proc where oid=$1::regprocedure", [signature])).rows[0]
    assert.equal(security.prosecdef, true); assert.ok(security.proconfig.includes('search_path=""')); assert.equal(security.anon, false); assert.equal(security.authenticated, true)
  }
  for (const table of ['event_participations', 'participation_history', 'profiles', 'messages', 'conversations']) {
    assert.equal((await admin.query('select relrowsecurity from pg_class where oid=$1::regclass', [`public.${table}`])).rows[0].relrowsecurity, true)
  }
  for (const table of ['event_participations', 'participation_history']) for (const privilege of ['INSERT', 'UPDATE', 'DELETE']) assert.equal((await admin.query("select has_table_privilege('authenticated',$1,$2) as allowed", [`public.${table}`, privilege])).rows[0].allowed, false)
  check('Full migration replay; RLS, unchanged direct mutation grants, authenticated-only RPC and empty search_path')
  const id = await create(), foreign = await create(stranger), empty = await create()
  const p = await registration(b, id), foreignP = await registration(b, foreign)
  assert.deepEqual((await list(a, empty)).attendees, [])
  const first = await list(a, id)
  assert.equal(first.confirmed_count, 1); assert.equal(first.attendees[0].display_name, 'Camila Rodríguez')
  assert.deepEqual(Object.keys(first.attendees[0]).sort(), ['display_name', 'participation_id', 'status', 'user_id', 'username'])
  for (const client of [b, c]) { await assert.rejects(list(client, id), /event_unavailable/); await assert.rejects(remove(client, id, p), /event_unavailable/) }
  await assert.rejects(list(a, foreign), /event_unavailable/); await assert.rejects(remove(a, id, foreignP), /attendee_unavailable/)
  await assert.rejects(list(anon, id), /permission denied/); await assert.rejects(remove(anon, id, p), /permission denied/)
  const missing = await connect(); await missing.query('set role authenticated'); await assert.rejects(list(missing, id), /authentication_required/); await assert.rejects(remove(missing, id, p), /authentication_required/)
  assert.equal((await a.query('select id from public.profiles where id=$1', [guest])).rowCount, 0)
  assert.equal((await a.query('select id from public.event_participations where event_id=$1', [id])).rowCount, 0)
  await assert.rejects(b.query("update public.event_participations set status='removed' where id=$1", [p]), /permission denied/)
  check('Owner-only empty/populated projection; other event, participant, stranger, anon and missing identity denied; private profiles inaccessible')
  assert.equal((await list(a, id, 'confirmed', 'rOdR')).attendees.length, 1)
  for (const search of ['%', '_', 'absent']) assert.equal((await list(a, id, 'confirmed', search)).attendees.length, 0)
  for (const args of [['cancelled','',0], [null,'',0], ['confirmed',null,0], ['confirmed','x'.repeat(121),0], ['confirmed','',-1], ['confirmed','',null]]) await assert.rejects(list(a, id, ...args), /invalid_attendees_query/)
  for (let i = 0; i < 34; i++) {
    const user = `21000000-0000-4000-8000-${String(i).padStart(12, '0')}`
    await admin.query('insert into auth.users values($1,$2)', [user, { display_name: `Asistente ${String(i).padStart(2, '0')}` }])
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)", [user])
    await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed')", [id, user])
  }
  const page1 = await list(a, id), page2 = await list(a, id, 'confirmed', '', 30)
  assert.equal(page1.attendees.length, 30); assert.equal(page1.has_more, true); assert.equal(page2.attendees.length, 5); assert.equal(page2.has_more, false)
  assert.equal(new Set([...page1.attendees, ...page2.attendees].map(x => x.participation_id)).size, 35)
  assert.equal((await list(a, id, 'confirmed', 'Asistente 3')).attendees.length, 4)
  check('Literal case-insensitive name search before stable pagination; count unaffected by filters; invalid queries rejected')
  await b.query('select public.send_event_chat_message($1,$2,$3)', [id, randomUUID(), 'Mensaje previo'])
  await remove(a, id, p); await remove(a, id, p)
  assert.deepEqual(await snapshot(p), { status: 'removed', movements: '2' })
  const movement = (await admin.query("select previous_status,new_status,changed_by,reason from public.participation_history where participation_id=$1 and new_status='removed'", [p])).rows[0]
  assert.deepEqual(movement, { previous_status: 'confirmed', new_status: 'removed', changed_by: owner, reason: 'organizer_removal' })
  assert.equal((await list(a, id)).confirmed_count, 34); assert.equal((await list(a, id, 'removed')).attendees[0].participation_id, p)
  for (const sql of ['select * from public.get_event_chat($1)', 'select * from public.get_event_chat_messages($1)']) await assert.rejects(b.query(sql, [id]), /chat_unavailable/)
  await assert.rejects(b.query('select public.send_event_chat_message($1,$2,$3)', [id, randomUUID(), 'Denied']), /chat_unavailable/)
  assert.equal((await b.query('select * from public.conversations where event_id=$1', [id])).rowCount, 0)
  assert.equal((await b.query('select m.* from public.messages m join public.conversations c on c.id=m.conversation_id where c.event_id=$1', [id])).rowCount, 0)
  assert.equal((await a.query('select * from public.get_event_chat_messages($1)', [id])).rowCount, 1)
  await assert.rejects(b.query('select public.register_for_event($1)', [id]), /rejoin_requires_approval/)
  await b.query('select public.leave_event($1)', [id]); assert.equal((await snapshot(p)).status, 'removed')
  check('Removal retains row, one actor/reason history transition, frees capacity; RPC/direct chat reads and sends denied; rejoin and leave cannot reset removed')
  const rollbackId = await create(), rollbackP = await registration(b, rollbackId)
  await admin.query(`create function public.fail_test_history() returns trigger language plpgsql as $$begin raise exception 'fixture_history_failure'; end$$;
    create trigger fail_test_history before insert on public.participation_history for each row execute function public.fail_test_history();`)
  await assert.rejects(remove(a, rollbackId, rollbackP), /fixture_history_failure/)
  assert.deepEqual(await snapshot(rollbackP), { status: 'confirmed', movements: '1' }); assert.equal((await list(a, rollbackId)).confirmed_count, 1)
  await admin.query('drop trigger fail_test_history on public.participation_history; drop function public.fail_test_history()')
  await b.query('select public.leave_event($1)', [rollbackId]); await assert.rejects(remove(a, rollbackId, rollbackP), /attendee_not_confirmed/)
  await assert.rejects(remove(a, rollbackId, randomUUID()), /attendee_unavailable/)
  check('History failure rolls back state and capacity; cancelled or nonexistent participation rejected')
  for (const change of ["ends_at='2001-01-01',starts_at='2000-01-01'", "cancelled_at='2026-10-12'", "cancelled_at='2026-10-12',archived_at='2026-10-12'"]) {
    const closedId = await create(), closedP = await registration(b, closedId)
    await admin.query(`update public.events set ${change} where id=$1`, [closedId])
    assert.equal((await list(a, closedId)).attendees.length, 1); await assert.rejects(remove(a, closedId, closedP), /event_closed/); assert.equal((await snapshot(closedP)).status, 'confirmed')
  }
  const ongoing = await create(), ongoingP = await registration(b, ongoing)
  await admin.query("update public.events set starts_at='2020-01-01' where id=$1", [ongoing]); await remove(a, ongoing, ongoingP)
  await a.query('begin isolation level repeatable read'); await assert.rejects(remove(a, id, p), /retry_read_committed/); await a.query('rollback')
  check('Upcoming/ongoing removal allowed; ended/cancelled/archived read-only; frozen isolation rejected')
  async function waitLock(client) {
    const deadline = Date.now() + 5000
    while (Date.now() < deadline) { if ((await admin.query("select wait_event_type from pg_stat_activity where pid=$1", [client.processID])).rows[0]?.wait_event_type === 'Lock') return; await new Promise(r => setTimeout(r, 10)) }
    throw Error('Competing operation did not reach lock')
  }
  async function race(firstClient, firstAction, secondClient, secondAction, reject = null) {
    await firstClient.query('begin'); await firstAction()
    const pending = secondAction(); const observed = pending.then(value => ({ value }), error => ({ error }))
    await waitLock(secondClient); await firstClient.query('commit')
    const result = await observed
    if (reject) { assert.ok(result.error); assert.match(result.error.message, reject) } else if (result.error) throw result.error
  }
  let raceId = await create(), raceP = await registration(b, raceId)
  await race(a, () => remove(a, raceId, raceP), a2, () => remove(a2, raceId, raceP)); assert.equal((await snapshot(raceP)).movements, '2')
  raceId = await create(); raceP = await registration(b, raceId)
  await race(a, () => remove(a, raceId, raceP), b, () => b.query('select public.leave_event($1)', [raceId])); assert.equal((await snapshot(raceP)).status, 'removed')
  raceId = await create(); raceP = await registration(b, raceId)
  await race(b, () => b.query('select public.leave_event($1)', [raceId]), a, () => remove(a, raceId, raceP), /attendee_not_confirmed/); assert.equal((await snapshot(raceP)).status, 'cancelled')
  raceId = await create(owner, 1); raceP = await registration(b, raceId)
  await race(a, () => remove(a, raceId, raceP), c, () => c.query('select public.register_for_event($1)', [raceId])); assert.equal((await list(a, raceId)).confirmed_count, 1)
  raceId = await create(); raceP = await registration(b, raceId)
  await race(a, () => remove(a, raceId, raceP), b, () => b.query('select public.send_event_chat_message($1,$2,$3)', [raceId, randomUUID(), 'After removal']), /chat_unavailable/)
  assert.equal((await a.query('select * from public.get_event_chat_messages($1)', [raceId])).rowCount, 0)
  raceId = await create(); raceP = await registration(b, raceId)
  await race(b, () => b.query('select public.send_event_chat_message($1,$2,$3)', [raceId, randomUUID(), 'Before removal']), a, () => remove(a, raceId, raceP))
  assert.equal((await a.query('select * from public.get_event_chat_messages($1)', [raceId])).rowCount, 1)
  check('Real lock races: duplicate removal, withdrawal in both orders, released last seat, chat send before/after removal')
  await mkdir('docs/design/verification/r3-block-4', { recursive: true })
  await writeFile('docs/design/verification/r3-block-4/postgres-results.json', JSON.stringify({ version, environment: 'Isolated real PostgreSQL; Auth/Storage SQL scaffolding; no remote HTTP/JWT', results }, null, 2))
} finally {
  await Promise.allSettled(clients.map(c => c.end()))
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
