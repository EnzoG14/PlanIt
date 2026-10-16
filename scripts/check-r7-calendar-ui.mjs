import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const runtime = process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
const { chromium } = await import(pathToFileURL(runtime).href)
const out = 'docs/qa/r7-block-7/ui', harness = '.r7-calendar.local'
await mkdir(harness, { recursive: true }); await mkdir(out, { recursive: true })
await writeFile(`${harness}/index.html`, '<!doctype html><html lang="es-AR"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>PlanIt · QA calendario B7</title></head><body><div id="root"></div><script type="module" src="/.' + 'r7-calendar.local/harness.tsx"></script></body></html>')
await writeFile(`${harness}/harness.tsx`, `
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { EventCalendarAction } from '../src/features/events/EventCalendarAction'
import '../src/index.css'
import '../src/App.css'
const fixture = { id: '30000000-0000-4000-8000-000000000007', title: 'Encuentro de primavera 🎉', starts_at: '2026-12-31T23:30:00', ends_at: '2027-01-01T01:00:00', location_name: 'Centro cultural', address: 'Corrientes 123, Buenos Aires', visibility: 'public', state: 'open' }
function Harness() {
  const [event, setEvent] = useState(fixture)
  window.setCalendarFixture = patch => setEvent({ ...fixture, ...patch })
  return <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', minHeight: '100vh', boxSizing: 'border-box' }}>
    <p>QA B7 · Datos ficticios · Componente aislado</p><h1>{event.title}</h1>
    <p>31 de diciembre · 23:30 a 01:00 · Hora de Argentina</p><p>{event.location_name} · {event.address}</p>
    {!new URLSearchParams(location.search).has('baseline') && <EventCalendarAction event={event} />}
  </main>
}
document.body.className = 'amanecer-shell'
document.body.style.background = 'var(--pi-color-bg)'
document.body.style.color = 'var(--pi-color-ink)'
document.body.style.fontFamily = 'var(--pi-font-family)'
createRoot(document.getElementById('root')).render(<StrictMode><Harness /></StrictMode>)
`)
const server = await createServer({ configFile: false, plugins: [react()], logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } })
let browser
const results = [], errors = [], external = []
try {
  await server.listen()
  const address = server.httpServer.address(), origin = `http://127.0.0.1:${address.port}`
  browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
  for (const width of [320, 375, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce', acceptDownloads: true })
    await context.addInitScript(() => {
      window.calendarProbe = { opens: [], created: 0, revoked: 0 }
      window.open = (...args) => { window.calendarProbe.opens.push(args); return null }
      const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
      URL.createObjectURL = blob => { window.calendarProbe.created++; return create(blob) }
      URL.revokeObjectURL = url => { window.calendarProbe.revoked++; revoke(url) }
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', req => { if (!req.url().startsWith(origin) && !req.url().startsWith('blob:')) external.push(req.url()) })
    const check = name => { results.push({ width, name, result: 'PASS' }); console.log(`PASS ${width}: ${name}`) }
    const snapshot = name => page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true })
    const google = page.getByRole('button', { name: 'Agregar a Google Calendar', exact: true })
    const ics = page.getByRole('button', { name: 'Descargar archivo .ics', exact: true })
    const probe = () => page.evaluate(() => window.calendarProbe)
    const setEvent = patch => page.evaluate(value => window.setCalendarFixture(value), patch)
    if ([390, 1280].includes(width)) {
      await page.goto(`${origin}/.r7-calendar.local/index.html?baseline`)
      await page.getByRole('heading', { level: 1 }).waitFor(); await page.evaluate(() => document.fonts.ready)
      await snapshot('before')
    }
    await page.goto(`${origin}/.r7-calendar.local/index.html`)
    await ics.waitFor(); await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    for (const button of [google, ics]) {
      const box = await button.boundingBox(); assert.ok(box.height >= 44)
    }
    await snapshot('public')
    check('Amanecer layout without overflow, touch targets and StrictMode double initialization')
    const downloadWait = page.waitForEvent('download')
    await ics.click()
    const download = await downloadWait
    assert.equal(download.suggestedFilename(), 'planit-30000000-0000-4000-8000-000000000007.ics')
    const content = await readFile(await download.path(), 'utf8')
    assert.ok(content.includes('DTSTART:20270101T023000Z') && content.includes('DTEND:20270101T040000Z'))
    assert.ok(content.includes('SUMMARY:Encuentro de primavera 🎉'))
    if (width === 390) await download.saveAs(`${out}/browser-download.ics`)
    await page.waitForFunction(() => window.calendarProbe.created === window.calendarProbe.revoked)
    assert.match(await page.locator('.event-calendar-notice').innerText(), /ofrecido/)
    check('Real browser download: filename, Unicode content, UTC dates, Blob URL released')
    await google.click()
    let observed = await probe()
    assert.equal(observed.opens.length, 1)
    const url = new URL(observed.opens[0][0])
    assert.equal(url.origin, 'https://calendar.google.com')
    assert.equal(url.searchParams.get('dates'), '20270101T023000Z/20270101T040000Z')
    assert.deepEqual(observed.opens[0].slice(1), ['_blank', 'noopener,noreferrer'])
    assert.match(await page.locator('.event-calendar-notice').innerText(), /Se solicitó abrir/)
    check('Google action parameters and popup-blocker-safe wording (window.open instrumented)')
    await setEvent({ visibility: 'unlisted', invite_url: 'PRIVATE_INVITE', description: 'PRIVATE_DESCRIPTION' })
    await google.click()
    const dialog = page.getByRole('dialog'), cancel = page.getByRole('button', { name: 'Cancelar', exact: true })
    await dialog.waitFor()
    assert.equal(await cancel.evaluate(el => el === document.activeElement), true)
    assert.equal((await probe()).opens.length, 1)
    await snapshot('unlisted-confirmation')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await google.evaluate(el => el === document.activeElement), true)
    assert.equal((await probe()).opens.length, 1)
    assert.equal(await page.locator('.event-calendar-notice').innerText(), '')
    await google.click(); await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    assert.equal((await probe()).opens.length, 2)
    await google.click(); await cancel.click()
    assert.equal((await probe()).opens.length, 2)
    check('Hidden Google export asks every time, initial/return focus, Escape/cancel are neutral')
    await ics.click(); await cancel.click()
    assert.equal((await probe()).created, 1)
    await ics.click()
    const hiddenDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    const hidden = await hiddenDownload
    assert.ok(!(await readFile(await hidden.path(), 'utf8')).includes('PRIVATE_'))
    await page.waitForFunction(() => window.calendarProbe.created === window.calendarProbe.revoked)
    check('Hidden ICS requires explicit confirmation; extra fields never exported')
    await ics.click(); await dialog.waitFor()
    await setEvent({ title: 'Evento actualizado' })
    await dialog.waitFor({ state: 'hidden' })
    assert.equal((await probe()).created, 2)
    assert.equal(await page.locator('.event-calendar-notice').innerText(), '')
    check('Changed event DTO discards stale confirmation and feedback')
    await setEvent({ ends_at: '2026-12-30T10:00:00' })
    await ics.click()
    await page.getByRole('alert').waitFor()
    assert.equal((await probe()).created, 2)
    if (width === 390) await snapshot('invalid-data')
    await setEvent({})
    await page.evaluate(() => { window.realCreate = URL.createObjectURL; URL.createObjectURL = () => { throw new Error('fixture download failure') } })
    await ics.click(); await page.getByRole('alert').waitFor()
    await page.evaluate(() => { URL.createObjectURL = window.realCreate })
    const retryDownload = page.waitForEvent('download'); await ics.click(); await retryDownload
    assert.equal(await page.getByRole('alert').count(), 0)
    await page.waitForFunction(() => window.calendarProbe.created === window.calendarProbe.revoked)
    check('Invalid dates/download failure report errors; same action can retry successfully')
    await google.focus(); await page.keyboard.press('Tab')
    assert.equal(await ics.evaluate(el => el === document.activeElement), true)
    const focus = await ics.evaluate(el => ({ color: getComputedStyle(el).outlineColor, width: getComputedStyle(el).outlineWidth }))
    assert.equal(focus.width, '3px')
    await page.evaluate(() => { const elements = [...document.querySelectorAll('.event-calendar, .event-calendar *')]; const sizes = elements.map(el => parseFloat(getComputedStyle(el).fontSize)); elements.forEach((el, i) => el.style.fontSize = sizes[i] * 2 + 'px') })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if ([320, 390, 1280].includes(width)) await snapshot('text-200')
    await context.close()
    check('Keyboard navigation, visible 3px focus and enlarged text without horizontal overflow')
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(external, [])
  results.push({ name: 'No browser exceptions or external network requests', result: 'PASS' })
} finally {
  await browser?.close(); await server.close()
  await writeFile(`${out}/results.json`, JSON.stringify({ browser: 'Microsoft Edge headless', timezone: 'Asia/Tokyo', environment: 'Executed production component in ignored Vite harness, synthetic DTO, no auth/server claims; Google open instrumented', results, errors, external }, null, 2) + '\n')
}


