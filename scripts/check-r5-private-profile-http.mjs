import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
// Read-only REST/RPC checks. Never create remote accounts, follows or blocks.
const env=await readFile('.env.local','utf8')
const field=name=>env.match(new RegExp('^'+name+'=(.+)$','m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
const url=field('VITE_SUPABASE_URL'),key=field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url,'https://iepeqmvzjguwlhnecsdq.supabase.co');assert.ok(key?.startsWith('sb_publishable_'))
const out=process.env.PLANIT_HTTP_OUTPUT??'docs/qa/r5-block-5/remote'
const id='90000000-0000-4000-8000-000000000001',results=[]
const read=async(path,body,jwt)=>fetch(url+path,{method:body?'POST':'GET',headers:{apikey:key,'Content-Type':'application/json',...(jwt?{Authorization:'Bearer '+jwt}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)})
let failure
try {
  for(const [path,body] of [
    ['/rest/v1/rpc/get_social_profile',{p_user_id:id}],
    ['/rest/v1/rpc/get_social_profile_events',{p_user_id:id,p_before_starts_at:null,p_before_id:null,p_limit:30}],
    ['/rest/v1/profiles?select=id,birth_date,sex',null],
    ['/rest/v1/files?select=id&bucket_name=eq.avatars',null],
    ['/functions/v1/social-avatar',{user_id:id}],
  ]) {
    const response=await read(path,body)
    const pass=[401,403].includes(response.status)
    results.push({case:'anonymous',path,status:response.status,result:pass?'PASS':'FAIL'})
    assert.ok(pass,'Anonymous endpoint must deny access: '+path)
  }
  // Optional, user-authorized pre-existing sessions; no tokens or payloads in evidence.
  const fixturePath=process.env.PLANIT_B5_QA_CASES
  if(!fixturePath) results.push({case:'authenticated audiences + avatar/Storage',result:'NOT RUN',reason:'No authorized pre-existing session fixture file supplied; no remote data provisioned'})
  else {
    const cases=JSON.parse(await readFile(fixturePath,'utf8'))
    assert.ok(Array.isArray(cases)&&cases.length>0)
    for(const item of cases) {
      assert.ok(['minimal','accepted','blocked'].includes(item.audience))
      assert.match(item.target_id,/^[0-9a-f-]{36}$/i)
      assert.ok(typeof item.jwt==='string'&&item.jwt.split('.').length===3)
      const subject=JSON.parse(Buffer.from(item.jwt.split('.')[1],'base64url')).sub
      assert.notEqual(subject,item.target_id,'Use third-party sessions for private profiles')
      const relation=await read('/rest/v1/rpc/get_social_relationship',{p_user_id:item.target_id},item.jwt)
      assert.equal(relation.status,200)
      const relationship=await relation.json()
      if(item.audience==='blocked') assert.equal(relationship.unavailable,true)
      else {
        assert.equal(relationship.visibility,'private','The fixture must be a private target')
        if(item.audience==='accepted') assert.equal(relationship.follow?.status,'accepted')
        else assert.ok(!relationship.follow||['pending','rejected'].includes(relationship.follow.status))
      }
      const response=await read('/rest/v1/rpc/get_social_profile',{p_user_id:item.target_id},item.jwt)
      assert.equal(response.status,200)
      const profile=await response.json()
      assert.deepEqual(Object.keys(profile).sort(),item.audience==='blocked'?['unavailable']:item.audience==='minimal'?['avatar','display_name','username']:['avatar','bio','display_name','username'])
      if(item.audience==='blocked') assert.deepEqual(profile,{unavailable:true})
      const events=await read('/rest/v1/rpc/get_social_profile_events',{p_user_id:item.target_id,p_limit:30},item.jwt)
      if(item.audience==='accepted') {
        assert.equal(events.status,200)
        const page=await events.json()
        for(const event of page.events) {
          assert.deepEqual(Object.keys(event).sort(),['category_id','ends_at','id','location_name','starts_at','title'])
          const direct=await read('/rest/v1/events?select=id,visibility,organizer_id&id=eq.'+event.id,null,item.jwt)
          assert.equal(direct.status,200)
          const rows=await direct.json();assert.equal(rows.length,1);assert.equal(rows[0].visibility,'public');assert.equal(rows[0].organizer_id,item.target_id)
        }
      } else assert.equal(events.status,403)
      const direct=await read('/rest/v1/profiles?select=id,bio,birth_date,sex&id=eq.'+item.target_id,null,item.jwt)
      assert.equal(direct.status,200);assert.deepEqual(await direct.json(),[])
      const avatarFiles=await read('/rest/v1/files?select=id&bucket_name=eq.avatars&uploaded_by=eq.'+item.target_id,null,item.jwt)
      assert.equal(avatarFiles.status,200);assert.deepEqual(await avatarFiles.json(),[])
      if(item.audience==='blocked') {
        const avatar=await read('/functions/v1/social-avatar',{user_id:item.target_id},item.jwt)
        if(avatar.status===200) assert.equal((await avatar.json()).signed_url,null)
        else assert.ok([403,404].includes(avatar.status))
      }
      results.push({case:'authorized pre-existing session',audience:item.audience,result:'PASS',profile_status:response.status,events_status:events.status,direct_profiles_status:direct.status,avatar_metadata_status:avatarFiles.status})
    }
  }
} catch {failure='Read-only HTTP assertion failed; no response bodies or credentials recorded';console.error(failure);process.exitCode=1}
finally {
  await mkdir(out,{recursive:true})
  await writeFile(out+'/http.json',JSON.stringify({date:new Date().toISOString(),project:'iepeqmvzjguwlhnecsdq',environment:'Real HTTPS; anonymous key and optionally supplied authorized sessions; no remote writes',results,failure,result:failure?'FAIL':'PASS'},null,2)+'\n')
  console.log(JSON.stringify(results))
}
