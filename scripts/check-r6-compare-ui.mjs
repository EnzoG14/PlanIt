import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const root = resolve('dist'), out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/ui-back-navigation/compare'
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer(async (req, res) => {
  const file = resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`)
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return }
  try { res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file)) }
  catch { res.setHeader('Content-Type', 'text/html'); res.end(await readFile(resolve(root, 'index.html'))) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
await mkdir(out, { recursive: true })
const viewer = '20000000-0000-4000-8000-000000000001'
const user = { id: viewer, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const session = { access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }
const xss = '<img src=x onerror="window.__xss=1">Fiesta'
const uid = n => `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const fixtures = [
  { n: 1, title: 'Evento A', cap: 10, confirmed: 4, state: 'open' },
  { n: 2, title: 'Evento B', cap: 20, confirmed: 15, state: 'open' },
  { n: 3, title: 'Sin cupo legado', cap: 0, confirmed: 2, state: 'open' },
  { n: 4, title: xss, cap: 5, confirmed: 5, state: 'ended' },
  ...Array.from({ length: 8 }, (_, i) => ({ n: 5 + i, title: `Extra ${i + 1}`, cap: 10, confirmed: i, state: 'open' })),
  { n: 20, title: 'Evento archivado', cap: 10, confirmed: 1, state: 'archived' },
]
const row = f => ({ id: uid(f.n), title: f.title, starts_at: '2099-01-01T18:00:00', ends_at: '2099-01-01T20:00:00', location_name: null, address: 'Buenos Aires', category_name: 'Encuentros', event_state: f.state, participation_status: null, image_path: null })
const results = [], errors = []
let failure
try {
  for (const width of [320, 360, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce' })
    await context.addInitScript(value => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(value)), session)
    let mode = 'data', release, compareCalls = []
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const path = new URL(route.request().url()).pathname
      const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user)
      if (path === '/rest/v1/rpc/get_my_organized_events') {
        const { p_filter } = route.request().postDataJSON()
        return reply(fixtures.filter(f => p_filter === 'archived' ? f.state === 'archived' : p_filter === 'all' ? f.state !== 'archived' : false).map(row))
      }
      if (path === '/rest/v1/rpc/get_my_events_occupancy') {
        const { p_event_ids } = route.request().postDataJSON(); compareCalls.push(p_event_ids)
        if (mode === 'slow' && p_event_ids.length === 2) await new Promise(resolve => { release = resolve })
        if (mode === 'error') return reply({ code: '500', message: 'PRIVATE_SENTINEL' }, 500)
        const picked = p_event_ids.map(id => fixtures.find(f => uid(f.n) === id))
        if (picked.some(f => !f)) return reply({ code: '42501', message: 'event_unavailable' }, 403)
        return reply({ as_of: '2026-10-15T10:30:00', events: picked.map(f => ({ event_id: uid(f.n), title: f.title, event_state: f.state, capacity: f.cap, confirmed_count: f.confirmed, available_spots: Math.max(f.cap - f.confirmed, 0), occupancy_percent: f.cap > 0 ? 100 * f.confirmed / f.cap : null, capacity_usable: f.cap > 0 })) })
      }
      if (path.startsWith('/rest/v1/')) return reply([])
      return reply({})
    })
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
    const check = test => { results.push({ width, test, result: 'PASS' }); console.log(`PASS ${width}: ${test}`) }
    const shot = name => page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true })
    const box = title => page.getByRole('checkbox', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    const rows = () => page.locator('.compare-table tbody tr')
    const noOverflow = async () => { const bad = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth ? [] : [...document.querySelectorAll('body *')].filter(n => n.getBoundingClientRect().right > innerWidth + 1).slice(0, 5).map(n => `${n.tagName}.${n.className}:${Math.round(n.getBoundingClientRect().right)}`)); assert.deepEqual(bad, []) }
    if (width === 390) {
      await page.goto(`${origin}/my-events`)
      await page.getByRole('link', { name: 'Comparar eventos', exact: true }).click()
      await page.waitForURL(url => url.pathname === '/my-events/compare')
      assert.equal(await page.locator('.primary-nav a').count(), 0)
      results.push({ width, test: 'Secondary entry from Mis eventos; dock hidden on comparison', result: 'PASS' })
    }
    await page.goto(`${origin}/my-events/compare`)
    await page.getByRole('heading', { name: 'Comparar eventos', exact: true }).waitFor()
    await box('Evento A').waitFor(); await page.evaluate(() => document.fonts.ready)
    assert.equal(await rows().count(), 0); await page.getByText('Elegí al menos 2 eventos').first().waitFor()
    await box('Evento A').check(); assert.equal(await rows().count(), 0)
    assert.ok(await page.getByText('Comparación no disponible').isVisible()); await shot('one-selected')
    check('0 and 1 selected block the comparison with an accessible message')
    await box('Evento B').check(); await rows().first().waitFor()
    assert.equal(await rows().count(), 2)
    const text = await page.locator('.compare-table').innerText()
    assert.match(text, /40 %/); assert.match(text, /75 %/)
    assert.equal(await page.locator('.compare-table progress').first().getAttribute('value'), '40')
    assert.match(await page.locator('.analytics-updated').innerText(), /10:30/); await noOverflow(); await shot('two-events')
    check('Two events: 4/10 = 40 % and 15/20 = 75 % with Argentina time under Tokyo zone')
    await box('Sin cupo legado').check(); await page.getByText('N/D · sin cupo utilizable').waitFor()
    assert.equal(await rows().count(), 3); assert.match(await page.locator('.compare-result').innerText(), /no tiene un cupo utilizable/); await shot('legacy-capacity')
    await box('Sin cupo legado').uncheck(); await page.waitForFunction(() => document.querySelectorAll('.compare-table tbody tr').length === 2)
    check('Capacity 0 shows N/D with explanation, never a percentage; selection change updates the view')
    await page.getByRole('button', { name: 'Archivados', exact: true }).click(); await box('Evento archivado').waitFor()
    assert.match(await page.locator('#compare-hint').innerText(), /2 de 10/)
    await box('Evento archivado').check(); await page.waitForFunction(() => document.querySelectorAll('.compare-table tbody tr').length === 3)
    assert.match(await rows().nth(2).innerText(), /Archivado/)
    await page.getByRole('button', { name: 'Todos', exact: true }).click(); await box('Evento A').waitFor(); assert.equal(await box('Evento A').isChecked(), true)
    assert.equal(await rows().count(), 3)
    check('Filter change keeps the selection; archived event is selectable and shows its state')
    // XSS title is data.
    await box('Fiesta').check().catch(() => {}); await page.waitForTimeout(150)
    assert.equal(await page.evaluate(() => window.__xss ?? 0), 0)
    assert.equal(await page.locator('.compare-page img[src="x"]').count(), 0)
    check('Hostile title rendered as text only')
    // Up to 10 chosen; the rest disabled.
    for (const f of fixtures.filter(f => f.state === 'open' && f.n >= 5)) if (await box(f.title).isEnabled()) await box(f.title).check()
    await page.waitForFunction(() => document.querySelectorAll('.compare-table tbody tr').length >= 2)
    const selected = await page.locator('.compare-chosen li').count()
    assert.ok(selected <= 10)
    if (selected === 10) { assert.equal(await page.locator('.compare-options input:not(:checked)').evaluateAll(n => n.every(i => i.disabled)), true); assert.match(await page.locator('#compare-hint').innerText(), /máximo de 10/) }
    await noOverflow(); await shot('ten-events')
    check('Maximum of 10 enforced in the UI; further options disabled')
    // Fresh page, then race: slow first response must never replace the newer selection.
    await page.reload(); await box('Evento A').waitFor()
    mode = 'slow'; compareCalls = []
    await box('Evento A').check(); await box('Evento B').check()
    while (!compareCalls.length) await new Promise(resolve => setTimeout(resolve, 20))
    mode = 'data'; await box('Evento A').uncheck(); await box('Sin cupo legado').check()
    await page.waitForFunction(() => /Sin cupo legado/.test(document.querySelector('.compare-table')?.innerText ?? ''))
    release?.(); await page.waitForTimeout(250)
    const final = await page.locator('.compare-table').innerText()
    assert.doesNotMatch(final, /Evento A/); assert.match(final, /Evento B/); assert.match(final, /Sin cupo legado/)
    check('Rapid selection change: late response for the old selection is ignored')
    mode = 'error'; await box('Evento B').uncheck(); await box('Extra 1').check()
    await page.getByRole('heading', { name: 'Comparación no disponible' }).waitFor(); assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE_SENTINEL')); assert.equal(await rows().count(), 0)
    mode = 'data'; await page.getByRole('button', { name: 'Reintentar', exact: true }).first().click(); await rows().first().waitFor()
    check('Error is neutral, hides stale rows, and Retry recovers')
    await page.evaluate(() => { const nodes = [...document.querySelectorAll('.compare-page *')]; const sizes = nodes.map(node => parseFloat(getComputedStyle(node).fontSize)); nodes.forEach((node, i) => { node.style.fontSize = `${sizes[i] * 2}px` }) })
    await noOverflow(); await shot('text-200')
    check('200 % text without page overflow')
    await page.getByRole('link', { name: 'Volver', exact: true }).focus(); await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.activeElement !== document.body))
    await context.close()
    const anon = await browser.newContext(); const anonPage = await anon.newPage(); await anonPage.goto(`${origin}/my-events/compare`); await anonPage.waitForURL(url => url.pathname === '/login'); await anon.close()
    check('Anonymous direct route requires login')
  }
  assert.deepEqual(errors, [])
} catch (error) { failure = String(error.stack ?? error); console.error(error); process.exitCode = 1 }
finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await writeFile(`${out}/results.json`, JSON.stringify({ result: failure ? 'FAIL' : 'PASS', environment: 'Actual Vite build in Edge headless; synthetic Auth/RPC fixtures, not real JWT/RLS', results, errors, failure }, null, 2) + '\n') }
