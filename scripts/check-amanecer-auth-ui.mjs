import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/ui-refresh/amanecer-foundation/regression-auth'
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4186'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const results = []
try {
  for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    // Explicitly block remote services: this check never signs up or signs in.
    await context.route('https://**/*', route => route.abort())
    const page = await context.newPage()
    for (const mode of ['login', 'register']) {
      await page.goto(`${origin}/${mode}`)
      await page.locator('.auth-form').waitFor()
      await page.evaluate(() => document.fonts.ready)
      const styles = await page.evaluate(() => {
        const input = getComputedStyle(document.querySelector('#email'))
        const button = getComputedStyle(document.querySelector('.gradient-button'))
        return { amanecer: Boolean(document.querySelector('.amanecer-shell')), family: input.fontFamily, field: input.backgroundColor, color: input.color, primary: button.backgroundImage, overflow: document.documentElement.scrollWidth > innerWidth }
      })
      assert.equal(styles.amanecer, false)
      assert.equal(styles.field, 'rgb(21, 29, 62)')
      assert.equal(styles.color, 'rgb(248, 248, 255)')
      assert.ok(styles.family.startsWith('"Segoe UI"'))
      assert.ok(styles.primary.startsWith('linear-gradient('))
      assert.equal(styles.overflow, false)
      await page.getByLabel('Email', { exact: true }).focus()
      assert.equal(await page.locator('input:focus').evaluate(el => getComputedStyle(el).outlineColor), 'rgb(197, 181, 255)')
      await page.screenshot({ path: `${output}/${mode}-${viewport.width}x${viewport.height}.png`, fullPage: true })
      // DOM-only fixture for the next blocks: never activates a production route.
      await page.evaluate(() => document.querySelector('.app-shell').classList.add('amanecer-shell'))
      await page.evaluate(() => document.fonts.ready)
      await page.getByLabel('Email', { exact: true }).focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      const prepared = await page.evaluate(() => {
        const input = getComputedStyle(document.querySelector('#email'))
        const button = getComputedStyle(document.querySelector('.gradient-button'))
        const title = getComputedStyle(document.querySelector('.screen-header h1'))
        return { field: input.backgroundColor, border: input.borderColor, borderWidth: input.borderTopWidth, focus: input.outlineColor, primary: button.backgroundColor, titleSize: title.fontSize, family: input.fontFamily }
      })
      assert.equal(prepared.field, 'rgb(255, 255, 255)')
      assert.equal(prepared.border, 'rgb(122, 130, 168)')
      // Chromium snaps a 1.5px border to 1 device pixel at DPR 1.
      assert.equal(prepared.borderWidth, '1px')
      assert.equal(prepared.focus, 'rgb(91, 52, 214)')
      assert.equal(prepared.primary, 'rgb(6, 11, 39)')
      assert.equal(prepared.titleSize, '32px')
      assert.ok(prepared.family.includes('Bricolage Grotesque'))
      await page.evaluate(() => document.querySelector('.app-shell').classList.remove('amanecer-shell'))
      results.push({ mode, viewport, result: 'PASS', ...styles, preparedFixture: prepared })
    }
    await context.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ environment: 'Edge; no session; external requests blocked; no Auth writes', results }, null, 2) + '\n')
  console.log('PASS: login/register preserve legacy field, text, font, gradient, focus and layout at 320/390/1280')
} finally { await browser.close() }
