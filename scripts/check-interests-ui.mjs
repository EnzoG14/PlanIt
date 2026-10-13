import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-3/ui'
await mkdir(output, { recursive: true })
const a = '20000000-0000-4000-8000-000000000001', b = '20000000-0000-4000-8000-000000000002'
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const user = id => ({ id, email: `${id === a ? 'ana' : 'bruno'}@example.invalid`, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = id => ({ access_token: `fixture-${id}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: user(id) })
const cat = (n, name, is_active = true) => ({ id: `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`, name, is_active })
const initialCats = [cat(1, 'Música'), cat(2, 'Deportes'), cat(3, 'Arte'), cat(4, 'Encuentros'), cat(5, 'Categoría anterior', false)]
const results = [], geometry = []
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function identity(page, id, refreshed = false) {
  await page.evaluate(({ key, value }) => {
    const oldValue = localStorage.getItem(key), newValue = JSON.stringify(value)
    localStorage.setItem(key, newValue)
    window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
    const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close()
  }, { key, value: { ...session(id), access_token: `fixture-${id}${refreshed ? '-refreshed' : ''}` } })
}
try {
  for (const width of [320, 360, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width >= 768 ? 900 : 812 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
    await context.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value)) }, { key, value: session(a) })
    await context.routeWebSocket('**/realtime/v1/websocket**', socket => socket.close())
    let categories = structuredClone(initialCats), mode = 'ok', mutations = 0, lateRead, releaseSave
    const saved = new Map([[a, [categories[0].id, categories[4].id]], [b, [categories[1].id]]])
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const req = route.request(), url = new URL(req.url()), id = req.headers().authorization?.includes(b) ? b : a
      const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (url.pathname === '/auth/v1/user') return json(user(id))
      if (url.pathname === '/auth/v1/logout') return json({})
      if (url.pathname === '/rest/v1/categories') return json(mode === 'empty' ? [] : categories.filter(c => c.is_active))
      if (url.pathname === '/rest/v1/profiles') return json({ display_name: id === a ? 'Ana de prueba' : 'Bruno de prueba', username: 'prueba', bio: null, avatar_file_id: null })
      if (url.pathname === '/rest/v1/user_category_interests') {
        assert.equal(url.searchParams.get('user_id'), `eq.${id}`)
        if (mode === 'read-error' || mode === 'reconcile-error') return json({ code: 'fixture', message: 'read failure' }, 503)
        const rows = (saved.get(id) ?? []).map(cid => ({ category: categories.find(c => c.id === cid) }))
        if (mode === 'late-read' && id === a) { await new Promise(resolve => { lateRead = resolve }) }
        return json(rows)
      }
      if (url.pathname === '/rest/v1/rpc/set_my_category_interests') {
        mutations++
        const body = req.postDataJSON(); assert.deepEqual(Object.keys(body), ['p_category_ids'])
        if (mode === 'save-error') return json({ code: '22023', message: 'interests_category_unavailable' }, 400)
        if (mode === 'slow-save') await new Promise(resolve => { releaseSave = resolve })
        if (mode === 'unknown-uncommitted') return route.abort('failed')
        saved.set(id, body.p_category_ids)
        if (mode === 'unknown-committed') return route.abort('failed')
        if (mode === 'ack-read-error') mode = 'reconcile-error'
        return json(body.p_category_ids.map(category_id => ({ category_id })))
      }
      if (url.pathname.includes('/rpc/get_notification')) return json([])
      if (url.pathname.includes('/rpc/')) return json([])
      return json([])
    })
    const page = await context.newPage(), errors = []; page.setDefaultTimeout(12000)
    page.on('pageerror', error => errors.push(error.message))
    page.on('dialog', dialog => dialog.accept())
    const music = () => page.getByRole('button', { name: 'Música', exact: true })
    const sports = () => page.getByRole('button', { name: 'Deportes', exact: true })
    const save = () => page.getByRole('button', { name: 'Guardar intereses', exact: true })
    const ready = async () => { await music().waitFor(); await page.getByText('La selección coincide con tus preferencias guardadas.').waitFor() }
    await page.goto(`${origin}/me`); await page.getByRole('link', { name: 'Mis intereses', exact: true }).click(); await ready()
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1' && document.activeElement.textContent === 'Mis intereses')
    assert.equal(await music().getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('.social-wash').count(), 1)
    assert.equal(await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link').count(), 4)
    assert.equal(await page.getByRole('link', { name: 'Perfil', exact: true }).getAttribute('aria-current'), 'page')
    await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: `${output}/${width}-interests.png`, fullPage: true })
    const measurements = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, font: getComputedStyle(document.querySelector('h1')).fontFamily,
      options: [...document.querySelectorAll('.interests-grid button')].map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })) }))
    assert.ok(measurements.scrollWidth <= width); assert.ok(measurements.options.every(el => el.width >= 44 && el.height >= 44)); geometry.push(measurements)
    check(`${width}: CA-01 active categories and retained inactive; explicit Amanecer shell, 4 dock links, own preferences, targets and no overflow`)
    await sports().click(); assert.equal(await save().isEnabled(), true)
    await page.getByRole('link', { name: 'Volver a mi perfil' }).click()
    await page.getByRole('dialog').waitFor(); assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Seguir editando')
    await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await sports().getAttribute('aria-pressed'), 'true')
    await page.getByRole('link', { name: 'Volver a mi perfil' }).click(); await page.getByRole('button', { name: 'Descartar cambios' }).click()
    await page.getByRole('link', { name: 'Mis intereses', exact: true }).waitFor()
    assert.ok(await page.getByRole('link', { name: 'Mis intereses', exact: true }).evaluate(el => el === document.activeElement))
    await page.getByRole('link', { name: 'Mis intereses', exact: true }).click(); await ready()
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1' && document.activeElement.textContent === 'Mis intereses')
    assert.equal(await sports().getAttribute('aria-pressed'), 'false')
    await sports().click(); await page.goBack(); await page.getByRole('dialog').waitFor()
    await page.getByRole('button', { name: 'Seguir editando' }).click(); assert.ok(page.url().endsWith('/me/interests'))
    await page.getByRole('link', { name: 'Inicio', exact: true }).click(); await page.getByRole('dialog').waitFor(); await page.getByRole('button', { name: 'Seguir editando' }).click()
    check(`${width}: dirty navigation via back link, browser Back and dock; cancel/Escape preserves edits, discard restores profile focus`)
    mode = 'slow-save'; const before = mutations
    await save().click(); await page.getByRole('button', { name: 'Guardando…' }).waitFor()
    assert.equal(await music().isDisabled(), true); assert.equal(mutations, before + 1)
    assert.equal(await page.getByText('Tus intereses quedaron guardados.').count(), 0)
    releaseSave(); mode = 'ok'; await page.getByText('Tus intereses quedaron guardados.').waitFor()
    await page.reload(); await ready(); assert.equal(await sports().getAttribute('aria-pressed'), 'true')
    check(`${width}: CA-02 save ACK plus read reconciliation; busy locks editing/double send, reload recovers selection`)
    mode = 'save-error'; await music().click(); const previous = [...saved.get(a)]
    await save().click(); await page.getByRole('alert').waitFor(); assert.deepEqual(saved.get(a), previous)
    assert.equal(await music().getAttribute('aria-pressed'), 'false'); assert.equal(await page.getByText('Tus intereses quedaron guardados.').count(), 0)
    await page.screenshot({ path: `${output}/${width}-save-error.png`, fullPage: true })
    mode = 'ok'; await save().click(); await page.getByText('Tus intereses quedaron guardados.').waitFor()
    check(`${width}: CA-04 rejected save shows error, preserves draft and retries without false confirmation`)
    mode = 'unknown-committed'; await music().click(); await save().click(); await page.getByRole('button', { name: 'Comprobar guardado' }).waitFor()
    assert.equal(await music().isDisabled(), true); const sent = mutations; mode = 'ok'
    await page.getByRole('button', { name: 'Comprobar guardado' }).click(); await page.getByText('Tus intereses quedaron guardados.').waitFor(); assert.equal(mutations, sent)
    mode = 'unknown-uncommitted'; await music().click(); await save().click(); await page.getByRole('button', { name: 'Comprobar guardado' }).waitFor(); mode = 'ok'
    await page.getByRole('button', { name: 'Comprobar guardado' }).click(); await page.getByText('La selección no figura guardada.', { exact: false }).waitFor(); assert.ok(await save().isEnabled())
    mode = 'ack-read-error'; await save().click(); await page.getByRole('button', { name: 'Comprobar guardado' }).waitFor()
    assert.equal(await page.getByText('Tus intereses quedaron guardados.').count(), 0); mode = 'ok'
    await page.getByRole('button', { name: 'Comprobar guardado' }).click(); await page.getByText('Tus intereses quedaron guardados.').waitFor()
    check(`${width}: CA-04 uncertain committed/uncommitted response and failed reconciliation checked by read before resending`)
    // A deactivated unsaved choice is pruned only after an explicit catalog refresh.
    await page.getByRole('button', { name: 'Arte', exact: true }).click(); categories[2].is_active = false
    mode = 'save-error'; await save().click(); await page.getByRole('alert').waitFor(); mode = 'ok'
    await page.getByRole('button', { name: 'Actualizar categorías' }).click(); await page.getByText('La selección coincide con tus preferencias guardadas.').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Arte', exact: true }).count(), 0)
    check(`${width}: inactive unsaved category cannot be retained invisibly after catalog refresh`)
    // Empty selection and catalog.
    while (await page.locator('.interests-grid button[aria-pressed="true"]').count()) await page.locator('.interests-grid button[aria-pressed="true"]').first().click()
    await save().click(); await page.getByText('Tus intereses quedaron guardados.').waitFor(); assert.deepEqual(saved.get(a), [])
    mode = 'empty'; await page.reload(); await page.getByText('No hay categorías disponibles', { exact: true }).waitFor()
    await page.screenshot({ path: `${output}/${width}-empty.png`, fullPage: true })
    mode = 'read-error'; await page.reload(); await page.getByRole('alert').waitFor(); await page.getByRole('button', { name: 'Reintentar', exact: true }).waitFor()
    mode = 'ok'; await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await ready()
    check(`${width}: zero categories selection persists; empty catalog and initial read failure/retry`)
    // Token refresh keeps edits; identity change removes them, including late responses.
    await sports().click(); await identity(page, a, true); assert.equal(await sports().getAttribute('aria-pressed'), 'true')
    mode = 'late-read'; await page.getByRole('button', { name: 'Actualizar categorías' }).click()
    await page.getByText('Cargando intereses', { exact: true }).waitFor(); await identity(page, b); mode = 'ok'; lateRead?.()
    await ready(); assert.equal(await sports().getAttribute('aria-pressed'), 'true'); assert.equal(await music().getAttribute('aria-pressed'), 'false')
    assert.deepEqual(saved.get(a), [])
    await page.screenshot({ path: `${output}/${width}-account-b.png`, fullPage: true })
    mode = 'slow-save'; releaseSave = null
    await music().click(); await save().click(); await page.getByRole('button', { name: 'Guardando…' }).waitFor()
    for (let i = 0; !releaseSave && i < 50; i++) await page.waitForTimeout(20)
    assert.ok(releaseSave)
    await identity(page, a); mode = 'ok'; await ready(); releaseSave()
    assert.equal(await music().getAttribute('aria-pressed'), 'false'); assert.equal(await sports().getAttribute('aria-pressed'), 'false')
    assert.equal(await page.getByText('Tus intereses quedaron guardados.').count(), 0)
    check(`${width}: switching identity during a pending write aborts/ignores its response; A does not inherit B edits or confirmation`)
    // Text and short-height dialog stress, plus focus and reduced transparency.
    await page.addStyleTag({ content: '.interests-page { font-size: 200% } .interests-page button { font-size: 28px }' })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.setViewportSize({ width, height: 320 }); await music().click(); await page.getByRole('link', { name: 'Volver a mi perfil' }).click(); await page.getByRole('dialog').waitFor()
    await page.screenshot({ path: `${output}/${width}-leave-short.png`, fullPage: true }); await page.keyboard.press('Escape')
    const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }, { name: 'prefers-reduced-motion', value: 'reduce' }] })
    await page.getByRole('button', { name: 'Cuenta', exact: true }).click(); await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); await page.waitForURL('**/login**')
    assert.equal(await page.locator('.interests-grid').count(), 0); assert.deepEqual(errors, [])
    check(`${width}: CA-03 isolated A/B and stale read cleanup; refresh preserves edits; logout clears private state; enlarged text and short dialog`)
    await context.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Edge with intercepted Auth/REST and blocked WebSocket; fixtures, no real JWT or remote writes', results, geometry }, null, 2))
} finally { await browser.close() }
