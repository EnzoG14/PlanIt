import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href)
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader', ...(process.env.PLANIT_UI_NO_PROXY ? ['--no-proxy-server'] : [])] })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4182'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/mapbox-migration'
await mkdir(output, { recursive: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const event = { id: '30000000-0000-4000-8000-000000000001', organizer_id: '20000000-0000-4000-8000-000000000002', title: 'Encuentro de música — prueba', description: 'Compartimos música con la comunidad. Datos de prueba para verificar la interfaz.', starts_at: '2099-10-11T20:00:00', ends_at: '2099-10-11T22:00:00', address: 'Av. Corrientes 123, Buenos Aires', location_name: 'Centro cultural', latitude: -34.6037, longitude: -58.3816, capacity: 20, category_id: '10000000-0000-4000-8000-000000000001', visibility: 'public', cancelled_at: null, archived_at: null, category_name: 'Música', image_path: null }
const metrics = []
const mapMode = process.env.PLANIT_MAP_MODE ?? 'engine'
const missingToken = mapMode !== 'engine'
try {
  for (const [width,height] of [[375,812],[768,1024],[1280,900]]) {
    const context = await browser.newContext({ viewport: { width,height }, timezoneId: 'Asia/Tokyo' })
    await context.addInitScript(({ user }) => { localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type:'bearer',user })) }, { user })
    if (mapMode === 'webgl') await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args) }
    })
    let mode = 'ok'; let calls = 0; const queriedBounds = []
    // Real Mapbox GL JS + WebGL, local style fixture; no Mapbox service validation.
    let styleFailure = false
    await context.route('https://api.mapbox.com/**', route => {
      if (route.request().url().includes('/styles/v1/')) return styleFailure
        ? route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"fixture invalid token"}' })
        : route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: { fixture: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: '© Mapbox · © OpenStreetMap (fixture)' } }, layers: [{ id: 'fixture-background', type: 'background', paint: { 'background-color': '#0d1638' } }, { id: 'fixture-events', type: 'circle', source: 'fixture' }] }) })
      return route.fulfill({ contentType: 'application/json', body: '{}' })
    })
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', route => {
      const path = new URL(route.request().url()).pathname
      const reply = (data,status=200) => route.fulfill({ status, contentType:'application/json',body:JSON.stringify(data) })
      if(path === '/auth/v1/user') return reply(user)
      if(path === '/rest/v1/rpc/search_public_events') { calls++; queriedBounds.push(route.request().postDataJSON()); return mode === 'error' ? reply({code:'500',message:'fixture'},500) : reply(mode === 'empty' ? [] : mode === 'limit' ? Array.from({length:101}, (_,index) => ({...event,id:'30000000-0000-4000-8000-'+String(index+1).padStart(12,'0')})) : [event]) }
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
    assert.ok(queriedBounds[0].p_south < event.latitude && queriedBounds[0].p_north > event.latitude)
    assert.ok(queriedBounds[0].p_west < event.longitude && queriedBounds[0].p_east > event.longitude)
    if (missingToken) {
      await page.getByText(mapMode === 'webgl' ? /No pudimos cargar el mapa/ : /El mapa no está configurado/).waitFor()
      assert.equal(await page.locator('.mapboxgl-canvas').count(),0)
      await page.getByRole('button',{name:'Ver marcador',exact:true}).click()
    } else {
    await page.locator('.planit-marker').waitFor()
    assert.equal(await page.locator('.planit-marker').count(),1)
    assert.equal(await page.locator('.mapboxgl-ctrl-logo').count(),1)
    assert.equal(await page.locator('.mapboxgl-ctrl-attrib').count(),1)
    await page.getByText('© Mapbox · © OpenStreetMap (fixture)',{exact:true}).waitFor()
    const mapNode = page.locator('.mapboxgl-canvas'); await mapNode.evaluate(el => { el.dataset.instance='same' })
    await page.locator('.planit-marker').focus(); await page.keyboard.press('Enter')
    await page.getByRole('region',{name:'Evento seleccionado'}).waitFor()
    assert.equal(await mapNode.getAttribute('data-instance'),'same')
    const initialCalls = calls
    await page.getByRole('button', { name: 'Cerrar vista previa' }).click()
    if (await page.getByRole('region', { name: 'Evento seleccionado' }).count()) await page.getByRole('button', { name: 'Cerrar vista previa' }).click()
    await page.getByRole('button', { name: 'Ver marcador', exact: true }).click()
    assert.equal(await page.locator('.planit-marker.is-selected').count(), 1)
    assert.equal(calls, initialCalls)
    assert.equal(await page.getByRole('region', { name: 'Evento seleccionado' }).getByRole('link', { name: /Ver detalle de/ }).evaluate(el => el === document.activeElement), true, 'List selection transfers focus to preview')
    await page.getByRole('button', { name: 'Cerrar vista previa' }).click()
    assert.equal(await page.getByRole('button', { name: 'Ver marcador', exact: true }).evaluate(el => el === document.activeElement), true, 'Close restores list trigger focus')
    await page.getByRole('button', { name: 'Ver marcador', exact: true }).click()
    await page.getByRole('button', { name: 'Acercar', exact: true }).click()
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'))
    await page.waitForTimeout(1000)
    assert.ok(calls > initialCalls, 'Zoom triggers viewport discovery')
    const zoomCalls = calls
    await page.locator('.mapboxgl-canvas').focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(1000)
    assert.equal(calls, zoomCalls + 1, 'Keyboard pan triggers one viewport discovery without duplicate listeners')
    assert.equal(await mapNode.getAttribute('data-instance'),'same')
    if (await page.getByRole('region', { name: 'Evento seleccionado' }).count()) await page.getByRole('button', { name: 'Cerrar vista previa' }).click()
    await page.getByRole('button', { name: 'Ver marcador', exact: true }).click()
    }
    await page.getByRole('region',{name:'Evento seleccionado'}).waitFor()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    await page.screenshot({path:`${output}/map-${width}x${height}.png`,fullPage:true})
    await page.getByRole('region',{name:'Evento seleccionado'}).getByRole('link',{name:/Ver detalle de/}).click()
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
      mode='limit'; await page.getByRole('button',{name:'Actualizar eventos'}).click()
      await page.getByText(/Mostramos los primeros 100 eventos/).waitFor()
      assert.equal(await page.locator('.map-page .event-card').count(),100)
      if (!missingToken) assert.equal(await page.locator('.planit-marker').count(),100)
      mode='empty'; await page.getByRole('button',{name:'Actualizar eventos'}).click()
      await page.getByRole('heading',{name:'No hay eventos en esta zona'}).waitFor()
      await page.screenshot({path:`${output}/empty-375x812.png`,fullPage:true})
      mode='error'; await page.getByRole('button',{name:'Actualizar eventos'}).click()
      await page.getByRole('heading',{name:'No se pudo cargar'}).waitFor()
      await page.screenshot({path:`${output}/error-375x812.png`,fullPage:true})
      mode='ok'; await page.getByRole('button',{name:'Reintentar',exact:true}).click()
      await page.getByRole('heading',{name:event.title}).waitFor()
      if (missingToken) await page.getByRole('button',{name:'Ver marcador',exact:true}).click()
      else await page.locator('.planit-marker').click()
      await page.getByRole('region',{name:'Evento seleccionado'}).waitFor()
      await page.getByRole('button',{name:'Cerrar vista previa'}).click()
      if (!missingToken) {
      styleFailure=true
      await page.reload()
      await page.getByText(/No pudimos cargar el mapa/).waitFor()
      await page.getByRole('heading',{name:event.title}).waitFor()
      await page.getByRole('button',{name:'Actualizar eventos'}).click()
      await page.getByRole('heading',{name:event.title}).waitFor()
      await page.screenshot({path:output+'/mapbox-error-375x812.png',fullPage:true})
      }
      mode='missing'; await page.goto(`${origin}/events/${event.id}`)
      await page.getByRole('heading',{name:'Evento no disponible'}).waitFor()
      await page.goto(`${origin}/events/not-a-uuid`)
      await page.getByRole('heading',{name:'Evento no disponible'}).waitFor()
    }
    assert.deepEqual(errors,[])
    await page.goto(`${origin}/login`)
    assert.equal(await page.locator('.mapboxgl-canvas').count(),0)
    metrics.push({width,height,initialCenter:'Buenos Aires',keyboardAndZoom:!missingToken,stableCanvas:!missingToken,style401:width===375&&!missingToken,missingToken,overflow:false,pageErrors:errors,mode:mapMode==='engine'?'real-engine-fixture-style':mapMode,supabase:'intercepted',mapboxService:'not-validated'})
    await context.close()
  }
  await writeFile(`${output}/results.json`,JSON.stringify(metrics,null,2))
  console.log('PASS ('+mapMode+'): responsive, cards/preview/detail, location, limit, empty/error/retry and unmount. '+(missingToken ? 'Map unavailable fallback.' : 'Keyboard markers, stable canvas, pan/zoom and style 401.')+' Fixtures only; no live Mapbox validation.')
} finally { await browser.close() }
