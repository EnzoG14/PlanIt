import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const before = process.argv.includes('--before')
const output = process.env.PLANIT_UI_OUTPUT ?? `docs/design/verification/ui-refresh/auth/${before ? 'before' : 'after'}`
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4186'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: process.env.PLANIT_UI_NO_PROXY ? ['--no-proxy-server'] : [] })
const results = [], unexpected = [], pageErrors = []
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'auth@fixture.example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, identities: [{ id: 'fixture' }], created_at: '2026-10-12T12:00:00Z' }
try {
  for (const [width, height] of [[320,800], [360,800], [375,812], [390,844], [768,1024], [1280,900]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', serviceWorkers: 'block' })
    let outcome = 'error', release
    const calls = []
    // All non-local requests are intercepted. Remote routes never call continue/fetch.
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin === origin) return route.continue()
      const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (url.hostname === 'iepeqmvzjguwlhnecsdq.supabase.co' && ['/auth/v1/signup', '/auth/v1/token'].includes(url.pathname)) {
        calls.push({ path: url.pathname, redirect: url.searchParams.get('redirect_to'), body: request.postDataJSON() })
        await new Promise(resolve => { release = resolve })
        if (outcome === 'confirmation') return reply({ user, session: null })
        if (outcome === 'duplicate') return reply({ user: { ...user, identities: [] }, session: null })
        return reply({ code: 'invalid_credentials', message: 'Fixture authentication failure' }, 400)
      }
      unexpected.push(url.pathname)
      return route.abort()
    })
    const page = await context.newPage()
    page.on('pageerror', error => pageErrors.push(error.message))
    const shot = name => page.screenshot({ path: `${output}/${name}-${width}x${height}.png`, fullPage: true })
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const waitForFixture = async () => {
      const deadline = Date.now() + 10000
      while (!release && Date.now() < deadline) await page.waitForTimeout(20)
      assert.ok(release, 'Expected intercepted Auth fixture request within 10 seconds')
    }
    const finishRequest = async () => { await page.waitForFunction(() => document.querySelector('form')?.getAttribute('aria-busy') === 'true'); await waitForFixture(); release(); release = undefined }
    for (const mode of ['login', 'register']) {
      await page.goto(`${origin}/${mode}?next=%2Fmy-events`)
      await page.locator('.auth-form').waitFor()
      await page.evaluate(() => document.fonts.ready)
      await shot(`${mode}-initial`)
      await noOverflow()
      if (before) continue
      const styles = await page.evaluate(() => {
        const field = getComputedStyle(document.querySelector('#email')), button = getComputedStyle(document.querySelector('.gradient-button')), shell = getComputedStyle(document.querySelector('.app-shell'))
        return { amanecer: !!document.querySelector('.auth-shell.amanecer-shell'), background: shell.backgroundColor, backgroundImage: shell.backgroundImage, family: field.fontFamily, field: field.backgroundColor, color: field.color, border: field.borderColor, primary: button.backgroundColor, primaryImage: button.backgroundImage, fontLoaded: [...document.fonts].some(font => font.family.includes('Bricolage') && font.status === 'loaded') }
      })
      for (const [key, value] of Object.entries({ amanecer: true, background: 'rgb(246, 245, 253)', backgroundImage: 'none', field: 'rgb(255, 255, 255)', color: 'rgb(6, 11, 39)', border: 'rgb(122, 130, 168)', primary: 'rgb(6, 11, 39)', primaryImage: 'none', fontLoaded: true })) assert.equal(styles[key], value, key)
      assert.ok(styles.family.includes('Bricolage Grotesque'))
      assert.equal(await page.locator('.auth-wash[aria-hidden="true"]').count(), 1)
      assert.equal(await page.locator('.primary-nav').count(), 0)
      assert.equal(await page.locator('.screen-emblem').isVisible(), false)
      await page.locator('#main-content').focus()
      const order = mode === 'register' ? ['display-name', 'email', 'password'] : ['email', 'password']
      for (const id of order) { await page.keyboard.press('Tab'); assert.equal(await page.locator(`#${id}`).evaluate(el => el === document.activeElement), true) }
      await page.keyboard.press('Tab')
      assert.equal(await page.getByRole('button', { name: 'Mostrar contraseña' }).evaluate(el => el === document.activeElement), true)
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('[type="submit"]').evaluate(el => el === document.activeElement), true)
      await page.keyboard.press('Enter')
      assert.equal(await page.locator(`#${order[0]}`).evaluate(el => el === document.activeElement), true)
      for (const id of order) {
        assert.equal(await page.locator(`#${id}`).getAttribute('aria-invalid'), 'true')
        assert.equal(await page.locator(`#${id}`).getAttribute('aria-describedby'), `${id}-error`)
      }
      await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab')
      // Allow the shared reduced-motion transition to settle before measuring color.
      await page.waitForFunction(id => getComputedStyle(document.getElementById(id)).outlineColor === 'rgb(91, 52, 214)', order[0])
      const focused = await page.locator(`#${order[0]}`).evaluate(el => ({ active: el === document.activeElement, visible: el.matches(':focus-visible'), outline: getComputedStyle(el).outlineColor, width: getComputedStyle(el).outlineWidth }))
      assert.deepEqual(focused, { active: true, visible: true, outline: 'rgb(91, 52, 214)', width: '3px' })
      await shot(`${mode}-validation`); await noOverflow()
      if (mode === 'register') {
        await page.getByLabel('Nombre visible').fill('A')
        await page.getByLabel('Email', { exact: true }).fill('invalid')
        await page.getByLabel('Contraseña', { exact: true }).fill('123')
        await page.locator('[type="submit"]').click()
        assert.ok((await page.locator('#password-error').textContent()).includes('6 caracteres'))
        await shot(`${mode}-invalid-values`)
        await page.getByLabel('Nombre visible').fill('Ana Fixture')
        assert.equal(await page.locator('#password-hint').isVisible(), true)
      }
      await page.getByLabel('Email', { exact: true }).fill('auth@fixture.example.invalid')
      await page.getByLabel('Contraseña', { exact: true }).fill('Fixture-password-123')
      await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
      assert.equal(await page.locator('#password').getAttribute('type'), 'text')
      assert.equal(await page.getByRole('button', { name: 'Ocultar contraseña' }).getAttribute('aria-pressed'), 'true')
      await shot(`${mode}-password-visible`)
      await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
      assert.equal(await page.locator('#password').getAttribute('type'), 'password')
      await shot(`${mode}-password-hidden`)
      for (const selector of ['[type="submit"]', '.password-toggle', '.auth-switch a', '.auth-topbar .brand', '.auth-topbar .icon-link']) {
        const box = await page.locator(selector).boundingBox(); assert.ok(box.width >= 44 && box.height >= 44, selector)
      }
      const previous = calls.length
      await page.locator('[type="submit"]').click()
      await page.waitForFunction(() => document.querySelector('form')?.getAttribute('aria-busy') === 'true')
      await waitForFixture()
      for (const selector of ['[type="submit"]', '#email', '.password-toggle']) assert.equal(await page.locator(selector).isDisabled(), true)
      await page.locator('.auth-form').evaluate(form => { form.requestSubmit(); form.requestSubmit() })
      assert.equal(calls.length, previous + 1)
      assert.equal(calls.at(-1).body.email, 'auth@fixture.example.invalid')
      if (mode === 'register') { assert.equal(calls.at(-1).body.data.display_name, 'Ana Fixture'); assert.equal(calls.at(-1).redirect, `${origin}/map`) }
      await shot(`${mode}-sending`)
      release(); release = undefined
      await page.getByRole('alert').waitFor()
      assert.equal(await page.locator('.auth-feedback').evaluate(el => el === document.activeElement), true)
      assert.equal(await page.locator('#password').inputValue(), 'Fixture-password-123')
      await shot(`${mode}-auth-error`); await noOverflow()
      assert.equal(await page.locator('.auth-switch a').getAttribute('href'), `/${mode === 'login' ? 'register' : 'login'}?next=%2Fmy-events`)
      if (mode === 'register') {
        outcome = 'duplicate'
        await page.locator('[type="submit"]').click(); await finishRequest()
        await page.getByText('No se pudo crear la cuenta. Si ya te registraste, ingresá con tus credenciales.', { exact: true }).waitFor()
        await shot(`${mode}-duplicate`)
        outcome = 'confirmation'
        await page.locator('[type="submit"]').click(); await finishRequest()
        await page.getByRole('heading', { name: 'Revisá tu correo' }).waitFor()
        assert.equal(await page.locator('.auth-feedback').evaluate(el => el === document.activeElement), true)
        await shot(`${mode}-confirmation`); await noOverflow()
        outcome = 'error'
      }
      // Text-only 200% fixture; read all computed sizes before changing any of them.
      await page.goto(`${origin}/${mode}`); await page.locator('.auth-form').waitFor()
      await page.evaluate(() => {
        const elements = [...document.querySelectorAll('.auth-topbar a, h1, .screen-header p, label, input, .auth-field-hint, .gradient-button, .auth-switch, .auth-switch a')]
        const sizes = elements.map(el => parseFloat(getComputedStyle(el).fontSize))
        elements.forEach((el, i) => { el.style.fontSize = `${sizes[i] * 2}px` })
      })
      await noOverflow(); await shot(`${mode}-text-200`)
      await page.setViewportSize({ width, height: 240 })
      await noOverflow(); await page.locator('.auth-switch a').scrollIntoViewIfNeeded(); await shot(`${mode}-short-text-200`)
      const switchBox = await page.locator('.auth-switch a').boundingBox()
      assert.ok(switchBox.y >= 0 && switchBox.y + switchBox.height <= 240)
      await page.setViewportSize({ width, height })
      results.push({ mode, width, height, result: 'PASS', styles })
    }
    if (!before) {
      for (const mode of ['login', 'register']) {
        let sessionRelease
        const loadingContext = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' })
        await loadingContext.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-session', refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), user)
        await loadingContext.route('**/*', async route => {
          const url = new URL(route.request().url())
          if (url.origin === origin) return route.continue()
          if (url.pathname === '/auth/v1/user') { await new Promise(resolve => { sessionRelease = resolve }); return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'fixture_session_failure', message: 'Fixture session rejected' }) }) }
          return route.abort()
        })
        const loadingPage = await loadingContext.newPage()
        await loadingPage.goto(`${origin}/${mode}`)
        await loadingPage.getByRole('heading', { name: 'Comprobando sesión' }).waitFor()
        await loadingPage.screenshot({ path: `${output}/${mode}-session-loading-${width}x${height}.png`, fullPage: true })
        sessionRelease?.()
        await loadingPage.getByRole('heading', { name: 'No se pudo recuperar la sesión' }).waitFor()
        await loadingPage.getByRole('button', { name: 'Reintentar' }).waitFor()
        await loadingPage.screenshot({ path: `${output}/${mode}-session-error-${width}x${height}.png`, fullPage: true })
        await loadingContext.close()
      }
      // Reduced transparency is exercised with Chromium's media emulation, not a DOM class.
      await page.goto(`${origin}/register`); await page.locator('.auth-form').waitFor()
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }, { name: 'prefers-reduced-motion', value: 'reduce' }] })
      assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches), true)
      assert.equal(await page.locator('.app-shell').evaluate(el => getComputedStyle(el).getPropertyValue('--pi-glass-blur').trim()), 'none')
      assert.equal(await page.locator('.app-shell').evaluate(el => getComputedStyle(el).getPropertyValue('--pi-color-surface-glass').trim()), 'rgba(255, 255, 255, .96)')
      assert.equal(await page.locator('.auth-wash').evaluate(el => getComputedStyle(el).animationName), 'none')
      await shot('register-reduced-transparency')
      await cdp.detach()
      const fallback = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' })
      await fallback.route('**/*', route => new URL(route.request().url()).origin === origin && !route.request().url().includes('.woff2') ? route.continue() : route.abort())
      const fallbackPage = await fallback.newPage()
      for (const mode of ['login', 'register']) {
        await fallbackPage.goto(`${origin}/${mode}`); await fallbackPage.locator('.auth-form').waitFor(); await fallbackPage.evaluate(() => document.fonts.ready)
        assert.equal(await fallbackPage.evaluate(() => [...document.fonts].some(font => font.family.includes('Bricolage') && font.status === 'loaded')), false)
        assert.equal(await fallbackPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
        await fallbackPage.screenshot({ path: `${output}/${mode}-font-fallback-${width}x${height}.png`, fullPage: true })
      }
      await fallback.close()
      await page.goto(`${origin}/auth-isolation-fixture`)
      await page.locator('.status-message').waitFor()
      assert.equal(await page.locator('.amanecer-shell').count(), 0)
      assert.equal(await page.locator('.app-shell').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(6, 11, 39)')
    }
    await context.close()
  }
  assert.deepEqual(unexpected, []); assert.deepEqual(pageErrors, [])
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Edge; local app; intercepted Auth fixtures; remote traffic blocked; no Supabase writes', phase: before ? 'before' : 'after', results, unexpected, pageErrors }, null, 2) + '\n')
  console.log(`PASS: ${before ? 'baseline captures' : 'Amanecer Auth styles, accessibility, state fixtures, responsive and isolation'} at six viewports; no remote requests`)
} finally { await browser.close() }
