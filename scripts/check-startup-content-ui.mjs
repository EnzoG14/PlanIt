import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4184'
const output = 'docs/design/verification/startup-content'
await mkdir(output, { recursive: true })
const a = '20000000-0000-4000-8000-000000000001', b = '20000000-0000-4000-8000-000000000002'
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const avatarId = '40000000-0000-4000-8000-000000000001'
const avatarPath = `${a}/${avatarId}.webp`
const user = { id: a, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const session = { access_token: `fixture-${a}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user }
const event = { id: '30000000-0000-4000-8000-000000000001', organizer_id: b, title: 'Encuentro precargado', description: 'Datos de prueba.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Resistencia', location_name: 'Centro cultural', latitude: -27.45, longitude: -58.98, capacity: 20, category_id: category.id, visibility: 'public', cancelled_at: null, archived_at: null, category_name: category.name, image_path: `${b}/fixture.webp`, matches_interest: true, distance_km: null, starts_soon: false }
const results = []
try {
 for (const width of [375, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
  await context.addInitScript(({ session }) => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(session)), { session })
  await context.routeWebSocket('**/realtime/v1/websocket**', socket => socket.close())
  let release, hold = true, suggestionCount = 0
  const requests = [], imageRequests = []
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
   const request = route.request(), path = new URL(request.url()).pathname
   requests.push(path)
   const reply = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
   if (path === '/auth/v1/user') return reply(user)
   if (path === '/rest/v1/categories') return reply([category])
   if (path === '/rest/v1/user_category_interests') return reply([{ category }])
   if (path === '/rest/v1/profiles') return reply({ username: 'precarga', display_name: 'Perfil precargado', first_name: null, last_name: null, birth_date: null, sex: null, bio: 'Perfil de prueba', visibility: 'private', avatar_file_id: avatarId })
   if (path === '/rest/v1/files') return reply({ bucket_name: 'avatars', storage_path: avatarPath, uploaded_by: a, mime_type: 'image/webp' })
   if (path === '/rest/v1/rpc/search_public_events') return reply([event])
   if (path === '/rest/v1/rpc/get_suggested_events') {
    suggestionCount++
    if (hold) await new Promise(resolve => { release = resolve })
    return reply([{ ...event, has_interests: true }])
   }
   if (path === '/rest/v1/rpc/get_my_organized_events' || path === '/rest/v1/rpc/get_my_events') return reply([{ ...event, event_state: 'open', participation_status: 'confirmed' }])
   if (path === '/rest/v1/rpc/get_social_counts') return reply([{ followers_count: 0, following_count: 0 }])
   if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 1, capacity: 20, available_spots: 19, own_status: null, is_organizer: false, event_state: 'open' }])
   if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizadora', username: 'organiza' }])
   if (path === '/rest/v1/events') return reply([event])
   if (path === '/storage/v1/object/sign/event_media' || path === '/storage/v1/object/sign/avatars') {
    const bucket = path.endsWith('avatars') ? 'avatars' : 'event_media'
    return reply(request.postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/${bucket}/${path}?token=fixture` })))
   }
   if (path.startsWith('/storage/v1/object/sign/')) {
    imageRequests.push(path)
    return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="400" height="240" fill="#e8dfff"/><text x="20" y="120">Foto precargada</text></svg>' })
   }
   return reply([])
  })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(`${origin}/me`)
  await page.getByRole('heading', { name: 'Preparando tu contenido' }).waitFor()
  await page.waitForTimeout(500)
  for (const path of ['/rest/v1/rpc/search_public_events', '/rest/v1/profiles', '/rest/v1/rpc/get_my_organized_events', '/rest/v1/rpc/get_my_events']) assert.ok(requests.includes(path), `${path} starts before suggestions finish`)
  assert.equal(suggestionCount, 1)
  hold = false; release()
  await page.getByRole('heading', { name: 'Perfil precargado' }).waitFor()
  assert.ok(imageRequests.some(path => path.includes('/avatars/')), 'avatar downloaded at startup')
  assert.ok(imageRequests.some(path => path.includes('/event_media/')), 'event cover downloaded at startup')
  const count = path => requests.filter(item => item === path).length
  const profileCount = count('/rest/v1/profiles'), homeCount = count('/rest/v1/rpc/search_public_events')
  const nav = page.getByRole('navigation', { name: 'Navegación principal' })
  await nav.getByRole('link', { name: 'Inicio', exact: true }).click()
  const section = page.getByRole('region', { name: 'Para vos', exact: true })
  await section.getByRole('heading', { name: event.title }).waitFor()
  assert.equal(suggestionCount, 1)
  assert.equal(count('/rest/v1/rpc/search_public_events'), homeCount)
  assert.equal(await section.getByRole('heading', { name: 'Buscando sugerencias' }).count(), 0)
  await page.screenshot({ path: `${output}/${width}-home.png`, fullPage: true })
  await nav.getByRole('link', { name: 'Mis eventos', exact: true }).click()
  await page.getByRole('tab', { name: 'Participo' }).click()
  await page.getByRole('tabpanel').getByRole('heading', { name: event.title }).waitFor()
  assert.equal(count('/rest/v1/rpc/get_my_events'), 1)
  await nav.getByRole('link', { name: 'Perfil', exact: true }).click()
  await page.getByRole('heading', { name: 'Perfil precargado' }).waitFor()
  assert.equal(count('/rest/v1/profiles'), profileCount)
  await nav.getByRole('link', { name: 'Inicio', exact: true }).click()
  await section.locator('.event-card').waitFor()
  assert.equal(suggestionCount, 1)
  // Change the origin through the existing store, as the map does. Slow response
  // must not remount the section or hide the already prepared suggestions.
  hold = true
  await page.evaluate(async () => { const { setMapCenter } = await import('/src/features/location/origin.ts'); setMapCenter({ latitude: -27.45, longitude: -58.98 }) })
  await page.waitForTimeout(300)
  assert.equal(suggestionCount, 2)
  assert.equal(await section.locator('.event-card').count(), 1)
  assert.equal(await section.getByRole('heading', { name: 'Buscando sugerencias' }).count(), 0)
  await page.screenshot({ path: `${output}/${width}-origin-refresh.png`, fullPage: true })
  hold = false; release()
  await page.waitForTimeout(200)
  await page.clock.install()
  await nav.getByRole('link', { name: 'Perfil', exact: true }).click()
  await page.getByRole('heading', { name: 'Perfil precargado' }).waitFor()
  hold = true
  await page.clock.fastForward(31000)
  await nav.getByRole('link', { name: 'Inicio', exact: true }).click()
  await section.locator('.event-card').waitFor()
  await page.waitForTimeout(200)
  assert.equal(suggestionCount, 3, 'stale return updates in background')
  assert.equal(await section.getByRole('heading', { name: 'Buscando sugerencias' }).count(), 0)
  await page.screenshot({ path: `${output}/${width}-stale-return.png`, fullPage: true })
  hold = false; release()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.deepEqual(errors, [])
  results.push({ width, result: 'PASS', tests: ['parallel startup before navigation', 'image download at startup', 'home/profile/both event lists reused', 'no duplicate suggestion RPC on navigation', 'origin change keeps cards mounted', 'return after 30 seconds retains content while refreshing'] })
  console.log(`PASS ${width}: startup preload, images, navigation reuse and origin-change continuity`)
  await context.close()
 }
 await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Playwright fixtures; no remote database writes', results }, null, 2))
} finally { await browser.close() }
