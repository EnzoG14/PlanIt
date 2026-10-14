import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
// Reuse the real PostgreSQL/Auth scaffold and all B1 authorization/concurrency
// cases, preserving historical evidence. Add B8 history and reconciliation cases.
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const extra = String.raw`
  const fixtureIds = Array.from({length:34},()=>randomUUID())
  for (const id of fixtureIds) await send(a,conversation,id,'Tie fixture')
  await admin.query("update public.messages set created_at='2026-10-14 10:00:00' where conversation_id=$1",[conversation])
  const newest=await value(a,'select public.get_direct_messages($1,null,null,30)',[conversation])
  const older=await value(a,'select public.get_direct_messages($1,$2,$3,30)',[conversation,newest.next_cursor.created_at,newest.next_cursor.id])
  assert.equal(newest.messages.length,30);assert.equal(older.messages.length,6);assert.equal(older.next_cursor,null)
  assert.equal(new Set([...newest.messages,...older.messages].map(r=>r.id)).size,36)
  assert.deepEqual(Object.keys(newest.messages[0]).sort(),['body','created_at','id','sender_id'])
  assert.deepEqual((await a.query('select id,sender_id,body,created_at from public.messages where id=$1 and conversation_id=$2',[fixtureIds[0],conversation])).rows.map(r=>r.id),[fixtureIds[0]])
  await denied(a.query('insert into public.messages(conversation_id,sender_id,body) values($1,$2,$3)',[conversation,bId,'Forged sender']))
  await denied(anon.query('select * from public.messages'))
  await denied(anon.query('select public.get_direct_messages($1)',[conversation]))
  const unicodeId=randomUUID();await send(a,conversation,unicodeId,'\u0085 Texto Unicode \u0085')
  assert.equal(await value(a,'select body from public.messages where id=$1',[unicodeId]),'Texto Unicode')
  record('B8: 36 equal-timestamp messages page30+6,exact payload,ID reconciliation,forged sender/anon denied,Unicode trim')
`
const needle = "  record('DM pagination uses server timestamp + UUID, disjoint pages and bounded cursor validation')"
if (!source.includes(needle)) throw new Error('B1 scaffold insertion point changed')
const runner = source.replace(needle, needle + '\n' + extra)
  .replace("'docs/qa/r5-block-1'", "'docs/qa/r5-block-8/sql'")
  .replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'0116fd30478dea8a6851b7a97cac518abded3925',branch:'codex/r5-block-8'")
await mkdir('.r5-check.local', { recursive: true })
const path = '.r5-check.local/messages-sql.mjs'
await writeFile(path, runner)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: process.env })
  console.log(stdout)
  const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-8/sql'
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', extension: 'scripts/check-r5-messages.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
