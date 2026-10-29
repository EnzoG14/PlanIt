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
const directory = resolve(`.participation-test-tools.local/notifications-${Date.now()}`)
const probe = createServer()
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const clients = []; const results = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001'
const participant = '20000000-0000-4000-8000-000000000002'
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() { const client = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 }); await client.connect(); clients.push(client); return client }
async function role(client, id) { await client.query('reset role'); await client.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await client.query(`set role ${id ? 'authenticated' : 'anon'}`) }
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
    create function storage.allow_only_operation(text) returns boolean language sql stable as $$ select false $$;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin end $$;`)
  for (const file of (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8')
    if (sql.trim()) await admin.query(sql)
  }

  // Controlled local fixtures only; never production notification producers.
  for (const id of [owner,participant]) await admin.query('insert into auth.users values ($1,$2)',[id,{display_name:'Prueba local'}])
  const a=await connect(), b=await connect(); await role(a,owner); await role(b,participant)
  assert.deepEqual((await a.query('select * from public.get_notifications()')).rows,[])
  check('CA-04: fresh inbox is empty; migrations generate no notifications')
  const event=(await admin.query("insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity) select $1,id,'Prueba','Fixture','2099-10-11 20:00','2099-10-11 22:00','Buenos Aires',-34.6,-58.38,10 from public.categories limit 1 returning id",[owner])).rows[0].id
  const conversation=(await admin.query('select id from public.conversations where event_id=$1',[event])).rows[0].id
  const ids=[]
  for(let i=0;i<35;i++) ids.push((await admin.query("insert into public.notifications(recipient_id,type,title,body,created_at,event_id) values ($1,'event_update',$2,'Contenido persistido','2026-10-11 12:30',$3) returning id",[owner,'Aviso '+i,event])).rows[0].id)
  const other=(await admin.query("insert into public.notifications(recipient_id,type,title) values ($1,'system','Aviso B') returning id",[participant])).rows[0].id
  await admin.query(await readFile('supabase/migrations/20261011193316_r2_realtime_chat_notifications.sql','utf8'))
  assert.equal((await a.query('select count(*)::int as count from public.notifications where read_at is null')).rows[0].count,35)
  assert.deepEqual((await b.query('select * from public.get_notification_changes($1)',[ids])).rows,[])
  assert.equal((await a.query('select * from public.get_notification_changes($1)',[[ids[0],other]])).rows.length,1)
  assert.equal((await admin.query("select has_function_privilege('anon','public.get_notification_changes(uuid[])','EXECUTE') as allowed")).rows[0].allowed,false)
  await assert.rejects(a.query('select * from public.get_notification_changes($1)',[Array(101).fill(ids[0])]), /invalid_ids/)
  check('Realtime batch RPC isolates recipients, rejects anon and oversized batches; exact unread count exceeds page size; migration idempotent')
  const first=(await a.query('select * from public.get_notifications()')).rows
  assert.equal(first.length,31);assert.equal(first[0].body,'Contenido persistido'); assert.equal(first[0].created_at.getHours(),12)
  assert.ok(first.every(row=>row.target==='/events/'+event))
  assert.deepEqual((await a.query('select id from public.notifications where id=$1',[other])).rows,[])
  assert.equal((await b.query('select * from public.get_notifications()')).rows.length,1)
  assert.deepEqual((await b.query('select id from public.notifications where id=$1',[ids[0]])).rows,[])
  check('CA-01/02/03: persisted content/time, A/B isolation including direct and unfiltered SELECT')
  const last=first[29]; const second=(await a.query('select * from public.get_notifications($1,$2)',[last.created_at,last.id])).rows
  assert.equal(second.length,5);assert.equal(new Set([...first.slice(0,30),...second].map(x=>x.id)).size,35)
  await admin.query("insert into public.notifications(recipient_id,type,title,created_at) values ($1,'system','Nuevo','2026-10-12')",[owner])
  assert.deepEqual((await a.query('select * from public.get_notifications($1,$2)',[last.created_at,last.id])).rows,second)
  await assert.rejects(a.query('select * from public.get_notifications(null,$1)',[last.id]),/invalid_cursor/)
  check('Keyset pagination with tied timestamps, lookahead and concurrent newer insertion stays stable')
  const marked=(await a.query('select public.mark_notification_read($1) as t',[ids[0]])).rows[0].t
  assert.ok(marked instanceof Date)
  assert.equal((await a.query('select public.mark_notification_read($1) as t',[ids[0]])).rows[0].t.getTime(),marked.getTime())
  await a.query("update public.notifications set read_at='2099-01-01' where id=$1",[ids[0]])
  await a.query('update public.notifications set read_at=null where id=$1',[ids[0]])
  assert.equal((await a.query('select read_at from public.notifications where id=$1',[ids[0]])).rows[0].read_at.getTime(),marked.getTime())
  await a.query("update public.notifications set read_at='2099-01-01' where id=$1",[ids[1]])
  assert.ok((await a.query('select read_at from public.notifications where id=$1',[ids[1]])).rows[0].read_at.getFullYear()<2099)
  await assert.rejects(b.query('select public.mark_notification_read($1)',[ids[0]]),/notification_unavailable/)
  assert.equal((await b.query('update public.notifications set read_at=null where id=$1 returning id',[ids[0]])).rows.length,0)
  for(const column of ['recipient_id','actor_id','event_id','conversation_id','type','title','body','created_at']) await assert.rejects(a.query('update public.notifications set '+column+'='+column+' where id=$1',[ids[0]]),/permission denied/)
  await assert.rejects(a.query("insert into public.notifications(recipient_id,type,title) values ($1,'fake','Fake')",[owner]),/permission denied/)
  await assert.rejects(a.query('delete from public.notifications where id=$1',[ids[0]]),/permission denied/)
  check('Only own read_at can change; server timestamp, immutable first read, idempotent retries; forged INSERT/DELETE/content/identity updates denied')
  const chatNotice=(await admin.query("insert into public.notifications(recipient_id,type,title,conversation_id) values ($1,'chat','Chat fixture',$2) returning id",[participant,conversation])).rows[0].id
  assert.equal((await b.query('select public.get_notification_target($1) as target',[chatNotice])).rows[0].target,null)
  await b.query('select public.register_for_event($1)',[event])
  assert.equal((await b.query('select public.get_notification_target($1) as target',[chatNotice])).rows[0].target,'/events/'+event+'/chat')
  await b.query('select public.leave_event($1)',[event])
  assert.equal((await b.query('select public.get_notification_target($1) as target',[chatNotice])).rows[0].target,null)
  const hiddenEvent=(await admin.query("insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility) select $1,id,'Oculto','Fixture','2099-10-11 20:00','2099-10-11 22:00','Buenos Aires',-34.6,-58.38,10,'unlisted' from public.categories limit 1 returning id",[owner])).rows[0].id
  const hidden=(await admin.query("insert into public.notifications(recipient_id,type,title,event_id) values ($1,'event_update','Oculto',$2) returning id",[participant,hiddenEvent])).rows[0].id
  assert.equal((await b.query('select public.get_notification_target($1) as target',[hidden])).rows[0].target,null)
  assert.equal((await b.query('select public.get_notification_target($1) as target',[ids[0]])).rows[0].target,null)
  check('Targets inherit event/chat RLS; nonmember, removed access, hidden event and foreign notification never grant navigation')
  assert.equal((await admin.query("select relrowsecurity from pg_class where oid='public.notifications'::regclass")).rows[0].relrowsecurity,true)
  for(const fn of ['get_notifications(timestamp,uuid)','get_notification_target(uuid)','mark_notification_read(uuid)']){
    const row=(await admin.query('select prosecdef,proconfig from pg_proc where oid=$1::regprocedure',['public.'+fn])).rows[0]
    assert.equal(row.prosecdef,false);assert.ok(row.proconfig.includes('search_path=""'))
  }
  await role(b,null)
  await assert.rejects(b.query('select * from public.notifications'),/permission denied/)
  for(const sql of ['select * from public.get_notifications()','select public.mark_notification_read($1)','select public.get_notification_target($1)']) await assert.rejects(b.query(sql,sql.includes('$1')?[ids[0]]:[]),/permission denied/)
  await b.query('set role authenticated')
  await assert.rejects(b.query('select * from public.get_notifications()'),/authentication_required/)
  check('RLS enabled; all new RPCs SECURITY INVOKER, empty search_path; anon and missing identity denied')
  const out=process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/notifications'
  await mkdir(out,{recursive:true});await writeFile(out+'/postgres-results.json',JSON.stringify({version,environment:'Local PostgreSQL with Auth/Storage scaffolding; no Supabase HTTP/JWT',results},null,2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Release every local connection. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
