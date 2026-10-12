import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4186'
const out = 'docs/design/verification/r3-block-2'
await mkdir(out, { recursive: true })
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002'
const id = '30000000-0000-4000-8000-000000000001'
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const user = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const results=[]
try {
  for(const [width,height] of [[360,800],[375,812],[390,844],[768,1024],[1280,900]]) {
    let event = { id, organizer_id:owner, title:'After primaveral — prueba', description:'Jazz fusión y DJ set. Datos ficticios.', starts_at:'2099-10-12T22:00:00', ends_at:'2099-10-13T03:00:00', address:'Av. Corrientes 123, Buenos Aires', location_name:'Centro cultural', latitude:-34.6, longitude:-58.38, capacity:80, category_id:category.id, visibility:'public', cancelled_at:null, archived_at:null }
    let failure='', readFailure=false, slow=false, writes=0, confirmed=48, summaryFailure=false, photoFailure=false
    const contexts=[],errors=[]
    async function pageFor(identity) {
      const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo'});contexts.push(context)
      await context.addInitScript(({key,identity,user})=>localStorage.setItem(key,JSON.stringify({access_token:`fixture-${identity}`,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),{key,identity,user:user(identity)})
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
        const req=route.request(),url=new URL(req.url()),path=url.pathname
        const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
        if(path==='/auth/v1/user')return reply(user(identity))
        if(path==='/rest/v1/events') {
          if(readFailure)return route.abort('failed')
          return reply(url.searchParams.get('id')===`eq.${id}`?[event]:[])
        }
        if(path==='/rest/v1/categories')return reply([category])
        if(path==='/rest/v1/event_images')return reply([{files:{storage_path:`${owner}/cover.webp`}}])
        if(path==='/storage/v1/object/sign/event_media')return reply(req.postDataJSON().paths.map(path=>({path,signedURL:`/object/sign/event_media/${path}?token=fixture`})))
        if(path.startsWith('/storage/v1/object/sign/event_media/')) {
          if(photoFailure)return route.abort('failed')
          return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300"><rect width="800" height="300" fill="#25204f"/><circle cx="600" cy="100" r="120" fill="#7651df"/><path d="M0 300L240 120L450 300" fill="#0753ff"/></svg>'})
        }
        if(path==='/rest/v1/rpc/get_event_participation_summary')return summaryFailure?reply({code:'42501',message:'fixture'},403):reply([{confirmed_count:confirmed,capacity:event.capacity,available_spots:event.capacity-confirmed,own_status:null,is_organizer:identity===owner,event_state:'open'}])
        if(path==='/rest/v1/rpc/get_event_organizer')return reply([{display_name:'Organizador de prueba',username:'fixture'}])
        if(path==='/rest/v1/rpc/update_event') {
          writes++;const body=req.postDataJSON();assert.equal(body.p_event_id,id);assert.equal(Object.keys(body).length,11)
          if(slow)await new Promise(resolve=>setTimeout(resolve,400))
          if(failure && failure!=='lost')return reply({code:failure==='missing'?'PGRST202':'P0001',message:failure},400)
          event={...event,title:body.p_title,description:body.p_description,starts_at:body.p_starts_at,ends_at:body.p_ends_at,category_id:body.p_category_id,capacity:body.p_capacity,address:body.p_address,latitude:body.p_latitude,longitude:body.p_longitude,location_name:body.p_location_name}
          if(failure==='lost')return route.abort('failed')
          return reply(id)
        }
        if(path==='/rest/v1/rpc/get_my_organized_events')return reply([{...event,category_name:'Música',event_state:'open',participation_status:null,image_path:null}])
        if(path==='/rest/v1/rpc/get_home_events' || path==='/rest/v1/rpc/discover_public_events')return reply([{...event,category_name:'Música',image_path:null}])
        return reply([])
      })
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));return page
    }
    const page=await pageFor(owner),other=await pageFor(guest)
    const form=()=>page.locator('form.event-form'),field=name=>page.locator(`[name="${name}"]`)
    const open=async()=>{await page.goto(`${origin}/events/${id}/edit`);await form().waitFor()}
    const check=test=>{results.push({viewport:`${width}x${height}`,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
    await open();assert.equal(await field('title').inputValue(),event.title);assert.equal(await field('start_time').inputValue(),'22:00');assert.equal(await field('end_date').inputValue(),'2099-10-13');assert.equal(await field('latitude').inputValue(),'-34.6');assert.equal(await field('capacity').getAttribute('min'),'48')
    assert.equal(await page.getByRole('button',{name:'Cambiar imagen'}).count(),0)
    await page.screenshot({path:`${out}/edit-${width}x${height}.png`,fullPage:true})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    const target=await page.getByRole('button',{name:'Guardar cambios',exact:true}).boundingBox();assert.ok(target.height>=44)
    check('Precarga completa, horario Argentina en Tokyo, portada de lectura, cupo y responsive')
    await field('start_date').fill('2020-01-01');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByText('El inicio debe ser posterior a la hora actual de Argentina.',{exact:true}).waitFor();assert.equal(writes,0)
    assert.equal(await field('start_time').evaluate(e=>e===document.activeElement),true)
    await field('start_date').fill('2099-10-12');await field('end_date').fill('2099-10-12');await field('end_time').fill('20:00');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByText('El fin debe ser posterior al inicio.',{exact:true}).waitFor();assert.equal(writes,0)
    await field('end_date').fill('2099-10-13');await field('end_time').fill('03:00');await field('capacity').fill('47');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByText('El cupo no puede ser menor que 48 inscriptos confirmados.',{exact:true}).waitFor();assert.equal(writes,0)
    check('Fechas pasadas/fin inválido/cupo insuficiente rechazados y foco en primer error')
    await field('capacity').fill('80');await field('title').fill('Título conservado');failure='capacity_below_confirmed';await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await field('title').inputValue(),'Título conservado')
    await page.screenshot({path:`${out}/error-${width}x${height}.png`,fullPage:true})
    failure='';slow=true;const before=writes;await page.getByRole('button',{name:'Guardar cambios',exact:true}).dblclick();await page.getByText('Cambios guardados',{exact:true}).waitFor();slow=false;assert.equal(writes,before+1);assert.equal(event.title,'Título conservado');assert.equal(event.id,id)
    check('Error de servidor conserva cambios; doble envío bloqueado; mismo ID y éxito en detalle')
    await page.getByRole('link',{name:'Editar evento',exact:true}).click();await form().waitFor();failure='lost';await field('title').fill('Respuesta perdida');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByText('Cambios guardados',{exact:true}).waitFor();assert.equal(event.title,'Respuesta perdida')
    check('Respuesta perdida tras commit se reconcilia por lectura sin segunda operación')
    await open();await field('title').fill('Comprobar después');readFailure=true;await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByRole('button',{name:'Comprobar guardado',exact:true}).waitFor();assert.equal(await field('title').isDisabled(),true)
    readFailure=false;failure='';const uncertainWrites=writes;await page.getByRole('button',{name:'Comprobar guardado',exact:true}).click();await page.getByText('Cambios guardados',{exact:true}).waitFor();assert.equal(writes,uncertainWrites)
    check('Estado incierto bloquea edición y comprobar reconsulta sin enviar UPDATE')
    await page.goto(`${origin}/my-events?section=organizing&filter=upcoming`);await page.getByRole('button',{name:`Acciones de ${event.title}`,exact:true}).click();await page.getByRole('link',{name:'Editar evento',exact:true}).click();await form().waitFor();await page.getByRole('link',{name:'Cancelar edición',exact:true}).click();await page.getByRole('link',{name:'Volver a Mis eventos',exact:true}).click();assert.match(page.url(),/filter=upcoming/)
    await page.getByRole('heading',{name:event.title,exact:true}).waitFor()
    for(const path of ['/home','/map']) {await page.goto(`${origin}${path}`);await page.getByRole('heading',{name:event.title,exact:true}).waitFor()}
    check('Menú integrado y cancelación preservan origen/filtro; listado muestra edición')
    await other.goto(`${origin}/events/${id}/edit`);await other.getByText('No autorizado',{exact:true}).waitFor();assert.equal(await other.locator('form').count(),0)
    await page.goto(`${origin}/events/30000000-0000-4000-8000-999999999999/edit`);await page.getByText('Evento no encontrado',{exact:true}).waitFor()
    for(const state of [{cancelled_at:'2026-10-11'},{archived_at:'2026-10-11'},{starts_at:'2020-01-01T20:00:00'}]){const original={...event};event={...event,...state};await page.goto(`${origin}/events/${id}/edit`);await page.getByText('Evento no editable',{exact:true}).waitFor();event=original}
    readFailure=true;await page.goto(`${origin}/events/${id}/edit`);await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();readFailure=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await form().waitFor()
    check('Ruta B/inexistente/cancelado/archivado/en curso denegados; carga fallida reintentable')
    summaryFailure=true;await page.goto(`${origin}/events/${id}/edit`);await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();summaryFailure=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await form().waitFor()
    failure='missing';await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByText('La edición todavía no está habilitada en este entorno.',{exact:true}).waitFor();assert.equal(await field('title').inputValue(),event.title)
    check('Resumen/catálogo requeridos; RPC ausente produce error claro sin éxito ficticio')
    assert.deepEqual(errors,[]);for(const context of contexts)await context.close()
  }
  await writeFile(`${out}/ui-results.json`,JSON.stringify({environment:'Edge headless; Auth/REST/Storage fixtures; timezone Asia/Tokyo; no remote HTTP/JWT',results},null,2))
} finally {await browser.close()}
