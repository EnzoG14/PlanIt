import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'

// Keep B1's replay, authorization negatives, byte-attestation gates and legacy
// regression suite. Add Storage 1.80.2's actual caller-role preflight INSERT,
// rolled back exactly as Storage's testPermission; no remote writes or mock PASS.
let source = (await readFile('scripts/check-r7-media.mjs','utf8')).replace(/\r\n/g,'\n')
const marker = '  await store(a,r);'
assert.equal(source.split(marker).length,2)
const cases = String.raw`
  const probe = {mimetype:'image/png',contentLength:1024};
  // A raw-upload permission probe failed before the corrective migration.
  await a.query('begin');
  await store(a,r,aId,probe);
  await assert.rejects(state(a,r),/invalid_image/);
  await a.query('rollback');
  await a.query('begin');
  await store(a,r,aId,{...probe,contentEncoding:null});
  await a.query('rollback');
  for(const metadata of [null,{}, {mimetype:'image/png'},
    {...probe,contentLength:1023}, {...probe,mimetype:'image/jpeg'},
    {...probe,contentEncoding:'gzip'}, {...probe,cacheControl:'max-age=3600'},
    {...probe,size:1024}, {...probe,extra:'unexpected'},
    {mimetype:'image/png',size:1024}, {mimetype:'image/png',cacheControl:'no-store'}]) {
    await denied(store(a,r,aId,metadata));
  }
  await denied(store(b,r,bId,probe));
  await denied(store(a,r,bId,probe));
  await denied(store(a,other,aId,probe));
  record('Storage 1.80.2 caller-role raw preflight accepted; absent/wrong length, MIME, encoding, cache, owner and reservation denied');

  const staged=await reserve();
  await store(a,staged,aId,probe);
  await assert.rejects(state(a,staged),/invalid_image/);
  for(const op of ['object.get_authenticated','object.sign','object.list','object.info','object.get']) {
    await a.query("select set_config('test.storage_operation',$1,false)",[op]);
    assert.equal((await a.query('select * from storage.objects where name=$1',[staged.storage_path])).rowCount,0);
  }
  await assert.rejects(value(a,'select public.send_event_chat_message_v2($1,$2,null,$3)',[eid,randomUUID(),staged.file_id]),/image_verification_required|invalid_image/);
  assert.equal(await value(admin,'select count(*)::int from public.files where id=$1',[staged.file_id]),0);
  record('A preliminary metadata row cannot pass uploaded-state, read/sign/list, byte-attestation or chat publication gates');
`
source = source.replace(marker,cases+'\n'+marker)
source = source.replaceAll('scripts/.r7-media-run.local.mjs','scripts/.r7-preflight-run.local.mjs')
source = source.replaceAll('docs/qa/r7-block-1/sql','docs/qa/r7-block-3/storage-fix/sql')
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
source = source.replaceAll("base:'5adf8e4',branch:'codex/r7-block-1'",`base:'${revision}',branch:'codex/r7-chat-upload-fix'`)
const temp='scripts/.r7-preflight-bootstrap.local.mjs'
await writeFile(temp,source)
try {
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[temp],{windowsHide:true,timeout:180000,maxBuffer:8*1024*1024})
  console.log(stdout);if(stderr)console.error(stderr)
} catch(error){console.error(error.stdout,error.stderr);throw error}
finally {await unlink(temp)}
