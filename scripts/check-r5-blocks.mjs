import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
// Reuse B1 replay, SET ROLE audiences, bilateral block, history/group and races.
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const extra = String.raw`
  await unblock(a,bId); await unblock(b,aId)
  await invalid(block(a,aId)); await invalid(unblock(a,aId)); await denied(unblock(anon,bId))
  await block(a,bId); await block(a,bId)
  assert.equal(await value(a,'select count(*)::int from public.user_blocks'),1)
  assert.equal(await value(b,'select count(*)::int from public.user_blocks'),0)
  assert.equal(await value(c,'select count(*)::int from public.user_blocks'),0)
  assert.deepEqual(await value(b,'select public.get_social_relationship($1)',[aId]),{unavailable:true,blocked_by_me:false})
  assert.deepEqual(await value(a,'select public.get_social_relationship($1)',[bId]),{unavailable:true,blocked_by_me:true})
  await unblock(b,aId); await denied(follow(b,aId)); await denied(dm(b,aId))
  await unblock(a,bId); await unblock(a,bId)
  record('B9 own block SELECT only,self/anon denied,idempotent block/unblock,counterparty cannot remove actor block')
  await privacy(a,aId,'private');await privacy(b,bId,'private');await follow(a,bId);await follow(b,aId)
  await admin.query("create function public.b9_fail_cleanup() returns trigger language plpgsql as $ begin raise exception 'injected'; end $; create trigger b9_fail_cleanup before delete on public.user_follows for each row execute function public.b9_fail_cleanup();")
  await assert.rejects(block(a,bId),e=>e.code==='P0001')
  assert.equal(await value(admin,'select count(*)::int from public.user_blocks'),0)
  assert.equal(await value(admin,'select count(*)::int from public.user_follows where (follower_id=$1 and followed_id=$2) or (follower_id=$2 and followed_id=$1)',[aId,bId]),2)
  await admin.query('drop trigger b9_fail_cleanup on public.user_follows;drop function public.b9_fail_cleanup()')
  await block(a,bId);assert.equal(await value(admin,'select count(*)::int from public.user_follows where (follower_id=$1 and followed_id=$2) or (follower_id=$2 and followed_id=$1)',[aId,bId]),0)
  await unblock(a,bId);assert.equal(await dm(a,bId),conversation)
  record('B9 injected cleanup failure rolls back block and preserves both pending requests;success removes both,unlock same DM')
  await a.query('begin');await block(a,bId)
  const bPid=await value(b,'select pg_backend_pid()'),b2Pid=await value(b2,'select pg_backend_pid()')
  const opposite=block(b,aId).then(()=>({ok:true}),error=>({error}))
  const competingMessage=randomUUID()
  const sending=send(b2,conversation,competingMessage,'Must be denied').then(()=>({ok:true}),error=>({error}))
  let bothWaiting=false
  for(let i=0;i<100;i++) {
    bothWaiting=await value(admin,"select count(*)=2 from pg_stat_activity where pid=any($1::int[]) and wait_event_type='Lock'",[[bPid,b2Pid]])
    if(bothWaiting)break
    await new Promise(r=>setTimeout(r,10))
  }
  assert.ok(bothWaiting);await a.query('commit')
  assert.equal((await opposite).ok,true);assert.equal((await sending).error?.code,'42501')
  assert.equal(await value(admin,'select count(*)::int from public.messages where id=$1',[competingMessage]),0)
  await denied(follow(a,bId));await denied(follow(b,aId))
  await unblock(a,bId);await denied(send(a,conversation));await unblock(b,aId)
  assert.equal(await dm(a,bId),conversation)
  record('B9 three sessions:opposite blocks and send observe lock waits,no deadlock,no new message;both directions follow denied')
`
const needle = "  record('Frozen snapshots rejected; concurrent mutations leave no residual pending requests')"
if (!source.includes(needle)) throw new Error('B1 scaffold changed')
const runner = source.replace(needle, () => needle + '\n' + extra)
  .replace("'docs/qa/r5-block-1'", "'docs/qa/r5-block-9/sql'")
  .replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'65b46ab69d6f7b75a0f9996b0d091395c0bffab6',branch:'codex/r5-block-9'")
await mkdir('.r5-check.local', { recursive: true })
const path = '.r5-check.local/blocks-sql.mjs'
await writeFile(path, runner)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: process.env })
  console.log(stdout)
  const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-9/sql'
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', extension: 'scripts/check-r5-blocks.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
