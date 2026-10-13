import assert from 'node:assert/strict'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH).href)
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-0'
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4198'
const labOrigin = process.env.PLANIT_LAB_ORIGIN ?? 'http://127.0.0.1:4199'
const sha = execFileSync('git', ['rev-parse','HEAD'], { encoding:'utf8' }).trim()
if (sha !== '42af4e42d032637b1363e207714e86c297d8c3b1') throw new Error('Use the immutable audit base; run an updated audit separately')
let existing = false
try { await access(`${out}/capture-results.json`); existing = true } catch {}
if (existing) throw new Error('Choose a new PLANIT_UI_OUTPUT; published evidence must not be overwritten')
const browser = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] })
const id='20000000-0000-4000-8000-000000000001', eid='30000000-0000-4000-8000-000000000001'
const category={id:'10000000-0000-4000-8000-000000000001',name:'Música',is_active:true}
const user={id,email:'audit@fixture.example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const event={id:eid,organizer_id:id,title:'Encuentro de música — fixture',description:'Datos ficticios para inspeccionar composición, foco y scopes. No es un evento real.',starts_at:'2099-10-11T20:00:00',ends_at:'2099-10-11T22:00:00',address:'Av. Corrientes 123, Buenos Aires',location_name:'Centro cultural de prueba',latitude:-34.6,longitude:-58.38,capacity:20,category_id:category.id,visibility:'public',cancelled_at:null,archived_at:null}
const second={...event,id:'30000000-0000-4000-8000-000000000002',title:'Evento sin foto — fixture'}
const path=`${id}/${eid}/fixture.svg`
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#c5b5ff"/><circle cx="240" cy="140" r="82" fill="#060b27"/><text x="240" y="278" text-anchor="middle" font-size="24" fill="#060b27">Imagen de prueba</text></svg>'
const results=[], unexpected=[], pageErrors=[]
let mode='full', writes=0
async function fixture(viewport){
 const context=await browser.newContext({viewport,timezoneId:'Asia/Tokyo',serviceWorkers:'block',reducedMotion:'reduce'})
 await context.addInitScript(user=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),user)
 await context.routeWebSocket(/supabase\.co/,ws=>ws.close())
 await context.route('**/*',route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname
  if(url.origin===origin || url.origin===labOrigin) return route.continue()
  if(!url.hostname.endsWith('.supabase.co')) return route.abort()
  const reply=(json,status=200)=>route.fulfill({status,json})
  if(p==='/auth/v1/user') return reply(user)
  if(p==='/rest/v1/notifications') return route.fulfill({status:200,headers:{'content-range':'0-0/0'},body:''})
  if(p.endsWith('/profiles')) return reply({display_name:'Ana de prueba',username:'ana_fixture',bio:'Perfil ficticio para auditoría documental.',avatar_file_id:null})
  if(p.endsWith('/categories')) return reply([category])
  if(p.endsWith('/events')) return reply([event])
  if(p.endsWith('/event_images')) return reply(mode==='no-photo'?[]:[{sort_order:0,files:{storage_path:path}}])
  if(p.endsWith('/get_home_events') || p.endsWith('/discover_public_events')) return mode==='error'?reply({message:'Fixture offline',code:'500'},500):reply([{...event,category_name:category.name,image_path:path},{...second,category_name:category.name,image_path:null}])
  if(p.endsWith('/get_event_organizer')) return reply([{display_name:'Ana de prueba',username:'ana_fixture'}])
  if(p.endsWith('/get_event_participation_summary')) return reply([{confirmed_count:3,capacity:20,available_spots:17,own_status:null,is_organizer:true,event_state:'open'}])
  if(p==='/storage/v1/object/sign/event_media') return reply(req.postDataJSON().paths.map(path=>({path,signedURL:`/object/sign/event_media/${path}?token=fixture`})))
  if(p.startsWith('/storage/v1/object/sign/event_media/')) return route.fulfill({contentType:'image/svg+xml',body:svg})
  if(req.method()!=='GET' && req.method()!=='HEAD') writes++
  unexpected.push({method:req.method(),path:p}); return reply({message:'Unhandled fixture'},400)
 })
 return context
}
async function shot(page,name,route,kind){
 await page.goto(route)
 await page.getByRole('heading',{level:1}).first().waitFor()
 if(kind==='baseline') {
   if(name.startsWith('home')) await page.getByRole('heading',{name:mode==='error'?'No se pudo cargar Inicio':'Música',exact:true}).waitFor()
   if(name.startsWith('profile')) await page.getByText('Ana de prueba',{exact:true}).waitFor()
   if(name.startsWith('detail')) await page.getByRole('button',{name:'Actualizar estado'}).waitFor()
   if(name.startsWith('map')) await page.getByText('Evento sin foto — fixture',{exact:true}).waitFor()
 }
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))})
 const metrics=await page.evaluate(()=>({shell:document.querySelector('.app-shell')?.className??null,font:getComputedStyle(document.querySelector('h1')).fontFamily,fontLoaded:document.fonts.check('16px "Bricolage Grotesque"'),background:getComputedStyle(document.querySelector('.app-shell')??document.body).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth,dock:[...document.querySelectorAll('.primary-nav a')].map(a=>({name:a.textContent,active:a.getAttribute('aria-current')})),focus:document.activeElement?.id,heading:document.querySelector('h1')?.textContent}))
 if(kind==='baseline'){assert.equal(metrics.overflow,false);assert.match(metrics.shell,/amanecer-shell/);assert.equal(metrics.dock.length,4);assert.equal(metrics.fontLoaded,true)}
 await page.screenshot({path:`${out}/${kind}/${name}.png`,fullPage:true})
 results.push({name,kind,route:new URL(route).pathname,viewport:page.viewportSize(),...metrics})
}
try{
 await mkdir(`${out}/baseline`,{recursive:true});await mkdir(`${out}/lab`,{recursive:true})
 for(const viewport of [{width:375,height:812},{width:1280,height:900}]){
  const context=await fixture(viewport),page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message))
  for(const [name,route] of [['home','/home'],['map','/map'],['profile','/me'],['detail',`/events/${eid}`]]) await shot(page,`${name}-${viewport.width}x${viewport.height}`,origin+route,'baseline')
  await context.close()
 }
 const context=await fixture({width:375,height:812}),page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message))
 mode='no-photo';await shot(page,'detail-no-photo-375x812',origin+`/events/${eid}`,'baseline')
 mode='error';await shot(page,'home-error-375x812',origin+'/home','baseline');mode='full'
 await context.close()
 const lab=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block',reducedMotion:'reduce'})
 await lab.route('**/*',r=>new URL(r.request().url()).origin===labOrigin?r.continue():r.abort())
 const lp=await lab.newPage();for(const route of ['home','map','profile','event']) await shot(lp,`${route}-375x812`,`${labOrigin}/b/${route}`,'lab')
 await lab.close()
 assert.equal(writes,0);assert.deepEqual(unexpected,[]);assert.deepEqual(pageErrors,[])
 await writeFile(`${out}/capture-results.json`,JSON.stringify({sha,browser:browser.version(),kind:'read-only UI fixtures; not remote JWT',map:'Mapbox unavailable fallback; day preset inspected in code only',labFonts:'External requests blocked; prototype font fallback',results,writes,unexpected,pageErrors},null,2)+'\n')
 console.log(JSON.stringify({captures:results.length,writes,unexpected,pageErrors,sha}))
}finally{await browser.close()}
