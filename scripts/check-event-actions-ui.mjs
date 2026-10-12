import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4187', out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-5'
await mkdir(out, { recursive: true })
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002'
const id = '30000000-0000-4000-8000-000000000001', other = '30000000-0000-4000-8000-000000000002', category = '10000000-0000-4000-8000-000000000001'
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const requestedWidth = Number(process.argv[2])
let results = []
if (requestedWidth) {
  try { results = JSON.parse(await readFile(`${out}/ui-results.json`, 'utf8')).results.filter(x => !x.viewport.startsWith(`${requestedWidth}x`)) } catch { /* First single viewport run. */ }
}
const user = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = identity => ({ access_token: `fixture-${identity}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(identity) })
try {
  for (const [width, height] of [[360,800], [375,812], [390,844], [768,1024], [1280,900]].filter(([width]) => !requestedWidth || requestedWidth === width)) {
    let event = { id, organizer_id: owner, title: 'After primaveral Vol. 1', description: 'Jazz fusión, DJ set y coctelería. Datos ficticios.', starts_at: '2099-10-12T22:00:00', ends_at: '2099-10-13T03:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 80, category_id: category, visibility: 'public', cancelled_at: null, archived_at: null }
    const contexts = [], errors = [], saved = new Map()
    let writes = 0, publications = 0, uploads = 0, failure = '', slow = false, sourceFailure = '', readFailure = false, activeCategory = true, losePublish = false, sourceReads = 0
    let releaseSource, sourceStarted, releasePublication, publicationStarted
    const check = test => { results.push({ viewport: `${width}x${height}`, test, result: 'PASS' }); console.log(`PASS ${width}: ${test}`) }
    const state = () => event.archived_at ? 'archived' : event.cancelled_at ? 'cancelled' : event.ends_at < '2026' ? 'ended' : 'open'
    async function pageFor(identity) {
      const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Tokyo' }); contexts.push(context)
      if (identity) await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: session(identity) })
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
        const req = route.request(), url = new URL(req.url()), path = url.pathname
        const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
        if (path === '/auth/v1/user') return reply(user(identity))
        if (path === '/auth/v1/logout') return reply({})
        if (path === '/rest/v1/events') {
          if (readFailure) return route.abort('failed')
          const target = url.searchParams.get('id')?.replace('eq.', '')
          return reply(target === id || !target ? [event] : saved.has(target) ? [saved.get(target)] : [])
        }
        if (path === '/rest/v1/categories') return reply(activeCategory ? [{ id: category, name: 'Música', is_active: true }] : [{ id: other, name: 'Arte', is_active: true }])
        if (path === '/rest/v1/event_images') return reply([])
        if (path.startsWith('/storage/v1/object/')) { uploads++; return reply({}) }
        if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizador de prueba', username: 'organizador' }])
        if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 48, capacity: 80, available_spots: 32, own_status: identity === owner ? null : 'confirmed', is_organizer: identity === owner, event_state: state() }])
        if (path === '/rest/v1/rpc/get_my_organized_events') {
          const filter = req.postDataJSON().p_filter
          return reply((filter === 'archived' ? state() === 'archived' : filter === 'cancelled' ? state() === 'cancelled' : state() !== 'archived') ? [{ ...event, category_name: 'Música', event_state: state(), participation_status: null, image_path: null }] : [])
        }
        if (path === '/rest/v1/rpc/get_event_duplicate_source') {
          sourceReads++; const args = req.postDataJSON(); assert.deepEqual(Object.keys(args), ['p_event_id'])
          if (releaseSource) { sourceStarted?.(); await new Promise(r => { releaseSource = r }) }
          if (identity !== owner || args.p_event_id !== id) return reply({ code: '42501', message: 'event_unavailable' }, 403)
          if (sourceFailure) return reply({ code: sourceFailure, message: 'fixture_failure' }, 400)
          const { title, description, category_id, location_name, address, latitude, longitude, capacity } = event
          return reply([{ title, description, category_id, location_name, address, latitude, longitude, capacity }])
        }
        if (path === '/rest/v1/rpc/cancel_event' || path === '/rest/v1/rpc/archive_event') {
          writes++; assert.deepEqual(req.postDataJSON(), { p_event_id: id })
          if (slow) await new Promise(r => setTimeout(r, 450))
          if (failure && !failure.startsWith('lost')) return reply({ code: failure === 'missing' ? 'PGRST202' : 'P0001', message: failure }, 400)
          if (path.endsWith('/cancel_event')) event = { ...event, cancelled_at: '2026-10-12T12:00:00' }
          else event = { ...event, cancelled_at: event.cancelled_at ?? '2026-10-12T12:00:00', archived_at: '2026-10-12T12:00:00' }
          if (failure === 'lost-read') readFailure = true
          if (failure.startsWith('lost')) return route.abort('failed')
          return reply(id)
        }
        if (path === '/rest/v1/rpc/create_event') {
          publications++; const p = req.postDataJSON(); assert.deepEqual(p.p_image_paths, [])
          assert.notEqual(p.p_id, id); assert.ok(p.p_starts_at.startsWith('2099-11-01')); assert.equal(p.p_starts_at.endsWith('20:00:00'), true)
          const data = { ...event, id: p.p_id, title: p.p_title, description: p.p_description, starts_at: p.p_starts_at, ends_at: p.p_ends_at, cancelled_at: null, archived_at: null }
          saved.set(p.p_id, data)
          if (releasePublication) { publicationStarted?.(); await new Promise(r => { releasePublication = r }) }
          if (losePublish) { readFailure = true; return route.abort('failed') }
          return reply(p.p_id)
        }
        if (path === '/rest/v1/rpc/get_event_chat') return reply([{ conversation_id: id, title: event.title, event_state: state() }])
        if (path === '/rest/v1/rpc/get_event_chat_messages') return reply([{ id: other, sender_id: owner, body: 'Mensaje histórico de prueba', created_at: '2026-10-12T12:00:00', display_name: 'Organizador', username: 'organizador' }])
        return reply([])
      })
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); await page.routeWebSocket(/supabase\.co/, socket => socket.close()); return page
    }
    const page = await pageFor(owner), field = name => page.locator(`.event-form [name="${name}"]`)
    const ready = async () => { await page.getByRole('heading', { name: event.title, exact: true }).waitFor(); await page.locator('.event-management').waitFor() }
    const open = async name => { await page.getByRole('button', { name, exact: true }).click(); await page.getByRole('dialog').waitFor() }
    await page.goto(`${origin}/events/${id}`); await ready()
    await page.screenshot({ path: `${out}/actions-${width}.png`, fullPage: true }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await open('Cancelar evento'); assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).evaluate(e => e === document.activeElement), true)
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); assert.equal(await page.getByRole('dialog').evaluate(e => e.contains(document.activeElement)), true) }
    await page.screenshot({ path: `${out}/cancel-dialog-${width}.png` }); await page.keyboard.press('Escape'); assert.equal(writes, 0)
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Cancelar evento'))
    await open('Archivar evento'); await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click(); assert.equal(writes, 0)
    check('Own action rows preserve visual identity/no overflow; initial/loop/return focus; Cancel/Escape write nothing')
    failure = 'fixture_rejection'; await open('Cancelar evento'); await page.getByRole('dialog').getByRole('button', { name: 'Cancelar evento', exact: true }).click(); await page.getByRole('alert').waitFor(); assert.equal(event.cancelled_at, null); assert.equal(await page.locator('.event-action-notice').innerText(), '')
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
    failure = ''; slow = true; await open('Cancelar evento'); const before = writes
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar evento', exact: true }).dblclick(); await page.locator('.event-action-notice').filter({ hasText: 'fue cancelado' }).waitFor(); assert.equal(writes, before + 1); slow = false
    await page.waitForFunction(() => !document.querySelector('.event-management button')?.textContent?.includes('Cancelar evento'))
    assert.equal(await page.getByRole('button', { name: 'Cancelar evento', exact: true }).count(), 0)
    check('Rejected action reports no success; confirmation executes once and reconsults detail/participation')
    failure = 'lost-read'; await open('Archivar evento'); await page.getByRole('dialog').getByRole('button', { name: 'Archivar', exact: true }).click(); await page.getByRole('button', { name: 'Comprobar estado' }).waitFor(); const pendingWrites = writes
    assert.equal(await page.getByRole('dialog').getByRole('alert').count(), 1)
    await page.getByRole('button', { name: 'Comprobar estado' }).click(); await page.getByRole('button', { name: 'Comprobar estado', exact: true }).waitFor(); assert.equal(writes, pendingWrites)
    readFailure = false; failure = ''; await page.getByRole('button', { name: 'Comprobar estado' }).click(); await page.locator('.event-action-notice').filter({ hasText: 'fue archivado' }).waitFor(); assert.equal(writes, pendingWrites)
    await page.waitForFunction(() => !document.querySelector('.event-management-danger'))
    await page.goto(`${origin}/my-events?section=organizing&filter=all`); await page.getByRole('heading', { name: 'No hay eventos en Todos' }).waitFor()
    await page.getByRole('button', { name: 'Archivados', exact: true }).click(); await page.getByRole('heading', { name: event.title, exact: true }).waitFor()
    await page.getByRole('button', { name: `Acciones de ${event.title}`, exact: true }).click(); assert.equal(await page.getByRole('button', { name: 'Archivar evento', exact: true }).count(), 0)
    await page.getByRole('link', { name: 'Ver detalle', exact: true }).click(); await ready()
    assert.ok(await page.getByRole('link', { name: 'Volver a Mis eventos' }).getAttribute('href').then(x => x.includes('filter=archived')))
    check('Lost commit/read response stays uncertain; check performs no second write; archived disappears from active list and remains in own historical navigation/filter')
    await open('Duplicar evento'); await page.screenshot({ path: `${out}/duplicate-dialog-${width}.png` }); await page.getByRole('button', { name: 'Abrir formulario', exact: true }).click(); await field('title').waitFor()
    assert.equal(await field('title').inputValue(), event.title); assert.equal(await field('description').inputValue(), event.description); assert.equal(await field('category_id').inputValue(), category)
    assert.equal(await field('capacity').inputValue(), '80'); assert.equal(await field('latitude').inputValue(), '-34.6')
    for (const name of ['start_date', 'start_time', 'end_date', 'end_time']) assert.equal(await field(name).inputValue(), '')
    assert.equal(publications, 0); assert.equal(uploads, 0); assert.equal(await page.locator('.image-previews li').count(), 0)
    await field('title').fill('Cambio local'); await page.getByRole('link', { name: 'Salir sin guardar' }).click(); await ready(); assert.equal(publications, 0); assert.equal(uploads, 0)
    check('Historical duplicate opens shared form with required fields/empty dates/no photos; edits and exit create no event or upload; returns to original')
    await page.goto(`${origin}/events/new?duplicateFrom=${id}`); await field('title').waitFor()
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); assert.equal(publications, 0); await page.locator('#event-start_date-error').waitFor()
    await field('start_date').fill('2000-01-01'); await field('start_time').fill('20:00'); await field('end_date').fill('2000-01-01'); await field('end_time').fill('23:00')
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); assert.equal(publications, 0)
    await field('title').fill('Nuevo plan editable'); const original = { ...event }
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: session(owner) }); assert.equal(await field('title').inputValue(), 'Nuevo plan editable')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    for (const [name, value] of Object.entries({ start_date: '2099-11-01', start_time: '20:00', end_date: '2099-11-01', end_time: '23:00' })) await field(name).fill(value)
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) }); await page.screenshot({ path: `${out}/duplicate-form-${width}.png`, fullPage: true })
    losePublish = true; await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); await page.getByRole('heading', { name: 'Publicación por confirmar' }).waitFor()
    readFailure = false; losePublish = false; await page.getByRole('button', { name: 'Comprobar publicación', exact: true }).click(); await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    assert.equal(publications, 1); assert.equal(saved.size, 1); assert.deepEqual(event, original); assert.equal(uploads, 0); assert.equal(await page.getByRole('heading', { name: 'Nuevo plan editable', exact: true }).count(), 1)
    check('Future Argentina dates/required validation, editable fields, fresh ID, publication recovery without second INSERT; original unchanged')
    const foreignPage = await pageFor(guest); await foreignPage.goto(`${origin}/events/${id}`); await foreignPage.getByRole('heading', { name: event.title, exact: true }).waitFor(); assert.equal(await foreignPage.locator('.event-management').count(), 0)
    await foreignPage.goto(`${origin}/events/new?duplicateFrom=${id}`); await foreignPage.getByRole('heading', { name: 'No se pudo duplicar' }).waitFor(); assert.equal(await foreignPage.getByRole('button', { name: 'Publicar evento' }).count(), 0)
    await page.goto(`${origin}/events/new?duplicateFrom=invalid`); await page.getByRole('heading', { name: 'No se pudo duplicar' }).waitFor()
    const anonymous = await pageFor(null); await anonymous.goto(`${origin}/events/new?duplicateFrom=${id}`); await anonymous.waitForURL(url => url.pathname === '/login')
    check('Owner-only controls, foreign/malformed duplicate URL blocks publishing; anonymous route requires login')
    sourceFailure = 'PGRST202'; await page.goto(`${origin}/events/new?duplicateFrom=${id}`); await page.getByRole('heading', { name: 'No se pudo duplicar' }).waitFor(); sourceFailure = ''; await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await field('title').waitFor()
    activeCategory = false; await page.reload(); await field('title').waitFor(); for (const [name, value] of Object.entries({ start_date: '2099-11-01', start_time: '20:00', end_date: '2099-11-01', end_time: '23:00' })) await field(name).fill(value)
    const previousPublications = publications; await page.getByRole('button', { name: 'Publicar evento' }).click(); await page.locator('#event-category_id-error').waitFor(); assert.equal(publications, previousPublications); activeCategory = true
    check('Missing source RPC shows retry; inactive source category requires an available selection before publish')
    if (width === 360) {
      await page.goto(`${origin}/events/new?duplicateFrom=${id}`); await field('title').waitFor(); await field('title').fill('Conservado tras renovación')
      const beforeReads = sourceReads
      const renewed = { ...session(owner), access_token: 'fixture-renewed-owner' }
      await page.evaluate(({ key, value }) => { const channel = new BroadcastChannel(key); channel.postMessage({ event: 'TOKEN_REFRESHED', session: value }); channel.close() }, { key, value: renewed })
      await page.waitForTimeout(100); assert.equal(await field('title').inputValue(), 'Conservado tras renovación'); assert.equal(sourceReads, beforeReads)
      // A new account must remount and ask the protected source again; the
      // fixture denies that new source read, matching SQL owner authorization.
      sourceFailure = '42501'
      await page.evaluate(({ key, value }) => { const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close() }, { key, value: session(guest) })
      await page.getByRole('heading', { name: 'No se pudo duplicar' }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Publicar evento' }).count(), 0); assert.ok(sourceReads > beforeReads)
      sourceFailure = ''
      await page.evaluate(({ key, value }) => { const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close() }, { key, value: session(owner) })
      await field('title').waitFor(); assert.equal(await field('title').inputValue(), event.title)
      check('Auth token renewal preserves edits without source refetch; new account clears form and reauthorizes source; original account gets fresh data')
    }
    const started = new Promise(r => { sourceStarted = r }); releaseSource = () => {}
    await page.goto(`${origin}/events/new?duplicateFrom=${id}`); await started; await page.goto(`${origin}/events/new`); await field('title').waitFor(); releaseSource(); releaseSource = null
    await page.waitForTimeout(100); assert.equal(await field('title').inputValue(), '')
    check('Changing source discards late source response and local form data')
    event = { ...event, cancelled_at: null, archived_at: null, starts_at: '2000-01-01T12:00:00', ends_at: '2001-01-01T12:00:00' }
    await page.goto(`${origin}/events/${id}`); await ready(); assert.equal(await page.getByRole('button', { name: 'Cancelar evento', exact: true }).count(), 0); assert.equal(await page.getByRole('button', { name: 'Archivar evento', exact: true }).count(), 1)
    event = { ...event, starts_at: '2099-10-12T22:00:00', ends_at: '2099-10-13T03:00:00' }
    await page.goto(`${origin}/my-events?section=organizing&filter=upcoming`); await page.getByRole('heading', { name: event.title, exact: true }).waitFor(); await page.getByRole('button', { name: `Acciones de ${event.title}`, exact: true }).click(); await page.getByRole('button', { name: 'Cancelar evento', exact: true }).click(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('button', { name: `Acciones de ${event.title}`, exact: true }).evaluate(e => e === document.activeElement), true)
    await page.getByRole('button', { name: `Acciones de ${event.title}`, exact: true }).click(); await page.getByRole('button', { name: 'Archivar evento', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Archivar', exact: true }).click(); await page.getByRole('heading', { name: 'No hay eventos en Próximos' }).waitFor(); assert.equal(await page.locator('.event-action-notice').innerText().then(x => x.includes('fue archivado')), true)
    check('Ended cancel hidden; same accessible dialog from Organizo; list reloaded after successful archive')
    await page.goto(`${origin}/events/${id}/chat`); await page.getByText('Mensaje histórico de prueba', { exact: true }).waitFor(); assert.equal(await page.getByRole('textbox', { name: /mensaje/i }).count(), 0)
    check('Archived chat keeps historical messages and removes composer')
    if (width === 360) {
      await page.goto(`${origin}/events/new?duplicateFrom=${id}`); await field('title').waitFor()
      for (const [name, value] of Object.entries({ start_date: '2099-11-01', start_time: '20:00', end_date: '2099-11-01', end_time: '23:00' })) await field(name).fill(value)
      const sent = new Promise(r => { publicationStarted = r }); releasePublication = () => {}
      await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); await sent
      sourceFailure = '42501'
      await page.evaluate(({ key, value }) => { const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close() }, { key, value: session(guest) })
      await page.getByRole('heading', { name: 'No se pudo duplicar' }).waitFor(); releasePublication(); releasePublication = null
      await page.waitForTimeout(150); assert.ok(page.url().includes('duplicateFrom=')); assert.equal(await page.getByRole('heading', { name: 'Evento publicado' }).count(), 0)
      await page.getByRole('button', { name: 'Salir', exact: true }).click(); await page.waitForURL(url => url.pathname === '/login'); assert.equal(await page.locator('.event-form').count(), 0)
      check('Late publication response from previous account cannot navigate or expose success in new account; logout clears form')
    }
    assert.deepEqual(errors, []); assert.ok(sourceReads > 0)
    await Promise.all(contexts.map(context => context.close()))
  }
  await writeFile(`${out}/ui-results.json`, JSON.stringify({ environment: 'Edge headless, Auth/REST/Storage fixtures, Asia/Tokyo; no remote JWT or real device', results }, null, 2))
} finally { await browser.close() }
