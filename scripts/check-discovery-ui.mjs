import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4182'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/map-detail-r1'
await mkdir(output, { recursive: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const event = { id: '30000000-0000-4000-8000-000000000001', organizer_id: '20000000-0000-4000-8000-000000000002', title: 'Encuentro de música — prueba', description: 'Compartimos música con la comunidad. Datos de prueba para verificar la interfaz.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Av. Corrientes 123, Buenos Aires', location_name: 'Centro cultural', latitude: -34.6037, longitude: -58.3816, capacity: 20, category_id: '10000000-0000-4000-8000-000000000001', visibility: 'public', cancelled_at: null, archived_at: null, category_name: 'Música', image_path: null }
const metrics = []
try {
  for (const [width,height] of [[375,812],[768,1024],[1280,900]]) {
    const context = await browser.newContext({ viewport: { width,height }, timezoneId: 'Asia/Tokyo' })
    await context.addInitScript(({ user }) => { localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type:'bearer',user })) }, { user })
    let mode = 'ok'; let calls = 0
    // Do not scrape OSM tiles during automated checks. Real engine with neutral fixture tiles.
    await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e3e8de"/><path d="M0 60H256M0 180H256M70 0V256M190 0V256" stroke="#fff" stroke-width="10"/><path d="M0 60H256M70 0V256" stroke="#b5bdb0" stroke-width="1"/></svg>' }))
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
      const path = new URL(route.request().url()).pathname
      const reply = (data,status=200) => route.fulfill({ status, contentType:'application/json',body:JSON.stringify(data) })
      if(path === '/auth/v1/user') return reply(user)
      if(path === '/rest/v1/rpc/discover_public_events') { calls++; return mode === 'error' ? reply({code:'500',message:'fixture'},500) : reply(mode === 'empty' ? [] : [event]) }
      if(path === '/rest/v1/events') return reply(mode === 'missing' ? [] : [event])
      if(path === '/rest/v1/categories') return reply([{ id:event.category_id,name:'Música',is_active:true }])
      if(path === '/rest/v1/event_images') return reply([])
      if(path === '/rest/v1/rpc/get_event_participation_summary') return reply([{confirmed_count:0,capacity:event.capacity,available_spots:event.capacity,own_status:null,is_organizer:false,event_state:'open'}])
      return reply([],200)
    })
    const page = await context.newPage(); const errors=[]
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/map`)
    await page.getByRole('heading',{name:event.title}).waitFor()
    assert.equal(await page.locator('.leaflet-marker-icon').count(),1)
    assert.equal(await page.locator('.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]').count(),1)
    const mapNode = page.locator('.leaflet-container'); await mapNode.evaluate(el => { el.dataset.instance='same' })
    await page.locator('.leaflet-marker-icon').focus(); await page.keyboard.press('Enter')
    await page.getByRole('region',{name:'Evento seleccionado'}).waitFor()
    assert.equal(await mapNode.getAttribute('data-instance'),'same')
    assert.equal(calls,1)
    await page.screenshot({path:`${output}/map-${width}x${height}.png`,fullPage:true})
    await page.getByRole('region',{name:'Evento seleccionado'}).getByRole('link',{name:'Ver detalle',exact:true}).click()
    await page.getByRole('heading',{name:event.title,level:1}).waitFor()
    await page.getByRole('button',{name:'Unirme',exact:true}).waitFor()
    assert.match(await page.locator('.detail-metadata').innerText(),/20:00/)
    await page.screenshot({path:`${output}/detail-${width}x${height}.png`,fullPage:true})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    if(width===375) {
      await page.getByRole('link',{name:'Volver al mapa',exact:true}).click()
      await page.getByRole('heading',{name:event.title}).waitFor()
      await page.getByRole('button',{name:'Mi ubicación',exact:true}).click()
      await page.getByText(/No autorizaste el acceso/).waitFor()
      await context.setGeolocation({ latitude:-34.6037,longitude:-58.3816 })
      await context.grantPermissions(['geolocation'])
      await page.getByRole('button',{name:'Mi ubicación',exact:true}).click()
      await page.getByText('Mapa centrado en tu ubicación. Movelo para explorar.',{exact:true}).waitFor()
      mode='empty'; await page.getByRole('button',{name:'Actualizar eventos'}).click()
      await page.getByRole('heading',{name:'No hay eventos en esta zona'}).waitFor()
      await page.screenshot({path:`${output}/empty-375x812.png`,fullPage:true})
      mode='error'; await page.getByRole('button',{name:'Actualizar eventos'}).click()
      await page.getByRole('heading',{name:'No se pudo cargar'}).waitFor()
      await page.screenshot({path:`${output}/error-375x812.png`,fullPage:true})
      mode='ok'; await page.getByRole('button',{name:'Reintentar',exact:true}).click()
      await page.getByRole('heading',{name:event.title}).waitFor()
      await page.locator('.leaflet-marker-icon').click()
      await page.getByRole('region',{name:'Evento seleccionado'}).waitFor()
      await page.getByRole('button',{name:'Cerrar vista previa'}).click()
      mode='missing'; await page.goto(`${origin}/events/${event.id}`)
      await page.getByRole('heading',{name:'Evento no disponible'}).waitFor()
      await page.goto(`${origin}/events/not-a-uuid`)
      await page.getByRole('heading',{name:'Evento no disponible'}).waitFor()
    }
    assert.deepEqual(errors,[])
    metrics.push({width,height,overflow:false,pageErrors:errors})
    await context.close()
  }
  await writeFile(`${output}/results.json`,JSON.stringify(metrics,null,2))
  console.log('PASS: mobile/tablet/desktop, keyboard marker, stable map, detail, Argentina time, denied location, empty/error/retry, missing/invalid id. Fixtures only; tiles intercepted.')
} finally { await browser.close() }
