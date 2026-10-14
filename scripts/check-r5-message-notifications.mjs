import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-8/message-notifications/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    const recipient='94000000-0000-4000-8000-000000000001',senderId='94000000-0000-4000-8000-000000000002';
    for(const uid of [recipient,senderId]) await admin.query('insert into auth.users values($1,$2)',[uid,{display_name:'PRIVATE_NAME_SENTINEL'}]);
    const reader=await connect(),writer=await connect(),writer2=await connect();
    await role(reader,recipient);await role(writer,senderId);await role(writer2,senderId);
    const conv=await dm(writer,recipient),msg=randomUUID();
    const notices=client=>client.query("select * from public.notifications where type='direct_message' and conversation_id=$1",[conv]);
    const count=async()=> (await notices(reader)).rowCount;
    await send(writer,conv,msg,'PRIVATE_BODY_SENTINEL');assert.equal(await count(),1);
    const notice=(await notices(reader)).rows[0];
    assert.equal(notice.id,msg);assert.equal(notice.recipient_id,recipient);assert.equal(notice.actor_id,null);assert.equal(notice.event_id,null);assert.equal(notice.read_at,null);
    assert.equal(notice.title,'Nuevo mensaje privado');assert.ok(!JSON.stringify(notice).includes('PRIVATE_BODY_SENTINEL'));assert.ok(!JSON.stringify(notice).includes('PRIVATE_NAME_SENTINEL'));
    assert.equal(await value(reader,'select public.get_notification_target($1)',[msg]),'/messages/'+conv);
    assert.equal((await reader.query('select * from public.get_notification_changes($1)',[[msg]])).rows[0].target,'/messages/'+conv);
    assert.ok((await reader.query('select * from public.get_notifications()')).rows.some(n=>n.id===msg));
    assert.equal((await notices(writer)).rowCount,0);assert.equal((await notices(a)).rowCount,0);
    assert.equal(await value(writer,'select public.get_notification_target($1)',[msg]),null);await denied(anon.query('select * from public.notifications'));
    await denied(writer.query("insert into public.notifications(recipient_id,type,title) values($1,'direct_message','Forged')",[recipient]));
    await send(writer,conv,msg,'PRIVATE_BODY_SENTINEL');assert.equal(await count(),1);
    await block(reader,senderId);await denied(send(writer,conv));assert.equal(await count(),1);
    await send(writer,conv,msg,'PRIVATE_BODY_SENTINEL');assert.equal(await count(),1);
    assert.equal(await value(reader,'select public.get_notification_target($1)',[msg]),'/messages/'+conv);
    assert.deepEqual(await profile(reader,senderId),{unavailable:true});await unblock(reader,senderId);
    const stamp=await value(reader,'select public.mark_notification_read($1)',[msg]);assert.deepEqual(await value(reader,'select public.mark_notification_read($1)',[msg]),stamp);
    const replyId=randomUUID();await send(reader,conv,replyId,'Respuesta');assert.equal((await notices(writer)).rowCount,1);assert.equal(await count(),1);
    const rolled=randomUUID();await writer.query('begin');await send(writer,conv,rolled);await writer.query('rollback');assert.equal(await count(),1);assert.equal((await admin.query('select 1 from public.messages where id=$1',[rolled])).rowCount,0);
    await admin.query("create function planit_private.fail_dm_notice_fixture() returns trigger language plpgsql set search_path='' as $$ begin if new.type='direct_message' and new.recipient_id='94000000-0000-4000-8000-000000000001'::uuid then raise exception 'fixture_notification_failure'; end if; return new; end $$; create trigger fail_dm_notice_fixture before insert on public.notifications for each row execute function planit_private.fail_dm_notice_fixture()");
    const failed=randomUUID();await assert.rejects(send(writer,conv,failed),/fixture_notification_failure/);assert.equal(await count(),1);assert.equal((await admin.query('select 1 from public.messages where id=$1',[failed])).rowCount,0);
    await admin.query('drop trigger fail_dm_notice_fixture on public.notifications; drop function planit_private.fail_dm_notice_fixture()');
    const concurrent=randomUUID();await race('same message emits one notification',writer,'select public.send_direct_message($1,$2,$3)',[conv,concurrent,'Concurrent'],writer2,'select public.send_direct_message($1,$2,$3)',[conv,concurrent,'Concurrent']);assert.equal(await count(),2);
    const before=await value(admin,"select count(*)::int from public.notifications where type='direct_message'");await admin.query('insert into public.messages(id,conversation_id,sender_id,body) values(gen_random_uuid(),$1,$2,$3)',[eventConversation,bId,'Event fixture']);assert.equal(await value(admin,"select count(*)::int from public.notifications where type='direct_message'"),before);
    const forged=randomUUID();await admin.query("insert into public.notifications(id,recipient_id,conversation_id,type,title) values($1,$2,$3,'direct_message','Fixture')",[forged,aId,conv]);assert.equal(await value(a,'select public.get_notification_target($1)',[forged]),null);
    const acl=(await admin.query("select p.prosecdef,p.proconfig,has_function_privilege('authenticated',p.oid,'execute') as execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='planit_private' and p.proname='notify_direct_message'")).rows[0];assert.equal(acl.prosecdef,false);assert.equal(acl.execute,false);assert.deepEqual(acl.proconfig,['search_path=""']);
    record('DM notices: recipient only,one per message,retry no duplicate,generic no identity/body,safe target and historical block,read marker,reverse sender,forged notice cannot grant access,event chat excluded');
    record('DM notices: rollback and injected notice failure revert message;concurrent same UUID emits once;private invoker trigger/no client EXECUTE');
  }
`
await mkdir('.r5-check.local', { recursive: true }); await mkdir(out, { recursive: true })
const path = '.r5-check.local/message-notifications.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'603ed63f88b77c1946554d3f2ed1b52a98ad7823',branch:'codex/r5-block-8'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', extension: 'scripts/check-r5-message-notifications.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
