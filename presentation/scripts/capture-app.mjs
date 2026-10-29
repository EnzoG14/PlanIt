// Actual React UI, synthetic backend responses. No production writes.
import { chromium } from 'playwright-chromium'
import { mkdir, writeFile } from 'node:fs/promises'
const origin = process.env.PLANIT_CAPTURE_ORIGIN || 'http://127.0.0.1:4180'
const output = new URL('../public/assets/screenshots/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] })
const context = await browser.newContext({ viewport: { width: 390, height: 780 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
await context.routeWebSocket('**/*', socket => socket.close())
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: { display_name: 'Comunidad' }, identities: [], created_at: '2026-10-10T12:00:00Z' }
const event = { id: '30000000-0000-4000-8000-000000000001', organizer_id: '20000000-0000-4000-8000-000000000002', category_id: '10000000-0000-4000-8000-000000000001', category_name: 'Música', title: 'Encuentro de música', description: 'Un encuentro para compartir música y conocer personas. Evento de prueba para la presentación.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Resistencia, Chaco', location_name: 'Centro cultural', latitude: -27.45, longitude: -58.99, capacity: 20, visibility: 'public', cancelled_at: null, archived_at: null, image_path: null }
await context.addInitScript(({ user }) => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user })), { user })
const requests = []
await context.route('**/*', async route => {
  const url = new URL(route.request().url())
  if (url.origin === origin) return route.continue()
  requests.push({ path: url.pathname, method: route.request().method() })
  const reply = data => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  if (url.pathname === '/auth/v1/user') return reply(user)
  if (url.pathname === '/rest/v1/categories') return reply([{ id: event.category_id, name: 'Música', is_active: true }])
  if (url.pathname === '/rest/v1/events') return reply([event])
  if (url.pathname.endsWith('/search_public_events')) return reply([event, { ...event, id: '30000000-0000-4000-8000-000000000003', title: 'Tarde de juegos', starts_at: '2099-10-12T17:00:00' }])
  if (url.pathname.endsWith('/get_suggested_events')) return reply([{ ...event, matches_interest: false, distance_km: null, starts_soon: false, has_interests: false }])
  if (url.pathname.endsWith('/get_event_participation_summary')) return reply([{ confirmed_count: 3, capacity: 20, available_spots: 17, own_status: null, is_organizer: false, event_state: 'open' }])
  if (url.pathname.endsWith('/get_event_organizer')) return reply([{ display_name: 'Organizadora de prueba', username: 'organiza' }])
  if (url.pathname.endsWith('/get_event_story_summary')) return reply({ count: 0, can_publish: false })
  if (url.hostname.endsWith('.supabase.co') && (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/'))) return reply([])
  return route.abort()
})
try {
  const page = await context.newPage()
  for (const [name, path, target] of [['discover', '/home', 'body'], ['organize', '/events/new', 'form'], ['participate', `/events/${event.id}`, '.event-participation']]) {
    await page.goto(origin + path, { waitUntil: 'domcontentloaded' })
    await page.locator(target).waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1200)
    await page.screenshot({ path: new URL(`${name}.png`, output).pathname.replace(/^\/(\w:)/, '$1') })
  }
  await writeFile(new URL('../references/capture-provenance.json', import.meta.url), JSON.stringify({ captured_at: new Date().toISOString(), source: 'Actual React app on localhost; synthetic API fixtures; all external HTTP intercepted; service workers blocked', viewport: { width: 390, height: 780 }, requests }, null, 2))
} finally { await browser.close() }
