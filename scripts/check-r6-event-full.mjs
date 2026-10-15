import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend the established real PostgreSQL replay/role/race harness. No remote SQL.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r6-block-6/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    await admin.query('delete from public.user_blocks');
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
    const reg=(client,id)=>client.query('select public.register_for_event($1)',[id]);
    const leave=(client,id)=>client.query('select public.leave_event($1)',[id]);
    const notices=(client,id)=>client.query("select * from public.notifications where event_id=$1 and type='event_full' order by created_at,id",[id]);
    const count=async id=>(await notices(admin,id)).rowCount;
    const part=async(id,uid=bId)=>(await admin.query('select * from public.event_participations where event_id=$1 and user_id=$2',[id,uid])).rows[0];
    const history=async p=>(await admin.query('select * from public.participation_history where participation_id=$1 order by created_at,id',[p.id])).rows;
    const fixture=async(capacity=2,visibility='public')=>{
      const id=await event(visibility);
      await admin.query('update public.events set capacity=$2 where id=$1',[id,capacity]);
      return id;
    };
    const remove=async id=>a.query('select public.remove_participant($1,$2)',[id,(await part(id)).id]);
    const request=id=>value(b,'select public.request_rejoin($1)',[id]);
    const resolveRequest=(id,req,decision='approved')=>a.query('select public.resolve_rejoin($1,$2,$3)',[id,req,decision]);
    const id=await fixture();
    await reg(b,id);assert.equal(await count(id),0);
    await reg(c,id);assert.equal(await count(id),1);
    const notice=(await notices(a,id)).rows[0];
    assert.equal(notice.recipient_id,aId);assert.equal(notice.event_id,id);
    assert.equal(notice.title,'Cupo completo');assert.equal(notice.body,'Tu evento alcanzó su cupo máximo de inscripciones confirmadas.');
    assert.equal(notice.actor_id,null);assert.equal(notice.conversation_id,null);assert.equal(notice.read_at,null);
    const beforeHistory=await history(await part(id));
    await reg(b,id);await reg(c,id); // response loss: repeat committed call
    assert.equal(await count(id),1);assert.deepEqual(await history(await part(id)),beforeHistory);
    await assert.rejects(reg(d,id),/event_full/);assert.equal(await part(id,dId),undefined);assert.equal(await count(id),1);
    record('B6 CA01/03: capacity2 first no notice, last seat exactly one generic owner notice; confirmed retries/lost response and full rejection unchanged');

    for(const client of [b,c,d,missing]){
      assert.equal((await notices(client,id)).rowCount,0);
      assert.equal((await client.query('update public.notifications set read_at=localtimestamp where id=$1',[notice.id])).rowCount,0);
    }
    await denied(notices(anon,id));
    for(const client of [a,b,c,d,anon,missing]){
      await denied(client.query("insert into public.notifications(recipient_id,event_id,type,title) values($1,$2,'event_full','Forged')",[aId,id]));
      await denied(client.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed')",[id,dId]));
      await denied(client.query("update public.event_participations set status='confirmed' where event_id=$1",[id]));
      await denied(client.query('select planit_private.notify_event_full()'));
      await denied(client.query("update public.notifications set recipient_id=$1 where id=$2",[bId,notice.id]));
    }
    assert.equal((await a.query('update public.notifications set read_at=localtimestamp where id=$1',[notice.id])).rowCount,1);
    record('B6 CA04 direct SQL roles: recipient-only SELECT/read update; participant/foreign/missing UID/anon denied; no client notice insertion, participation DML, recipient reassignment or producer execution');

    await leave(b,id);assert.equal(await count(id),1);
    await reg(b,id);assert.equal(await count(id),2);
    await remove(id);const req=await request(id);assert.equal(await count(id),2);
    await resolveRequest(id,req);assert.equal(await count(id),3);
    await assert.rejects(resolveRequest(id,req),/rejoin_already_resolved/);assert.equal(await count(id),3);
    await remove(id);const rejected=await request(id);await resolveRequest(id,rejected,'rejected');
    assert.equal(await count(id),3);await assert.rejects(reg(b,id),/rejoin_requires_approval/);
    record('B6 D07: full/free/full via voluntary leave and approved removed rejoin each emit a new notice; pending/rejected/repeated resolution do not');

    const edit=async(id,capacity)=>{
      const e=(await admin.query('select * from public.events where id=$1',[id])).rows[0];
      return a.query('select public.update_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [id,e.title,e.description,e.starts_at,e.ends_at,e.category_id,capacity,e.address,e.latitude,e.longitude,e.location_name,null]);
    };
    const editing=await fixture(3);await reg(b,editing);await reg(c,editing);
    await edit(editing,2);assert.equal(await count(editing),0);
    await reg(b,editing);assert.equal(await count(editing),0);
    await assert.rejects(edit(editing,1),/capacity_below_confirmed/);
    await edit(editing,3);await reg(d,editing);assert.equal(await count(editing),1);
    // Historical full fixture predates trigger activation; replay activation must not backfill.
    await admin.query('begin');
    await admin.query('alter table public.event_participations disable trigger participations_notify_event_full');
    const initial=await fixture(1);
    await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed')",[initial,bId]);
    await admin.query('alter table public.event_participations enable trigger participations_notify_event_full');
    await admin.query('commit');
    assert.equal(await count(initial),0);await reg(b,initial);assert.equal(await count(initial),0);
    await leave(b,initial);await reg(b,initial);assert.equal(await count(initial),1);
    for(const state of ['cancelled','archived','ended']){
      const closed=await fixture(1);
      if(state==='ended')await admin.query("update public.events set starts_at=localtimestamp-interval '2 days',ends_at=localtimestamp-interval '1 day' where id=$1",[closed]);
      else await admin.query('update public.events set cancelled_at=localtimestamp'+(state==='archived'?',archived_at=localtimestamp':'')+' where id=$1',[closed]);
      await assert.rejects(reg(b,closed),/event_cancelled|event_ended/);assert.equal(await count(closed),0);
      // Trusted local fixture bypasses RPC: defensive closed-event check.
      await admin.query("insert into public.event_participations(event_id,user_id,status) values($1,$2,'confirmed')",[closed,bId]);
      assert.equal(await count(closed),0);
    }
    const own=await fixture(1);await assert.rejects(reg(a,own),/organizer_cannot_register/);assert.equal(await count(own),0);
    record('B6 capacity edits emit none, reductions below occupancy rejected, expansion then new last seat emits; initially full has no backfill; closed events and organizer emit none');

    const hiddenFull=await fixture(1,'unlisted');await denied(reg(b,hiddenFull));
    const token=await value(a,'select public.create_or_rotate_event_link($1)',[hiddenFull]);
    await b.query('select public.redeem_event_link($1)',[token]);await reg(b,hiddenFull);
    assert.equal(await count(hiddenFull),1);assert.equal((await notices(d,hiddenFull)).rowCount,0);
    record('B6 hidden event requires existing authorized grant; last seat owner notice remains private');

    const roll=await fixture(1);
    await b.query('begin');await reg(b,roll);assert.equal(await count(roll),0);
    assert.equal((await notices(b,roll)).rowCount,0);await b.query('rollback');
    assert.equal(await part(roll),undefined);assert.equal(await count(roll),0);
    const installFailure=()=>admin.query("create function planit_private.fail_full_fixture() returns trigger language plpgsql set search_path='' as $$ begin if new.type='event_full' then raise exception 'fixture_full_failure'; end if; return new; end $$; create trigger fail_full_fixture before insert on public.notifications for each row execute function planit_private.fail_full_fixture()");
    const clearFailure=()=>admin.query('drop trigger fail_full_fixture on public.notifications; drop function planit_private.fail_full_fixture()');
    await installFailure();await assert.rejects(reg(b,roll),/fixture_full_failure/);
    assert.equal(await part(roll),undefined);assert.equal(await count(roll),0);
    await clearFailure();await reg(b,roll);await leave(b,roll);
    const cancelledPart=await part(roll),cancelledHistory=await history(cancelledPart);
    await installFailure();await assert.rejects(reg(b,roll),/fixture_full_failure/);
    assert.deepEqual(await part(roll),cancelledPart);assert.deepEqual(await history(cancelledPart),cancelledHistory);assert.equal(await count(roll),1);
    await clearFailure();await reg(b,roll);await remove(roll);const pending=await request(roll);
    const removedPart=await part(roll),removedHistory=await history(removedPart);
    await installFailure();await assert.rejects(resolveRequest(roll,pending),/fixture_full_failure/);
    assert.deepEqual(await part(roll),removedPart);assert.deepEqual(await history(removedPart),removedHistory);
    assert.equal(await value(admin,'select status from public.event_rejoin_requests where id=$1',[pending]),'pending');assert.equal(await count(roll),2);
    await clearFailure();await resolveRequest(roll,pending);assert.equal(await count(roll),3);
    record('B6 atomicity: uncommitted notice invisible; explicit rollback and injected notice insert failure revert new registration, cancelled reactivation, history and rejoin resolution; retry succeeds');

    // Observe actual database waits, without timing-based assumptions about winners.
    async function lastSeatRace(label,winner,winnerSql,winnerArgs,loser,loserSql,loserArgs,expectedError=null,rollback=false){
      await winner.query('begin');await winner.query(winnerSql,winnerArgs);
      const pid=await value(loser,'select pg_backend_pid()');
      const pending=loser.query(loserSql,loserArgs).then(result=>({result}),error=>({error}));
      let waiting=false;
      for(let i=0;i<100;i++){
        waiting=await value(admin,"select coalesce((select wait_event_type='Lock' from pg_stat_activity where pid=$1),false)",[pid]);
        if(waiting)break;await new Promise(r=>setTimeout(r,10));
      }
      assert.ok(waiting,label+': required actual lock wait');await winner.query(rollback?'rollback':'commit');
      const outcome=await pending;
      if(expectedError)assert.match(outcome.error?.message??'',expectedError);else if(outcome.error)throw outcome.error;
      record('B6 race: '+label+'; observed PostgreSQL lock wait');
    }
    const same=await fixture(1);
    await lastSeatRace('same actor concurrent registration',b,'select public.register_for_event($1)',[same],b2,'select public.register_for_event($1)',[same]);
    assert.equal(await count(same),1);assert.equal((await history(await part(same))).length,1);
    for(const reverse of [false,true]){
      const contested=await fixture(1);
      await lastSeatRace('two actors last seat '+reverse,reverse?c:b,'select public.register_for_event($1)',[contested],reverse?b:c,'select public.register_for_event($1)',[contested],/event_full/);
      assert.equal(await count(contested),1);
      assert.equal(await value(admin,"select count(*)::int from public.event_participations where event_id=$1 and status='confirmed'",[contested]),1);
    }
    const rolledRace=await fixture(1);
    await lastSeatRace('first contender rolls back; waiting contender fills',b,'select public.register_for_event($1)',[rolledRace],c,'select public.register_for_event($1)',[rolledRace],null,true);
    assert.equal(await part(rolledRace),undefined);assert.equal(await count(rolledRace),1);
    const freed=await fixture(1);await reg(b,freed);
    await lastSeatRace('leave then waiting registration',b,'select public.leave_event($1)',[freed],c,'select public.register_for_event($1)',[freed]);assert.equal(await count(freed),2);
    const removed=await fixture(1);await reg(b,removed);
    await lastSeatRace('removal then waiting registration',a,'select public.remove_participant($1,$2)',[removed,(await part(removed)).id],c,'select public.register_for_event($1)',[removed]);assert.equal(await count(removed),2);
    const rejoinRace=await fixture(1);await reg(b,rejoinRace);await remove(rejoinRace);const rq=await request(rejoinRace);
    await lastSeatRace('approved rejoin vs last-seat registration',a,'select public.resolve_rejoin($1,$2,$3)',[rejoinRace,rq,'approved'],c,'select public.register_for_event($1)',[rejoinRace],/event_full/);assert.equal(await count(rejoinRace),2);
    const editRace=await fixture(2);await reg(b,editRace);
    const e=(await admin.query('select * from public.events where id=$1',[editRace])).rows[0];
    await lastSeatRace('capacity reduction vs waiting registration',a,'select public.update_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[editRace,e.title,e.description,e.starts_at,e.ends_at,e.category_id,1,e.address,e.latitude,e.longitude,e.location_name,null],c,'select public.register_for_event($1)',[editRace],/event_full/);assert.equal(await count(editRace),0);
    for(const isolation of ['repeatable read','serializable']){
      await b.query('begin isolation level '+isolation);await assert.rejects(reg(b,same),e=>e.code==='40001');await b.query('rollback');
    }
    record('B6 frozen snapshots rejected without duplicate notices');

    const acl=(await admin.query("select prosecdef,proconfig,has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated from pg_proc where oid='planit_private.notify_event_full()'::regprocedure")).rows[0];
    assert.deepEqual(acl,{prosecdef:false,proconfig:['search_path=""'],anon:false,authenticated:false});
    const triggers=(await admin.query("select tgname,pg_get_triggerdef(oid) as definition from pg_trigger where tgrelid='public.event_participations'::regclass and not tgisinternal order by tgname")).rows;
    assert.ok(triggers.some(t=>t.tgname==='participations_record_history'));assert.ok(triggers.some(t=>t.tgname==='participations_notify_event_full'));
    assert.equal(await value(admin,"select relrowsecurity from pg_class where oid='public.notifications'::regclass"),true);
    const policies=(await admin.query("select policyname,cmd,roles,qual,with_check from pg_policies where tablename='notifications' order by policyname")).rows;
    await writeFile(out+'/catalog.json',JSON.stringify({acl,triggers,policies},null,2)+'\n');
    const bench=await fixture(1100),sizes=[];
    for(const size of [0,1,10,100,1000]){
      const ids=Array.from({length:size-(sizes.at(-1)?.count??0)},()=>randomUUID());
      if(ids.length){await admin.query("insert into auth.users select unnest($1::uuid[]),'{\"display_name\":\"B6 synthetic\"}'::jsonb",[ids]);await admin.query("insert into public.event_participations(event_id,user_id,status) select $1,unnest($2::uuid[]),'confirmed'",[bench,ids]);}
      const sql="select count(*) from public.event_participations where event_id=$1 and status='confirmed' and user_id<>$2",samples=[];
      for(let i=0;i<20;i++){const t=performance.now();assert.equal(Number(await value(admin,sql,[bench,aId])),size);samples.push(performance.now()-t);}
      const plan=(await admin.query('explain(analyze,buffers,format json) '+sql,[bench,aId])).rows;
      sizes.push({count:size,samples_ms:samples,max_ms:Math.max(...samples),plan});
    }
    assert.equal(await count(bench),0);
    await writeFile(out+'/benchmark.json',JSON.stringify({environment:'Local synthetic PostgreSQL, 20 samples/size, not a production SLA',sizes},null,2)+'\n');
    record('B6 catalog: invoker/private/no client EXECUTE, existing history/RLS preserved; derived count benchmark and EXPLAIN 0/1/10/100/1000');
  }
`
await mkdir('.r6-check.local', { recursive: true })
await mkdir(out, { recursive: true })
const path = '.r6-check.local/event-full.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'9ba2f687cfad0ad0997d8d5a9c7f8eca83659dc1',branch:'codex/r6-block-6'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], {
    windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PLANIT_SQL_OUTPUT: out },
  })
  console.log(stdout)
  await writeFile(out + '/harness.json', JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', source_sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r6-event-full.mjs', stdout, stderr }, null, 2) + '\n')
} finally { await unlink(path) }
