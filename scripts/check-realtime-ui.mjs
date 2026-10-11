import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({headless:true,channel:'msedge'})
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4191'
const output = process.env.PLANIT_REALTIME_UI_OUTPUT ?? 'docs/design/verification/realtime'; await mkdir(output,{recursive:true})
const a='20000000-0000-4000-8000-000000000001', b='20000000-0000-4000-8000-000000000002'
const event='30000000-0000-4000-8000-000000000001', conversation='50000000-0000-4000-8000-000000000001'
const event2='30000000-0000-4000-8000-000000000002',conversation2='50000000-0000-4000-8000-000000000002'
const key='sb-iepeqmvzjguwlhnecsdq-auth-token'
const user=id=>({id,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'})
const session=id=>({access_token:'fixture-'+id,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:user(id)})
const results=[]; const check=test=>{console.log('PASS fixture: '+test);results.push({test,result:'PASS',environment:'React + Supabase SDK; intercepted HTTP and Phoenix WebSocket, no remote delivery proof'})}
let rows=Array.from({length:65},(_,n)=>({id:'40000000-0000-4000-8000-'+String(n).padStart(12,'0'),sender_id:b,display_name:'Sofía fixture',username:'sofia',body:'Mensaje '+n,created_at:'2026-10-11T12:00:00.'+String(n).padStart(6,'0')}))
let notices=Array.from({length:35},(_,n)=>({id:'60000000-0000-4000-8000-'+String(n).padStart(12,'0'),type:'system',title:'Aviso '+n,body:'Fixture',read_at:null,created_at:'2026-10-11T12:00:00.'+String(n).padStart(6,'0'),target:null}))
const sockets=[], errors=[]; let denied=false, closed=false, release=null, delayNext=false, listCalls=0
async function setup(id,viewport) {
 const context=await browser.newContext({viewport,timezoneId:'Asia/Tokyo'})
 await context.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:session(id)})
 await context.routeWebSocket('**/realtime/v1/websocket**', ws=>{
   const socket={ws,joins:new Map(),id};sockets.push(socket)
   ws.onMessage(raw=>{
     const [joinRef,ref,topic,type,payload]=JSON.parse(String(raw))
     if(type==='phx_join') {
       const bindings=(payload.config?.postgres_changes??[]).map((binding,index)=>({...binding,id:index+1}))
       socket.joins.set(topic,{joinRef,bindings})
       ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:bindings}}]))
     } else if(type==='phx_leave') {socket.joins.delete(topic);ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]))}
     else if(type==='heartbeat') ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]))
   })
   ws.onClose(()=>socket.joins.clear())
 })
 await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
   const req=route.request(), url=new URL(req.url());const identity=req.headers().authorization?.includes(b)?b:a
   const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
   if(url.pathname==='/auth/v1/user') return reply(user(identity))
   if(url.pathname==='/auth/v1/logout') return reply({})
   if(url.pathname==='/rest/v1/notifications') return route.fulfill({status:200,headers:{'access-control-expose-headers':'content-range','content-range':'0-0/'+(identity===a?notices.filter(row=>!row.read_at).length:0)},contentType:'application/json',body:''})
   if(url.pathname.endsWith('/get_event_chat')) return denied?reply({message:'chat_unavailable',code:'42501'},403):reply([{conversation_id:req.postDataJSON().p_event_id===event2?conversation2:conversation,title:'Chat fixture',event_state:closed?'ended':'open'}])
   if(url.pathname.endsWith('/get_event_chat_messages')) {
     listCalls++;const p=req.postDataJSON();if(p.p_event_id===event2)return reply([{...rows[0],id:'90000000-0000-4000-8000-000000000001',body:'Otro evento'}]);const snapshot=[...rows].reverse().filter(row=>!p.p_before_id||row.created_at<p.p_before_at||row.created_at===p.p_before_at&&row.id<p.p_before_id).slice(0,51)
     if(delayNext){delayNext=false;await new Promise(resolve=>{release=resolve})}
     return reply(snapshot)
   }
   if(url.pathname.endsWith('/send_event_chat_message')) {
     const p=req.postDataJSON();if(!rows.some(row=>row.id===p.p_message_id)) rows.push({id:p.p_message_id,sender_id:identity,display_name:'Vos',username:'yo',body:p.p_body,created_at:'2026-10-11T13:00:00.000000'})
     emit('messages','INSERT',rows.at(-1));return reply(p.p_message_id)
   }
   if(url.pathname.endsWith('/get_notifications')) {const p=req.postDataJSON(),sorted=[...notices].reverse();const start=p.p_before_id?sorted.findIndex(row=>row.id===p.p_before_id)+1:0;return reply(identity===a?sorted.slice(start,start+31):[])}
   if(url.pathname.endsWith('/get_notification_changes')) return reply(identity===a?notices.filter(row=>req.postDataJSON().p_ids.includes(row.id)):[])
   if(url.pathname.endsWith('/mark_notification_read')) {const row=notices.find(row=>row.id===req.postDataJSON().p_id);row.read_at='2026-10-11T14:00:00';emit('notifications','UPDATE',row);return reply(row.read_at)}
   return reply([])
 })
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message))
 return {context,page}
}
function emit(table,type,row) {
 for(const socket of sockets) for(const [topic,join] of socket.joins) {
   const bindings=join.bindings.filter(binding=>binding.table===table&&binding.event===type&&(table!=='notifications'||binding.filter==='recipient_id=eq.'+a)&&(table!=='messages'||binding.filter==='conversation_id=eq.'+(row.conversation_id??conversation)))
   if(bindings.length)socket.ws.send(JSON.stringify([join.joinRef,null,topic,'postgres_changes',{ids:bindings.map(binding=>binding.id),data:{schema:'public',table,type,commit_timestamp:'2026-10-11T16:00:00Z',errors:null,columns:[],record:row,old_record:{}}}]))
 }
}
function recoverChannels() {for(const socket of sockets) for(const [topic,join] of socket.joins) socket.ws.send(JSON.stringify([join.joinRef,null,topic,'phx_error',{}]))}
try {
 const A=await setup(a,{width:375,height:812}),B=await setup(b,{width:1280,height:900})
 await Promise.all([A.page.goto(origin+'/events/'+event+'/chat'),B.page.goto(origin+'/events/'+event+'/chat')])
 await Promise.all([A.page.getByText('Mensajes en tiempo real.').waitFor(),B.page.getByText('Mensajes en tiempo real.').waitFor()])
 for(const id of [a,b]) {const joined=sockets.filter(socket=>socket.id===id).flatMap(socket=>[...socket.joins.keys()]);assert.equal(joined.filter(topic=>topic.includes('chat:')).length,1);assert.equal(joined.filter(topic=>topic.includes('notifications:')).length,1)}
 await A.page.getByLabel('Mensaje',{exact:true}).fill('Texto conservado')
 await B.page.getByLabel('Mensaje',{exact:true}).fill('Enviado por B');await B.page.getByRole('button',{name:'Enviar',exact:true}).click()
 await A.page.getByText('Enviado por B',{exact:true}).waitFor();await B.page.getByText('Enviado por B',{exact:true}).waitFor()
 assert.equal(await B.page.getByText('Enviado por B',{exact:true}).count(),1);assert.equal(await A.page.getByLabel('Mensaje',{exact:true}).inputValue(),'Texto conservado')
 check('two authorized fixture sessions receive persisted RPC message via WebSocket without refresh; own echo deduplicates; textarea preserved')
 await A.page.getByRole('button',{name:'Cargar mensajes anteriores'}).click();await A.page.getByText('Mensaje 0',{exact:true}).waitFor()
 await A.page.locator('.chat-messages').evaluate(element=>element.scrollTop=0)
 const add=(n)=>{const row={...rows[0],id:'70000000-0000-4000-8000-'+String(n).padStart(12,'0'),body:'Ráfaga '+n,created_at:'2026-10-11T14:00:00.'+String(n).padStart(6,'0')};rows.push(row);return row}
 for(let n=0;n<12;n++)emit('messages','INSERT',add(n))
 await A.page.getByText('Ráfaga 11',{exact:true}).waitFor();assert.equal(await A.page.locator('.chat-messages').evaluate(element=>element.scrollTop),0)
 assert.equal(await A.page.getByText('Mensaje 0',{exact:true}).count(),1)
 check('bursts preserve order, UUID uniqueness, loaded older history and reader scroll position')
 delayNext=true;emit('messages','INSERT',add(12));await A.page.waitForTimeout(100)
 for(let n=13;n<20;n++)emit('messages','INSERT',add(n))
 if(release){release();release=null}
 await A.page.getByText('Ráfaga 19',{exact:true}).waitFor()
 for(let n=20;n<140;n++)add(n)
 recoverChannels();await A.page.getByText('Ráfaga 139',{exact:true}).waitFor()
 assert.equal(await A.page.getByText('Ráfaga 20',{exact:true}).count(),1)
 check('events during delayed query reconcile again; reconnect recovers 120 persisted messages across multiple pages')
 await A.page.getByText('Mensajes en tiempo real.').waitFor();
 await A.page.screenshot({path:output+'/chat-mobile.png',fullPage:true});await B.page.screenshot({path:output+'/chat-desktop.png',fullPage:true})
 await B.page.evaluate(path=>{history.pushState(null,'',path);window.dispatchEvent(new PopStateEvent('popstate'))},'/events/'+event2+'/chat')
 await B.page.getByText('Otro evento',{exact:true}).waitFor();assert.equal(await B.page.getByText('Mensaje 0',{exact:true}).count(),0)
 emit('messages','INSERT',add(140));await A.page.getByText('Ráfaga 140',{exact:true}).waitFor();assert.equal(await B.page.getByText('Ráfaga 140',{exact:true}).count(),0)
 await B.page.getByLabel('Mensaje',{exact:true}).fill('Texto de cuenta B')
 await B.page.evaluate(({key,value})=>{const oldValue=localStorage.getItem(key),newValue=JSON.stringify(value);localStorage.setItem(key,newValue);window.dispatchEvent(new StorageEvent('storage',{key,oldValue,newValue,storageArea:localStorage}));const channel=new BroadcastChannel(key);channel.postMessage({event:'SIGNED_IN',session:value});channel.close()},{key,value:session(a)})
 await B.page.waitForFunction(()=>document.querySelector('#chat-text')?.value==='');await B.page.getByText('Otro evento',{exact:true}).waitFor()
 check('StrictMode retains one channel per scope; changing event unsubscribes previous conversation; account change remounts private chat state')
 closed=true;await A.page.evaluate(()=>window.dispatchEvent(new Event('focus')));await A.page.getByText('Evento finalizado · Chat de sólo lectura.').waitFor();assert.equal(await A.page.locator('#chat-text').count(),0)
 denied=true;await A.page.evaluate(()=>window.dispatchEvent(new Event('focus')));await A.page.getByRole('heading',{name:'Chat no disponible'}).waitFor();assert.equal(await A.page.locator('.chat-messages').count(),0);denied=false
 check('closed event is read only; detected membership denial clears private history and channel')
 await A.page.goto(origin+'/me');await A.page.getByRole('link',{name:/Notificaciones, 35 no leídas/}).waitFor()
 await A.page.getByRole('link',{name:/Notificaciones/}).click();await A.page.getByRole('heading',{name:'Aviso 34',exact:true}).waitFor()
 await A.page.getByRole('button',{name:'Ver más avisos'}).click();await A.page.getByRole('heading',{name:'Aviso 0',exact:true}).waitFor()
 const A2=await setup(a,{width:1280,height:900});await A2.page.goto(origin+'/notifications');await A2.page.getByRole('heading',{name:'Aviso 34',exact:true}).waitFor()
 const notice={...notices[0],id:'80000000-0000-4000-8000-000000000001',title:'Aviso nuevo',created_at:'2026-10-11T15:00:00'};notices.push(notice);emit('notifications','INSERT',notice)
 await A.page.getByRole('heading',{name:'Aviso nuevo',exact:true}).waitFor();await A2.page.getByRole('heading',{name:'Aviso nuevo',exact:true}).waitFor();assert.equal(await A.page.locator('.notification-row').count(),36)
 await A2.page.locator('.notification-row').first().getByRole('button',{name:'Marcar leído'}).click();await A.page.locator('.notification-row').first().getByText('Leído',{exact:true}).waitFor();await A.page.getByRole('link',{name:/Notificaciones, 35 no leídas/}).waitFor()
 check('notification INSERT and read UPDATE sync two tabs; retained pagination; exact badge includes rows beyond first page and works outside inbox')
 notices[0].read_at='2026-10-11T16:00:00';notices.push({...notice,id:'80000000-0000-4000-8000-000000000002',title:'Aviso perdido',created_at:'2026-10-11T16:00:00'})
 recoverChannels();await A.page.getByRole('heading',{name:'Aviso perdido',exact:true}).waitFor();await A.page.locator('.notification-row').last().getByText('Leído',{exact:true}).waitFor()
 await A.page.screenshot({path:output+'/notifications-mobile.png'});await A2.page.screenshot({path:output+'/notifications-desktop.png'})
 check('reconnect revalidates loaded read states and recovers notifications absent from WebSocket history')
 await A.page.evaluate(({key,value})=>{const oldValue=localStorage.getItem(key),newValue=JSON.stringify(value);localStorage.setItem(key,newValue);window.dispatchEvent(new StorageEvent('storage',{key,oldValue,newValue,storageArea:localStorage}));const channel=new BroadcastChannel(key);channel.postMessage({event:'SIGNED_IN',session:value});channel.close()},{key,value:session(b)})
 await A.page.getByRole('heading',{name:'Todavía no tenés notificaciones'}).waitFor();assert.equal(await A.page.locator('.notification-row').count(),0)
 assert.equal(await A.page.locator('.notifications-badge').count(),0)
 await A.page.getByRole('button',{name:'Salir',exact:true}).click();await A.page.waitForURL('**/login**')
 check('account change isolates rows/count/channels; logout clears private UI')
 for(const fixture of [A,B,A2]) {assert.equal(await fixture.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await fixture.context.close()}
 assert.deepEqual(errors,[]);assert.ok(listCalls>1);await writeFile(output+'/ui-results.json',JSON.stringify({results},null,2))
} finally { await browser.close() }
