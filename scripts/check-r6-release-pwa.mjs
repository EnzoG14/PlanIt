import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const out = 'docs/qa/r6-block-9/pwa', root = resolve('dist')
await mkdir(out, { recursive:true })
const mime = { '.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png', '.webmanifest':'application/manifest+json' }
const server = createServer(async (req,res) => {
  const file = resolve(root, `.${new URL(req.url,'http://localhost').pathname}`)
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return }
  try { res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream'); res.end(await readFile(file)) }
  catch { res.setHeader('Content-Type','text/html'); res.end(await readFile(resolve(root,'index.html'))) }
})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser = await chromium.launch({headless:true,channel:'msedge'})
let result = 'PASS', failure, data
try {
  const context = await browser.newContext({ viewport:{width:390,height:844} })
  // No user session and no real backend access. Test browser SW/offline shell only.
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  const page = await context.newPage(), origin = `http://127.0.0.1:${server.address().port}`
  await page.goto(origin+'/login'); await page.locator('form').waitFor()
  await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_,reject)=>setTimeout(()=>reject(new Error('SW readiness timeout')),20000))]).then(()=>true))
  await page.reload(); await page.locator('form').waitFor()
  assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),true)
  data = await page.evaluate(async()=>({ controller:!!navigator.serviceWorker.controller, caches:await Promise.all((await caches.keys()).map(async name=>({name,urls:(await (await caches.open(name)).keys()).map(r=>r.url)}))) }))
  assert.ok(data.caches.length > 0)
  assert.ok(data.caches.every(c=>c.urls.every(url=>!url.includes('supabase.co'))))
  await context.setOffline(true); await page.reload(); await page.locator('form').waitFor({timeout:10000})
  assert.ok(await page.locator('input[type="email"]').isVisible())
  await page.screenshot({path:out+'/offline-shell-390.png',fullPage:true})
  data.offline_shell = 'PASS'
  await context.close()
} catch(e) { result='FAIL'; failure=e.message; process.exitCode=1 }
finally {
  await browser.close(); server.closeAllConnections(); await new Promise(done=>server.close(done))
  await writeFile(out+'/results.json',JSON.stringify({result,failure,...data,environment:'Actual Edge service worker/CacheStorage/offline reload on localhost; anonymous shell only. Installed device, private session offline and upgrade lifecycle NOT RUN.'},null,2)+'\n')
}
console.log(`${result}: browser service worker/offline shell`)
