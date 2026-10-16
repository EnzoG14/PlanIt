import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

// Explicit opt-in, provisioned fixtures only. No upload, new publish, DDL, deploy,
// cleanup, clocks, roles or secrets changed. Never print response bodies/tokens.
if(process.env.PLANIT_STORIES_HTTP_APPROVED!=='1'||!process.env.PLANIT_STORIES_HTTP_FIXTURE){
 console.log('NOT RUN: requires explicit environment approval and a private fixture file. See docs/qa/r7-block-4/STATUS.md.');process.exit(0)
}
const f=JSON.parse(await readFile(process.env.PLANIT_STORIES_HTTP_FIXTURE,'utf8'))
assert.equal(f.url,'https://iepeqmvzjguwlhnecsdq.supabase.co')
assert.ok(f.publicKey && f.eventId && f.liveStory && f.expiredStory)
for(const role of ['A','B','C','D','E','F'])assert.equal(typeof f.tokens[role],'string')
const results=[],record=test=>{results.push({test,result:'PASS'});console.log('PASS:',test)}
const headers=role=>({apikey:f.publicKey,Authorization:`Bearer ${f.tokens[role]??f.publicKey}`,'Content-Type':'application/json'})
const call=(path,role='A',body)=>fetch(f.url+path,{method:body?'POST':'GET',headers:headers(role),body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)})
const rpc=(name,role,body)=>call('/rest/v1/rpc/'+name,role,body)
let failure
try{
 for(const role of ['A','B']){
  const r=await rpc('get_event_stories',role,{p_event_id:f.eventId});assert.equal(r.status,200)
  const page=await r.json();assert.ok(page.items.some(s=>s.id===f.liveStory.id));assert.ok(!page.items.some(s=>s.id===f.expiredStory.id));assert.ok(page.items.every(s=>s.event_id===f.eventId))
  const image=await call('/functions/v1/r7-story-image?story_id='+f.liveStory.id,role);assert.equal(image.status,200);assert.equal(image.headers.get('cache-control'),'no-store');assert.ok((await image.arrayBuffer()).byteLength>0)
  const expired=await call('/functions/v1/r7-story-image?story_id='+f.expiredStory.id,role);assert.equal(expired.status,403)
 }
 record('JWT A/B list only event live stories and receive no-store image; expired reader denied')
 for(const role of ['C','D','E','F','anon']){
  assert.equal((await rpc('get_event_stories',role,{p_event_id:f.eventId})).status,role==='anon'?401:403)
  const image=await call('/functions/v1/r7-story-image?story_id='+f.liveStory.id,role);assert.ok([401,403].includes(image.status))
  const denied=await rpc('publish_event_story',role,{p_event_id:f.eventId,p_story_id:f.liveStory.id,p_file_id:f.liveStory.file_id});assert.ok([401,403].includes(denied.status))
 }
 record('JWT pending/removed/link-only/stranger/anon cannot read or publish existing story UUID')
 for(const story of [f.liveStory,f.expiredStory]){
  const path=story.storage_path.split('/').map(encodeURIComponent).join('/')
  const sign=await call('/storage/v1/object/sign/event_media/'+path,'A',{expiresIn:60});assert.ok(!sign.ok,'Storage must not sign R7 stories')
  if(story===f.expiredStory){const direct=await call('/storage/v1/object/authenticated/event_media/'+path);assert.ok(!direct.ok,'Expired direct object must be denied')}
 }
 record('Storage signing denied for live/expired story, direct expired GET denied to uploader')
}catch(error){failure={name:error.name,message:'HTTP acceptance failed; inspect the assertion locally without logging credentials or private bodies.'};throw error}
finally{
 await mkdir('docs/qa/r7-block-4/http',{recursive:true})
 await writeFile('docs/qa/r7-block-4/http/results.json',JSON.stringify({environment:'Real HTTP with explicitly provisioned private fixtures',results,failure,result:failure?'FAIL':'PASS'},null,2)+'\n')
}
