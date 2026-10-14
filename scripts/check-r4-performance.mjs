import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'

const root = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(root, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(root, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile), directory = resolve(`.participation-test-tools.local/r4-performance-${Date.now()}`)
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r))
const port = probe.address().port; await new Promise(r => probe.close(r))
const clients = []; let started = false
const owner = '20000000-0000-4000-8000-000000000001'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r4-block-9/performance'
try {
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  const db = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' }); clients.push(db); await db.connect()
  await db.query(`create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin end $$;`)
  const migrations = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
  for (const file of migrations) { const sql = await readFile(`supabase/migrations/${file}`, 'utf8'); if (sql.trim()) await db.query(sql) }
  await db.query('insert into auth.users values($1,$2)', [owner, { display_name: 'Performance fixture' }])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  const category = (await db.query('select id from public.categories order by id limit 1')).rows[0].id
  await db.query(`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
    select $1,$2,'Benchmark '||g,'Repeatable R4 fixture',timestamp '2099-10-01 20:00'+(g%30)*interval '1 day',
    timestamp '2099-10-01 22:00'+(g%30)*interval '1 day','Fixture',-34.6+(g%100)*0.02,-58.38+(g%80)*0.02,20,
    case when g%10=0 then 'unlisted' else 'public' end from generate_series(1,5000) g`, [owner, category])
  await db.query('analyze public.events')
  const functions = (await db.query(`select p.oid::regprocedure::text as signature,p.prosecdef as definer,p.proconfig as config,md5(p.prosrc) as body_md5,md5(replace(p.prosrc,chr(13),'')) as body_md5_lf,
    has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'`)).rows
  const tables = (await db.query("select tablename as table,rowsecurity as rls from pg_tables where schemaname='public'")).rows
  assert.equal(tables.length, 14); assert.ok(tables.every(t => t.rls))
  await db.query('set role authenticated'); await db.query('select public.set_my_category_interests($1)', [[category]])
  const publicFilter = "visibility='public' and cancelled_at is null and archived_at is null and ends_at>(statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')"
  const distanceFilter = '2*6371*asin(least(1,sqrt(power(sin(radians(latitude+34.6)/2),2)+cos(radians(-34.6))*cos(radians(latitude))*power(sin(radians(longitude+58.38)/2),2))))<=25'
  const queries = [
    { name: 'text', sql: 'select * from public.search_public_events($1)', args: ['Benchmark 49'] },
    { name: 'date-radius', sql: 'select * from public.search_public_events($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', args: [null,[category],null,null,30,null,null,null,null,'2099-10-05','2099-10-15',-34.6,-58.38,25] },
    { name: 'suggestions', sql: 'select * from public.get_suggested_events($1,$2,$3)', args: [-34.6,-58.38,6] },
    // Diagnostic comparison, not a replacement for the shipped RPC; deliberately conservative box.
    { name: 'haversine-only-stage', sql: `select count(*) from public.events where ${publicFilter} and ${distanceFilter}`, args: [] },
    { name: 'box-haversine-stage', sql: `select count(*) from public.events where ${publicFilter} and latitude between -34.9 and -34.3 and longitude between -58.75 and -58.01 and ${distanceFilter}`, args: [] },
  ]
  const benchmarks = []
  for (const q of queries) {
    for (let i = 0; i < 3; i++) await db.query(q.sql,q.args)
    const samples = []; let rows
    for (let i = 0; i < 20; i++) { const start = performance.now(); rows = (await db.query(q.sql,q.args)).rows; samples.push(performance.now()-start) }
    assert.ok(rows.length > 0 && rows.every(r => r.visibility === undefined || r.visibility === 'public'))
    const sorted = [...samples].sort((a,b)=>a-b)
    const explain = (await db.query('explain (analyze,buffers,format json) '+q.sql,q.args)).rows[0]['QUERY PLAN']
    benchmarks.push({ name:q.name, samplesMs:samples, p50Ms:sorted[9],p95Ms:sorted[18],returnedRows:rows.length,matchingCount:rows[0]?.count??null,explain })
    console.log(`PASS ${q.name}: p50=${sorted[9].toFixed(2)}ms p95=${sorted[18].toFixed(2)}ms`)
  }
  assert.equal(benchmarks[3].matchingCount,benchmarks[4].matchingCount,'Conservative box does not change the matching set in this dataset')
  await db.query('reset role')
  const version = (await db.query('select version()')).rows[0].version
  const deadlocks = (await db.query("select deadlocks from pg_stat_database where datname=current_database()" )).rows[0].deadlocks
  assert.equal(Number(deadlocks),0)
  await mkdir(output,{recursive:true})
  await writeFile(`${output}/results.json`,JSON.stringify({ environment:'Isolated PostgreSQL; synthetic Auth/Storage; SET ROLE; 5000 events, 10% hidden, one category, fixed 2099 dates; 3 warmups + 20 sequential samples; no network/user SLA claim',version,migrations,tables,functions,benchmarks,deadlocks,result:'PASS' },null,2)+'\n')
} finally {
  for (const client of clients) await client.end().catch(()=>{})
  if(started) await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})
}
