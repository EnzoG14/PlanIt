import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: process.env.PLANIT_UI_NO_PROXY ? ['--no-proxy-server'] : [] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/own-profile'
await mkdir(output, { recursive: true })
const a = '20000000-0000-4000-8000-000000000001'
const b = '20000000-0000-4000-8000-000000000002'
const fileId = '40000000-0000-4000-8000-000000000001'
const user = id => ({ id, email: id === a ? 'ana@example.invalid' : 'bruno@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = id => ({ access_token: `fixture-${id}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: user(id) })
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const results = []
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
try {
  for (const [name, viewport] of [['mobile', { width: 375, height: 812 }], ['desktop', { width: 1280, height: 900 }]]) {
    const context = await browser.newContext({ viewport })
    await context.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value)) }, { key, value: session(a) })
    let mode = 'success'; let displayName = 'Ana de prueba'; let delay = null; let signed = 0
    const errors = []
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const url = new URL(route.request().url())
      const id = route.request().headers().authorization?.includes(b) ? b : a
      const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (url.pathname === '/auth/v1/user') return reply(user(id))
      if (url.pathname === '/auth/v1/logout') return reply({})
      if (url.pathname === '/rest/v1/profiles') {
        // A request built just before a cross-tab switch can acquire B's token;
        // existing RLS denies the old A filter instead of returning A's data.
        if (url.searchParams.get('id') !== `eq.${id}`) return reply({ message: 'fixture RLS denied stale identity' }, 403)
        assert.equal(url.searchParams.get('select'), 'username,display_name,first_name,last_name,birth_date,sex,bio,visibility,avatar_file_id')
        const response = { first_name: null, last_name: null, birth_date: null, sex: null, visibility: 'public', display_name: id === a ? displayName : 'Bruno de prueba', username: id === a ? 'ana_fixture' : 'bruno_fixture', bio: mode === 'missing' ? null : 'Biografía guardada de prueba.', avatar_file_id: mode === 'missing' || id === b ? null : fileId }
        if (mode === 'delay') await new Promise(resolve => { delay = resolve })
        if (mode === 'error') return reply({ message: 'fixture failure' }, 500)
        return reply(response)
      }
      if (url.pathname === '/rest/v1/files') {
        assert.equal(url.searchParams.get('uploaded_by'), `eq.${id}`)
        return reply({ bucket_name: 'avatars', storage_path: `${a}/avatar.png`, uploaded_by: mode === 'foreign-avatar' ? b : a, mime_type: 'image/png' })
      }
      if (url.pathname.startsWith('/storage/v1/object/sign/')) {
        signed++
        assert.equal(route.request().postDataJSON().expiresIn, 60)
        if (mode === 'denied-avatar') return reply({ message: 'not allowed' }, 403)
        return reply({ signedURL: `/object/sign/avatars/${a}/avatar.png?token=fixture-${mode}` })
      }
      if (url.pathname.startsWith('/storage/v1/object/sign')) return reply({})
      return reply([])
    })
    // Small synthetic image fixture, never copied from the mockup or remote Storage.
    await context.route('**/storage/v1/object/sign/avatars/**?token=fixture-*', route => mode === 'broken-avatar'
      ? route.fulfill({ status: 404 })
      : route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4uoAAAAASUVORK5CYII=', 'base64') }))
    const page = await context.newPage(); page.setDefaultTimeout(10000)
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/me`)
    await page.getByRole('heading', { name: displayName }).waitFor()
    await page.getByAltText('Tu avatar').waitFor()
    assert.equal(await page.getByText('ana@example.invalid', { exact: true }).count(), 1)
    assert.equal(await page.locator('.primary-nav a[aria-current="page"]').textContent(), 'Perfil')
    assert.equal(await page.locator('.profile-account').getByRole('link', { name: 'Mis eventos', exact: true }).getAttribute('href'), '/my-events')
    await page.locator('.profile-account').getByRole('link', { name: 'Mis eventos', exact: true }).click()
    await page.waitForURL('**/my-events')
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Perfil', exact: true }).click()
    await page.getByRole('heading', { name: displayName }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${output}/profile-avatar-${name}.png`, fullPage: true })
    check(`${name}: CA-01/02 navigation, own identity/email/bio/avatar and account link; no horizontal overflow`)
    displayName = 'Ana actualizada'
    await page.getByRole('button', { name: 'Actualizar perfil' }).click()
    await page.getByRole('heading', { name: displayName }).waitFor()
    await page.reload(); await page.getByRole('heading', { name: displayName }).waitFor()
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.getByRole('heading', { name: displayName }).waitFor()
    check(`${name}: CA-03 persisted fixture changes reload, reopen and focus`)
    for (const next of ['missing', 'denied-avatar', 'foreign-avatar', 'broken-avatar']) {
      mode = next
      const signedBefore = signed
      await page.getByRole('button', { name: 'Actualizar perfil' }).click()
      await page.getByRole('img', { name: 'Sin avatar disponible' }).waitFor()
      await page.getByRole('heading', { name: displayName }).waitFor()
      if (next === 'missing') await page.getByText('Todavía no agregaste una biografía.').waitFor()
      if (next === 'foreign-avatar') assert.equal(signed, signedBefore)
    }
    await page.screenshot({ path: `${output}/profile-placeholder-${name}.png`, fullPage: true })
    mode = 'error'; await page.getByRole('button', { name: 'Actualizar perfil' }).click()
    await page.getByRole('heading', { name: 'No se pudo consultar el perfil' }).waitFor()
    assert.equal(await page.locator('.profile-identity,.profile-email').count(), 0)
    await page.screenshot({ path: `${output}/profile-error-${name}.png`, fullPage: true })
    mode = 'success'; await page.getByRole('button', { name: 'Reintentar' }).click()
    await page.getByRole('heading', { name: displayName }).waitFor()
    check(`${name}: CA-04 error clears profile, retry works; absent/inaccessible/foreign/broken avatar falls back`)
    // Simulate Supabase's cross-tab session event while A's profile request is pending.
    mode = 'delay'; await page.getByRole('button', { name: 'Actualizar perfil' }).click()
    await page.getByRole('heading', { name: 'Cargando perfil' }).waitFor()
    await page.waitForTimeout(150)
    assert.ok(delay, 'A profile request must be pending before switching to B')
    mode = 'success'
    await page.evaluate(({ key, value }) => {
      const oldValue = localStorage.getItem(key); const newValue = JSON.stringify(value)
      localStorage.setItem(key, newValue)
      window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
      const channel = new BroadcastChannel(key)
      channel.postMessage({ event: 'SIGNED_IN', session: value })
      channel.close()
    }, { key, value: session(b) })
    await page.getByRole('heading', { name: 'Bruno de prueba' }).waitFor()
    delay?.(); await page.waitForTimeout(200)
    assert.equal(await page.getByText(displayName, { exact: true }).count(), 0)
    assert.equal(await page.getByText('ana@example.invalid', { exact: true }).count(), 0)
    await page.getByText('bruno@example.invalid', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Cuenta', exact: true }).click()
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
    await page.waitForURL('**/login**')
    assert.equal(await page.locator('.profile-identity').count(), 0)
    assert.deepEqual(errors, [])
    check(`${name}: CA-02/04 session B replaces A, ignores late A response, logout protects /me; no browser errors`)
    await context.close()
  }
  await writeFile(`${output}/ui-results.json`, JSON.stringify({ environment: 'Playwright intercepted Auth/REST/Storage fixtures; no remote writes or real accounts', results }, null, 2))
} finally { await browser.close() }
