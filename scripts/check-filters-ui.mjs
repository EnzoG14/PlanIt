import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// R4 block 2 UI check: date/range + radius filters in Inicio and Mapa (fixture Supabase, no JWT).
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-2'
await mkdir(output, { recursive: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const music = '10000000-0000-4000-8000-000000000001'
const base = { organizer_id: '20000000-0000-4000-8000-000000000002', description: 'Datos de prueba', ends_at: '2099-10-20T22:00:00', address: 'Buenos Aires', location_name: null, capacity: 10, visibility: 'public', cancelled_at: null, archived_at: null, image_path: null, category_id: music, category_name: 'Música' }
const dataset = [
  { ...base, id: '30000000-0000-4000-8000-000000000001', title: 'Evento céntrico día 11', starts_at: '2099-10-11T23:30:00', latitude: -34.6037, longitude: -58.3816 },
  { ...base, id: '30000000-0000-4000-8000-000000000002', title: 'Evento a 20 km día 12', starts_at: '2099-10-12T20:00:00', latitude: -34.4237, longitude: -58.3816 },
  { ...base, id: '30000000-0000-4000-8000-000000000003', title: 'Evento lejano día 13', starts_at: '2099-10-13T20:00:00', latitude: -33.0, longitude: -58.3816 },
]
const gpsPoint = { latitude: -34.4237, longitude: -58.3816 }   // exactly where the 20 km event is
const results = []
const check = test => { results.push({ test, result: 'PASS', evidence: 'Playwright fixture; the fixture server mirrors the SQL filter semantics; not a real Supabase Auth/REST/JWT request' }); console.log(`PASS: ${test}`) }
const haversine = (a, b) => { const r = Math.PI / 180, h = Math.sin((b.latitude - a.latitude) * r / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin((b.longitude - a.longitude) * r / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)) }
const rpcBodies = []
async function newContext(viewport, { geolocation = null, fail = false, timezoneId = 'Asia/Tokyo' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId, ...(geolocation ? { geolocation, permissions: ['geolocation'] } : {}) })
  await context.addInitScript(({ user }) => {
    localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user }))
  }, { user })
  if (!geolocation) await context.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, error) => setTimeout(() => error({ code: 1, message: 'denied' }), 20)
  })
  const state = { fail }
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user)
    if (path === '/rest/v1/rpc/search_public_events') {
      const body = route.request().postDataJSON()
      rpcBodies.push(body)
      if (state.fail) return reply({ code: 'XX000', message: 'fixture failure' }, 500)
      const rows = dataset.filter(row => {
        const day = row.starts_at.slice(0, 10)
        if (body.p_date_from && (day < body.p_date_from || day > (body.p_date_to ?? body.p_date_from))) return false
        if (body.p_radius_km && haversine({ latitude: body.p_origin_lat, longitude: body.p_origin_lng }, row) > body.p_radius_km) return false
        if (body.p_south != null && !(row.latitude >= body.p_south && row.latitude <= body.p_north && row.longitude >= body.p_west && row.longitude <= body.p_east)) return false
        return true
      })
      return reply(rows)
    }
    if (path === '/rest/v1/categories') return reply([{ id: music, name: 'Música', is_active: true }])
    if (path === '/rest/v1/events') return reply([dataset[0]])
    return reply([])
  })
  return { context, state }
}
async function newPage(context) {
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  page.on('pageerror', error => console.error(`Browser page error: ${error.message}`))
  return page
}
const titlesOf = async (page, selector = '.event-card h3') => (await page.locator(selector).allTextContents()).sort()
const waitCount = (page, n, selector = '.event-card h3') => page.waitForFunction(([s, count]) => document.querySelectorAll(s).length === count, [selector, n])
const openPanel = async page => { const toggle = page.getByRole('button', { name: /Fecha y distancia/ }); if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click() }
const last = () => rpcBodies.at(-1)
try {
  // ---- Inicio: dates ----
  const first = await newContext({ width: 375, height: 812 })
  const page = await newPage(first.context)
  await page.goto(`${origin}/home`)
  await page.getByRole('heading', { name: 'Inicio', level: 1 }).waitFor()
  await waitCount(page, 3)
  assert.equal(last().p_date_from, null); assert.equal(last().p_radius_km, null)
  assert.equal(await page.getByRole('button', { name: /Fecha y distancia/ }).getAttribute('aria-expanded'), 'false')
  await openPanel(page)
  await page.getByLabel('Fecha o inicio del rango').fill('2099-10-12')
  await waitCount(page, 1)
  assert.equal(last().p_date_from, '2099-10-12'); assert.equal(last().p_date_to, null)
  assert.deepEqual(await titlesOf(page), ['Evento a 20 km día 12'])
  assert.ok(page.url().includes('from=2099-10-12'))
  check('CA R4-03.01/02: a single date sends the plain Argentina day (browser in Tokyo) and only that day is listed; it lives in the URL')

  await page.getByLabel('Hasta (opcional)').fill('2099-10-13')
  await waitCount(page, 2)
  assert.equal(last().p_date_to, '2099-10-13')
  check('CA R4-03.01: a valid range is applied (both ends included)')

  const before = rpcBodies.length
  await page.getByLabel('Hasta (opcional)').fill('2099-10-10')
  await page.getByText('La fecha final no puede ser anterior a la inicial.').waitFor()
  await page.waitForTimeout(500)
  assert.equal(rpcBodies.length, before)
  assert.equal(await page.getByLabel('Hasta (opcional)').getAttribute('aria-invalid'), 'true')
  assert.ok(!page.url().includes('to=2099-10-10'))
  assert.deepEqual(await titlesOf(page), ['Evento a 20 km día 12', 'Evento lejano día 13'])
  check('CA R4-03.03: an inverted range shows an error and is NOT applied (no request, URL and results unchanged)')

  await page.getByLabel('Hasta (opcional)').fill('2099-10-12')
  await waitCount(page, 1)
  await page.getByRole('button', { name: 'Quitar fechas' }).click()
  await waitCount(page, 3)
  assert.equal(last().p_date_from, null); assert.equal(await page.getByLabel('Fecha o inicio del rango').inputValue(), '')
  check('CA R4-03.04: removing the dates restores other days')

  await page.getByLabel('Fecha o inicio del rango').fill('2099-12-31')
  await page.getByText('Ningún evento coincide con tu búsqueda').waitFor()
  assert.ok(await page.getByText(/Filtros aplicados: fecha 31\/12\/2099/).isVisible())
  first.state.fail = true
  await page.getByLabel('Fecha o inicio del rango').fill('2099-10-12')
  await page.getByText('No se pudo cargar Inicio').waitFor()
  assert.equal(await page.getByText('Ningún evento coincide con tu búsqueda').count(), 0)
  first.state.fail = false
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await waitCount(page, 1)
  check('No matches (empty state with applied dates) vs failed request (error with retry) are distinct')
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await waitCount(page, 3)

  // ---- Inicio: radius with GPS denied and no map centre yet ----
  await page.getByRole('button', { name: '10 km', exact: true }).click()
  await page.getByText('No pudimos aplicar la distancia').waitFor()
  assert.equal(await page.locator('.event-card').count(), 0)
  assert.ok(rpcBodies.every(body => body.p_radius_km === null))
  await page.getByText(/No pudimos determinar un punto de referencia/).waitFor()
  check('CA R4-04.04: with GPS denied and no map centre, the limit is stated, nothing is queried and no list is shown as if distance were computed')

  // ---- Mapa (A01 fallback) and back to Inicio keep the same state ----
  await page.getByRole('link', { name: 'Mapa', exact: true }).click()
  await page.getByRole('heading', { name: 'Encontrá tu próximo plan' }).waitFor()
  assert.equal(await page.getByRole('button', { name: '10 km', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByText(/Distancia desde:/).waitFor()
  assert.ok(await page.getByText('Centro del mapa (Buenos Aires, punto inicial)').first().isVisible())
  assert.equal(await page.getByText('Tu ubicación', { exact: true }).count(), 0)
  await page.waitForFunction(() => document.querySelectorAll('.map-results .event-card h3').length === 1)
  const mapBody = rpcBodies.findLast(body => body.p_radius_km === 10)
  assert.ok(Math.abs(mapBody.p_origin_lat - -34.6037) < 0.01 && Math.abs(mapBody.p_origin_lng - -58.3816) < 0.01 && typeof mapBody.p_south === 'number')
  assert.deepEqual(await titlesOf(page, '.map-results .event-card h3'), ['Evento céntrico día 11'])
  check('A01: GPS denied → "Centro del mapa" (initial Buenos Aires labelled as a map position, never "Tu ubicación"); radius is sent together with the bounds')
  await page.getByRole('link', { name: 'Inicio', exact: true }).click()
  await page.getByRole('heading', { name: 'Inicio', level: 1 }).waitFor()
  await waitCount(page, 1)
  assert.deepEqual(await titlesOf(page), ['Evento céntrico día 11'])
  assert.ok(page.url().includes('radius=10'))
  check('Inicio ↔ Mapa share the same non-secret state (radius in the URL, origin in memory); the Inicio query reuses the map centre')

  await page.getByRole('button', { name: 'Sin límite' }).click()
  await waitCount(page, 3)
  assert.equal(last().p_radius_km, null); assert.equal(last().p_origin_lat, null)
  check('Choosing "Sin límite" removes only the radius')
  await first.context.close()

  // ---- GPS granted ----
  const gps = await newContext({ width: 375, height: 812 }, { geolocation: gpsPoint })
  const gpsPage = await newPage(gps.context)
  await gpsPage.goto(`${origin}/home?categories=${music}&from=2099-10-11&to=2099-10-13`)
  await waitCount(gpsPage, 3)
  await gpsPage.getByRole('button', { name: '5 km', exact: true }).click()
  await gpsPage.getByText('Tu ubicación', { exact: true }).first().waitFor()
  await waitCount(gpsPage, 1)
  assert.equal(last().p_origin_lat, gpsPoint.latitude); assert.equal(last().p_radius_km, 5)
  assert.deepEqual(last().p_category_ids, [music]); assert.equal(last().p_date_from, '2099-10-11'); assert.equal(last().p_date_to, '2099-10-13')
  assert.deepEqual(await titlesOf(gpsPage), ['Evento a 20 km día 12'])
  await gpsPage.getByRole('button', { name: '50 km', exact: true }).click()
  await waitCount(gpsPage, 2)
  assert.deepEqual(await titlesOf(gpsPage), ['Evento a 20 km día 12', 'Evento céntrico día 11'])
  check('CA R4-04.01/02/03: with consented GPS, 5 km vs 50 km change the list and combine (AND) with category and date range')
  assert.equal(await gpsPage.getByRole('button', { name: 'Usar el centro del mapa' }).count(), 0)
  await gpsPage.getByRole('link', { name: 'Mapa', exact: true }).click()
  await gpsPage.getByText('Tu ubicación', { exact: true }).first().waitFor()
  await gpsPage.getByRole('button', { name: 'Usar el centro del mapa' }).click()
  await gpsPage.getByText('Centro del mapa', { exact: false }).first().waitFor()
  await gpsPage.waitForFunction(() => document.querySelectorAll('.map-results .event-card h3').length >= 1)
  check('The user can switch from GPS to the map centre once the map has one (the option is not offered on Inicio before that)')
  await gps.context.close()

  // ---- Mapa: GPS and map centre ----
  const mapCtx = await newContext({ width: 375, height: 812 }, { geolocation: gpsPoint })
  const mapPage = await newPage(mapCtx.context)
  await mapPage.goto(`${origin}/map?radius=25&from=2099-10-11&to=2099-10-13`)
  await mapPage.getByText('Tu ubicación', { exact: true }).first().waitFor()
  await mapPage.waitForFunction(() => document.querySelectorAll('.map-results .event-card h3').length === 1)
  const body = rpcBodies.findLast(item => item.p_radius_km === 25 && item.p_origin_lat === gpsPoint.latitude)
  assert.ok(body && typeof body.p_south === 'number' && body.p_date_from === '2099-10-11')
  assert.ok(await mapPage.getByText('Mapa centrado en tu ubicación. Movelo para explorar.').isVisible())
  check('Mapa: radius + dates + bounds in one query; consented GPS is the origin and recentres the map')
  await mapCtx.context.close()

  // ---- Responsive evidence ----
  for (const width of [320, 360, 375, 390, 768, 1280]) {
    const shot = await newContext({ width, height: width >= 768 ? 900 : 812 })
    const shotPage = await newPage(shot.context)
    await shotPage.goto(`${origin}/home?from=2099-10-11&to=2099-10-13&radius=25`)
    await shotPage.getByRole('heading', { name: 'Inicio', level: 1 }).waitFor()
    await openPanel(shotPage)
    await shotPage.getByLabel('Fecha o inicio del rango').waitFor()
    assert.equal(await shotPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `no horizontal overflow at ${width}`)
    const small = await shotPage.evaluate(() => [...document.querySelectorAll('.discovery-filters button, .discovery-filters input')].filter(node => node.offsetParent && node.getBoundingClientRect().height < 44).length)
    assert.equal(small, 0, `touch targets >= 44px at ${width}`)
    await shotPage.waitForTimeout(900)
    await shotPage.screenshot({ path: `${output}/home-date-radius-${width}.png` })
    await shot.context.close()
  }
  const mapShot = await newContext({ width: 375, height: 812 })
  const mapShotPage = await newPage(mapShot.context)
  await mapShotPage.goto(`${origin}/map?from=2099-10-11&radius=25`)
  await mapShotPage.getByText(/Distancia desde:/).waitFor()
  await mapShotPage.waitForTimeout(900)
  await mapShotPage.screenshot({ path: `${output}/map-date-radius-375.png`, fullPage: true })
  await mapShot.context.close()
  check('Date/radius panel renders at 320/360/375/390/768/1280 px without horizontal overflow and with >=44px targets')

  await writeFile(`${output}/ui-results.json`, JSON.stringify({ environment: 'Playwright (Edge, timezone Asia/Tokyo) against local Vite with fixture Supabase Auth/REST responses; no real users, JWT or remote writes. Mapbox token absent: bounds come from the fallback viewport.', results }, null, 2))
} finally { await browser.close() }
