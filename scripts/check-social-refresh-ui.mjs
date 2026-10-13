import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const phase = process.argv[2] ?? 'after'
const output = `docs/design/verification/ui-refresh/block-6-social/${phase}`
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4187'
await mkdir(output, { recursive: true })
const id = '20000000-0000-4000-8000-000000000001', event = '30000000-0000-4000-8000-000000000001'
const user = { id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const results = []
try {
  const context = await browser.newContext()
  await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), user)
  let mode = 'full'
  await context.routeWebSocket('**/realtime/v1/websocket**', ws => ws.onMessage(raw => {
    const [join, ref, topic, type, payload] = JSON.parse(String(raw))
    if (type === 'phx_join') ws.send(JSON.stringify([join, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: (payload.config?.postgres_changes ?? []).map((binding, index) => ({ ...binding, id: index+1 })) } }]))
    if (type === 'heartbeat' || type === 'phx_leave') ws.send(JSON.stringify([join, ref, topic, 'phx_reply', { status: 'ok', response: {} }]))
  }))
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const url = new URL(route.request().url())
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/auth/v1/user') return reply(user)
    if (url.pathname === '/rest/v1/notifications') return route.fulfill({ status: 200, headers: { 'content-range': '0-0/3' }, body: '' })
    if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 2000))
    if (mode === 'error') return reply({ message: 'Fixture offline', code: '500' }, 500)
    if (url.pathname.endsWith('/profiles')) return reply({ display_name: mode === 'long' ? 'Nombre de perfil muy largo '.repeat(6) : 'Ana de prueba', username: mode === 'long' ? 'usuario_extenso_'.repeat(8) : 'ana_fixture', bio: mode === 'empty' ? null : mode === 'long' ? 'Biografía extensa de prueba. '.repeat(35) : 'Me gusta compartir planes y conocer lugares nuevos.', avatar_file_id: null })
    if (url.pathname.endsWith('/get_event_chat')) return reply([{ conversation_id: '50000000-0000-4000-8000-000000000001', title: 'Encuentro de la comunidad fixture', event_state: mode === 'readonly' ? 'ended' : 'open' }])
    if (url.pathname.endsWith('/get_event_chat_messages')) return reply(mode === 'empty' ? [] : Array.from({ length: 51 }, (_, n) => ({ id: `40000000-0000-4000-8000-${String(60-n).padStart(12,'0')}`, sender_id: n % 2 ? id : 'other', display_name: 'Sofía de prueba', username: 'sofia_fixture', body: mode === 'long' ? 'Mensaje largo sin perder el contexto. '.repeat(15) + 'x'.repeat(120) : `Mensaje ${60-n}: Nos encontramos en el evento.`, created_at: `2026-10-11T12:00:00.${String(60-n).padStart(6,'0')}` })))
    if (url.pathname.endsWith('/get_notifications')) return reply(mode === 'empty' ? [] : Array.from({ length: 6 }, (_, n) => ({ id: `60000000-0000-4000-8000-${String(n).padStart(12,'0')}`, type: n % 2 ? 'chat' : 'event_update', title: mode === 'long' ? 'Actualización de tu evento '.repeat(8) : `Aviso de prueba ${n+1}`, body: mode === 'long' ? 'Contenido extenso de prueba. '.repeat(20) : 'Consultá las novedades de tu evento.', read_at: n % 2 ? '2026-10-11T14:00:00' : null, created_at: '2026-10-11T12:00:00', target: `/events/${event}` })))
    return reply([])
  })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  const routes = { chat: `/events/${event}/chat`, profile: '/me', notifications: '/notifications' }
  async function capture(name, route, width, height, state = 'full') {
    mode = state
    await page.setViewportSize({ width, height })
    await page.goto(origin + route)
    await page.waitForTimeout(state === 'loading' ? 150 : 750)
    await page.evaluate(() => document.fonts.ready)
    const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, shell: document.querySelector('.app-shell').className, font: getComputedStyle(document.querySelector('main')).fontFamily, composer: document.querySelector('.chat-composer')?.getBoundingClientRect().toJSON(), viewport: innerHeight }))
    assert.equal(metrics.overflow, false, `${name} document overflow`)
    if (phase === 'after') {
      assert.match(metrics.shell, /amanecer-shell/)
      if (metrics.composer) assert.ok(metrics.composer.bottom <= height + 1, `${name} composer outside viewport`)
    }
    results.push({ name, width, height, state, ...metrics })
    await page.screenshot({ path: `${output}/${name}-${state}-${width}.png`, fullPage: true })
  }
  for (const [width, height] of [[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900]]) for (const [name, route] of Object.entries(routes)) await capture(name, route, width, height)
  for (const [name, route] of Object.entries(routes)) for (const state of ['empty','long','error','loading']) await capture(name, route, 390, 844, state)
  await capture('chat', routes.chat, 390, 844, 'readonly')
  await capture('chat', routes.chat, 320, 400, 'long')
  await page.getByLabel('Mensaje', { exact: true }).focus()
  await page.setViewportSize({ width: 320, height: 320 })
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${output}/chat-keyboard-simulated-320.png` })
  if (phase === 'after') assert.ok(await page.locator('.chat-composer').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight + 1))
  if (phase === 'after') {
    await page.emulateMedia({ reducedMotion: 'reduce', reducedTransparency: 'reduce' })
    await capture('profile-reduced', routes.profile, 375, 812)
    await page.addStyleTag({ content: 'html { font-size: 125%; } .profile-page { font-size: 20px; }' })
    await page.screenshot({ path: `${output}/profile-text-enlarged-375.png`, fullPage: true })
    await page.getByRole('button', { name: 'Cuenta', exact: true }).click()
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('button', { name: 'Cuenta', exact: true }).evaluate(el => el === document.activeElement), true)
  }
  assert.deepEqual(errors, [])
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Edge Playwright; intercepted Auth/REST/WebSocket fixtures; no remote E2E', results }, null, 2))
  // Lab reference captures contain fictional data and do not represent migrated routes.
  if (phase === 'before') for (const name of ['chat','profile','notifications']) {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`http://127.0.0.1:5181/b/${name}`); await page.waitForTimeout(800)
    await page.screenshot({ path: `${output}/lab-${name}-390.png`, fullPage: true })
  }
  console.log(`PASS ${phase}: ${results.length} social route captures, no document overflow; fixtures only`)
} finally { await browser.close() }

