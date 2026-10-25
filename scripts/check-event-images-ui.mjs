import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4193'
const output = process.env.PLANIT_UI_OUTPUT ?? '.r6-check.local/event-images'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const event = { id: '30000000-0000-4000-8000-000000000001', organizer_id: user.id, title: 'Fotos con proporción original', description: 'Prueba local de proporciones de imágenes.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Av. Corrientes 123, Buenos Aires', location_name: 'Centro cultural', latitude: -34.6037, longitude: -58.3816, capacity: 20, category_id: '10000000-0000-4000-8000-000000000001', visibility: 'public', cancelled_at: null, archived_at: null }
const shapes = [[240, 480], [400, 400], [600, 400], [800, 200]]
const images = shapes.map((_, i) => ({ id: `photo-${i}`, file_id: `file-${i}`, sort_order: i, files: { storage_path: `fixture/${i}.png` } }))

async function assertImages(page, selector, count) {
  const photos = page.locator(selector)
  await photos.first().waitFor()
  assert.equal(await photos.count(), count, selector)
  for (const img of await photos.all()) {
    await img.scrollIntoViewIfNeeded()
    await img.evaluate(el => el.decode())
    const size = await img.evaluate(el => {
      const rect = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect()
      return { w: rect.width, h: rect.height, nw: el.naturalWidth, nh: el.naturalHeight, parentH: parent.height }
    })
    assert.ok(Math.abs(size.h - size.w * size.nh / size.nw) < 1, JSON.stringify(size))
    assert.ok(size.parentH + 1 >= size.h, `Clipped image: ${JSON.stringify(size)}`)
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow')
}

try {
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user })), user)
    const page = await context.newPage()
    // Generate actual PNG uploads locally; intercept every external request.
    const files = await page.evaluate(shapes => shapes.map(([w, h], i) => {
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d'); ctx.fillStyle = ['#8d66fa', '#0753ff', '#5b34d6', '#565f8a'][i]; ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, w - 12, h - 12)
      return canvas.toDataURL('image/png').split(',')[1]
    }), shapes)
    let noPhotos = false
    await context.route('**/*', async route => {
      const url = new URL(route.request().url()), path = url.pathname
      if (url.origin === origin) return route.continue()
      if (url.hostname !== 'iepeqmvzjguwlhnecsdq.supabase.co') return route.abort()
      const reply = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user)
      if (path === '/rest/v1/events') return reply([event])
      if (path === '/rest/v1/categories') return reply([{ id: event.category_id, name: 'Música', is_active: true }])
      if (path === '/rest/v1/event_images') return reply(noPhotos ? [] : images)
      if (path === '/rest/v1/rpc/get_event_duplicate_source') return reply([event])
      if (path.endsWith('/get_my_events')) return reply([])
      if (['search_public_events', 'get_my_organized_events'].some(name => path.endsWith(`/${name}`))) return reply(shapes.map((_, i) => ({ ...event, id: event.id.slice(0, -1) + (i + 1), category_name: 'Música', event_state: 'open', participation_status: null, image_path: noPhotos ? null : images[i].files.storage_path })))
      if (path.endsWith('/get_event_participation_summary')) return reply([{ confirmed_count: 0, capacity: 20, available_spots: 20, own_status: null, is_organizer: true, event_state: 'open' }])
      if (path.endsWith('/get_event_organizer')) return reply([{ display_name: 'Organizador', username: 'organizador' }])
      if (path === '/storage/v1/object/sign/event_media') return reply(route.request().postDataJSON().paths.map(path => ({ path, signedURL: `/object/sign/event_media/${path}?token=fixture` })))
      if (path.startsWith('/storage/v1/object/sign/event_media/')) return route.fulfill({ contentType: 'image/png', body: Buffer.from(files[Number(path.split('/').at(-1).split('.')[0])], 'base64') })
      return reply([])
    })
    const cases = [
      ['/home', '.event-card-photo img', 4, 'home'],
      ['/map', '.event-card-photo img', 4, 'map'],
      ['/my-events', '.compact-event-photo img', 4, 'my-events'],
      [`/events/${event.id}`, '.event-hero img, .event-gallery img', 4, 'detail'],
      [`/events/${event.id}/edit`, '.edit-event-cover img', 1, 'edit'],
      [`/events/${event.id}/gallery`, '.gallery-photo img', 4, 'gallery'],
    ]
    for (const [path, selector, count, name] of cases) {
      await page.goto(origin + path)
      await assertImages(page, selector, count)
      if (name === 'gallery') {
        for (const button of await page.locator('.gallery-remove').all()) {
          assert.ok(await button.evaluate(el => {
            const rect = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect()
            return rect.top >= parent.top && rect.bottom <= parent.bottom && rect.width >= 44 && rect.height >= 44
          }), 'Gallery remove control is clipped')
        }
      }
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true })
      console.log(`PASS ${width}px ${name}: natural ratio, no clipping or overflow`)
    }
    const uploads = files.map((file, i) => ({ name: `shape-${i}.png`, mimeType: 'image/png', buffer: Buffer.from(file, 'base64') }))
    for (const path of ['/events/new', `/events/new?duplicateFrom=${event.id}`]) {
      await page.goto(origin + path)
      await page.locator('input[type=file]').setInputFiles(uploads)
      await assertImages(page, '.image-previews img', 4)
      console.log(`PASS ${width}px ${path}: local upload previews`)
    }
    await page.goto(`${origin}/events/${event.id}/gallery`)
    await page.locator('input[type=file]').setInputFiles(uploads)
    await assertImages(page, '.gallery-photo img', 8)
    console.log(`PASS ${width}px gallery: pending uploads`)
    noPhotos = true
    await page.goto(origin + '/home')
    await page.locator('.event-card.without-photo').first().waitFor()
    assert.equal(await page.locator('.event-card-photo img').count(), 0)
    console.log(`PASS ${width}px: events without photos`)
    await page.goto(origin + '/my-events?section=participating')
    await page.getByRole('heading', { name: 'Todavía no tenés participaciones' }).waitFor()
    const padding = await page.locator('#panel-participating').evaluate(el => Number.parseFloat(getComputedStyle(el).paddingTop))
    assert.equal(padding, 16)
    await page.screenshot({ path: `${output}/participating-empty-${width}.png`, fullPage: true })
    console.log(`PASS ${width}px: 16px separation between tabs and participation panel`)
    await context.close()
  }
  // Exercise React source changes without unmounting EventImage itself.
  const harness = await build({ configFile: false, logLevel: 'silent', plugins: [{
    name: 'image-test-harness',
    resolveId: id => id === 'image-test-harness' ? '\0image-test-harness' : undefined,
    load: id => id === '\0image-test-harness' ? 'import React from "react";import{createRoot}from"react-dom/client";import{EventImage}from"/src/components/EventImage.tsx";const root=createRoot(document.getElementById("test"));window.photo=src=>root.render(React.createElement(EventImage,{src,alt:"Prueba",loading:"eager"}));window.photo("/broken-photo");' : undefined,
  }], build: { write: false, minify: false, rollupOptions: { input: 'image-test-harness' } } })
  const harnessCode = harness.output.find(chunk => chunk.type === 'chunk').code
  const page = await browser.newPage()
  await page.route('**/__event-image-test', route => route.fulfill({ contentType: 'text/html', body: '<div id="test"></div><script type="module" src="/__event-image-harness.js"></script>' }))
  await page.route('**/__event-image-harness.js', route => route.fulfill({ contentType: 'text/javascript', body: harnessCode }))
  await page.route('**/broken-photo', route => route.fulfill({ status: 404, body: '' }))
  let release
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/slow-photo', async route => { await gate; await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="400"/>' }) })
  await page.goto(`${origin}/__event-image-test`)
  await page.getByRole('status').waitFor()
  await page.evaluate(() => window.photo('/slow-photo'))
  await page.locator('img[data-image-state="loading"]').waitFor({ state: 'attached' })
  release()
  await page.locator('img[data-image-state="loaded"]').waitFor()
  assert.equal(await page.getByRole('status').count(), 0)
  console.log('PASS error fallback, changed source recovery, slow loading and loaded state')
} finally {
  await browser.close()
}
