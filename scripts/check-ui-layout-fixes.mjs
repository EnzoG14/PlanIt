import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? resolve(process.env.USERPROFILE ?? '', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
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
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/ui-layout-fixes'
await mkdir(out,{recursive:true})
const viewer='20000000-0000-4000-8000-000000000001', target='50000000-0000-4000-8000-000000000001'
const user={id:viewer,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const session={access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}
const results=[],errors=[];
let lastPage;
const eventId='30000000-0000-4000-8000-000000000001', conversation='96000000-0000-4000-8000-000000000001';
const event={id:eventId,organizer_id:target,title:'Encuentro de música',description:'Descripción del evento. '.repeat(70),starts_at:'2099-10-11T20:00:00',ends_at:'2099-10-11T22:00:00',address:'Av. Corrientes 123',location_name:'Centro cultural',latitude:-34.6,longitude:-58.38,capacity:20,category_id:'10000000-0000-4000-8000-000000000001',visibility:'public',cancelled_at:null,archived_at:null};
try {
 for(const width of [320,375,390,768,1280]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value)),session);
  let avatar=target,broken=false,failClear=false,clears=0,summaryFailure=false;
  let notices=Array.from({length:35},(_,i)=>({id:'98000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),type:'system',title:'Aviso '+(i+1),body:null,read_at:null,created_at:'2026-10-19T10:00:'+String(59-i).padStart(2,'0'),target:null}));
  let summary={confirmed_count:8,capacity:20,available_spots:12,own_status:null,is_organizer:false,event_state:'open'};
  await context.routeWebSocket('wss://iepeqmvzjguwlhnecsdq.supabase.co/realtime/**',ws=>ws.onMessage(raw=>{
   const [join,ref,topic,name]=JSON.parse(String(raw));
   if(['phx_join','heartbeat'].includes(name)) ws.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:[]}}]));
  }));
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
   const url=new URL(route.request().url()),p=url.pathname,args=route.request().postDataJSON();
   const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(p==='/auth/v1/user') return reply(user);
   if(p==='/rest/v1/profiles') return reply({username:'fixture_me',display_name:'Mi cuenta',bio:null,first_name:null,last_name:null,birth_date:null,sex:null,visibility:'public',avatar_file_id:null});
   if(p==='/rest/v1/notifications') return route.fulfill({status:200,headers:{'content-range':`0-0/${notices.filter(n=>!n.read_at).length}`}});
   if(p.endsWith('/get_notifications')) return reply(notices.filter(n=>!args.p_before_id||n.created_at<notices.find(x=>x.id===args.p_before_id)?.created_at).slice(0,31));
   if(p.endsWith('/get_notification_changes')) return reply(notices.filter(n=>args.p_ids.includes(n.id)));
   if(p.endsWith('/clear_notifications')) {assert.deepEqual(args,{});if(failClear)return reply({message:'fixture failure'},500);clears++;notices=[];return reply(null);}
   if(p.endsWith('/get_social_profile')) return reply({display_name:'NombreMuyLargoSinEspacios'.repeat(4),username:'persona',avatar,bio:'Biografía de prueba'});
   if(p.endsWith('/get_social_relationship')) return reply({visibility:'public',follow:null});
   if(p.endsWith('/get_social_counts')) return reply({followers:1,following:1});
   if(p.endsWith('/get_social_profile_events')) return reply({events:[],next_cursor:null});
   if(p.endsWith('/list_follow_requests')) return reply({requests:[],next_cursor:null});
   if(p.endsWith('/list_social_follows')) return reply({users:[{user_id:target,display_name:'Persona',username:'persona',avatar:null}],next_cursor:null});
   if(p.endsWith('/social-avatar')) return reply({signed_url:'https://iepeqmvzjguwlhnecsdq.supabase.co/storage/v1/object/sign/avatars/fixture.svg?token=fake',expires_in:60});
   if(p.includes('/storage/v1/object/sign/avatars/')) return broken?route.abort():route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1400"><rect width="2400" height="1400" fill="#8d66fa"/></svg>'});
   if(p.endsWith('/list_direct_conversations')) return reply({conversations:[{id:conversation,created_at:'2026-10-19T10:00:00',peer_id:target,read_only:false}],next_cursor:null});
   if(p==='/rest/v1/conversations') return reply({user_low_id:viewer,user_high_id:target});
   if(p.endsWith('/get_direct_messages')) return reply({messages:[],next_cursor:null});
   if(p==='/rest/v1/events') return reply(event);
   if(p==='/rest/v1/categories') return reply([{id:event.category_id,name:'Música',is_active:true}]);
   if(p.endsWith('/get_event_participation_summary')) return summaryFailure?reply({message:'fixture'},500):reply([summary]);
   if(p.endsWith('/get_my_rejoin_status')) return reply({status:'approved',can_request:false});
   if(p.endsWith('/register_for_event')) {summary={...summary,own_status:'confirmed'};return reply(null);}
   if(p.endsWith('/leave_event')) {summary={...summary,own_status:'cancelled'};return reply(null);}
   if(p.endsWith('/get_event_organizer')) return reply([{display_name:'Organizador',username:'organizador'}]);
   return reply([]);
  });
  const page=await context.newPage();lastPage=page;page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
  const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  const noRefresh=async()=>assert.equal(await page.getByRole('button',{name:/actualizar/i}).count(),0);
  const shot=async name=>{if([390,1280].includes(width)) await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true});};
  await page.goto(origin+'/messages');await page.locator('.social-avatar img').waitFor();
  await page.waitForFunction(()=>document.querySelector('.social-avatar img')?.naturalWidth===2400);
  assert.deepEqual(await page.locator('.social-avatar').evaluate(e=>[e.offsetWidth,e.offsetHeight,getComputedStyle(e).borderRadius]),[48,48,'50%']);
  await noOverflow();await noRefresh();assert.equal(await page.locator('.primary-nav').count(),0);await shot('inbox');
  await page.reload();await page.locator('.social-avatar img').waitFor();await noOverflow();
  broken=true;await page.reload();await page.locator('.social-avatar .icon').waitFor();await noOverflow();
  avatar=null;await page.reload();await page.locator('.social-avatar .icon').waitFor();
  // Exercise the same mounted AppLayout across docked and secondary routes.
  await page.getByRole('link',{name:'Volver a mi perfil'}).click();await page.locator('.primary-nav').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--dock-space')));
  await page.getByRole('link',{name:'Mensajes privados',exact:true}).click();await page.locator('[data-conversation]').waitFor();
  assert.equal(await page.locator('.primary-nav').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--dock-space')),'');
  await page.locator('[data-conversation]').click();await page.locator('.chat-composer').waitFor();await noRefresh();
  assert.equal(await page.getByText(/Actualizaciones en tiempo real|Mensajes en tiempo real/).count(),0);
  assert.equal(await page.getByRole('link',{name:'Volver',exact:true}).count(),1);assert.equal(await page.getByRole('link',{name:'Bandeja',exact:true}).count(),1);
  await noOverflow();await shot('chat-header');
  for(const suffix of ['/followers','/following','','requests']){
   await page.goto(suffix==='requests'?origin+'/me/follow-requests':origin+'/users/'+target+suffix);await page.locator('.social-identity-page').waitFor();await noRefresh();
   assert.equal(await page.locator('.management-wash').count(),1);
   assert.equal(await page.locator('.management-wash').evaluate(e=>e.parentElement.classList.contains('app-shell')),true);
   assert.equal(await page.locator('.management-wash').evaluate(e=>e.getBoundingClientRect().top),0);
   assert.equal(await page.locator('.primary-nav').count(),0);await noOverflow();await shot(suffix==='requests'?'follow-requests':suffix==='/following'?'following':suffix? 'followers':'profile');
  }
  await page.goto(origin+'/events/'+eventId);const action=page.locator('.participation-action');await page.getByRole('button',{name:'Unirme',exact:true}).waitFor();
  assert.equal(await action.evaluate(e=>getComputedStyle(e).position),'fixed');assert.equal(await page.locator('.event-detail-page').evaluate(e=>getComputedStyle(e,'::after').content),'none');
  assert.equal(await page.locator('.primary-nav').count(),0);assert.equal(await page.locator('.event-hero').count(),0);assert.equal(await page.getByRole('button',{name:'Descargar archivo .ics'}).count(),0);await noRefresh();await shot('join');
  await page.getByRole('button',{name:'Unirme',exact:true}).click();await page.getByRole('button',{name:'Retirarme',exact:true}).waitFor();
  assert.notEqual(await action.evaluate(e=>getComputedStyle(e).position),'fixed');assert.equal(await page.locator('main button').last().textContent(),'Retirarme');
  assert.equal(await page.locator('.participation-links').evaluate(e=>getComputedStyle(e).gap),'12px');
  await page.getByText('Solicitud aprobada. Volvés a participar del evento.',{exact:true}).waitFor();await action.scrollIntoViewIfNeeded();await shot('leave');await noOverflow();
  await page.getByRole('button',{name:'Retirarme',exact:true}).click();await page.getByRole('button',{name:'Unirme',exact:true}).waitFor();
  summaryFailure=true;await page.reload();await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();assert.ok(await action.isDisabled());
  summaryFailure=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await page.getByRole('button',{name:'Unirme',exact:true}).waitFor();
  await page.goto(origin+'/me/edit');await page.getByRole('button',{name:'Guardar datos y privacidad',exact:true}).waitFor();await noRefresh();assert.equal(await page.getByRole('button',{name:'Revisar cargas interrumpidas'}).count(),0);assert.equal(await page.getByText(/No encontramos cargas sin vincular/).count(),0);await shot('edit-profile');
  await page.goto(origin+'/map');await page.getByRole('heading',{name:'Encontrá tu próximo plan'}).waitFor();await noRefresh();assert.equal(await page.getByText('Eventos públicos en el mapa',{exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Usar Resistencia, Chaco'}).count(),0);assert.equal(await page.getByText(/Ubicación predeterminada:/).count(),0);assert.equal(await page.locator('.primary-nav').count(),1);
  await page.goto(origin+'/notifications');const clear=page.getByRole('button',{name:'Limpiar notificaciones',exact:true});await clear.waitFor();await page.locator('.notification-row').first().waitFor();
  assert.equal(await page.locator('.notification-row').count(),30);await noRefresh();
  failClear=true;await clear.click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('.notification-row').count(),30);
  failClear=false;await clear.click();await page.getByRole('heading',{name:'Todavía no tenés notificaciones',exact:true}).waitFor();assert.equal(clears,1);await shot('notifications-cleared');
  await page.reload();await page.getByRole('heading',{name:'Todavía no tenés notificaciones',exact:true}).waitFor();assert.ok(await clear.isDisabled());
  notices=[{id:'99000000-0000-4000-8000-000000000001',type:'system',title:'Aviso nuevo',body:null,read_at:null,created_at:'2026-10-19T12:00:00',target:null}];
  await page.reload();await page.getByRole('heading',{name:'Aviso nuevo',exact:true}).waitFor();await noOverflow();
  await page.setViewportSize({width,height:400});await page.evaluate(()=>document.body.style.zoom='2');await noOverflow();
  results.push({width,result:'PASS',cases:'avatar/direct reload/fallback, dock transitions, followers/following/profile wash, chat controls, join/leave/rejoin, failed/successful clear including unloaded notifications/new arrivals, 200% text and short viewport'});
  console.log('PASS '+width);await context.close();
 }
 assert.deepEqual(errors,[]);
} catch(error){await lastPage?.screenshot({path:out+'/failure.png'});console.error(await lastPage?.locator('body').textContent());throw error;}
finally{await writeFile(out+'/results.json',JSON.stringify({environment:'Built Vite app, Edge headless, intercepted Auth/REST/WebSocket fixtures. No remote SQL or real mobile device.',results,errors},null,2));await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
