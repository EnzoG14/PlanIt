import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-7/follow-notifications/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    const recipient='95000000-0000-4000-8000-000000000001',requester='95000000-0000-4000-8000-000000000002';
    for(const id of [recipient,requester]) await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'PRIVATE_NAME_SENTINEL'}]);
    const owner=await connect(),sender=await connect(),sender2=await connect();
    await role(owner,recipient);await role(sender,requester);await role(sender2,requester);
    const notices=client=>client.query("select * from public.notifications where type='follow_request' and recipient_id=$1",[recipient]);
    const count=async()=> (await notices(owner)).rowCount;
    const cancel=()=>sender.query('select public.unfollow_user($1)',[recipient]);
    const resolve=(version,decision)=>value(owner,'select public.resolve_follow_request($1,$2,$3)',[requester,version,decision]);
    await admin.query("update public.profiles set visibility='public' where id=$1",[recipient]);
    await follow(sender,recipient);assert.equal(await count(),0);await cancel();
    await admin.query("update public.profiles set visibility='private' where id=$1",[recipient]);
    let request=await follow(sender,recipient);assert.equal(await count(),1);
    let notice=(await notices(owner)).rows[0];assert.equal(notice.id,request.request_version);
    assert.equal(notice.actor_id,null);assert.equal(notice.event_id,null);assert.equal(notice.conversation_id,null);assert.equal(notice.read_at,null);
    assert.equal(notice.title,'Nueva solicitud de seguimiento');assert.ok(!JSON.stringify(notice).includes('PRIVATE_NAME_SENTINEL'));
    assert.equal(await value(owner,'select public.get_notification_target($1)',[notice.id]),'/me/follow-requests');
    assert.equal((await owner.query('select * from public.get_notification_changes($1)',[[notice.id]])).rows[0].target,'/me/follow-requests');
    assert.equal((await sender.query('select * from public.notifications where id=$1',[notice.id])).rowCount,0);
    assert.equal((await a.query('select * from public.notifications where id=$1',[notice.id])).rowCount,0);
    assert.equal(await value(sender,'select public.get_notification_target($1)',[notice.id]),null);
    await denied(anon.query('select * from public.notifications'));await denied(anon.query('select public.get_notification_target($1)',[notice.id]));
    await follow(sender,recipient);assert.equal(await count(),1);
    await resolve(request.request_version,'rejected');await resolve(request.request_version,'rejected');assert.equal(await count(),1);
    request=await follow(sender,recipient);assert.equal(await count(),2);await follow(sender,recipient);assert.equal(await count(),2);
    await resolve(request.request_version,'accepted');assert.equal(await count(),2);await cancel();
    request=await follow(sender,recipient);assert.equal(await count(),3);
    const stamp=await value(owner,'select public.mark_notification_read($1)',[request.request_version]);
    assert.deepEqual(await value(owner,'select public.mark_notification_read($1)',[request.request_version]),stamp);
    await block(sender,recipient);await denied(follow(sender,recipient));assert.equal(await count(),3);
    assert.ok((await notices(owner)).rows.every(n=>n.actor_id===null&&n.title==='Nueva solicitud de seguimiento'));
    await unblock(sender,recipient);
    await sender.query('begin');await follow(sender,recipient);await sender.query('rollback');assert.equal(await count(),3);
    assert.equal((await sender.query('select * from public.user_follows where followed_id=$1',[recipient])).rowCount,0);
    await admin.query("create function planit_private.fail_notice_fixture() returns trigger language plpgsql set search_path='' as $$ begin if new.type='follow_request' and new.recipient_id='95000000-0000-4000-8000-000000000001'::uuid then raise exception 'fixture_notification_failure'; end if; return new; end $$; create trigger fail_notice_fixture before insert on public.notifications for each row execute function planit_private.fail_notice_fixture()");
    await assert.rejects(follow(sender,recipient),/fixture_notification_failure/);
    assert.equal((await sender.query('select * from public.user_follows where followed_id=$1',[recipient])).rowCount,0);assert.equal(await count(),3);
    await admin.query('drop trigger fail_notice_fixture on public.notifications; drop function planit_private.fail_notice_fixture()');
    await race('same follow request emits one notification',sender,'select public.follow_user($1)',[recipient],sender2,'select public.follow_user($1)',[recipient]);
    assert.equal(await count(),4);
    const current=await follow(sender,recipient);assert.equal(await count(),4);
    assert.equal((await notices(owner)).rows.filter(n=>n.id===current.request_version).length,1);
    const acl=(await admin.query("select p.prosecdef,p.proconfig,has_function_privilege('authenticated',p.oid,'execute') as execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='planit_private' and p.proname='notify_follow_request'")).rows[0];
    assert.equal(acl.prosecdef,false);assert.equal(acl.execute,false);assert.deepEqual(acl.proconfig,['search_path=""']);
    assert.ok((await admin.query("select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='notifications'")).rowCount);
    record('Follow notifications: one per new pending generation; accepted/public/retry/resolve emit none; reject and cancel renewals emit once; recipient-only RLS/target/read; generic payload and block-safe history');
    record('Follow notification atomic rollback and injected insert failure revert follow; real concurrent duplicate follows produce one notice; invoker private trigger/no client EXECUTE; existing Realtime publication preserved');
  }
`
await mkdir('.r5-check.local', { recursive: true }); await mkdir(out, { recursive: true })
const path = '.r5-check.local/request-notifications.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'169b904e4e951f6d77d05d83dabdebaaf261d66a',branch:'codex/r5-block-7'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r5-request-notifications.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
