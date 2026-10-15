import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the real PostgreSQL replay, role matrix and social regression harness.
const out = 'docs/qa/r6-block-3/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    await admin.query('delete from public.user_blocks');
    const demo=(client,id)=>value(client,'select public.get_my_event_demographics($1)',[id]);
    const fixture=await event('public');
    const ids=[];
    for(let i=0;i<10;i++){const id=randomUUID();ids.push(id);await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'Demographic fixture'}]);}
    let dto=await demo(a,fixture);
    assert.equal(dto.age.state,'empty');assert.deepEqual(dto.age.groups,[]);assert.equal(dto.sex.state,'empty');
    await role(admin,aId);await admin.query('reset role');
    for(const n of [1,4,5,10]){
      for(let i=0;i<n;i++)await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed') on conflict(event_id,user_id) do nothing",[fixture,ids[i]]);
      dto=await demo(a,fixture);
      for(const dim of ['age','sex']){
        assert.equal(dto[dim].state,n<5?'suppressed':'available');
        if(n<5)assert.deepEqual(dto[dim].groups,[]);else assert.equal(dto[dim].groups.at(-1).count,n);
      }
    }
    assert.deepEqual(Object.keys(dto).sort(),['event_id','as_of','age_as_of','age','sex'].sort());
    assert.equal(dto.age_as_of,dto.as_of.slice(0,10));
    await admin.query("update public.profiles set birth_date=(statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date-interval '25 years',sex='female' where id=any($1::uuid[])",[ids]);
    dto=await demo(a,fixture);assert.equal(dto.age.groups.find(g=>g.key==='25_34').count,10);assert.equal(dto.sex.groups[0].count,10);
    await admin.query("update public.profiles set sex='male' where id=$1",[ids[0]]);
    dto=await demo(a,fixture);assert.equal(dto.sex.state,'suppressed');assert.deepEqual(dto.sex.groups,[]);assert.equal(dto.age.state,'available');
    // Complement 9/1 must not leak either count, including known total=10.
    for(let i=0;i<5;i++)await admin.query("update public.profiles set sex='other',birth_date=null where id=$1",[ids[i]]);
    dto=await demo(a,fixture);assert.deepEqual(dto.sex.groups.map(g=>g.count),[5,0,5,0]);assert.equal(dto.age.groups.at(-1).count,5);
    assert.ok(!JSON.stringify(dto).match(/birth_date|user_id|participation_id|email/));
    await admin.query("update public.event_participations set status='cancelled' where event_id=$1 and user_id=$2",[fixture,ids[0]]);
    assert.equal((await demo(a,fixture)).sex.state,'suppressed');
    await admin.query("update public.event_participations set status='removed' where event_id=$1 and user_id=$2",[fixture,ids[1]]);
    assert.equal((await demo(a,fixture)).sex.state,'suppressed');
    await admin.query("update public.event_participations set status='confirmed' where event_id=$1",[fixture]);
    assert.equal((await demo(a,fixture)).sex.state,'available');
    const repeated=await demo(a,fixture);assert.deepEqual(repeated.sex,dto.sex);
    const overlap=await event('public');await admin.query('update public.events set capacity=20 where id=$1',[overlap]);
    await admin.query("insert into public.event_participations(event_id,user_id,status) select $1,unnest($2::uuid[]),'confirmed'",[overlap,ids]);
    const before=(await demo(a,overlap)).sex;
    const newcomer=randomUUID();await admin.query('insert into auth.users values($1,$2)',[newcomer,{display_name:'Residual risk fixture'}]);
    await admin.query("update public.profiles set sex='female' where id=$1",[newcomer]);
    await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed')",[overlap,newcomer]);
    const after=(await demo(a,overlap)).sex;
    assert.equal(before.state,'available');assert.equal(after.state,'available');
    assert.equal(after.groups[0].count-before.groups[0].count,1);
    assert.equal(after.groups[0].count-(await demo(a,fixture)).sex.groups[0].count,1);
    record('D04 accepted residual explicitly reproduced: exact5/5→6/5 reveals new category over time and overlapping events; NOT an anonymity guarantee');
    record('R6 demographics: 0/1/4/5/10, NULL/other/female/male, complementary9/1, unknown, departure/return, birthday today, fixed shape without microdata');
    // Every age boundary is evaluated through the real RPC, not a JS age approximation.
    for(const [years,key] of [[17,'under_18'],[18,'18_24'],[24,'18_24'],[25,'25_34'],[34,'25_34'],[35,'35_44'],[44,'35_44'],[45,'45_54'],[54,'45_54'],[55,'55_plus']]){
      await admin.query("update public.profiles set birth_date=((statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date-make_interval(years=>$2))::date where id=any($1::uuid[])",[ids,years]);
      const actual=(await demo(a,fixture)).age.groups;
      assert.equal(actual.find(g=>g.key===key).count,10);assert.equal(actual.reduce((n,g)=>n+g.count,0),10);
    }
    await admin.query("update public.profiles set birth_date=((statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date-interval '18 years'+interval '1 day')::date where id=any($1::uuid[])",[ids]);
    assert.equal((await demo(a,fixture)).age.groups[0].count,10);
    assert.equal(await value(admin,"select extract(year from age(date '2025-02-28',date '2000-02-29'))::int"),24);
    assert.equal(await value(admin,"select extract(year from age(date '2025-03-01',date '2000-02-29'))::int"),25);
    assert.equal(await value(admin,"select extract(year from age(date '2024-02-29',date '2000-02-29'))::int"),24);
    record('Age boundaries and PostgreSQL Feb29/non-leap birthday convention');
    for(const client of [b,c,d,missing])for(const id of [fixture,hidden,pub,randomUUID(),null])await denied(demo(client,id));
    await denied(demo(anon,fixture));assert.equal((await demo(a,hidden)).age.state,'empty');
    await admin.query('update public.events set cancelled_at=localtimestamp,archived_at=localtimestamp where id=$1',[fixture]);assert.equal((await demo(a,fixture)).sex.state,'available');
    const acl=(await admin.query("select prosecdef,provolatile,proconfig,has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated from pg_proc where oid='public.get_my_event_demographics(uuid)'::regprocedure")).rows[0];
    assert.equal(acl.prosecdef,true);assert.equal(acl.provolatile,'s');assert.deepEqual(acl.proconfig,['search_path=""']);assert.equal(acl.anon,false);assert.equal(acl.authenticated,true);
    assert.equal((await b.query('select * from public.profiles where id=$1',[ids[0]])).rowCount,0);
    record('R6 demographics owner hidden/archive, foreign/participant/anon/missing-UID denial, ACL and private profile RLS');
    const bench=await event('public');await admin.query('update public.events set capacity=1000 where id=$1',[bench]);
    const more=[];for(let i=0;i<1000;i++)more.push(randomUUID());
    await admin.query("insert into auth.users select unnest($1::uuid[]),'{\"display_name\":\"Benchmark\"}'::jsonb",[more]);
    await admin.query("insert into public.event_participations(event_id,user_id,status) select $1,unnest($2::uuid[]),'confirmed'",[bench,more]);
    const samples=[];for(let i=0;i<20;i++){const t=performance.now();assert.equal((await demo(a,bench)).age.groups.at(-1).count,1000);samples.push(performance.now()-t);}
    samples.sort((a,b)=>a-b);
    const plan=(await admin.query('explain(analyze,buffers,format json) select public.get_my_event_demographics($1)',[bench])).rows;
    const source_plan=(await admin.query("explain(analyze,buffers,format json) select p.sex,count(*),extract(year from age(current_date,p.birth_date)) from public.event_participations ep join public.profiles p on p.id=ep.user_id where ep.event_id=$1 and ep.status='confirmed' and ep.user_id<>$2 group by p.sex,p.birth_date",[bench,aId])).rows;
    await writeFile(out+'/demographics-benchmark.json',JSON.stringify({count:1000,p95_ms:samples[18],plan,source_plan,environment:'Local synthetic; not remote SLA'},null,2)+'\n');
    record('R6 demographics1000 cohort,20 samples, EXPLAIN ANALYZE BUFFERS');
  }
`
await mkdir('.r6-check.local', { recursive: true })
await mkdir(out, { recursive: true })
const path = '.r6-check.local/demographics.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'e6a25a1',branch:'codex/r6-block-3'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', extension: 'scripts/check-r6-demographics.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
