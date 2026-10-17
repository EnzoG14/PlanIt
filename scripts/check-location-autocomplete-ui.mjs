import { homedir } from 'node:os'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Use the desktop bundled Playwright or an explicitly supplied installation.
const runtime = process.env.PLANIT_PLAYWRIGHT_PATH ?? `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`
const { chromium } = await import(pathToFileURL(runtime).href)
const browser = await chromium.launch({ headless: true, channel: process.env.PLANIT_BROWSER_CHANNEL ?? 'msedge' })
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/location-autocomplete/behavior'
await mkdir(output, { recursive: true })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4181'
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: { display_name: 'Prueba' }, identities: [], created_at: '2026-10-10T12:00:00Z' }
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const results = []; const check = name => { results.push({ name, result: 'PASS' }); console.log('PASS '+name) }
async function fixture(width = 390, height = 844, authenticated = true) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce' })
  if (authenticated) await context.addInitScript(({ user }) => {
    localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }))
  }, { user })
    const state = { calls: [], events: new Map(), images: new Map(), failure: '', cleanupFails: false, cleanup: 0, uploads: 0, rpc: 0, emptyCatalog: false }
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    state.calls.push({ path: url.pathname, method: request.method() })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (url.pathname === '/auth/v1/user') return reply(user)
    if (url.pathname === '/rest/v1/categories') return reply(state.emptyCatalog ? [] : [category])
    if (url.pathname === '/rest/v1/rpc/create_event') {
      state.rpc += 1
      const body = request.postDataJSON()
      if (state.failure === 'rollback') return reply({ code: 'P0001', message: 'category_inactive', details: null, hint: null }, 400)
      const event = { id: body.p_id, organizer_id: user.id, title: body.p_title, description: body.p_description, starts_at: body.p_starts_at, ends_at: body.p_ends_at, address: body.p_address, location_name: body.p_location_name, latitude: body.p_latitude, longitude: body.p_longitude, capacity: body.p_capacity, category_id: body.p_category_id, visibility: 'public', cancelled_at: null, archived_at: null }
      state.events.set(event.id, event)
      state.images.set(event.id, body.p_image_paths.map(storage_path => ({ files: { storage_path } })))
      if (state.failure === 'lost-response') { state.failure = ''; return route.abort('failed') }
      return reply(event.id)
    }
    if (url.pathname === '/rest/v1/events') {
      const id = url.searchParams.get('id')?.replace('eq.', '')
      return reply(state.events.has(id) ? [state.events.get(id)] : [])
    }
    if (url.pathname === '/rest/v1/event_images') {
      const id = url.searchParams.get('event_id')?.replace('eq.', '')
      return reply(state.images.get(id) ?? [])
    }
    if (url.pathname.startsWith('/storage/v1/object/sign/') && request.method() === 'POST') return reply(request.postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/event_media/${path}?token=fixture`, error: null })))
    if (url.pathname.startsWith('/storage/v1/object/sign/') && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' })
    if (url.pathname.startsWith('/storage/v1/object/')) {
      if (request.method() === 'DELETE') { state.cleanup += 1; return state.cleanupFails ? reply({ statusCode: '500', error: 'failed', message: 'fixture cleanup error' }, 500) : reply([]) }
      state.uploads += 1
      if (state.failure === 'upload') return reply({ statusCode: '500', error: 'failed', message: 'fixture upload error' }, 500)
      return reply({ Key: url.pathname })
    }
    return reply({ code: 'fixture_unhandled', message: url.pathname }, 500)
  })
  await context.route('https://api.geoapify.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ results: [{ place_id: 'fixture', formatted: 'Av. Corrientes 123, Buenos Aires', lat: -34.6037, lon: -58.3816 }] }) }))
  await context.addInitScript(() => { window.__geo = null; Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (success, failure) => { window.__geo = { success, failure } } } }) })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/events/new`)
  if (authenticated) await page.getByRole('button', { name: 'Publicar evento', exact: true }).waitFor()
  return { context, page, state, errors }
}

const suggestion = (address, lat = -34.6037, lon = -58.3816) => ({ place_id: address, formatted: address, lat, lon })
async function fields(page) {
  for (const [name, value] of Object.entries({ title: 'Evento de prueba', description: 'Descripción de prueba', start_date: '2099-10-11', start_time: '20:00', end_date: '2099-10-11', end_time: '22:00', capacity: '20' })) await page.locator(`form [name="${name}"]`).fill(value)
  await page.getByLabel('Categoría', { exact: true }).selectOption(category.id)
}
try {
  if (process.env.PLANIT_LOCATION_MODE === 'baseline') {
    for (const width of [375, 1280]) {
      const { context, page } = await fixture(width, 844)
      await page.screenshot({ path: `${output}/baseline-${width}.png`, fullPage: true, animations: 'disabled' }); await context.close()
    }
    check('Baseline main: crear 375/1280')
  } else if (process.env.PLANIT_LOCATION_MODE === 'live') {
    const { context, page, state } = await fixture()
    await context.unroute('https://api.geoapify.com/**')
    await fields(page)
    const address = page.getByRole('combobox', { name: 'Dirección' })
    await address.fill('Avenida Corrientes 123, Buenos Aires')
    const option = page.locator('#event-address-options [role="option"]').first()
    await option.waitFor(); const selected = await option.textContent()
    await address.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${output}/real-geoapify-390.png`, fullPage: true, animations: 'disabled' })
    await option.click(); await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    const saved = [...state.events.values()][0]
    assert.equal(saved.address, selected); assert.ok(Number.isFinite(saved.latitude)); assert.ok(Number.isFinite(saved.longitude)); assert.ok(Math.abs(saved.latitude) <= 90); assert.ok(Math.abs(saved.longitude) <= 180)
    check('Geoapify real: sugerencia, selección y coordenadas guardadas en backend fixture; sin escrituras Supabase reales'); await context.close()
  } else if (process.env.PLANIT_LOCATION_MODE === 'missing-key') {
    const { context, page, state } = await fixture()
    let requests = 0
    await context.route('https://api.geoapify.com/**', route => { requests += 1; return route.abort() })
    await fields(page); await page.getByRole('combobox', { name: 'Dirección' }).fill('Mi dirección')
    await page.getByText('Las sugerencias no están configuradas.', { exact: false }).waitFor(); await page.waitForTimeout(450); assert.equal(requests, 0)
    await page.getByRole('button', { name: 'Usar mi ubicación actual' }).click(); await page.evaluate(() => window.__geo.success({ coords: { latitude: -32, longitude: -60 } }))
    await page.getByText('Ubicación lista para guardar.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    const saved = [...state.events.values()][0]; assert.equal(saved.latitude, -32); assert.equal(saved.longitude, -60)
    check('Sin clave: mensaje, cero consultas y alternativa GPS con payload válido'); await context.close()
  } else {
  for (const width of [320, 375, 390, 768, 1280]) {
    const { context, page, state, errors } = await fixture(width, 844)
    const calls = []
    let mode = 'ok'
    await context.route('https://api.geoapify.com/**', async route => {
      const url = new URL(route.request().url()); calls.push(url.searchParams.get('text'))
      assert.equal(url.searchParams.get('lang'), 'es'); assert.equal(url.searchParams.get('limit'), '5'); assert.equal(url.searchParams.get('bias'), 'countrycode:ar'); assert.equal(url.searchParams.has('filter'), false)
      if (mode === 'fail') return route.fulfill({ status: 503, body: '{}' })
      if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 800))
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ results: mode === 'empty' ? [] : [suggestion(url.searchParams.get('text')+' Buenos Aires')] }) })
    })
    const address = page.getByRole('combobox', { name: 'Dirección', exact: true })
    assert.equal(await page.locator('[name="latitude"], [name="longitude"]').count(), 0)
    await fields(page)
    await address.fill('Av'); await page.waitForTimeout(450); assert.equal(calls.length, 0)
    await address.fill('Avenida'); await page.waitForTimeout(100); await address.fill('Corrientes 123')
    await page.getByRole('option', { name: 'Corrientes 123 Buenos Aires' }).waitFor(); assert.deepEqual(calls, ['Corrientes 123'])
    await address.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${output}/suggestions-${width}.png`, fullPage: true, animations: 'disabled' })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    if (width === 375 || width === 1280) {
      const style = await page.addStyleTag({ content: '.event-form :is(label, p, input, textarea, select, button, [role="option"]) { font-size: 200% !important; }' })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: `${output}/text-200-${width}.png`, fullPage: true, animations: 'disabled' }); await style.evaluate(el => el.remove())
      await page.setViewportSize({ width, height: 360 }); await address.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.setViewportSize({ width, height: 844 })
    }
    await address.press('ArrowDown'); assert.equal(await address.getAttribute('aria-activedescendant'), 'event-address-option-0')
    await address.press('ArrowUp'); await address.press('Enter')
    await page.getByText('Ubicación lista para guardar.', { exact: true }).waitFor()
    assert.equal(await address.inputValue(), 'Corrientes 123 Buenos Aires'); assert.equal(await page.getByRole('listbox').count(), 0)
    await address.fill('Dirección nueva'); await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
    await page.getByText('Elegí una dirección sugerida o usá tu ubicación actual.', { exact: true }).waitFor()
    assert.equal(state.rpc, 0); assert.equal(await address.evaluate(el => el === document.activeElement), true)
    await page.locator('#event-address-options [role="option"]').waitFor(); await address.press('Escape'); assert.equal(await page.locator('#event-address-options [role="option"]').count(), 0)
    await address.fill('Sin resultados'); mode = 'empty'; await page.getByText('No encontramos direcciones.', { exact: false }).waitFor()
    mode = 'fail'; await address.fill('Error de red'); await page.getByRole('button', { name: 'Reintentar búsqueda' }).waitFor()
    mode = 'ok'; await page.getByRole('button', { name: 'Reintentar búsqueda' }).click(); await page.locator('#event-address-options [role="option"]').click()
    await page.getByText('Ubicación lista para guardar.', { exact: true }).waitFor()
    await address.fill('Lenta'); mode = 'slow'; await page.waitForTimeout(500)
    mode = 'ok'; await address.fill('Rápida'); await page.getByRole('option', { name: 'Rápida Buenos Aires' }).click()
    await page.waitForTimeout(900); assert.equal(await address.inputValue(), 'Rápida Buenos Aires')
    await page.getByRole('button', { name: 'Usar mi ubicación actual' }).click()
    await page.evaluate(() => window.__geo.failure({ code: 1 }))
    await page.getByText('No pudimos obtener tu ubicación.', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Usar mi ubicación actual' }).click()
    await address.fill('Elegida'); await page.locator('#event-address-options [role="option"]').click()
    await page.evaluate(() => window.__geo.success({ coords: { latitude: 1, longitude: 2 } }))
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
    await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    const saved = [...state.events.values()][0]; assert.equal(saved.address, 'Elegida Buenos Aires'); assert.equal(saved.latitude, -34.6037); assert.equal(saved.longitude, -58.3816)
    check(`Crear ${width}: debounce, teclado, invalidación, vacío, error/reintento, búsquedas y GPS tardíos, payload correcto`)
    await context.route('**/rest/v1/rpc/get_event_participation_summary', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ confirmed_count: 0, capacity: 20, available_spots: 20, own_status: null, is_organizer: true, event_state: 'open' }]) }))
    await page.goto(`${origin}/events/${saved.id}/edit`)
    await address.waitFor(); await page.getByText('Ubicación lista para guardar.', { exact: true }).waitFor()
    await context.route('**/rest/v1/rpc/update_event', async route => { const body = route.request().postDataJSON(); assert.equal(body.p_latitude, -34.6037); assert.equal(body.p_longitude, -58.3816); assert.equal(body.p_address, 'Editada Buenos Aires'); return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'fixture' }) }) })
    await address.fill('Editada'); await page.locator('#event-address-options [role="option"]').click(); await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click(); await page.getByText('No se pudo guardar', { exact: true }).waitFor()
    check(`Editar ${width}: selección y payload atómico`)
    await context.route('**/rest/v1/rpc/get_event_duplicate_source', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([saved]) }))
    await page.goto(`${origin}/events/new?duplicateFrom=${saved.id}`); await address.waitFor(); await page.getByText('Ubicación lista para guardar.', { exact: true }).waitFor()
    assert.equal(await address.inputValue(), saved.address); assert.equal(state.rpc, 1)
    await address.fill('Duplicada'); await page.locator('#event-address-options [role="option"]').click(); await fields(page)
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    assert.equal(state.rpc, 2); assert.equal(state.events.size, 2)
    check(`Duplicar ${width}: precarga sin escritura, selección y nuevo evento`)
    assert.deepEqual(errors, []); await context.close()
  }
  {
    const { context, page } = await fixture()
    const address = page.getByRole('combobox', { name: 'Dirección' })
    await fields(page); await address.fill('Mi dirección')
    await page.getByRole('button', { name: 'Usar mi ubicación actual' }).click(); await page.evaluate(() => window.__geo.success({ coords: { latitude: -32, longitude: -60 } }))
    await page.getByText('Ubicación lista para guardar.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click(); await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    check('GPS actual conserva dirección y permite publicar'); await context.close()
  }
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: process.env.PLANIT_LOCATION_MODE === 'live' ? 'Edge headless; Geoapify real; Auth/REST/Storage fixtures; no remote Supabase writes' : 'Edge headless, Auth/REST/Storage/Geoapify/GPS fixtures; no remote writes', results }, null, 2))
} finally { await browser.close() }
