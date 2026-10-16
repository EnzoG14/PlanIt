// The only module allowed to read the administrative credential. No assertions
// are made with this client; all product setup below uses signed-in QA users.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomBytes, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { project,url,runId,privateDir,save,client,login,logout,rpc,today,dayAfter,evidence } from './common.mjs'
export async function prepare(){
 let admin
 let m;try{m=JSON.parse(await readFile(`${privateDir}/manifest.json`,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;m={project,run_id:runId,users:{},events:{}}}
 assert.equal(m.project,project);assert.equal(m.run_id,runId);assert.ok(!m.closed_at,'Use a new run ID after QA fixtures are closed')
 const results=[],clients={}
 try{
  // Verify the old pair without changing profiles or reusing their event data.
  if(!m.existing_accounts_verified){const old=JSON.parse(await readFile(process.env.PLANIT_EXISTING_QA_ACCOUNTS??'D:/planit/.auth-test.local','utf8'));let verified=0;for(const a of old.slice(0,2)){const c=client();const {error}=await c.auth.signInWithPassword({email:a.email,password:a.password});if(!error)verified++;await c.auth.signOut({scope:'local'})}m.existing_accounts_verified=verified;await save(m)}
  const labels=['A','B','C','D',...Array.from({length:10},(_,i)=>'P'+i)]
  for(const label of labels){
   if(!m.users[label]){if(!admin){const adminConfig=JSON.parse(await readFile('.r6-live.local/admin.json','utf8'));assert.equal(adminConfig.project,project);admin=createClient(url,adminConfig.key,{auth:{persistSession:false,autoRefreshToken:false}})}const account={email:`r6-${runId}-${label.toLowerCase()}@example.invalid`,password:'Qa1!'+randomBytes(24).toString('base64url')};const {data,error}=await admin.auth.admin.createUser({...account,email_confirm:true,user_metadata:{display_name:`QA R6 ${label}`,qa_run_id:runId}});if(error)throw new Error('QA account provisioning failed ('+error.code+')');m.users[label]={...account,id:data.user.id};await save(m)}
   clients[label]=await login(m.users[label])
   const cohort=label.startsWith('P')
   await rpc(clients[label],'update_my_social_profile',{p_username:`qa${runId.replaceAll('-','').slice(-10)}${label.toLowerCase()}`,p_display_name:`QA R6 ${label}`,p_first_name:null,p_last_name:null,p_birth_date:cohort?(Number(label.slice(1))<5?'1995-01-10':'1980-01-10'):null,p_sex:cohort?(Number(label.slice(1))<5?'female':'male'):null,p_bio:null,p_visibility:'public'})
  }
  results.push({test:'14 dedicated confirmed QA users; ordinary password logins; existing pair verified without profile mutations',result:'PASS',existing_verified:m.existing_accounts_verified})
  const {data:categories,error}=await clients.A.from('categories').select('id').eq('is_active',true).limit(1);assert.equal(error,null);assert.ok(categories[0])
  const definitions={occupancy:['A',10,'public'],compare:['A',20,'public'],empty:['A',10,'public'],demo:['A',10,'public'],small:['A',10,'public'],hidden:['A',10,'unlisted'],cancelled:['A',10,'public'],archived:['A',10,'public'],foreign:['D',3,'public'],realtime:['A',1,'public'],race:['A',1,'public']}
  for(const [name,[owner,capacity,visibility]] of Object.entries(definitions)){
   if(!m.events[name]){m.events[name]={id:randomUUID(),owner,title:`QA R6 ${runId} ${name}`,capacity,visibility};await save(m)}
   const e=m.events[name]
   await rpc(clients[owner],'create_event',{p_id:e.id,p_title:e.title,p_description:'Synthetic QA only. Authorized R6 follow-up.',p_starts_at:dayAfter(today(),30)+'T18:00:00',p_ends_at:dayAfter(today(),30)+'T20:00:00',p_category_id:categories[0].id,p_capacity:capacity,p_location_name:'QA virtual fixture',p_address:'QA synthetic address',p_latitude:-34.6,p_longitude:-58.38,p_image_paths:[],p_visibility:visibility})
  }
  if(!m.seeded){
   for(const label of ['B','P0','P1','P2'])await rpc(clients[label],'register_for_event',{p_event_id:m.events.occupancy.id})
   for(const name of ['demo','compare'])for(let i=0;i<10;i++)await rpc(clients['P'+i],'register_for_event',{p_event_id:m.events[name].id})
   await rpc(clients.P0,'register_for_event',{p_event_id:m.events.small.id})
   const token=await rpc(clients.A,'create_or_rotate_event_link',{p_event_id:m.events.hidden.id});await rpc(clients.C,'redeem_event_link',{p_token:token})
   await rpc(clients.C,'register_for_event',{p_event_id:m.events.occupancy.id});await rpc(clients.C,'leave_event',{p_event_id:m.events.occupancy.id})
   await rpc(clients.C,'register_for_event',{p_event_id:m.events.occupancy.id})
   const {data:part}=await clients.C.from('event_participations').select('id').eq('event_id',m.events.occupancy.id).eq('user_id',m.users.C.id).single();assert.ok(part)
   await rpc(clients.A,'remove_participant',{p_event_id:m.events.occupancy.id,p_participation_id:part.id})
   await rpc(clients.B,'follow_user',{p_target_id:m.users.A.id})
   await rpc(clients.A,'cancel_event',{p_event_id:m.events.cancelled.id});await rpc(clients.A,'archive_event',{p_event_id:m.events.archived.id})
   m.seeded=true;await save(m)
  }
  results.push({test:'11 manifest-scoped events created by user RPC; registrations/leaves/removal/follow/link redemption via real JWT',result:'PASS'})
  await evidence('prepare',results,{actors:Object.fromEntries(Object.entries(m.users).map(([r,u])=>[r,u.id])),events:m.events,admin_scope:'Auth user provisioning only; no admin product queries/assertions/DDL',credentials:'Private ignored manifest only'})
 }finally{await logout(clients)}
}
