import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'
let source=(await readFile('scripts/check-r7-media.mjs','utf8')).replace(/\r\n/g,'\n')
const marker='  await publish(r);'
assert.equal(source.split(marker).length,2)
const tests=String.raw`
  const imageTarget=(viewer=aId,message=mid,client=service)=>value(client,'select public.get_r7_chat_image_target($1,$2)',[viewer,message]);
  const image=await imageTarget();
  assert.equal(image.file_id,r.file_id);assert.equal(image.sha256,'a'.repeat(64));
  assert.deepEqual(await imageTarget(bId),image);
  for(const viewer of [cId,dId,users[4],users[5],null])assert.equal(await imageTarget(viewer),null);
  assert.equal(await imageTarget(aId,randomUUID()),null);
  for(const client of [a,b,anon,missing])await denied(imageTarget(aId,mid,client));
  await b.query('select public.leave_event($1)',[eid]);
  assert.equal(await imageTarget(bId),null);
  await b.query('select public.register_for_event($1)',[eid]);
  await admin.query("update public.events set visibility='unlisted' where id=$1",[eid]);
  assert.deepEqual(await imageTarget(bId),image);
  await admin.query("update public.event_access_grants set status='revoked', revoked_at=clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' where event_id=$1 and user_id=$2",[eid,bId]);
  assert.equal(await imageTarget(bId),null);
  assert.deepEqual(await imageTarget(aId),image);
  await admin.query("update public.event_access_grants set status='active', revoked_at=null where event_id=$1 and user_id=$2",[eid,bId]);
  await admin.query("update public.events set visibility='public' where id=$1",[eid]);
  record('Service-only target: organizer/confirmed read; pending/removed/link-only/third-party/null denied; missing message null; Auth/anon cannot call; removal and revoked hidden grant rechecked');
`
source=source.replace(marker,marker+'\n'+tests)
source=source.replaceAll('docs/qa/r7-block-1/sql','docs/qa/r7-block-3/download-fix/sql')
source=source.replaceAll('scripts/.r7-media-run.local.mjs','scripts/.r7-image-run.local.mjs')
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
source=source.replaceAll("base:'5adf8e4',branch:'codex/r7-block-1'",`base:'${revision}',branch:'codex/r7-chat-upload-fix'`)
const temp='scripts/.r7-image-bootstrap.local.mjs'
await writeFile(temp,source)
try {
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[temp],{windowsHide:true,timeout:180000,maxBuffer:8*1024*1024})
  console.log(stdout);if(stderr)console.error(stderr)
}catch(error){console.error(error.stdout,error.stderr);throw error}
finally{await unlink(temp)}
