import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless:true, channel:'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4188', out='docs/design/verification/r3-block-6'
await mkdir(out,{recursive:true})
const owner='20000000-0000-4000-8000-000000000001', guest='20000000-0000-4000-8000-000000000002'
const id='30000000-0000-4000-8000-000000000001', other='30000000-0000-4000-8000-000000000002'
const key='sb-iepeqmvzjguwlhnecsdq-auth-token', results=[]
const user=identity=>({id:identity,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'})
const session=identity=>({access_token:`fixture-${identity}`,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:user(identity)})
try {
  for (const [width,height] of [[360,800],[375,812],[390,844],[768,1024],[1280,900]]) {
    let rows=Array.from({length:34},(_,i)=>({request_id:`40000000-0000-4000-8000-${String(i).padStart(12,'0')}`,participation_id:`50000000-0000-4000-8000-${String(i).padStart(12,'0')}`,status:'pending',requested_at:'2026-10-12T12:00:00',display_name:i===0?'Sofía Herrera':i===1?'Nicolás Pérez':`Solicitante ${i}`,username:`solicitante_${i}`}))
    let eventState='open', full=false, listFailure=false, mutationFailure='', resolutionFailure=false, slow=false, writes=0, ownStatus='removed', ownRequest={request_id:null,status:null,requested_at:null,resolved_at:null,next_eligible_at:null,can_request:true}, requestCalls=0, requestLost=false, ownFailure=false
    let releaseList, listStarted, listReads=0
    const resolutions=new Map(), contexts=[], errors=[]
    const event={id,organizer_id:owner,title:'After primaveral — prueba',description:'Datos ficticios para verificar reincorporación.',starts_at:'2099-10-12T22:00:00',ends_at:'2099-10-13T03:00:00',address:'Buenos Aires',location_name:'Centro cultural',latitude:-34.6,longitude:-58.38,capacity:80,category_id:'10000000-0000-4000-8000-000000000001',visibility:'public',cancelled_at:null,archived_at:null}
    const check=test=>{results.push({viewport:`${width}x${height}`,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
    async function pageFor(identity) {
      const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo'});contexts.push(context)
      if(identity) await context.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:session(identity)})
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
        const req=route.request(), path=new URL(req.url()).pathname
        const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
        const active=req.headers().authorization===`Bearer fixture-${guest}`?guest:identity
        if(path==='/auth/v1/user')return reply(user(active))
        if(path==='/auth/v1/logout')return reply({})
        if(path==='/rest/v1/events')return reply([event])
        if(path==='/rest/v1/categories')return reply([{id:event.category_id,name:'Música',is_active:true}])
        if(path==='/rest/v1/event_images')return reply([])
        if(path==='/rest/v1/rpc/get_event_organizer')return reply([{display_name:'Organizador',username:'organizador'}])
        if(path==='/rest/v1/rpc/get_event_participation_summary')return reply([{confirmed_count:full?80:48,capacity:80,available_spots:full?0:32,own_status:active===owner?null:ownStatus,is_organizer:active===owner,event_state:eventState}])
        if(path==='/rest/v1/rpc/get_my_rejoin_status')return ownFailure?route.abort('failed'):reply(ownRequest)
        if(path==='/rest/v1/rpc/request_rejoin') {
          assert.deepEqual(req.postDataJSON(),{p_event_id:id});requestCalls++;if(slow)await new Promise(r=>setTimeout(r,200))
          ownRequest={...ownRequest,request_id:'60000000-0000-4000-8000-000000000001',status:'pending',requested_at:'2026-10-12T12:00:00',can_request:false}
          return requestLost?route.abort('failed'):reply(ownRequest.request_id)
        }
        if(path==='/rest/v1/rpc/get_event_attendees')return reply({title:event.title,capacity:80,confirmed_count:48,removed_count:6,pending_count:rows.length,event_state:eventState,has_more:false,attendees:[]})
        if(path==='/rest/v1/rpc/get_event_rejoin_requests') {
          listReads++
          const args=req.postDataJSON();assert.equal(Object.keys(args).length,2)
          if(active!==owner||args.p_event_id===other)return reply({code:'42501',message:'event_unavailable'},403)
          if(listFailure==='missing')return reply({code:'PGRST202',message:'missing'},404)
          if(listFailure)return route.abort('failed')
          const data={title:event.title,capacity:80,confirmed_count:full?80:48,pending_count:rows.length,event_state:eventState,has_more:rows.length>args.p_offset+30,requests:rows.slice(args.p_offset,args.p_offset+30)}
          if(releaseList){listStarted?.();await new Promise(r=>{releaseList=r})}
          return reply(data)
        }
        if(path==='/rest/v1/rpc/resolve_rejoin') {
          const args=req.postDataJSON();assert.equal(Object.keys(args).length,3);assert.equal(args.p_event_id,id);writes++
          if(slow)await new Promise(r=>setTimeout(r,300))
          if(mutationFailure==='event_full')return reply({code:'P0001',message:'event_full'},400)
          resolutions.set(args.p_request_id,args.p_decision);rows=rows.filter(r=>r.request_id!==args.p_request_id)
          return mutationFailure==='lost'?route.abort('failed'):reply(null)
        }
        if(path==='/rest/v1/rpc/get_event_rejoin_resolution') {
          if(resolutionFailure)return route.abort('failed')
          const args=req.postDataJSON();assert.equal(args.p_event_id,id)
          return reply(resolutions.get(args.p_request_id)??'pending')
        }
        return reply([])
      })
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket(/supabase\.co/,s=>s.close());return page
    }
    const page=await pageFor(owner), list=()=>page.locator('.rejoin-list > li')
    const ready=async()=>{await page.getByRole('button',{name:'Actualizar solicitudes'}).waitFor();await page.waitForFunction(()=>!document.querySelector('.attendees-update button')?.disabled)}
    const open=async(name,decision='Aprobar')=>{await page.getByRole('button',{name:`${decision} solicitud de ${name}`,exact:true}).click();await page.getByRole('dialog').waitFor()}
    await page.goto(`${origin}/events/${id}/attendees`);await page.getByRole('link',{name:/Solicitudes/}).click();await list().last().waitFor();await ready()
    assert.equal(await list().count(),30);assert.equal(await page.getByText('@solicitante_0',{exact:true}).count(),1);assert.equal(await page.locator('.rejoin-page').getByText(/@gmail|fixture@example|motivo|Te avisaremos/).count(),0)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    await page.screenshot({path:`${out}/requests-${width}.png`})
    check('Asistentes navigation, 30 pending requests, safe identity, Argentina dates, original dark cards and no overflow')
    listFailure=true;await page.getByRole('button',{name:'Cargar más solicitudes'}).click();await page.getByRole('alert').waitFor();assert.equal(await list().count(),30)
    listFailure=false;await page.getByRole('button',{name:'Cargar más solicitudes'}).click();await page.getByText('Solicitante 33',{exact:true}).waitFor();assert.equal(await list().count(),34)
    await open('Sofía Herrera');assert.equal(await page.getByRole('button',{name:'Cancelar',exact:true}).evaluate(e=>e===document.activeElement),true)
    for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.equal(await page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement)),true)}
    await page.screenshot({path:`${out}/approve-dialog-${width}.png`});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(writes,0)
    await open('Sofía Herrera');await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(writes,0)
    mutationFailure='event_full';await open('Sofía Herrera');await page.getByRole('dialog').getByRole('button',{name:'Aprobar',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('alert').waitFor();assert.equal(await page.getByText('Sofía Herrera',{exact:true}).count(),1)
    check('Pagination retry preserves rows; confirmation cancel/Escape/focus; server full preserves pending')
    mutationFailure='lost';slow=true;await open('Sofía Herrera');const before=writes
    await page.getByRole('dialog').getByRole('button',{name:'Aprobar',exact:true}).evaluate(b=>{b.click();b.click()});await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(writes,before+1)
    assert.equal(await page.getByText('Sofía Herrera',{exact:true}).count(),0);await page.getByText(/Solicitud aprobada: Sofía/).waitFor()
    resolutionFailure=true;await open('Nicolás Pérez','Rechazar');await page.getByRole('dialog').getByRole('button',{name:'Rechazar',exact:true}).click();await page.getByRole('button',{name:'Comprobar estado',exact:true}).waitFor()
    await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();await open('Nicolás Pérez','Rechazar');await page.getByRole('button',{name:'Comprobar estado',exact:true}).waitFor()
    const uncertainWrites=writes;await page.getByRole('button',{name:'Comprobar estado',exact:true}).click();await page.getByRole('button',{name:'Comprobar estado',exact:true}).waitFor();assert.equal(writes,uncertainWrites)
    resolutionFailure=false;await page.getByRole('button',{name:'Comprobar estado',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(writes,uncertainWrites);await page.getByText(/Solicitud rechazada: Nicolás/).waitFor()
    check('Single submission; lost approval/rejection reconciled by exact status; failed reconciliation only reads on retry')
    mutationFailure='';slow=false;eventState='archived';await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await ready()
    assert.equal(await page.getByRole('button',{name:'Aprobar solicitud de Solicitante 2',exact:true}).isDisabled(),true)
    await open('Solicitante 2','Rechazar');await page.screenshot({path:`${out}/reject-dialog-${width}.png`});await page.getByRole('dialog').getByRole('button',{name:'Rechazar',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'})
    await page.goto(`${origin}/events/${other}/rejoin-requests`);await page.getByRole('heading',{name:'Solicitudes no disponibles'}).waitFor()
    const strangerPage=await pageFor(guest);await strangerPage.goto(`${origin}/events/${id}/rejoin-requests`);await strangerPage.getByRole('heading',{name:'Solicitudes no disponibles'}).waitFor()
    check('Closed approval disabled, rejection allowed; direct wrong-event and participant administration denied')
    // User workflow: full event is allowed to receive a request, never a reservation.
    eventState='open';full=true
    await strangerPage.goto(`${origin}/events/${id}`);await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).waitFor();await strangerPage.screenshot({path:`${out}/removed-${width}.png`,fullPage:true})
    slow=true;requestLost=true;await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).evaluate(b=>{b.click();b.click()});await strangerPage.getByText('Solicitud en revisión',{exact:true}).waitFor();assert.equal(requestCalls,1)
    await strangerPage.screenshot({path:`${out}/pending-${width}.png`,fullPage:true})
    ownRequest={...ownRequest,status:'rejected',resolved_at:'2026-10-12T12:00:00',next_eligible_at:'2026-10-19T12:00:00',can_request:false}
    await strangerPage.getByRole('button',{name:'Actualizar estado'}).click();await strangerPage.getByText('Solicitud rechazada',{exact:true}).waitFor();assert.equal(await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).count(),0)
    assert.match(await strangerPage.locator('.rejoin-own-state').innerText(),/19.*oct.*12:00/);await strangerPage.screenshot({path:`${out}/rejected-${width}.png`,fullPage:true})
    ownRequest={...ownRequest,can_request:true};await strangerPage.getByRole('button',{name:'Actualizar estado'}).click();await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).waitFor()
    ownFailure=true;await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).click();await strangerPage.getByRole('alert').waitFor();assert.equal(await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).count(),0)
    ownFailure=false;await strangerPage.getByRole('button',{name:'Actualizar estado'}).click();await strangerPage.getByText('Solicitud en revisión',{exact:true}).waitFor();assert.equal(requestCalls,2)
    ownStatus='confirmed';ownRequest={...ownRequest,status:'approved'};await strangerPage.getByRole('button',{name:'Actualizar estado'}).click();await strangerPage.getByText('Solicitud aprobada. Volvés a participar del evento.',{exact:true}).waitFor();await strangerPage.getByRole('link',{name:'Abrir chat del evento'}).waitFor()
    ownStatus='removed';eventState='ended';ownRequest={...ownRequest,can_request:false};await strangerPage.getByRole('button',{name:'Actualizar estado'}).click();await strangerPage.getByRole('button',{name:'Evento finalizado',exact:true}).waitFor();assert.equal(await strangerPage.getByRole('button',{name:'Solicitar reincorporación',exact:true}).count(),0)
    check('User first/full request, double click and lost response; pending/rejected/cooldown/eligible/approved/closed, Argentina in Tokyo, read failure blocks resend')
    // Empty and an environment without the proposed migration are honest states.
    const retained=rows;rows=[];eventState='open';await page.goto(`${origin}/events/${id}/rejoin-requests`);await page.getByRole('heading',{name:'No hay solicitudes pendientes'}).waitFor();await ready()
    listFailure='missing';await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await page.getByRole('alert').filter({hasText:'todavía no están habilitadas'}).waitFor()
    listFailure=false;rows=retained;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await list().last().waitFor();await ready()
    const priorReads=listReads, renewed={...session(owner),access_token:'fixture-renewed-owner'}
    await page.evaluate(({key,value})=>{localStorage.setItem(key,JSON.stringify(value));const channel=new BroadcastChannel(key);channel.postMessage({event:'TOKEN_REFRESHED',session:value});channel.close()},{key,value:renewed})
    await page.waitForFunction(()=>!!document.querySelector('.rejoin-list > li'));await page.waitForTimeout(100);assert.ok(listReads>priorReads);await ready()
    check('Empty list, missing migration/retry, token refresh revalidation; cancelled uncertain dialog still requires exact read')
    // Loaded administrative data must not survive an account change, even with a late read.
    eventState='open';await page.goto(`${origin}/events/${id}/rejoin-requests`);await list().last().waitFor();await ready()
    const started=new Promise(r=>{listStarted=r});releaseList=()=>{};await page.getByRole('button',{name:'Actualizar solicitudes'}).click();await started
    await page.evaluate(({key,value})=>{localStorage.setItem(key,JSON.stringify(value));const channel=new BroadcastChannel(key);channel.postMessage({event:'SIGNED_IN',session:value});channel.close()},{key,value:session(guest)})
    await page.getByRole('heading',{name:'Solicitudes no disponibles'}).waitFor();releaseList();releaseList=null;await page.waitForTimeout(100);assert.equal(await list().count(),0)
    const anon=await pageFor();await anon.goto(`${origin}/events/${id}/rejoin-requests`);await anon.waitForURL(url=>url.pathname==='/login')
    check('Account change discards late administrative response; anonymous route redirects to login')
    assert.deepEqual(errors,[])
    for(const context of contexts)await context.close()
  }
  await writeFile(`${out}/ui-results.json`,JSON.stringify({environment:'Edge browser, intercepted Supabase fixtures; Tokyo timezone; not live Auth/HTTP/JWT',results},null,2))
} finally {await browser.close()}
