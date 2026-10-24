import assert from 'node:assert/strict'
import { createCleanupHandler } from '../supabase/functions/r7-media-cleanup/handler.ts'
import { formatTimeInput } from '../src/features/events/time-input.ts'
const id='30000000-0000-4000-8000-000000000001',token='40000000-0000-4000-8000-000000000001'
const path=`20000000-0000-4000-8000-000000000001/${id}/fixture.png`
for(const [input,expected] of [['',''],['0','0'],['09','09'],['093','09:3'],['0930','09:30'],['09:30','09:30'],['0000','00:00'],['2359','23:59'],['09:3','09:3'],['ab09:30','09:30']])assert.equal(formatTimeInput(input),expected)
console.log('PASS: numeric formatting, partial editing, pasted HH:mm, midnight')
const config={url:'https://iepeqmvzjguwlhnecsdq.supabase.co',serviceKey:'fixture-not-a-secret-key',workerToken:'fixture_worker_token_for_local_tests_only'}
const request=()=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:`Bearer ${config.workerToken}`}})
for(const mode of ['success','storage-error','lost-ack','changed-target','stale-lease','legacy-path']){
 const objectPath=mode==='legacy-path'?`${path.split('/')[0]}/legacy.png`:path
 let claimed=false,removes=0,completed=0,failed=0
 const handler=createCleanupHandler(config,{
  async rpc(name,args){
   if(name==='claim_r7_story_gc')return null
   if(name==='claim_event_media_gc'){if(claimed)return null;claimed=true;return {job_id:id,lease_token:token,storage_path:objectPath}}
   assert.deepEqual(args.p_job_id,id);assert.deepEqual(args.p_lease_token,token)
   if(name==='get_event_media_gc_target')return mode==='stale-lease'?null:{job_id:id,storage_path:mode==='changed-target'?'other/file.png':objectPath}
   if(name==='complete_event_media_gc'){completed++;if(mode==='lost-ack')throw new Error('timeout');return true}
   if(name==='fail_event_media_gc'){failed++;return null}
   throw new Error(`Unexpected ${name}`)
  },
  async remove(target){assert.equal(target,objectPath);removes++;if(mode==='storage-error')throw new Error('fixture')}
 })
 assert.equal((await handler(new Request('https://fixture.invalid',{method:'POST'}))).status,401)
 const response=await handler(request());assert.equal(response.status,200)
 const metrics=await response.json()
 if(mode==='success'||mode==='legacy-path'){assert.equal(metrics.deleted,1);assert.equal(removes,1);assert.equal(completed,1);assert.equal(failed,0)}
 else {assert.equal(metrics.retry,1);assert.equal(failed,1);assert.equal(metrics.deleted,0)}
 if(['changed-target','stale-lease'].includes(mode))assert.equal(removes,0)
 if(mode==='storage-error')assert.equal(completed,0)
 console.log(`PASS: cleanup ${mode}`)
}
