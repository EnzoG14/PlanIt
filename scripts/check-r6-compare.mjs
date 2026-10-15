import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the real PostgreSQL replay, role matrix and social regression harness.
const out = 'docs/qa/r6-block-8/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    await admin.query('delete from public.user_blocks');
    const compare=(client,ids)=>value(client,'select public.get_my_events_occupancy($1::uuid[])',[ids]);
    const single=(client,id)=>value(client,'select public.get_my_event_occupancy($1)',[id]);
    const fill=async(id,count,status='confirmed')=>{
      await role(admin,aId);await admin.query('reset role');
      for(let i=0;i<count;i++){const uid=randomUUID();await admin.query('insert into auth.users values($1,$2)',[uid,{display_name:'Compare fixture'}]);
        await admin.query('insert into public.event_participations(event_id,user_id,status) values($1,$2,$3)',[id,uid,status]);}
    };
    const evA=await event('public'), evB=await event('public');
    await admin.query('update public.events set capacity=10 where id=$1',[evA]);
    await admin.query('update public.events set capacity=20 where id=$1',[evB]);
    await fill(evA,4);await fill(evA,2,'cancelled');await fill(evB,15);await fill(evB,1,'removed');
    let dto=await compare(a,[evA,evB]);
    assert.deepEqual(Object.keys(dto).sort(),['as_of','events']);
    assert.deepEqual(dto.events.map(e=>[e.event_id,e.confirmed_count,e.capacity,e.available_spots,e.occupancy_percent]),[[evA,4,10,6,40],[evB,15,20,5,75]]);
    for(const e of dto.events){const s=await single(a,e.event_id);const {as_of,...rest}=s;assert.deepEqual(e,rest);}
    assert.deepEqual((await compare(a,[evB,evA])).events.map(e=>e.event_id),[evB,evA]);
    record('R6 compare: A cap10/4=40%, B cap20/15=75%, identical to the individual RPC; input order kept');
    // 2..10 accepted; 0/1/11, duplicates, NULL array/elements and multi-dimensional input rejected as 22023.
    const many=[evA,evB];for(let i=0;i<8;i++)many.push(await event('public'));
    assert.equal((await compare(a,many)).events.length,10);
    for(const bad of [null,[],[evA],[...many,await event('public')],[evA,evA],[evA,null],[evA,evB,evA]])
      await assert.rejects(compare(a,bad),e=>e.code==='22023'&&e.message==='invalid_event_selection');
    record('R6 compare: 2 and 10 events work; null/empty/1/11/duplicate/null-element selections rejected');
    // All-or-nothing ownership: foreign, hidden foreign and nonexistent share one error, nothing partial.
    const other=async v=>{const id=await event(v);await admin.query('update public.events set organizer_id=$2 where id=$1',[id,bId]);return id;};
    const foreign=await other('public'),foreignHidden=await other('unlisted');
    for(const id of [foreign,foreignHidden,randomUUID()])
      await assert.rejects(compare(a,[evA,id]),e=>e.code==='42501'&&e.message==='event_unavailable'&&!JSON.stringify(e).includes('Prueba'));
    await assert.rejects(compare(b,[evA,evB]),e=>e.code==='42501'&&e.message==='event_unavailable');
    await assert.rejects(compare(missing,[evA,evB]),e=>e.code==='42501'&&e.message==='authentication_required');
    await denied(compare(anon,[evA,evB]));
    await follow(c,aId);await assert.rejects(compare(c,[evA,evB]),e=>e.code==='42501');
    record('R6 compare IDOR: mix own/foreign/hidden/nonexistent rejects all with one error; non-owner, follower, anon and missing UID denied');
    // States and invalid legacy capacity.
    const states=await event('public'),legacy=await event('unlisted');
    await admin.query("update public.events set cancelled_at=localtimestamp where id=$1",[states]);
    let legacyOk=true;
    try{await admin.query('alter table public.events drop constraint events_capacity_valid');await admin.query('update public.events set capacity=0 where id=$1',[legacy]);}catch{legacyOk=false;}
    const archived=await event('public');
    await admin.query('update public.events set cancelled_at=localtimestamp,archived_at=localtimestamp where id=$1',[archived]);
    dto=await compare(a,[states,archived,evA]);
    assert.deepEqual(dto.events.map(e=>e.event_state),['cancelled','archived','open']);
    if(legacyOk){
      dto=await compare(a,[legacy,evA]);
      assert.equal(dto.events[0].capacity_usable,false);assert.equal(dto.events[0].occupancy_percent,null);assert.equal(dto.events[0].available_spots,0);
      assert.equal(dto.events[1].occupancy_percent,40);
      record('R6 compare: capacity0 legacy -> capacity_usable=false, percent null, no division by zero');
    } else record('R6 compare: capacity0 legacy NOT RUN (schema forbids it locally)');
    if(legacyOk){await admin.query('update public.events set capacity=10 where id=$1',[legacy]);await admin.query('alter table public.events add constraint events_capacity_valid check (capacity > 0)');}
    record('R6 compare: cancelled/archived/open states included for own events');
    const meta=(await admin.query("select prosecdef,provolatile,proconfig,has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated from pg_proc where oid='public.get_my_events_occupancy(uuid[])'::regprocedure")).rows[0];
    assert.equal(meta.prosecdef,true);assert.equal(meta.provolatile,'s');assert.deepEqual(meta.proconfig,['search_path=""']);assert.equal(meta.anon,false);assert.equal(meta.authenticated,true);
    assert.equal((await b.query('select * from public.profiles where id=$1',[aId])).rowCount,0);
    record('R6 compare ACL: DEFINER STABLE search_path empty, EXECUTE authenticated only, profiles still unreadable');
    // Set-based benchmark: one batch vs N single calls over ten events.
    const bench=[];for(const id of many)await fill(id,50);
    const t=async f=>{const s=[];for(let n=0;n<20;n++){const x=performance.now();await f();s.push(performance.now()-x);}s.sort((p,q)=>p-q);return s[18];};
    const batch=await t(()=>compare(a,many));
    const looped=await t(async()=>{for(const id of many)await single(a,id);});
    const plan=(await admin.query("explain (analyze,buffers,format json) select e.id,count(p.id) from unnest($1::uuid[]) with ordinality ids(id,ord) join public.events e on e.id=ids.id and e.organizer_id=$2 left join public.event_participations p on p.event_id=e.id and p.status='confirmed' and p.user_id<>e.organizer_id group by e.id,ids.ord",[many,aId])).rows;
    await writeFile(out+'/compare-explain.json',JSON.stringify({environment:'Local synthetic fixtures; not production SLA',events:10,p95_batch_ms:batch,p95_ten_single_calls_ms:looped,plan},null,2)+'\n');
    record('R6 compare benchmark: 10 events, one batch statement vs ten single RPCs (p95 recorded) and EXPLAIN');
  }
`
await mkdir('.r6-check.local', { recursive: true })
await mkdir(out, { recursive: true })
const path = '.r6-check.local/compare.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'9311c01',branch:'codex/r6-block-8'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', extension: 'scripts/check-r6-compare.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
