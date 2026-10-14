import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const env=await readFile('.env.local','utf8')
const field=name=>env.match(new RegExp(`^${name}=(.+)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const url=field('VITE_SUPABASE_URL'),key=field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url,'https://iepeqmvzjguwlhnecsdq.supabase.co');assert.ok(key?.startsWith('sb_publishable_'))
const results=[]
// Read-only transport checks. Live mutation RPC probes require separate authorization.
for(const path of ['rest/v1/profiles?select=id,birth_date,sex','rest/v1/files?select=id,storage_path']) {
 const response=await fetch(`${url}/${path}`,{headers:{apikey:key},signal:AbortSignal.timeout(10000)})
 results.push({path,status:response.status,result:[401,403].includes(response.status)?'PASS':'FAIL'})
}
const out=process.env.PLANIT_SQL_OUTPUT??'docs/qa/r5-block-4/remote'
await mkdir(out,{recursive:true});await writeFile(`${out}/http-anon.json`,JSON.stringify({date:new Date().toISOString(),project:'iepeqmvzjguwlhnecsdq',environment:'Real HTTPS GET only; public key; no JWT, mutation RPC, account provisioning or writes; status only',results,
blocked:[{test:'Live anonymous POST update_my_social_profile/set_my_avatar',result:'BLOCKED',reason:'Automatic approval review rejected live mutation RPC probes because misconfigured ACL could allow remote writes. No request was executed.'}],not_run:['Authenticated HTTP/JWT','Storage upload/signing/CDN','Realtime transport']},null,2)+'\n')
assert.ok(results.every(row=>row.result==='PASS'));console.log('PASS: two real anonymous HTTP GET denials for B4')
