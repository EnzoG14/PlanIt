import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { homedir } from 'node:os'

const production = process.argv.includes('--production')
const origin = process.env.PLANIT_UI_ORIGIN ?? `http://127.0.0.1:${production ? 4201 : 4200}`
const output = process.env.PLANIT_UI_OUTPUT ?? `docs/design/verification/ui-refresh/p1-fixes/89f32d5/${production ? 'production' : 'development'}`
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server', '--enable-unsafe-swiftshader'] })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const id = '30000000-0000-4000-8000-000000000001'
const event = { id, organizer_id: user.id, category_id: '10000000-0000-4000-8000-000000000001', title: 'Encuentro de prueba P1', description: 'Datos ficticios para comprobar recuperación y éxito.', starts_at: '2099-10-13T20:00:00', ends_at: '2099-10-13T22:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 20, visibility: 'public', cancelled_at: null, archived_at: null }
const cases = [
  ['HomePage', '/home?audit=p1#plans'], ['MapPage', '/map?audit=p1#events'],
  ['EventDetailPage', `/events/${id}?audit=p1#details`], ['MyEventsPage', '/my-events?section=organizing&filter=upcoming#audit'],
  ['CreateEventPage', '/events/new?audit=p1#form'], ['EditEventPage', `/events/${id}/edit?audit=p1#form`],
  ['EventGalleryPage', `/events/${id}/gallery?audit=p1#gallery`], ['EventAttendeesPage', `/events/${id}/attendees?audit=p1#attendees`],
  ['EventRejoinRequestsPage', `/events/${id}/rejoin-requests?audit=p1#requests`],
  ['EventChatPage', `/events/${id}/chat?audit=p1#messages`], ['NotificationsPage', '/notifications?audit=p1#inbox'],
]
const viewports = [[320, 800], [360, 800], [375, 812], [390, 844], [768, 1024], [1280, 900]]
const results = []
const expectedTitle = 'No pudimos abrir esta pantalla'
const check = (test, details = {}) => { results.push({ test, result: 'PASS', ...details }); console.log(`PASS: ${test}`) }

async function fixture(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', reducedMotion: 'reduce' })
  let currentEvent = { ...event }, writes = 0
  await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user })), user)
  await context.routeWebSocket(/supabase\.co/, socket => socket.close())
  await context.route('https://api.mapbox.com/**', route => route.request().url().includes('/styles/v1/') ? route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8e6f4' } }] } }) : route.fulfill({ json: {} }))
  // All service traffic is local fixtures, including mutations.
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname
    const reply = json => route.fulfill({ json })
    if (path === '/auth/v1/user') return reply(user)
    if (path === '/rest/v1/profiles') return reply({ display_name: 'Perfil de prueba', username: 'fixture', bio: 'Datos ficticios.', avatar_file_id: null })
    if (path === '/rest/v1/events') return reply([currentEvent])
    if (path === '/rest/v1/categories') return reply([{ id: event.category_id, name: 'Música', is_active: true }])
    if (path.endsWith('/get_event_participation_summary')) return reply([{ confirmed_count: 3, capacity: 20, available_spots: 17, own_status: null, is_organizer: true, event_state: currentEvent.archived_at ? 'archived' : currentEvent.cancelled_at ? 'cancelled' : 'open' }])
    if (path.endsWith('/get_event_organizer')) return reply([{ display_name: 'Perfil de prueba', username: 'fixture' }])
    if (path.endsWith('/get_home_events') || path.endsWith('/discover_public_events') || path.endsWith('/get_my_organized_events')) return reply([{ ...currentEvent, category_name: 'Música', event_state: 'open', participation_status: null, image_path: null }])
    if (path.endsWith('/get_event_chat')) return reply([{ conversation_id: id, title: event.title, event_state: 'open' }])
    if (path.endsWith('/get_event_attendees')) return reply({ title: event.title, capacity: 20, confirmed_count: 3, removed_count: 0, event_state: 'open', participants: [], has_more: false })
    if (path.endsWith('/get_event_rejoin_requests')) return reply({ title: event.title, capacity: 20, confirmed_count: 3, pending_count: 0, event_state: 'open', requests: [], has_more: false })
    if (path.endsWith('/cancel_event') || path.endsWith('/archive_event')) {
      writes++
      assert.deepEqual(route.request().postDataJSON(), { p_event_id: id })
      currentEvent = { ...currentEvent, cancelled_at: '2026-10-13T12:00:00', archived_at: path.endsWith('/archive_event') ? '2026-10-13T12:00:00' : null }
      return reply(id)
    }
    if (route.request().method() !== 'GET' && !/get_|count|sign/.test(path)) return route.fulfill({ status: 403, json: { message: 'Unexpected fixture mutation' } })
    return reply([])
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  return { context, page, pageErrors, writes: () => writes }
}

async function failure(module, path, width, height, { enlarged = false, navigation = false } = {}) {
  const { context, page, pageErrors } = await fixture(width, height)
  try {
    const pattern = production ? `**/assets/${module}-*.js*` : `**/src/pages/${module}.tsx*`
    let blocked = 0
    await context.route(pattern, route => { blocked++; return route.abort('failed') })
    const requested = origin + path
    await page.goto(requested)
    await page.getByRole('heading', { name: expectedTitle, exact: true }).waitFor()
    await page.waitForFunction(() => document.activeElement?.classList.contains('route-error'))
    assert.ok(blocked > 0, `${module}: intercept must actually block a module`)
    assert.equal(page.url(), requested)
    assert.ok(await page.locator('#root').innerText())
    assert.equal(await page.locator('.app-shell').count(), 1)
    assert.equal(await page.locator('.app-header').count(), module === 'EventChatPage' ? 0 : 1)
    assert.equal(await page.locator('.primary-nav').count(), module === 'EventChatPage' ? 0 : 1)
    assert.ok(await page.getByRole('alert').innerText())
    if (enlarged) await page.locator('.route-error *').evaluateAll(nodes => { const sizes = nodes.map(n => parseFloat(getComputedStyle(n).fontSize)); nodes.forEach((n, i) => { n.style.fontSize = `${sizes[i] * 2}px` }) })
    await page.keyboard.press('Tab')
    const reload = page.getByRole('button', { name: 'Recargar página', exact: true })
    assert.equal(await reload.evaluate(n => n === document.activeElement), true)
    await page.keyboard.press('Tab')
    const profile = page.getByRole('link', { name: 'Ir a Mi perfil', exact: true })
    assert.equal(await profile.evaluate(n => n === document.activeElement), true)
    for (const control of [reload, profile]) {
      await control.focus(); await control.scrollIntoViewIfNeeded()
      const rect = await control.boundingBox()
      assert.ok(rect.width >= 44 && rect.height >= 44)
      assert.ok(rect.y >= 0 && rect.y + rect.height <= height + 1, `${module}: recovery action outside viewport`)
      assert.equal(await control.evaluate(n => { const r = n.getBoundingClientRect(); return n.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }), true)
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const suffix = enlarged ? '-text200' : ''
    if (['HomePage', 'MapPage', 'EventDetailPage', 'EventChatPage'].includes(module)) await page.screenshot({ path: `${output}/${module}-error-${width}x${height}${suffix}.png` })
    if (navigation) {
      await profile.focus(); await page.keyboard.press('Enter'); await page.waitForURL('**/me')
      await page.getByRole('heading', { name: 'Mi perfil', exact: true }).waitFor()
      assert.equal(await page.locator('.route-error').count(), 0)
      const destination = module === 'MyEventsPage' ? '/home' : '/my-events'
      await page.locator(`.primary-nav a[href="${destination}"]`).click()
      await page.waitForURL(url => url.pathname === destination)
      await page.locator(destination === '/home' ? '.home-page' : '.my-events-page').waitFor()
      assert.equal(await page.locator('.route-error').count(), 0)
      await page.goBack(); await page.waitForURL('**/me'); await page.goBack()
      await page.getByRole('heading', { name: expectedTitle, exact: true }).waitFor()
      await page.waitForFunction(() => document.activeElement?.classList.contains('route-error'))
      check(`${module}: keyboard exit, healthy route, back to rejected cached module`)
    }
    await context.unroute(pattern)
    await reload.focus()
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.keyboard.press('Enter')])
    assert.equal(page.url(), requested, 'manual reload preserves pathname, query and hash')
    await page.waitForFunction(() => !document.querySelector('.route-error') && document.querySelector('main')?.textContent.trim())
    assert.equal(await page.locator('.route-error').count(), 0)
    assert.deepEqual(pageErrors, [], 'caught module errors must not be unhandled page errors')
    check(`${module}: handled rejection, focused accessible fallback and successful manual reload`, { width, height, enlarged, path, blocked })
  } finally { await context.close() }
}

const rgb = text => text.match(/[\d.]+/g).slice(0, 3).map(Number)
const luminance = color => rgb(color).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0)
async function success(action, width, height) {
  const f = await fixture(width, height)
  try {
    await f.page.goto(`${origin}/events/${id}`)
    await f.page.locator('.event-management').waitFor()
    assert.equal(await f.page.locator('.event-action-notice').isVisible(), false)
    await f.page.getByRole('button', { name: action === 'cancel' ? 'Cancelar evento' : 'Archivar evento', exact: true }).click()
    await f.page.getByRole('dialog').waitFor()
    await f.page.getByRole('dialog').getByRole('button', { name: action === 'cancel' ? 'Cancelar evento' : 'Archivar', exact: true }).click()
    const notice = f.page.locator('.event-action-notice')
    await notice.getByText(action === 'cancel' ? 'El evento fue cancelado. Sus datos e historial se conservan.' : 'El evento fue archivado. Podés consultarlo en Archivados.', { exact: true }).waitFor()
    assert.equal(await notice.getAttribute('role'), 'status')
    assert.equal(f.writes(), 1)
    await notice.scrollIntoViewIfNeeded()
    await f.page.evaluate(() => document.fonts.ready)
    const css = await notice.evaluate(n => { const s = getComputedStyle(n); return { color: s.color, background: s.backgroundColor, fontSize: s.fontSize, radius: s.borderRadius, text: n.textContent } })
    const ratio = (Math.max(luminance(css.color), luminance(css.background)) + .05) / (Math.min(luminance(css.color), luminance(css.background)) + .05)
    assert.ok(ratio >= 4.5, `success contrast ${ratio}`)
    assert.equal(css.color, 'rgb(6, 77, 57)')
    assert.equal(css.background, 'rgb(217, 245, 234)')
    assert.ok(parseFloat(css.fontSize) >= 13.5)
    assert.equal(await f.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await f.page.screenshot({ path: `${output}/success-${action}-${width}x${height}.png` })
    check(`${action}: readable announced success, one intercepted mutation`, { width, height, ratio, ...css })
  } finally { await f.context.close() }
}

try {
  for (const [module, path] of cases) await failure(module, path, 390, 844, { navigation: true })
  for (const [width, height] of viewports.filter(([width]) => width !== 390)) for (const [module, path] of cases.slice(0, 3)) await failure(module, path, width, height)
  for (const width of [320, 390]) await failure('EventChatPage', `/events/${id}/chat?audit=p1#messages`, width, 240, { enlarged: true })
  const f = await fixture(390, 844)
  try {
    await f.page.goto(`${origin}/my-events?section=organizing&filter=upcoming`)
    await f.page.locator('.my-events-page').waitFor()
    const node = await f.page.locator('.my-events-page').elementHandle()
    await f.page.getByRole('button', { name: 'Archivados', exact: true }).click()
    await f.page.waitForURL(url => url.searchParams.get('filter') === 'archived')
    assert.equal(await f.page.locator('.my-events-page').evaluate((current, previous) => current === previous, node), true)
    assert.equal(await f.page.locator('.route-error').count(), 0)
    check('healthy My events keeps DOM identity when its query filter changes')
  } finally { await f.context.close() }
  for (const [width, height] of viewports) for (const action of ['cancel', 'archive']) await success(action, width, height)
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: production ? 'local production build, blocked assets chunks, service workers disabled; intercepted services' : 'Vite development, blocked source modules; intercepted services', remoteMutations: false, results }, null, 2))
  await browser.close()
}
console.log(`PASS: ${results.length} P1 checks (${production ? 'production' : 'development'})`)
