import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// R4 block 8 UI check: Edge against the production build (`dist`) with Auth/REST/Storage
// intercepted and WebSocket blocked. Fixture evidence only: NOT real JWT/HTTP.
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-8/ui'
await mkdir(output, { recursive: true })
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const origin = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
const ana = '20000000-0000-4000-8000-000000000001', bruno = '20000000-0000-4000-8000-000000000002'
const eventId = '30000000-0000-4000-8000-000000000001'
const event = { id: eventId, organizer_id: ana, category_id: '10000000-0000-4000-8000-000000000001', title: 'Encuentro de fotografía', description: 'Fixture local de un evento oculto.',
  starts_at: '2099-10-15T18:00:00', ends_at: '2099-10-15T20:00:00', address: 'Buenos Aires', location_name: 'Centro cultural', latitude: -34.6, longitude: -58.38, capacity: 10, visibility: 'unlisted', cancelled_at: null, archived_at: null }
const user = id => ({ id, email: `${id === ana ? 'ana' : 'bruno'}@example.invalid`, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = (id, suffix = '') => ({ access_token: `fixture-${id}${suffix}`, refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(id) })
const results = [], shots = []
const check = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' }
const root = resolve(process.env.PLANIT_UI_DIST ?? 'dist')
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`)
    assert.ok(path === root || path.startsWith(root + sep))
    const file = extname(path) ? path : resolve(root, 'index.html')
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file))
  } catch { res.statusCode = 404; res.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })

async function open(width, height, { state = 'open', fail = '', signedAs = ana, empty = false, delay = 0 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Argentina/Buenos_Aires', reducedMotion: 'reduce', serviceWorkers: 'block' })
  const script = { state, fail, visible: true, delay, readError: '', pageTwo: false, photos:false }
  const row = { id: '40000000-0000-4000-8000-000000000001', user_id: bruno, display_name: 'Bruno Rodríguez', username: 'bruno', avatar_url: null, status: 'active', is_confirmed: true }
  const extra = { ...row, id: '40000000-0000-4000-8000-000000000002', user_id: '20000000-0000-4000-8000-000000000003', display_name: 'Camila Fernández', username: 'camila', is_confirmed: false }
  const log = { writes: [], reads: [], errors: [], eventReads: 0, signed:[], unexpected: [] }
  if (signedAs) await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value: session(signedAs) })
  await context.route(`${origin}/**`, async route => {
    const req = route.request(), path = new URL(req.url()).pathname
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/auth/v1/user') return reply(user(signedAs))
    if (path === '/rest/v1/notifications') return reply([])
    if (path === '/rest/v1/rpc/get_event_access_grants') {
      const args = req.postDataJSON(); log.reads.push(args)
      if (script.delay) await new Promise(r=>setTimeout(r,script.delay))
      if (script.readError) { const error = script.readError; script.readError=''; return reply({ code:'P0001',message:error },400) }
      if (signedAs !== ana) return reply({ code:'42501',message:'access_denied' },403)
      if (script.state === 'public') return reply({ code:'P0001',message:'event_not_hidden' },400)
      if (script.state === 'error') return route.abort('failed')
      const rows = empty ? [] : [row,extra].filter(r=>r.status===args.p_status && (!args.p_after_id || r.id>args.p_after_id))
      return reply({ title:event.title, event_state:script.state, grants:script.pageTwo?rows.slice(0,1):rows, next_cursor:script.pageTwo&&rows.length>1?rows[0].id:null })
    }
    if (/\/rpc\/(revoke_event_access|restore_event_access)$/.test(path)) {
      log.writes.push({path,args:req.postDataJSON()})
      await new Promise(r=>setTimeout(r,180))
      const fail = script.fail; script.fail=''
      if (fail === 'denied') return reply({code:'42501',message:'access_denied'},403)
      if (fail === 'missing') return reply({code:'P0001',message:'access_grant_missing'},400)
      if (fail !== 'network-before') { row.status=path.endsWith('revoke_event_access')?'revoked':'active'; row.is_confirmed=false }
      if (fail === 'network-after' || fail === 'network-before') return route.abort('failed')
      return reply(null)
    }
    if (path === '/rest/v1/events') { log.eventReads++; return reply(script.visible?[event]:[]) }
    if (path === '/rest/v1/categories') return reply([{id:event.category_id,name:'Arte',is_active:true}])
    if (path === '/rest/v1/event_images') return reply(script.photos?[{files:{storage_path:'fixture.png'}}]:[])
    if (path === '/storage/v1/object/sign/event_media') { log.signed.push(req.postDataJSON()); return reply([{path:'fixture.png',signedURL:'/object/sign/event_media/fixture.png?token=fixture-media'}]) }
    if (path === '/storage/v1/object/sign/event_media/fixture.png') return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#c5b5ff"/></svg>'})
    if (path === '/rest/v1/rpc/get_event_organizer') return reply([{display_name:'Ana',username:'ana'}])
    if (path === '/rest/v1/rpc/get_event_link_status') return reply(false)
    if (path === '/rest/v1/rpc/get_event_participation_summary') return reply([{confirmed_count:1,capacity:10,available_spots:9,own_status:null,is_organizer:signedAs===ana,event_state:'open'}])
    if (path === '/rest/v1/rpc/get_event_chat') return script.visible?reply([{conversation_id:eventId,title:event.title,event_state:'open'}]):reply({code:'42501',message:'chat_unavailable'},403)
    if (path === '/rest/v1/rpc/get_event_chat_messages') return reply([{id:'50000000-0000-4000-8000-000000000001',sender_id:ana,body:'Mensaje privado fixture',created_at:'2026-10-13T19:00:00',display_name:'Ana',username:'ana'}])
    if (path === '/rest/v1/rpc/get_event_attendees') return reply({title:event.title,capacity:10,confirmed_count:1,removed_count:0,pending_count:0,event_state:'open',has_more:false,attendees:[{participation_id:row.id,user_id:bruno,status:'confirmed',username:row.username,display_name:row.display_name}]})
    log.unexpected.push(path); return reply([])
  })
  await context.routeWebSocket(/.*/,socket=>socket.close())
  const page = await context.newPage(); page.on('pageerror',e=>log.errors.push(e.message))
  return {context,page,script,log,row,extra}
}
const shot = async (page,name) => { shots.push(name); await page.screenshot({path:`${output}/${name}.png`,fullPage:true,animations:'disabled',caret:'hide'}) }
async function geometry(page) {
  const g = await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth>innerWidth,
    font:getComputedStyle(document.querySelector('h1')).fontFamily,
    shell:Boolean(document.querySelector('.amanecer-shell.event-management-shell')),
    wash:document.querySelectorAll('.management-wash[aria-hidden=true]').length,
    dock:document.querySelectorAll('.primary-nav a').length,
    controls:[...document.querySelectorAll('.access-page button:not(dialog button),.management-back')].filter(e=>e.getBoundingClientRect().height).map(e=>({name:e.textContent.trim(),height:e.getBoundingClientRect().height})),
  }))
  assert.equal(g.overflow,false); assert.equal(g.shell,true); assert.equal(g.wash,1); assert.equal(g.dock,4); assert.ok(g.font.includes('Bricolage'))
  for(const c of g.controls) assert.ok(c.height>=44,`${c.name} target ${c.height}`)
  return g
}
const go = page => page.goto(`${base}/events/${eventId}/access`)
const dialog = page => page.getByRole('dialog')
const ready = page => page.getByRole('button',{name:'Revocar acceso de Bruno Rodríguez'}).waitFor()
try {
  if(process.argv.includes('--baseline')) {
    for(const [width,height] of [[375,812],[1280,900]]) {
      const {page,context,log} = await open(width,height)
      await page.goto(`${base}/events/${eventId}`); await page.getByRole('heading',{name:event.title,exact:true}).waitFor()
      await shot(page,`baseline-detail-${width}`)
      await page.goto(`${base}/events/${eventId}/attendees`); await page.getByText('@bruno',{exact:true}).waitFor()
      await shot(page,`baseline-attendees-${width}`); assert.deepEqual(log.errors,[]); await context.close()
    }
    check('Immutable 818e892 build baseline: detail/attendees at 375 and 1280')
  } else {
    const geometries=[]
    for(const [width,height] of [[320,800],[375,812],[390,844],[768,1024],[1280,900]]) {
      const {page,context,log} = await open(width,height)
      await go(page); await ready(page); await page.evaluate(()=>document.fonts.ready)
      geometries.push({width,...await geometry(page)})
      await shot(page,`active-${width}`)
      const trigger = page.getByRole('button',{name:'Revocar acceso de Bruno Rodríguez'})
      await trigger.click(); await dialog(page).waitFor(); await shot(page,`revoke-${width}`)
      assert.ok(await dialog(page).getByRole('button',{name:'Cancelar',exact:true}).evaluate(e=>e===document.activeElement))
      await page.keyboard.press('Shift+Tab'); assert.ok(await dialog(page).getByRole('button',{name:'Cerrar confirmación',exact:true}).evaluate(e=>e===document.activeElement))
      await page.keyboard.press('Shift+Tab'); assert.ok(await dialog(page).getByRole('button',{name:'Revocar acceso',exact:true}).evaluate(e=>e===document.activeElement))
      await page.keyboard.press('Escape'); await dialog(page).waitFor({state:'hidden'}); await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Revocar acceso de Bruno Rodríguez')
      await trigger.click(); assert.ok((await dialog(page).textContent()).includes('También se removerá'))
      const confirm = dialog(page).getByRole('button',{name:'Revocar acceso',exact:true})
      await confirm.evaluate(e=>{e.click();e.click()})
      await dialog(page).waitFor({state:'hidden'}); assert.equal(log.writes.length,1)
      await page.getByRole('button',{name:'Revocados',exact:true}).click()
      await page.getByRole('button',{name:'Restituir acceso de Bruno Rodríguez'}).click()
      assert.ok((await dialog(page).textContent()).includes('no lo reinscribe'))
      await shot(page,`restore-${width}`)
      await dialog(page).getByRole('button',{name:'Restituir acceso',exact:true}).click(); await dialog(page).waitFor({state:'hidden'})
      assert.equal(log.writes.length,2); assert.ok(log.reads.length>=4)
      await page.getByRole('button',{name:'Activos',exact:true}).click(); await ready(page)
      await page.getByRole('link',{name:'Volver al evento'}).click(); await page.getByRole('link',{name:'Gestionar accesos'}).waitFor()
      assert.deepEqual(log.errors,[]); assert.deepEqual(log.unexpected,[]); await context.close()
      check(`${width}px active/revoked, double-click protection, dialog focus/Escape/return, revoke/restore reconciliation and management link`)
    }
    for(const state of ['ended','cancelled','archived','public','error']) {
      const {page,context,script,log} = await open(375,812,{state})
      await go(page)
      if(state==='public') await page.getByText('Los accesos individuales se administran',{exact:false}).waitFor()
      else if(state==='error') { await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor(); script.state='open'; await page.getByRole('button',{name:'Reintentar',exact:true}).click(); await ready(page) }
      else { await page.getByText('Accesos de sólo lectura.',{exact:false}).waitFor(); assert.equal(await page.getByRole('button',{name:'Revocar acceso de Bruno Rodríguez'}).count(),0) }
      await shot(page,state); assert.equal(log.writes.length,0); await context.close(); check(`${state}: read-only/unavailable/retry`)
    }
    for(const fail of ['network-before','network-after','denied','missing']) {
      const {page,context,log} = await open(375,812,{fail})
      await go(page); await ready(page); await page.getByRole('button',{name:'Revocar acceso de Bruno Rodríguez'}).click()
      await dialog(page).getByRole('button',{name:'Revocar acceso',exact:true}).click()
      await dialog(page).getByRole('button',{name:'Comprobar estado',exact:true}).waitFor()
      if(fail.startsWith('network')) {
        await dialog(page).getByRole('button',{name:'Comprobar estado',exact:true}).click()
        if(fail==='network-before') { await dialog(page).getByRole('button',{name:'Revocar acceso',exact:true}).waitFor(); await dialog(page).getByRole('button',{name:'Revocar acceso',exact:true}).click() }
        await dialog(page).waitFor({state:'hidden'}); assert.equal(log.writes.length,fail==='network-before'?2:1)
      } else await page.keyboard.press('Escape')
      await context.close(); check(`${fail}: uncertain-state reconciliation / permission or missing-grant feedback`)
    }
    {
      const {page,context,script} = await open(375,812)
      script.pageTwo=true; await go(page); await ready(page)
      await page.getByRole('button',{name:'Cargar más accesos'}).click(); await page.getByText('@camila',{exact:true}).waitFor(); assert.equal(await page.locator('.access-list > li').count(),2)
      script.delay=200; await page.getByRole('button',{name:'Actualizar accesos'}).click(); await page.getByRole('button',{name:'Revocados',exact:true}).click()
      await page.getByRole('heading',{name:'No hay accesos revocados'}).waitFor(); assert.equal(await page.locator('.access-list > li').count(),0)
      await context.close(); check('Cursor append deduplicated; stale active response discarded after filter switch')
    }
    {
      const {page,context} = await open(320,560,{empty:true})
      await go(page); await page.getByRole('heading',{name:'No hay accesos activos'}).waitFor(); await shot(page,'empty')
      await context.close(); check('Empty grants explain invitation without enrolment')
    }
    {
      const {page,context,log} = await open(375,812,{signedAs:bruno})
      await go(page); await page.getByRole('heading',{name:'Accesos no disponibles'}).waitFor(); assert.equal(log.writes.length,0)
      await context.close(); check('Non-owner denied direct route')
    }
    {
      const {page,context} = await open(375,812,{signedAs:null})
      await go(page); await page.getByRole('heading',{name:'Ingresá a PlanIt',exact:true}).waitFor()
      await context.close(); check('Anonymous direct route requires Auth')
    }
    {
      const {page,context,script,log} = await open(375,812,{signedAs:bruno})
      script.photos=true
      await page.clock.install(); await page.goto(`${base}/events/${eventId}`); await page.getByRole('heading',{name:event.title,exact:true}).waitFor()
      await page.getByRole('img',{name:`Foto de ${event.title}`,exact:true}).waitFor(); assert.equal(log.signed[0].expiresIn,60)
      const reads=log.eventReads; script.visible=false
      await page.clock.runFor(30001); await page.getByRole('heading',{name:'Evento no disponible',exact:true}).waitFor()
      assert.ok(log.eventReads>reads); assert.equal(await page.getByRole('heading',{name:event.title,exact:true}).count(),0)
      assert.equal(await page.getByRole('img',{name:`Foto de ${event.title}`,exact:true}).count(),0)
      assert.equal(log.signed.length,1)
      await context.close(); check('Visible hidden detail revalidates after 30s, clears signed media/data and does not renew denied media; TTL 60s')
    }
    {
      const {page,context,script} = await open(375,812,{signedAs:bruno})
      await page.clock.install(); await page.goto(`${base}/events/${eventId}/chat`)
      await page.getByText('Mensaje privado fixture',{exact:true}).waitFor(); script.visible=false
      await page.clock.runFor(30001); await page.getByRole('heading',{name:'Chat no disponible',exact:true}).waitFor()
      assert.equal(await page.getByText('Mensaje privado fixture',{exact:true}).count(),0)
      assert.equal(await page.locator('.chat-composer').count(),0)
      await context.close(); check('Existing chat revalidation clears private history and composer when permission is lost')
    }
    {
      const {page,context} = await open(320,300)
      await go(page); await ready(page); await page.addStyleTag({content:'.access-page {font-size:200%} .attendee-identity strong,.attendee-identity span {font-size:inherit}'}); await geometry(page)
      await page.getByRole('button',{name:'Revocar acceso de Bruno Rodríguez'}).click()
      const fits=await dialog(page).evaluate(e=>e.getBoundingClientRect().height<=innerHeight && e.scrollHeight>=e.clientHeight); assert.equal(fits,true)
      await shot(page,'large-text-low-height'); await context.close(); check('320px enlarged text and low-height dialog remains scrollable')
    }
    await writeFile(`${output}/geometry.json`,JSON.stringify(geometries,null,2))
  }
  await writeFile(`${output}/results.json`,JSON.stringify({environment:'Edge production build; intercepted Auth/REST/Storage; blocked WebSocket; fixtures, NOT real JWT',results,shots},null,2))
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)) }
