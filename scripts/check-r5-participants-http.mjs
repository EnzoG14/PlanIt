import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const env = await readFile('.env.local','utf8')
const field = name => env.match(new RegExp(`^${name}=(.+)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const url = field('VITE_SUPABASE_URL'), key = field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url,'https://iepeqmvzjguwlhnecsdq.supabase.co')
assert.ok(key?.startsWith('sb_publishable_'))
const id = '90000000-0000-4000-8000-000000000001'
const results = []
for(const [path,body] of [
  ['rpc/get_event_social_participants',{p_event_id:id,p_after_user_id:null,p_limit:30}],
  ['rpc/get_social_profile',{p_user_id:id}],
  ['rpc/get_event_attendees',{p_event_id:id}],
  ['profiles?select=id,birth_date,sex',null],
]) {
  const response = await fetch(`${url}/rest/v1/${path}`,{method:body?'POST':'GET',headers:{apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)})
  // Never store response payloads, identity, credentials or tokens.
  results.push({path,status:response.status,result:[401,403].includes(response.status)?'PASS':'FAIL'})
}
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-2'
await mkdir(out,{recursive:true})
await writeFile(`${out}/http-anon.json`,JSON.stringify({date:new Date().toISOString(),project:'iepeqmvzjguwlhnecsdq',environment:'Real HTTPS, publishable key only, no authenticated JWT or business writes',results},null,2)+'\n')
assert.ok(results.every(row=>row.result==='PASS'))
console.log('PASS: four real HTTP anonymous denials; no authenticated JWT proof')
