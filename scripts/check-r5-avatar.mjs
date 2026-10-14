import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile('supabase/functions/social-avatar/handler.ts','utf8')
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {createAvatarHandler} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const viewer = '50000000-0000-4000-8000-000000000001'
const peer = '50000000-0000-4000-8000-000000000002'
// Placeholder credentials are fake; no network requests are made.
const config = {url:'https://fixture.invalid',anonKey:'fake-public-key',serviceKey:'fake-server-key'}
const results = []
const record = test => {results.push({test,result:'PASS'});console.log(`PASS: ${test}`)}
const request = (body = {user_id:peer},authorization = 'Bearer fixture-session') => new Request('https://fixture.invalid/avatar',{
  method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(body),
})
const response = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}})
let calls = []
const mockFetch = async (url,options) => {
  calls.push({url,options})
  if(url.endsWith('/auth/v1/user')) {
    assert.equal(options.headers.Authorization,'Bearer fixture-session')
    assert.equal(options.headers.apikey,config.anonKey)
    return response({id:viewer})
  }
  assert.equal(options.headers.Authorization,`Bearer ${config.serviceKey}`)
  if(url.endsWith('/rpc/get_social_avatar_for_signing')) {
    assert.deepEqual(JSON.parse(options.body),{p_viewer_id:viewer,p_user_id:peer})
    return response(`${peer}/avatar.png`)
  }
  assert.equal(url,`https://fixture.invalid/storage/v1/object/sign/avatars/${peer}/avatar.png`)
  assert.deepEqual(JSON.parse(options.body),{expiresIn:60})
  return response({signedURL:`/object/sign/avatars/${peer}/avatar.png?token=fake-signature`})
}
const handler=createAvatarHandler(config,mockFetch)
assert.equal((await handler(new Request('https://fixture.invalid',{method:'OPTIONS'}))).status,204)
assert.equal((await handler(new Request('https://fixture.invalid'))).status,405)
assert.equal((await handler(request({user_id:peer},''))).status,401)
assert.equal((await handler(request({user_id:'../path'}))).status,400)
assert.equal((await handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture-session'},body:'null'}))).status,400)
assert.equal((await handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture-session'},body:'invalid json'}))).status,400)
assert.equal(calls.length,0)
record('Method/CORS, missing bearer, malformed JSON and invalid target rejected before privileged fetch')
const valid=await handler(request({user_id:peer,viewer_id:peer,expires_in:86400,bucket:'event_media',path:'forged'}))
assert.equal(valid.status,200)
assert.equal(valid.headers.get('Cache-Control'),'no-store')
assert.deepEqual(await valid.json(),{signed_url:`https://fixture.invalid/storage/v1/object/sign/avatars/${peer}/avatar.png?token=fake-signature`,expires_in:60})
assert.equal(calls.length,4)
record('Viewer from verified Auth response; client cannot choose viewer/path/bucket/TTL; privileged signature exactly 60 seconds')
const hidden=createAvatarHandler(config,async url=>url.endsWith('/auth/v1/user')?response({id:viewer}):response(null))
assert.deepEqual(await (await hidden(request())).json(),{signed_url:null,expires_in:60})
record('Blocked/nonexistent/no-avatar neutral response never reveals a storage path')
let lookups=0
const concurrentBlock=createAvatarHandler(config,async url=>url.endsWith('/auth/v1/user')?response({id:viewer}):
  url.includes('/rpc/')?response(++lookups===1?`${peer}/avatar.png`:null):
  response({signedURL:`/object/sign/avatars/${peer}/avatar.png?token=fake-signature`}))
assert.deepEqual(await (await concurrentBlock(request())).json(),{signed_url:null,expires_in:60})
record('Block committed while signing: final authorization recheck withholds newly signed URL')
for(const status of [401,403,500]) {
  const denied=createAvatarHandler(config,async()=>response({private_error:'must not leak'},status))
  const result=await denied(request());assert.equal(result.status,401)
  assert.deepEqual(await result.json(),{error:'authentication_required'})
}
const failure=createAvatarHandler(config,async()=>{throw new Error('fake secret must not leak')})
assert.deepEqual(await (await failure(request())).json(),{error:'avatar_unavailable'})
const badIdentity=createAvatarHandler(config,async()=>response({id:'invalid'}))
assert.equal((await badIdentity(request())).status,401)
const badSignature=createAvatarHandler(config,async url=>url.endsWith('/auth/v1/user')?response({id:viewer}):
  url.includes('/rpc/')?response(`${peer}/avatar.png`):response({signedURL:'https://unexpected.invalid/secret'}))
assert.equal((await badSignature(request())).status,503)
record('Expired/rejected identity, network failure and malformed signing response fail closed without backend payloads or secrets')
const out=process.env.PLANIT_SQL_OUTPUT??'docs/qa/r5-block-1'
await mkdir(out,{recursive:true})
await writeFile(`${out}/avatar-unit.json`,JSON.stringify({environment:'Actual handler TypeScript transpiled in Node; mocked fetch; no Deno runtime, real Auth, Storage or deployed Edge',results,result:'PASS'},null,2)+'\n')
