import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4192'
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r5-block-2/ui'
const baseline = process.env.PLANIT_R5_BASELINE === '1'
await mkdir(out, { recursive: true })
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002', stranger = '20000000-0000-4000-8000-000000000003'
const eventId = '30000000-0000-4000-8000-000000000001', otherEvent = '30000000-0000-4000-8000-000000000002'
const identity = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = id => ({ access_token: `fixture-${id}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: 'bearer', user: identity(id) })
const results = [], errors = []
let failure
try {
  for (const width of baseline ? [390,1280] : process.env.PLANIT_R5_EXTENDED ? [390] : [320,360,375,390,768,1280]) {
    const contexts = []
    let rows = Array.from({ length: 34 }, (_, i) => ({ user_id: `50000000-0000-4000-8000-${String(i + 1).padStart(12,'0')}`, display_name: i === 0 ? 'Camila Torres' : `Participante ${i+1}`, username: `persona_${i+1}`, avatar: null }))
    let permitted = true, network = false, blocked = false, malformed = false, slow = false, reads = 0, adminReads = 0, avatarRequests = 0, release
    const event = { id:eventId, organizer_id:owner, title:'Encuentro de primavera — fixture', description:'Evento ficticio para prueba local.', starts_at:'2099-10-12T22:00:00', ends_at:'2099-10-13T03:00:00', address:'Buenos Aires', location_name:'Centro cultural', latitude:-34.6, longitude:-58.38, capacity:80, category_id:'10000000-0000-4000-8000-000000000001', visibility:'unlisted', cancelled_at:null, archived_at:null }
    const check = test => { results.push({ viewport:width, test, result:'PASS' }); console.log(`PASS ${width}: ${test}`) }
    async function pageFor(actor) {
      const context = await browser.newContext({ viewport:{width,height:900}, timezoneId:'Asia/Tokyo', reducedMotion:'reduce' }); contexts.push(context)
      if (actor) await context.addInitScript(({key,value}) => localStorage.setItem(key,JSON.stringify(value)), {key:'sb-iepeqmvzjguwlhnecsdq-auth-token',value:session(actor)})
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
        const path = new URL(route.request().url()).pathname
        const args = route.request().postDataJSON()
        const reply = (data,status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
        const deny = () => reply({code:'42501',message:'participants_unavailable'},403)
        if (path === '/auth/v1/user') return reply(identity(actor))
        if (path === '/auth/v1/logout') return reply({})
        if (path === '/rest/v1/events') return reply([event])
        if (path === '/rest/v1/categories') return reply([{id:event.category_id,name:'Música',is_active:true}])
        if (path === '/rest/v1/event_images') return reply([])
        if (path === '/rest/v1/rpc/get_event_organizer') return reply([{display_name:'Organizador',username:'organizador'}])
        if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{confirmed_count:34,capacity:80,available_spots:46,is_organizer:actor===owner,own_status:actor===guest?'confirmed':null,event_state:'open'}])
        if (path === '/rest/v1/rpc/get_event_attendees') {
          adminReads++
          if(actor!==owner) return deny()
          return reply({title:event.title,capacity:80,confirmed_count:34,removed_count:0,pending_count:0,event_state:'open',has_more:false,attendees:rows.slice(0,5).map(row=>({...row,participation_id:row.user_id,status:'confirmed'}))})
        }
        if (path === '/rest/v1/rpc/get_event_social_participants') {
          reads++
          assert.deepEqual(Object.keys(args).sort(),['p_after_user_id','p_event_id','p_limit']); assert.equal(args.p_limit,30)
          if(slow) { slow=false; await new Promise(resolve=>{release=resolve}) }
          if(network) return route.abort('failed')
          if(!permitted || actor===stranger || args.p_event_id!==eventId) return deny()
          if(malformed) return reply({participants:[{user_id:'not-a-uuid',display_name:'Bad',username:'bad',avatar:null}],next_cursor:null})
          const visible=blocked?rows.slice(1):rows
          const selected=visible.filter(row=>!args.p_after_user_id || row.user_id>args.p_after_user_id).slice(0,31)
          return reply({participants:selected.slice(0,30),next_cursor:selected.length>30?selected[29].user_id:null})
        }
        if (path === '/rest/v1/rpc/get_social_relationship') return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility:'private',follow:null})
        if (path === '/rest/v1/rpc/get_social_counts') return reply({followers:0,following:0})
        if (path === '/rest/v1/rpc/get_social_profile_events') return reply({events:[],next_cursor:null})
        if (path === '/rest/v1/rpc/get_social_profile') {
          if(blocked) return reply({unavailable:true})
          const row=rows.find(row=>row.user_id===args.p_user_id)
          return reply(row?{...row,bio:'Authorized fixture bio; B3 deferred'}:{unavailable:true})
        }
        if(path === '/functions/v1/social-avatar') {avatarRequests++; assert.deepEqual(Object.keys(args),['user_id']); return reply({error:'avatar_unavailable'},503)}
        if (path.startsWith('/rest/v1/')) return reply([])
        return reply({})
      })
      const page = await context.newPage(); page.on('pageerror',error=>errors.push(error.message)); return page
    }
    const page = await pageFor(baseline?owner:guest)
    await page.goto(`${origin}/events/${eventId}/attendees`)
    if(baseline) {
      await page.getByRole('heading',{name:'Asistentes',exact:true}).waitFor(); await page.locator('.attendees-list li').first().waitFor(); await page.evaluate(()=>document.fonts.ready)
      await page.screenshot({path:`${out}/before-${width}.png`,fullPage:true}); check('Baseline B1 administration capture'); await Promise.all(contexts.map(context=>context.close())); continue
    }
    const links = () => page.locator('.social-participant-link')
    await links().first().waitFor(); assert.equal(await links().count(),30); assert.equal(adminReads,0)
    for(const control of [links().first(),page.getByRole('button',{name:'Actualizar participantes',exact:true}),page.getByRole('button',{name:'Cargar más participantes',exact:true})]) assert.ok((await control.boundingBox()).height>=44)
    assert.equal(await page.getByText('Removidos',{exact:true}).count(),0); assert.equal(await page.locator('.attendee-actions').count(),0)
    await page.evaluate(()=>document.fonts.ready); await page.screenshot({path:`${out}/participants-${width}.png`,fullPage:true})
    check('Confirmed default route uses social RPC only; no administration')
    await page.getByRole('button',{name:'Cargar más participantes',exact:true}).click(); await page.getByRole('button',{name:'Actualizar participantes',exact:true}).waitFor({state:'visible'})
    await page.waitForFunction(()=>document.querySelectorAll('.social-participant-link').length===34); assert.equal(await page.getByRole('button',{name:'Cargar más participantes',exact:true}).count(),0)
    check('Cursor pagination refetches previous pages, 34 unique identities')
    await links().first().focus(); assert.equal(await links().first().evaluate(el=>getComputedStyle(el).outlineWidth),'3px')
    await page.screenshot({path:`${out}/focus-${width}.png`}); await page.keyboard.press('Enter'); await page.getByRole('heading',{name:'Camila Torres',exact:true}).waitFor()
    assert.equal(await page.getByText('Authorized fixture bio; B3 deferred',{exact:true}).count(),0)
    await page.getByRole('link',{name:'Volver a participantes',exact:true}).click(); await links().first().waitFor(); assert.ok(page.url().endsWith('?view=social'))
    check('Keyboard profile navigation, minimal identity, validated return to event list')
    blocked=true; await page.getByRole('button',{name:'Actualizar participantes',exact:true}).click(); await page.waitForFunction(()=>document.querySelectorAll('.social-participant-link').length===30)
    assert.equal(await page.getByText('Camila Torres',{exact:true}).count(),0)
    await page.goto(`${origin}/users/${rows[0].user_id}`); await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor(); assert.equal(await page.locator('.social-avatar').count(),0)
    check('Bilateral-block fixture removed from refreshed list; direct profile neutral with no avatar')
    blocked=false; await page.goto(`${origin}/events/${eventId}/attendees?view=social`); await links().first().waitFor()
    permitted=false; await page.getByRole('button',{name:'Cargar más participantes',exact:true}).click(); await page.getByRole('heading',{name:'Participantes no disponibles',exact:true}).waitFor(); assert.equal(await links().count(),0)
    check('Revoked access on pagination clears all earlier identities')
    permitted=true; await page.getByRole('button',{name:'Actualizar participantes',exact:true}).click(); await links().first().waitFor()
    network=true; await page.getByRole('button',{name:'Actualizar participantes',exact:true}).click(); await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor(); assert.equal(await links().count(),0)
    await page.screenshot({path:`${out}/error-${width}.png`}); network=false; await page.getByRole('button',{name:'Reintentar',exact:true}).click(); await links().first().waitFor()
    malformed=true; await page.getByRole('button',{name:'Actualizar participantes',exact:true}).click(); await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor(); assert.equal(await links().count(),0); malformed=false
    await page.getByRole('button',{name:'Reintentar',exact:true}).click(); await links().first().waitFor()
    check('Network/invalid response fails closed, retry restores list')
    rows=rows.slice(0,3).map((row,i)=>({...row,display_name:i===0?'María de los Ángeles Fernández '.repeat(6):row.display_name,username:'identidad_larga_'.repeat(6),avatar:i===0?row.user_id:null}))
    await page.getByRole('button',{name:'Actualizar participantes',exact:true}).click(); await page.waitForFunction(()=>document.querySelectorAll('.social-participant-link').length===3)
    await page.waitForFunction(()=>!document.querySelector('[aria-busy=true]')); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    assert.ok(avatarRequests>0); assert.equal(await page.locator('.social-avatar img').count(),0)
    await page.screenshot({path:`${out}/long-avatar-fallback-${width}.png`,fullPage:true})
    await page.evaluate(()=>{for(const node of document.querySelectorAll('.social-participants *')) node.style.fontSize=`${parseFloat(getComputedStyle(node).fontSize)*2}px`})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await page.screenshot({path:`${out}/text-200-${width}.png`,fullPage:true})
    check('Long text at 200%, 44px targets/focus, gateway failure avatar fallback')
    await page.reload(); await links().first().waitFor(); await page.clock.install(); permitted=false; await page.clock.fastForward(31000)
    await page.getByRole('heading',{name:'Participantes no disponibles',exact:true}).waitFor(); assert.equal(await links().count(),0)
    check('30s visible permission revalidation clears revoked identities')
    await page.clock.resume(); permitted=true; rows=[]; await page.getByRole('button',{name:'Actualizar participantes',exact:true}).click(); await page.getByRole('heading',{name:'No hay participantes visibles',exact:true}).waitFor(); await page.screenshot({path:`${out}/empty-${width}.png`})
    const foreign=await pageFor(stranger); await foreign.goto(`${origin}/events/${eventId}/attendees?view=social`); await foreign.getByRole('heading',{name:'Participantes no disponibles',exact:true}).waitFor(); assert.equal(await foreign.locator('.social-participant-link').count(),0); await foreign.screenshot({path:`${out}/denied-${width}.png`})
    await page.goto(`${origin}/events/${otherEvent}/attendees?view=social`); await page.getByRole('heading',{name:'Participantes no disponibles',exact:true}).waitFor(); assert.equal(await links().count(),0)
    check('Empty, grant-only/third-party and other event route expose no cross-event data')
    const organizer=await pageFor(owner); await organizer.goto(`${origin}/events/${eventId}/attendees`); await organizer.getByRole('heading',{name:'Asistentes',exact:true}).waitFor(); await organizer.getByRole('link',{name:'Ver participantes',exact:true}).click(); await organizer.getByRole('heading',{name:'Participantes',exact:true}).waitFor()
    const anonymous=await pageFor(null); await anonymous.goto(`${origin}/events/${eventId}/attendees?view=social`); await anonymous.getByRole('heading',{name:'Ingresá a PlanIt',exact:true}).waitFor()
    await foreign.getByRole('button',{name:'Cuenta',exact:true}).click(); await foreign.getByRole('button',{name:'Cerrar sesión',exact:true}).click(); await foreign.getByRole('heading',{name:'Ingresá a PlanIt',exact:true}).waitFor()
    check('Organizer administration preserved, social link, anonymous guard and logout')
    // Pending old route response cannot publish identities after navigation.
    rows=[{user_id:'50000000-0000-4000-8000-000000000099',display_name:'Delayed identity',username:'delayed',avatar:null}]; slow=true
    await page.goto(`${origin}/events/${eventId}/attendees?view=social`); await page.waitForFunction(()=>document.querySelector('[aria-busy=true]'))
    while(!release) await new Promise(resolve=>setTimeout(resolve,20))
    await page.goto(`${origin}/events/${otherEvent}/attendees?view=social`); release(); await page.getByRole('heading',{name:'Participantes no disponibles',exact:true}).waitFor(); assert.equal(await page.getByText('Delayed identity',{exact:true}).count(),0)
    check('Stale in-flight response from old event cannot populate new route')
    if(process.env.PLANIT_R5_EXTENDED) {
      await page.goto(`${origin}/events/${eventId}/attendees?view=social`); await links().first().waitFor()
      await page.context().setOffline(true); await page.getByText('Estás sin conexión. Reconectate para consultar los datos.',{exact:true}).waitFor(); assert.equal(await links().count(),0)
      await page.context().setOffline(false); await links().first().waitFor()
      await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))}); assert.equal(await links().count(),0)
      await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))}); await links().first().waitFor()
      check('Offline message clears identities, reconnect and foreground revalidate; targets measured at least44px')
      await page.goto(`${origin}/users/${guest}`); await page.getByRole('heading',{name:'Mi perfil',exact:true}).waitFor(); assert.ok(page.url().endsWith('/me'))
      check('Own identity route redirects to existing own profile')
      await page.goto(`${origin}/events/${eventId}/attendees?view=social`); await links().first().waitFor()
      await page.getByRole('button',{name:'Cuenta',exact:true}).click(); await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click(); await page.getByRole('heading',{name:'Ingresá a PlanIt',exact:true}).waitFor(); assert.equal(await links().count(),0)
      check('Logout from populated social list clears all identities')
    }
    assert.ok(reads>8)
    await Promise.all(contexts.map(context=>context.close()))
  }
  assert.deepEqual(errors,[])
} catch(error) { failure=error.message; throw error }
finally {
  await writeFile(`${out}/ui-results.json`,JSON.stringify({base:'1bcef5af3397b54bae8cc18e6336092639c2b964',branch:'codex/r5-block-2',environment:'Edge headless; running Vite app; Auth/REST/gateway fixtures, no remote JWT/RLS proof',baseline,results,errors,failure,result:failure?'FAIL':'PASS'},null,2)+'\n')
  await browser.close()
}
