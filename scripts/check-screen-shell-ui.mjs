import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4194'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/ui-refresh/block-4-discovery/header-motion/after'
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

try {
 const id=event.id;
 for(const width of [320,375,390,768,1280]) {
  const context=await fixture({width,height:844},'organizer');
  const page=await context.newPage();
  let pilot;
  for(const path of ['/my-events','/home','/map','/me','/notifications','/events/new', '/events/'+id, '/events/'+id+'/edit', '/events/'+id+'/gallery', '/events/'+id+'/attendees']) {
   await page.goto(origin+path);
   await page.getByRole('button',{name:'Cuenta',exact:true}).waitFor();
   await page.evaluate(()=>document.fonts.ready);
   const header=await page.locator('.app-header').evaluate(el=>{
    const css=getComputedStyle(el),brand=getComputedStyle(el.querySelector('.brand')),button=getComputedStyle(el.querySelector('.account-menu-trigger'));
    return {width:el.getBoundingClientRect().width,padding:css.padding,font:css.fontFamily,color:brand.color,border:button.borderRadius,height:button.minHeight,background:button.backgroundColor};
   });
   pilot ??=header;
   assert.deepEqual(header,pilot,path+' header differs from pilot');
   assert.equal(await page.locator('.account-menu-trigger span').evaluate(el=>el.getBoundingClientRect().height<25),true,path+' Account wraps');
   assert.equal(await page.locator('.brand').evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');
   await page.getByRole('button',{name:'Cuenta',exact:true}).click();
   const profile=page.locator('.account-menu-panel').getByRole('link',{name:'Mi perfil'});
   await profile.waitFor();assert.equal(await profile.evaluate(el=>document.activeElement===el),true);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.account-menu-panel').count(),0);
   assert.equal(await page.getByRole('button',{name:'Cuenta',exact:true}).evaluate(el=>document.activeElement===el),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path+' overflow');
   await page.waitForTimeout(950);
   const motion=await page.locator('#main-content > :last-child > :first-child').evaluate(el=>({name:getComputedStyle(el).animationName,duration:getComputedStyle(el).animationDuration}));
   assert.equal(motion.name,'screen-rise',path+' entry');assert.equal(motion.duration,'0.6s');
   if(path==='/events/'+id) {
    await page.locator('.participation-action').waitFor();
    const geometry=await page.locator('.participation-action').evaluate(el=>{
     const ancestors=[];for(let parent=el.parentElement;parent;parent=parent.parentElement) ancestors.push(getComputedStyle(parent).animationName);
     const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,ancestors};
    });
    assert.ok(geometry.top>=0 && geometry.bottom<=844);assert.ok(!geometry.ancestors.includes('screen-rise'));
   }
   await page.screenshot({path:output+'/'+path.slice(1).replaceAll('/','-')+'-'+width+'.jpg',quality:75});
   metrics.push({path,width,header,motion});
  }
  await page.goto(origin+'/home');await page.getByRole('button',{name:'Cuenta',exact:true}).click();
  await page.locator('.primary-nav').getByRole('link',{name:'Mis eventos'}).click();
  await page.getByRole('heading',{name:'Mis eventos',exact:true}).waitFor();
  assert.equal(await page.locator('.account-menu-panel').count(),0,'Account closes on route navigation');
  await context.close();
 }
 const context=await fixture({width:390,height:844},'organizer');
 const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});
 for(const path of ['/home','/map','/my-events','/login','/register','/events/'+event.id]) {
  await page.goto(origin+path);await page.locator('#main-content > :last-child').waitFor();await page.waitForTimeout(300);
  const animations=await page.locator('#main-content').evaluate(el=>el.getAnimations({subtree:true}).map(a=>a.animationName));
  assert.ok(!animations.includes('screen-rise'),path+' reduced motion');
 }
 await context.close();
 await writeFile(output+'/results.json',JSON.stringify({environment:'Edge, local Vite, intercepted Auth/REST/Mapbox fixtures; no remote writes',metrics},null,2)+'\n');
 console.log('PASS: shared header across 10 product routes at 5 widths; Account focus/navigation; staggered entry; fixed-action ancestry; reduced motion');
} finally {await browser.close()}
