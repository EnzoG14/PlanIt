import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'

const toolsRoot = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(toolsRoot, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(toolsRoot, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile)
// Preserve PostgreSQL microseconds in keyset cursors, as PostgREST JSON does.
pg.types.setTypeParser(1114, value => value)
const directory = resolve(`.participation-test-tools.local/chat-${Date.now()}`)
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
const header = async (client, id) => (await client.query('select * from public.get_event_chat($1)', [id])).rows
const history = async (client, id, at = null, beforeId = null) => (await client.query('select * from public.get_event_chat_messages($1,$2,$3)', [id,at,beforeId])).rows
const send = async (client, event, body, id = randomUUID()) => (await client.query('select public.send_event_chat_message($1,$2,$3) as id', [event,id,body])).rows[0].id
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
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8')
    if (file.endsWith('_event_chat.sql')) {
      for (const id of [owner, participant, stranger]) await admin.query('insert into auth.users values ($1,$2)', [id, { display_name: 'Prueba local' }])
      await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
        select $1,id,'Previo al chat','Fixture local','2099-10-11 20:00','2099-10-11 22:00','Buenos Aires',-34.6,-58.38,10 from public.categories limit 1`, [owner])
    }
    if (sql.trim()) await admin.query(sql)
  }
  await admin.query(await readFile('supabase/migrations/20261011193316_r2_realtime_chat_notifications.sql','utf8'))
  assert.deepEqual((await admin.query("select tablename from pg_publication_tables where pubname='supabase_realtime' order by tablename")).rows.map(row=>row.tablename),['messages','notifications'])
  check('Realtime publication contains only messages/notifications; incremental migration reapplication is safe')

  const event = (await admin.query('select id from public.events')).rows[0].id
  const tables = (await admin.query("select relname,relrowsecurity from pg_class where oid in ('public.conversations'::regclass,'public.messages'::regclass)")).rows
  assert.ok(tables.length === 2 && tables.every(table=>table.relrowsecurity))
  for (const signature of ['public.get_event_chat(uuid)','public.get_event_chat_messages(uuid,timestamp,uuid)','public.send_event_chat_message(uuid,uuid,text)']) {
    const fn=(await admin.query('select prosecdef,proconfig from pg_proc where oid=$1::regprocedure',[signature])).rows[0]
    assert.ok(fn.prosecdef && fn.proconfig.includes('search_path=""'))
    assert.equal((await admin.query("select has_function_privilege('anon',$1,'EXECUTE') as allowed",[signature])).rows[0].allowed,false)
  }
  check('Chat tables enable RLS; public definer endpoints have empty search_path and deny anonymous execution')
  await admin.query('insert into public.conversations(event_id) select id from public.events on conflict (event_id) do nothing')
  assert.equal((await admin.query('select count(*)::int as n from public.conversations')).rows[0].n,1)
  const a = await connect(); const b = await connect(); const c = await connect()
  await role(a,owner); await role(b,participant); await role(c,stranger)
  const conversation = (await header(a,event))[0].conversation_id
  assert.deepEqual(await history(a,event), [])
  await b.query('select public.register_for_event($1)',[event])
  assert.equal((await header(b,event))[0].conversation_id, conversation)
  const newEvent = (await admin.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
    select $1,id,'Nuevo','Fixture local','2099-10-11 20:00','2099-10-11 22:00','Buenos Aires',-34.6,-58.38,10 from public.categories limit 1 returning id`,[owner])).rows[0].id
  assert.equal((await header(a,newEvent)).length,1)
  check('CA R2-04.01/04: backfill idempotent, new-event trigger and empty history; organizer and confirmed user share exactly one chat')
  const messageId = randomUUID()
  assert.equal(await send(b,event,'  Hola comunidad  ',messageId),messageId)
  const b2 = await connect(); await role(b2,participant)
  const repeated = await Promise.all([send(b,event,'Hola comunidad',messageId),send(b2,event,'Hola comunidad',messageId)])
  assert.deepEqual(repeated,[messageId,messageId])
  const first = (await history(a,event))[0]
  assert.equal(first.sender_id,participant); assert.equal(first.body,'Hola comunidad')
  assert.deepEqual(Object.keys(first).sort(),['id','sender_id','body','created_at','display_name','username'].sort())
  assert.equal((await b.query('select * from public.messages where conversation_id=$1',[conversation])).rowCount,1)
  assert.equal((await b.query('select birth_date,sex from public.profiles where id=$1',[owner])).rowCount,0)
  check('CA R2-04.02/R2-05.01/02: persisted sender/event, social-only projection, reopen history and concurrent idempotent retry')
  for (const body of ['', '   ', '\n\t  ', '\u00a0\u2003', 'x'.repeat(2001), null]) await assert.rejects(send(b,event,body), /invalid_message/)
  await send(b,event,'x'.repeat(2000))
  await assert.rejects(send(a,event,'Impostor',messageId),/message_id_conflict/)
  await assert.rejects(b.query('insert into public.messages(id,conversation_id,sender_id,body) values ($1,$2,$3,$4)',[randomUUID(),conversation,owner,'Falso']),/permission denied/)
  await assert.rejects(b.query('update public.messages set body=$1',['Editado']),/permission denied/)
  await assert.rejects(b.query('delete from public.messages'),/permission denied/)
  await assert.rejects(b.query('insert into public.conversations(event_id) values ($1)',[event]),/permission denied/)
  check('CA R2-05.03/04: blank and oversized text denied, 2000 allowed; direct mutations and sender spoofing denied')
  await assert.rejects(header(c,event),/chat_unavailable/); await assert.rejects(history(c,event),/chat_unavailable/)
  await assert.rejects(send(c,event,'Intruso'),/chat_unavailable/)
  assert.equal((await c.query('select * from public.messages where conversation_id=$1',[conversation])).rowCount,0)
  assert.equal((await c.query('select * from public.conversations where id=$1',[conversation])).rowCount,0)
  await role(c,null)
  for (const operation of [() => header(c,event), () => history(c,event), () => send(c,event,'Anon'), () => c.query('select * from public.messages')]) await assert.rejects(operation(),/permission denied/)
  await b.query('select public.leave_event($1)',[event])
  await assert.rejects(history(b,event),/chat_unavailable/)
  await b.query('select public.register_for_event($1)',[event])
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await admin.query("update public.event_participations set status='removed' where event_id=$1 and user_id=$2",[event,participant])
  await assert.rejects(header(b,event),/chat_unavailable/); await assert.rejects(send(b,event,'Removido'),/chat_unavailable/)
  await admin.query("update public.event_participations set status='confirmed' where event_id=$1 and user_id=$2",[event,participant])
  check('CA R2-04.03/R2-05.04: stranger, anonymous, cancelled participation and removed user cannot access by event/conversation ID')
  for (let n=0;n<55;n++) await send(a,event,`Mensaje ${n}`)
  const latest = await history(b,event)
  assert.equal(latest.length,51)
  const cursor = latest[49]
  const older = await history(b,event,cursor.created_at,cursor.id)
  assert.equal(older.length,7)
  assert.equal(new Set([...latest.slice(0,50),...older].map(m=>m.id)).size,57)
  check('CA R2-04.02/R2-05.02: deterministic chronological history, keyset pagination and reopen across users')
  for (const [state,sql] of [['ended',"starts_at='2020-10-11 20:00',ends_at='2020-10-11 22:00'"],['cancelled',"cancelled_at='2026-10-10 12:00'"],['archived',"archived_at='2026-10-10 13:00'"]]) {
    await admin.query(`update public.events set ${sql} where id=$1`,[event])
    assert.equal((await header(b,event))[0].event_state,state)
    assert.equal((await history(b,event)).length,51)
    await assert.rejects(send(b,event,'Cerrado'),/chat_read_only/)
    assert.equal(await send(b,event,'Hola comunidad',messageId),messageId)
  }
  check('CA R2-04.01/R2-05.04: ended/cancelled/archived preserve authorized history; no new writes, prior retry remains idempotent')
  await admin.query('begin')
  await admin.query("update public.events set cancelled_at='2026-10-10 12:00' where id=$1",[newEvent])
  const blockedSend = send(a,newEvent,'Carrera').then(()=>({ok:true}),error=>({error}))
  await new Promise(resolve=>setTimeout(resolve,150))
  const waiting = (await admin.query("select count(*)::int as n from pg_stat_activity where wait_event_type='Lock' and query like '%send_event_chat_message%'")).rows[0].n
  assert.ok(waiting > 0)
  await admin.query('commit')
  assert.match((await blockedSend).error.message,/chat_read_only/)
  assert.equal((await history(a,newEvent)).length,0)
  check('CA R2-05.04: real two-connection race waits on event lock and rejects send after cancellation commits')
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/event-chat'
  await mkdir(out,{recursive:true})
  await writeFile(`${out}/postgres-results.json`,JSON.stringify({version,environment:'Local PostgreSQL with Auth/Storage scaffolding; no real Supabase REST/Auth',results},null,2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Close local connections. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
