import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { homedir } from 'node:os'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? resolve(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
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
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-9/ui'
await mkdir(out,{recursive:true})
const viewer='20000000-0000-4000-8000-000000000001', target='50000000-0000-4000-8000-000000000001'
const user={id:viewer,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const session={access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}
const results=[],errors=[];let failure,lastPage;
try {
 for(const width of process.env.PLANIT_DM_WIDTH?[Number(process.env.PLANIT_DM_WIDTH)]:[320,360,375,390,768,1280]) {
  const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Tokyo',reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value)),session);
  const conversation='96000000-0000-4000-8000-000000000001',sockets=[];
  let blockedByMe=false,blockWrites=0,unblockWrites=0,lostBlock=false,commitBlock=true,blockDelay=0;
  let blocked=false,denied=false,network=false,lost=false,commit=true,_writes=0,_reads=0;
  const seed=i=>({id:'97000000-0000-4000-8000-'+String(i).padStart(12,'0'),sender_id:target,body:'Mensaje fixture '+i,created_at:'2026-10-14T10:00:00'});
  let rows=Array.from({length:34},(_,i)=>seed(i+1));
  await context.routeWebSocket('wss://iepeqmvzjguwlhnecsdq.supabase.co/realtime/**',ws=>{
   const socket={ws,joins:new Map()};sockets.push(socket);
   ws.onMessage(raw=>{const [joinRef,ref,topic,event,payload]=JSON.parse(String(raw));
    if(event==='phx_join') {const bindings=(payload.config?.postgres_changes??[]).map((b,i)=>({...b,id:i+1}));socket.joins.set(topic,{joinRef,bindings});ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:bindings}}]));}
    if(event==='phx_leave') {socket.joins.delete(topic);ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));}
    if(event==='heartbeat') ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));
   });ws.onClose(()=>socket.joins.clear());
  });
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
   const url=new URL(route.request().url()),path=url.pathname,args=route.request().postDataJSON();
   const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(path==='/auth/v1/user') return reply(user);
   if(path==='/auth/v1/logout') return reply({});
   if(path==='/rest/v1/profiles') return reply({username:'fixture_me',display_name:'Mi cuenta fixture',first_name:null,last_name:null,birth_date:null,sex:null,bio:null,visibility:'private',avatar_file_id:null});
   if(network&&path.includes('/rest/')) return route.abort('failed');
   if(path.endsWith('/block_user')||path.endsWith('/unblock_user')) {assert.deepEqual(args,{p_target_id:target});const blocking=path.endsWith('/block_user');if(blocking)blockWrites++;else unblockWrites++;if(commitBlock){blocked=blocking;blockedByMe=blocking;}if(blockDelay) await new Promise(r=>setTimeout(r,blockDelay));if(lostBlock){lostBlock=false;return route.abort('failed');}return reply(null);}
   if(path.endsWith('/get_social_profile')) return reply(blocked?{unavailable:true}:{display_name:'Persona privada',username:'persona',avatar:null,email:'PRIVATE_SENTINEL'});
   if(path.endsWith('/get_social_relationship')) return reply(blocked?{unavailable:true,blocked_by_me:blockedByMe}:{visibility:'private',follow:null});
   if(path.endsWith('/get_social_counts')) return reply({followers:0,following:0});
   if(path.endsWith('/get_or_create_direct_conversation')) {assert.deepEqual(args,{p_target_id:target});return reply(conversation);}
   if(path.endsWith('/list_direct_conversations')) return reply({conversations:[{id:conversation,created_at:'2026-10-14T09:00:00',peer_id:target,read_only:blocked}],next_cursor:null});
   if(path==='/rest/v1/conversations') {assert.equal(url.searchParams.get('select'),'user_low_id,user_high_id');assert.equal(url.searchParams.get('kind'),'eq.direct');return reply(denied?null:{user_low_id:viewer,user_high_id:target});}
   if(path.endsWith('/get_direct_messages')) {
    _reads++;assert.equal(args.p_conversation_id,conversation);assert.equal(args.p_limit,30);
    if(denied) return reply({code:'42501'},403);
    const selected=[...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id)).filter(r=>!args.p_before_id||r.created_at<args.p_before_at||(r.created_at===args.p_before_at&&r.id<args.p_before_id));
    return reply({messages:selected.slice(0,30).map(r=>({...r,email:'PRIVATE_SENTINEL'})),next_cursor:selected.length>30?{id:selected[29].id,created_at:selected[29].created_at}:null});
   }
   if(path.endsWith('/send_direct_message')) {
    _writes++;assert.deepEqual(Object.keys(args).sort(),['p_body','p_conversation_id','p_message_id']);
    if(blocked) return reply({code:'42501'},403);
    if(commit&&!rows.some(r=>r.id===args.p_message_id)) rows.push({id:args.p_message_id,sender_id:viewer,body:args.p_body.trim(),created_at:'2026-10-14T11:00:00'});
    if(lost) {lost=false;return route.abort('failed');}return reply(args.p_message_id);
   }
   if(path==='/rest/v1/messages') {assert.equal(url.searchParams.get('select'),'id,sender_id,body,created_at');return reply(rows.find(r=>'eq.'+r.id===url.searchParams.get('id'))??null);}
   return reply([]);
  });
  const page=await context.newPage();lastPage=page;page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  const button=name=>page.getByRole('button',{name,exact:true});
  const loaded=()=>page.locator('.chat-composer').waitFor();
  const check=test=>{results.push({width,test,result:'PASS'});console.log('PASS '+width+': '+test)};
  const shot=async name=>{if(process.env.PLANIT_BLOCKS_SCREENSHOTS!=='false'&&[390,1280].includes(width)) await page.screenshot({path:out+'/'+name+'-'+width+'.png'});};

  await page.goto(origin+'/users/'+target);await button('Bloquear usuario').waitFor();await shot('profile-before');
  await button('Bloquear usuario').click();await page.getByRole('dialog').waitFor();assert.ok(await button('Cancelar').evaluate(e=>e===document.activeElement));await shot('block-confirm');
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.ok(await button('Bloquear usuario').evaluate(e=>e===document.activeElement));assert.equal(blockWrites,0);
  await button('Bloquear usuario').click();await button('Cancelar').click();assert.equal(blockWrites,0);check('Confirmation initial focus,Escape,cancel restore focus without writing');
  await button('Bloquear usuario').click();await button('Confirmar bloqueo').click();await button('Desbloquear usuario').waitFor();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();assert.equal(await page.getByText('@persona',{exact:true}).count(),0);assert.equal(await button('Enviar mensaje').count(),0);assert.equal(await button('Solicitar seguimiento').count(),0);assert.equal(blockWrites,1);await shot('profile-blocked');
  await page.reload();await button('Desbloquear usuario').waitFor();check('Block and reload neutral profile without identity,follow,DM;owner can unblock without projection');
  await button('Desbloquear usuario').click();await shot('unblock-confirm');await button('Confirmar desbloqueo').click();await button('Bloquear usuario').waitFor();await button('Enviar mensaje').waitFor();assert.equal(unblockWrites,1);assert.ok(await button('Solicitar seguimiento').isVisible());
  await button('Enviar mensaje').click();await loaded();assert.equal(new URL(page.url()).pathname,'/messages/'+conversation);await button('Bloquear usuario').waitFor();await button('Bloquear usuario').click();await button('Confirmar bloqueo').click();await button('Desbloquear usuario').waitFor();await page.getByText(/Perfil no disponible · Conversación/).waitFor();assert.ok(await page.locator('#direct-text').isDisabled());assert.ok(await page.locator('.chat-bubble').count()>0);assert.equal(await page.getByText('Persona privada',{exact:true}).count(),0);await shot('chat-blocked');
  await button('Desbloquear usuario').click();await button('Confirmar desbloqueo').click();await button('Bloquear usuario').waitFor();await loaded();assert.equal(new URL(page.url()).pathname,'/messages/'+conversation);assert.equal(await page.locator('#direct-text').isDisabled(),false);check('Same canonical DM/history after unblock;read-only during block;no follow restore');
  await page.goto(origin+'/users/'+target);await button('Bloquear usuario').waitFor();lostBlock=true;commitBlock=true;await button('Bloquear usuario').click();await button('Confirmar bloqueo').click();await button('Consultar estado').waitFor();assert.equal(await page.getByText('@persona',{exact:true}).count(),0);const writesBefore=blockWrites;await shot('uncertain');await button('Cerrar').click();await button('Consultar estado del bloqueo').click();await button('Consultar estado').click();await button('Desbloquear usuario').waitFor();assert.equal(blockWrites,writesBefore);check('Lost committed response hides identity;close/reopen checks state without duplicate write');
  await button('Desbloquear usuario').click();await button('Confirmar desbloqueo').click();await button('Bloquear usuario').waitFor();lostBlock=true;commitBlock=false;await button('Bloquear usuario').click();await button('Confirmar bloqueo').click();await button('Consultar estado').click();await page.getByText('El cambio no figura completado. Podés volver a confirmarlo.',{exact:true}).waitFor();commitBlock=true;await button('Confirmar bloqueo').click();await button('Desbloquear usuario').waitFor();check('Uncommitted response reconciles before explicit retry');
  await button('Desbloquear usuario').click();await button('Confirmar desbloqueo').click();await button('Bloquear usuario').waitFor();blocked=true;blockedByMe=false;await button('Actualizar perfil').click();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();await page.waitForTimeout(100);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(300);assert.equal(await button('Desbloquear usuario').count(),0);assert.equal(await button('Bloquear usuario').count(),0);check('Counterparty block never offers unblock or identity');
  blocked=false;network=true;await button('Actualizar perfil').click();await button('Reintentar opciones').waitFor();network=false;await button('Reintentar opciones').click();await button('Actualizar perfil').click();await button('Bloquear usuario').waitFor();await shot('recovered');check('Network failure clears options and retry recovers');
  if(width===390) {blockDelay=12000;const before=blockWrites;await button('Bloquear usuario').click();await button('Confirmar bloqueo').dblclick();assert.equal(blockWrites,before+1);assert.ok(await button('Cancelar').isDisabled());await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),1);await button('Consultar estado').waitFor({timeout:15000});assert.equal(await page.getByText('@persona',{exact:true}).count(),0);blockDelay=0;await button('Consultar estado').click();await button('Desbloquear usuario').waitFor();assert.equal(blockWrites,before+1);await button('Desbloquear usuario').click();await button('Confirmar desbloqueo').click();await button('Bloquear usuario').waitFor();check('Real10s timeout,double confirm suppressed,pending Escape safe,reconcile committed block without retry');}
  await button('Bloquear usuario').click();await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width,height:400});assert.ok(await button('Confirmar bloqueo').isVisible());await shot('short-text');await button('Cancelar').click();await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width,height:900});check('Text200%,short viewport,scrollable dialog,no horizontal overflow');
  await page.goto(origin+'/users/'+viewer);await page.waitForURL('**/me');assert.equal(await button('Bloquear usuario').count(),0);assert.equal(await button('Desbloquear usuario').count(),0);assert.equal((await page.locator('body').textContent()).includes('PRIVATE_SENTINEL'),false);assert.equal(errors.length,0);check('Self redirects to own profile,no block control,allowlisted payload');await context.close();
 }
} catch(error) {failure={message:error.message,stack:error.stack,body:await lastPage?.locator('body').textContent()};await lastPage?.screenshot({path:out+'/failure.png'});throw error}
finally {await writeFile(out+'/ui-results.json',JSON.stringify({base:'65b46ab69d6f7b75a0f9996b0d091395c0bffab6',branch:'codex/r5-block-9',environment:'Actual Vite build + Edge headless; explicit Auth/REST/WebSocket fixtures; NOT real JWT/RLS transport or physical mobile',results,errors,failure,result:failure?'FAIL':'PASS'},null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
