import assert from 'node:assert/strict'
import {attendeesCsv,statisticsCsv} from '../../src/features/analytics/csv.ts'
import {load,identities,logout,rpc,client,event,today,dayAfter,evidence} from './common.mjs'
export async function http(){
 const m=await load(),c=await identities(m),results=[]
 const record=test=>results.push({test,result:'PASS'})
 try{
  const id=event(m,'occupancy'),demo=event(m,'demo'),other=event(m,'compare'),from=today()+'T00:00:00',to=dayAfter(today())+'T00:00:00'
  const ops=[['get_my_event_occupancy',{p_event_id:id}],['get_my_event_demographics',{p_event_id:demo}],['get_my_event_participation_series',{p_event_id:id,p_from:from,p_to:to,p_bucket:'day'}],['get_my_event_export_rows',{p_event_id:id}],['get_my_events_occupancy',{p_event_ids:[id,other]}]]
  for(const role of ['B','C','D','anon']){
   const actor=role==='anon'?client():c[role]
   for(const [name,args] of ops){const r=await actor.rpc(name,args);assert.ok(r.error,'Non-owner must be denied');assert.equal(r.data,null)}
   if(role!=='anon'){
    for(const name of ['get_my_event_occupancy','get_my_event_demographics','get_my_event_export_rows']){const r=await actor.rpc(name,{p_event_id:event(m,'hidden')});assert.ok(r.error);assert.equal(r.data,null)}
    const profiles=await actor.from('profiles').select('id,birth_date,sex').eq('id',m.users.A.id);assert.equal(profiles.error,null);assert.deepEqual(profiles.data,[])
    const notes=await actor.from('notifications').select('id').eq('recipient_id',m.users.A.id);assert.equal(notes.error,null);assert.deepEqual(notes.data,[])
   }
   record(`Real HTTPS ${role}: all five owner RPC denied, link-only/follow not authority; direct profile/notice isolation where authenticated`)
  }
  const a=await rpc(c.A,'get_my_event_occupancy',{p_event_id:id});assert.equal(a.confirmed_count,4);assert.equal(a.capacity,10);assert.equal(a.available_spots,6);assert.equal(a.occupancy_percent,40)
  const batch=await rpc(c.A,'get_my_events_occupancy',{p_event_ids:[id,other]});assert.equal(batch.events[0].confirmed_count,4);assert.equal(batch.events[0].occupancy_percent,40);assert.equal(batch.events[1].confirmed_count,10);assert.equal(batch.events[1].occupancy_percent,50)
  const empty=await rpc(c.A,'get_my_event_occupancy',{p_event_id:event(m,'empty')});assert.equal(empty.confirmed_count,0)
  for(const state of ['cancelled','archived'])assert.equal((await rpc(c.A,'get_my_event_occupancy',{p_event_id:event(m,state)})).event_state,state)
  assert.equal((await rpc(c.A,'get_my_event_occupancy',{p_event_id:event(m,'hidden')})).event_id,event(m,'hidden'))
  record('Owner actual 4/10=40%,10/20=50%, batch parity, empty,hidden,cancelled,archived')
  for(const ids of [[id,event(m,'foreign')],[id,id],[id]]){const r=await c.A.rpc('get_my_events_occupancy',{p_event_ids:ids});assert.ok(r.error);assert.equal(r.data,null)}
  assert.equal((await rpc(c.D,'get_my_event_occupancy',{p_event_id:event(m,'foreign')})).capacity,3)
  record('Comparison mixed ownership rejects whole response; duplicate/single IDs rejected; D owns only foreign fixture')
  const d=await rpc(c.A,'get_my_event_demographics',{p_event_id:demo});assert.equal(d.age.state,'available');assert.equal(d.sex.state,'available');assert.equal(d.sex.groups.reduce((n,g)=>n+g.count,0),10);assert.ok(d.sex.groups.every(g=>g.count===0||g.count>=5))
  const small=await rpc(c.A,'get_my_event_demographics',{p_event_id:event(m,'small')});assert.equal(small.age.state,'available');assert.equal(small.sex.state,'available');assert.equal(small.age.groups.reduce((n,g)=>n+g.count,0),1);assert.equal(small.sex.groups.reduce((n,g)=>n+g.count,0),1)
  assert.deepEqual(Object.keys(d).sort(),['age','age_as_of','as_of','event_id','sex'].sort())
  record('Demographics 5+5 exact grouped counts; cohort1 visible in each dimension; strict safe DTO')
  const series=await rpc(c.A,'get_my_event_participation_series',{p_event_id:id,p_from:from,p_to:to,p_bucket:'day'})
  assert.equal(series.points.length,1);assert.ok(series.points[0].new_confirmations>=5);assert.ok(series.points[0].reconfirmations>=1);assert.ok(series.points[0].departures>=2)
  const past=await rpc(c.A,'get_my_event_participation_series',{p_event_id:id,p_from:dayAfter(today(),-1)+'T00:00:00',p_to:from,p_bucket:'day'});assert.ok(past.points.every(p=>p.new_confirmations===0&&p.reconfirmations===0&&p.departures===0))
  const invalid=await c.A.rpc('get_my_event_participation_series',{p_event_id:id,p_from:to,p_to:from,p_bucket:'day'});assert.ok(invalid.error);assert.equal(invalid.data,null)
  record('Real history separates new/rejoin/departures; different interval empty; reversed interval rejected')
  const exported=await rpc(c.A,'get_my_event_export_rows',{p_event_id:id});assert.equal(exported.rows.length,4)
  const csv=attendeesCsv(exported),stats=statisticsCsv(m.events.occupancy.title,series,await rpc(c.A,'get_my_event_demographics',{p_event_id:id}))
  assert.ok(csv.startsWith('\ufeff'));assert.ok(stats.startsWith('\ufeff'));assert.ok(csv.includes('fecha_primera_inscripcion'));assert.ok(stats.includes('reincorporaciones'))
  for(const text of [csv,stats])assert.doesNotMatch(text,/birth_date|email|password|access_token|refresh_token/)
  assert.ok(stats.includes('"'+series.points[0].new_confirmations+'"'))
  await rpc(c.B,'block_user',{p_target_id:m.users.A.id})
  const masked=await rpc(c.A,'get_my_event_export_rows',{p_event_id:id});assert.ok(masked.rows.some(r=>r.display_name==='Perfil no disponible'&&!r.username))
  await rpc(c.B,'unblock_user',{p_target_id:m.users.A.id})
  record('Both CSV serializers on real authorized RPC snapshots; totals match and no private columns; R5 blocked participant masked')
  const {data:ownPart,error:partError}=await c.B.from('event_participations').select('id').eq('event_id',id).eq('user_id',m.users.B.id).single();assert.equal(partError,null)
  const history=await c.C.from('participation_history').select('id').eq('participation_id',ownPart.id);assert.equal(history.error,null);assert.deepEqual(history.data,[])
  record('Direct REST history SELECT cannot expose another participation')
  const race=event(m,'race');const contenders=await Promise.all([c.B.rpc('register_for_event',{p_event_id:race}),c.C.rpc('register_for_event',{p_event_id:race})]);assert.equal(contenders.filter(r=>!r.error).length,1);assert.equal(contenders.filter(r=>r.error).length,1);assert.equal((await rpc(c.A,'get_my_event_occupancy',{p_event_id:race})).confirmed_count,1)
  record('Two simultaneous real HTTP registrations compete for one seat: one commit,one rejection,no overbooking')
  await evidence('http',results,{measurements:{occupancy:{capacity:10,confirmed:4,available:6,percent:40},comparison:[40,50]},csv:'Actual authorized RPC payloads serialized; actual browser downloads checked in UI stage',boundary_scope:'Remote timestamps are generated by normal RPCs; historical calendar boundary fixtures remain local, not backdated remotely'})
 }catch(e){results.push({test:'HTTP assertion failure',result:'FAIL',reason:e.message?.slice(0,200)});await evidence('http',results);throw e}
 finally{await c.B.rpc('unblock_user',{p_target_id:m.users.A.id});await logout(c)}
}
