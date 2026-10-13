import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const phase = process.argv[2] ?? 'after'
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4194'
const output = process.env.PLANIT_UI_OUTPUT ?? `docs/design/verification/ui-refresh/block-4-discovery/${phase}`
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] })
const user = { id:'20000000-0000-4000-8000-000000000001',email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z' }
const event = { id:'30000000-0000-4000-8000-000000000001',organizer_id:'20000000-0000-4000-8000-000000000002',title:'Encuentro de música — prueba',description:'Compartimos música con la comunidad. Datos de prueba para verificar la interfaz.',starts_at:'2099-10-11T20:00:00',ends_at:'2099-10-11T22:00:00',address:'Av. Corrientes 123, Buenos Aires',location_name:'Centro cultural',latitude:-34.6037,longitude:-58.3816,capacity:20,category_id:'10000000-0000-4000-8000-000000000001',visibility:'public',cancelled_at:null,archived_at:null }
// Optional authorized local QA photograph; never added to application runtime.
const photo = process.env.PLANIT_UI_PHOTO ? await readFile(process.env.PLANIT_UI_PHOTO) : null
const metrics = []
async function fixture(viewport, mode) {
 const context = await browser.newContext({ viewport,timezoneId:'Asia/Tokyo' })
 await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})), user)
 await context.route('https://api.mapbox.com/**', route => route.request().url().includes('/styles/v1/') ? mode === 'map-failure' ? route.fulfill({status:401,body:'{}'}) : route.fulfill({json:{version:8,sources:{fixture:{type:'geojson',data:{type:'FeatureCollection',features:[]},attribution:'© Mapbox · © OpenStreetMap (fixture)'}},layers:[{id:'background',type:'background',paint:{'background-color':'#e8e6f4'}}]}}) : route.fulfill({json:{}}))
 await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
  const path = new URL(route.request().url()).pathname
  const reply = (json,status=200) => route.fulfill({json,status})
  const own = mode === 'organizer'
  const data = {...event,organizer_id:own ? user.id : event.organizer_id,description:mode === 'long' ? event.description.repeat(80) : event.description}
  if (path === '/auth/v1/user') return reply(user)
  if (path === '/rest/v1/rpc/get_home_events' || path === '/rest/v1/rpc/discover_public_events') {
   if (mode === 'loading') await new Promise(resolve => setTimeout(resolve,1200))
   return mode === 'error' ? reply({message:'fixture failure'},500) : reply(mode === 'empty' ? [] : [{...data,category_name:'Música',image_path:['photo','broken','dark'].includes(mode) ? 'fixture/cover.jpg' : null}])
  }
  if(path === '/rest/v1/events') return reply([data])
  if(path === '/rest/v1/categories') return reply([{id:event.category_id,name:'Música',is_active:true}])
  if(path === '/rest/v1/event_images') return reply(['photo','broken','dark'].includes(mode) ? [{files:{storage_path:'fixture/cover.jpg'}}] : [])
  if(path === '/rest/v1/rpc/get_event_organizer') return reply([{display_name:'Organizadora de prueba',username:'organizadora'}])
  if(path === '/rest/v1/rpc/get_event_participation_summary') return reply([{confirmed_count:mode === 'full' ? 20 : 3,capacity:20,available_spots:mode === 'full' ? 0 : 17,own_status:mode === 'confirmed' ? 'confirmed' : mode === 'removed' ? 'removed' : null,is_organizer:own,event_state:['ended','cancelled','archived'].includes(mode) ? mode : 'open'}])
  if(path === '/rest/v1/rpc/get_event_rejoin_status') return reply([{status:null,can_request:mode === 'removed',next_eligible_at:null}])
  if(path === '/storage/v1/object/sign/event_media') return reply(route.request().postDataJSON().paths.map(path => ({path,signedURL:`/object/sign/event_media/${path}?token=fixture`})))
  if(path.startsWith('/storage/v1/object/sign/event_media/')) return mode === 'broken' ? route.abort() : photo ? route.fulfill({contentType:'image/jpeg',body:photo}) : route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="${mode === 'dark' ? '#060b27' : '#e8e6f4'}"/></svg>`})
  return reply([])
 })
 return context
}
async function capture(page,name,width,mode) {
 await page.evaluate(() => document.fonts.ready)
 const geometry = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth > innerWidth,font:getComputedStyle(document.body).fontFamily,action:document.querySelector('.participation-action') ? (() => {const el=document.querySelector('.participation-action');const r=el.getBoundingClientRect();return {position:getComputedStyle(el).position,top:r.top,bottom:r.bottom,height:r.height}})() : null}))
 if(phase === 'after') {
  assert.equal(geometry.overflow,false, `${name} ${width}: horizontal overflow`)
  if(geometry.action) {assert.equal(geometry.action.position,'fixed');assert.ok(geometry.action.top >= 0 && geometry.action.bottom <= page.viewportSize().height)}
 }
 await page.screenshot({path:`${output}/${name}-${width}-${mode}.jpg`,quality:75})
 metrics.push({name,width,mode,...geometry})
}
try {
 const results=[];
 for(const route of ['home','map','detail']) {
  const context=await fixture({width:390,height:844},'success'); const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const module=route==='home'?'HomePage':route==='map'?'MapPage':'EventDetailPage';
  await context.route(`**/src/pages/${module}.tsx*`,r=>r.abort('failed'));
  const path=route==='detail'?`/events/${event.id}`:`/${route}`;
  await page.goto(`${origin}${path}`);await page.waitForTimeout(1800);
  const state=await page.evaluate(()=>({rootText:document.getElementById('root')?.innerText??'',rootChildren:document.getElementById('root')?.childElementCount??0,bodyText:document.body.innerText,retryButtons:[...document.querySelectorAll('button')].filter(b=>/reintentar/i.test(b.innerText)).length}));
  await page.screenshot({path:`${output}/lazy-${route}-390x844.png`});results.push({route:path,aborted:module,errors,state});await context.close();
 }
 // Isolated participation polling focus: existing fixture, no remote traffic.
 const context=await fixture({width:390,height:844},'success');const page=await context.newPage();
 await page.goto(`${origin}/events/${event.id}`);await page.locator('.event-participation[aria-busy="false"]').waitFor();await page.locator('.participation-action').focus();
 const before=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent}));
 let capture;
 await page.clock.install();
 await context.route('**/rest/v1/rpc/get_event_participation_summary',async r=>{capture=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,disabled:document.activeElement.disabled}));await new Promise(r=>setTimeout(r,600));await r.fulfill({json:[{confirmed_count:3,capacity:20,available_spots:17,own_status:null,is_organizer:false,event_state:'open'}]});});
 await page.clock.runFor(31000);await page.waitForTimeout(1000);
 const after=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent}));
 results.push({check:'participation-periodic-focus',before,during:capture,after});await context.close();
 await writeFile(`${output}/results.json`,JSON.stringify({sha:'a378259a60106ddd07b111080a24677ad509bc49',environment:'Edge fixtures; aborted local Vite modules; simulated clock; no remote service',results},null,2));console.log(JSON.stringify(results));
} finally {await browser.close()}
