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
const directory = resolve(`.participation-test-tools.local/profile-${Date.now()}`)
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

  const ids = [owner, participant]
  for (const id of ids) await admin.query('insert into auth.users values ($1,$2)', [id, {display_name: id === owner ? 'Ana' : 'Bruno'}])
  await admin.query("update public.profiles set bio='Bio propia',birth_date='1990-01-01',sex='female' where id=$1",[owner])
  const a = await connect(); const b = await connect()
  await role(a, owner); await role(b, participant)
  const projection = 'display_name,username,bio,avatar_file_id'
  for (const [client, id, other] of [[a,owner,participant],[b,participant,owner]]) {
    const own = (await client.query('select '+projection+' from public.profiles where id=$1',[id])).rows
    assert.equal(own.length,1)
    assert.deepEqual((await client.query('select '+projection+' from public.profiles where id=$1',[other])).rows,[])
    assert.equal((await client.query('select '+projection+' from public.profiles')).rows.length,1)
    assert.equal((await client.query("update public.profiles set bio='ajeno' where id=$1 returning id",[other])).rows.length,0)
  }
  check('CA-02/04: two SQL identities read only own profile; direct ID, unfiltered SELECT and cross-account UPDATE cannot expose/change private data')
  await a.query("update public.profiles set display_name='Ana actualizada',bio='Bio actualizada' where id=$1",[owner])
  const updated=(await a.query('select '+projection+' from public.profiles where id=$1',[owner])).rows[0]
  assert.equal(updated.display_name,'Ana actualizada'); assert.equal(updated.bio,'Bio actualizada')
  const absent=(await b.query('select '+projection+' from public.profiles where id=$1',[participant])).rows[0]
  assert.equal(absent.bio,null);assert.equal(absent.avatar_file_id,null)
  check('CA-03: subsequent read reflects persisted profile updates; absent optional values stay null')
  const path=owner+'/avatar.png'
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await admin.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values ('event_media',$1,$2,$3)",[path,owner,{mimetype:'image/png',size:10}])
  const fileId=(await admin.query("insert into public.files(uploaded_by,bucket_name,storage_path,mime_type,size_bytes) values ($1,'event_media',$2,'image/png',10) returning id",[owner,path])).rows[0].id
  await admin.query('update public.profiles set avatar_file_id=$1 where id=$2',[fileId,owner])
  assert.equal((await a.query('select bucket_name,storage_path,uploaded_by,mime_type from public.files where id=$1 and uploaded_by=$2',[fileId,owner])).rows.length,1)
  assert.equal((await a.query('select name from storage.objects where name=$1',[path])).rows.length,1)
  assert.deepEqual((await b.query('select id from public.files where id=$1',[fileId])).rows,[])
  assert.deepEqual((await b.query('select name from storage.objects where name=$1',[path])).rows,[])
  check('Existing file/Storage RLS permits own unlinked avatar object and hides it from another account; no permission changes')
  await role(b,null)
  await assert.rejects(b.query('select '+projection+' from public.profiles where id=$1',[owner]),/permission denied/)
  check('Anonymous role cannot SELECT profiles')
  const out=process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/own-profile'
  await mkdir(out,{recursive:true})
  await writeFile(out+'/postgres-results.json',JSON.stringify({version,environment:'Local PostgreSQL with Auth/Storage scaffolding, no real Supabase HTTP or JWT',results},null,2))
} finally {
  for (const client of clients) { try { await client.end() } catch { /* Release every local connection. */ } }
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
