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
  if (path === '/rest/v1/rpc/search_public_events') {
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
 if (process.env.PLANIT_UI_SUPPLEMENTAL === '1') {
  const context = await fixture({width:390,height:844}, 'empty')
  const page = await context.newPage()
  await page.goto(`${origin}/home`); await page.getByRole('heading',{name:'Todavía no hay eventos próximos'}).waitFor()
  await page.evaluate(() => document.fonts.ready)
  assert.match(await page.locator('.home-heading h1').evaluate(el => getComputedStyle(el).fontFamily), /Bricolage Grotesque/)
  assert.equal(await page.evaluate(() => document.fonts.check('700 32px "Bricolage Grotesque"')), true)
  const cdp=await context.newCDPSession(page)
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'},{name:'prefers-reduced-motion',value:'reduce'}]})
  await page.waitForFunction(() => matchMedia('(prefers-reduced-transparency: reduce)').matches && getComputedStyle(document.querySelector('.status-message')).backdropFilter === 'none')
  assert.equal(await page.locator('.status-message').evaluate(el => getComputedStyle(el).backdropFilter),'none')
  assert.match(await page.locator('.status-message').evaluate(el => getComputedStyle(el).backgroundColor),/0.96/)
  for(const route of ['/events/new',`/events/${event.id}/edit`,`/events/${event.id}/gallery`,`/events/${event.id}/attendees`,`/events/${event.id}/chat`,'/me','/notifications','/my-events']) {
   await page.goto(`${origin}${route}`); await page.locator('.app-shell').waitFor(); assert.equal(await page.locator('.discovery-shell').count(),0,route)
  }
  await context.close()
  for (const mode of ['photo','dark','broken']) {
    const mediaContext=await fixture({width:390,height:844},mode);const mediaPage=await mediaContext.newPage()
    await mediaPage.goto(`${origin}/home`);await mediaPage.getByRole('heading',{name:'Música',exact:true}).waitFor()
    if(mode === 'broken') {await mediaPage.locator('.event-card.without-photo').waitFor();assert.equal(await mediaPage.locator('.event-card-photo').count(),0)}
    else {await mediaPage.locator('.event-card-photo img').evaluate(el=>el.decode());assert.equal(await mediaPage.locator('.event-card-photo img').evaluate(el=>getComputedStyle(el).filter),'none')}
    assert.equal(await mediaPage.locator('.event-card a').count(),1)
    await capture(mediaPage,'home',390,mode);await mediaContext.close()
  }
  const fallback=await fixture({width:320,height:800},'success')
  await fallback.route('**/*.woff2',route=>route.abort())
  const fallbackPage=await fallback.newPage();await fallbackPage.goto(`${origin}/home`);await fallbackPage.getByRole('heading',{name:'Música',exact:true}).waitFor();await fallbackPage.evaluate(()=>document.fonts.ready)
  assert.equal(await fallbackPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await fallback.close()
  await writeFile(`${output}/supplemental.json`,JSON.stringify({fontLoaded:true,fontFallbackNoOverflow:true,reducedTransparencyOpaque:true,reducedMotionEmulated:true,routeScopePreserved:true,environment:'Edge emulation; no physical device or native zoom claims'},null,2))
  console.log('PASS: font/fallback, reduced transparency/motion, discovery route isolation')
 } else for(const [width,height] of [[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900]]) {
  for(const mode of ['success','empty','error','loading']) {
   const context=await fixture({width,height},mode);const page=await context.newPage()
   await page.goto(`${origin}/home`)
   await page.getByRole('heading',{name:mode === 'empty' ? 'Todavía no hay eventos próximos' : mode === 'error' ? 'No se pudo cargar Inicio' : mode === 'loading' ? 'Buscando eventos' : 'Música',exact:true}).waitFor()
   await capture(page,'home',width,mode);await context.close()
  }
  for(const mode of ['success','map-failure']) {
   const context=await fixture({width,height},mode);const page=await context.newPage()
   await page.goto(`${origin}/map`);await page.getByRole('heading',{name:event.title,exact:true}).waitFor()
   if(mode === 'success') {
    await page.locator('.planit-marker').waitFor();await capture(page,'map',width,'markers')
    await page.locator('.planit-marker').click();await page.getByRole('region',{name:'Evento seleccionado'}).waitFor()
    if(phase === 'after') assert.equal(await page.locator('.event-card-list .event-card').count(),0, 'Selected preview does not duplicate the event in the list')
    await page.getByRole('region',{name:'Evento seleccionado'}).scrollIntoViewIfNeeded()
   } else await page.getByText(/No pudimos cargar el mapa/).waitFor()
   await capture(page,'map',width,mode === 'success' ? 'selection' : mode);await context.close()
  }
  for(const mode of ['success','photo','dark','broken','full','confirmed','removed','organizer','ended','cancelled','archived','long']) {
   const context=await fixture({width,height},mode);const page=await context.newPage()
   await page.goto(`${origin}/events/${event.id}`);await page.getByRole('heading',{name:event.title,level:1}).waitFor()
   await page.locator('.event-participation[aria-busy="false"]').waitFor()
   if(mode === 'broken') await page.getByText(/No pudimos cargar las fotos/).waitFor()
   if(['full','confirmed','removed','organizer','ended','cancelled','archived'].includes(mode)) await page.locator('.event-participation').scrollIntoViewIfNeeded()
   await capture(page,'detail',width,mode)
   if(mode === 'long') {
    await page.setViewportSize({width,height:360});await page.locator('.event-organizer').scrollIntoViewIfNeeded();await capture(page,'detail',width,'short-height')
   }
   if(phase === 'after' && mode === 'success') {
    await page.locator('.detail-back').focus();assert.match(await page.locator('.detail-back').evaluate(el => getComputedStyle(el).outlineStyle),/solid/)
    await page.addStyleTag({content:'html { font-size: 200%; } .discovery-shell p, .discovery-shell dd, .discovery-shell button, .discovery-shell a { font-size: 200%; }'})
    await capture(page,'detail',width,'large-text')
   }
   await context.close()
  }
 }
 await writeFile(`${output}/metrics.json`,JSON.stringify({phase,environment:'Edge/Playwright; intercepted Auth/REST/Storage; real Mapbox GL engine with empty local style, no remote service validation',photo:photo ? 'user-supplied local QA photograph' : 'flat media fixture; no natural photograph',metrics},null,2))
 if (process.env.PLANIT_UI_SUPPLEMENTAL !== '1') console.log(`PASS: ${metrics.length} ${phase} captures, six widths and discovery/detail states`)
} finally {await browser.close()}
