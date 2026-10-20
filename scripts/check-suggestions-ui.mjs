import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4181'
const baseline = process.env.PLANIT_UI_BASELINE === '1'
const output = process.env.PLANIT_UI_OUTPUT ?? `docs/design/verification/r4-block-4/${baseline ? 'before' : 'after'}`
await mkdir(output, { recursive: true })
const a = '20000000-0000-4000-8000-000000000001', b = '20000000-0000-4000-8000-000000000002'
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const user = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = id => ({ access_token: `fixture-${id}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user: user(id) })
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const event = { id: '30000000-0000-4000-8000-000000000001', organizer_id: b, title: 'Encuentro de música — prueba', description: 'Datos de prueba.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 20, category_id: category.id, visibility: 'public', cancelled_at: null, archived_at: null, category_name: category.name, image_path: null, matches_interest: true, distance_km: null, starts_soon: false }
const results = []
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
try {
  for (const width of process.env.PLANIT_UI_WIDTH ? [Number(process.env.PLANIT_UI_WIDTH)] : [320, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width >= 768 ? 900 : 812 }, timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', reducedMotion: 'reduce' })
    await context.addInitScript(({ key, value }) => { localStorage.setItem(key, JSON.stringify(value)) }, { key, value: session(a) })
    await context.routeWebSocket('**/realtime/v1/websocket**', socket => socket.close())
    let mode = 'ok', hasInterests = true, requests = [], release, pending
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname, id = req.headers().authorization?.includes(b) ? b : a
      const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user(id))
      if (path === '/rest/v1/categories') return reply([category])
      if (path === '/rest/v1/user_category_interests') {
        if (mode === 'interests-error') return reply({ message: 'fixture failure' }, 503)
        return reply(hasInterests ? [{ category }] : [])
      }
      if (path === '/rest/v1/rpc/get_suggested_events') {
        requests.push(req.postDataJSON())
        if (mode === 'slow') { pending = true; await new Promise(resolve => { release = resolve }) }
        if (mode === 'error') return reply({ message: 'fixture failure' }, 503)
        const row = { ...event, has_interests: hasInterests, title: id === b ? 'Sugerencia de B' : event.title }
        if (mode === 'photo' || mode === 'photo-error') return reply([{ ...row, image_path: 'fixture/cover.webp' }])
        if (mode === 'six') return reply(Array.from({ length: 6 }, (_, i) => ({ ...row, id: `30000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`, title: `Sugerencia ${i+1} — prueba` })))
        if (mode === 'expiring') return reply([{ ...row, ends_at: new Date(Date.now() + 10000 - 3*3600000).toISOString().slice(0,-1) }])
        return reply(mode === 'empty' ? [] : [row])
      }
      if (path === '/rest/v1/rpc/search_public_events') return reply([{ ...event, title: 'Resultado público — prueba' }])
      if (path === '/rest/v1/events') return reply([event])
      if (path === '/storage/v1/object/sign/event_media') {
        if (mode === 'photo-error') return reply({ message: 'fixture photo failure' }, 503)
        return reply([{ path: 'fixture/cover.webp', signedURL: '/object/sign/event_media/fixture/cover.webp?token=fixture' }])
      }
      if (path.startsWith('/storage/v1/object/sign/event_media/')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#f6f5fd"/><text x="24" y="160" fill="#060b27" font-size="28">Imagen de prueba</text></svg>' })
      if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizadora de prueba', username: 'organizadora' }])
      if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 3, capacity: 20, available_spots: 17, own_status: null, is_organizer: false, event_state: 'open' }])
      return reply([])
    })
    const page = await context.newPage(); page.setDefaultTimeout(20000)
    if (width === 390 && !baseline) await page.clock.install()
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.goto(`${origin}/home`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Música', exact: true }).waitFor()
    if (!baseline) await page.locator('.home-suggestions .event-card').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `${output}/${width}-home.png`, fullPage: true })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link').count(), 4)
    if (baseline) { check(`${width}: immutable main baseline`); await context.close(); continue }
    const section = page.getByRole('region', { name: 'Para vos', exact: true })
    assert.ok(await section.getByRole('link', { name: 'Mis intereses', exact: true }).evaluate(el => el.getBoundingClientRect().height >= 44))
    assert.equal(await section.getByText('Por tu interés en Música', { exact: true }).count(), 1)
    assert.equal(requests[0].p_origin_lat, null); assert.equal(requests[0].p_origin_lng, null)
    assert.deepEqual(Object.keys(requests[0]).sort(), ['p_limit', 'p_origin_lat', 'p_origin_lng'])
    check(`${width}: CA-01/02, dedicated section, honest reason, no automatic GPS or search filters, no overflow`)
    const beforeReturn = requests.length
    await section.getByRole('link', { name: /Ver detalle de/ }).click()
    await page.getByRole('heading', { name: event.title, exact: true, level: 1 }).waitFor()
    await page.getByRole('link', { name: 'Volver al inicio' }).click()
    await page.locator('.home-suggestions .event-card').waitFor()
    assert.equal(requests.length, beforeReturn, 'returning within 30 seconds reuses suggestions')
    check(`${width}: CA-04 detail return reuses fresh suggestions without another RPC`)
    mode = 'slow'
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.waitForFunction(() => document.querySelector('.home-suggestions .event-card') !== null)
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.ok(pending, 'slow background request started')
    const beforeDuplicate = requests.length
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')) })
    assert.equal(await section.locator('.event-card').count(), 1)
    assert.equal(await section.getByRole('heading', { name: 'Buscando sugerencias' }).count(), 0)
    await page.screenshot({ path: `${output}/${width}-background-refresh.png`, fullPage: true })
    assert.equal(requests.length, beforeDuplicate, 'focus/visibility share an in-flight refresh')
    mode = 'ok'; release()
    await page.waitForResponse(response => new URL(response.url()).pathname === '/rest/v1/rpc/get_suggested_events')
    await page.waitForTimeout(100)
    check(`${width}: cards remain visible during slow refresh and duplicate triggers do not restart it`)
    mode = 'empty'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await section.getByRole('heading', { name: 'Todavía no hay sugerencias relevantes' }).waitFor()
    assert.equal(await section.locator('.event-card').count(), 0)
    mode = 'error'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await section.getByRole('heading', { name: 'No pudimos cargar tus sugerencias' }).waitFor()
    assert.equal(await section.locator('.event-card').count(), 0)
    assert.equal(await page.locator('.home-category .event-card').count(), 1)
    mode = 'ok'; await section.getByRole('button', { name: 'Reintentar sugerencias' }).click()
    await section.locator('.event-card').waitFor()
    mode = 'interests-error'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await section.getByRole('heading', { name: 'No pudimos cargar tus sugerencias' }).waitFor()
    assert.equal(await section.getByText(/No elegiste intereses/).count(), 0)
    mode = 'ok'; hasInterests = false; await section.getByRole('button', { name: 'Reintentar sugerencias' }).click()
    await section.getByText(/No elegiste intereses/).waitFor(); await section.locator('.event-card').waitFor()
    await page.screenshot({ path: `${output}/${width}-general.png`, fullPage: true })
    check(`${width}: empty/error/retry independent of discovery; interests failure is not general fallback`)
    hasInterests = true; mode = 'six'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await section.getByRole('heading', { name: 'Sugerencia 6 — prueba', exact: true }).waitFor()
    assert.equal(await section.locator('.event-card').count(), 6)
    await page.screenshot({ path: `${output}/${width}-six.png`, fullPage: true })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    mode = 'ok'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await section.getByRole('heading', { name: event.title, exact: true }).waitFor()
    if (width === 390) {
      mode = 'photo'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      await section.locator('.event-card.has-photo img').waitFor()
      await page.screenshot({ path: `${output}/390-photo.png`, fullPage: true })
      mode = 'photo-error'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      await section.getByRole('button', { name: 'Reintentar fotos de sugerencias' }).waitFor()
      assert.equal(await section.locator('.event-card.without-photo').count(), 1)
      mode = 'ok'; await section.getByRole('button', { name: 'Reintentar fotos de sugerencias' }).click()
      await section.getByRole('heading', { name: event.title, exact: true }).waitFor()
      check('Public preview signing, image failure fallback and independent photo retry')
      // Exercise the shipped navigation rather than importing a Vite-only source module.
      await page.getByRole('link', { name: 'Mapa', exact: true }).click()
      await page.getByRole('heading', { name: 'Encontrá tu próximo plan', exact: true }).waitFor()
      await page.getByRole('link', { name: 'Inicio', exact: true }).click()
      await section.getByText('Referencia de cercanía: Centro del mapa (Buenos Aires, punto inicial).').waitFor()
      assert.ok(Math.abs(requests.at(-1).p_origin_lat - -34.6037) < 0.01)
      assert.ok(Math.abs(requests.at(-1).p_origin_lng - -58.3816) < 0.01)
      check('Explicit map center triggers recomputation and is never called user location')
      hasInterests = true; mode = 'slow'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      while (!pending) await page.waitForTimeout(20)
      mode = 'ok'
      await page.evaluate(({ key, value }) => {
        const oldValue = localStorage.getItem(key), newValue = JSON.stringify(value)
        localStorage.setItem(key, newValue)
        window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
        const c = new BroadcastChannel(key); c.postMessage({ event: 'SIGNED_IN', session: value }); c.close()
      }, { key, value: session(b) })
      await section.getByRole('heading', { name: 'Sugerencia de B', exact: true }).waitFor()
      release(); await page.waitForTimeout(100)
      assert.equal(await section.getByRole('heading', { name: event.title, exact: true }).count(), 0)
      check('A/B identity switch clears old content and ignores late A response')
      await page.clock.pauseAt(new Date())
      mode = 'expiring'; await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      await section.locator('.event-card').waitFor()
      await page.clock.fastForward(11000)
      await section.getByRole('heading', { name: 'Todavía no hay sugerencias relevantes' }).waitFor()
      mode = 'empty'; const countBefore = requests.length
      const poll = page.waitForRequest(req => new URL(req.url()).pathname === '/rest/v1/rpc/get_suggested_events')
      await page.clock.fastForward(30000)
      await poll
      await section.getByRole('heading', { name: 'Todavía no hay sugerencias relevantes' }).waitFor()
      assert.ok(requests.length > countBefore)
      check('Expiry removes event in browser Argentina time even in Tokyo; visible 30s polling requeries')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.evaluate(() => { document.documentElement.style.fontSize = '150%'; document.documentElement.style.setProperty('backdrop-filter', 'none') })
      await page.screenshot({ path: `${output}/390-expanded-text.png`, fullPage: true })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.keyboard.press('Tab')
      assert.ok(await page.evaluate(() => document.activeElement !== document.body))
      check('Expanded text, reduced motion and keyboard focus')
    }
    assert.deepEqual(errors, []); await context.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Playwright fixtures; simulated Auth/REST, no HTTP JWT or remote writes', results }, null, 2))
} finally { await browser.close() }
