import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Production browser emulation + intercepted fixtures. No remote identities or writes.
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r4-block-9/supplemental-ui'
const base = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4195'
await mkdir(output,{recursive:true})
const browser = await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']})
const a = '20000000-0000-4000-8000-000000000001', b = '20000000-0000-4000-8000-000000000002'
const id = '30000000-0000-4000-8000-000000000001', categoryId = '10000000-0000-4000-8000-000000000001'
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const user = uid => ({id:uid,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'})
const session = uid => ({access_token:`fixture-${uid}`,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:user(uid)})
const event = {id,organizer_id:a,category_id:categoryId,category_name:'Arte',title:'Encuentro de fotografía',description:'Datos ficticios de QA B9.',starts_at:'2099-10-15T18:00:00',ends_at:'2099-10-15T20:00:00',address:'Buenos Aires',location_name:'Centro cultural',latitude:-34.6,longitude:-58.38,capacity:10,visibility:'unlisted',cancelled_at:null,archived_at:null,image_path:null}
const results = [], errors = []
async function fixture(width,height,{sw=false}={}) {
  const context = await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo',reducedMotion:'reduce',serviceWorkers:sw?'allow':'block'})
  await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));navigator.geolocation.getCurrentPosition=(_ok,error)=>error({code:1,message:'denied'})},{key,value:session(a)})
  const state={mode:'ok',privateVisible:true,delay:0}, unknown=[]
  await context.route('https://api.mapbox.com/**',r=>r.abort('failed'))
  await context.route('https://events.mapbox.com/**',r=>r.abort('failed'))
  await context.routeWebSocket(/.*/,s=>s.close())
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname,uid=req.headers().authorization?.includes(b)?b:a
    const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
    if(path==='/auth/v1/user')return reply(user(uid))
    if(path==='/auth/v1/logout')return reply({})
    if(path==='/rest/v1/notifications')return reply([])
    if(path==='/rest/v1/categories')return reply([{id:categoryId,name:'Arte',is_active:true}])
    if(path==='/rest/v1/profiles')return reply({id:uid,display_name:uid===a?'Ana de prueba':'Bruno de prueba',username:uid===a?'ana':'bruno',bio:null,avatar_file_id:null})
    if(path==='/rest/v1/user_category_interests')return reply([{category:{id:categoryId,name:'Arte',is_active:true}}])
    if(path==='/rest/v1/rpc/search_public_events') {
      if(state.delay)await new Promise(r=>setTimeout(r,state.delay))
      return state.mode==='error'?reply({message:'fixture failure'},503):reply(state.mode==='empty'?[]:[{...event,visibility:'public',title:'Resultado público de prueba'}])
    }
    if(path==='/rest/v1/rpc/get_suggested_events')return reply([])
    if(path==='/rest/v1/rpc/get_event_access_grants')return reply({title:event.title,event_state:'open',next_cursor:null,grants:[{id:'40000000-0000-4000-8000-000000000001',user_id:b,username:'bruno',display_name:'Bruno Rodríguez',avatar_url:null,status:'active',is_confirmed:true}]})
    if(path==='/rest/v1/events')return reply(state.privateVisible&&uid===a?[event]:[])
    if(path==='/rest/v1/event_images')return reply([])
    if(path==='/rest/v1/rpc/get_event_organizer')return reply([{display_name:'Ana de prueba',username:'ana'}])
    if(path==='/rest/v1/rpc/get_event_link_status')return reply(false)
    if(path==='/rest/v1/rpc/get_event_participation_summary')return reply([{confirmed_count:1,capacity:10,available_spots:9,own_status:null,is_organizer:uid===a,event_state:'open'}])
    unknown.push(path);return reply([])
  })
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  return {context,page,state,unknown}
}
async function inspect(page,label,width,height) {
  await page.evaluate(()=>document.fonts.ready)
  await page.waitForTimeout(350) // Let route entry/layout settle before recording pixels.
  const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,shell:!!document.querySelector('.amanecer-shell'),background:getComputedStyle(document.querySelector('.amanecer-shell')).backgroundColor,font:getComputedStyle(document.querySelector('h1')).fontFamily,fontLoaded:document.fonts.check('16px "Bricolage Grotesque"'),dock:document.querySelectorAll('.primary-nav a').length,controls:[...document.querySelectorAll('.discovery-filters button,.access-page button:not(dialog button),.interests-page button,.primary-nav a')].filter(e=>e.getBoundingClientRect().height).map(e=>({name:e.getAttribute('aria-label')||e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))}))
  assert.equal(geometry.overflow,false,label);assert.equal(geometry.shell,true);assert.ok(geometry.font.includes('Bricolage'));assert.equal(geometry.fontLoaded,true)
  assert.equal(geometry.dock,4)
  for(const c of geometry.controls)assert.ok(c.height>=43.99&&c.width>=43.99,`${label}: ${c.name} ${c.width}×${c.height}`)
  await page.screenshot({path:`${output}/${label}-${width}x${height}.png`,fullPage:true,animations:'disabled',caret:'hide'})
  results.push({test:label,viewport:`${width}x${height}`,geometry,result:'PASS'})
}
try {
  for(const [width,height] of (process.argv.includes('--stress-only')?[]:[[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900],[320,400]])) {
    const {context,page,unknown}=await fixture(width,height)
    try {
      for(const [label,path,ready] of [
        ['home','/home','Inicio'],['map-failure','/map?radius=10','Encontrá tu próximo plan'],
        ['interests','/me/interests','Mis intereses'],['access',`/events/${id}/access`,'Accesos al evento'],
        ['invite-lost','/invite','Invitación a un evento'],
      ]) {
        await page.goto(base+path);await page.getByRole('heading',{name:ready,exact:true}).waitFor()
        if(label==='home')await page.getByText('Resultado público de prueba',{exact:true}).waitFor()
        if(label==='map-failure') {
          await page.getByText(/Centro del mapa \(Buenos Aires, punto inicial\)/).first().waitFor()
          await page.locator('.map-results').getByText('Resultado público de prueba',{exact:true}).waitFor()
          await page.getByText(/No pudimos cargar el mapa/).waitFor()
        }
        if(label==='access')await page.getByText('@bruno',{exact:true}).waitFor()
        if(label==='interests')await page.getByRole('button',{name:'Arte',exact:true}).waitFor()
        await inspect(page,label,width,height)
        if(label==='map-failure') {
          const card=page.locator('.map-results .event-card').first()
          await card.scrollIntoViewIfNeeded();await page.waitForTimeout(350)
          await page.screenshot({path:`${output}/map-result-visible-${width}x${height}.png`,animations:'disabled'})
          assert.ok(await card.getByText('Resultado público de prueba',{exact:true}).isVisible())
          results.push({test:'Mapbox failure: scroll reaches rendered result (content-visibility auto)',viewport:`${width}x${height}`,result:'PASS'})
        }
      }
      await page.goto(`${base}/events/${id}/access`);await page.getByText('@bruno',{exact:true}).waitFor()
      await page.getByRole('button',{name:'Revocar acceso de Bruno Rodríguez'}).click()
      const dialog=page.getByRole('dialog');await dialog.waitFor();await page.screenshot({path:`${output}/dialog-${width}x${height}.png`,animations:'disabled'})
      assert.ok(await dialog.getByRole('button',{name:'Cancelar',exact:true}).evaluate(e=>e===document.activeElement))
      const confirm=dialog.getByRole('button',{name:'Revocar acceso',exact:true})
      await confirm.scrollIntoViewIfNeeded()
      assert.ok(await confirm.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}))
      await page.screenshot({path:`${output}/dialog-confirm-${width}x${height}.png`,animations:'disabled'})
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'})
      await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Revocar acceso de Bruno Rodríguez')
      results.push({test:'Dialog initial focus/Escape/return',viewport:`${width}x${height}`,result:'PASS'})
      assert.deepEqual(unknown,[])
    } finally {await context.close()}
  }
  {
    const {context,page,state}=await fixture(320,400)
    try {
      await page.emulateMedia({reducedMotion:'reduce',reducedTransparency:'reduce'})
      await page.goto(base+'/home');await page.getByText('Resultado público de prueba',{exact:true}).waitFor()
      await page.addStyleTag({content:'.discovery-filters,.home-heading,.event-card {font-size:200%} .discovery-filters button,.discovery-filters label {font-size:inherit}'})
      await inspect(page,'enlarged-text',320,400)
      await page.getByLabel('Buscar eventos',{exact:true}).focus()
      await page.waitForTimeout(350)
      const focus=await page.getByLabel('Buscar eventos',{exact:true}).evaluate(e=>({outline:getComputedStyle(e).outlineWidth,color:getComputedStyle(e).outlineColor}))
      assert.equal(focus.outline,'3px');assert.equal(focus.color,'rgb(91, 52, 214)')
      state.mode='empty';await page.goto(base+'/home?q=sin-coincidencias');await page.getByText('Ningún evento coincide con tu búsqueda',{exact:true}).waitFor();await inspect(page,'empty',320,400)
      state.mode='error';await page.goto(base+'/home');await page.getByText('No se pudo cargar Inicio',{exact:true}).waitFor();await inspect(page,'error',320,400)
      state.mode='ok';await page.getByRole('button',{name:'Reintentar',exact:true}).click();await page.getByText('Resultado público de prueba',{exact:true}).waitFor()
      state.delay=1800;await page.goto(base+'/home');await page.getByText('Buscando eventos',{exact:true}).waitFor();await inspect(page,'loading',320,400)
      results.push({test:'Enlarged text, reduced preferences, focus 3px violet, empty/error/retry/loading',focus,result:'PASS'})
    } finally {await context.close()}
  }
  {
    const {context,page,state}=await fixture(375,812,{sw:true})
    try {
      await page.goto(`${base}/events/${id}`);await page.getByRole('heading',{name:event.title,exact:true}).waitFor()
      await page.evaluate(async()=>{await navigator.serviceWorker.ready})
      await page.getByRole('button',{name:'Cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click()
      await page.getByRole('heading',{name:'Ingresá a PlanIt',exact:true}).waitFor()
      state.privateVisible=false
      await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:session(b)})
      await page.goto(`${base}/events/${id}`);await page.getByRole('heading',{name:'Evento no disponible',exact:true}).waitFor()
      assert.equal(await page.getByRole('heading',{name:event.title,exact:true}).count(),0)
      const cachesSnapshot=await page.evaluate(async()=>{const names=await caches.keys();return Promise.all(names.map(async name=>({name,urls:(await (await caches.open(name)).keys()).map(r=>r.url)})))})
      assert.ok(cachesSnapshot.length>0)
      assert.ok(cachesSnapshot.every(c=>c.urls.every(url=>!url.includes('supabase.co')&&!url.includes('#token=')&&!url.includes('/events/'))))
      await writeFile(`${output}/pwa-cache.json`,JSON.stringify(cachesSnapshot,null,2)+'\n')
      results.push({test:'Production service worker: logout/account B denial, no private REST/media/event/token cache',result:'PASS',evidence:'Auth/REST intercepted; real local production SW, not physical installed PWA'})
    } finally {await context.close()}
  }
  assert.deepEqual(errors,[])
  await writeFile(`${output}/results.json`,JSON.stringify({environment:'Edge production app; Auth/REST fixtures, Mapbox failure injected, WebSocket blocked; browser emulation and local SW; no remote HTTP/JWT or physical device',results,errors},null,2)+'\n')
  console.log(`PASS: ${results.length} supplemental UI groups`)
} finally {await browser.close()}
