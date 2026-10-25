import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4187'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/event-cards-image-layout'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const location = 'Ubicación exclusiva del detalle'
const shapes = ['vertical', 'square', 'panorama', 'missing', 'broken']
const events = shapes.map((shape, index) => ({ id: `30000000-0000-4000-8000-00000000000${index + 1}`, organizer_id: user.id, title: `Evento de prueba ${shape}${index === 0 ? ' con un título largo para comprobar el espacio disponible' : ''}`, description: 'Fixture local para verificar tarjetas.', starts_at: '2099-10-13T20:00:00', ends_at: '2099-10-13T22:00:00', address: location, location_name: location, latitude: -34.6, longitude: -58.38, capacity: 20, category_id: '10000000-0000-4000-8000-000000000001', category_name: 'Música', visibility: 'public', cancelled_at: null, archived_at: null, event_state: 'open', participation_status: null, image_path: shape === 'missing' ? null : `fixture/${shape}.svg` }))
const measurements = []
try {
  for (const width of [320, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
    await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user })), user)
    await context.routeWebSocket(/supabase\.co/, socket => socket.close())
    await context.route('https://api.mapbox.com/**', route => route.fulfill({ json: {} }))
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
      const url = new URL(route.request().url()), path = url.pathname
      const reply = json => route.fulfill({ json })
      if (path === '/auth/v1/user') return reply(user)
      if (path.endsWith('/profiles')) return reply({ display_name: 'Perfil de prueba', username: 'fixture', avatar_file_id: null })
      if (path.endsWith('/categories')) return reply([{ id: events[0].category_id, name: 'Música', is_active: true }])
      if (path.endsWith('/search_public_events') || path.endsWith('/get_my_organized_events') || path.endsWith('/get_my_events')) return reply(events)
      if (path.endsWith('/events')) return reply([events.find(event => event.id === url.searchParams.get('id')?.replace('eq.', '')) ?? events[0]])
      if (path.endsWith('/get_event_organizer')) return reply([{ display_name: 'Organizadora de prueba', username: 'fixture' }])
      if (path.endsWith('/get_event_participation_summary')) return reply([{ confirmed_count: 3, capacity: 20, available_spots: 17, own_status: null, is_organizer: true, event_state: 'open' }])
      if (path === '/storage/v1/object/sign/event_media') return reply(route.request().postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/event_media/${path}?token=fixture` })))
      if (path.startsWith('/storage/v1/object/sign/event_media/')) {
        if (path.includes('broken')) return route.fulfill({ status: 404, body: '' })
        const [w, h] = path.includes('vertical') ? [240, 600] : path.includes('panorama') ? [1000, 240] : [400, 400]
        return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#ded7f7"/><rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="#060b27" stroke-width="8"/><text x="50%" y="50%" text-anchor="middle" fill="#060b27" font-size="26">FIXTURE</text></svg>` })
      }
      return reply([])
    })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    for (const [name, path, selector] of [['home', '/home', '.home-category .event-card'], ['map', '/map', '.map-results .event-card'], ['organizing', '/my-events?section=organizing', '.compact-event-card'], ['participating', '/my-events?section=participating', '.compact-event-card']]) {
      await page.goto(`${origin}${path}`)
      await page.waitForFunction(selector => document.querySelectorAll(selector).length === 5, selector)
      const cards = page.locator(selector)
      for (let index = 0; index < 5; index++) {
        const card = cards.nth(index)
        await card.scrollIntoViewIfNeeded()
        if (index < 3) await card.locator('img[data-image-state="loaded"]').waitFor()
        else if (index === 4) await card.locator('img').waitFor({ state: 'detached' })
        assert.equal((await card.innerText()).includes(location), false)
        assert.equal(await card.locator('a').first().getAttribute('href'), `/events/${events[index].id}`)
        if (index < 3) {
          const metric = await card.locator('img').evaluate(image => {
            const frame = image.parentElement.getBoundingClientRect(), rect = image.getBoundingClientRect(), css = getComputedStyle(image)
            return { frameWidth: frame.width, frameHeight: frame.height, imageWidth: rect.width, imageHeight: rect.height, fit: css.objectFit, position: css.objectPosition, naturalRatio: image.naturalWidth / image.naturalHeight }
          })
          assert.ok(Math.abs(metric.frameWidth - metric.frameHeight) < 1, JSON.stringify(metric))
          assert.ok(Math.abs(metric.imageWidth - metric.frameWidth) < 1)
          assert.ok(Math.abs(metric.imageHeight - metric.frameHeight) < 1)
          assert.equal(metric.fit, 'contain')
          assert.equal(metric.position, '50% 50%')
          measurements.push({ width, page: name, shape: shapes[index], ...metric })
        }
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await cards.first().scrollIntoViewIfNeeded()
      if ([375, 1280].includes(width)) await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true })
      if (name === 'map') {
        await cards.first().getByRole('button', { name: 'Ver marcador' }).click()
        const preview = page.getByRole('region', { name: 'Evento seleccionado' })
        await preview.waitFor()
        assert.equal((await preview.innerText()).includes(location), false)
        const frame = await preview.locator('.event-card-photo').boundingBox()
        assert.ok(Math.abs(frame.width - frame.height) < 1)
        if ([375, 1280].includes(width)) await preview.screenshot({ path: `${output}/map-preview-${width}.png` })
        await preview.getByRole('button', { name: 'Cerrar vista previa' }).click()
        assert.equal(await cards.count(), 5)
      }
      if (name === 'home') {
        await cards.first().getByRole('link').first().click()
        await page.waitForURL(`**/events/${events[0].id}`)
        await page.locator('.detail-metadata').getByText(location, { exact: true }).first().waitFor()
      }
      console.log(`PASS ${width}px ${name}: full square thumbnails, no location, fallbacks and navigation`)
    }
    await context.close()
  }
  await writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2) + '\n')
} finally { await browser.close() }
