import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import pg from '../.participation-test-tools.local/node_modules/pg/lib/index.js'
import { initdb, pg_ctl } from '../.participation-test-tools.local/node_modules/@embedded-postgres/windows-x64/dist/index.js'
const run = promisify(execFile), directory = resolve(`.gallery-test-${Date.now()}.local`)
const probe = createServer(); await new Promise(r => probe.listen(0,'127.0.0.1',r)); const port=probe.address().port; await new Promise(r=>probe.close(r))
const clients=[], results=[]; let started=false
const owner='20000000-0000-4000-8000-000000000001', guest='20000000-0000-4000-8000-000000000002'
const check=test=>{results.push({test,result:'PASS'});console.log(`PASS: ${test}`)}
async function connect(identity) {const c=new pg.Client({host:'127.0.0.1',port,user:'postgres',database:'postgres'});await c.connect();clients.push(c);if(identity){await c.query("select set_config('request.jwt.claim.sub',$1,false)",[identity]);await c.query('set role authenticated')}return c}
try {
  await run(initdb,['-D',directory,'-U','postgres','-A','trust','--encoding=UTF8','--locale=C'],{windowsHide:true,timeout:30000})
  await run(pg_ctl,['-D',directory,'-l',`${directory}/server.log`,'-o',`-h 127.0.0.1 -p ${port}`,'-w','start'],{windowsHide:true,timeout:30000});started=true
  const admin=await connect(),version=(await admin.query('select version()')).rows[0].version
  await admin.query(`create role anon; create role authenticated; create role service_role;
    create schema auth;create schema storage;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,storage to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$;`)
  for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(`supabase/migrations/${file}`,'utf8');if(sql.trim())await admin.query(sql)}
  for(const id of [owner,guest])await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'Prueba'}])
  const a=await connect(owner),b=await connect(guest),a2=await connect(owner)
  const create=async()=>{await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);return(await admin.query(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity) select id,'Galería','Fixture SQL','2099-10-12 20:00','2099-10-12 23:00','Buenos Aires',-34.6,-58.4,10 from public.categories limit 1 returning id`)).rows[0].id}
  const id=await create(),duplicate=await create()
  const stage=async(n,mime='image/jpeg',size=1234)=>{const path=`${owner}/${id}/${n}.jpg`;await a.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[path,owner,{mimetype:mime,size}]);return path}
  const add=(client,path)=>client.query('select public.add_event_image($1,$2) as id',[id,path])
  const images=async()=> (await a.query('select id,file_id,sort_order from public.event_images where event_id=$1 order by sort_order',[id])).rows
  const signatures=['public.add_event_image(uuid,text)','public.remove_event_image(uuid,uuid)','public.reorder_event_images(uuid,uuid[],uuid[])','public.get_event_unregistered_uploads(uuid)']
  for(const signature of signatures){const r=(await admin.query("select prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') as anon from pg_proc where oid=$1::regprocedure",[signature])).rows[0];assert.equal(r.prosecdef,true);assert.ok(r.proconfig.includes('search_path=""'));assert.equal(r.anon,false)}
  for(const table of ['files','event_images']){assert.equal((await admin.query("select relrowsecurity from pg_class where oid=$1::regclass",[`public.${table}`])).rows[0].relrowsecurity,true);for(const privilege of ['UPDATE','DELETE'])assert.equal((await admin.query("select has_table_privilege('authenticated',$1,$2) as ok",[`public.${table}`,privilege])).rows[0].ok,false)}
  check('Full migration replay; RLS, minimal grants, authenticated-only RPC and empty search_path')
  const paths=[];for(let n=0;n<10;n++){paths.push(await stage(n));await add(a,paths[n])}
  assert.equal((await images()).length,10)
  const original=(await images())[0];assert.equal((await add(a,paths[0])).rows[0].id,original.id)
  const extra=await stage(10);await assert.rejects(add(a,extra),/gallery_full/);assert.equal((await images()).length,10)
  check('Image 10 accepted, 11 rejected; immutable path retry returns same association at full capacity')
  for(const sql of ['select public.add_event_image($1,$2)','select public.remove_event_image($1,$2)','select public.reorder_event_images($1,$2,$3)'])await assert.rejects(b.query(sql,sql.includes('reorder')?[id,[],[]]:[id,sql.includes('add')?paths[0]:original.id]),/not_event_organizer/)
  await assert.rejects(b.query('select * from public.get_event_unregistered_uploads($1)',[id]),/not_event_organizer/)
  await assert.rejects(b.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[id,original.file_id]),/not_event_organizer|row-level security/)
  for(const table of ['public.event_images','public.files'])await assert.rejects(b.query(`delete from ${table}`),/permission denied/)
  assert.equal((await b.query("delete from storage.objects where bucket_id='event_media' and name=$1",[paths[0]])).rowCount,0)
  await assert.rejects(b.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('event_media',$1,$2,$3)",[`${owner}/${id}/attack.jpg`,guest,{mimetype:'image/jpeg',size:100}]),/row-level security/)
  assert.equal((await b.query('update storage.objects set metadata=$1 where name=$2',[{size:0},paths[0]])).rowCount,0)
  check('Account B denied RPC, REST-equivalent INSERT/DELETE, Storage insert/delete/overwrite and orphan listing')
  let ordered=(await images()).map(x=>x.id),reversed=[...ordered].reverse()
  await a.query('select public.reorder_event_images($1,$2,$3)',[id,reversed,ordered]);assert.deepEqual((await images()).map(x=>x.id),reversed)
  assert.equal((await a.query("select image_path from public.get_my_organized_events('all',0) where id=$1",[id])).rows[0].image_path,paths[9])
  await assert.rejects(a.query('select public.reorder_event_images($1,$2,$3)',[id,ordered,ordered]),/gallery_changed/)
  await assert.rejects(a.query('select public.reorder_event_images($1,$2,$3)',[id,[...reversed.slice(1),reversed[1]],reversed]),/invalid_image_order/)
  check('Order persists; list cover follows sort_order; stale session and duplicate IDs rejected atomically')
  await a.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[duplicate,original.file_id])
  await a.query('select public.remove_event_image($1,$2)',[id,original.id]);await a.query('select public.remove_event_image($1,$2)',[id,original.id])
  assert.equal((await images()).length,9);assert.equal((await a.query('select count(*) from public.event_images where event_id=$1',[duplicate])).rows[0].count,'1')
  assert.equal((await a.query('delete from storage.objects where name=$1',[paths[0]])).rowCount,0)
  assert.deepEqual((await images()).map(x=>x.sort_order),[0,1,2,3,4,5,6,7,8])
  check('Unlink is idempotent; compact order, shared file metadata and physical object retained')
  for(const [n,mime,size] of [[20,'text/plain',100],[21,'image/png',5242881],[22,'image/png',0]]){const path=await stage(n,mime,size);await assert.rejects(add(a,path),/check constraint/);assert.equal((await admin.query('select count(*) from public.files where storage_path=$1',[path])).rows[0].count,'0');assert.equal((await a.query('delete from storage.objects where name=$1',[path])).rowCount,1)}
  await assert.rejects(add(a,`${owner}/${id}/missing.jpg`),/invalid_image/)
  assert.ok((await a.query('select * from public.get_event_unregistered_uploads($1)',[id])).rows.some(x=>x.storage_path===extra))
  check('Invalid MIME, size, empty and interrupted uploads create no false record; unregistered cleanup/recovery works')
  // Two sessions race for the final slot. One commits, the other rechecks after lock.
  const p1=await stage(30),p2=await stage(31)
  const race=await Promise.allSettled([add(a,p1),add(a2,p2)])
  assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal((await images()).length,10)
  check('Concurrent last image slot accepts exactly one upload')
  // Registration holds the path lock; a waiting Storage DELETE rechecks files
  // after commit using the policy function fresh snapshot.
  const removed=(await images())[0];await a.query('select public.remove_event_image($1,$2)',[id,removed.id])
  const racingPath=await stage(40);await a.query('begin');await add(a,racingPath)
  await a2.query("set application_name='gallery-delete-race'")
  const deletion=a2.query('delete from storage.objects where name=$1',[racingPath])
  let blocked=false;for(let i=0;i<100;i++){if((await admin.query("select exists(select 1 from pg_stat_activity where application_name='gallery-delete-race' and wait_event_type='Lock') as blocked")).rows[0].blocked){blocked=true;break}await new Promise(r=>setTimeout(r,10))}
  assert.ok(blocked);await a.query('commit');assert.equal((await deletion).rowCount,0)
  assert.equal((await admin.query('select count(*) from storage.objects where name=$1',[racingPath])).rows[0].count,'1')
  check('Concurrent Storage DELETE waits for registration and cannot delete committed media')
  await a.query('select public.remove_event_image($1,$2)',[id,(await images())[0].id])
  const deletedPath=await stage(41);await a2.query('begin');await a2.query('delete from storage.objects where name=$1',[deletedPath]);
  await a.query("set application_name='gallery-add-race'");const registration=add(a,deletedPath).then(()=>null,e=>e)
  blocked=false;for(let i=0;i<100;i++){if((await admin.query("select exists(select 1 from pg_stat_activity where application_name='gallery-add-race' and wait_event_type='Lock') as blocked")).rows[0].blocked){blocked=true;break}await new Promise(r=>setTimeout(r,10))}
  assert.ok(blocked);await a2.query('commit');assert.match((await registration).message,/invalid_image/)
  assert.equal((await admin.query('select count(*) from public.files where storage_path=$1',[deletedPath])).rows[0].count,'0')
  await a.query('begin isolation level repeatable read');await assert.rejects(add(a,paths[0]),/read_committed_required/);await a.query('rollback')
  check('Deletion winning the race leaves no false image; frozen snapshots rejected')
  await a.query("select set_config('request.jwt.claim.sub','',false)");await assert.rejects(add(a,paths[0]),/authentication_required/)
  await b.query('reset role');await b.query('set role anon');await assert.rejects(add(b,paths[0]),/permission denied/)
  check('Missing identity and anonymous execution denied')
  const out='docs/design/verification/r3-block-3';await mkdir(out,{recursive:true});await writeFile(`${out}/postgres-results.json`,JSON.stringify({version,environment:'Isolated PostgreSQL; Auth/Storage SQL scaffolding, no HTTP/JWT or remote writes',results},null,2))
} finally {for(const c of clients){try{await c.end()}catch{}}if(started)await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true})}
