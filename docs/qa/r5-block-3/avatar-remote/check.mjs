import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
const env=await readFile('.env.local','utf8')
const field=name=>env.match(new RegExp(`^${name}=(.+)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const url=field('VITE_SUPABASE_URL'),key=field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url,'https://iepeqmvzjguwlhnecsdq.supabase.co')
const endpoint=`${url}/functions/v1/social-avatar`,results=[]
for(const [name,method,authorization,expected] of [
  ['CORS preflight','OPTIONS',null,204],
  ['No user JWT','POST',null,401],
  ['Invalid user JWT','POST','Bearer invalid-fixture-jwt',401],
  ['Public API key is not a user JWT','POST',`Bearer ${key}`,401],
]) {
  const response=await fetch(endpoint,{method,headers:{apikey:key,'Content-Type':'application/json',Origin:'http://localhost:5173',...(authorization?{Authorization:authorization}:{})},body:method==='POST'?JSON.stringify({user_id:'90000000-0000-4000-8000-000000000001'}):undefined,signal:AbortSignal.timeout(15000)})
  results.push({test:name,status:response.status,expected,result:response.status===expected?'PASS':'FAIL'})
}
await writeFile('docs/qa/r5-block-3/avatar-remote/http.json',JSON.stringify({date:new Date().toISOString(),environment:'Actual remote endpoint; anonymous/invalid credentials only, no accounts, uploads or signed URLs',results,authenticated_avatar:'NOT RUN',result:results.every(x=>x.result==='PASS')?'PASS':'FAIL'},null,2)+'\n')
assert.ok(results.every(x=>x.result==='PASS'));console.log('PASS: social-avatar preflight and three authentication denials')
