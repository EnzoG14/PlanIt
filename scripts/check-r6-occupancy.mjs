import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the real PostgreSQL replay, role matrix and social regression harness.
const out = 'docs/qa/r6-block-1/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    await admin.query('delete from public.user_blocks');
    const occupancy=(client,id)=>value(client,'select public.get_my_event_occupancy($1)',[id]);
    const fixture=await event('public');
    let dto=await occupancy(a,fixture);
    assert.equal(dto.confirmed_count,0);assert.equal(dto.available_spots,10);assert.equal(dto.occupancy_percent,0);
    assert.equal(dto.event_state,'open');assert.equal(dto.capacity_usable,true);
    assert.deepEqual(Object.keys(dto).sort(),['event_id','title','event_state','as_of','capacity','confirmed_count','available_spots','occupancy_percent','capacity_usable'].sort());
    const extra=[];
    for(let i=0;i<7;i++) {const id=randomUUID();extra.push(id);await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'Occupancy fixture'}]);}
    await role(admin,aId);await admin.query('reset role');
    for(const [i,id] of extra.entries()) await admin.query('insert into public.event_participations(event_id,user_id,status) values($1,$2,$3)',[fixture,id,i<4?'confirmed':i<6?'cancelled':'removed']);
    dto=await occupancy(a,fixture);
    assert.equal(dto.confirmed_count,4);assert.equal(dto.available_spots,6);assert.equal(dto.occupancy_percent,40);
    const summary=(await a.query('select * from public.get_event_participation_summary($1)',[fixture])).rows[0];
    assert.equal(Number(summary.confirmed_count),dto.confirmed_count);assert.equal(Number(summary.available_spots),dto.available_spots);
    await admin.query("update public.event_participations set status='confirmed' where event_id=$1 and user_id=$2",[fixture,extra[4]]);
    assert.equal((await occupancy(a,fixture)).confirmed_count,5);
    await admin.query('update public.events set capacity=15 where id=$1',[fixture]);
    dto=await occupancy(a,fixture);assert.equal(dto.available_spots,10);assert.ok(Math.abs(dto.occupancy_percent-100/3)<1e-10);
    await admin.query("update public.events set starts_at=starts_at-interval '4 days',ends_at=ends_at-interval '4 days' where id=$1",[fixture]);
    assert.equal((await occupancy(a,fixture)).event_state,'ended');
    await admin.query('update public.events set cancelled_at=localtimestamp where id=$1',[fixture]);assert.equal((await occupancy(a,fixture)).event_state,'cancelled');
    await admin.query('update public.events set archived_at=localtimestamp where id=$1',[fixture]);assert.equal((await occupancy(a,fixture)).event_state,'archived');
    assert.equal((await occupancy(a,fixture)).confirmed_count,5);
    record('R6 formulas: empty,4 confirmed/2 cancelled/1 removed,return,capacity edit,unrounded fraction,ended/cancelled/archived; R1 summary parity');
    for(const client of [b,c,d,missing]) for(const id of [pub,hidden,fixture,randomUUID(),null]) {
      await assert.rejects(occupancy(client,id),e=>e.code==='42501'&&e.message===(client===missing?'authentication_required':'event_unavailable'));
    }
    await denied(occupancy(anon,pub));
    assert.equal((await occupancy(a,hidden)).event_id,hidden);
    await follow(c,aId); // approved follow grants no analytical access
    await denied(occupancy(c,hidden));await denied(occupancy(b,hidden));
    const privileges=(await admin.query("select prosecdef,provolatile,proconfig,has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated from pg_proc where oid='public.get_my_event_occupancy(uuid)'::regprocedure")).rows[0];
    assert.equal(privileges.prosecdef,true);assert.equal(privileges.provolatile,'s');assert.deepEqual(privileges.proconfig,['search_path=""']);assert.equal(privileges.anon,false);assert.equal(privileges.authenticated,true);
    assert.equal((await b.query('select * from public.profiles where id=$1',[aId])).rowCount,0);
    record('R6 ACL: owner including hidden/archive; confirmed,grant,approved follow,third party,anon and missing UID denied; foreign/nonexistent/null share error; profiles unchanged');
    const last=await event('public');await admin.query('update public.events set capacity=1 where id=$1',[last]);
    await b.query('begin');await b.query('select public.register_for_event($1)',[last]);
    const pid=await value(c,'select pg_backend_pid()');
    const pending=c.query('select public.register_for_event($1)',[last]).then(result=>({result}),error=>({error}));
    let waiting=false;
    for(let i=0;i<100;i++){waiting=await value(admin,"select wait_event_type='Lock' from pg_stat_activity where pid=$1",[pid]);if(waiting)break;await new Promise(r=>setTimeout(r,10));}
    assert.ok(waiting);await b.query('commit');assert.equal((await pending).error?.message,'event_full');
    dto=await occupancy(a,last);assert.equal(dto.confirmed_count,1);assert.equal(dto.occupancy_percent,100);assert.equal(dto.available_spots,0);
    record('R6 last-place race: real lock wait,second registration fails,event stays at100%');
    const benchmarks=[];
    for(const count of [0,1,10,100,1000]) {
      const id=await event('public');await admin.query('update public.events set capacity=1000 where id=$1',[id]);
      await admin.query("insert into auth.users select gen_random_uuid(),'{\"display_name\":\"Benchmark\"}'::jsonb from generate_series(1,$1)",[count]);
      await admin.query("insert into public.event_participations(event_id,user_id,status) select $1,id,'confirmed' from public.profiles where id<>$2 limit $3",[id,aId,count]);
      await admin.query('analyze public.event_participations');
      const plan=(await admin.query("explain (analyze,buffers,format json) select e.id,count(p.id) from public.events e left join public.event_participations p on p.event_id=e.id and p.status='confirmed' and p.user_id<>e.organizer_id where e.id=$1 and e.organizer_id=$2 group by e.id",[id,aId])).rows;
      const samples=[];for(let n=0;n<20;n++){const start=performance.now();assert.equal((await occupancy(a,id)).confirmed_count,count);samples.push(performance.now()-start);}
      samples.sort((a,b)=>a-b);benchmarks.push({count,plan,p95_ms:samples[18]});
    }
    await writeFile(out+'/occupancy-explain.json',JSON.stringify({environment:'Local synthetic fixtures; not production SLA',benchmarks},null,2)+'\n');
    record('R6 EXPLAIN ANALYZE BUFFERS and20 RPC samples at0/1/10/100/1000; existing event/status index retained');
  }
`
await mkdir('.r6-check.local', { recursive: true })
await mkdir(out, { recursive: true })
const path = '.r6-check.local/occupancy.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'1ee60e3',branch:'codex/r6-block-1'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', extension: 'scripts/check-r6-occupancy.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
