import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4196'
const output = 'docs/design/verification/ui-back-navigation/navigation'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const id = '30000000-0000-4000-8000-000000000001'
const event = { id, organizer_id: user.id, category_id: '10000000-0000-4000-8000-000000000001', title: 'Encuentro de prueba', description: 'Contenido sintético de QA.', starts_at: '2099-10-13T20:00:00', ends_at: '2099-10-13T22:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 20, visibility: 'public', cancelled_at: null, archived_at: null }
const routes = ['/notifications', '/messages', '/me/interests', '/my-events/compare', `/events/${id}`, '/map']
const results = []
const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' })
await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user })), user)
await context.routeWebSocket('**/realtime/v1/websocket**', socket => socket.close())
await context.route('https://api.mapbox.com/**', route => route.request().url().includes('/styles/v1/') ? route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8e6f4' } }] } }) : route.fulfill({ json: {} }))
let mode = 'normal'
await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
  const path = new URL(route.request().url()).pathname
  const reply = json => route.fulfill({ json })
  if (path === '/auth/v1/user') return reply(user)
  if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 1500))
  if (mode === 'error') return route.fulfill({ status: 500, json: { message: 'Fixture error' } })
  if (path.endsWith('/profiles')) return reply({ display_name: 'Perfil de prueba', username: 'fixture', bio: 'Datos sintéticos.', avatar_file_id: null })
  if (path.endsWith('/events')) return reply([event])
  if (path.endsWith('/categories')) return reply([{ id: event.category_id, name: 'Música', is_active: true }])
  if (path.endsWith('/get_event_participation_summary')) return reply([{ confirmed_count: 3, capacity: 20, available_spots: 17, own_status: null, is_organizer: true, event_state: 'open' }])
  if (path.endsWith('/get_event_organizer')) return reply([{ display_name: 'Perfil de prueba', username: 'fixture' }])
  if (path.endsWith('/get_event_chat')) return reply([{ conversation_id: id, title: event.title, event_state: 'open' }])
  if (path.endsWith('/get_event_stories')) return reply({ server_now: '2026-10-20T12:00:00', items: [], next_cursor: null })
  return reply([])
})
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const back = () => page.getByRole('link', { name: 'Volver', exact: true })
const settle = async () => { await page.locator('main').waitFor(); await page.waitForTimeout(650) }
const check = test => { results.push(test); console.log('PASS', test) }
try {
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of routes) {
      await page.goto(origin + route); await settle()
      if (route !== '/map') {
        assert.equal(await back().count(), 1, route)
        assert.equal(await page.getByRole('navigation', { name: 'Navegación principal' }).count(), 0)
        const box = await back().boundingBox()
        assert.ok(box.width >= 44 && box.height >= 44, route)
        assert.equal((await back().innerText()).trim(), '')
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route)
      if (route === '/my-events/compare') {
        assert.equal(await page.locator('.app-header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
        assert.equal(await page.locator('.management-wash').count(), 1)
      }
      if (route === '/map') assert.equal(await page.locator('.map-results > .results-heading').evaluate(el => getComputedStyle(el).marginBottom), '16px')
      assert.equal(await page.getByText(/Para compartir, abrí PlanIt desde su dirección HTTPS/).count(), 0)
      await page.screenshot({ path: `${output}/${route.split('/').at(-1)}-${width}.png`, fullPage: true })
    }
    check(`${width}: one arrow, no dock on secondary screens, touch targets, comparison header, map spacing, no overflow`)
  }
  // Direct entry followed by reload cannot send the user to an unknown external entry.
  await page.goto(origin + '/notifications'); await settle(); await page.reload(); await settle()
  await back().click(); await page.waitForURL(origin + '/home'); await settle()
  assert.equal(await page.getByRole('link', { name: 'Mis intereses', exact: true }).count(), 0)
  check('Direct entry/reload falls back to Inicio; no interests access in Home')
  await page.goto(origin + '/map?q=musica#zona'); await settle()
  await page.getByRole('link', { name: /Notificaciones/ }).click(); await settle()
  await back().click(); await page.waitForURL(origin + '/map?q=musica#zona')
  await page.goForward(); await page.waitForURL(origin + '/notifications'); await settle()
  await back().click(); await page.waitForURL(origin + '/map?q=musica#zona')
  check('Internal origin, query/hash, browser forward and repeated back remain consistent')
  await page.goto(origin + '/me'); await settle()
  await page.getByRole('link', { name: 'Mis intereses', exact: true }).click(); await settle()
  await page.getByRole('button', { name: 'Música', exact: true }).click()
  await back().click()
  await page.getByRole('dialog', { name: '¿Salir de Mis intereses?' }).waitFor()
  await page.getByRole('button', { name: 'Seguir editando' }).click()
  assert.equal(new URL(page.url()).pathname, '/me/interests')
  assert.equal(await page.getByRole('button', { name: 'Música', exact: true }).getAttribute('aria-pressed'), 'true')
  await back().click()
  await page.getByRole('button', { name: 'Descartar cambios' }).click()
  await page.waitForURL(origin + '/me')
  await page.waitForFunction(() => document.activeElement?.getAttribute('href') === '/me/interests')
  await page.getByRole('link', { name: 'Mis intereses', exact: true }).click(); await settle()
  await back().click(); await page.waitForURL(origin + '/me')
  await page.waitForFunction(() => document.activeElement?.getAttribute('href') === '/me/interests')
  check('Profile-only interests access and focus restoration after history POP')
  for (const route of ['/events/new', '/me/edit', '/me/follow-requests', `/events/${id}/chat`, `/events/${id}/edit`, `/events/${id}/gallery`, `/events/${id}/analytics`, `/events/${id}/attendees`, `/events/${id}/access`, `/events/${id}/rejoin-requests`, `/users/${id}`, `/users/${id}/followers`, `/messages/${id}`, '/invite', '/missing-route']) {
    await page.goto(origin + route); await settle(); assert.equal(await back().count(), 1, route)
  }
  for (const state of ['loading', 'error']) {
    mode = state
    await page.goto(origin + `/events/${id}`)
    await back().waitFor()
    if (state === 'error') await page.getByText('No se pudo cargar', { exact: true }).waitFor()
    assert.equal(await back().count(), 1)
  }
  mode = 'normal'
  await page.goto(origin + '/my-events/compare'); await settle()
  await page.addStyleTag({ content: 'html { font-size: 125%; }' })
  await page.setViewportSize({ width: 320, height: 450 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await back().focus()
  await page.screenshot({ path: `${output}/compare-enlarged-focus-320.png`, fullPage: true })
  check('Forms, event management, profiles, chats, invite, 404, loading/error and enlarged text retain a single usable arrow')
  assert.deepEqual(errors, [])
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Edge Playwright, intercepted Auth/REST/Mapbox; fixtures, no remote writes or physical devices', results }, null, 2))
} finally { await browser.close() }
