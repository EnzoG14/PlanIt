import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const out='docs/qa/r6-block-5/sql'
const source=await readFile('scripts/check-r5-social.mjs','utf8')
const marker='  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length,2)
const tests=String.raw`
  {
    await admin.query('delete from public.user_blocks');
    const exportRows=(client,id)=>value(client,'select public.get_my_event_export_rows($1)',[id]);
    const fixture=await event('public');
    assert.deepEqual((await exportRows(a,fixture)).rows,[]);
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
    await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed')",[fixture,aId]);
    assert.deepEqual((await exportRows(a,fixture)).rows,[]);
    await b.query('select public.register_for_event($1)',[fixture]);
    const first=(await exportRows(a,fixture)).rows[0].first_registered_at;
    assert.ok(first);await b.query('select public.leave_event($1)',[fixture]);
    assert.equal((await exportRows(a,fixture)).rows.length,0);
    await b.query('select public.register_for_event($1)',[fixture]);
    let dto=await exportRows(a,fixture);assert.equal(dto.rows[0].first_registered_at,first);
    assert.deepEqual(Object.keys(dto).sort(),['version','event_id','event_title','as_of','rows'].sort());
    assert.deepEqual(Object.keys(dto.rows[0]).sort(),['username','display_name','status','first_registered_at'].sort());
    assert.equal(dto.version,1);assert.equal(dto.event_id,fixture);
    await block(a,bId);dto=await exportRows(a,fixture);assert.equal(dto.rows[0].username,'');assert.equal(dto.rows[0].display_name,'Perfil no disponible');
    await unblock(a,bId);await block(b,aId);assert.equal((await exportRows(a,fixture)).rows[0].username,'');await unblock(b,aId);
    record('CSV exact allowlist, empty/confirmed only, stable first registration across rejoin, R5 symmetric block masking');
    for(const client of [b,c,d,anon,missing])for(const id of [fixture,hidden,randomUUID(),null])await denied(exportRows(client,id));
    await denied(exportRows(a,randomUUID()));await denied(exportRows(a,null));
    for(const visibility of ['public','unlisted']){
      const id=await event(visibility);assert.equal((await exportRows(a,id)).rows.length,0);
      await admin.query('update public.events set ends_at=localtimestamp-interval \'1 hour\',starts_at=localtimestamp-interval \'2 hours\' where id=$1',[id]);assert.equal((await exportRows(a,id)).rows.length,0);
      await admin.query('update public.events set cancelled_at=localtimestamp where id=$1',[id]);assert.equal((await exportRows(a,id)).rows.length,0);
      await admin.query('update public.events set archived_at=localtimestamp where id=$1',[id]);assert.equal((await exportRows(a,id)).rows.length,0);
    }
    const acl=(await admin.query("select prosecdef,provolatile,proconfig,has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated from pg_proc where oid='public.get_my_event_export_rows(uuid)'::regprocedure")).rows[0];
    assert.deepEqual(acl,{prosecdef:true,provolatile:'s',proconfig:['search_path=""'],anon:false,authenticated:true});
    assert.equal((await a.query('select * from public.profiles where id=$1',[bId])).rowCount,0);
    record('CSV direct role negatives participant/link-only/follower/foreign/anon/missing UID; owner public/hidden/ended/cancelled/archived; ACL and private profile RLS unchanged');
    // STABLE preserves one statement snapshot; REPEATABLE READ makes a concurrent
    // update deterministic in this test, without changing production isolation.
    await a.query('begin isolation level repeatable read');const snapshot=await exportRows(a,fixture);
    await b.query('select public.leave_event($1)',[fixture]);
    assert.deepEqual((await exportRows(a,fixture)).rows,snapshot.rows);await a.query('rollback');assert.equal((await exportRows(a,fixture)).rows.length,0);
    await b.query('select public.register_for_event($1)',[fixture]);
    const part=await value(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[fixture,bId]);
    await admin.query('delete from public.participation_history where participation_id=$1',[part]);assert.equal((await exportRows(a,fixture)).rows[0].first_registered_at,null);
    // Only synthetic local data: exercise the otherwise unreachable size guard
    // by replacing the event-title CHECK inside a rolled-back transaction.
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
    await admin.query('begin');
    const checks=(await admin.query("select conname,pg_get_constraintdef(oid) as def from pg_constraint where conrelid='public.events'::regclass and contype='c'")).rows;
    for(const c of checks.filter(c=>c.def.includes('title')))await admin.query('alter table public.events drop constraint "'+c.conname.replaceAll('"','""')+'"');
    await admin.query("update public.events set title=repeat('é',5242881) where id=$1",[fixture]);
    await admin.query('set local role authenticated');
    await assert.rejects(exportRows(admin,fixture),e=>e.code==='54000');await admin.query('rollback');
    record('CSV deterministic snapshot under concurrent leave, missing history null, whole-request 10MiB UTF8 rejection');
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
    const bench=await event('public');await admin.query('update public.events set capacity=6000 where id=$1',[bench]);
    const sizes=[];
    for(const size of [0,1,1001,5000,5001]){
      const additional=size-(sizes.at(-1)?.count??0),ids=Array.from({length:additional},()=>randomUUID());
      if(ids.length){await admin.query("insert into auth.users select unnest($1::uuid[]),'{\"display_name\":\"CSV benchmark\"}'::jsonb",[ids]);await admin.query("insert into public.event_participations(event_id,user_id,status) select $1,unnest($2::uuid[]),'confirmed'",[bench,ids]);}
      const samples=[];
      for(let i=0;i<5;i++){const t=performance.now();if(size>5000)await assert.rejects(exportRows(a,bench),e=>e.code==='54000');else {const v=await exportRows(a,bench);assert.equal(v.rows.length,size);assert.ok(!JSON.stringify(v).match(/user_id|participation_id|birth_date|sex|email/));}samples.push(performance.now()-t);}
      const plan=(await admin.query("explain(analyze,buffers,format json) select p.id,(select min(h.created_at) from public.participation_history h where h.participation_id=p.id and h.previous_status is null and h.new_status='confirmed') from public.event_participations p where p.event_id=$1 and p.status='confirmed' order by p.id",[bench])).rows;
      sizes.push({count:size,max_ms:Math.max(...samples),plan});
    }
    await writeFile(out+'/benchmark.json',JSON.stringify({sizes,environment:'Local PostgreSQL synthetic, 5 samples/size; not a remote SLA'},null,2)+'\n');
    record('CSV 0/1/1001/5000 complete snapshots and 5001 whole-request rejection; 5 samples per size and EXPLAIN ANALYZE BUFFERS');
  }
`
await mkdir('.r6-check.local',{recursive:true});await mkdir(out,{recursive:true})
const path='.r6-check.local/csv.mjs'
await writeFile(path,source.replace(marker,()=>tests+marker).replace("base:'da4379f',branch:'codex/r5-block-1'","base:'edaa0c5',branch:'codex/r6-block-5'"))
try{
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_SQL_OUTPUT:out}})
  console.log(stdout);await writeFile(out+'/harness.json',JSON.stringify({inherited:'scripts/check-r5-social.mjs',extension:'scripts/check-r6-csv.mjs',stdout,stderr},null,2)+'\n')
}finally{await unlink(path)}
