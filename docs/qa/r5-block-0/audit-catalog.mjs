import assert from 'node:assert/strict'
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {pathToFileURL} from 'node:url'
import {resolve} from 'node:path'
import {createServer} from 'node:net'
const out='docs/qa/r5-block-0'
await mkdir(out,{recursive:true})
const hash=s=>createHash('sha256').update(s.replace(/\r\n/g,'\n')).digest('hex')
const catalog=JSON.parse(await readFile('.r5-catalog.local','utf8')).rows[0].metadata
const files=(await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).sort()
assert.deepEqual(catalog.migrations.map(x=>x.version),files.map(x=>x.split('_')[0]))
assert.equal(catalog.tables.length,14)
assert.ok(catalog.tables.every(x=>x.rls))
assert.ok(catalog.functions.every(x=>!x.anon_execute))
assert.ok(catalog.functions.filter(x=>x.authenticated_execute).every(x=>x.config?.includes('search_path=""')))
const summary={...catalog,functions:catalog.functions.map(({definition,...f})=>({...f,definition_sha256_lf:hash(definition)}))}
await writeFile(`${out}/catalog.json`,JSON.stringify(summary,null,2)+'\n')
const root=process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{default:pg},{initdb,pg_ctl}]=await Promise.all([import(pathToFileURL(`${root}/pg/lib/index.js`).href),import(pathToFileURL(`${root}/@embedded-postgres/windows-x64/dist/index.js`).href)])
const run=promisify(execFile),directory=resolve(`.r5-postgres-${Date.now()}.local`)
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r))
let started=false,client
try{
 await run(initdb,['-D',directory,'-U','postgres','-A','trust','--encoding=UTF8','--locale=C'],{windowsHide:true,timeout:30000})
 await run(pg_ctl,['-D',directory,'-l',`${directory}/server.log`,'-o',`-h 127.0.0.1 -p ${port}`,'-w','start'],{windowsHide:true,timeout:30000});started=true
 client=new pg.Client({host:'127.0.0.1',port,user:'postgres',database:'postgres',connectionTimeoutMillis:5000,query_timeout:30000});await client.connect()
 const version=(await client.query('select version()')).rows[0].version
 await client.query(`create role anon; create role authenticated; create role service_role;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,storage to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
 alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;
 create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin end $$;`)
 for(const file of files){const sql=await readFile(`supabase/migrations/${file}`,'utf8');if(sql.trim())await client.query(sql)}
 const functions=(await client.query(`select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as identity_arguments,pg_get_functiondef(p.oid) as definition,p.prosecdef as definer,p.proconfig as config,has_function_privilege('anon',p.oid,'execute') as anon_execute,has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'`)).rows
 const comparisons=catalog.functions.filter(f=>f.name!=='rls_auto_enable').map(f=>{const local=functions.find(l=>l.schema===f.schema&&l.name===f.name&&l.identity_arguments===f.identity_arguments);return {schema:f.schema,name:f.name,arguments:f.identity_arguments,body_match:local&&hash(local.definition)===hash(f.definition),permissions_match:local&&local.anon_execute===f.anon_execute&&local.authenticated_execute===f.authenticated_execute,configuration_match:local&&local.definer===f.definer&&JSON.stringify(local.config)===JSON.stringify(f.config)}})
 const results={scope:'Replay local de migraciones existentes y comparación de catálogo; sin fixtures de negocio, HTTP JWT ni implementación R5',local_version:version,remote_version:catalog.server_version,migration_count:files.length,migrations:await Promise.all(files.map(async file=>({file,sha256_lf:hash(await readFile(`supabase/migrations/${file}`,'utf8'))}))),functions:comparisons,excluded:'public.rls_auto_enable: scaffold local de plataforma, no RPC de negocio',result:comparisons.every(x=>x.body_match&&x.permissions_match&&x.configuration_match)?'PASS':'FAIL'}
 await writeFile(`${out}/comparison.json`,JSON.stringify(results,null,2)+'\n')
 assert.equal(results.result,'PASS')
 console.log(`PASS: ${files.length} migraciones; 14 tablas RLS remotas; ${comparisons.length} funciones iguales por cuerpo/ACL/config`)
}finally{await client?.end();if(started)await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})}
