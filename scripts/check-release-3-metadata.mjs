import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'

const out = 'docs/design/verification/r3-block-7'
// Full catalogs stay local and ignored; only aggregate checks enter the PR.
const remote = JSON.parse(await readFile('.r3-remote-metadata.local', 'utf8')).rows[0].metadata
const migrations = (await readdir('supabase/migrations')).filter(x => x.endsWith('.sql')).sort()
assert.deepEqual(remote.migrations.map(x => x.version), migrations.map(x => x.split('_')[0]))
assert.ok(remote.tables.every(x => x.relrowsecurity))
assert.ok(remote.functions.every(x => !x.anon_execute))
assert.ok(remote.functions.filter(x => x.authenticated_execute).every(x => x.proconfig?.includes('search_path=""')))
assert.ok(remote.table_grants.every(x => x.privilege_type === 'SELECT'))
assert.equal(remote.bucket?.[0]?.public, false)
assert.equal(remote.bucket[0].file_size_limit, 5 * 1024 * 1024)
assert.deepEqual([...remote.bucket[0].allowed_mime_types].sort(), ['image/jpeg', 'image/png', 'image/webp'])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/r3-metadata-${Date.now()}`)
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r))
let started = false, client
try {
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  client = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000, query_timeout: 30000 }); await client.connect()
  await client.query(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage; create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,storage to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$;`)
  for (const file of migrations) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await client.query(sql) }
  const local = (await client.query(`select proname, pg_get_function_identity_arguments(oid) as arguments, md5(replace(pg_get_functiondef(oid), chr(13), '')) as definition_hash from pg_proc where pronamespace='public'::regnamespace`)).rows
  const comparisons = remote.functions.filter(x => x.proname !== 'rls_auto_enable').map(fn => {
    const localHash = local.find(x => x.proname === fn.proname && x.arguments === fn.arguments)?.definition_hash
    return { name: fn.proname, arguments: fn.arguments, local_hash: localHash, remote_hash: fn.definition_hash, identical: localHash === fn.definition_hash }
  })
  await mkdir(out, { recursive: true })
  await writeFile(`${out}/metadata-comparison.json`, JSON.stringify({ project: 'iepeqmvzjguwlhnecsdq', migration_count: migrations.length, all_public_tables_rls: true, no_anon_function_execute: true, no_generic_table_writes: true, private_bucket_config: 'PASS', identical_function_count: comparisons.filter(x => x.identical).length, mismatched_function_count: comparisons.filter(x => !x.identical).length, excluded: 'rls_auto_enable is a platform event-trigger scaffold locally, not a business RPC' }, null, 2))
  assert.ok(comparisons.every(x => x.identical), 'Remote function definition differs from local migration replay')
  console.log(`PASS: ${migrations.length} migration versions; ${remote.tables.length} RLS tables; ${comparisons.length} function definitions identical; authenticated-only RPC grants`)
} finally {
  await client?.end()
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true, timeout: 30000 })
}
