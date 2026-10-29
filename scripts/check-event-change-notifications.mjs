import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { generateKeyPairSync } from 'node:crypto'

// Reuse the isolated PostgreSQL lifecycle bootstrap (all migrations, real roles
// and row locks). No remote database, provider or real push delivery is used.
const source = (await readFile('scripts/check-event-lifecycle.mjs', 'utf8')).replace(/\r\n/g, '\n')
const marker = '  const id = await create(), other = await create(stranger)'
assert.equal(source.split(marker).length, 2)
const bootstrap = source.slice(0, source.indexOf(marker)).replace('lifecycle-${Date.now()}', 'event-notices-${Date.now()}')
const key = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).publicKey.export({ format: 'jwk' })
const p256dh = Buffer.concat([Buffer.from([4]), Buffer.from(key.x, 'base64url'), Buffer.from(key.y, 'base64url')]).toString('base64url')
const tests = String.raw`
  const notices = async id => (await admin.query("select * from public.notifications where event_id=$1 and type in ('event_update','event_cancelled') order by created_at,id",[id])).rows;
  const reg = (client,id) => client.query('select public.register_for_event($1)',[id]);
  const leave = (client,id) => client.query('select public.leave_event($1)',[id]);
  const edit = async (id,patch={},client=a) => {
    const e=(await admin.query('select * from public.events where id=$1',[id])).rows[0];
    const next={...e,...patch};
    return client.query('select public.update_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [id,next.title,next.description,next.starts_at,next.ends_at,next.category_id,next.capacity,next.address,next.latitude,next.longitude,next.location_name,next.visibility]);
  };
  const id=await create();await reg(b,id);await reg(c,id);
  const fields=[['title','Otro nombre','nombre'],['description','Otra descripción','descripción'],
    ['starts_at','2099-10-12 21:00','fecha y horario'],['ends_at','2099-10-13 01:00','fecha y horario'],
    ['location_name','Centro','lugar'],['address','Córdoba 123','lugar'],['latitude',-34.7,'lugar'],['longitude',-58.5,'lugar'],['location_name',null,'lugar']];
  for(const [field,next,label] of fields) {
    const before=(await notices(id)).length;await edit(id,{[field]:next});
    const added=(await notices(id)).slice(before);assert.equal(added.length,2);
    assert.deepEqual(added.map(n=>n.recipient_id).sort(),[guest,stranger].sort());
    for(const n of added){assert.equal(n.type,'event_update');assert.equal(n.title,'Evento actualizado');assert.ok(n.body.includes('Cambios: '+label+'.'));assert.equal(n.actor_id,null);assert.equal(n.conversation_id,null);}
  }
  let before=(await notices(id)).length;
  await edit(id,{title:'Cambio conjunto',description:'Texto conjunto',address:'Santa Fe 42',starts_at:'2099-10-12 22:00'});
  assert.equal((await notices(id)).length,before+2);
  assert.ok((await notices(id)).at(-1).body.includes('nombre, descripción, fecha y horario, lugar'));
  before=(await notices(id)).length;await edit(id);await edit(id,{capacity:81});
  const otherCategory=await scalar(admin,'select id from public.categories where id<>$1 and is_active limit 1',[category]);
  await edit(id,{category_id:otherCategory});await edit(id,{visibility:'unlisted'});await edit(id,{visibility:'public'});
  assert.equal((await notices(id)).length,before);
  check('Every important field, NULL place transitions and combined edit; confirmed recipients only; no-op/capacity/category/visibility do not notify');

  await leave(c,id);await edit(id,{title:'Después del retiro'});assert.equal((await notices(id)).at(-1).recipient_id,guest);
  await reg(c,id);const part=await scalar(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[id,stranger]);
  await a.query('select public.remove_participant($1,$2)',[id,part]);await c.query('select public.request_rejoin($1)',[id]);
  before=(await notices(id)).length;await action(a,id);await action(a,id);await action(a,id,'archive');
  const cancelled=(await notices(id)).slice(before);assert.equal(cancelled.length,1);assert.equal(cancelled[0].recipient_id,guest);assert.equal(cancelled[0].type,'event_cancelled');
  assert.equal(await scalar(b,'select public.get_notification_target($1)',[cancelled[0].id]),'/events/'+id);
  before=(await notices(id)).length;await reactivate(a,reactArgs(id,randomUUID()));assert.equal((await notices(id)).length,before);
  const archived=await create();await reg(b,archived);await action(a,archived,'archive');await action(a,archived,'archive');
  assert.deepEqual((await notices(archived)).map(n=>n.type),['event_cancelled']);
  const ended=await create();await reg(b,ended);await admin.query("update public.events set starts_at='2020-01-01',ends_at='2020-01-02' where id=$1",[ended]);
  before=(await notices(ended)).length;await action(a,ended,'archive');assert.equal((await notices(ended)).length,before);
  const combined=await create();await reg(b,combined);await admin.query("update public.events set title='Nuevo título',cancelled_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' where id=$1",[combined]);
  assert.deepEqual((await notices(combined)).map(n=>n.type),['event_cancelled']);
  check('Cancelled/removed/pending excluded; cancellation wins; direct/archive cancellation and retries; archive ended and reactivation add no notice');

  const atomic=await create();await reg(b,atomic);await reg(c,atomic);
  await admin.query("create function planit_private.reject_fixture_notice() returns trigger language plpgsql as $$begin if new.type in ('event_update','event_cancelled') then raise exception 'fixture_notice_failure'; end if; return new; end$$; create trigger zz_fixture_fail before insert on public.notifications for each row execute function planit_private.reject_fixture_notice()");
  await assert.rejects(edit(atomic,{title:'Debe revertir'}),/fixture_notice_failure/);
  assert.equal(await scalar(admin,'select title from public.events where id=$1',[atomic]),'After primaveral');assert.equal((await notices(atomic)).length,0);
  await assert.rejects(action(a,atomic),/fixture_notice_failure/);await assert.rejects(action(a,atomic,'archive'),/fixture_notice_failure/);
  const failedClose=(await admin.query('select cancelled_at,archived_at from public.events where id=$1',[atomic])).rows[0];
  assert.deepEqual(failedClose,{cancelled_at:null,archived_at:null});assert.equal((await notices(atomic)).length,0);
  await admin.query('drop trigger zz_fixture_fail on public.notifications;drop function planit_private.reject_fixture_notice()');
  for(const client of [b,c,anon,missing])await assert.rejects(edit(atomic,{title:'Denegado'},client),e=>e.code==='42501');
  await assert.rejects(b.query("insert into public.notifications(recipient_id,type,title) values($1,'event_update','Falso')",[stranger]),e=>e.code==='42501');
  await edit(atomic,{title:'Sólo destinatarios'});const n=(await notices(atomic)).find(n=>n.recipient_id===guest);
  assert.equal(await scalar(a,'select count(*)::int from public.notifications where id=$1',[n.id]),0);
  assert.equal(await scalar(c,'select public.get_notification_target($1)',[n.id]),null);
  assert.equal(await scalar(b,'select public.get_notification_target($1)',[n.id]),'/events/'+atomic);
  assert.equal((await b.query('select * from public.get_notification_changes($1)',[[n.id]])).rowCount,1);
  await b.query('select public.mark_notification_read($1)',[n.id]);assert.ok(await scalar(b,'select read_at from public.notifications where id=$1',[n.id]));
  for(const client of [a,b,anon])await assert.rejects(client.query('select planit_private.notify_event_change()'),e=>e.code==='42501');
  check('Atomic rollback, organizer-only mutation, recipient RLS, no forged notices, read/changes RPCs and private trigger ACL');

  // Both orders of the shared event lock determine the recipient snapshot.
  for(const operation of ['register','leave'])for(const first of ['participation','edit']) {
    const race=await create();if(operation==='leave')await reg(b,race);
    const participate=()=>operation==='register'?reg(b,race):leave(b,race);
    const holder=first==='participation'?b:a;
    await holder.query('begin');
    if(first==='participation')await participate();else await edit(race,{title:'Cambio concurrente'});
    let done=false;const pending=(first==='participation'?edit(race,{title:'Cambio concurrente'},a2):participate()).then(()=>{done=true});
    await new Promise(r=>setTimeout(r,100));assert.equal(done,false);await holder.query('commit');await pending;
    const expected=operation==='register'?(first==='participation'?1:0):(first==='edit'?1:0);
    assert.equal((await notices(race)).length,expected);
  }
  check('Registration and withdrawal races in both lock orders select committed confirmed recipients');

  const sub=randomUUID(),subOther=randomUUID();
  const setupSub=(client,s,tail)=>client.query('select public.upsert_my_push_subscription($1,$2,$3,$4)',[s,'https://fcm.googleapis.com/fcm/send/'+tail,KEY_FIXTURE,Buffer.alloc(16,42).toString('base64url')]);
  await setupSub(b,sub,'guest');await setupSub(c,subOther,'stranger');
  const worker=await connect();await worker.query('set role service_role');
  const deliver=async notification=>{
    const claims=(await worker.query('select * from public.claim_push_jobs(100)')).rows.map(r=>r.claim_push_jobs);
    const j=claims.find(j=>j.notification_id===notification&&j.subscription_id===sub);assert.ok(j);
    return scalar(worker,'select public.get_push_job_delivery($1,$2,$3)',[j.notification_id,j.subscription_id,j.lease_token]);
  };
  const push=await create();await reg(b,push);await edit(push,{title:'Aviso Push'});
  let notice=(await notices(push)).at(-1);
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.push_jobs where notification_id=$1',[notice.id]),1);
  let wire=await deliver(notice.id);assert.equal(wire.payload.title,'Evento actualizado');assert.equal(wire.payload.body,notice.body);assert.equal(wire.payload.target,'/events/'+push);
  await b.query('select public.set_my_push_previews(false)');await action(a,push);notice=(await notices(push)).at(-1);
  wire=await deliver(notice.id);assert.equal(wire.payload.title,'Nuevo aviso en PlanIt');assert.equal(wire.payload.target,'/events/'+push);assert.ok(!wire.payload.body.includes('Aviso Push'));
  await b.query('select public.set_my_push_previews(true)');
  const hidden=await create();await reg(b,hidden);await edit(hidden,{title:'Evento oculto',visibility:'unlisted'});notice=(await notices(hidden)).at(-1);
  assert.equal(await scalar(b,'select public.get_notification_target($1)',[notice.id]),'/events/'+hidden);
  wire=await deliver(notice.id);assert.equal(wire.payload.title,'Evento actualizado');assert.equal(wire.payload.target,'/events/'+hidden);
  await edit(hidden,{description:'Cambio antes de revocar'});notice=(await notices(hidden)).at(-1);
  await admin.query("update public.event_access_grants set status='revoked',revoked_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' where event_id=$1 and user_id=$2",[hidden,guest]);
  assert.equal(await scalar(b,'select public.get_notification_target($1)',[notice.id]),null);
  wire=await deliver(notice.id);assert.equal(wire.payload.title,'Nuevo aviso en PlanIt');assert.equal(wire.payload.target,'/notifications');
  const cancelledHidden=await create();await reg(b,cancelledHidden);await edit(cancelledHidden,{visibility:'unlisted'});await action(a,cancelledHidden,'archive');notice=(await notices(cancelledHidden)).at(-1);
  wire=await deliver(notice.id);assert.equal(wire.payload.title,'Evento cancelado');assert.equal(wire.payload.target,'/events/'+cancelledHidden);
  check('Push types enqueue only recipient devices; update/cancellation payloads, privacy preferences, hidden/historical access and revocation');

  const recovery=await create();await reg(b,recovery);await edit(recovery,{title:'Recuperación'});notice=(await notices(recovery)).at(-1);
  await admin.query('delete from planit_private.push_jobs where notification_id=$1',[notice.id]);
  await worker.query('select public.enqueue_missing_push_jobs(100)');
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.push_jobs where notification_id=$1',[notice.id]),1);
  await worker.query('select public.enqueue_missing_push_jobs(100)');assert.equal(await scalar(admin,'select count(*)::int from planit_private.push_jobs where notification_id=$1',[notice.id]),1);
  await action(a,recovery);const closeNotice=(await notices(recovery)).at(-1);
  await admin.query('delete from planit_private.push_jobs where notification_id=$1',[closeNotice.id]);await worker.query('select public.enqueue_missing_push_jobs(100)');
  assert.equal(await scalar(admin,'select count(*)::int from planit_private.push_jobs where notification_id=$1',[closeNotice.id]),1);
  await b.query('select public.clear_notifications()');assert.equal(await deliver(notice.id),null);
  const disabled=await create();await reg(b,disabled);await edit(disabled,{description:'Con dispositivo desactivado'});notice=(await notices(disabled)).at(-1);await b.query('select public.disable_my_push_subscription($1)',[sub]);
  assert.equal(await scalar(b,'select count(*)::int from public.notifications where id=$1',[notice.id]),1);
  assert.equal((await worker.query('select * from public.claim_push_jobs(100)')).rows.some(r=>r.claim_push_jobs.notification_id===notice.id),false);
  check('Backfill recovers without duplicates; dismissed notices and disabled subscriptions cannot deliver; inbox persists');
  await mkdir('docs/qa/event-change-notifications',{recursive:true});
  await writeFile('docs/qa/event-change-notifications/sql-results.json',JSON.stringify({version,environment:'Isolated PostgreSQL; SET ROLE; Auth/Storage scaffolds; no remote or real push transport',results},null,2)+'\n');
`;
const cleanup = source.slice(source.lastIndexOf('} finally {'))
const temp = 'scripts/.event-change-notifications-run.local.mjs'
await writeFile(temp, bootstrap + tests.replace('KEY_FIXTURE', JSON.stringify(p256dh)) + cleanup)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [temp], { windowsHide: true, timeout: 180000, maxBuffer: 4 * 1024 * 1024 })
  process.stdout.write(stdout); process.stderr.write(stderr)
} catch (error) {
  process.stdout.write(error.stdout ?? ''); process.stderr.write(error.stderr ?? ''); process.exitCode = 1
} finally { await unlink(temp) }
