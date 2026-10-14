import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH).href)
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r4-block-5/visual'
await mkdir(output, { recursive: true })
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002'
const id = '30000000-0000-4000-8000-000000000001'
const event = { id, organizer_id: owner, category_id: '10000000-0000-4000-8000-000000000001', title: 'Encuentro de fotografía', description: 'Fixture local para verificar que la seguridad conserva la composición Amanecer.',
  starts_at: '2099-10-15T18:00:00', ends_at: '2099-10-15T20:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 10, visibility: 'public', cancelled_at: null, archived_at: null }
const user = { id: guest, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const session = { access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }
const results = [], shots = new Map()
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
try {
  for (const [label, directory] of [['baseline', '.baseline.local/dist'], ['implementation', 'dist']]) {
    const root = resolve(directory)
    const server = createServer(async (req, res) => {
      try {
        const path = resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`)
        assert.ok(path === root || path.startsWith(root + sep))
        const extensions = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
        const file = extname(path) ? path : resolve(root, 'index.html')
        res.setHeader('Content-Type', extensions[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file))
      } catch { res.statusCode = 404; res.end() }
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    try {
      for (const [width, height] of [[375, 812], [1280, 900]]) for (const state of ['public', 'active', 'revoked']) {
        const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Argentina/Buenos_Aires', reducedMotion: 'reduce', serviceWorkers: 'block' })
        const signatures = [], errors = [], unexpected = []
        try {
          await context.addInitScript(({ session }) => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(session)), { session })
          await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
            const request = route.request(), path = new URL(request.url()).pathname
            const reply = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
            if (path === '/auth/v1/user') return reply(user)
            if (path === '/rest/v1/notifications') return reply([])
            if (path === '/rest/v1/events') return reply(state === 'revoked' ? [] : [{ ...event, visibility: state === 'public' ? 'public' : 'unlisted' }])
            if (path === '/rest/v1/categories') return reply([{ id: event.category_id, name: 'Arte', is_active: true }])
            if (path === '/rest/v1/event_images') return reply([{ files: { storage_path: `${owner}/${id}/fixture.png` } }])
            if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizador de prueba', username: 'organizador' }])
            if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 2, capacity: 10, available_spots: 8, own_status: null, is_organizer: false, event_state: 'open' }])
            if (path === '/storage/v1/object/sign/event_media') {
              signatures.push(request.postDataJSON().expiresIn)
              return reply(request.postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/event_media/${path}?token=fixture` })))
            }
            if (path.startsWith('/storage/v1/object/sign/')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#ece8ff"/><circle cx="480" cy="300" r="90" fill="#5b34d6"/></svg>' })
            unexpected.push(path); return reply([])
          })
          await context.routeWebSocket(/.*/, socket => socket.close())
          const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
          await page.goto(`http://127.0.0.1:${server.address().port}/events/${id}`)
          await page.getByRole('heading', { name: state === 'revoked' ? 'Evento no disponible' : event.title, exact: true }).waitFor()
          await page.evaluate(() => document.fonts.ready)
          if (state !== 'revoked') {
            await page.getByRole('button', { name: 'Unirme', exact: true }).waitFor()
            await page.waitForFunction(() => [...document.images].every(image => image.complete))
            assert.deepEqual(signatures, [label === 'baseline' ? 300 : 60])
          } else assert.deepEqual(signatures, [])
          assert.deepEqual(errors, []); assert.deepEqual(unexpected, [])
          const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, shell: Boolean(document.querySelector('.amanecer-shell')), wash: document.querySelectorAll('.discovery-wash').length }))
          assert.equal(geometry.overflow, false); assert.equal(geometry.shell, true)
          const name = `${state}-${width}x${height}`
          const buffer = await page.screenshot({ path: `${output}/${label}-${name}.png`, fullPage: true, animations: 'disabled', caret: 'hide' })
          const hash = createHash('sha256').update(buffer).digest('hex')
          if (label === 'baseline') shots.set(name, hash)
          else assert.equal(hash, shots.get(name), `Unchanged presentation: ${name}`)
          results.push({ label, state, viewport: `${width}x${height}`, geometry, signatures, hash, result: 'PASS' })
        } finally { await context.close() }
      }
    } finally { await new Promise(resolve => server.close(resolve)) }
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ base: 'dacd893', environment: 'Edge browser, intercepted Auth/REST/Storage, WebSocket blocked; not real JWT', results }, null, 2))
  console.log('PASS: six baseline/implementation screenshot pairs identical; 375/1280; public/active/revoked; signed URL TTL 300 -> 60; denied state issues no signatures')
} finally { await browser.close() }
