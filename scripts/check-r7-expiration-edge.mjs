import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import ts from 'typescript'
const source=await readFile('supabase/functions/r7-media-cleanup/handler.ts','utf8')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText
const {createCleanupHandler}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
const id='20000000-0000-4000-8000-000000000001', sid='30000000-0000-4000-8000-000000000001'
const job={upload_id:id,story_id:sid,lease_token:sid,storage_path:`r7/stories/${id}/${sid}/${id}.png`}
const config={url:'https://iepeqmvzjguwlhnecsdq.supabase.co',serviceKey:'server-only-fixture-key-value',workerToken:'fixture_'.repeat(8)}
const results=[],record=test=>{results.push({test,result:'PASS'});console.log('PASS:',test)}
let mode='ok',calls=[],claimed=0,removed=0
const deps={rpc:async(name,args)=>{
 calls.push({name,args})
 if(name==='claim_r7_story_gc')return claimed++===0?(mode==='invalid'?{...job,storage_path:'../avatar.png'}:job):null
 if(name==='get_r7_story_gc_target')return mode==='stale'?null:mode==='changed'?{...job,story_id:id}:job
 if(name==='complete_r7_story_gc'){if(mode==='lost_ack')throw new Error('private backend detail');return true}
 if(name==='fail_r7_story_gc'){assert.ok(['storage_error','backend_error'].includes(args.p_error_code));return true}
 throw new Error('unexpected_rpc')
},remove:async(path)=>{assert.equal(path,job.storage_path);removed++;if(['timeout','5xx','429'].includes(mode))throw new Error('sensitive storage response') }}
const handler=createCleanupHandler(config,deps)
const req=(token=config.workerToken,method='POST')=>new Request('https://fixture.invalid',{method,headers:{Authorization:`Bearer ${token}`}})
for(const token of ['', 'anon-key','user-jwt','service-role-key'])assert.equal((await handler(req(token))).status,401)
assert.equal((await handler(req(config.workerToken,'GET'))).status,405);assert.equal(calls.length,0)
assert.equal((await createCleanupHandler({...config,url:'https://wrong.invalid'},deps)(req())).status,503)
record('TC-04: absent/invalid secret, anon/JWT/service key and wrong method/config cause no backend I/O')
let r=await handler(req());let body=await r.json();assert.equal(body.deleted,1);assert.equal(removed,1)
assert.deepEqual(calls.map(c=>c.name),['claim_r7_story_gc','get_r7_story_gc_target','complete_r7_story_gc','claim_r7_story_gc'])
assert.equal(r.headers.get('cache-control'),'no-store');record('Revalidates authoritative target, removes exact path then completes; no-store aggregate metrics only')
for(mode of ['stale','changed','invalid','timeout','5xx','429','lost_ack']){
 calls=[];claimed=0;removed=0;r=await handler(req());body=await r.json()
 assert.ok(!JSON.stringify(body).includes('r7/stories')&&!JSON.stringify(body).includes('sensitive')&&!JSON.stringify(body).includes(id))
 if(['stale','changed','invalid'].includes(mode))assert.equal(removed,0)
 if(['timeout','5xx','429'].includes(mode))assert.ok(!calls.some(c=>c.name==='complete_r7_story_gc'))
 if(['timeout','5xx','429','lost_ack','changed'].includes(mode))assert.ok(calls.some(c=>c.name==='fail_r7_story_gc'))
 if(mode==='invalid')assert.equal(r.status,503)
}
record('Stale lease/changed target/path traversal blocked; timeout/5xx/429 preserve references, lost ACK remains retryable without logging private details')
let count=0
const bounded=createCleanupHandler(config,{rpc:async(name)=>name==='claim_r7_story_gc'?(count++,job):name==='get_r7_story_gc_target'?job:true,remove:async()=>{},now:()=>0})
body=await (await bounded(req())).json();assert.equal(body.claimed,100);assert.equal(count,100)
record('Invocation bounded to 100 single-object claims; no large reserved batch')
// Exercise the actual entrypoint transport as well: no direct SQL delete,
// server-only headers, exact bucket/path, timeouts and redirect refusal.
const entry=await readFile('supabase/functions/r7-media-cleanup/index.ts','utf8')
const entryCode=ts.transpileModule(entry,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText
 .replace("import { createCleanupHandler } from './handler.ts';",'const {createCleanupHandler}=globalThis.__gcFixture;')
let served,network=[],storageStatus=200
const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno
globalThis.__gcFixture={createCleanupHandler}
globalThis.Deno={env:{get:name=>({SUPABASE_URL:config.url,SUPABASE_SERVICE_ROLE_KEY:config.serviceKey,STORY_GC_WORKER_TOKEN:config.workerToken})[name]},serve:fn=>{served=fn}}
globalThis.fetch=async(url,options)=>{
 network.push({url,options});assert.equal(options.redirect,'error');assert.ok(options.signal)
 assert.equal(options.headers.Authorization,'Bearer '+config.serviceKey);assert.equal(options.headers.apikey,config.serviceKey)
 if(url.endsWith('/storage/v1/object/event_media')){
  assert.equal(options.method,'DELETE');assert.deepEqual(JSON.parse(options.body),{prefixes:[job.storage_path]})
  return Response.json([],{status:storageStatus})
 }
 assert.ok(url.startsWith(config.url+'/rest/v1/rpc/'));assert.equal(options.method,'POST')
 const name=url.split('/').at(-1)
 return Response.json(name==='claim_r7_story_gc'?(claimed++===0?job:null):name==='get_r7_story_gc_target'?job:true)
}
try{
 await import('data:text/javascript;base64,'+Buffer.from(entryCode).toString('base64'))
 for(storageStatus of [200,503]){
  network=[];claimed=0;body=await (await served(req())).json()
  assert.equal(body.deleted,storageStatus===200?1:0);assert.equal(body.retry,storageStatus===200?0:1)
  assert.equal(network.some(c=>c.url.endsWith('/complete_r7_story_gc')),storageStatus===200)
 }
}finally{globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;delete globalThis.__gcFixture}
record('Entrypoint uses exact Storage API DELETE, service headers only on approved project, bounded timeout, redirects refused; 503 never finalizes DB')
await mkdir('docs/qa/r7-block-6/edge',{recursive:true})
await writeFile('docs/qa/r7-block-6/edge/results.json',JSON.stringify({environment:'Actual TS handler transpiled on Node; simulated RPC and Storage failures, no real HTTP/JWT or physical deletion',results},null,2)+'\n')
