import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4186'
const output = 'docs/design/verification/my-events-r1'
await mkdir(output, { recursive: true })
const ownerId = '20000000-0000-4000-8000-000000000001'
const guestId = '20000000-0000-4000-8000-000000000002'
const otherId = '20000000-0000-4000-8000-000000000003'
const eventId = '30000000-0000-4000-8000-000000000001'
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const userFor = id => ({ id, email: `${id.slice(-1)}@fixture.example.invalid`, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const tokenFor = id => ({ access_token: `fixture-${id}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user: userFor(id) })
const results = []
try {
  for (const [width, height] of [[375,812],[1280,900]]) {
    const events = new Map([[eventId, { id: eventId, organizer_id: ownerId, title: 'Encuentro de música — prueba', description: 'Datos ficticios para verificar la interfaz.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Av. Corrientes 123, Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 20, category_id: category.id, visibility: 'public', cancelled_at: null, archived_at: null }]])
    let participation = null; let failure = ''; let imageFailure = false; let extraRows = []; let slow = false
    const calls = []; const errors = []; const contexts = []
    async function fixture(id) {
      const context = await browser.newContext({ viewport: { width,height }, timezoneId: 'Asia/Tokyo' }); contexts.push(context)
      await context.addInitScript(({ key, token }) => localStorage.setItem(key, JSON.stringify(token)), { key, token: tokenFor(id) })
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
        const req = route.request(); const url = new URL(req.url()); const path = url.pathname
        const identity = req.headers().authorization?.replace('Bearer fixture-', '')
        const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
        if (path === '/auth/v1/user') return identity === 'invalid' ? reply({ message: 'Invalid JWT', code: 'bad_jwt' },401) : reply(userFor(identity))
        if (path === '/auth/v1/logout') return reply({})
        if (path === '/rest/v1/categories') return reply([category])
        if (path === '/rest/v1/events') return reply(events.has(url.searchParams.get('id')?.replace('eq.','')) ? [events.get(url.searchParams.get('id').replace('eq.',''))] : [])
        if (path === '/rest/v1/event_images') return reply([])
        if (path === '/rest/v1/rpc/create_event') {
          const body = req.postDataJSON()
          const created = { ...events.get(eventId), id: body.p_id, organizer_id: identity, title: body.p_title, description: body.p_description, starts_at: body.p_starts_at, ends_at: body.p_ends_at, address: body.p_address, location_name: body.p_location_name }
          events.set(created.id, created); return reply(created.id)
        }
        if (path === '/rest/v1/rpc/get_my_events') {
          const { p_section, p_offset } = req.postDataJSON()
          assert.deepEqual(Object.keys(req.postDataJSON()).sort(), ['p_offset','p_section'])
          calls.push({ identity, section: p_section, offset: p_offset })
          if (failure === 'network') return route.abort('failed')
          if (failure) return reply({ code: failure, message: 'Fixture denied' }, failure === '42501' ? 403 : 500)
          const rows = [...events.values()].filter(e => p_section === 'organizing' ? e.organizer_id === identity : identity === guestId && e.id === eventId && participation).map(e => ({ id: e.id, title: e.title, starts_at: e.starts_at, ends_at: e.ends_at, location_name: e.location_name, address: e.address, category_name: category.name, event_state: e.archived_at ? 'archived' : e.cancelled_at ? 'cancelled' : e.ends_at < '2026-10-10' ? 'ended' : 'open', participation_status: p_section === 'participating' ? participation : null, image_path: `${ownerId}/cover.webp` }))
          const snapshot = [...rows, ...(p_section === 'organizing' && identity === ownerId ? extraRows : [])].slice(p_offset,p_offset+31)
          if (slow) await new Promise(resolve => setTimeout(resolve,350))
          return reply(snapshot)
        }
        if (path === '/storage/v1/object/sign/event_media') {
          if (imageFailure) return reply({ message: 'Fixture storage failure' },500)
          return reply(req.postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/event_media/${path}?token=fixture` })))
        }
        if (path.startsWith('/storage/v1/object/sign/event_media/')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="180"><rect width="160" height="180" fill="#242054"/><circle cx="80" cy="65" r="40" fill="#7651df"/><path d="M0 180L80 100L160 180" fill="#0753ff"/></svg>' })
        if (path === '/rest/v1/rpc/get_event_participation_summary') {
          const event = events.get(req.postDataJSON().p_event_id)
          return reply([{ confirmed_count: participation === 'confirmed' ? 1 : 0, capacity: 20, available_spots: 19, own_status: identity === guestId ? participation : null, is_organizer: event.organizer_id === identity, event_state: 'open' }])
        }
        if (path === '/rest/v1/rpc/register_for_event') { participation = 'confirmed'; return reply(null) }
        if (path === '/rest/v1/rpc/leave_event') { participation = 'cancelled'; return reply(null) }
        return reply([])
      })
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); return page
    }
    const owner = await fixture(ownerId); const guest = await fixture(guestId)
    const tabs = page => page.getByRole('tab')
    const cards = page => page.locator('.compact-event-card')
    const shot = async (page, name) => { await page.screenshot({ path: `${output}/${name}-${width}x${height}.png`, fullPage: true }) }
    async function refresh(page) { const count = calls.length; await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForFunction(() => !document.querySelector('[role="tabpanel"]')?.getAttribute('aria-busy')?.includes('true')); assert.ok(calls.length > count) }
    await owner.goto(`${origin}/my-events`); await cards(owner).first().waitFor(); assert.equal(await cards(owner).count(),1)
    await shot(owner,'organizing')
    const target = await owner.getByRole('link',{ name:'Crear evento',exact:true }).boundingBox(); assert.ok(target.width>=44 && target.height>=44)
    await tabs(owner).first().focus(); await owner.keyboard.press('ArrowRight'); await owner.getByText('Todavía no tenés participaciones',{exact:true}).waitFor(); assert.match(owner.url(),/section=participating/)
    await owner.keyboard.press('Home'); await cards(owner).first().waitFor()
    await owner.keyboard.press('Tab'); await owner.keyboard.press('Tab')
    assert.equal(await owner.locator('.compact-event-link:focus-visible').count(),1)
    assert.equal(await owner.locator('.compact-event-link:focus-visible').evaluate(link=>getComputedStyle(link).outlineOffset),'-4px')
    await guest.goto(`${origin}/my-events?section=participating`); await guest.getByText('Todavía no tenés participaciones',{exact:true}).waitFor(); await shot(guest,'empty')
    await guest.goto(`${origin}/events/${eventId}`); await guest.getByRole('button',{name:'Unirme',exact:true}).click()
    await guest.getByRole('button',{name:'Retirarme',exact:true}).waitFor()
    await guest.getByRole('link',{name:'Ir a Mis eventos'}).click(); await tabs(guest).getByText('Participo',{exact:true}).click()
    await guest.getByText('Inscripción: Confirmada',{exact:true}).waitFor(); assert.equal(await cards(guest).count(),1); await shot(guest,'participating')
    await cards(guest).getByRole('link').click(); await guest.getByRole('button',{name:'Retirarme',exact:true}).click(); await guest.getByRole('button',{name:'Unirme',exact:true}).waitFor()
    await guest.getByRole('link',{name:'Ir a Mis eventos'}).click(); await guest.getByText('Inscripción: Cancelada',{exact:true}).waitFor(); assert.match(guest.url(),/section=participating/)
    await cards(guest).getByRole('link').click(); await guest.getByRole('button',{name:'Unirme',exact:true}).click(); await guest.getByRole('button',{name:'Retirarme',exact:true}).waitFor()
    await guest.goBack(); await guest.getByText('Inscripción: Confirmada',{exact:true}).waitFor(); assert.equal(await cards(guest).count(),1)
    for (const [change,state] of [[{starts_at:'2020-01-01T20:00:00',ends_at:'2020-01-01T22:00:00'},'Finalizado'],[{cancelled_at:'2026-10-10'},'Cancelado'],[{archived_at:'2026-10-10'},'Archivado']]) {
      Object.assign(events.get(eventId),change); await refresh(guest); await guest.getByText(state,{exact:true}).waitFor()
    }
    participation='removed'; await refresh(guest); await guest.getByText('Inscripción: Removida',{exact:true}).waitFor(); await shot(guest,'history')
    for (const mode of ['network','42501','PGRST202']) {
      failure=mode; await refresh(guest); await guest.getByRole('alert').waitFor(); assert.equal(await cards(guest).count(),0); assert.equal(await guest.getByText('Todavía no tenés participaciones',{exact:true}).count(),0)
      await shot(guest,mode==='42501'?'permissions':'error'); failure=''; await guest.getByRole('button',{name:'Reintentar',exact:true}).click(); await cards(guest).first().waitFor()
    }
    imageFailure=true; await refresh(guest); await guest.getByText('No pudimos cargar algunas fotos.',{exact:false}).waitFor(); assert.equal(await cards(guest).count(),1)
    imageFailure=false; await guest.getByRole('button',{name:'Reintentar fotos'}).click(); await guest.locator('.compact-event-photo img').waitFor()
    extraRows=Array.from({length:35},(_,n)=>({id:`40000000-0000-4000-8000-${String(n).padStart(12,'0')}`,title:`Paginado ${n}`,starts_at:'2099-10-12T20:00:00',ends_at:'2099-10-12T22:00:00',location_name:null,address:'Buenos Aires',category_name:'Música',event_state:'open',participation_status:null,image_path:null}))
    await refresh(owner); await owner.getByRole('button',{name:'Cargar más',exact:true}).waitFor(); assert.equal(await cards(owner).count(),30)
    await owner.getByRole('button',{name:'Cargar más',exact:true}).click(); await owner.waitForFunction(()=>document.querySelectorAll('.compact-event-card').length===36)
    assert.equal(new Set(await cards(owner).getByRole('link').evaluateAll(links=>links.map(link=>link.href))).size,36)
    await refresh(owner); await owner.getByRole('button',{name:'Cargar más',exact:true}).waitFor(); assert.equal(await cards(owner).count(),30)
    slow=true; await tabs(owner).getByText('Participo',{exact:true}).click(); await tabs(owner).getByText('Organizo',{exact:true}).click(); await cards(owner).first().waitFor(); slow=false
    assert.equal(await owner.getByText('Todavía no tenés participaciones',{exact:true}).count(),0)
    extraRows=[]
    // Creation from the page must become visible on return from its detail.
    await owner.getByRole('link',{name:'Crear evento',exact:true}).click()
    const values={title:'Evento recién creado — prueba',description:'Fixture de creación y navegación',start_date:'2099-11-01',start_time:'20:00',end_date:'2099-11-01',end_time:'22:00',address:'Corrientes 123',latitude:'-34.6',longitude:'-58.38',capacity:'20'}
    for(const [name,value] of Object.entries(values)) await owner.locator(`.event-form [name="${name}"]`).fill(value)
    await owner.locator('[name="category_id"]').selectOption(category.id)
    await owner.getByRole('button',{name:'Publicar evento',exact:true}).click(); await owner.getByText('Evento publicado',{exact:true}).waitFor()
    await owner.getByRole('link',{name:'Ir a Mis eventos'}).click(); await owner.getByRole('heading',{name:values.title,exact:true}).waitFor(); assert.equal(await cards(owner).count(),2)
    // Cross-tab Auth notification replaces the account without retaining its rows.
    await owner.evaluate(({key,token})=>{localStorage.setItem(key,JSON.stringify(token));const channel=new BroadcastChannel(key);channel.postMessage({event:'SIGNED_IN',session:token});channel.close()},{key,token:tokenFor(otherId)})
    await owner.getByText('Todavía no organizás eventos',{exact:true}).waitFor(); assert.equal(await cards(owner).count(),0)
    for(const page of [owner,guest]) assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    const focusCalls=calls.length; await guest.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'))}); await guest.waitForFunction(()=>document.querySelector('[role="tabpanel"]').getAttribute('aria-busy')==='false'); assert.ok(calls.length>focusCalls)
    const invalid=await fixture('invalid'); await invalid.goto(`${origin}/my-events`); await invalid.waitForURL('**/login?next=*'); assert.equal(await cards(invalid).count(),0)
    assert.deepEqual(errors,[])
    results.push({viewport:{width,height},result:'PASS',scenarios:['two fixture accounts; role separation','keyboard tabs','create/detail/list','join/leave/rejoin/browser back','history/removed','network/RLS/missing migration/retry','image fallback/batch signing','pagination/reset/deduplication','stale tab response','focus/visibility','account change','invalid session/direct route','44px create target/no overflow'],rpcCalls:calls.length})
    for(const context of contexts) await context.close()
  }
  await writeFile(`${output}/ui-results.json`,JSON.stringify({environment:'Real Edge browser; intercepted Supabase Auth/REST/Storage fixtures, not remote E2E',results},null,2))
  console.log(JSON.stringify(results,null,2))
} finally { await browser.close() }
