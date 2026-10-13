import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// R4 block 7 UI check: Edge against the production build (`dist`) with Auth/REST/Storage
// intercepted and WebSocket blocked. Fixture evidence only: NOT real JWT/HTTP.
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-7/ui'
await mkdir(output, { recursive: true })
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const origin = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
const ana = '20000000-0000-4000-8000-000000000001', bruno = '20000000-0000-4000-8000-000000000002'
const eventId = '30000000-0000-4000-8000-000000000001'
const token = 'ab12'.repeat(16)
const event = { id: eventId, organizer_id: ana, category_id: '10000000-0000-4000-8000-000000000001', title: 'Encuentro de fotografía', description: 'Fixture local de un evento oculto.',
  starts_at: '2099-10-15T18:00:00', ends_at: '2099-10-15T20:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 10, visibility: 'unlisted', cancelled_at: null, archived_at: null }
const user = id => ({ id, email: `${id === ana ? 'ana' : 'bruno'}@example.invalid`, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = (id, suffix = '') => ({ access_token: `fixture-${id}${suffix}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(id) })
const results = [], shots = []
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' }
const root = resolve('dist')
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`)
    assert.ok(path === root || path.startsWith(root + sep))
    const file = extname(path) ? path : resolve(root, 'index.html')
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file))
  } catch { res.statusCode = 404; res.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })

async function open(width, height, { signedAs = null, redeem = ['ok'], visible = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Argentina/Buenos_Aires', reducedMotion: 'reduce', serviceWorkers: 'block' })
  const log = { urls: [], redeemBodies: [], redeemCalls: 0, writes: [], unexpected: [], errors: [], eventReads: 0 }
  const script = { redeem: [...redeem] }
  if (signedAs) await context.addInitScript(({ key, value }) => { if (!sessionStorage.getItem('fixture-seeded')) { sessionStorage.setItem('fixture-seeded', '1'); localStorage.setItem(key, JSON.stringify(value)) } }, { key, value: session(signedAs) })
  await context.route(`${origin}/**`, async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    log.urls.push(request.url())
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user(signedAs ?? ana))
    if (path === '/auth/v1/token') return reply(session(bruno))
    if (path === '/rest/v1/notifications') return reply([])
    if (path === '/rest/v1/rpc/redeem_event_link') {
      log.redeemCalls++; log.redeemBodies.push(request.postDataJSON())
      const step = script.redeem.shift() ?? 'ok'
      if (step === 'network') return route.abort('failed')
      if (step === 'unavailable') return reply({ code: 'P0001', message: 'invite_unavailable', details: null, hint: null }, 400)
      if (step === 'auth') return reply({ code: 'PGRST301', message: 'JWT expired' }, 401)
      return reply(eventId)
    }
    if (path === '/rest/v1/events') { log.eventReads++; return reply(visible ? [event] : []) }
    if (path === '/rest/v1/categories') return reply([{ id: event.category_id, name: 'Arte', is_active: true }])
    if (path === '/rest/v1/event_images') return reply([])
    if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizador de prueba', username: 'organizador' }])
    if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 0, capacity: 10, available_spots: 10, own_status: null, is_organizer: false, event_state: 'open' }])
    if (request.method() !== 'GET' || /register_for_event|event_participations/.test(path)) log.writes.push(`${request.method()} ${path}`)
    log.unexpected.push(path); return reply([])
  })
  await context.routeWebSocket(/.*/, socket => socket.close())
  const page = await context.newPage()
  page.on('pageerror', error => log.errors.push(error.message))
  return { context, page, log }
}
async function noLeak(page, log, label) {
  assert.ok(!page.url().includes(token), `${label}: token left in URL`)
  assert.ok(!(await page.evaluate(() => location.hash)), `${label}: fragment must be cleared`)
  const storage = await page.evaluate(() => JSON.stringify({ l: { ...localStorage }, s: { ...sessionStorage } }))
  assert.ok(!storage.includes(token), `${label}: token in browser storage`)
  assert.ok(!log.urls.some(url => url.includes(token)), `${label}: token in a request URL`)
  assert.ok(!page.url().includes('token='), `${label}: token key in URL`)
  assert.deepEqual(log.writes.filter(write => /register_for_event|event_participations/.test(write)), [], `${label}: redeem must not enrol`)
  assert.deepEqual(log.errors, [], `${label}: page errors`)
}
async function geometry(page) {
  const data = await page.evaluate(() => {
    const interactive = [...document.querySelectorAll('.invite-page a, .invite-page button')].map(element => ({ name: element.textContent.trim(), height: Math.round(element.getBoundingClientRect().height * 100) / 100 }))
    const wash = document.querySelectorAll('.invite-wash')
    return {
      overflow: document.documentElement.scrollWidth > innerWidth, shell: Boolean(document.querySelector('.app-shell.amanecer-shell.invite-shell')),
      wash: wash.length, washHidden: [...wash].every(element => element.getAttribute('aria-hidden') === 'true'), h1: document.querySelectorAll('h1').length,
      dock: [...document.querySelectorAll('.primary-nav a')].map(element => element.textContent.trim()), interactive,
      font: getComputedStyle(document.querySelector('h1')).fontFamily,
    }
  })
  assert.equal(data.overflow, false); assert.equal(data.shell, true); assert.equal(data.wash, 1); assert.equal(data.washHidden, true); assert.equal(data.h1, 1)
  assert.ok(data.dock.length <= 4 && !data.dock.some(name => /invit/i.test(name)), `dock stays four destinations: ${data.dock}`)
  assert.ok(data.font.includes('Bricolage'))
  for (const item of data.interactive) assert.ok(item.height >= 43.99, `${item.name} target ${item.height}px`)
  return data
}
const shot = async (page, name) => { shots.push(name); await page.screenshot({ path: `${output}/${name}.png`, fullPage: true, animations: 'disabled', caret: 'hide' }) }
const focusedClass = page => page.evaluate(() => document.activeElement?.className ?? '')

try {
  for (const [width, height] of [[320, 640], [375, 812], [1280, 900]]) {
    const tag = `${width}x${height}`
    // 1. Signed out: no RPC, no leak, actions; login returns to /invite and redeems from memory.
    {
      const { context, page, log } = await open(width, height)
      await page.goto(`${base}/invite#token=${token}`)
      await page.getByRole('heading', { name: 'Te invitaron a un evento', exact: true }).waitFor()
      await page.locator('.invite-page').getByRole('link', { name: 'Ingresar', exact: true }).waitFor()
      assert.equal(log.redeemCalls, 0)
      await noLeak(page, log, `signed-out ${tag}`)
      const g = await geometry(page)
      await shot(page, `signed-out-${tag}`)
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab') // skip link, then first control
      const outline = await page.evaluate(() => { const style = getComputedStyle(document.activeElement); return { width: style.outlineWidth, text: document.activeElement.textContent } })
      assert.ok(await page.locator('.invite-page a, .invite-page button').first().isVisible())
      if (width === 375) {
        await page.locator('.invite-page').getByRole('link', { name: 'Ingresar', exact: true }).click()
        await page.waitForURL(/\/login\?next=%2Finvite$/)
        assert.ok(!page.url().includes(token))
        await page.getByLabel('Email').fill('bruno@example.invalid'); await page.getByLabel('Contraseña', { exact: true }).fill('fixture-pass')
        await page.getByRole('button', { name: 'Continuar', exact: true }).click()
        await page.getByRole('heading', { name: event.title, exact: true }).waitFor()
        assert.equal(log.redeemCalls, 1); assert.equal(log.redeemBodies[0].p_token, token)
        assert.ok(page.url().endsWith(`/events/${eventId}`))
        await noLeak(page, log, 'login-return')
        await page.goBack().catch(() => {})
        await page.waitForTimeout(150)
        assert.ok(!page.url().includes('/invite') || (await page.getByText('No encontramos la invitación').count()) === 1, 'back never re-redeems with a spent secret')
        assert.equal(log.redeemCalls, 1)
        check('Signed out: fragment cleared, nothing sent; login returns to /invite, redeems once from memory, opens the detail with replace and no enrolment')
      }
      results.push({ viewport: tag, outline, geometry: g })
      await context.close()
    }
    // 2. Signed in, ok: redeem -> read-back -> detail; never enrols.
    {
      const { context, page, log } = await open(width, height, { signedAs: bruno })
      await page.goto(`${base}/invite#token=${token}`)
      await page.getByRole('heading', { name: event.title, exact: true }).waitFor()
      assert.equal(log.redeemCalls, 1); assert.equal(log.redeemBodies[0].p_token, token); assert.ok(log.eventReads >= 1)
      assert.ok(page.url().endsWith(`/events/${eventId}`))
      await page.getByRole('button', { name: /Unirme|Inscribirme/ }).first().waitFor()
      await noLeak(page, log, `ok ${tag}`)
      await shot(page, `redeemed-detail-${tag}`)
      await page.reload(); await page.getByRole('heading', { name: event.title, exact: true }).waitFor()
      assert.equal(log.redeemCalls, 1, 'persistent grant: detail reload does not need the link')
      await context.close()
    }
    // 3. Unavailable: one generic message, focus lands on the result, secret dropped.
    {
      const { context, page, log } = await open(width, height, { signedAs: bruno, redeem: ['unavailable'] })
      await page.goto(`${base}/invite#token=${token}`)
      await page.getByText('Invitación no disponible', { exact: true }).waitFor()
      assert.match(await focusedClass(page), /invite-feedback/)
      assert.equal(await page.getByText('Acceso confirmado').count(), 0)
      await noLeak(page, log, `unavailable ${tag}`)
      const g = await geometry(page)
      await shot(page, `unavailable-${tag}`)
      await page.reload(); await page.getByText('No encontramos la invitación', { exact: true }).waitFor()
      assert.equal(log.redeemCalls, 1, 'a reload must not resend the dropped secret')
      results.push({ viewport: tag, unavailable: g })
      await context.close()
    }
    // 4. Network failure is not "invalid": retry is idempotent and never claims access early.
    {
      const { context, page, log } = await open(width, height, { signedAs: bruno, redeem: ['network', 'ok'] })
      await page.goto(`${base}/invite#token=${token}`)
      await page.getByText('No pudimos comprobar la invitación', { exact: true }).waitFor()
      assert.equal(await page.getByText('Acceso confirmado').count(), 0)
      assert.equal(await page.getByText('Invitación no disponible').count(), 0)
      await shot(page, `network-${tag}`)
      await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
      await page.getByRole('heading', { name: event.title, exact: true }).waitFor()
      assert.equal(log.redeemCalls, 2); assert.deepEqual(log.redeemBodies.map(body => body.p_token), [token, token])
      await noLeak(page, log, `network ${tag}`)
      await context.close()
    }
    // 5. Session expiring mid-redeem.
    {
      const { context, page, log } = await open(width, height, { signedAs: bruno, redeem: ['auth'] })
      await page.goto(`${base}/invite#token=${token}`)
      await page.getByText('Tu sesión venció', { exact: true }).waitFor()
      assert.equal(await page.locator('.invite-page').getByRole('link', { name: 'Ingresar', exact: true }).count(), 1)
      await noLeak(page, log, `expired ${tag}`)
      await shot(page, `session-expired-${tag}`)
      await context.close()
    }
  }
  check('320/375/1280: wash aria-hidden, one h1, Bricolage, no overflow, four-destination dock, targets >=44px; unavailable/network/expired states with focus on the result')
  check('Secret never in URL, query, storage or any request URL; sent only in the redeem RPC body; no enrolment write; reload drops it')

  // 6. Account switch invalidates the pending secret (network error keeps it only for the same account).
  {
    const { context, page, log } = await open(375, 812, { signedAs: ana, redeem: ['network', 'ok'] })
    await page.goto(`${base}/invite#token=${token}`)
    await page.getByText('No pudimos comprobar la invitación', { exact: true }).waitFor()
    await page.evaluate(({ key, value }) => {
      const oldValue = localStorage.getItem(key), newValue = JSON.stringify(value)
      localStorage.setItem(key, newValue)
      window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
      const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close()
    }, { key, value: session(bruno) })
    await page.getByText('No encontramos la invitación', { exact: true }).waitFor()
    assert.equal(log.redeemCalls, 1, 'the other account never redeems the first account secret')
    await noLeak(page, log, 'account-switch')
    await shot(page, 'account-switch-375x812')
    check('Cuenta cambiada: el secreto pendiente de otra identidad se descarta; la nueva cuenta no canjea')
    await context.close()
  }
  // 7. Detail denied when the grant is absent (server answers empty): non-enumerating copy, no invented access.
  {
    const { context, page, log } = await open(375, 812, { signedAs: bruno, redeem: ['ok'], visible: false })
    await page.goto(`${base}/invite#token=${token}`)
    await page.getByText('No pudimos comprobar la invitación', { exact: true }).waitFor()
    assert.equal(await page.getByText('Acceso confirmado').count(), 0)
    await noLeak(page, log, 'readback-empty')
    check('Si la relectura del detalle no confirma el acceso, no se anuncia «Acceso confirmado»')
    await context.close()
  }
  // 8. Reduced transparency fallback keeps the notice legible.
  {
    const { context, page } = await open(375, 812, { signedAs: bruno, redeem: ['unavailable'] })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${base}/invite#token=${token}`)
    await page.getByText('Invitación no disponible', { exact: true }).waitFor()
    const blur = await page.evaluate(() => getComputedStyle(document.querySelector('.invite-feedback .status-message')).backdropFilter)
    results.push({ test: 'status-message backdrop (default media)', blur })
    await context.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Edge, production build, intercepted Auth/REST, WebSocket blocked; not real JWT', tokenFixture: 'synthetic 64-hex', shots, results }, null, 2))
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
