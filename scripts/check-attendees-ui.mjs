import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4186', out = 'docs/design/verification/r3-block-4'
await mkdir(out, { recursive: true })
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002'
const id = '30000000-0000-4000-8000-000000000001', other = '30000000-0000-4000-8000-000000000002'
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token', results = []
const user = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = identity => ({ access_token: `fixture-${identity}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(identity) })
try {
  for (const [width, height] of [[360,800], [375,812], [390,844], [768,1024], [1280,900]]) {
    let rows = Array.from({ length: 34 }, (_, i) => ({ participation_id: `40000000-0000-4000-8000-${String(i).padStart(12,'0')}`, user_id: guest, status: 'confirmed', display_name: i === 0 ? 'Camila Rodríguez' : i === 1 ? 'Mateo Torres' : `Asistente ${String(i).padStart(2,'0')}`, username: `asistente_${i}` }))
    let eventState = 'open', loadFailure = '', mutationFailure = '', slow = false, writes = 0, listReads = 0, removedChat = false
    let releaseSearch, searchRequested
    const contexts = [], errors = []
    const event = { id, organizer_id: owner, title: 'After primaveral — prueba', description: 'Datos ficticios para pruebas de asistentes.', starts_at: '2099-10-12T22:00:00', ends_at: '2099-10-13T03:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 80, category_id: '10000000-0000-4000-8000-000000000001', visibility: 'public', cancelled_at: null, archived_at: null }
    const check = test => { results.push({ viewport: `${width}x${height}`, test, result: 'PASS' }); console.log(`PASS ${width}: ${test}`) }
    async function pageFor(identity) {
      const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Tokyo' }); contexts.push(context)
      if (identity) await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: session(identity) })
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
        const req = route.request(), url = new URL(req.url()), path = url.pathname
        const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
        const activeIdentity = req.headers().authorization === `Bearer fixture-${guest}` ? guest : identity
        if (path === '/auth/v1/user') return reply(user(activeIdentity))
        if (path === '/auth/v1/logout') return reply({})
        if (path === '/rest/v1/events') return reply([event])
        if (path === '/rest/v1/categories') return reply([{ id: event.category_id, name: 'Música', is_active: true }])
        if (path === '/rest/v1/event_images') return reply([])
        if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizador de prueba', username: 'organizador' }])
        if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: rows.filter(x => x.status === 'confirmed').length, capacity: 80, available_spots: 80 - rows.filter(x => x.status === 'confirmed').length, own_status: activeIdentity === owner ? null : removedChat ? 'removed' : 'confirmed', is_organizer: activeIdentity === owner, event_state: eventState }])
        if (path === '/rest/v1/rpc/get_my_organized_events') return reply([{ ...event, category_name: 'Música', event_state: eventState, participation_status: null, image_path: null }])
        if (path === '/rest/v1/rpc/get_event_attendees') {
          listReads++
          const args = req.postDataJSON(); assert.equal(Object.keys(args).length, 4)
          if (activeIdentity !== owner || args.p_event_id === other) return reply({ code: '42501', message: 'event_unavailable' }, 403)
          if (loadFailure === 'network') return route.abort('failed')
          if (loadFailure === 'missing') return reply({ code: 'PGRST202', message: 'missing' }, 404)
          const selected = rows.filter(row => row.status === args.p_status && row.display_name.toLowerCase().includes(args.p_search.toLowerCase()))
          const response = { title: event.title, capacity: 80, confirmed_count: rows.filter(x => x.status === 'confirmed').length, removed_count: rows.filter(x => x.status === 'removed').length, event_state: eventState, has_more: selected.length > args.p_offset + 30, attendees: selected.slice(args.p_offset, args.p_offset + 30) }
          if (releaseSearch && args.p_search === 'Camila') { searchRequested?.(); await new Promise(resolve => { releaseSearch = resolve }) }
          return reply(response)
        }
        if (path === '/rest/v1/rpc/remove_participant') {
          writes++; const args = req.postDataJSON(); assert.equal(args.p_event_id, id); assert.equal(Object.keys(args).length, 2)
          if (slow) await new Promise(r => setTimeout(r, 500))
          if (mutationFailure && mutationFailure !== 'lost') return reply({ code: 'P0001', message: mutationFailure }, 400)
          rows = rows.map(row => row.participation_id === args.p_participation_id ? { ...row, status: 'removed' } : row)
          if (mutationFailure === 'lost') return route.abort('failed')
          return reply(null)
        }
        if (path === '/rest/v1/rpc/get_event_chat') return removedChat ? reply({ code: '42501', message: 'chat_unavailable' }, 403) : reply([{ conversation_id: id, title: event.title, event_state: 'open' }])
        if (path === '/rest/v1/rpc/get_event_chat_messages') return removedChat ? reply({ code: '42501', message: 'chat_unavailable' }, 403) : reply([{ id: '50000000-0000-4000-8000-000000000001', sender_id: owner, body: 'Mensaje privado de prueba', created_at: '2026-10-12T12:00:00', display_name: 'Organizador', username: 'organizador' }])
        return reply([])
      })
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message))
      await page.routeWebSocket(/supabase\.co/, socket => socket.close())
      return page
    }
    const page = await pageFor(owner)
    const list = () => page.locator('.attendees-list > li')
    const ready = async () => { await page.getByText('Cargando asistentes…', { exact: true }).waitFor({ state: 'hidden' }); await page.getByRole('button', { name: 'Actualizar asistentes', exact: true }).waitFor() }
    const open = async name => { const row = list().filter({ has: page.getByText(name, { exact: true }) }); await row.locator('summary').click(); await row.getByRole('button', { name: 'Remover', exact: true }).click(); await page.getByRole('dialog').waitFor() }
    await page.goto(`${origin}/events/${id}/attendees`); await list().last().waitFor(); await ready()
    assert.equal(await list().count(), 30); assert.equal(await page.getByText('34 / 80 asistentes', { exact: true }).count(), 1)
    assert.equal(await page.getByText('@asistente_0', { exact: true }).count(), 1); assert.equal(await page.locator('.attendees-page').getByText(/@gmail|fixture@example|CSV/).count(), 0)
    assert.equal(await page.getByRole('link', { name: 'Solicitudes', exact: true }).count(), 1)
    await page.screenshot({ path: `${out}/confirmed-${width}.png` })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    check('Protected list, minimal identity, real fixture counts, original dark composition and no overflow')
    loadFailure = 'network'; await page.getByRole('button', { name: 'Cargar más asistentes' }).click(); await page.getByRole('alert').waitFor(); assert.equal(await list().count(), 30)
    loadFailure = ''; await page.getByRole('button', { name: 'Cargar más asistentes' }).click(); await page.getByText('Asistente 33', { exact: true }).waitFor(); assert.equal(await list().count(), 34)
    await page.getByRole('searchbox').fill('Mateo'); await page.waitForFunction(() => document.querySelectorAll('.attendees-list > li').length === 1); assert.equal(await page.getByText('Mateo Torres', { exact: true }).count(), 1)
    await page.getByRole('searchbox').fill('inexistente'); await page.getByRole('heading', { name: 'Sin resultados' }).waitFor()
    await page.getByRole('searchbox').fill(''); await page.waitForFunction(() => document.querySelectorAll('.attendees-list > li').length === 30)
    check('Pagination and search reset; empty search results distinguished from empty list')
    const readStarted = new Promise(resolve => { searchRequested = resolve }); releaseSearch = () => {}
    await page.getByRole('searchbox').fill('Camila'); await readStarted
    await page.getByRole('searchbox').fill('Mateo'); await page.getByText('Mateo Torres', { exact: true }).waitFor(); await page.waitForFunction(() => document.querySelectorAll('.attendees-list > li').length === 1)
    releaseSearch(); releaseSearch = null; await page.waitForTimeout(150); assert.equal(await page.getByText('Camila Rodríguez', { exact: true }).count(), 0)
    await page.getByRole('searchbox').fill(''); await page.waitForFunction(() => document.querySelectorAll('.attendees-list > li').length === 30)
    check('Late response from previous name search discarded')
    await open('Camila Rodríguez'); assert.equal(await page.getByRole('button', { name: 'Cancelar', exact: true }).evaluate(el => el === document.activeElement), true)
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); assert.equal(await page.getByRole('dialog').evaluate(el => el.contains(document.activeElement)), true) }
    await page.screenshot({ path: `${out}/dialog-${width}.png` })
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' }); assert.equal(writes, 0)
    await open('Camila Rodríguez'); await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); assert.equal(writes, 0)
    await open('Camila Rodríguez'); slow = true
    const before = writes; await page.getByRole('dialog').getByRole('button', { name: 'Remover', exact: true }).dblclick()
    await page.getByText('La inscripción de Camila Rodríguez fue removida del evento.', { exact: true }).waitFor(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); assert.equal(writes, before + 1); slow = false
    assert.equal(await page.getByText('33 / 80 asistentes', { exact: true }).count(), 1); assert.equal(await page.getByText('Camila Rodríguez', { exact: true }).count(), 0)
    await page.waitForFunction(() => document.activeElement?.textContent === 'Actualizar asistentes')
    await page.getByRole('button', { name: /Removidos/ }).click(); await page.getByText('Camila Rodríguez', { exact: true }).waitFor(); assert.equal(await page.locator('.attendee-actions').count(), 0)
    await page.screenshot({ path: `${out}/removed-${width}.png` })
    check('Cancel/Escape leave participation intact; confirm once, refresh counts and removed tab; focus restored')
    await page.getByRole('button', { name: /Confirmados/ }).click(); await page.getByText('Mateo Torres', { exact: true }).waitFor()
    mutationFailure = 'attendee_not_confirmed'; await open('Mateo Torres'); await page.getByRole('dialog').getByRole('button', { name: 'Remover', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'La inscripción cambió' }).waitFor(); assert.equal(await page.getByText('Mateo Torres', { exact: true }).count(), 1); assert.equal(await page.locator('.attendees-notice').innerText(), '')
    mutationFailure = 'lost'; await open('Mateo Torres'); await page.getByRole('dialog').getByRole('button', { name: 'Remover', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'No pudimos confirmar' }).waitFor(); assert.equal(await page.getByText('Mateo Torres', { exact: true }).count(), 0); assert.equal(await page.locator('.attendees-notice').innerText(), ''); mutationFailure = ''
    check('Rejected transition and lost response reconcile without false success or automatic resend')
    rows.push({ participation_id: other, user_id: guest, status: 'confirmed', display_name: 'Nueva inscripción', username: 'nueva' })
    await page.getByRole('button', { name: 'Actualizar asistentes' }).click(); await ready(); assert.equal(await page.getByText('33 / 80 asistentes', { exact: true }).count(), 1)
    rows = rows.map(row => row.participation_id === other ? { ...row, status: 'removed' } : row)
    await page.getByRole('button', { name: 'Actualizar asistentes' }).click(); await ready(); assert.equal(await page.getByText('32 / 80 asistentes', { exact: true }).count(), 1)
    check('External registration and removal visible on refresh')
    for (const value of ['ended','cancelled','archived']) { eventState = value; await page.getByRole('button', { name: 'Actualizar asistentes' }).click(); await ready(); assert.equal(await page.locator('.attendee-actions').count(), 0); assert.equal(await page.getByText(/Asistentes de sólo lectura/).count(), 1) }
    eventState = 'open'; await page.getByRole('button', { name: 'Actualizar asistentes' }).click(); await ready()
    loadFailure = 'network'; await page.getByRole('button', { name: 'Actualizar asistentes' }).click(); await page.getByRole('button', { name: 'Reintentar', exact: true }).waitFor(); loadFailure = ''; await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await list().last().waitFor()
    loadFailure = 'missing'; await page.getByRole('button', { name: 'Actualizar asistentes' }).click(); await page.getByRole('alert').filter({ hasText: 'todavía no está habilitada' }).waitFor(); loadFailure = ''; await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await list().last().waitFor()
    check('Historical read-only lists, load failure/retry and absent migration handled')
    await page.goto(`${origin}/my-events?section=organizing&filter=upcoming`); await page.getByRole('button', { name: `Acciones de ${event.title}`, exact: true }).click(); await page.getByRole('link', { name: 'Ver asistentes', exact: true }).click(); await list().last().waitFor()
    await page.getByRole('link', { name: 'Volver al evento' }).click(); await page.getByRole('link', { name: 'Ver asistentes', exact: true }).waitFor(); await page.getByRole('link', { name: 'Volver a Mis eventos', exact: true }).click(); assert.ok(page.url().endsWith('/my-events?section=organizing&filter=upcoming'))
    check('Organizo menu/detail entry and original list filter preserved on return')
    const foreign = await pageFor(guest); await foreign.goto(`${origin}/events/${id}/attendees`); await foreign.getByRole('heading', { name: 'Asistentes no disponibles' }).waitFor(); assert.equal(await foreign.locator('.attendees-list').count(), 0)
    const anonymous = await pageFor(null); await anonymous.goto(`${origin}/events/${id}/attendees`); await anonymous.getByRole('heading', { name: 'Bienvenido a PlanIt', exact: true }).waitFor()
    await page.goto(`${origin}/events/${other}/attendees`); await page.getByRole('heading', { name: 'Asistentes no disponibles' }).waitFor(); assert.equal(await page.getByText('Asistente 02', { exact: true }).count(), 0)
    check('Foreign/anonymous/direct other-event routes deny administrative identities')
    await page.goto(`${origin}/events/${id}/attendees`); await list().last().waitFor()
    await page.getByRole('button', { name: 'Salir', exact: true }).click(); await page.getByRole('heading', { name: 'Bienvenido a PlanIt', exact: true }).waitFor(); assert.equal(await page.locator('.attendees-list').count(), 0)
    check('Session logout clears administrative data')
    await foreign.clock.install()
    await foreign.goto(`${origin}/events/${id}/chat`); await foreign.getByText('Mensaje privado de prueba', { exact: true }).waitFor()
    removedChat = true; await foreign.clock.fastForward(31000); await foreign.getByRole('heading', { name: 'Chat no disponible' }).waitFor(); assert.equal(await foreign.getByText('Mensaje privado de prueba', { exact: true }).count(), 0); assert.equal(await foreign.getByRole('button', { name: 'Enviar', exact: true }).count(), 0)
    await foreign.screenshot({ path: `${out}/chat-denied-${width}.png` })
    check('Visible open chat revalidates at 30 seconds, clears cached messages/channel and composer on removal')
    assert.ok(listReads > 10); assert.deepEqual(errors, [])
    for (const context of contexts) await context.close()
  }
  await writeFile(`${out}/ui-results.json`, JSON.stringify({ environment: 'Edge headless; Auth/REST fixtures; Asia/Tokyo; no remote HTTP/JWT', results }, null, 2))
} finally { await browser.close() }
