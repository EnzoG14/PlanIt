import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const root = resolve('dist'), out = 'docs/qa/r6-block-2/ui'
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
const viewer = '20000000-0000-4000-8000-000000000001', event = '30000000-0000-4000-8000-000000000001', other = '30000000-0000-4000-8000-000000000002'
const user = { id: viewer, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const session = { access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: 'bearer', user }
const results = [], errors = []
let failure
try {
  for (const width of [320, 360, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce' })
    await context.addInitScript(value => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(value)), session)
    let count = 4, state = 'open', mode = 'data', release, reads = 0, owner = true
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const path = new URL(route.request().url()).pathname
      const reply = (data, status=200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user)
      if (path === '/auth/v1/logout') return reply({})
      if (path === '/rest/v1/rpc/get_my_event_occupancy') {
        reads++
        const args = route.request().postDataJSON(); assert.deepEqual(Object.keys(args), ['p_event_id'])
        if (mode === 'slow') await new Promise(resolve => { release = resolve })
        if (args.p_event_id !== event || mode === 'denied') return reply({ code: '42501', message: 'PRIVATE_SENTINEL' }, 403)
        if (mode === 'error') return reply({ code: '500', message: 'PRIVATE_SENTINEL' }, 500)
        return reply({ event_id: event, title: 'Encuentro de primavera', event_state: state, as_of: '2026-10-15T10:30:00', capacity: mode === 'invalid' ? 0 : 10, confirmed_count: count, available_spots: 10-count, occupancy_percent: count*10, capacity_usable: true })
      }
      if (path === '/rest/v1/events') return reply({ id: event, organizer_id: owner ? viewer : other, title: 'Encuentro de primavera', description: 'Fixture de navegación', starts_at: '2099-01-01T18:00:00', ends_at: '2099-01-01T20:00:00', address: 'Buenos Aires', location_name: null, latitude: -34.6, longitude: -58.38, capacity: 10, category_id: other, visibility: 'public', cancelled_at: null, archived_at: null })
      if (path === '/rest/v1/categories') return reply([{id:other,name:'Encuentros',is_active:true}])
      if (path === '/rest/v1/rpc/get_event_organizer') return reply([{display_name:'Organizador fixture',username:'fixture'}])
      if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{confirmed_count:4,capacity:10,available_spots:6,is_organizer:owner,own_status:null,event_state:'open'}])
      if (path.startsWith('/rest/v1/')) return reply([])
      return reply({})
    })
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
    if (width === 390) {
      await page.goto(`${origin}/events/${event}`)
      await page.getByRole('link', {name:'Estadísticas',exact:true}).click()
      await page.getByRole('heading',{name:'Encuentro de primavera',exact:true}).waitFor()
      await page.getByRole('link',{name:'Volver al evento',exact:true}).click()
      await page.getByRole('heading',{name:'Gestionar evento',exact:true}).waitFor()
      owner=false; await page.reload(); await page.getByRole('heading',{name:'Encuentro de primavera',exact:true}).waitFor()
      assert.equal(await page.getByRole('link',{name:'Estadísticas',exact:true}).count(),0)
      owner=true; results.push({width,test:'Owner detail→analytics→detail; participant has no analytics entry',result:'PASS'})
    }
    const loaded = () => page.getByRole('heading', { name: 'Encuentro de primavera', exact: true }).waitFor()
    const update = () => page.getByRole('button', { name: 'Actualizar datos', exact: true }).click()
    const shot = name => page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true })
    const check = test => { results.push({ width, test, result: 'PASS' }); console.log(`PASS ${width}: ${test}`) }
    await page.goto(`${origin}/events/${event}/analytics`); await loaded(); await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('progress').getAttribute('value'), '40')
    assert.match(await page.locator('.analytics-kpis').innerText(), /6\s*lugares/)
    assert.match(await page.locator('.analytics-updated').innerText(), /10:30/)
    assert.equal(await page.locator('.primary-nav a').count(), 4)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await shot('occupancy')
    await page.getByRole('button', { name: 'Actualizar datos' }).focus()
    assert.equal(await page.getByRole('button', { name: 'Actualizar datos' }).evaluate(n => getComputedStyle(n).outlineWidth), '3px')
    check('Four KPI, 10/4/6/40%, Argentina time in Tokyo zone, four navigation destinations and focus')
    count = 3; await update(); await loaded(); assert.equal(await page.locator('progress').getAttribute('value'), '30'); assert.match(await page.locator('.analytics-kpis').innerText(), /7\s*lugares/)
    count = 0; state = 'cancelled'; await update(); await loaded(); await page.getByText('Todavía no hay inscriptos confirmados.').waitFor(); await shot('empty-cancelled')
    for (state of ['archived', 'ended']) { await update(); await loaded(); assert.match(await page.locator('.analytics-state').innerText(), state === 'archived' ? /archivado/ : /finalizado/) }
    check('Refresh after withdrawal 10/3/7/30%; zero, cancelled, archived and ended explicit')
    mode = 'error'; await update(); await page.getByRole('button', { name: 'Reintentar' }).waitFor(); assert.equal(await page.locator('.analytics-kpis').count(), 0); assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE_SENTINEL')); await shot('error')
    mode = 'data'; await page.getByRole('button', { name: 'Reintentar' }).click(); await loaded()
    mode = 'invalid'; await update(); await page.getByRole('button', { name: 'Reintentar' }).waitFor(); assert.equal(await page.locator('progress').count(), 0)
    mode = 'data'; await page.getByRole('button', { name: 'Reintentar' }).click(); await loaded()
    await page.evaluate(() => window.dispatchEvent(new Event('offline'))); assert.equal(await page.locator('.analytics-kpis').count(), 0)
    await page.evaluate(() => window.dispatchEvent(new Event('online'))); await update(); await loaded()
    check('Error/invalid capacity fail closed, no raw RPC errors, explicit retry and reconnect clear stale metrics')
    mode = 'denied'; await update(); await page.getByRole('heading', { name: 'Estadísticas no disponibles' }).waitFor(); assert.equal(await page.getByText('Encuentro de primavera', { exact: true }).count(), 0); await shot('denied')
    mode = 'data'; await page.getByRole('button', { name: 'Reintentar' }).click(); await loaded()
    await page.goto(`${origin}/events/${other}/analytics`); await page.getByRole('heading', { name: 'Estadísticas no disponibles' }).waitFor(); assert.equal(await page.locator('.analytics-kpis').count(), 0)
    check('Direct foreign/link-only/follower denial fixture and route change erase prior title/metrics')
    await page.goto(`${origin}/events/${event}/analytics`); await loaded()
    await page.evaluate(() => { for (const node of document.querySelectorAll('.analytics-page *')) node.style.fontSize = `${parseFloat(getComputedStyle(node).fontSize)*2}px` })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await shot('text-200')
    await page.setViewportSize({ width, height: 480 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await shot('short')
    check('200% text and short viewport without page overflow')
    await page.reload(); await loaded(); mode = 'slow'; const before=reads; await update(); await page.waitForFunction(() => document.querySelector('[aria-busy=true]'))
    while (reads === before) await new Promise(resolve => setTimeout(resolve, 20))
    await page.clock.install(); await page.clock.fastForward(11000); await page.getByRole('button', { name: 'Reintentar' }).waitFor(); assert.equal(await page.locator('.analytics-kpis').count(),0)
    release?.(); await page.clock.resume(); mode='data'; await page.getByRole('button', { name: 'Reintentar' }).click(); await loaded()
    await page.getByRole('button', { name: 'Cuenta', exact:true }).click(); await page.getByRole('button', {name:'Cerrar sesión',exact:true}).click(); await page.waitForURL(url => url.pathname === '/login'); assert.equal(await page.locator('.analytics-kpis').count(), 0)
    check('10s timeout ignores late response; logout removes private panel')
    await context.close()
    const anon = await browser.newContext(); const anonPage=await anon.newPage(); await anonPage.goto(`${origin}/events/${event}/analytics`); await anonPage.waitForURL(url => url.pathname === '/login'); assert.equal(await anonPage.locator('.analytics-kpis').count(),0); await anon.close()
    check('Anonymous direct route requires login')
  }
  assert.deepEqual(errors, [])
} catch(error) { failure=String(error.stack??error); console.error(error); process.exitCode=1 }
finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await writeFile(`${out}/results.json`,JSON.stringify({ result: failure?'FAIL':'PASS', environment:'Actual Vite build in Edge headless; synthetic Auth/RPC fixtures, not real JWT/RLS',results,errors,failure },null,2)+'\n') }
