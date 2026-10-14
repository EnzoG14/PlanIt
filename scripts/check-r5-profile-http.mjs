import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const env=await readFile('.env.local','utf8')
const field=name=>env.match(new RegExp(`^${name}=(.+)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const url=field('VITE_SUPABASE_URL'),key=field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url,'https://iepeqmvzjguwlhnecsdq.supabase.co');assert.ok(key?.startsWith('sb_publishable_'))
const id='90000000-0000-4000-8000-000000000001',results=[]
for(const [path,body] of [
  ['rpc/get_social_profile',{p_user_id:id}],
  ['rpc/get_social_profile_events',{p_user_id:id,p_before_starts_at:null,p_before_id:null,p_limit:30}],
  ['profiles?select=id,birth_date,sex',null],
]) {
  const response=await fetch(`${url}/rest/v1/${path}`,{method:body?'POST':'GET',headers:{apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)})
  // Record status only, never credentials or response payloads.
  results.push({path,status:response.status,result:[401,403].includes(response.status)?'PASS':'FAIL'})
}
const out=process.env.PLANIT_SQL_OUTPUT??'docs/qa/r5-block-3'
await mkdir(out,{recursive:true});await writeFile(`${out}/http-profile-anon.json`,JSON.stringify({date:new Date().toISOString(),project:'iepeqmvzjguwlhnecsdq',environment:'Real HTTPS, public key only, no authenticated JWT or writes',results},null,2)+'\n')
assert.ok(results.every(row=>row.result==='PASS'));console.log('PASS: three real anonymous HTTP denials for B3')
