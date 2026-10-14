import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless:true, channel:'msedge', args:['--no-proxy-server'] })
// Serve the actual Vite build; same-process server avoids optimizer/proxy races.
const root=resolve(process.env.PLANIT_UI_BUILD??'dist')
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'}
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname
  const file=resolve(root,`.${path}`)
  if(!file.startsWith(root)) {res.writeHead(403);res.end();return}
  try {res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file))}
  catch {res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const origin=process.env.PLANIT_UI_ORIGIN??`http://127.0.0.1:${server.address().port}`
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-8/message-notifications/ui'
await mkdir(out,{recursive:true})
const viewer='20000000-0000-4000-8000-000000000001', target='50000000-0000-4000-8000-000000000001'
const user={id:viewer,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const session={access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}
const results=[],errors=[],sockets=[];let failure;
const conversation='93000000-0000-4000-8000-000000000001';
let notices=[],messages=[],blocked=false,unsafeTarget=false;
const emit=row=>{for(const socket of sockets) for(const [topic,join] of socket.joins) {
 const bindings=join.bindings.filter(b=>b.table==='notifications'&&b.event==='INSERT'&&b.filter==='recipient_id=eq.'+viewer);
 if(socket.id===viewer&&bindings.length) socket.ws.send(JSON.stringify([join.joinRef,null,topic,'postgres_changes',{ids:bindings.map(b=>b.id),data:{schema:'public',table:'notifications',type:'INSERT',commit_timestamp:'2026-10-14T20:00:00Z',errors:null,columns:[],record:row,old_record:{}}}]));
}};
async function setup(id,width) {
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 await context.addInitScript(value=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value)),{...session,access_token:'fixture-'+id,user:{...user,id}});
 await context.routeWebSocket('wss://iepeqmvzjguwlhnecsdq.supabase.co/realtime/**',ws=>{
  const socket={ws,id,joins:new Map()};sockets.push(socket);
  ws.onMessage(raw=>{const [joinRef,ref,topic,event,payload]=JSON.parse(String(raw));
   if(event==='phx_join') {const bindings=(payload.config?.postgres_changes??[]).map((binding,index)=>({...binding,id:index+1}));socket.joins.set(topic,{joinRef,bindings});ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:bindings}}]));}
   else if(event==='phx_leave') {socket.joins.delete(topic);ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));}
   else if(event==='heartbeat') ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));
  });ws.onClose(()=>socket.joins.clear());
 });
 await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname,args=route.request().postDataJSON();
  const reply=data=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/auth/v1/user') return reply({...user,id});
  if(path==='/rest/v1/notifications') return route.fulfill({status:200,headers:{'access-control-expose-headers':'content-range','content-range':'0-0/'+(id===viewer?notices.filter(n=>!n.read_at).length:0)},body:''});
  if(path.endsWith('/get_notifications')) return reply(id===viewer?notices:[]);
  if(path.endsWith('/get_notification_changes')) return reply(id===viewer?notices.filter(n=>args.p_ids.includes(n.id)):[]);
  if(path.endsWith('/mark_notification_read')) {const row=notices.find(n=>n.id===args.p_id);assert.equal(id,viewer);row.read_at='2026-10-14T18:00:00';return reply(row.read_at);}
  if(path.endsWith('/get_notification_target')) return reply(unsafeTarget?'https://example.invalid/unsafe':id===viewer?'/messages/'+conversation:null);
  if(path==='/rest/v1/conversations') return reply({user_low_id:viewer,user_high_id:target});
  if(path.endsWith('/get_social_profile')) return reply(blocked?{unavailable:true}:{display_name:'Perfil fixture',username:'perfil_fixture',avatar:null});
  if(path.endsWith('/get_social_relationship')) return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility:'private',follow:null});
  if(path.endsWith('/get_direct_messages')) return reply({messages:[...messages].reverse(),next_cursor:null});
  if(path.endsWith('/send_direct_message')) {
   assert.equal(id,target);assert.equal(args.p_conversation_id,conversation);
   if(!messages.some(m=>m.id===args.p_message_id)) {
    messages.push({id:args.p_message_id,sender_id:target,body:args.p_body,created_at:'2026-10-14T17:00:00'});
    const row={id:args.p_message_id,type:'direct_message',title:'Nuevo mensaje privado',body:'Recibiste un mensaje privado. Abrí la conversación para leerlo.',created_at:'2026-10-14T17:00:00',read_at:null,target:'/messages/'+conversation};notices.push(row);emit(row);
   }return reply(args.p_message_id);
  }
  return reply([]);
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));return {context,page};
}
try {
 for(const width of [390,1280]) {
  notices=[];messages=[];blocked=false;unsafeTarget=false;
  const receiver=await setup(viewer,width),sender=await setup(target,width);
  await receiver.page.goto(origin+'/notifications');await receiver.page.getByRole('heading',{name:'Todavía no tenés notificaciones',exact:true}).waitFor();
  await sender.page.goto(origin+'/messages/'+conversation);await sender.page.locator('#direct-text').fill('PRIVATE_BODY_SENTINEL');await sender.page.getByRole('button',{name:'Enviar',exact:true}).click();
  await receiver.page.getByRole('heading',{name:'Nuevo mensaje privado',exact:true}).waitFor();await receiver.page.getByRole('link',{name:'Notificaciones, 1 no leídas',exact:true}).waitFor();
  await receiver.page.getByText('Mensaje privado',{exact:true}).waitFor();assert.equal(await sender.page.locator('.notifications-badge').count(),0);
  assert.ok(!(await receiver.page.locator('body').textContent()).includes('PRIVATE_BODY_SENTINEL'));assert.ok(!(await receiver.page.locator('body').textContent()).includes('Perfil fixture'));
  emit(notices[0]);await receiver.page.getByRole('button',{name:'Ver mensaje',exact:true}).waitFor();assert.equal(await receiver.page.locator('.notification-row').count(),1);
  await receiver.page.screenshot({path:out+'/dm-notice-'+width+'.png'});
  blocked=true;await receiver.page.getByRole('button',{name:'Ver mensaje',exact:true}).click();await receiver.page.waitForURL('**/messages/'+conversation);await receiver.page.getByText(/Perfil no disponible · Conversación/).waitFor();assert.ok(await receiver.page.locator('#direct-text').isDisabled());assert.ok(notices[0].read_at);
  await receiver.page.goto(origin+'/notifications');await receiver.page.getByText('Leído',{exact:true}).waitFor();await receiver.page.waitForFunction(()=>!document.querySelector('.notifications-badge'));
  unsafeTarget=true;await receiver.page.getByRole('button',{name:'Ver mensaje',exact:true}).click();await receiver.page.getByText('El recurso ya no está disponible o no tenés permiso para consultarlo.',{exact:true}).waitFor();assert.ok(receiver.page.url().endsWith('/notifications'));
  await receiver.page.screenshot({path:out+'/safe-target-'+width+'.png'});
  for(const fixture of [receiver,sender]) {assert.ok(await fixture.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await fixture.context.close();}
  results.push({width,result:'PASS',test:'Send DM→recipient notification WebSocket+badge;sender excluded;generic safe content;dedup;mark read;Ver mensaje opens blocked historical DM;unsafe target rejected'});
  console.log('PASS '+width+': direct message notification realtime fixture');
 }
 assert.deepEqual(errors,[]);
} catch(error) {failure=error.stack;throw error}
finally {await writeFile(out+'/results.json',JSON.stringify({environment:'Actual Vite build + SDK; fixture Auth/REST/Phoenix WebSocket; not real JWT/RLS/Realtime',results,errors,failure,result:failure?'FAIL':'PASS'},null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
