import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { execFileSync } from 'node:child_process'

const out = 'docs/qa/r7-block-11/ui'
await mkdir(out, { recursive: true })
const baseline = process.argv.includes('--baseline')
const server = await createServer({ plugins: baseline ? [{ name: 'b11-baseline', enforce: 'pre', transform(_source, id) {
  const path = id.replaceAll('\\', '/').split('/src/')[1]?.split('?')[0]
  if (path && ['pages/EventDetailPage.tsx','pages/discovery.css','components/EventParticipation.tsx','components/EventManagement.tsx','components/EventLinkPanel.tsx'].includes(path)) return execFileSync('git', ['show', `279af15d09988f43a4e79dd397611c645b0b2808:src/${path}`], { encoding: 'utf8', windowsHide: true })
} }] : [], server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error' })
await server.listen()
const local = `http://127.0.0.1:${server.httpServer.address().port}`, origin = 'https://planit.example.org'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', user_metadata: { display_name: 'Persona QA' }, app_metadata: {} }
const eventId = '30000000-0000-4000-8000-000000000001'
const results = [], errors = []
const record = test => { results.push({ test, result: 'PASS' }); console.log('PASS', test) }
try {
  for (const width of baseline ? [390,1280] : [320, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce', serviceWorkers: 'block' })
    const state = { owner: false, confirmed: true, visibility: 'public', ended: false, deny: false, stories: [], rotations: 0, share: 'cancel' }
    await context.addInitScript(user => {
      localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user }))
      window.__shares = []
      Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__shares.push(data); throw { name: 'AbortError' } } })
    }, user)
    await context.route(origin + '/**', async route => {
      const url = new URL(route.request().url())
      await route.fulfill({ response: await route.fetch({ url: local + url.pathname + url.search }) })
    })
    await context.route('**/*.supabase.co/**', async route => {
      const path = new URL(route.request().url()).pathname
      const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user)
      if (path === '/rest/v1/events') return reply(state.deny ? [] : [{ id: eventId, organizer_id: state.owner ? user.id : 'other', title: 'Encuentro de fotografía · QA', description: 'Datos sintéticos para verificar la integración R7.', starts_at: '2099-12-31T20:00:00', ends_at: state.ended ? '2020-01-01T22:00:00' : '2099-12-31T22:00:00', address: 'Corrientes 123, Buenos Aires', location_name: 'Centro cultural', category_id: 'category', capacity: 20, visibility: state.visibility, cancelled_at: null, archived_at: null }])
      if (path === '/rest/v1/categories') return reply([{ id: 'category', name: 'Cultura' }])
      if (path.endsWith('get_event_organizer')) return reply([{ display_name: 'Organizador QA', username: 'organizador' }])
      if (path.endsWith('get_event_participation_summary')) return reply([{ is_organizer: state.owner, own_status: state.confirmed ? 'confirmed' : null, confirmed_count: 1, capacity: 20, available_spots: 19, event_state: state.ended ? 'ended' : 'open' }])
      if (path.endsWith('leave_event')) { state.confirmed = false; return reply(eventId) }
      if (path.endsWith('get_event_stories')) return reply({ server_now: '2099-12-31T20:00:00', items: state.stories, next_cursor: null })
      if (path.endsWith('r7-story-image')) return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jrXkAAAAASUVORK5CYII=', 'base64'), headers: { 'cache-control': 'no-store' } })
      if (path.endsWith('get_my_rejoin_status')) return reply({ status: null, can_request: false })
      if (path.endsWith('get_event_link_status')) return reply(true)
      if (path.endsWith('create_or_rotate_event_link')) { state.rotations++; return reply('a'.repeat(64)) }
      if (path.endsWith('get_my_profile')) return reply([])
      return reply([])
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    const load = async () => {
      await page.goto(`${origin}/events/${eventId}`)
      await page.getByRole('heading', { name: 'Encuentro de fotografía · QA' }).waitFor()
      await page.getByRole('button', { name: 'Actualizar estado', exact: true }).waitFor()
      await page.evaluate(() => document.fonts.ready)
    }
    await load()
    if (baseline) {
      await page.screenshot({ path: `${out}/before-${width}.png`, fullPage: true })
      record(`${width}: base HEAD actual detail before integration, synthetic Auth/RPC`)
      await context.close(); continue
    }
    await page.getByText('Todavía no hay historias vigentes.').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Publicar historia', exact: true }).count(), 1)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar archivo .ics' }).click()
    const download = await downloadPromise
    await download.saveAs(`${out}/event-${width}.ics`)
    await page.getByRole('button', { name: 'Compartir', exact: true }).click()
    assert.equal(await page.getByText('La opción de compartir finalizó.', { exact: false }).count(), 0)
    const payload = await page.evaluate(() => window.__shares[0])
    assert.equal(payload.url, `${origin}/events/${eventId}`)
    assert.deepEqual(Object.keys(payload).sort(), ['text', 'title', 'url'])
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${out}/detail-${width}.png`, fullPage: true })
    record(`${width}: actual App/router/detail, confirmed Stories empty/publish, ICS download, share cancellation and public allowlist, no overflow`)
    state.stories = [{ id: 'story-1', author_id: 'author', display_name: 'Sofía QA', username: 'sofia', event_id: eventId, file_id: 'file-1', bucket_name: 'event_media', storage_path: 'r7/stories/author/event/story.png', mime_type: 'image/png', size_bytes: 68, created_at: '2099-12-31T20:00:00', expires_at: '2100-01-01T20:00:00' }]
    await page.getByRole('button', { name: 'Actualizar', exact: true }).click()
    await page.getByRole('button', { name: 'Sofía QA 1 historias' }).click()
    await page.locator('.story-image img').waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog', { name: 'Visor de historias' }).count(), 0)
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Sofía QA/)
    assert.equal(new URL(page.url()).pathname, `/events/${eventId}`)
    record(`${width}: opens image in inline StoryViewer, Escape returns focus and preserves detail URL`)
    await page.getByRole('button', { name: 'Retirarme', exact: true }).click()
    await page.getByRole('button', { name: 'Unirme', exact: true }).waitFor()
    assert.equal(await page.getByRole('region', { name: 'Historias del evento' }).count(), 0)
    state.visibility = 'unlisted'
    await load()
    assert.equal(await page.getByRole('region', { name: 'Historias del evento' }).count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Compartir', exact: true }).isDisabled(), true)
    record(`${width}: leave removes Stories; hidden link-only cannot read/publish Stories or share invitation`)
    state.owner = true
    await load()
    await page.getByRole('button', { name: 'Regenerar enlace', exact: true }).click()
    assert.equal(state.rotations, 0)
    await page.getByRole('button', { name: 'Confirmar regeneración' }).click()
    const dialog = page.getByRole('dialog', { name: 'Guardá tu enlace' })
    await dialog.waitFor()
    await dialog.getByRole('button', { name: 'Compartir', exact: true }).click()
    assert.equal(state.rotations, 1)
    assert.equal(await page.evaluate(() => window.__shares.at(-1).url), `${origin}/invite#token=${'a'.repeat(64)}`)
    await dialog.getByRole('button', { name: 'Listo', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Compartir', exact: true }).isDisabled(), true)
    assert.ok(!(await page.evaluate(() => JSON.stringify(localStorage))).includes('a'.repeat(64)))
    state.ended = true
    await load()
    await page.getByText('El evento no admite nuevas historias.').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Publicar historia', exact: true }).count(), 0)
    assert.equal(await page.getByRole('region', { name: 'Historias del evento' }).count(), 1)
    record(`${width}: owner shares only issued token inside dialog, no implicit rotation/storage; ended event keeps Stories reading without publishing`)
    if (width === 320 || width === 1280) {
      await page.addStyleTag({ content: 'html { font-size: 200% }' })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: `${out}/text-200-${width}.png`, fullPage: true })
    }
    state.deny = true
    await page.reload()
    await page.getByRole('heading', { name: 'Evento no disponible' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Descargar archivo .ics' }).count(), 0)
    record(`${width}: revoked detail removes all export and Stories actions`)
    await context.close()
  }
  assert.deepEqual(errors, [])
} finally {
  await writeFile(`${out}/${baseline ? 'before-results' : 'results'}.json`, JSON.stringify({ environment: 'Edge headless, actual App and pages; synthetic HTTPS proxied to Vite, mocked Auth/RPC/Web Share. Not remote permissions or native sharing.', browser: browser.version(), results, errors }, null, 2))
  await browser.close(); await server.close()
}
