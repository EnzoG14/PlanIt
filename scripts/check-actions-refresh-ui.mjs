import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4197'
const base = process.env.PLANIT_BASE_ORIGIN ?? 'http://127.0.0.1:4196'
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/ui-refresh/block-7-actions/visual'
await mkdir(out,{recursive:true})
const browser = await chromium.launch({headless:true,channel:'msedge'})
const owner='20000000-0000-4000-8000-000000000001',guest='20000000-0000-4000-8000-000000000002',id='30000000-0000-4000-8000-000000000001'
const event={id,organizer_id:owner,title:'Encuentro de música — fixture',description:'Contenido ficticio para verificar las acciones.',starts_at:'2099-10-12T22:00:00',ends_at:'2099-10-13T03:00:00',address:'Buenos Aires',location_name:'Centro cultural',latitude:-34.6,longitude:-58.38,capacity:80,category_id:'10000000-0000-4000-8000-000000000001',visibility:'public',cancelled_at:null,archived_at:null}
const row={request_id:'40000000-0000-4000-8000-000000000001',participation_id:'50000000-0000-4000-8000-000000000001',status:'pending',requested_at:'2026-10-12T12:00:00',display_name:'Sofía Herrera',username:'sofia.herrera'}
const results=[], pixelComparisons=[]
const check=(test,width,details={})=>{results.push({test,width,result:'PASS',...details});console.log(`PASS ${width}: ${test}`)}
async function fixture(width,height,identity=owner) {
 const state={requests:[row],full:false,eventState:'open',ownStatus:'removed',rejoin:null,error:false,long:false}
 const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo',reducedMotion:'reduce'})
 const user={id:identity,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
 await context.addInitScript(({user})=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),{user})
 await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',route=>{
  const path=new URL(route.request().url()).pathname
  const reply=data=>route.fulfill({contentType:'application/json',body:JSON.stringify(data)})
  if(path==='/auth/v1/user')return reply(user)
  if(path==='/rest/v1/events')return reply([event])
  if(path==='/rest/v1/categories')return reply([{id:event.category_id,name:'Música',is_active:true}])
  if(path==='/rest/v1/event_images')return reply([])
  if(path.endsWith('/get_event_organizer'))return reply([{display_name:'Lucía Benítez',username:'lucia.benitez'}])
  if(path.endsWith('/get_event_participation_summary'))return reply([{confirmed_count:state.full?80:48,capacity:80,available_spots:state.full?0:32,own_status:identity===owner?null:state.ownStatus,is_organizer:identity===owner,event_state:state.eventState}])
  if(path.endsWith('/get_my_rejoin_status'))return reply({request_id:state.rejoin?'40000000-0000-4000-8000-000000000001':null,status:state.rejoin,requested_at:'2026-10-12T12:00:00',resolved_at:null,next_eligible_at:state.rejoin==='rejected'?'2026-10-19T12:00:00':null,can_request:!state.rejoin&&state.eventState==='open'})
  if(path.endsWith('/get_event_rejoin_requests'))return state.error?route.abort('failed'):reply({title:event.title,capacity:80,confirmed_count:state.full?80:48,pending_count:state.requests.length,event_state:state.eventState,has_more:false,requests:state.requests.map(r=>state.long?{...r,display_name:'Sofía'.repeat(28),username:'identidad'.repeat(20)}:r)})
  if(path.endsWith('/get_my_organized_events'))return reply([{...event,category_name:'Música',event_state:'open',participation_status:null,image_path:null}])
  // Any unexpected mutation fails locally instead of reaching a service.
  if(route.request().method()!=='GET'&&!/get_|count/.test(path))return route.fulfill({status:403,contentType:'application/json',body:'{"message":"fixture_read_only"}'})
  return reply([])
 })
 const page=await context.newPage();await page.routeWebSocket(/supabase\.co/,s=>s.close())
 return {context,page,state}
}
async function settled(page) {await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});await page.evaluate(()=>document.activeElement?.blur());}
async function capture(page,name) {await settled(page);await page.screenshot({path:`${out}/${name}.png`,fullPage:true})}
async function noOverflow(page) {assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}
async function amplify(page,selector) {await page.locator(selector).evaluateAll(nodes=>{const sizes=nodes.map(n=>parseFloat(getComputedStyle(n).fontSize));nodes.forEach((n,i)=>{if(n.dataset.textAmplified)return;n.dataset.textAmplified='true';n.style.fontSize=`${sizes[i]*2}px`})})}
async function reachButtons(page,dialog) {
 const buttons=dialog.locator('button:not([aria-label])');for(let i=0;i<await buttons.count();i++){await buttons.nth(i).scrollIntoViewIfNeeded();assert.equal(await buttons.nth(i).evaluate(n=>n.scrollWidth<=n.clientWidth+1),true)}
 assert.equal(await dialog.evaluate(n=>n.scrollHeight>n.clientHeight),true)
}
try {
 for(const [width,height] of process.argv.includes('--media-only') ? [] : [[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900]]) {
  const {context,page,state}=await fixture(width,height)
  await page.goto(`${origin}/events/${id}/rejoin-requests`);await page.locator('.rejoin-list li').waitFor();await capture(page,`requests-${width}`);await noOverflow(page)
  const boxes=await page.locator('.rejoin-actions button').evaluateAll(ns=>ns.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));assert.ok(boxes.every(b=>b.width>=44&&b.height>=44))
  await page.getByRole('button',{name:'Rechazar solicitud de Sofía Herrera'}).click();await capture(page,`reject-${width}`);await page.keyboard.press('Escape')
  state.full=true;await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await page.getByText(/Sin cupo disponible/).waitFor();await capture(page,`full-${width}`)
  state.eventState='cancelled';await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await page.getByText(/El evento está cerrado/).waitFor();await capture(page,`closed-${width}`)
  state.requests=[];await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await page.getByRole('heading',{name:'No hay solicitudes pendientes'}).waitFor();await capture(page,`empty-${width}`)
  state.error=true;await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await page.getByRole('alert').waitFor();await capture(page,`error-${width}`)
  state.error=false;state.requests=[row];state.eventState='open';state.long=true;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await page.locator('.rejoin-list li').waitFor();await amplify(page,'.rejoin-page h1,.rejoin-page p,.rejoin-page strong,.rejoin-page span,.rejoin-page button,.rejoin-page a');await capture(page,`text-200-${width}`);await noOverflow(page)
  check('requests: defaults, full, closed, empty, recovery, long text at 200%, targets',width,{boxes})
  await page.getByRole('button',{name:/Aprobar solicitud/}).click();await page.setViewportSize({width,height:240});await amplify(page,'.rejoin-dialog h2,.rejoin-dialog p,.rejoin-dialog button:not([aria-label])');await reachButtons(page,page.getByRole('dialog'));await page.screenshot({path:`${out}/short-dialog-${width}.png`});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.closest('.rejoin-actions'));assert.equal(await page.locator('.rejoin-actions button').first().evaluate(n=>n===document.activeElement),true)
  check('request dialog: 240px height, doubled text, internal scroll, reachable actions, Escape/return focus',width)
  await page.setViewportSize({width,height});await page.goto(`${origin}/events/${id}`);await page.locator('.event-management').waitFor();await settled(page);await page.locator('.event-management').screenshot({path:`${out}/management-${width}.png`})
  // Remove the route theme only in the fixture DOM to prove autonomous component styling.
  await page.locator('.app-shell').evaluate(n=>n.classList.remove('amanecer-shell'))
  await page.getByRole('button',{name:'Archivar evento',exact:true}).click();const d=page.getByRole('dialog');await settled(page)
  assert.equal(await d.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)')
  assert.equal(await d.getByRole('button',{name:'Archivar',exact:true}).evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(206, 16, 61)')
  await d.getByRole('button',{name:'Archivar',exact:true}).evaluate(n=>{n.disabled=true});assert.equal(await d.getByRole('button',{name:'Archivar',exact:true}).evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(217, 219, 232)');await d.getByRole('button',{name:'Archivar',exact:true}).evaluate(n=>{n.disabled=false});
  await d.screenshot({path:`${out}/standalone-archive-${width}.png`});await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'Cancelar evento',exact:true}).click();await page.setViewportSize({width,height:240});await amplify(page,'.event-action-dialog h2,.event-action-dialog p,.event-action-dialog button:not([aria-label])');await reachButtons(page,page.getByRole('dialog'));await page.screenshot({path:`${out}/short-action-${width}.png`});await page.keyboard.press('Escape')
  check('embedded management: standalone light sheet, solid red archive, 240px/200% text actions',width)
  await context.close()
  const guestFixture=await fixture(width,height,guest)
  for(const status of [null,'pending','rejected','approved']) {
   guestFixture.state.rejoin=status;guestFixture.state.ownStatus=status==='approved'?'confirmed':'removed'
   await guestFixture.page.goto(`${origin}/events/${id}`);await guestFixture.page.getByRole('button',{name:'Actualizar estado'}).waitFor();await guestFixture.page.waitForFunction(()=>!document.querySelector('.event-participation')?.getAttribute('aria-busy')?.includes('true'));await capture(guestFixture.page,`own-${status??'eligible'}-${width}`)
   if(status!=='approved') {await guestFixture.page.locator('.app-shell').evaluate(n=>n.classList.remove('amanecer-shell'));assert.equal(await guestFixture.page.locator('.rejoin-own-state').evaluate(n=>getComputedStyle(n).fontFamily.includes('Bricolage')),true)}
  }
  await guestFixture.context.close();check('own request states with approved participation kept separate; autonomous font',width)
  const pilot=[]
  for(const [stage,url] of [['before',base],['after',origin]]) {
   const f=await fixture(width,height);await f.page.goto(`${url}/my-events?section=organizing&filter=all`);await f.page.locator('.compact-event-card').waitFor();await settled(f.page)
   const snapshots=[]
   for(const action of ['Duplicar evento','Cancelar evento','Archivar evento']) {
    await f.page.getByRole('button',{name:`Acciones de ${event.title}`}).click();await f.page.getByRole('button',{name:action,exact:true}).click();const dialog=f.page.getByRole('dialog');await settled(f.page)
    const buffer=await dialog.screenshot({path:`${out}/pilot-${stage}-${action.split(' ')[0]}-${width}.png`})
    const geometry=await dialog.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:r.x,y:r.y,w:r.width,h:r.height,color:s.color,bg:s.backgroundColor,font:s.fontFamily,padding:s.padding,radius:s.borderRadius}})
    snapshots.push({buffer,geometry});await f.page.keyboard.press('Escape');assert.equal(await f.page.getByRole('button',{name:`Acciones de ${event.title}`}).evaluate(n=>n===document.activeElement),true)
   }
   pilot.push(snapshots);await f.context.close()
  }
  for(let i=0;i<3;i++){
   assert.deepEqual(pilot[0][i].geometry,pilot[1][i].geometry)
   const action=['Duplicar','Cancelar','Archivar'][i], identical=pilot[0][i].buffer.equals(pilot[1][i].buffer)
   let comparison={width,action,identical,changedPixels:0,maxChannelDelta:0}
   if(!identical){
    const python=process.env.PLANIT_PYTHON_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
    const code="from PIL import Image; import sys,json; a=Image.open(sys.argv[1]).convert('RGBA'); b=Image.open(sys.argv[2]).convert('RGBA'); assert a.size==b.size; ds=[(i%a.width,i//a.width,aa,bb) for i,(aa,bb) in enumerate(zip(a.get_flattened_data(),b.get_flattened_data())) if aa!=bb]; print(json.dumps({'changedPixels':len(ds),'maxChannelDelta':max([abs(x-y) for _,_,aa,bb in ds for x,y in zip(aa,bb)] or [0]),'perimeterOnly':all(x<2 or y<2 or x>=a.width-2 or y>=a.height-2 for x,y,_,_ in ds)}))"
    comparison={...comparison,...JSON.parse(execFileSync(python,['-c',code,`${out}/pilot-before-${action}-${width}.png`,`${out}/pilot-after-${action}-${width}.png`],{encoding:'utf8',windowsHide:true}))}
    assert.ok(comparison.changedPixels<=50&&comparison.maxChannelDelta<=1&&comparison.perimeterOnly,'Only one-unit raster variation in the outer two pixels is tolerated; content must remain identical')
   }
   pixelComparisons.push(comparison)
  }
  check('Mis eventos: three dialogs match immutable base, geometry/focus identical; perimeter raster deltas recorded',width)
 }
 for(const width of [390,1280]) {
  const f=await fixture(width,900);await f.page.goto(`${origin}/events/${id}/rejoin-requests`);await f.page.locator('.rejoin-list li').waitFor();await settled(f.page)
  assert.equal(await f.page.evaluate(()=>document.fonts.check('16px "Bricolage Grotesque"')),true)
  const cdp=await f.context.newCDPSession(f.page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'},{name:'prefers-reduced-motion',value:'reduce'}]})
  assert.equal(await f.page.evaluate(()=>matchMedia('(prefers-reduced-transparency: reduce)').matches),true)
  assert.equal(await f.page.locator('.rejoin-list li').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(255, 255, 255, 0.97)')
  assert.equal(await f.page.locator('.account-menu-trigger').evaluate(n=>getComputedStyle(n).backdropFilter),'none')
  await capture(f.page,`reduced-transparency-${width}`);await f.context.close()
  const fallback=await fixture(width,900);await fallback.context.route('**/*.woff2',route=>route.abort('failed'));await fallback.page.goto(`${origin}/events/${id}/rejoin-requests`);await fallback.page.locator('.rejoin-list li').waitFor();await settled(fallback.page)
  assert.equal(await fallback.page.evaluate(()=>document.fonts.check('16px "Bricolage Grotesque"')),false);await noOverflow(fallback.page);await capture(fallback.page,`font-fallback-${width}`);await fallback.context.close()
  check('self-hosted font loaded; failed font fallback; emulated reduced transparency/motion',width)
 }
 await writeFile(`${out}/results.json`,JSON.stringify({environment:'Edge headless fixtures; Argentina formatting in Tokyo; emulated text enlargement/height, not native zoom or physical accessibility acceptance',baseOrigin:base,origin,results,pixelComparisons},null,2))
} finally {await browser.close()}
