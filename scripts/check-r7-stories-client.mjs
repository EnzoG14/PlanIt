import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import ts from 'typescript'

const results=[],record=test=>{results.push({test,result:'PASS'});console.log('PASS:',test)}
let args=[],response={data:null,error:null},signalSeen,sessionUser='user-a'
globalThis.__storyClient={
  rpc(name,params){args.push({name,params});return {then(resolve){return Promise.resolve(response).then(resolve)},abortSignal(s){signalSeen=s;return this}}},
  auth:{getUser:async()=>({data:{user:{id:sessionUser}},error:null}),getSession:async()=>({data:{session:{user:{id:sessionUser},access_token:'fixture-token'}},error:null})},
}
const source=(await readFile('src/features/events/storiesApi.ts','utf8'))
  .replace("import { supabase } from '../../lib/supabase'",'const supabase = globalThis.__storyClient')
  .replaceAll('import.meta.env.VITE_SUPABASE_URL',JSON.stringify('https://fixture.invalid'))
  .replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',JSON.stringify('public-fixture'))
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText
const api=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
response={data:'story-a',error:null}
assert.equal(await api.publishEventStory('event-a','story-a','file-a'),'story-a')
await api.publishEventStory('event-a','story-a','file-a');assert.deepEqual(args[0],args[1])
assert.deepEqual(args[0],{name:'publish_event_story',params:{p_event_id:'event-a',p_story_id:'story-a',p_file_id:'file-a'}})
response={data:null,error:null};await assert.rejects(api.publishEventStory('event-a','story-a','file-a'),e=>e.uncertain)
for(const [code,message,expected] of [['42501','x','unavailable'],['P0001','event_read_only','read_only'],['P0001','story_conflict','conflict'],['P0001','media_conflict','conflict'],['P0001','image_verification_required','unverified'],['22023','invalid_story','invalid'],['40001','retry_read_committed','uncertain']]){
 response={data:null,error:{code,message}};await assert.rejects(api.publishEventStory('e','s','f'),e=>e.code===expected)
}
record('Publish confirms exact UUID; retries preserve payload; null ACK/network/serialization uncertain; typed permission/conflict/read-only/validation failures')
const signal=new AbortController().signal,cursor={created_at:'2026-10-16T16:00:00',id:'story-a'}
response={data:{server_now:'2026-10-16T16:01:00',items:[],next_cursor:null},error:null}
assert.deepEqual(await api.loadEventStories('event-a',cursor,10,signal),response.data)
assert.equal(signalSeen,signal);assert.deepEqual(args.at(-1),{name:'get_event_stories',params:{p_event_id:'event-a',p_before_at:cursor.created_at,p_before_id:cursor.id,p_limit:10}})
response={data:{server_now:'2026-10-16T16:01:00',items:[{event_id:'other-event'}]},error:null}
await assert.rejects(api.loadEventStories('event-a'),e=>e.uncertain)
record('Cursor/server time/empty page and abort propagation; cross-event response refused')
const originalFetch=globalThis.fetch;let fetches=0
try{
 globalThis.fetch=async(url,options)=>{fetches++;assert.equal(url,'https://fixture.invalid/functions/v1/r7-story-image?story_id=story-a');assert.equal(options.cache,'no-store');assert.equal(options.signal,signal);assert.equal(options.headers.Authorization,'Bearer fixture-token');return new Response(new Uint8Array([1,2]),{headers:{'Content-Type':'image/png'}})}
 assert.equal((await api.downloadStoryImage('story-a','user-a',signal)).size,2)
 sessionUser='other';await assert.rejects(api.downloadStoryImage('story-a','user-a',signal),e=>e.code==='unavailable');assert.equal(fetches,1);sessionUser='user-a'
 globalThis.fetch=async()=>new Response(null,{status:403});await assert.rejects(api.downloadStoryImage('story-a','user-a',signal),e=>e.code==='unavailable')
 globalThis.fetch=async()=>new Response('wrong',{headers:{'Content-Type':'text/html'}});await assert.rejects(api.downloadStoryImage('story-a','user-a',signal))
}finally{globalThis.fetch=originalFetch;delete globalThis.__storyClient}
record('Authenticated no-store Blob download, changed session and forbidden/invalid bytes rejected; no signed/public URL or deletion')
await mkdir('docs/qa/r7-block-4/client',{recursive:true})
await writeFile('docs/qa/r7-block-4/client/results.json',JSON.stringify({environment:'Node 24; transpiled actual API, Supabase and fetch stubs; no real JWT/Storage/browser',results},null,2)+'\n')
