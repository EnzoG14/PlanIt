import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-1'
await mkdir(output, { recursive: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const music = '10000000-0000-4000-8000-000000000001'
const art = '10000000-0000-4000-8000-000000000002'
const base = { organizer_id: '20000000-0000-4000-8000-000000000002', description: 'Datos de prueba', ends_at: '2099-10-11T22:00:00', address: 'Buenos Aires', location_name: null, latitude: -34.6, longitude: -58.38, capacity: 10, visibility: 'public', cancelled_at: null, archived_at: null, image_path: null }
const dataset = [
  { ...base, id: '30000000-0000-4000-8000-000000000001', title: 'Festival de Rock', description: 'Bandas', starts_at: '2099-10-11T20:00:00', category_id: music, category_name: 'Música' },
  { ...base, id: '30000000-0000-4000-8000-000000000002', title: 'Noche de Jazz', description: 'Vinos', starts_at: '2099-10-12T20:00:00', category_id: music, category_name: 'Música' },
  { ...base, id: '30000000-0000-4000-8000-000000000003', title: 'Muestra de grabado', description: 'Arte rock gráfico', starts_at: '2099-10-13T20:00:00', category_id: art, category_name: 'Arte' },
]
const results = []
const check = test => { results.push({ test, result: 'PASS', evidence: 'Playwright fixture; not a real Supabase Auth/REST/JWT request' }); console.log(`PASS: ${test}`) }
const rpcBodies = []
async function newContext(viewport, options = {}) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(({ user }) => {
    localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user }))
  }, { user })
  const state = { fail: false, imageFail: false, delay: {}, ...options }
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const path = new URL(route.request().url()).pathname
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user)
    if (path === '/rest/v1/rpc/search_public_events') {
      const body = route.request().postDataJSON()
      rpcBodies.push(body)
      if (state.fail) return reply({ code: 'XX000', message: 'fixture failure' }, 500)
      const wait = state.delay[body.p_query]
      if (wait) await new Promise(resolve => setTimeout(resolve, wait))
      const q = body.p_query?.toLowerCase()
      const rows = dataset.filter(row => (!q || row.title.toLowerCase().includes(q) || row.description.toLowerCase().includes(q)) && (!body.p_category_ids || body.p_category_ids.includes(row.category_id)))
        .map(row => state.imageFail ? { ...row, image_path: 'fixture/cover.webp' } : row)
      return reply(rows)
    }
    if (path === '/rest/v1/categories') return reply([{ id: art, name: 'Arte', is_active: true }, { id: music, name: 'Música', is_active: true }])
    if (path === '/rest/v1/events') return reply([dataset[0]])
    if (path === '/storage/v1/object/sign/event_media') return reply({ error: 'fixture' }, 500)
    if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizadora de prueba', username: 'organizadora' }])
    if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 3, capacity: 20, available_spots: 17, own_status: null, is_organizer: false, event_state: 'open' }])
    return reply([])
  })
  return { context, state }
}
const cards = page => page.locator('.event-card h3')
const titlesOf = async page => (await cards(page).allTextContents()).sort()
async function newPage(context) {
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  page.on('pageerror', error => console.error(`Browser page error: ${error.message}`))
  return page
}
try {
  const { context, state } = await newContext({ width: 375, height: 812 })
  const page = await newPage(context)
  await page.goto(`${origin}/home`)
  await page.getByRole('heading', { name: 'Inicio', level: 1 }).waitFor()
  await page.getByRole('button', { name: 'Música', exact: true }).waitFor()
  assert.deepEqual(await titlesOf(page), ['Festival de Rock', 'Muestra de grabado', 'Noche de Jazz'])
  assert.equal(rpcBodies.at(-1).p_query, null); assert.equal(rpcBodies.at(-1).p_category_ids, null)
  check('Inicio loads neutral (no text, no categories) with labelled search field and category toggle group')

  const search = page.getByLabel('Buscar eventos')
  await search.fill('ROCK')
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 2)
  assert.deepEqual(await titlesOf(page), ['Festival de Rock', 'Muestra de grabado'])
  assert.equal(rpcBodies.at(-1).p_query, 'ROCK')
  assert.ok(page.url().includes('q=ROCK'))
  check('CA R4-01.01/02/03: text matches title or description case-insensitively; non-matching events are not listed; query lives in the URL')

  await page.getByRole('button', { name: 'Arte', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Arte', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 1)
  assert.deepEqual(await titlesOf(page), ['Muestra de grabado'])
  assert.deepEqual(rpcBodies.at(-1).p_category_ids, [art])
  await page.getByRole('button', { name: 'Música', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 2)
  assert.deepEqual(rpcBodies.at(-1).p_category_ids.sort(), [art, music].sort())
  check('CA R4-02.01/02: several categories are OR-ed and combined with the text')

  await page.getByRole('button', { name: 'Arte', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 1)
  assert.deepEqual(await titlesOf(page), ['Festival de Rock'])
  await page.getByRole('button', { name: 'Música', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 2)
  assert.equal(rpcBodies.at(-1).p_category_ids, null)
  check('CA R4-02.03: removing a category updates results and sends a neutral filter when none remain')

  await search.fill('zzzz')
  await page.getByText('Ningún evento coincide con tu búsqueda').waitFor()
  assert.ok(await page.getByText(/Filtros aplicados: “zzzz”/).isVisible())
  assert.equal(await page.getByRole('button', { name: 'Limpiar filtros' }).count(), 1)
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${output}/home-no-match-375.png` })
  check('CA R4-01.04 / R4-02.04: no matches shows an empty state and keeps the applied criteria visible')

  await page.getByRole('button', { name: 'Borrar búsqueda' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 3)
  assert.equal(await search.evaluate(node => document.activeElement === node), true)
  check('Clearing the field restores results and keeps keyboard focus on the search input')

  state.delay = { jazz: 900 }
  await search.fill('jazz')
  await page.waitForTimeout(450)
  await search.fill('rock')
  await page.waitForTimeout(1500)
  assert.deepEqual(await titlesOf(page), ['Festival de Rock', 'Muestra de grabado'])
  check('A slow earlier search cannot overwrite the results of the latest search (rapid double change)')
  state.delay = {}

  state.fail = true
  await search.fill('banda')
  await page.getByText('No se pudo cargar Inicio').waitFor()
  assert.equal(await page.getByText('Ningún evento coincide con tu búsqueda').count(), 0)
  state.fail = false
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 1)
  check('CA R4-01.04: HTTP failure shows a distinct error with retry, never an empty-result message')

  await search.fill('rock')
  await page.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 2)
  const detail = page.getByRole('link', { name: /Ver detalle de Festival de Rock/ })
  await detail.click()
  await page.getByRole('heading', { name: 'Festival de Rock', level: 1 }).waitFor()
  const back = page.getByRole('link', { name: 'Volver al inicio' })
  assert.equal(await back.getAttribute('href'), '/home?q=rock')
  await back.click()
  assert.equal(await page.getByLabel('Buscar eventos').inputValue(), 'rock')
  check('Detail returns to Inicio preserving the sanitized filters')

  await page.goto(`${origin}/events/${dataset[0].id}`, { waitUntil: 'load' })
  await page.evaluate(() => history.replaceState({ usr: { returnTo: '/home?q=x&evil=1&categories=nope' } }, ''))
  await page.goto(`${origin}/home?q=%3Cscript%3E&categories=nope,${art}`)
  await page.getByLabel('Buscar eventos').waitFor()
  assert.deepEqual(rpcBodies.at(-1).p_category_ids, [art]); assert.equal(rpcBodies.at(-1).p_query, '<script>')
  check('URL parameters are sanitized: invalid category ids are dropped and text is sent as an inert parameter')
  await context.close()

  const imageContext = await newContext({ width: 375, height: 812 }, { imageFail: true })
  const imagePage = await newPage(imageContext.context)
  await imagePage.goto(`${origin}/home`)
  await imagePage.getByRole('heading', { name: 'Inicio', level: 1 }).waitFor()
  await imagePage.waitForFunction(() => document.querySelectorAll('.event-card h3').length === 3)
  await imagePage.getByText(/No pudimos cargar algunas fotos/).waitFor()
  check('A failed signed-URL request does not remove results; a retry notice is shown')
  await imageContext.context.close()

  const mapContext = await newContext({ width: 375, height: 812 })
  const mapPage = await newPage(mapContext.context)
  await mapPage.goto(`${origin}/map?q=rock&categories=${art}`)
  await mapPage.getByLabel('Buscar eventos').waitFor()
  await mapPage.waitForFunction(() => document.querySelectorAll('.map-results .event-card h3').length === 1)
  const mapBody = rpcBodies.at(-1)
  assert.equal(mapBody.p_query, 'rock'); assert.deepEqual(mapBody.p_category_ids, [art]); assert.equal(typeof mapBody.p_south, 'number'); assert.equal(mapBody.p_limit, 100)
  assert.equal(await mapPage.getByRole('button', { name: 'Arte', exact: true }).getAttribute('aria-pressed'), 'true')
  check('Mapa uses the same shared filters (text + categories) and the same RPC with bounds')
  await mapContext.context.close()

  for (const width of [320, 375, 390, 768, 1280]) {
    const shot = await newContext({ width, height: width >= 768 ? 900 : 812 })
    const shotPage = await newPage(shot.context)
    await shotPage.goto(`${origin}/home?q=rock&categories=${music}`)
    await shotPage.getByRole('heading', { name: 'Música', level: 2 }).waitFor()
    assert.equal(await shotPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `no horizontal overflow at ${width}`)
    const small = await shotPage.evaluate(() => [...document.querySelectorAll('.discovery-category-filters button, .discovery-filters input')].filter(node => node.offsetParent && node.getBoundingClientRect().height < 44).length)
    assert.equal(small, 0, `touch targets >= 44px at ${width}`)
    await shotPage.waitForTimeout(900)
    await shotPage.screenshot({ path: `${output}/home-filters-${width}.png` })
    await shot.context.close()
  }
  check('Filters render at 320/375/390/768/1280 px without horizontal overflow and with >=44px targets')

  await writeFile(`${output}/ui-results.json`, JSON.stringify({ environment: 'Playwright against local Vite with fixture Supabase Auth/REST responses; no real users, JWT or remote writes', results }, null, 2))
} finally { await browser.close() }
