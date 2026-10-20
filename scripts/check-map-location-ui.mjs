import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] })
const base = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4191'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/map-current-location'
await mkdir(output, { recursive: true })
const results = []
const gps = { latitude: -31.4167, longitude: -64.1833 }
const fallback = { latitude: -27.4514, longitude: -58.9867 }
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
try {
  for (const width of [375, 1280]) {
    for (const mode of ['granted', 'denied', 'timeout', 'unavailable', 'manual-during-gps']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      await context.addInitScript(({ user, gps, mode }) => {
        localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user }))
        window.gpsCalls = 0
        navigator.geolocation.getCurrentPosition = (ok, fail) => {
          window.gpsCalls++
          const reply = () => mode === 'granted' || mode === 'manual-during-gps' ? ok({ coords: gps }) : fail({ code: mode === 'denied' ? 1 : mode === 'timeout' ? 3 : 2 })
          if (mode === 'manual-during-gps') window.finishGps = reply
          else setTimeout(reply, 20)
        }
      }, { user, gps, mode })
      await context.route('https://api.mapbox.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#ece8ff' } }] }) }))
      const queries = []
      await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
        const path = new URL(route.request().url()).pathname
        if (path.endsWith('/search_public_events')) queries.push(route.request().postDataJSON())
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(path === '/auth/v1/user' ? user : []) })
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}/map`)
      const expected = mode === 'granted' ? gps : fallback
      if (mode === 'manual-during-gps') {
        await page.getByRole('button', { name: 'Usar Resistencia, Chaco', exact: true }).click()
        await page.evaluate(() => window.finishGps())
      }
      await page.getByRole('button', { name: 'Mi ubicación', exact: true }).waitFor({ timeout: 10000 }).catch(async error => { console.log(await page.locator('body').innerText()); console.log(errors); throw error })
      await page.waitForFunction(() => !document.querySelector('.map-results')?.getAttribute('aria-busy')?.includes('true'))
      await page.waitForTimeout(600)
      const last = () => queries.at(-1)
      const at = point => {
        assert.ok(last(), 'Map must query its viewport')
        assert.ok(Math.abs((last().p_south + last().p_north) / 2 - point.latitude) < 0.01)
        assert.ok(Math.abs((last().p_west + last().p_east) / 2 - point.longitude) < 0.01)
      }
      at(expected)
      assert.equal(await page.evaluate(() => window.gpsCalls), 1, 'One automatic request, including StrictMode')
      if (mode === 'granted') {
        await page.getByRole('button', { name: 'Usar Resistencia, Chaco', exact: true }).click()
        await page.waitForTimeout(600)
        at(fallback)
        await page.getByRole('button', { name: 'Mi ubicación', exact: true }).click()
        await page.waitForTimeout(600)
        at(gps)
        // Remount with a cached GPS fix; do not request permission again.
        await page.getByRole('link', { name: 'Inicio', exact: true }).first().click()
        await page.getByRole('link', { name: 'Mapa', exact: true }).first().click()
        await page.waitForTimeout(600)
        at(gps)
        assert.equal(await page.evaluate(() => window.gpsCalls), 2)
      }
      if (mode === 'denied') await page.getByText(/No autorizaste el acceso/).waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      assert.deepEqual(errors, [])
      await page.screenshot({ path: `${output}/${mode}-${width}.png`, fullPage: true })
      results.push({ width, mode, result: 'PASS' })
      console.log(`PASS ${mode} ${width}`)
      await context.close()
    }
  }
} finally { await browser.close() }
await writeFile(`${output}/results.json`, JSON.stringify({ fixtures: 'Simulated Auth, RPC, Mapbox style and geolocation; no remote writes', results }, null, 2))
