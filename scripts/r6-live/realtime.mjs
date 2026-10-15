import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {setTimeout as delay} from 'node:timers/promises'
import {load,identities,logout,rpc,event,evidence,save} from './common.mjs'
export async function realtime(){
 const m=await load(),c=await identities(m),results=[],channels=[],received={A:[],B:[],C:[],D:[]}
 // Preserve the interrupted run's event/history; a retry gets a fresh episode fixture.
const old=m.events.realtime
const {data:stored,error:lookup}=await c.A.from('events').select('category_id,starts_at,ends_at').eq('id',old.id).single();assert.equal(lookup,null)
m.events['realtime-previous-'+Date.now()]=old
m.events.realtime={...old,id:randomUUID(),title:old.title+' retry'};await save(m)
await rpc(c.A,'create_event',{p_id:m.events.realtime.id,p_title:m.events.realtime.title,p_description:'Synthetic QA retry',p_starts_at:stored.starts_at,p_ends_at:stored.ends_at,p_category_id:stored.category_id,p_capacity:1,p_location_name:'QA virtual fixture',p_address:'QA synthetic address',p_latitude:-34.6,p_longitude:-58.38,p_image_paths:[],p_visibility:'public'})
const id=event(m,'realtime'),owner=m.users.A.id
 const wait=async(predicate,label,ms=30000)=>{const deadline=Date.now()+ms;while(Date.now()<deadline){if(await predicate())return;await delay(100)}throw new Error(label+' timeout')}
 const read=async()=>{const r=await c.A.from('notifications').select('id,type,event_id,recipient_id').eq('event_id',id).eq('type','event_full');assert.equal(r.error,null);return r.data}
 try{
  for(const role of ['A','B','C','D']){
   // Every attacker intentionally requests the owner's stream, not its own filter.
   const ch=c[role].channel(`qa-r6-${role}-${Date.now()}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'recipient_id=eq.'+owner},p=>{if(p.new.event_id===id)received[role].push(p.new.id)})
   channels.push([c[role],ch])
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('subscription timeout '+role)),30000);ch.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve()}else if(['CHANNEL_ERROR','TIMED_OUT'].includes(status)){clearTimeout(timer);reject(new Error('subscription failed '+role))}})})
  }
  results.push({test:'Four distinct real JWT WebSocket sessions reach SUBSCRIBED; B/C/D intentionally request A stream',result:'PASS'})
  const before=await read();assert.equal(before.length,0)
  await rpc(c.B,'register_for_event',{p_event_id:id});await wait(()=>received.A.length===1,'first owner delivery')
  let rows=await read();assert.equal(rows.length,1);assert.equal(rows[0].recipient_id,owner)
  await rpc(c.B,'register_for_event',{p_event_id:id});assert.equal((await read()).length,1)
  await rpc(c.B,'leave_event',{p_event_id:id});await rpc(c.B,'register_for_event',{p_event_id:id});await wait(()=>received.A.length===2,'second owner delivery');assert.equal((await read()).length,2)
  results.push({test:'Last seat sends one actual INSERT; retry/lost-ack retry no duplicate; full-free-full sends new episode',result:'PASS'})
  const part=await c.B.from('event_participations').select('id').eq('event_id',id).eq('user_id',m.users.B.id).single();assert.equal(part.error,null)
  await rpc(c.A,'remove_participant',{p_event_id:id,p_participation_id:part.data.id});await rpc(c.B,'request_rejoin',{p_event_id:id})
  const requests=await rpc(c.A,'get_event_rejoin_requests',{p_event_id:id});
  const list=Array.isArray(requests)?requests:requests.requests??requests.items??[];assert.ok(list[0],'Pending request visible to owner')
  await rpc(c.A,'resolve_rejoin',{p_event_id:id,p_request_id:list[0].request_id,p_decision:'approved'});await wait(()=>received.A.length===3,'rejoin delivery');assert.equal((await read()).length,3)
  results.push({test:'Approved removed rejoin fills seat and creates exactly a third real episode',result:'PASS'})
  await c.A.removeChannel(channels[0][1]);await rpc(c.B,'leave_event',{p_event_id:id});await rpc(c.B,'register_for_event',{p_event_id:id})
  const reconnect=c.A.channel('qa-r6-recovery').on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'recipient_id=eq.'+owner},p=>{if(p.new.event_id===id)received.A.push(p.new.id)});channels.push([c.A,reconnect])
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('reconnect timeout')),30000);reconnect.subscribe(s=>{if(s==='SUBSCRIBED'){clearTimeout(timer);resolve()}})})
  rows=await read();assert.equal(rows.length,4);assert.equal(new Set(rows.map(r=>r.id)).size,4)
  const inbox=await rpc(c.A,'get_notifications',{p_before_at:null,p_before_id:null});const notices=inbox.filter(r=>rows.some(x=>x.id===r.id));assert.equal(notices.length,4);assert.ok(notices.every(n=>n.title===m.events.realtime.title&&n.target))
  // Positive owner acknowledgement precedes this bounded negative window.
  await delay(15000)
  for(const role of ['B','C','D'])assert.deepEqual(received[role],[])
  results.push({test:'Reconnect recovers four unique notices by authorized inbox query; 15s after positive delivery B/C/D receive none',result:'PASS'})
  await evidence('realtime',results,{episodes:4,received_counts:Object.fromEntries(Object.entries(received).map(([k,v])=>[k,v.length])),negative_window_ms:15000,subscription_timeout_ms:30000,raw_payloads:'Not recorded; synthetic notification identifiers only used in memory'})
 }catch(e){results.push({test:'Realtime assertion failure',result:'FAIL',reason:e.message?.slice(0,200)});await evidence('realtime',results);throw e}
 finally{await Promise.allSettled(channels.map(([client,channel])=>client.removeChannel(channel)));await logout(c)}
}
