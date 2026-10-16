import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the established real-PostgreSQL/Auth/Storage bootstrap, not its tests.
const source = (await readFile('scripts/check-r5-social.mjs', 'utf8')).replace(/\r\n/g, '\n')
const marker = "  assert.equal((await a.query('select * from public.profiles')).rowCount, 1)"
assert.equal(source.split(marker).length, 2)
let bootstrap = source.slice(0, source.indexOf(marker))
  .replace("const directory = resolve(`.r5-postgres-${Date.now()}.local`)", "const directory = resolve(`.r7-push-pg-${Date.now()}.local`)")
  .replace("'docs/qa/r5-block-1'", "'docs/qa/r7-block-10/sql'")
  .replace('const files = (await readdir', () => `await admin.query(\`alter table storage.objects add unique(bucket_id,name);
    create function storage.allow_only_operation(text) returns boolean language sql stable as $$
    select coalesce(current_setting('test.storage_operation',true)=$1,false) $$;\`);
  const files = (await readdir`)
const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const key = publicKey.export({ format: 'jwk' })
const p256dh = Buffer.concat([Buffer.from([4]), Buffer.from(key.x, 'base64url'), Buffer.from(key.y, 'base64url')]).toString('base64url')
const tests = String.raw`
  const p256dh = KEY_FIXTURE;
  const sub1=randomUUID(),sub2=randomUUID(),sub3=randomUUID();
  const setupSub = (client,id,tail) => value(client,'select public.upsert_my_push_subscription($1,$2,$3,$4)',
    [id,'https://fcm.googleapis.com/fcm/send/'+tail,p256dh,Buffer.alloc(16,42).toString('base64url')]);
  await setupSub(b,sub1,'b-one'); await setupSub(b,sub2,'b-two'); await setupSub(c,sub3,'c-one');
  const worker1=await connect(),worker2=await connect();
  await worker1.query('set role service_role'); await worker2.query('set role service_role');
  const call = (client,name,params=[]) => value(client,'select public.'+name+'('+params.map((_,i)=>'$'+(i+1)).join(',')+')',params);
  const claims = async (client=worker1,n=100) => (await client.query('select * from public.claim_push_jobs($1)',[n])).rows.map(r=>r.claim_push_jobs);
  const tuple = j => [j.notification_id,j.subscription_id,j.lease_token];
  const delivery = j => call(worker1,'get_push_job_delivery',tuple(j));
  const fail = (j,code) => call(worker1,'fail_push_job',[...tuple(j),code]);
  const ack = j => call(worker1,'complete_push_job',tuple(j));
  const state = async j => (await admin.query('select * from planit_private.push_jobs where notification_id=$1 and subscription_id=$2',tuple(j).slice(0,2))).rows[0];
  const noticeCount = async () => Number(await value(admin,'select count(*) from public.notifications'));
  for (const client of [anon,a,missing]) {
    await denied(client.query('select * from planit_private.push_jobs'));
    await denied(call(client,'enqueue_missing_push_jobs',[100]));
    await denied(call(client,'claim_push_jobs',[1]));
    await denied(call(client,'get_push_job_delivery',[randomUUID(),sub1,randomUUID()]));
    await denied(call(client,'complete_push_job',[randomUUID(),sub1,randomUUID()]));
    await denied(call(client,'fail_push_job',[randomUUID(),sub1,randomUUID(),'gone']));
  }
  await denied(worker1.query('select * from planit_private.push_jobs'));
  assert.equal(await value(admin,"select relrowsecurity from pg_class where oid='planit_private.push_jobs'::regclass"),true);
  await invalid(call(worker1,'claim_push_jobs',[101])); await invalid(call(worker1,'claim_push_jobs',[null]));
  record('ACL: anon, authenticated and missing identity cannot access queue or any worker RPC; service only has RPC access; RLS on');

  const conversation=await dm(a,bId),messageId=randomUUID();
  const before=await noticeCount();
  await send(a,conversation,messageId,'Mensaje privado exclusivo de fixture');
  await send(a,conversation,messageId,'Mensaje privado exclusivo de fixture');
  assert.equal(await noticeCount(),before+1);
  assert.equal(Number(await value(admin,'select count(*) from planit_private.push_jobs where notification_id=$1',[messageId])),2);
  assert.equal(await call(worker1,'enqueue_missing_push_jobs',[100]),0);
  record('DM producer retry: exactly one internal notice, two device jobs, no third-user job or duplicate backfill');

  await worker1.query('begin');
  const first=await claims(worker1,1);
  const second=await claims(worker2,100);
  assert.equal(first.length,1);assert.equal(second.length,1);assert.notEqual(first[0].subscription_id,second[0].subscription_id);
  await worker1.query('commit');
  const [j1,j2]=[first[0],second[0]];
  const wire=await delivery(j1);
  assert.equal(wire.payload.title,'Mensaje de Persona 0');
  assert.equal(wire.payload.body,'Mensaje privado exclusivo de fixture');
  assert.equal(wire.payload.recipient_id,bId);assert.equal(wire.payload.target,'/messages/'+conversation);
  assert.equal(wire.ttl<=900,true);
  await call(b,'set_my_push_previews',[false]);
  assert.equal((await delivery(j2)).payload.title,'Nuevo aviso en PlanIt');
  await call(b,'set_my_push_previews',[true]);await block(a,bId);
  assert.equal((await delivery(j1)).payload.target,'/notifications');
  assert.equal((await delivery(j1)).payload.body,'Abrí PlanIt para consultar tus notificaciones.');
  await unblock(a,bId);
  await admin.query('delete from public.messages where id=$1',[messageId]);
  assert.equal((await delivery(j1)).payload.body,'Abrí PlanIt para consultar tus notificaciones.');
  assert.equal(await delivery({...j1,lease_token:randomUUID()}),null);
  record('Concurrent workers SKIP LOCKED; real recipient preview; opt-out, block, deleted message and wrong lease are safe');

  await fail(j1,'rate_limited');
  let row=await state(j1);assert.equal(row.state,'pending');assert.equal(row.attempts,1);
  assert.equal(await value(admin,"select extract(epoch from (next_attempt_at-(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'))) between 29 and 41 from planit_private.push_jobs where notification_id=$1 and subscription_id=$2",tuple(j1).slice(0,2)),true);
  await ack(j1);assert.equal((await state(j1)).state,'pending');
  await admin.query("update planit_private.push_jobs set next_attempt_at=created_at where notification_id=$1 and subscription_id=$2",tuple(j1).slice(0,2));
  let retry=(await claims(worker1,1))[0];
  assert.notEqual(retry.lease_token,j1.lease_token);await ack(j1);assert.equal((await state(retry)).state,'processing');
  await delivery(retry); await ack(retry);assert.equal((await state(retry)).state,'sent');
  assert.equal(await call(worker1,'enqueue_missing_push_jobs',[100]),0);
  assert.equal(await noticeCount(),before+1);
  record('429 schedules 30..40-second retry; stale ACK cannot overwrite a new lease; sent pair stays deduped; inbox unchanged');

  // A provider response for old keys cannot disable a renewed subscription.
  await delivery(j2);
  await admin.query("update public.push_subscriptions set updated_at=updated_at+interval '1 second' where id=$1",[j2.subscription_id]);
  await fail(j2,'gone');assert.equal(await value(admin,'select disabled_at is null from public.push_subscriptions where id=$1',[j2.subscription_id]),true);
  const another=randomUUID();await send(a,conversation,another);
  let jobs=await claims();let gone=jobs.find(j=>j.subscription_id===j2.subscription_id),other=jobs.find(j=>j.subscription_id!==j2.subscription_id);
  await delivery(gone);await fail(gone,'gone');
  assert.equal(await value(admin,'select disabled_at is not null from public.push_subscriptions where id=$1',[gone.subscription_id]),true);
  assert.equal(await value(admin,'select disabled_at is null from public.push_subscriptions where id=$1',[other.subscription_id]),true);
  await delivery(other);await ack(other);
  record('404/410 disables only matching subscription revision; renewed keys and other device survive');

  const msg3=randomUUID();await send(a,conversation,msg3);let lease=(await claims())[0];
  await admin.query("update planit_private.push_jobs set lease_until=created_at where notification_id=$1 and subscription_id=$2",tuple(lease).slice(0,2));
  await ack(lease);assert.equal((await state(lease)).state,'processing');
  const recovered=(await claims())[0];assert.notEqual(recovered.lease_token,lease.lease_token);assert.equal((await state(recovered)).attempts,2);
  await fail(recovered,'timeout');
  await admin.query("update planit_private.push_jobs set attempts=4,next_attempt_at=created_at where notification_id=$1 and subscription_id=$2",tuple(recovered).slice(0,2));
  const fifth=(await claims())[0];await fail(fifth,'provider_error');assert.equal((await state(fifth)).state,'failed');assert.equal((await state(fifth)).attempts,5);
  record('Lost worker lease recovers; timeout retries; fifth 5xx attempt terminalizes without inbox mutation');

  // Induce an outbox write fault inside the notification transaction.
  await admin.query("create function planit_private.b10_fixture_fault() returns trigger language plpgsql as $$ begin raise exception 'fixture_fault'; end $$; create trigger b10_fixture_fault before insert on planit_private.push_jobs for each row execute function planit_private.b10_fixture_fault()");
  const faultId=randomUUID();const faultBefore=await noticeCount();await send(a,conversation,faultId);
  assert.equal(await noticeCount(),faultBefore+1);assert.equal(Number(await value(admin,'select count(*) from planit_private.push_jobs where notification_id=$1',[faultId])),0);
  await admin.query('drop trigger b10_fixture_fault on planit_private.push_jobs; drop function planit_private.b10_fixture_fault()');
  assert.equal(await call(worker1,'enqueue_missing_push_jobs',[100]),1);
  assert.equal(await call(worker1,'enqueue_missing_push_jobs',[100]),0);
  let repaired=(await claims())[0];await call(b,'disable_my_push_subscription',[repaired.subscription_id]);
  assert.equal(await delivery(repaired),null);assert.equal((await state(repaired)).state,'discarded');
  record('Enqueue exception preserves DM and inbox; bounded backfill repairs exactly once; disabled device discarded before network');

  // Group chat INSERT has no internal notice and hence no push job.
  const category=await value(admin,'select id from public.categories limit 1');
  const event=await value(admin,"insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity) values($1,$2,'B10 fixture','Fixture','2099-01-01','2099-01-02','Fixture',0,0,1) returning id",[aId,category]);
  const group=await value(admin,"select id from public.conversations where kind='event' and event_id=$1",[event]);
  const groupBefore=await noticeCount();await admin.query('insert into public.messages(id,conversation_id,sender_id,body) values($1,$2,$3,$4)',[randomUUID(),group,aId,'Group fixture']);
  assert.equal(await noticeCount(),groupBefore);
  await setupSub(a,randomUUID(),'organizer');
  await call(b,'register_for_event',[event]);
  const fullId=await value(admin,"select id from public.notifications where type='event_full' and event_id=$1",[event]);
  assert.equal(Number(await value(admin,'select count(*) from planit_private.push_jobs where notification_id=$1',[fullId])),1);
  const full=(await claims())[0];assert.equal((await delivery(full)).payload.target,'/events/'+event);
  await call(a,'cancel_event',[event]); await call(a,'archive_event',[event]);
  assert.equal((await delivery(full)).payload.target,'/notifications');await ack(full);
  const ownNotices=await value(a,'select count(*) from public.get_notifications()');assert.equal(Number(ownNotices),1);
  const readAt=await call(a,'mark_notification_read',[fullId]);assert.ok(readAt);
  assert.equal((await a.query('select * from public.get_notification_changes($1)',[[fullId]])).rows.length,1);
  record('Real group-chat producer excluded; real event_full episode queues once; archive neutralizes payload; inbox read/changes intact');

  // Follow request notice uses the real producer, and subscribing later never replays older notices.
  await privacy(c,cId,'private');await follow(a,cId);
  const followId=await value(admin,"select id from public.notifications where recipient_id=$1 and type='follow_request'",[cId]);
  assert.equal(Number(await value(admin,'select count(*) from planit_private.push_jobs where notification_id=$1',[followId])),1);
  let followJob=(await claims())[0];assert.equal((await delivery(followJob)).payload.target,'/me/follow-requests');await ack(followJob);
  await setupSub(c,randomUUID(),'late-device');assert.equal(await call(worker1,'enqueue_missing_push_jobs',[100]),0);
  record('Follow-request producer supported; new device cannot backfill notifications from before opt-in');

  await setupSub(b,sub1,'b-one');await send(a,conversation,randomUUID());let expired=(await claims())[0];
  await admin.query("update planit_private.push_jobs set created_at=created_at-interval '1 hour',expires_at=created_at where notification_id=$1 and subscription_id=$2",tuple(expired).slice(0,2));
  assert.equal(await delivery(expired),null);assert.equal((await state(expired)).state,'discarded');
  await admin.query("update planit_private.push_jobs set finished_at=finished_at-interval '8 days' where notification_id=$1 and subscription_id=$2",tuple(expired).slice(0,2));
  // Move the corresponding notification out of the actual delivery window too.
  await admin.query("update public.notifications set created_at=created_at-interval '1 hour' where id=$1",[expired.notification_id]);
  await call(worker1,'enqueue_missing_push_jobs',[100]);assert.equal(await state(expired),undefined);
  const columns=(await admin.query("select column_name from information_schema.columns where table_schema='planit_private' and table_name='push_jobs'")).rows.map(r=>r.column_name);
  for (const forbidden of ['body','title','payload','endpoint','p256dh','auth','recipient_id']) assert.equal(columns.includes(forbidden),false);
  record('15-minute expiration, seven-day terminal retention and queue without private payload/endpoint/key columns');

  const activeSub=await value(admin,'select id from public.push_subscriptions where user_id=$1 and disabled_at is null limit 1',[bId]);
  await send(a,conversation,randomUUID());let backoff=(await claims())[0];
  for (let attempt=1;attempt<=4;attempt++) {
    await fail(backoff,'provider_error');
    const delay=Number(await value(admin,"select extract(epoch from(next_attempt_at-(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'))) from planit_private.push_jobs where notification_id=$1 and subscription_id=$2",tuple(backoff).slice(0,2)));
    assert.ok(delay>30*2**(attempt-1)-1 && delay<=30*2**(attempt-1)+10);
    await admin.query('update planit_private.push_jobs set next_attempt_at=created_at where notification_id=$1 and subscription_id=$2',tuple(backoff).slice(0,2));
    backoff=(await claims())[0];
  }
  await fail(backoff,'timeout');assert.equal((await state(backoff)).state,'failed');
  // More stale rows than a claim batch must not hide a live job.
  for(let i=0;i<7;i++) {
    const id=await value(admin,"insert into public.notifications(recipient_id,type,title,created_at) values($1,'direct_message','Old fixture',(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '1 hour') returning id",[bId]);
    await admin.query("insert into planit_private.push_jobs(notification_id,subscription_id,created_at,next_attempt_at,expires_at) values($1,$2,(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '1 hour',(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '1 hour',(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '45 minutes')",[id,activeSub]);
  }
  const liveId=randomUUID();await send(a,conversation,liveId);
  const live=(await claims(worker1,1))[0];assert.equal(live.notification_id,liveId);await delivery(live);await ack(live);
  assert.equal(Number(await value(admin,"select count(*) from planit_private.push_jobs where state='pending' and expires_at<(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')")),0);
  const unknown=await value(admin,"insert into public.notifications(recipient_id,type,title) values($1,'unknown_future_type','Fixture') returning id",[bId]);
  assert.equal(Number(await value(admin,'select count(*) from planit_private.push_jobs where notification_id=$1',[unknown])),0);
  await call(worker1,'enqueue_missing_push_jobs',[100]);assert.equal(Number(await value(admin,'select count(*) from planit_private.push_jobs where notification_id=$1',[unknown])),0);
  record('All four backoff intervals include bounded jitter; expired prefix cannot starve live jobs; unknown types excluded by trigger and backfill');
`
const cleanup = source.slice(source.indexOf('} catch (error) {\n  failure ='))
  .replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'9d917a4765e713b1adc4f75f89a7d6b4b57c8a25',branch:'codex/r7-block-10'")
const temp = 'scripts/.r7-push-delivery-run.local.mjs'
await writeFile(temp, bootstrap + tests.replace('KEY_FIXTURE', JSON.stringify(p256dh)) + cleanup)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [temp], {
    windowsHide: true, timeout: 180000, maxBuffer: 4 * 1024 * 1024,
  })
  process.stdout.write(stdout); process.stderr.write(stderr)
} catch (error) {
  process.stdout.write(error.stdout ?? ''); process.stderr.write(error.stderr ?? ''); process.exitCode = 1
} finally { await unlink(temp) }
