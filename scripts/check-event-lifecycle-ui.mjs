import assert from 'node:assert/strict'
import { mkdir,writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']})
const origin=process.env.PLANIT_UI_ORIGIN??'http://127.0.0.1:4187',out='docs/qa/event-lifecycle/ui'
await mkdir(out,{recursive:true})
const owner='20000000-0000-4000-8000-000000000001',id='30000000-0000-4000-8000-000000000001',category='10000000-0000-4000-8000-000000000001'
const user={id:owner,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const results=[]
try{
 for(const width of [320,375,390,768,1280]){
  let event={id,organizer_id:owner,title:'Encuentro de prueba',description:'Fixture de reactivación y borrado.',starts_at:'2099-10-12T22:00:00',ends_at:'2099-10-13T03:00:00',address:'Buenos Aires',location_name:'Centro cultural',latitude:-34.6,longitude:-58.38,capacity:80,category_id:category,visibility:'public',cancelled_at:'2026-10-12T12:00:00',archived_at:'2026-10-12T12:00:00'}
  let writes=0,deletions=0,receiptReads=0,loseResponse=false,receiptUnavailable=false
  const receipts=new Set(),errors=[]
  const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Tokyo',reducedMotion:'reduce',serviceWorkers:'block'})
  await context.addInitScript(({user})=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify({access_token:'fixture',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user})),{user})
  const state=()=>event?.archived_at?'archived':event?.cancelled_at?'cancelled':'open'
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname
   const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
   if(path==='/auth/v1/user')return reply(user)
   if(path==='/rest/v1/events')return reply(event?[event]:[])
   if(path==='/rest/v1/categories')return reply([{id:category,name:'Música',is_active:true}])
   if(path==='/rest/v1/event_images')return reply([])
   if(path==='/rest/v1/rpc/get_event_organizer')return reply([{display_name:'Organizador fixture',username:'fixture'}])
   if(path==='/rest/v1/rpc/get_event_participation_summary')return reply([{confirmed_count:48,capacity:80,available_spots:32,own_status:null,is_organizer:true,event_state:state()}])
   if(path==='/rest/v1/rpc/get_my_organized_events')return reply(event?[{...event,category_name:'Música',event_state:state(),participation_status:null,image_path:null}]:[])
   if(path==='/rest/v1/rpc/get_event_operation'){
    receiptReads++;if(receiptUnavailable&&receiptReads===1)return route.abort('failed')
    return reply(receipts.has(req.postDataJSON().p_operation_id))
   }
   if(path==='/rest/v1/rpc/reactivate_event'){
    writes++;const p=req.postDataJSON();assert.equal(p.p_event_id,id);assert.match(p.p_operation_id,/^[0-9a-f-]{36}$/)
    assert.equal(p.p_starts_at,'2099-11-12T09:30:00');assert.equal(p.p_ends_at,'2099-11-13T00:00:00')
    event={...event,title:p.p_title,description:p.p_description,starts_at:p.p_starts_at,ends_at:p.p_ends_at,capacity:p.p_capacity,cancelled_at:null,archived_at:null}
    receipts.add(p.p_operation_id)
    if(loseResponse)return route.abort('failed')
    return reply(id)
   }
   if(path==='/rest/v1/rpc/delete_event'){
    deletions++;assert.equal(req.postDataJSON().p_event_id,id);receipts.add(req.postDataJSON().p_operation_id);event=null
    if(loseResponse)return route.abort('failed')
    return reply(id)
   }
   return reply([])
  })
  const page=await context.newPage();page.setDefaultNavigationTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket(/supabase\.co/,socket=>socket.close())
  const field=name=>page.locator(`.event-form [name="${name}"]`)
  const check=test=>{results.push({width,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
  await page.goto(`${origin}/my-events?section=organizing&filter=archived`,{waitUntil:'domcontentloaded'})
  await page.getByRole('button',{name:'Acciones de Encuentro de prueba'}).click()
  await page.getByRole('link',{name:'Desarchivar',exact:true}).click()
  await page.getByRole('heading',{name:'Desarchivar evento',exact:true}).waitFor()
  assert.equal(await field('title').inputValue(),event.title);assert.equal(await field('start_date').inputValue(),'');assert.equal(await field('end_time').inputValue(),'')
  assert.equal(await field('capacity').getAttribute('min'),'1')
  await page.getByRole('link',{name:'Volver sin desarchivar'}).click()
  assert.equal(writes,0);assert.ok(event.archived_at)
  check('Archived list action opens prefilled form with empty dates; abandoning writes nothing')
  await page.goto(`${origin}/events/${id}`)
  await page.getByRole('link',{name:'Desarchivar',exact:true}).click()
  await page.locator('.event-form').waitFor()
  await field('start_date').fill('2099-11-12');await field('end_date').fill('2099-11-13')
  assert.equal(await field('start_time').getAttribute('inputmode'),'numeric');assert.equal(await field('start_time').getAttribute('type'),'text')
  await field('start_time').pressSequentially('0930',{delay:60});assert.equal(await field('start_time').inputValue(),'09:30')
  await field('start_time').press('Backspace');assert.equal(await field('start_time').inputValue(),'09:3')
  await field('start_time').pressSequentially('0');assert.equal(await field('start_time').inputValue(),'09:30')
  await field('end_time').fill('24:00')
  await page.getByRole('button',{name:'Desarchivar y reactivar',exact:true}).click()
  await page.getByText('Elegí una hora de fin válida.',{exact:true}).waitFor();assert.equal(writes,0)
  await field('end_time').fill('0000');assert.equal(await field('end_time').inputValue(),'00:00')
  await field('capacity').fill('1')
  await page.screenshot({path:`${out}/reactivate-${width}.png`,fullPage:true})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  loseResponse=true;receiptUnavailable=true
  await page.getByRole('button',{name:'Desarchivar y reactivar',exact:true}).click()
  await page.getByRole('button',{name:'Comprobar guardado',exact:true}).waitFor()
  assert.equal(await field('start_time').isDisabled(),true)
  await page.getByRole('button',{name:'Comprobar guardado',exact:true}).click()
  await page.getByRole('heading',{name:'Evento reactivado',exact:true}).waitFor()
  assert.equal(writes,1);assert.equal(event.archived_at,null)
  assert.equal(await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).count(),0)
  check('Numeric typing/paste/backspace, invalid 24:00, overnight midnight, reduced capacity, lost response recovered without a second write')
  event={...event,cancelled_at:'2026-10-12T12:00:00',archived_at:'2026-10-12T12:00:00'}
  await page.goto(`${origin}/events/${id}`)
  await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).click()
  const dialog=page.getByRole('dialog')
  await dialog.waitFor();assert.match(await dialog.innerText(),/Encuentro de prueba/);assert.match(await dialog.innerText(),/inscripciones.*historial.*chat.*fotos.*historias.*notificaciones/s)
  for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true)}
  await page.screenshot({path:`${out}/delete-${width}.png`})
  await page.keyboard.press('Escape');assert.equal(deletions,0)
  assert.equal(await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).evaluate(e=>e===document.activeElement),true)
  await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).click()
  receiptUnavailable=false
  await dialog.getByRole('button',{name:'Eliminar definitivamente',exact:true}).click()
  await page.waitForURL(url=>url.pathname==='/my-events');assert.equal(deletions,1)
  await page.getByRole('heading',{name:/No hay eventos en/}).waitFor()
  check('Named irreversible delete dialog, keyboard trap/Escape/focus return; lost response receipt removes event and returns to list')
  assert.deepEqual(errors,[])
  await context.close()
 }
 await writeFile(`${out}/results.json`,JSON.stringify({environment:'Edge headless; REST/Auth fixtures; Tokyo timezone; no physical keyboard or remote changes',results},null,2)+'\n')
}finally{await browser.close()}
