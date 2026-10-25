import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Use the desktop bundled Playwright or an explicitly supplied installation.
const runtime = process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
const { chromium } = await import(pathToFileURL(runtime).href)
const browser = await chromium.launch({ headless: true, channel: process.env.PLANIT_BROWSER_CHANNEL ?? 'msedge' })
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/create-event-r1'
await mkdir(output, { recursive: true })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4181'
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: { display_name: 'Prueba' }, identities: [], created_at: '2026-10-10T12:00:00Z' }
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const measurements = []
async function fixture(width = 390, height = 844, authenticated = true) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Tokyo' })
  if (authenticated) await context.addInitScript(({ user }) => {
    localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }))
  }, { user })
    const state = { calls: [], events: new Map(), images: new Map(), failure: '', cleanupFails: false, cleanup: 0, uploads: 0, rpc: 0, emptyCatalog: false }
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    state.calls.push({ path: url.pathname, method: request.method() })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (url.pathname === '/auth/v1/user') return reply(user)
    if (url.pathname === '/rest/v1/categories') return reply(state.emptyCatalog ? [] : [category])
    if (url.pathname === '/rest/v1/rpc/create_event') {
      state.rpc += 1
      const body = request.postDataJSON()
      if (state.failure === 'rollback') return reply({ code: 'P0001', message: 'category_inactive', details: null, hint: null }, 400)
      const event = { id: body.p_id, organizer_id: user.id, title: body.p_title, description: body.p_description, starts_at: body.p_starts_at, ends_at: body.p_ends_at, address: body.p_address, location_name: body.p_location_name, latitude: body.p_latitude, longitude: body.p_longitude, capacity: body.p_capacity, category_id: body.p_category_id, visibility: 'public', cancelled_at: null, archived_at: null }
      state.events.set(event.id, event)
      state.images.set(event.id, body.p_image_paths.map(storage_path => ({ files: { storage_path } })))
      if (state.failure === 'lost-response') { state.failure = ''; return route.abort('failed') }
      return reply(event.id)
    }
    if (url.pathname === '/rest/v1/events') {
      const id = url.searchParams.get('id')?.replace('eq.', '')
      return reply(state.events.has(id) ? [state.events.get(id)] : [])
    }
    if (url.pathname === '/rest/v1/event_images') {
      const id = url.searchParams.get('event_id')?.replace('eq.', '')
      return reply(state.images.get(id) ?? [])
    }
    if (url.pathname.startsWith('/storage/v1/object/sign/') && request.method() === 'POST') return reply(request.postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/event_media/${path}?token=fixture`, error: null })))
    if (url.pathname.startsWith('/storage/v1/object/sign/') && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'image/png', body: photo.buffer })
    if (url.pathname.startsWith('/storage/v1/object/')) {
      if (request.method() === 'DELETE') { state.cleanup += 1; return state.cleanupFails ? reply({ statusCode: '500', error: 'failed', message: 'fixture cleanup error' }, 500) : reply([]) }
      state.uploads += 1
      if (state.failure === 'upload') return reply({ statusCode: '500', error: 'failed', message: 'fixture upload error' }, 500)
      return reply({ Key: url.pathname })
    }
    return reply({ code: 'fixture_unhandled', message: url.pathname }, 500)
  })
  await context.route('https://api.geoapify.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ results: [{ place_id: 'fixture', formatted: 'Av. Corrientes 123, Buenos Aires', lat: -34.6037, lon: -58.3816 }] }) }))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/events/new`)
  if (authenticated) await page.getByRole('button', { name: 'Publicar evento', exact: true }).waitFor()
  return { context, page, state, errors }
}
async function fill(page) {
  for (const [name, value] of Object.entries({ title: 'Encuentro de música', description: 'Compartimos una noche de música con la comunidad.', start_date: '2099-10-11', start_time: '20:00', end_time: '22:00', address: 'Av. Corrientes 123, Buenos Aires', capacity: '20' })) await page.locator(`form [name="${name}"]`).fill(value)
  await page.locator('[name="address"]').focus()
  await page.getByRole('option', { name: 'Av. Corrientes 123, Buenos Aires', exact: true }).click()
  await page.getByLabel('Categoría', { exact: true }).selectOption(category.id)
}
const photo = { name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jrXkAAAAASUVORK5CYII=', 'base64') }
try {
  for (const [width, height] of [[320, 800], [360, 800], [375, 812], [390, 844], [768, 1024], [1280, 800]]) {
    const { context, page, state, errors } = await fixture(width, height)
    assert.equal(await page.locator('[name="end_date"]').count(), 0)
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).isEnabled()
    await page.screenshot({ path: `${output}/form-${width}x${height}.png`, fullPage: true })
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, controls: [...document.querySelectorAll('input,textarea,select,button')].map(control => ({ name: control.getAttribute('name') ?? control.textContent?.trim(), width: control.getBoundingClientRect().width, height: control.getBoundingClientRect().height })) }))
    assert.ok(metrics.scrollWidth <= width, `overflow at ${width}`)
    assert.ok(metrics.controls.every(control => control.height >= 44), `touch target at ${width}`)
    measurements.push(metrics)
    assert.equal(state.uploads + state.rpc, 0, 'Opening form must not upload or persist')
    if (width === 390) {
      await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
      assert.equal(await page.locator('[name="title"]').evaluate(element => element === document.activeElement), true)
      assert.equal(state.rpc, 0)
      await page.screenshot({ path: `${output}/validation-390x844.png`, fullPage: true })
      await page.getByRole('button', { name: 'Usar mi ubicación actual' }).click()
      await page.getByText('No pudimos obtener tu ubicación.', { exact: false }).waitFor()
      await fill(page)
      await page.locator('[name="end_time"]').fill('02:00')
      await page.locator('[name="images"]').setInputFiles(Array.from({ length: 11 }, (_, index) => ({ ...photo, name: `${index}.png` })))
      await page.getByText('Podés agregar hasta 10 fotos.').waitFor()
      assert.equal(await page.locator('.image-previews li').count(), 0)
      await page.locator('[name="images"]').setInputFiles(photo)
      assert.equal(await page.locator('.image-previews li').count(), 1)
      await page.screenshot({ path: `${output}/filled-390x844.png`, fullPage: true })
      await page.getByRole('button', { name: 'Publicar evento', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `${output}/publish-viewport-390x844.png` })
      await page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit() })
      await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
      assert.equal(state.rpc, 1); assert.equal(state.uploads, 1)
      assert.equal(state.events.size, 1)
      assert.equal([...state.events.values()][0].ends_at, '2099-10-12T02:00:00')
      assert.equal(await page.locator('.detail-metadata dd').nth(1).textContent(), '02:00')
      await page.locator('dd').filter({ hasText: /20:00/ }).waitFor()
      assert.equal(await page.locator('.event-hero img').count(), 1)
      await page.screenshot({ path: `${output}/success-390x844.png`, fullPage: true })
    }
    assert.deepEqual(errors, [])
    await context.close()
  }
  {
    const { context, page, state } = await fixture()
    await fill(page)
    state.failure = 'rollback'
    await page.locator('[name="images"]').setInputFiles(photo)
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
    await page.getByRole('heading', { name: 'No se pudo publicar' }).waitFor()
    assert.equal(state.events.size, 0); assert.equal(state.cleanup, 1)
    assert.equal(await page.getByRole('heading', { name: 'Evento publicado' }).count(), 0)
    await page.screenshot({ path: `${output}/backend-error-390x844.png`, fullPage: true })
    await context.close()
  }
  {
    const { context, page, state } = await fixture()
    await fill(page); state.failure = 'upload'
    await page.locator('[name="images"]').setInputFiles(photo)
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
    await page.getByRole('heading', { name: 'No se pudo publicar' }).waitFor()
    assert.equal(state.rpc, 0); assert.equal(state.cleanup, 1)
    await context.close()
  }
  {
    const { context, page, state } = await fixture()
    await fill(page); state.failure = 'upload'; state.cleanupFails = true
    await page.locator('[name="images"]').setInputFiles(photo)
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
    await page.getByRole('button', { name: 'Comprobar publicación' }).waitFor()
    assert.equal(await page.locator('[name="title"]').isDisabled(), true)
    state.failure = ''; state.cleanupFails = false
    await page.getByRole('button', { name: 'Comprobar publicación' }).click()
    await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    assert.equal(state.rpc, 1); assert.equal(state.events.size, 1)
    await context.close()
  }
  {
    const { context, page, state } = await fixture()
    await fill(page); state.failure = 'lost-response'
    await page.getByRole('button', { name: 'Publicar evento', exact: true }).click()
    await page.getByRole('button', { name: 'Comprobar publicación' }).waitFor()
    assert.equal(await page.locator('[name="title"]').isDisabled(), true)
    await page.getByRole('button', { name: 'Comprobar publicación' }).click()
    await page.getByRole('heading', { name: 'Evento publicado' }).waitFor()
    assert.equal(state.events.size, 1); assert.equal(state.rpc, 1)
    await context.close()
  }
  {
    const { context, page } = await fixture(390, 844, false)
    await page.getByRole('heading', { name: 'Ingresá a PlanIt' }).waitFor()
    assert.match(page.url(), /login\?next=/)
    await context.close()
  }
  await writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2))
  console.log('PASS: mobile/tablet/desktop screenshots, no overflow, 44px targets, field focus/errors, no drafts, geolocation denial, image limit, publish/readback, backend/upload failures, cleanup, lost-response retry and auth guard. All Supabase requests mocked; no remote writes.')
} finally { await browser.close() }
