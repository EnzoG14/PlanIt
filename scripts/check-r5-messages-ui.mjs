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
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-8/ui'
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
  let blocked=false,denied=false,network=false,lost=false,commit=true,writes=0,reads=0;
  const seed=i=>({id:'97000000-0000-4000-8000-'+String(i).padStart(12,'0'),sender_id:target,body:'Mensaje fixture '+i,created_at:`2026-10-${i <= 10 ? '12' : i <= 22 ? '13' : '14'}T10:00:00`});
  let rows=Array.from({length:34},(_,i)=>seed(i+1));
  await context.routeWebSocket('wss://iepeqmvzjguwlhnecsdq.supabase.co/realtime/**',ws=>{
   const socket={ws,joins:new Map()};sockets.push(socket);
   ws.onMessage(raw=>{const [joinRef,ref,topic,event,payload]=JSON.parse(String(raw));
    if(event==='phx_join') {const bindings=(payload.config?.postgres_changes??[]).map((b,i)=>({...b,id:i+1}));socket.joins.set(topic,{joinRef,bindings});ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:bindings}}]));}
    if(event==='phx_leave') {socket.joins.delete(topic);ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));}
    if(event==='heartbeat') ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));
   });ws.onClose(()=>socket.joins.clear());
  });
  function emit(row) {for(const s of sockets) for(const [topic,j] of s.joins) {const b=j.bindings.filter(b=>b.table==='messages');if(b.length) {assert.equal(b[0].filter,'conversation_id=eq.'+conversation);s.ws.send(JSON.stringify([j.joinRef,null,topic,'postgres_changes',{ids:b.map(x=>x.id),data:{schema:'public',table:'messages',type:'INSERT',commit_timestamp:'2026-10-14T20:00:00Z',errors:null,columns:[],record:row,old_record:{}}}]));}}}
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
   const url=new URL(route.request().url()),path=url.pathname,args=route.request().postDataJSON();
   const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(path==='/auth/v1/user') return reply(user);
   if(path==='/auth/v1/logout') return reply({});
   if(path==='/rest/v1/profiles') return reply({username:'fixture_me',display_name:'Mi cuenta fixture',first_name:null,last_name:null,birth_date:null,sex:null,bio:null,visibility:'private',avatar_file_id:null});
   if(network&&path.includes('/rest/')) return route.abort('failed');
   if(path.endsWith('/get_social_profile')) return reply(blocked?{unavailable:true}:{display_name:'Persona privada',username:'persona',avatar:null,email:'PRIVATE_SENTINEL'});
   if(path.endsWith('/get_social_relationship')) return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility:'private',follow:null});
   if(path.endsWith('/get_social_counts')) return reply({followers:0,following:0});
   if(path.endsWith('/get_or_create_direct_conversation')) {assert.deepEqual(args,{p_target_id:target});return reply(conversation);}
   if(path.endsWith('/list_direct_conversations')) return reply({conversations:[{id:conversation,created_at:'2026-10-14T09:00:00',peer_id:target,read_only:blocked}],next_cursor:null});
   if(path==='/rest/v1/conversations') {assert.equal(url.searchParams.get('select'),'user_low_id,user_high_id');assert.equal(url.searchParams.get('kind'),'eq.direct');return reply(denied?null:{user_low_id:viewer,user_high_id:target});}
   if(path.endsWith('/get_direct_messages')) {
    reads++;assert.equal(args.p_conversation_id,conversation);assert.equal(args.p_limit,30);
    if(denied) return reply({code:'42501'},403);
    const selected=[...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id)).filter(r=>!args.p_before_id||r.created_at<args.p_before_at||(r.created_at===args.p_before_at&&r.id<args.p_before_id));
    return reply({messages:selected.slice(0,30).map(r=>({...r,email:'PRIVATE_SENTINEL'})),next_cursor:selected.length>30?{id:selected[29].id,created_at:selected[29].created_at}:null});
   }
   if(path.endsWith('/send_direct_message')) {
    writes++;assert.deepEqual(Object.keys(args).sort(),['p_body','p_conversation_id','p_message_id']);
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
  const shot=async name=>{if([390,1280].includes(width)) await page.screenshot({path:out+'/'+name+'-'+width+'.png'});};
  await page.goto(origin+'/me');await page.getByRole('link',{name:'Mensajes privados',exact:true}).click();await page.getByText('@persona',{exact:true}).waitFor();assert.equal(await page.locator('.primary-nav a').count(),4);await shot('inbox');
  await page.locator('[data-conversation]').first().click();await loaded();await page.getByRole('link',{name:'Volver',exact:true}).click();await page.locator('[data-conversation]').waitFor();assert.ok(await page.locator('[data-conversation]').first().evaluate(e=>e===document.activeElement));
  await page.getByRole('link',{name:'Volver a mi perfil',exact:true}).click();await page.getByRole('link',{name:'Mensajes privados',exact:true}).waitFor();assert.ok(await page.getByRole('link',{name:'Mensajes privados',exact:true}).evaluate(e=>e===document.activeElement));
  await page.goto(origin+'/users/'+target);await button('Enviar mensaje').click();await loaded();await page.getByText('Actualizaciones en tiempo real',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Volver',exact:true}).click();await button('Enviar mensaje').waitFor();assert.ok(await button('Enviar mensaje').evaluate(e=>e===document.activeElement));await button('Enviar mensaje').click();await loaded();
  assert.equal(await page.locator('.chat-bubble').count(),30);assert.equal(await page.locator('.primary-nav').count(),0);await button('Cargar mensajes anteriores').click();await page.waitForFunction(()=>document.querySelectorAll('.chat-bubble').length===34);
  assert.equal(await page.locator('.chat-day-separator').count(),3);
  assert.equal(await page.locator('.chat-message-meta').count(),0);
  assert.ok(await page.locator('.chat-continuation').evaluateAll(rows=>rows.length>0 && rows.every(row=>Math.abs(row.getBoundingClientRect().top-row.previousElementSibling.getBoundingClientRect().bottom-4)<1)));
  assert.equal(await page.locator('[data-message-id] > time').count(),0);
  assert.equal(await page.locator('.chat-bubble time').first().textContent(),'10:00');
  await shot('history');check('Own/profile-private entry without follow,4 dock tabs,focus return,30+4 stable tie pagination,chat shell');
  await page.locator('#direct-text').fill('Hola fixture');await button('Enviar').click();await page.getByText('Hola fixture',{exact:true}).waitFor();assert.equal(writes,1);
  lost=true;await page.locator('#direct-text').fill('Respuesta perdida');await button('Enviar').click();await button('Consultar estado').waitFor();await shot('uncertain');await button('Consultar estado').click();await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();assert.equal(writes,2);check('Confirmed text send and lost committed response reconcile by ID without resending');
  lost=true;commit=false;await page.locator('#direct-text').fill('Reintento seguro');await button('Enviar').click();await button('Consultar estado').click();await button('Reintentar mismo mensaje').waitFor();commit=true;await button('Reintentar mismo mensaje').click();await page.getByText('Reintento seguro',{exact:true}).waitFor();assert.equal(writes,4);check('Uncommitted response keeps draft and retries same UUID only after reconciliation');
  const old=rows.length;for(let i=35;i<=100;i++) rows.push(seed(i));emit(rows.at(-1));emit(rows.at(-1));await page.waitForFunction(n=>document.querySelectorAll('.chat-bubble').length===n,old+66);assert.equal(await page.getByText('Mensaje fixture 100',{exact:true}).count(),1);check('Realtime burst >30,duplicate notifications and multi-page catch-up without missing or duplicate messages');
  blocked=true;await button('Actualizar chat').click();await page.getByText(/Perfil no disponible · Conversación/).waitFor();assert.ok(await page.locator('#direct-text').isDisabled());assert.equal(await page.getByText('Persona privada',{exact:true}).count(),0);assert.ok(await page.locator('.chat-bubble').count()>0);await shot('blocked');check('Bilateral block removes identity,disables composer and retains history');
  assert.equal((await page.locator('body').textContent()).includes('PRIVATE_SENTINEL'),false);
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>{document.documentElement.style.fontSize=''});
  await page.setViewportSize({width,height:400});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width,height:900});
  denied=true;await button('Actualizar chat').click();await page.getByRole('heading',{name:'Conversación no disponible',exact:true}).waitFor();assert.equal(await page.locator('.chat-bubble').count(),0);await shot('denied');
  denied=false;blocked=false;network=true;await Promise.all([page.waitForEvent('requestfailed'),button('Reintentar').click()]);await button('Reintentar').waitFor();network=false;await button('Actualizar chat').click();await loaded();
  check('Unauthorized/network failures clear history;retry recovers;allowlists,text200%,short viewport and no horizontal overflow');
  await page.locator('#direct-text').fill('x'.repeat(2001));assert.ok(await button('Enviar').isDisabled());await page.locator('#direct-text').fill('   ');assert.ok(await button('Enviar').isDisabled());await page.locator('#direct-text').fill('');
  rows[0].body='Texto muy largo sin espacios'.repeat(70);await button('Actualizar chat').click();await page.getByText(rows[0].body,{exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));assert.equal(await page.locator('.chat-bubble').count(),0);await context.setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await loaded();
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await page.locator('.chat-bubble').count(),0);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});await loaded();
  check('Whitespace/overlimit guard,long text,offline/hidden clears history and return reloads');
  rows=[];await button('Actualizar chat').click();await page.getByText('Todavía no hay mensajes. Iniciá la conversación con un texto.',{exact:true}).waitFor();await shot('empty');
  assert.equal(errors.length,0);assert.ok(reads>0);await context.close();
 }
} catch(error) {failure={message:error.message,stack:error.stack,body:await lastPage?.locator('body').textContent()};await lastPage?.screenshot({path:out+'/failure.png'});throw error}
finally {await writeFile(out+'/ui-results.json',JSON.stringify({base:'0116fd30478dea8a6851b7a97cac518abded3925',branch:'codex/r5-block-8',environment:'Actual Vite build + Edge headless; explicit Auth/REST/WebSocket fixtures; NOT real JWT/RLS transport or physical mobile',results,errors,failure,result:failure?'FAIL':'PASS'},null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
