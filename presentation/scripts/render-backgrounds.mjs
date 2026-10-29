import { chromium } from 'playwright-chromium'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const output = new URL('../public/assets/backgrounds/', import.meta.url)
const css = await readFile(new URL('../styles/background-source.css', import.meta.url), 'utf8')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server', '--force-color-profile=srgb'] })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })
  for (const name of ['cover', 'product', 'architecture']) {
    await page.setContent(`<style>${css}</style><div class="background ${name}"></div>`)
    await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)), omitBackground: false })
  }
  console.log('Rendered 3 opaque sRGB backgrounds at 2560x1440')
} finally { await browser.close() }
