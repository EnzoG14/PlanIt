import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const out='docs/qa/r6-block-4/sql'
const source=await readFile('scripts/check-r5-social.mjs','utf8')
const marker='  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length,2)
const tests=String.raw`
  {
    await admin.query('delete from public.user_blocks');
    const series=(client,id,from='2026-10-12',to='2026-10-19',bucket='day')=>value(client,'select public.get_my_event_participation_series($1,$2,$3,$4)',[id,from,to,bucket]);
    const fixture=await event('public');
    const empty=await series(a,fixture);assert.equal(empty.points.length,7);assert.ok(empty.points.every(p=>p.new_confirmations+p.reconfirmations+p.departures===0));
    await b.query('select public.register_for_event($1)',[fixture]);
    await b.query('select public.register_for_event($1)',[fixture]);
    await b.query('select public.leave_event($1)',[fixture]);
    await b.query('select public.leave_event($1)',[fixture]);
    await b.query('select public.register_for_event($1)',[fixture]);
    const participation=await value(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[fixture,bId]);
    await a.query('select public.remove_participant($1,$2)',[fixture,participation]);
    await a.query('select public.remove_participant($1,$2)',[fixture,participation]);
    await b.query('select public.request_rejoin($1)',[fixture]);
    const request=await value(admin,'select id from public.event_rejoin_requests where participation_id=(select id from public.event_participations where event_id=$1 and user_id=$2)',[fixture,bId]);
    await a.query("select public.resolve_rejoin($1,$2,'approved')",[fixture,request]);
    const history=(await admin.query('select h.* from public.participation_history h join public.event_participations p on p.id=h.participation_id where p.event_id=$1 order by h.created_at',[fixture])).rows;
    assert.equal(history.length,5);
    assert.deepEqual(history.map(h=>[h.previous_status,h.new_status,h.reason]),[[null,'confirmed','registration'],['confirmed','cancelled','voluntary_leave'],['cancelled','confirmed','registration'],['confirmed','removed','organizer_removal'],['removed','confirmed','rejoin_approval']]);
    const dates=['2026-10-12T00:00:00','2026-10-13T23:59:59.999999','2026-10-15T12:00:00','2026-10-16T12:00:00','2026-10-19T00:00:00'];
    for(let i=0;i<history.length;i++)await admin.query('update public.participation_history set created_at=$1 where id=$2',[dates[i],history[i].id]);
    const dto=await series(a,fixture);
    assert.deepEqual(dto.points.map(p=>[p.new_confirmations,p.reconfirmations,p.departures]),[[1,0,0],[0,0,1],[0,0,0],[0,1,0],[0,0,1],[0,0,0],[0,0,0]]);
    assert.equal((await series(a,fixture,'2026-10-19','2026-10-20')).points[0].reconfirmations,1);
    assert.ok((await series(a,fixture,'2026-11-01','2026-11-08')).points.every(p=>p.new_confirmations+p.reconfirmations+p.departures===0));
    assert.deepEqual((await series(a,fixture,'2026-10-14','2026-10-20','week')).points.map(p=>[p.new_confirmations,p.reconfirmations,p.departures]),[[0,1,1],[0,1,0]]);
    record('R6 temporal fixture: real registration/noop/leave/return/removal/approved rejoin; Monday/Tuesday/Thursday and half-open midnight boundaries; disjoint periods and partial weeks');
    for(const [from,to,n] of [['2024-02-28','2024-03-01',2],['2025-12-31','2026-01-02',2],['2024-01-01','2025-01-01',366]])assert.equal((await series(a,fixture,from,to)).points.length,n);
    assert.equal((await series(a,fixture,'2023-01-01','2024-01-02','week')).points.length,54);
    for(const [from,to,bucket] of [[null,'2026-01-02','day'],['2026-01-01',null,'day'],['infinity','infinity','day'],['-infinity','2026-01-01','day'],['2026-01-02','2026-01-01','day'],['2026-01-01','2026-01-01','day'],['2024-01-01','2025-01-02','day'],['2026-01-01','2026-01-02','hour'],['2026-01-01','2026-01-02',null]])await invalid(series(a,fixture,from,to,bucket));
    for(const client of [b,c,d,missing,anon])for(const id of [fixture,hidden,randomUUID(),null])await denied(series(client,id));
    assert.equal((await series(a,hidden)).points.length,7);
    await admin.query('update public.events set cancelled_at=localtimestamp,archived_at=localtimestamp where id=$1',[fixture]);assert.equal((await series(a,fixture)).points[0].new_confirmations,1);
    assert.equal((await a.query('select h.* from public.participation_history h join public.event_participations p on p.id=h.participation_id where p.event_id=$1',[fixture])).rowCount,0);
    const acl=(await admin.query("select prosecdef,provolatile,proconfig,has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated from pg_proc where oid='public.get_my_event_participation_series(uuid,timestamp,timestamp,text)'::regprocedure")).rows[0];
    assert.deepEqual(acl,{prosecdef:true,provolatile:'s',proconfig:['search_path=""'],anon:false,authenticated:true});
    assert.deepEqual(Object.keys(dto).sort(),['event_id','from','to','bucket','as_of','points'].sort());assert.ok(!JSON.stringify(dto).match(/user_id|participation_id|email|birth_date|reason/));
    record('R6 leap/month/year/max366/54 partial weeks, invalid parameters, owner hidden/archive, direct RLS, participant/link-only/follower/foreign/anon/missing-UID and ACL');
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
    const bench=await event('public');await admin.query('update public.events set capacity=1000 where id=$1',[bench]);
    const sizes=[];
    for(const size of [0,1,10,100,1000]){
      const additional=size-(sizes.at(-1)?.count??0),ids=Array.from({length:additional},()=>randomUUID());
      if(ids.length){await admin.query("insert into auth.users select unnest($1::uuid[]),'{\"display_name\":\"Series benchmark\"}'::jsonb",[ids]);await admin.query("insert into public.event_participations(event_id,user_id,status) select $1,unnest($2::uuid[]),'confirmed'",[bench,ids]);}
      const samples=[];for(let i=0;i<20;i++){const t=performance.now();const v=await series(a,bench,'2026-01-01','2027-01-01');assert.equal(v.points.length,365);samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);
      const plan=(await admin.query("explain(analyze,buffers,format json) select date_trunc('day',h.created_at),count(*) from public.event_participations p join public.participation_history h on h.participation_id=p.id where p.event_id=$1 and h.created_at>='2026-01-01' and h.created_at<'2027-01-01' group by 1",[bench])).rows;
      sizes.push({count:size,p95_ms:samples[18],plan});
    }
    await writeFile(out+'/benchmark.json',JSON.stringify({sizes,environment:'Local PostgreSQL synthetic; not remote SLA; existing history index, no new indexes'},null,2)+'\n');
    record('R6 0/1/10/100/1000 history rows,20 samples each, EXPLAIN ANALYZE BUFFERS; no index added without evidence');
  }
`
await mkdir('.r6-check.local',{recursive:true});await mkdir(out,{recursive:true})
const path='.r6-check.local/periods.mjs'
await writeFile(path,source.replace(marker,()=>tests+marker).replace("base:'da4379f',branch:'codex/r5-block-1'","base:'25685f0',branch:'codex/r6-block-4'"))
try{
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_SQL_OUTPUT:out}})
  console.log(stdout);await writeFile(out+'/harness.json',JSON.stringify({inherited:'scripts/check-r5-social.mjs',extension:'scripts/check-r6-periods.mjs',stdout,stderr},null,2)+'\n')
}finally{await unlink(path)}
