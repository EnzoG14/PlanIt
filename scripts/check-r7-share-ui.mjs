import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH || 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const out = 'docs/qa/r7-block-8/visual'
await mkdir(out, { recursive: true })
const server = await createServer({ configFile: false, plugins: [react()], server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error' })
await server.listen()
const local = 'http://127.0.0.1:' + server.httpServer.address().port
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = 'https://planit.example.org', results = [], errors = []
const check = (width, test) => { results.push({ width, test, result: 'PASS' }); console.log('PASS ' + width + ': ' + test) }
try {
  for (const width of [320, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce', serviceWorkers: 'block' })
    // Synthetic HTTPS origin routed to a local Vite fixture. This is NOT a deployed HTTPS/native chooser test.
    await context.route(origin + '/**', async route => {
      const url = new URL(route.request().url())
      const response = await route.fetch({ url: local + url.pathname + url.search })
      await route.fulfill({ response })
    })
    await context.addInitScript(() => {
      window.mock = { mode: 'success', clipboard: 'success', shareCalls: [], copies: [] }
      Object.defineProperty(navigator, 'share', { configurable: true, value: data => {
        window.mock.shareCalls.push(data)
        if (window.mock.mode === 'pending') return new Promise(resolve => { window.finishShare = resolve })
        return window.mock.mode === 'success' ? Promise.resolve() : Promise.reject({ name: window.mock.mode === 'cancel' ? 'AbortError' : 'NotAllowedError' })
      } })
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
        if (window.mock.clipboard === 'denied') throw new Error('denied')
        window.mock.copies.push(text)
      } } })
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin + '/scripts/fixtures/r7-share.html')
    const share = page.getByRole('button', { name: 'Compartir', exact: true })
    await share.waitFor()
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).color), 'rgb(6, 11, 39)')
    assert.ok((await share.boundingBox()).height >= 44)
    await share.focus()
    assert.notEqual(await share.evaluate(el => getComputedStyle(el).outlineStyle), 'none')
    await page.keyboard.press('Enter')
    await page.getByRole('status').filter({ hasText: 'La opción de compartir finalizó' }).waitFor()
    assert.equal(await page.evaluate(() => window.mock.shareCalls.length), 1)
    assert.deepEqual(await page.evaluate(() => Object.keys(window.mock.shareCalls[0]).sort()), ['text', 'title', 'url'])
    await page.screenshot({ path: out + '/share-' + width + '.png', fullPage: true })
    check(width, 'Native API mock, keyboard activation, minimal payload, 44px target and focus')
    const initialUrl = page.url()
    await page.evaluate(() => { window.mock.mode = 'cancel' })
    await share.click()
    await page.waitForFunction(() => !document.querySelector('.event-share-action button').disabled)
    assert.equal(await page.getByRole('status').count(), 0)
    assert.equal(page.url(), initialUrl)
    check(width, 'AbortError neutral; previous success cleared; route unchanged')
    await page.evaluate(() => { window.mock.mode = 'error'; window.mock.clipboard = 'denied' })
    await share.click()
    await page.getByRole('alert').waitFor()
    await page.getByRole('button', { name: 'Copiar enlace', exact: true }).click()
    const input = page.getByLabel('Enlace para copiar')
    await input.waitFor()
    const labelBox = await page.locator('.event-share-action label').boundingBox()
    assert.ok((await input.boundingBox()).y >= labelBox.y + labelBox.height + 7)
    assert.equal(await input.evaluate(el => document.activeElement === el && el.selectionEnd === el.value.length), true)
    assert.equal(await input.inputValue(), origin + '/events/30000000-0000-4000-8000-000000000001')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: out + '/manual-' + width + '.png', fullPage: true })
    check(width, 'Native rejection, explicit copy action, denied clipboard, selected manual fallback without overflow')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      window.mock.clipboard = 'success'
      window.r7Share.render({ event: { ...window.r7Share.event, title: 'Encuentro actualizado' } })
    })
    const copy = page.getByRole('button', { name: 'Copiar enlace', exact: true })
    await copy.click()
    await page.getByRole('status').filter({ hasText: 'Enlace copiado.' }).waitFor()
    assert.equal(await page.evaluate(() => window.mock.copies.length), 1)
    check(width, 'No Web Share uses clipboard and accurately reports copy')
    await page.evaluate(() => window.r7Share.render({ event: { ...window.r7Share.event, visibility: 'unlisted' }, canManageInvite: false, inviteUrl: location.origin + '/invite#token=' + 'a'.repeat(64) }))
    await page.getByText('Sólo el organizador puede compartir la invitación de este evento oculto.').waitFor()
    assert.equal(await copy.isDisabled(), true)
    await page.evaluate(() => window.r7Share.render({ canManageInvite: true }))
    assert.equal(await copy.isEnabled(), true)
    await page.evaluate(() => window.r7Share.render({ inviteUrl: undefined }))
    await page.getByText(/Necesitás el enlace de invitación/).waitFor()
    assert.equal(await copy.isDisabled(), true)
    assert.equal(await page.getByRole('status').count(), 0)
    check(width, 'Grant-only denied despite token input; owner with ephemeral invite enabled; losing token clears state')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: data => {
        window.mock.shareCalls.push(data)
        return new Promise(resolve => { window.finishShare = resolve })
      } })
      window.r7Share.render({ event: window.r7Share.event, canManageInvite: false })
    })
    await share.waitFor()
    const count = await page.evaluate(() => window.mock.shareCalls.length)
    await page.evaluate(() => { const button = document.querySelector('.event-share-action button'); button.click(); button.click() })
    assert.equal(await page.evaluate(() => window.mock.shareCalls.length), count + 1)
    await page.evaluate(() => window.r7Share.render({ event: { ...window.r7Share.event, id: '30000000-0000-4000-8000-000000000002' } }))
    await page.evaluate(() => window.finishShare())
    assert.equal(await page.getByRole('status').count(), 0)
    assert.equal(await share.isEnabled(), true)
    check(width, 'Duplicate gesture guarded; old async response discarded on event change')
    if (width === 390) {
      await page.evaluate(() => { document.body.style.zoom = '2' })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      await page.screenshot({ path: out + '/zoom-200.png', fullPage: true })
      check(width, '200% CSS zoom without horizontal overflow')
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  await writeFile('docs/qa/r7-block-8/ui-results.json', JSON.stringify({ environment: 'Headless Edge; local isolated fixture under synthetic HTTPS origin; Share and Clipboard mocks; no native chooser, real TLS deployment, HTTP/JWT or device test', browser: browser.version(), results, errors }, null, 2) + '\n')
} finally { await browser.close(); await server.close() }
