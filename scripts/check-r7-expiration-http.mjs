import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

// Read-only opt-in probe. Fixtures must already exist in an explicitly approved
// environment. Never publish/expire stories, invoke GC, delete, or print tokens.
const out='docs/qa/r7-block-6/http'
await mkdir(out,{recursive:true})
if(process.env.PLANIT_EXPIRATION_HTTP_APPROVED!=='1'||!process.env.PLANIT_EXPIRATION_HTTP_FIXTURE){
 await writeFile(out+'/results.json',JSON.stringify({result:'NOT RUN',reason:'Requires approved environment and private pre-provisioned fixture'},null,2)+'\n')
 console.log('NOT RUN: real JWT/Storage acceptance requires approval and private fixture.');process.exit(0)
}
const f=JSON.parse(await readFile(process.env.PLANIT_EXPIRATION_HTTP_FIXTURE,'utf8'))
assert.equal(f.url,'https://iepeqmvzjguwlhnecsdq.supabase.co')
assert.ok(f.publicKey&&f.eventId&&f.expiredStory?.id&&f.expiredStory?.storage_path&&f.liveStory?.id&&f.tokens?.A&&f.tokens?.B)
const results=[],record=test=>{results.push({test,result:'PASS'});console.log('PASS:',test)}
let failure
try{
 for(const role of ['A','B'])for(const date of ['2000-01-01T00:00:00Z','2099-01-01T00:00:00Z']){
  const headers={apikey:f.publicKey,Authorization:`Bearer ${f.tokens[role]}`,Date:new Date(date).toUTCString(),'Content-Type':'application/json'}
  const call=(path,body)=>fetch(f.url+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)})
  const page=await call('/rest/v1/rpc/get_event_stories',{p_event_id:f.eventId});assert.equal(page.status,200)
  const data=await page.json();assert.ok(data.items.some(s=>s.id===f.liveStory.id));assert.ok(!data.items.some(s=>s.id===f.expiredStory.id))
  const live=await call('/functions/v1/r7-story-image?story_id='+f.liveStory.id);assert.equal(live.status,200);assert.equal(live.headers.get('cache-control'),'no-store');await live.body?.cancel()
  const expired=await call('/functions/v1/r7-story-image?story_id='+f.expiredStory.id);assert.equal(expired.status,403);await expired.body?.cancel()
  const path=f.expiredStory.storage_path.split('/').map(encodeURIComponent).join('/')
  const direct=await call('/storage/v1/object/authenticated/event_media/'+path);assert.ok(!direct.ok);await direct.body?.cancel()
  const sign=await call('/storage/v1/object/sign/event_media/'+path,{expiresIn:60});assert.ok(!sign.ok);await sign.body?.cancel()
 }
 record('Real JWT author/member: live list/image succeeds, expired list/reader/direct Storage/sign denied despite client Date skew')
 for(const token of ['',f.publicKey,f.tokens.A]){
  const r=await fetch(f.url+'/functions/v1/r7-media-cleanup',{method:'POST',headers:{apikey:f.publicKey,Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(15000)})
  assert.ok([401,403].includes(r.status));await r.body?.cancel()
 }
 record('Deployed cleanup denies absent/public/user token')
}catch(error){failure={name:error.name,message:'Acceptance assertion failed; inspect locally without printing credentials/private responses'};throw error}
finally{await writeFile(out+'/results.json',JSON.stringify({result:failure?'FAIL':'PASS',results,failure,limits:'Pre-provisioned live/expired fixtures only; exact crossing and real GC deletion/concurrency require separate authorized lifecycle test'},null,2)+'\n')}
