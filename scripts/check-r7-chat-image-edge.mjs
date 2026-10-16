import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const source=await readFile('supabase/functions/r7-chat-image/handler.ts','utf8')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText
const {createChatImageHandler}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
const id='20000000-0000-4000-8000-000000000001', other='30000000-0000-4000-8000-000000000001'
const bytes=new Uint8Array([137,80,78,71,13,10,26,10]), sha=createHash('sha256').update(bytes).digest('hex')
const target={file_id:id,object_id:other,storage_path:`r7/chat/${id}/${other}/${id}.png`,mime_type:'image/png',size_bytes:bytes.length,sha256:sha,etag:'fixture-etag'}
let auth=true,denied=false,race=false,changed=false,corrupt=false,oversize=false,malformed=false,calls=[],queries=0
const handler=createChatImageHandler({url:'https://fixture.invalid',anonKey:'public-fixture',serviceKey:'server-only-fixture'},async(url,options)=>{
 calls.push({url,options})
 if(url.endsWith('/auth/v1/user')){assert.equal(options.headers.Authorization,'Bearer fixture-user');return Response.json(auth?{id}:{},{status:auth?200:401})}
 assert.equal(options.headers.Authorization,'Bearer server-only-fixture')
 if(url.endsWith('/get_r7_chat_image_target')){queries++;assert.deepEqual(JSON.parse(options.body),{p_viewer_id:id,p_message_id:other});return Response.json(denied||(race&&queries===2)?null:changed&&queries===2?{...target,etag:'changed'}:malformed?{...target,storage_path:'r7/chat/../../secret'}:target)}
 assert.ok(url.startsWith('https://fixture.invalid/storage/v1/object/event_media/r7/chat/'))
 assert.equal(options.cache,'no-store');return new Response(oversize?new Uint8Array(20):corrupt?new Uint8Array(bytes.length):bytes)
})
const request=(query=`message_id=${other}`,method='GET',authorized=true)=>new Request(`https://fixture.invalid/functions/v1/r7-chat-image?${query}`,{method,headers:authorized?{Authorization:'Bearer fixture-user'}:{}})
const results=[],record=test=>{results.push({test,result:'PASS'});console.log('PASS:',test)}
let r=await handler(request());assert.equal(r.status,200);assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('content-type'),'image/png');assert.equal(queries,2);record('Verified Auth identity, service-only target, bounded bytes and digest, second authorization, image MIME and no-store')
assert.equal((await handler(request('', 'OPTIONS',false))).status,204)
assert.equal((await handler(request('', 'POST'))).status,405)
assert.equal((await handler(request(undefined,'GET',false))).status,401)
for(const query of ['message_id=invalid',`message_id=${other}&path=evil`,`message_id=${other}&message_id=${id}`])assert.equal((await handler(request(query))).status,400)
auth=false;assert.equal((await handler(request())).status,401);auth=true;record('CORS; wrong method, absent/invalid Auth, invalid message ID, browser path/identity and duplicate parameters rejected')
for(const mode of ['denied','race','changed','corrupt','oversize','malformed']){
 denied=mode==='denied';race=mode==='race';changed=mode==='changed';corrupt=mode==='corrupt';oversize=mode==='oversize';malformed=mode==='malformed';queries=0
 r=await handler(request());assert.ok([403,503].includes(r.status),mode);const body=await r.text();assert.ok(!body.includes('server-only')&&!body.includes('r7/chat/')&&!body.includes(sha));assert.equal(r.headers.get('cache-control'),'no-store')
}
record('Denied target, removal during fetch, changed object, digest mismatch, excess bytes and malformed target never return private bytes or internal metadata')
assert.ok(calls.every(call=>call.options.redirect==='error'))
await mkdir('docs/qa/r7-block-3/download-fix',{recursive:true})
await writeFile('docs/qa/r7-block-3/download-fix/edge-results.json',JSON.stringify({environment:'Node 24, actual TS handler; Auth/RPC/Storage HTTP stubs; no remote JWT or object authorization claim',results},null,2))
