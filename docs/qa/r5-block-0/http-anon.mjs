import {readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const env=Object.fromEntries((await readFile('.env.local','utf8')).split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*(VITE_SUPABASE_(?:URL|PUBLISHABLE_KEY))\s*=\s*(.*?)\s*$/);return m?[[m[1],m[2].replace(/^['"]|['"]$/g,'')]]:[]}))
const origin=env.VITE_SUPABASE_URL
assert.equal(new URL(origin).hostname,'iepeqmvzjguwlhnecsdq.supabase.co')
const headers={apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY}
const tests=[['profiles','GET','/profiles?select=id,username,birth_date,sex&limit=1'],['conversations','GET','/conversations?select=id&limit=1'],['messages','GET','/messages?select=id&limit=1'],['get_event_attendees','POST','/rpc/get_event_attendees',{p_event_id:'00000000-0000-0000-0000-000000000000'}],['get_event_chat','POST','/rpc/get_event_chat',{p_event_id:'00000000-0000-0000-0000-000000000000'}]]
const results=[]
for(const [name,method,path,body] of tests){const response=await fetch(`${origin}/rest/v1${path}`,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});const payload=await response.json();results.push({name,actor:'anon; public API key only; no user JWT',method,path,status:response.status,error_code:payload.code??null,returned_rows:Array.isArray(payload)?payload.length:null,result:response.status===401&&payload.code==='42501'?'PASS':'FAIL'})}
await writeFile('docs/qa/r5-block-0/http-anon.json',JSON.stringify({project:'iepeqmvzjguwlhnecsdq',scope:'HTTP real sin sesión: sólo denegación; sin JWT usuario, datos de negocio ni mutación',date:new Date().toISOString(),results},null,2)+'\n')
console.log(JSON.stringify(results.map(({name,status,error_code,result})=>({name,status,error_code,result}))))
assert.ok(results.every(r=>r.result==='PASS'))
