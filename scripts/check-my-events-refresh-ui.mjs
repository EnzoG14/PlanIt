import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const phase = process.argv[2] ?? 'after'
const requestedWidth = Number(process.argv[3])
assert.ok(['before', 'after'].includes(phase))
const output = process.env.PLANIT_UI_OUTPUT ?? `docs/design/verification/ui-refresh/my-events/${phase}`
await mkdir(output, { recursive: true })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4186'
const owner = '20000000-0000-4000-8000-000000000001'
const user = { id: owner, email: 'ui-refresh@fixture.example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, identities: [], created_at: '2026-10-12T12:00:00Z' }
const token = { access_token: `fixture-${owner}`, refresh_token: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user }
const row = (n, state = 'open') => ({ id: `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`, title: ['Encuentro de música — prueba', 'Caminata por la reserva', 'Taller de fotografía'][n % 3], starts_at: '2099-10-12T20:00:00', ends_at: '2099-10-12T22:00:00', location_name: 'Centro cultural', address: 'Buenos Aires', category_name: ['Música', 'Deporte', 'Arte'][n % 3], event_state: state, participation_status: null, image_path: n === 0 ? `${owner}/cover.webp` : null })
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const results = []
try {
  for (const [width, height] of [[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900]].filter(([width]) => !requestedWidth || width === requestedWidth)) {
    const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Tokyo', reducedMotion: 'reduce' })
    let rows = [row(0), row(1, 'ended'), row(2, 'cancelled')], failure = false, slow = false, brokenPhoto = false
    let logoutFailure = true, logoutCalls = 0
    await context.addInitScript(token => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(token)), token)
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const path = new URL(route.request().url()).pathname
      const reply = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user)
      if (path === '/auth/v1/logout') {
        logoutCalls++
        await new Promise(resolve => setTimeout(resolve, 700))
        return logoutFailure ? route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture logout failure' }) }) : reply({})
      }
      if (path.endsWith('/get_my_organized_events') || path.endsWith('/get_my_events')) {
        if (failure) return route.abort('failed')
        if (slow) await new Promise(resolve => setTimeout(resolve, 700))
        const { p_offset, p_filter = 'all' } = route.request().postDataJSON()
        const filtered = rows.filter(r => p_filter === 'all' ? r.event_state !== 'archived' : r.event_state === ({ upcoming: 'open', past: 'ended', cancelled: 'cancelled', archived: 'archived' })[p_filter])
        return reply(filtered.slice(p_offset, p_offset + 31))
      }
      if (path === '/storage/v1/object/sign/event_media') return reply([{ path: `${owner}/cover.webp`, signedURL: `/object/sign/event_media/${owner}/cover.webp?token=fixture` }])
      if (path.includes('/object/sign/event_media/')) {
        if (brokenPhoto) return route.abort('failed')
        // Explicit geometric fixture, not a photograph of a real event.
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="180"><rect width="160" height="180" fill="#242054"/><circle cx="80" cy="65" r="40" fill="#7651df"/><path d="M0 180L80 100L160 180" fill="#0753ff"/></svg>' })
      }
      return reply([])
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    const settle = () => page.evaluate(async () => {
      await document.fonts.ready
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
    const shot = async name => { await settle(); await page.screenshot({ path: `${output}/${name}-${width}x${height}.png`, fullPage: true }) }
    const ready = async () => {
      await page.waitForLoadState('networkidle')
      await page.waitForFunction(() => document.querySelector('[role="tabpanel"]')?.getAttribute('aria-busy') === 'false')
      await settle()
    }
    const refresh = async () => { await page.getByRole('button', { name: 'Actualizar', exact: true }).click(); await ready() }
    const measure = async name => {
      await settle()
      const data = await page.evaluate(() => {
        const rect = el => { const r = el.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height } }
        const properties = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'padding', 'margin', 'gap', 'border-radius', 'color', 'background-color', 'background-image', 'box-shadow']
        const inspected = [...document.querySelectorAll('.app-header *, .my-events-page *, .primary-nav *')].map(el => {
          const style = getComputedStyle(el)
          return { element: `${el.tagName}.${el.getAttribute('class') ?? ''}`, ...Object.fromEntries(properties.map(name => [name, style.getPropertyValue(name)])) }
        })
        // Repeated cards/SVG children share styles; retain each distinct signature once.
        const visual = [...new Map(inspected.map(value => [JSON.stringify(value), value])).values()]
        return { visual, overflow: document.documentElement.scrollWidth > innerWidth, firstRow: document.querySelector('.compact-event-card')?.getBoundingClientRect().top ?? null, smallTargets: [...document.querySelectorAll('.my-events-page button, .my-events-create, .primary-nav a')].filter(e => !e.disabled && e.getBoundingClientRect().height > 0 && (e.getBoundingClientRect().height < 44 || e.getBoundingClientRect().width < 44)).map(e => ({ text:e.textContent, ...rect(e) })), menu: document.querySelector('.compact-event-menu-panel') ? rect(document.querySelector('.compact-event-menu-panel')) : null, nav: rect(document.querySelector('.primary-nav')) }
      })
      assert.equal(data.overflow, false, `${width} ${name}: document overflow`)
      if (phase === 'after') assert.deepEqual(data.smallTargets, [], `${width} ${name}: small targets`)
      results.push({ width,height:page.viewportSize().height,name,...data })
      await shot(name)
    }
    await page.goto(`${origin}/my-events`); await ready(); await measure('organizing')
    if (phase === 'after') {
      const account = page.getByRole('button', { name: 'Cuenta', exact: true })
      await account.focus(); await page.keyboard.press('ArrowDown')
      await page.getByRole('link', { name: 'Mi perfil', exact: true }).waitFor()
      assert.equal(await account.getAttribute('aria-expanded'), 'true')
      assert.equal(await page.getByRole('link', { name: 'Mi perfil', exact: true }).evaluate(el => el === document.activeElement), true)
      const panel = await page.locator('.account-menu-panel').boundingBox()
      assert.ok(panel.x >= 0 && panel.x + panel.width <= width && panel.y + panel.height <= height)
      await shot('account-menu')
      await page.keyboard.press('Escape')
      assert.equal(await account.getAttribute('aria-expanded'), 'false')
      assert.equal(await account.evaluate(el => el === document.activeElement), true)
      await account.click(); await page.getByRole('tab', { name: 'Organizo', exact: true }).click()
      assert.equal(await account.getAttribute('aria-expanded'), 'false')
      await account.click(); await page.getByRole('link', { name: 'Mi perfil', exact: true }).click()
      await page.waitForURL('**/me')
      assert.equal(await page.getByRole('button', { name: 'Cuenta', exact: true }).count(), 0, 'other routes preserve the current header')
      await page.goto(`${origin}/my-events`); await ready()
    }
    if (phase === 'after') assert.equal(await page.getByRole('link',{name:/Sin foto/}).count(),0, 'decorative photo fallback must not misname event links')
    await page.getByRole('tab',{ name:'Organizo',exact:true }).focus()
    await page.keyboard.press('ArrowRight'); await ready()
    assert.equal(await page.getByRole('tab',{ name:'Participo',exact:true }).getAttribute('aria-selected'), 'true')
    rows = rows.map((r,n) => ({ ...r, participation_status: ['confirmed','cancelled','removed'][n] }))
    await refresh(); await measure('participating')
    await page.getByRole('tab',{ name:'Organizo',exact:true }).click(); await ready()
    rows = Array.from({length: 36}, (_,n) => row(n)); await refresh()
    await page.getByRole('button',{ name:'Cargar más',exact:true }).click(); await ready()
    assert.equal(await page.locator('.compact-event-card').count(),36)
    await page.getByRole('button',{ name:/Acciones de/ }).last().scrollIntoViewIfNeeded()
    await page.getByRole('button',{ name:/Acciones de/ }).last().click()
    const menu = await page.locator('.compact-event-menu-panel').boundingBox()
    assert.ok(menu.x >= 0 && menu.x + menu.width <= width && menu.y >= 0 && menu.y + menu.height <= height, `${width}: menu clipping`)
    await measure('many-menu')
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.compact-event-menu-panel').count(),0)
    await page.evaluate(() => window.scrollTo(0,0))
    rows = [{ ...row(0), title:'EventoConUnTítuloMuyLargoSinEspacios'.repeat(5), location_name:'Salón de encuentros y actividades comunitarias en la reserva natural de Buenos Aires — acceso por avenida principal '.repeat(3) }]; brokenPhoto = true
    await refresh(); await measure('long-broken-photo')
    rows = []; await refresh(); await measure('empty')
    failure = true; await refresh(); await measure('network-error')
    failure = false; rows = [row(0)]; slow = true
    await page.getByRole('button',{ name:'Reintentar',exact:true }).click(); await shot('loading'); await ready(); slow = false
    if (phase === 'after') {
      await page.getByRole('button',{name:/Acciones de/}).click()
      await page.getByRole('button',{name:'Cancelar evento',exact:true}).click()
      const dialog = page.getByRole('dialog'); await dialog.waitFor()
      const box = await dialog.boundingBox()
      assert.ok(box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= height, `${width}: dialog clipping`)
      await shot('cancel-dialog')
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' })
      assert.equal(await page.getByRole('button',{name:/Acciones de/}).evaluate(el => el === document.activeElement), true, 'focus returns to the menu trigger')
      await page.setViewportSize({ width, height: 360 }); await refresh()
      await page.getByRole('button',{name:/Acciones de/}).scrollIntoViewIfNeeded()
      await page.getByRole('button',{name:/Acciones de/}).click(); await measure('short-menu')
      await page.getByRole('button',{name:'Archivar evento',exact:true}).focus()
      const lastAction = await page.getByRole('button',{name:'Archivar evento',exact:true}).boundingBox()
      const panel = await page.locator('.compact-event-menu-panel').boundingBox()
      assert.ok(lastAction.y >= panel.y && lastAction.y + lastAction.height <= panel.y + panel.height, 'last menu action reachable by focus')
      await page.keyboard.press('Escape')
      await page.setViewportSize({ width, height })
      await ready()
      await page.evaluate(() => {
        const elements = [...document.querySelectorAll('.my-events-page *')]
        const sizes = elements.map(el => getComputedStyle(el).fontSize)
        elements.forEach((el,n) => { el.style.fontSize = `${parseFloat(sizes[n]) * 2}px` })
      })
      await measure('text-200')
      await page.reload(); await ready()
      await page.getByRole('button',{name:'Cuenta',exact:true}).click()
      await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click()
      await page.getByRole('button',{name:'Cerrando sesión…',exact:true}).waitFor()
      assert.equal(await page.getByRole('button',{name:'Cerrando sesión…',exact:true}).isDisabled(),true)
      // Installed Auth SDK removes the local session even on remote rejection.
      await page.waitForURL('**/login**')
      assert.equal(logoutCalls,1)
      assert.equal(await page.evaluate(() => localStorage.getItem('sb-iepeqmvzjguwlhnecsdq-auth-token')),null)
      await shot('account-logout-rejected')
      logoutFailure = false
      // Navigation reseeds a new fixture session through addInitScript.
      await page.goto(`${origin}/my-events`); await ready()
      await page.getByRole('button',{name:'Cuenta',exact:true}).click()
      await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click()
      await page.waitForURL('**/login**')
      assert.equal(logoutCalls,2)
    }
    assert.deepEqual(errors, [])
    await context.close()
  }
  await writeFile(`${output}/measurements.json`, JSON.stringify({ environment:'Edge Chromium; intercepted Auth/REST/Storage fixtures; no remote writes; Asia/Tokyo clock; reduced motion', results }) + '\n')
  console.log(`${phase}: ${results.length} responsive/state captures PASS`)
} finally { await browser.close() }
