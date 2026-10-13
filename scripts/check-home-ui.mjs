import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: process.env.PLANIT_UI_NO_PROXY ? ['--no-proxy-server'] : [] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/home-event-detail'
await mkdir(output, { recursive: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const eventId = '30000000-0000-4000-8000-000000000001'
const event = { id: eventId, organizer_id: '20000000-0000-4000-8000-000000000002', title: 'Encuentro de música — prueba', description: 'Compartimos música con la comunidad. Datos de prueba para verificar la interfaz.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Av. Corrientes 123, Buenos Aires', location_name: 'Centro cultural', latitude: -34.6037, longitude: -58.3816, capacity: 20, category_id: '10000000-0000-4000-8000-000000000001', visibility: 'public', cancelled_at: null, archived_at: null }
const paginationRows = Array.from({ length:31 }, (_,index) => ({
  ...event,
  id:`30000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`,
  title:`Evento paginado ${index+1}`,
  starts_at:new Date(Date.UTC(2099,9,11,20,0)+index*60000).toISOString().slice(0,-1),
  category_id:index%2 ? '10000000-0000-4000-8000-000000000002' : event.category_id,
  category_name:index%2 ? 'Arte' : 'Música',
}))
const results = []
const check = test => { results.push({ test, result: 'PASS', evidence: 'Playwright fixture; not a real Supabase Auth/REST request' }); console.log(`PASS: ${test}`) }
async function context(viewport) {
  const browserContext = await browser.newContext({ viewport, timezoneId: 'Asia/Tokyo' })
  await browserContext.addInitScript(({ user }) => {
    localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type:'bearer',user }))
  }, { user })
  let mode = 'success'
  await browserContext.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname
    const reply = (data,status=200) => route.fulfill({ status, contentType:'application/json',body:JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user)
    if (path === '/rest/v1/rpc/search_public_events') {
      if (mode === 'error') return reply({ code:'XX000',message:'fixture failure' },500)
      if (mode === 'pagination') {
        const body = route.request().postDataJSON()
        if (!body.p_before_id) return reply(paginationRows)
        assert.equal(body.p_before_id,paginationRows[29].id)
        return reply([paginationRows[30]])
      }
      return reply(mode === 'empty' ? [] : [{ ...event, category_name:'Música', image_path:null }])
    }
    if (path === '/rest/v1/events') return mode === 'unavailable' ? reply([]) : mode === 'detail-error' ? reply({ code:'XX000',message:'fixture failure' },500) : reply([event])
    if (path === '/rest/v1/categories') return reply([{ id:event.category_id,name:'Música',is_active:true }])
    if (path === '/rest/v1/event_images') return reply(mode === 'photos' ? [{ files:{ storage_path:'fixture/cover.webp' } },{ files:{ storage_path:'fixture/gallery.webp' } }] : [])
    if (path === '/rest/v1/rpc/get_event_organizer') return reply([{ display_name:'Organizadora de prueba',username:'organizadora' }])
    if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{ confirmed_count:3,capacity:20,available_spots:17,own_status:null,is_organizer:false,event_state:'open' }])
    if (path === '/storage/v1/object/sign/event_media') {
      const body = route.request().postDataJSON()
      return reply(body.paths.map(path => ({ path,signedURL:`/object/sign/event_media/${path}?token=fixture` })))
    }
    if (path.startsWith('/storage/v1/object/sign/event_media/')) return route.fulfill({ status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#1741a3"/></svg>' })
    return reply([])
  })
  return { browserContext, setMode: value => { mode = value } }
}
try {
  for (const [name, viewport] of [['mobile',{ width:375,height:812 }],['desktop',{ width:1280,height:900 }]]) {
    const { browserContext } = await context(viewport)
    const page = await browserContext.newPage()
    page.setDefaultTimeout(6000)
    page.on('console', message => { if (message.type() === 'error') console.error(`Browser console: ${message.text()}`) })
    page.on('pageerror', error => console.error(`Browser page error: ${error.message}`))
    page.on('response', response => { if (response.url().includes('supabase.co') && response.status() >= 400) console.error(`Fixture response ${response.status()}: ${response.url()}`) })
    await page.goto(`${origin}/home`)
    await page.getByRole('heading', { name:'Inicio',level:1 }).waitFor()
    await page.getByRole('heading', { name:'Música',level:2 }).waitFor()
    await page.getByRole('link', { name:/Ver detalle de Encuentro de música/ }).waitFor()
    assert.equal(await page.locator('.home-category').count(),1)
    assert.equal(await page.locator('.home-event-list > li').count(),1)
    await page.screenshot({ path:`${output}/home-${name}.png` })
    const detailLink = page.locator(`a[href="/events/${eventId}"]`).first()
    await detailLink.click()
    await page.getByRole('heading', { name:'Encuentro de música — prueba',level:1 }).waitFor()
    await page.getByText('@organizadora').waitFor()
    await page.getByText('Sin foto de portada').waitFor()
    await page.getByRole('link', { name:'Volver al inicio' }).waitFor()
    await page.screenshot({ path:`${output}/detail-${name}.png` })
    await page.getByRole('heading', { name:'Organizador' }).scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.screenshot({ path:`${output}/detail-organizer-${name}.png` })
    check(`${name}: categorized home card opens matching detail, shows real organizer projection, placeholder media, and returns to home`)
    await browserContext.close()
  }
  const { browserContext: emptyContext, setMode: setEmpty } = await context({ width:375,height:812 })
  setEmpty('empty')
  const emptyPage = await emptyContext.newPage()
  await emptyPage.goto(`${origin}/home`)
  await emptyPage.getByRole('heading', { name:'Todavía no hay eventos próximos' }).waitFor()
  check('Empty home state is informative and contains no sample cards')
  await emptyContext.close()

  const { browserContext: paginationContext, setMode:setPagination } = await context({ width:375,height:812 })
  setPagination('pagination')
  const paginationPage = await paginationContext.newPage()
  paginationPage.setDefaultTimeout(6000)
  await paginationPage.goto(`${origin}/home`)
  await paginationPage.getByRole('button', { name:'Cargar más' }).waitFor()
  assert.equal(await paginationPage.locator('.home-event-list > li').count(),30)
  await paginationPage.getByRole('button', { name:'Cargar más' }).click()
  await paginationPage.getByRole('heading', { name:'Evento paginado 31' }).waitFor()
  assert.equal(await paginationPage.locator('.home-event-list > li').count(),31)
  assert.equal(await paginationPage.locator('.home-category').count(),2)
  check('Keyset pagination appends the next page and merges repeated category groups')
  await paginationContext.close()

  const { browserContext: photosContext,setMode:setPhotos } = await context({ width:375,height:812 })
  setPhotos('photos')
  const photosPage = await photosContext.newPage()
  photosPage.setDefaultTimeout(6000)
  await photosPage.goto(`${origin}/events/${eventId}`)
  await photosPage.getByRole('heading', { name:'Encuentro de música — prueba',level:1 }).waitFor()
  assert.equal(await photosPage.locator('.event-hero img').count(),1)
  assert.equal(await photosPage.locator('.event-gallery img').count(),1)
  await photosPage.locator('.event-hero img').evaluate(image => image.decode())
  await photosPage.locator('.event-gallery img').evaluate(image => image.decode())
  await photosPage.screenshot({ path:`${output}/detail-gallery-mobile.png` })
  check('Available signed photos render as a hero and a detail gallery')
  await photosContext.close()

  const { browserContext: errorContext, setMode: setError } = await context({ width:375,height:812 })
  setError('error')
  const errorPage = await errorContext.newPage()
  await errorPage.goto(`${origin}/home`)
  await errorPage.getByRole('heading', { name:'No se pudo cargar Inicio' }).waitFor()
  await errorPage.getByRole('button', { name:'Reintentar' }).waitFor()
  check('Home query failure gives an explicit error with retry')
  await errorContext.close()

  const { browserContext: revokedContext, setMode: setRevoked } = await context({ width:375,height:812 })
  const revokedPage = await revokedContext.newPage()
  revokedPage.setDefaultTimeout(3000)
  await revokedPage.goto(`${origin}/events/${eventId}`)
  await revokedPage.getByText('@organizadora').waitFor()
  setRevoked('unavailable')
  await revokedPage.evaluate(() => window.dispatchEvent(new Event('focus')))
  await revokedPage.getByRole('heading', { name:'Evento no disponible' }).waitFor()
  assert.equal(await revokedPage.getByText('@organizadora').count(),0)
  assert.equal(await revokedPage.locator('.event-detail-page').count(),0)
  check('Detail revalidates on focus and clears an event whose access was revoked (CA-04)')
  setRevoked('success')
  await revokedPage.evaluate(() => window.dispatchEvent(new Event('online')))
  await revokedPage.getByText('@organizadora').waitFor()
  setRevoked('detail-error')
  await revokedPage.evaluate(() => window.dispatchEvent(new Event('focus')))
  await revokedPage.getByRole('heading', { name:'No se pudo cargar' }).waitFor()
  assert.equal(await revokedPage.locator('.event-detail-page').count(),0)
  setRevoked('success')
  await revokedPage.getByRole('button', { name:'Reintentar',exact:true }).click()
  await revokedPage.getByText('@organizadora').waitFor()
  check('Detail clears stale data on network failure and recovers on retry/online')
  let releaseDetail
  const lateResponse = new Promise(resolve => { releaseDetail = resolve })
  let holdFirst = true
  await revokedContext.route('**/rest/v1/events?**', async route => {
    if (!holdFirst) return route.fallback()
    holdFirst = false
    await lateResponse
    return route.fulfill({ status:200,contentType:'application/json',body:JSON.stringify([event]) })
  })
  const staleRequest = revokedPage.waitForRequest(request => new URL(request.url()).pathname === '/rest/v1/events')
  await revokedPage.evaluate(() => window.dispatchEvent(new Event('focus')))
  await staleRequest
  setRevoked('unavailable')
  await revokedPage.evaluate(() => window.dispatchEvent(new Event('online')))
  await revokedPage.getByRole('heading', { name:'Evento no disponible' }).waitFor()
  const staleReply = revokedPage.waitForResponse(response => new URL(response.url()).pathname === '/rest/v1/events' && response.status() === 200)
  releaseDetail()
  await staleReply
  await revokedPage.waitForTimeout(100)
  assert.equal(await revokedPage.locator('.event-detail-page').count(),0)
  check('A late successful detail response cannot restore an event after newer access denial')
  await revokedContext.close()

  await writeFile(`${output}/ui-results.json`, JSON.stringify({ environment:'Playwright against local Vite with fixture Supabase Auth/REST responses; no real users or remote writes',results },null,2))
} finally { await browser.close() }
