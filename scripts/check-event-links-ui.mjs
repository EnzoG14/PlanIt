import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH).href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const base = process.env.PLANIT_UI_BASELINE ?? 'http://127.0.0.1:4195'
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4196'
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r4-block-6/visual'
await mkdir(out, { recursive: true })
const owner = '20000000-0000-4000-8000-000000000001', guest = '20000000-0000-4000-8000-000000000002', id = '30000000-0000-4000-8000-000000000001'
const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Música', is_active: true }
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const user = uid => ({ id: uid, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const seed = { id, organizer_id: owner, title: 'Encuentro de música · fixture', description: 'Datos ficticios para QA local.', starts_at: '2099-10-12T20:00:00', ends_at: '2099-10-12T23:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 20, category_id: category.id, visibility: 'public', cancelled_at: null, archived_at: null }
const results = []
const check = (width, test) => { results.push({ width, test, result: 'PASS' }); console.log(`PASS ${width}: ${test}`) }
async function fixture(width, height, uid = owner) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce', serviceWorkers: 'block' })
  await context.addInitScript(({ key, user }) => localStorage.setItem(key, JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user })), { key, user: user(uid) })
  const state = { event: { ...seed }, hasLink: false, rotations: 0, updates: 0, creations: 0, failure: '', statusFailure: false, lostEdit: false, calls: [], saved: new Map() }
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname, args = req.method() === 'POST' ? req.postDataJSON() : null
    state.calls.push(path) // Deliberately no request bodies or response token in evidence.
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user(uid))
    if (path === '/rest/v1/categories') return reply([category])
    if (path === '/rest/v1/events') {
      const target = new URL(req.url()).searchParams.get('id')?.replace('eq.', '')
      return reply(target === id ? [state.event] : state.saved.has(target) ? [state.saved.get(target)] : [])
    }
    if (path === '/rest/v1/event_images' || path === '/rest/v1/notifications') return reply([])
    if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name: 'Organizador fixture', username: 'fixture' }])
    if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count: 2, capacity: 20, available_spots: 18, own_status: null, is_organizer: uid === owner, event_state: state.event.cancelled_at ? 'cancelled' : state.event.ends_at.startsWith('2020') ? 'ended' : 'open' }])
    if (path === '/rest/v1/rpc/get_event_link_status') return state.statusFailure ? reply({ code: 'PGRST202', message: 'fixture' }, 400) : reply(state.hasLink)
    if (path === '/rest/v1/rpc/create_or_rotate_event_link') {
      state.rotations++; assert.deepEqual(args, { p_event_id: id }); await new Promise(r => setTimeout(r, 120))
      if (state.failure === 'denied') return reply({ code: '42501', message: 'event_unavailable' }, 403)
      state.hasLink = true
      if (state.failure === 'lost') return route.abort('failed')
      return reply(state.rotations.toString(16).padStart(64, '0')) // Explicit fake token only.
    }
    if (path === '/rest/v1/rpc/update_event') {
      state.updates++
      if (state.failure === 'conflict') return reply({ code: 'P0001', message: 'confirmed_access_revoked' }, 400)
      state.event = { ...state.event, title: args.p_title, visibility: args.p_visibility }
      if (state.lostEdit) return route.abort('failed')
      return reply(id)
    }
    if (path === '/rest/v1/rpc/create_event') {
      state.creations++; assert.equal(args.p_visibility, 'unlisted')
      assert.equal(args.p_image_paths.length, 0)
      state.saved.set(args.p_id, { ...seed, id: args.p_id, title: args.p_title, visibility: args.p_visibility })
      return reply(args.p_id)
    }
    if (path === '/rest/v1/rpc/get_event_duplicate_source') return uid === owner ? reply([state.event]) : reply({ code: '42501', message: 'event_unavailable' }, 403)
    return reply([])
  })
  await context.routeWebSocket(/supabase\.co/, socket => socket.close())
  const page = await context.newPage(), errors = []
  page.on('pageerror', e => errors.push(e.message))
  return { context, page, state, errors }
}
async function shot(page, name) {
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, mask: [page.locator('.event-link-dialog input')] })
}
try {
  const requestedWidth = Number(process.argv[2])
  for (const [width, height] of [[320,800], [360,800], [375,812], [390,844], [768,1024], [1280,900]].filter(([width]) => !requestedWidth || requestedWidth === width)) {
    const f = await fixture(width, height), { page, state } = f
    try {
      for (const [label, server] of [['before', base], ['after', origin]]) {
        await page.goto(`${server}/events/new`); await page.locator('form').waitFor(); await shot(page, `${label}-create-${width}`)
        await page.goto(`${server}/events/${id}/edit`); await page.locator('form').waitFor(); await shot(page, `${label}-edit-${width}`)
        await page.goto(`${server}/events/${id}`); await page.locator('.event-management').waitFor(); await shot(page, `${label}-public-detail-${width}`)
      }
      check(width, 'Immutable baseline and implementation: create/edit/public detail, no overflow, Amanecer scopes')
      await page.goto(`${origin}/events/new`); await page.locator('form').waitFor()
      for (const [name, value] of Object.entries({ title: 'Oculto fixture', description: 'Evento de prueba', start_date: '2099-10-12', start_time: '20:00', end_time: '23:00', address: 'Buenos Aires', latitude: '-34.6', longitude: '-58.38', capacity: '20' })) await page.locator(`form [name="${name}"]`).fill(value)
      await page.locator('[name="category_id"]').selectOption(category.id); await page.locator('[name="visibility"]').selectOption('unlisted')
      await page.getByRole('button', { name: 'Publicar evento', exact: true }).dblclick(); await page.getByText('Tu evento oculto fue publicado.', { exact: false }).waitFor(); assert.equal(state.creations, 1)
      check(width, 'Hidden creation sends visibility in the only create RPC, duplicate submit blocked, accurate success copy')
      await page.goto(`${origin}/events/${id}/edit`); await page.locator('form').waitFor(); await page.locator('[name="visibility"]').selectOption('unlisted')
      state.failure = 'conflict'; await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click(); await page.getByText('Hay asistentes confirmados', { exact: false }).waitFor(); assert.equal(state.event.visibility, 'public')
      assert.equal(await page.locator('[name="visibility"]').inputValue(), 'unlisted'); await shot(page, `conflict-${width}`)
      state.failure = ''; state.lostEdit = true; await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click(); await page.getByText('Cambios guardados', { exact: true }).waitFor(); state.lostEdit = false
      assert.equal(state.updates, 2); await page.getByRole('button', { name: 'Generar enlace', exact: true }).waitFor(); await shot(page, `hidden-detail-${width}`)
      check(width, 'Revoked-confirmed conflict preserves form; lost edit reconciles visibility as well as content')
      const open = async label => { await page.getByRole('button', { name: label, exact: true }).click(); await page.locator('dialog[open]').waitFor() }
      await open('Generar enlace'); assert.equal(await page.getByRole('button', { name: 'Volver', exact: true }).evaluate(e => e === document.activeElement), true)
      await page.keyboard.press('Escape'); assert.equal(await page.getByRole('button', { name: 'Generar enlace', exact: true }).evaluate(e => e === document.activeElement), true)
      await open('Generar enlace'); await page.getByRole('button', { name: 'Confirmar generación', exact: true }).dblclick(); await page.getByRole('heading', { name: 'Guardá tu enlace', exact: true }).waitFor(); assert.equal(state.rotations, 1)
      const tokenInput = page.getByLabel('Enlace de acceso (una sola vez)', { exact: true })
      const value = await tokenInput.inputValue(); assert.match(value, /\/invite#token=[0-9a-f]{64}$/); assert.ok(!page.url().includes('#token'))
      const controls = await page.locator('dialog[open] button').evaluateAll(nodes => nodes.map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })))
      assert.ok(controls.every(e => e.width >= 44 && e.height >= 44))
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('fixture') } } }))
      await page.getByRole('button', { name: 'Copiar enlace', exact: true }).click(); await page.getByText('No pudimos usar el portapapeles.', { exact: false }).waitFor()
      assert.equal(await tokenInput.evaluate(e => e === document.activeElement && e.selectionEnd - e.selectionStart === e.value.length), true)
      for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); assert.equal(await page.locator('dialog[open]').evaluate(e => e.contains(document.activeElement)), true) }
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }))
      await page.getByRole('button', { name: 'Copiar enlace', exact: true }).click(); await page.getByText('Enlace copiado.', { exact: true }).waitFor()
      await shot(page, `one-time-link-masked-${width}`)
      await page.getByRole('button', { name: 'Listo', exact: true }).click(); assert.equal(await tokenInput.count(), 0)
      assert.equal(await page.evaluate(token => [localStorage, sessionStorage].some(storage => Object.values(storage).some(v => String(v).includes(token))), value), false)
      check(width, 'One-time fragment link, copy and manual fallback, keyboard trap/Escape/return, wiped on close, no persisted secret')
      await open('Regenerar enlace'); await page.getByRole('button', { name: 'Volver', exact: true }).click(); assert.equal(state.rotations, 1)
      await open('Regenerar enlace'); state.failure = 'lost'; await page.getByRole('button', { name: 'Confirmar regeneración', exact: true }).click(); await page.getByText('No pudimos recibir el enlace.', { exact: false }).waitFor(); assert.equal(await tokenInput.count(), 0)
      await shot(page, `rotation-error-${width}`); state.failure = ''; await page.getByRole('button', { name: 'Confirmar regeneración', exact: true }).click(); await tokenInput.waitFor(); assert.equal(state.rotations, 3)
      await page.getByRole('button', { name: 'Listo', exact: true }).click()
      check(width, 'Rotation explicit confirmation/cancel, lost response never recovers old token, deliberate regeneration')
      state.event = { ...state.event, ends_at: '2020-01-02T23:00:00', starts_at: '2020-01-01T20:00:00' }
      await page.reload(); await page.getByRole('button', { name: 'Regenerar enlace', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Regenerar enlace', exact: true }).isDisabled(), true)
      await shot(page, `closed-${width}`)
      state.event = { ...seed, visibility: 'unlisted' }; state.statusFailure = true
      await page.reload(); await page.getByRole('button', { name: 'Actualizar enlace', exact: true }).waitFor(); state.statusFailure = false; await page.getByRole('button', { name: 'Actualizar enlace', exact: true }).click(); await page.getByRole('button', { name: 'Regenerar enlace', exact: true }).waitFor()
      const stranger = await fixture(width, height, guest)
      try { await stranger.page.goto(`${origin}/events/${id}`); await stranger.page.getByRole('heading', { name: seed.title, exact: true }).waitFor(); assert.equal(await stranger.page.locator('.event-link-panel').count(), 0) } finally { await stranger.context.close() }
      assert.deepEqual(f.errors, []); check(width, 'Closed state disables generation; status error/retry; organizer controls absent for third party; no JS errors')
      if (width === 390) {
        await open('Regenerar enlace'); state.failure = 'denied'
        await page.getByRole('button', { name: 'Confirmar regeneración', exact: true }).click(); await page.getByText('No tenés permiso para gestionar el enlace.', { exact: false }).waitFor()
        assert.equal(await tokenInput.count(), 0); await page.getByRole('button', { name: 'Volver', exact: true }).click(); state.failure = ''
        await page.setViewportSize({ width: 320, height: 400 }); await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addStyleTag({ content: '.event-link-panel { font-size: 200%; } .event-link-panel p, .event-link-panel button, .event-link-dialog label { font-size: inherit !important; }' })
        await open('Regenerar enlace'); await shot(page, 'stress-320x400-large-text')
        await page.getByRole('button', { name: 'Volver', exact: true }).scrollIntoViewIfNeeded(); await page.getByRole('button', { name: 'Volver', exact: true }).click()
        check(width, 'Permission failure contains no secret; low-height 320x400, enlarged text, reduced motion, dialog scroll and dismiss reachable')
      }
    } finally { await f.context.close() }
  }
  await writeFile(`${out}/results.json`, JSON.stringify({ base: '0428d4f', environment: 'Edge/Playwright; Auth/REST fixtures intercepted, SQL not connected, fake tokens masked; no real JWT', results }, null, 2))
} finally { await browser.close() }
