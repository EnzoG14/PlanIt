import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname, relative, isAbsolute } from 'node:path'

// Actual compiled React app + Supabase SDK, isolated Auth/REST/Phoenix fixtures.
// This does NOT certify remote JWT/RLS or real Realtime delivery.
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const baseline = process.argv.includes('--baseline')
const out = process.env.PLANIT_UI_OUTPUT ?? `docs/qa/r6-block-7/ui/${baseline ? 'before-event-full' : 'after'}`
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const root = resolve(process.env.PLANIT_UI_BUILD ?? 'dist')
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer(async (req, res) => {
  const file = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname)
  const rel = relative(root, file)
  if (rel.startsWith('..') || isAbsolute(rel)) { res.writeHead(403); res.end(); return }
  try { res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file)) }
  catch { res.setHeader('Content-Type', 'text/html'); res.end(await readFile(resolve(root, 'index.html'))) }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`
const a = '20000000-0000-4000-8000-000000000001', b = '20000000-0000-4000-8000-000000000002'
const eventId = '30000000-0000-4000-8000-000000000001', conversation = '90000000-0000-4000-8000-000000000001'
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const user = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = id => ({ access_token: 'fixture-' + id, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(id) })
const title = 'Música, mate y encuentros · Evento de prueba'
const notice = (n = 1, type = 'event_full') => ({ id: '40000000-0000-4000-8000-' + String(n).padStart(12, '0'), type, title, body: 'Tu evento alcanzó su cupo máximo de inscripciones confirmadas.', created_at: '2026-10-15T16:30:00.' + String(n).padStart(6, '0'), read_at: null, target: '/events/' + eventId })
const results = [], errors = [], sockets = []
let notices = [], archived = false, targetOverride, denyOnClick = false, mode = 'success', holdList = false, releaseList, holdChanges = false, releaseChanges, listCalls = 0, changeCalls = 0, countCalls = 0, markCalls = 0, targetCalls = 0, failure
const check = test => { results.push({ test, result: 'PASS' }); console.log('PASS fixture: ' + test) }
const project = row => row.type === 'event_full' && archived ? { ...row, title: 'Cupo completo', target: null } : { ...row }
const sorted = () => [...notices].sort((x, y) => y.created_at.localeCompare(x.created_at) || y.id.localeCompare(x.id))
function emit(row, event = 'INSERT') {
  for (const socket of sockets) for (const [topic, join] of socket.joins) {
    const bindings = join.bindings.filter(binding => binding.table === 'notifications' && binding.event === event && binding.filter === 'recipient_id=eq.' + a)
    if (socket.id === a && bindings.length) socket.ws.send(JSON.stringify([join.joinRef, null, topic, 'postgres_changes', { ids: bindings.map(binding => binding.id), data: { schema: 'public', table: 'notifications', type: event, commit_timestamp: '2026-10-15T19:30:00Z', errors: null, columns: [], record: row, old_record: {} } }]))
  }
}
async function setup(width, identity = a, live = true) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', timezoneId: 'Asia/Tokyo' })
  await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: session(identity) })
  await context.routeWebSocket('**/realtime/v1/websocket**', ws => {
    const socket = { ws, id: identity, joins: new Map() }; sockets.push(socket)
    ws.onMessage(raw => {
      const [joinRef, ref, topic, event, payload] = JSON.parse(String(raw))
      if (!live) return
      if (event === 'phx_join') {
        socket.id = payload.access_token?.includes(b) ? b : a
        const bindings = (payload.config?.postgres_changes ?? []).map((binding, index) => ({ ...binding, id: index + 1 }))
        socket.joins.set(topic, { joinRef, bindings })
        ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: bindings } }]))
      } else if (event === 'phx_leave') { socket.joins.delete(topic); ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }])) }
      else if (event === 'heartbeat') ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]))
    })
    ws.onClose(() => socket.joins.clear())
  })
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname
    const id = req.headers().authorization?.includes(b) ? b : a
    const args = req.postDataJSON()
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user(id))
    if (path === '/auth/v1/logout') return reply({})
    if (path === '/rest/v1/notifications') {
      countCalls++
      return route.fulfill({ status: 200, headers: { 'access-control-expose-headers': 'content-range', 'content-range': '0-0/' + (id === a ? notices.filter(row => !row.read_at).length : 0) }, body: '' })
    }
    if (path.endsWith('/get_notifications')) {
      listCalls++
      assert.deepEqual(Object.keys(args).sort(), ['p_before_at', 'p_before_id'])
      const start = args.p_before_id ? sorted().findIndex(row => row.id === args.p_before_id) + 1 : 0
      const snapshot = id === a ? sorted().slice(start, start + 31).map(project) : []
      if (holdList && id === a) { holdList = false; await new Promise(r => { releaseList = r }) }
      if (mode === 'error') return reply({ code: 'XX000', message: 'fixture error' }, 500)
      if (mode === 'missing') return reply({ code: 'PGRST202', message: 'fixture missing migration' }, 404)
      return reply(snapshot)
    }
    if (path.endsWith('/get_notification_changes')) {
      changeCalls++
      const snapshot = id === a ? notices.filter(row => args.p_ids.includes(row.id)).map(project) : []
      if (holdChanges && id === a) { holdChanges = false; await new Promise(r => { releaseChanges = r }) }
      return reply(snapshot)
    }
    if (path.endsWith('/mark_notification_read')) {
      markCalls++; assert.equal(id, a)
      const row = notices.find(row => row.id === args.p_id); row.read_at ??= '2026-10-15T16:40:00'; return reply(row.read_at)
    }
    if (path.endsWith('/get_notification_target')) {
      targetCalls++
      if (denyOnClick) { archived = true; denyOnClick = false }
      return reply(targetOverride !== undefined ? targetOverride : id === a ? project(notices.find(row => row.id === args.p_id)).target : null)
    }
    if (path === '/rest/v1/events') return reply({ id: eventId, organizer_id: a, title, description: 'Fixture B7', starts_at: '2099-10-15T20:00:00', ends_at: '2099-10-15T22:00:00', address: 'Buenos Aires', capacity: 2, category_id: 'fixture', visibility: 'public', cancelled_at: null, archived_at: null })
    return reply([])
  })
  const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message))
  return { context, page }
}
async function inbox(page) { await page.goto(origin + '/notifications'); await page.locator('.notification-row').first().waitFor() }
async function badge(page, count) {
  if (count) await page.getByRole('link', { name: `Notificaciones, ${count} no leídas`, exact: true }).waitFor()
  else await page.waitForFunction(() => !document.querySelector('.notifications-badge'))
}
async function refreshed(page) {
  const response = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/get_notifications'))
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click()
  await (await response).finished()
  await page.locator('section[aria-busy="false"]').waitFor()
}
try {
  for (const width of baseline ? [390, 1280] : [320, 360, 375, 390, 768, 1280]) {
    notices = [notice()]; archived = false; targetOverride = undefined; mode = 'success'
    const { context, page } = await setup(width)
    await inbox(page); await badge(page, 1)
    await page.getByRole('heading', { name: title, exact: true }).waitFor()
    if (!baseline) { assert.equal(await page.locator('.notification-kind').textContent(), 'Cupo completo'); assert.equal(await page.locator('.notification-icon svg').count(), 1) }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${out}/inbox-${width}.png`, fullPage: true })
    if (width === 390 && !baseline) {
      const readButton = page.getByRole('button', { name: 'Marcar leído', exact: true })
      await readButton.focus()
      const focus = await readButton.evaluate(element => ({ outline: getComputedStyle(element).outlineWidth, height: element.getBoundingClientRect().height }))
      assert.ok(parseFloat(focus.outline) >= 3); assert.ok(focus.height >= 44)
      await page.keyboard.press('Enter')
      await page.getByText('Leído', { exact: true }).waitFor(); await badge(page, 0)
      const calls = markCalls
      await refreshed(page); await page.getByRole('button', { name: 'Ver evento', exact: true }).click()
      await page.waitForURL('**/events/' + eventId); assert.equal(markCalls, calls); assert.ok(targetCalls)
      await inbox(page)
      for (const unsafe of ['https://example.invalid/unsafe', '//example.invalid', '/events/' + eventId + '?redirect=https://example.invalid']) {
        targetOverride = unsafe; await refreshed(page)
        await page.getByRole('button', { name: 'Ver evento', exact: true }).click(); await page.getByRole('alert').waitFor()
        assert.ok(page.url().endsWith('/notifications'))
      }
      targetOverride = undefined; archived = false; await refreshed(page)
      // Freeze an authorized delta before the click, then deliver its stale
      // title/target after the authoritative revocation. It must not undo it.
      holdChanges = true; releaseChanges = undefined
      const staleResponse = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/get_notification_changes'))
      emit(notices[0], 'UPDATE')
      for (let n = 0; n < 100 && !releaseChanges; n++) await page.waitForTimeout(20)
      assert.ok(releaseChanges)
      denyOnClick = true; await page.getByRole('button', { name: 'Ver evento', exact: true }).click(); await page.getByRole('alert').waitFor()
      releaseChanges(); await (await staleResponse).finished()
      await page.getByRole('heading', { name: 'Cupo completo', exact: true }).waitFor()
      assert.equal(await page.getByRole('heading', { name: title, exact: true }).count(), 0)
      await page.screenshot({ path: out + '/revoked-390.png', fullPage: true })
      await refreshed(page); assert.equal(await page.getByRole('button', { name: 'Ver evento', exact: true }).count(), 0)
      await page.getByText('El evento ya no está disponible o no tenés permiso para consultarlo.', { exact: true }).waitFor()
      check('Keyboard mark/read persistence; authorized existing route; allowlist blocks external/protocol-relative/query URLs; revoked click clears title and delayed pre-revocation delta cannot restore it')
      archived = false; notices = []; await refreshed(page); await page.getByRole('heading', { name: 'Todavía no tenés notificaciones' }).waitFor()
      notices = [notice(2)]; const changes = changeCalls; emit(notices[0]); emit(notices[0]); emit(notices[0])
      await page.getByRole('heading', { name: title, exact: true }).waitFor(); await badge(page, 1)
      assert.equal(await page.locator('.notification-row').count(), 1); assert.ok(changeCalls > changes)
      emit(notices[0]); await refreshed(page); assert.equal(await page.locator('.notification-row').count(), 1); await badge(page, 1)
      notices[0].title = 'Título actualizado'; emit(notices[0], 'UPDATE'); await page.getByRole('heading', { name: 'Título actualizado', exact: true }).waitFor()
      notices[0].read_at = '2026-10-15T16:40:00'; emit(notices[0], 'UPDATE'); await page.getByText('Leído', { exact: true }).waitFor(); await badge(page, 0)
      check('Actual SDK Phoenix fixtures: repeated INSERT/UPDATE reconciled by UUID, current name/read changes, badge fetched authoritatively')
      // Miss >1 page while the channel reconnects; catchUp must retain the old boundary.
      for (const socket of sockets.filter(s => s.id === a)) for (const [topic, join] of socket.joins) socket.ws.send(JSON.stringify([join.joinRef, null, topic, 'phx_error', {}]))
      notices = Array.from({ length: 65 }, (_, n) => ({ ...notice(n + 10), title: 'Evento recuperado ' + n }))
      await page.evaluate(() => window.dispatchEvent(new Event('online')))
      await page.getByRole('heading', { name: 'Evento recuperado 64', exact: true }).waitFor(); await badge(page, 65)
      await page.waitForFunction(() => document.querySelectorAll('.notification-row').length === 65)
      assert.deepEqual(await page.locator('.notification-content h2').allTextContents(), sorted().map(row => row.title))
      await page.reload(); await page.locator('.notification-row').first().waitFor(); assert.equal(await page.locator('.notification-row').count(), 30)
      await page.getByRole('button', { name: 'Ver más avisos', exact: true }).click(); await page.waitForFunction(() => document.querySelectorAll('.notification-row').length === 60)
      await page.getByRole('button', { name: 'Ver más avisos', exact: true }).click(); await page.waitForFunction(() => document.querySelectorAll('.notification-row').length === 65)
      check('Reconnect/online recovery spans >30 missed notices; reload reinitialization and keyset pagination retain 65 rows without duplicates')
      mode = 'error'; await refreshed(page); await page.getByRole('heading', { name: 'No se pudo cargar', exact: true }).waitFor(); assert.equal(await page.locator('.notification-row').count(), 0)
      mode = 'missing'; await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await page.getByText('La bandeja todavía no está disponible.', { exact: false }).waitFor()
      mode = 'success'; await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await page.locator('.notification-row').first().waitFor()
      holdList = true; releaseList = undefined; await page.getByRole('button', { name: 'Actualizar', exact: true }).click()
      await page.getByRole('heading', { name: 'Cargando notificaciones', exact: true }).waitFor()
      for (let n = 0; n < 100 && !releaseList; n++) await page.waitForTimeout(20)
      assert.ok(releaseList)
      await page.evaluate(({ key, value }) => {
        const oldValue = localStorage.getItem(key), newValue = JSON.stringify(value)
        localStorage.setItem(key, newValue); window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
        const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close()
      }, { key, value: session(b) })
      await page.getByRole('heading', { name: 'Todavía no tenés notificaciones', exact: true }).waitFor()
      releaseList(); await page.waitForTimeout(150); assert.equal(await page.locator('.notification-row').count(), 0); await badge(page, 0)
      emit(notices[0]); await page.waitForTimeout(100); assert.equal(await page.locator('.notification-row').count(), 0)
      await page.waitForFunction(() => !document.querySelector('.notifications-badge'))
      for (let n = 0; n < 100 && sockets.some(s => [...s.joins.keys()].includes('realtime:notifications:' + a)); n++) await page.waitForTimeout(20)
      assert.ok(!sockets.some(s => [...s.joins.keys()].includes('realtime:notifications:' + a)))
      check('Error/missing migration clear private rows and retry; account change tears down A channel and discards delayed A list response and late WebSocket event')
    }
    if (!baseline && width === 375) {
      notices[0].title = 'EventoConUnTítuloMuyLargo'.repeat(7); await refreshed(page)
      await page.evaluate(() => {
        const elements = [...document.querySelectorAll('.notifications-page h1, .notification-content h2, .notification-content p, .notification-content time, .notification-kind, .notification-state, .notifications-page button')]
        const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize))
        elements.forEach((element, index) => { element.style.fontSize = sizes[index] * 2 + 'px' })
      })
      await page.setViewportSize({ width, height: 500 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: out + '/text-200-short-375.png', fullPage: true })
      check('Long event title, notification text actually doubled from computed px sizes, short viewport, reduced motion: no horizontal document overflow')
    }
    await context.close(); check(`${baseline ? 'Before' : 'After'} actual app at ${width}px: title, badge, read state, no horizontal overflow; fixture capture`)
  }
  if (!baseline) {
    archived = false; mode = 'success'; notices = [notice()]
    const twins = await Promise.all([setup(390), setup(390)])
    await Promise.all(twins.map(({ page }) => inbox(page)))
    emit(notices[0]); emit(notices[0])
    for (const { page } of twins) { await badge(page, 1); assert.equal(await page.locator('.notification-row').count(), 1) }
    await twins[0].context.close()
    notices.push(notice(2)); emit(notices[1]); await badge(twins[1].page, 2)
    await twins[1].page.waitForFunction(() => document.querySelectorAll('.notification-row').length === 2)
    await twins[1].context.close()
    check('Two simultaneous initializations of the same account keep independent reconciled inboxes/counts; closing one leaves the other subscribed')
    notices = [notice()]
    const { context, page } = await setup(390, a, false)
    await inbox(page); await badge(page, 1)
    notices.push(notice(2)); await refreshed(page); await badge(page, 2); assert.equal(await page.locator('.notification-row').count(), 2)
    await page.screenshot({ path: out + '/no-channel-manual-390.png', fullPage: true })
    check('No Realtime subscription acknowledgement: manual refresh still retrieves notices and authoritative unread count')
    notices = [notice(3, 'event_update'), { ...notice(4, 'chat'), target: '/events/' + eventId + '/chat' }, { ...notice(5, 'follow_request'), target: '/me/follow-requests' }, { ...notice(6, 'direct_message'), target: '/messages/' + conversation }]
    await refreshed(page)
    for (const name of ['Ver evento', 'Ver chat', 'Ver solicitudes', 'Ver mensaje']) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 1)
    const cacheUrls = await page.evaluate(async () => {
      const urls = []; for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(req.url); return urls
    })
    assert.ok(cacheUrls.every(url => !url.includes('supabase.co')))
    check('Existing notification types keep actions; browser Cache API contains no Supabase private responses')
    await context.close()
  }
  assert.deepEqual(errors, [])
} catch (error) { failure = error.stack; throw error }
finally {
  await writeFile(out + '/results.json', JSON.stringify({ environment: 'Actual Vite build + SDK; synthetic Auth/REST/Phoenix WebSocket; NOT real JWT/RLS/Realtime/device QA', baseline, results, errors, calls: { listCalls, changeCalls, countCalls, markCalls, targetCalls }, failure, result: failure ? 'FAIL' : 'PASS' }, null, 2) + '\n')
  await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r))
}
