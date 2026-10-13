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
 const measurements=[];
 try {
 for(const[width,height]of [[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900]])for(const[name,route]of [['create','/events/new'],['edit',`/events/${id}/edit`],['rejoin',`/events/${id}/rejoin-requests`]]){
  const f=await fixture(width,height);f.state.long=true;await f.page.goto(origin+route);await f.page.locator(name==='rejoin'?'.rejoin-list li':'form.event-form').waitFor();await settled(f.page);
  const measure=()=>f.page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth,viewport:{width:innerWidth,height:innerHeight},shell:document.querySelector('.app-shell').className,fields:[...document.querySelectorAll('input[type="date"],input[type="time"]')].map(n=>({name:n.name,value:n.value,width:n.getBoundingClientRect().width,fontSize:getComputedStyle(n).fontSize})),controls:[...document.querySelectorAll('main button,main a,main input')].filter(n=>n.getBoundingClientRect().width).map(n=>({name:n.getAttribute('aria-label')??n.textContent.slice(0,50),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))}));
  measurements.push({name,width,height,state:'normal',...(await measure())});await f.page.screenshot({path:`${out}/${name}-normal-${width}.png`});
  await amplify(f.page,'.app-shell *:not(svg):not(path):not(circle):not(line):not(polyline):not(rect)');await f.page.waitForTimeout(100);
  measurements.push({name,width,height,state:'text200',...(await measure())});
  if(name!=='rejoin')await f.page.locator('input[type="date"]').first().scrollIntoViewIfNeeded();await f.page.screenshot({path:`${out}/${name}-text200-${width}.png`});
  if(width===320||width===390){await f.page.setViewportSize({width,height:240});const control=f.page.getByRole(name==='rejoin'?'button':'button',{name:name==='create'?'Publicar evento':name==='edit'?'Guardar cambios':'Actualizar solicitudes',exact:true});await control.focus();await control.scrollIntoViewIfNeeded();const reach=await control.evaluate(n=>{const r=n.getBoundingClientRect();return {rect:r.toJSON(),hit:n.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}});measurements.push({name,width,height:240,state:'text200-short',reach,...(await measure())});await f.page.screenshot({path:`${out}/${name}-text200-short-${width}.png`});}
  await f.context.close();
 }
 await writeFile(`${out}/measurements.json`,JSON.stringify({sha:'a378259a60106ddd07b111080a24677ad509bc49',environment:'read-only action fixtures; computed font sizes doubled once; DOM emulation, no native zoom',measurements},null,2));console.log(JSON.stringify({captures:measurements.length,overflow:measurements.filter(x=>x.overflow).map(x=>({name:x.name,width:x.width,state:x.state})),unreachable:measurements.filter(x=>x.reach&&!x.reach.hit).map(x=>({name:x.name,width:x.width,state:x.state}))}));
 }finally{await browser.close()}
