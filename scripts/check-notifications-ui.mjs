import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/notifications'
await mkdir(output, { recursive: true })
const a = '20000000-0000-4000-8000-000000000001', b = '20000000-0000-4000-8000-000000000002'
const event = '30000000-0000-4000-8000-000000000001'
const user = id => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' })
const session = id => ({ access_token: 'fixture-'+id, refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user: user(id) })
const key = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
const results = []
const check = test => { results.push({ test, result: 'PASS', environment: 'Playwright fixtures, not real Supabase HTTP/JWT' }); console.log('PASS: '+test) }
try {
  for (const [name, viewport] of [['mobile', { width: 375, height: 812 }], ['desktop', { width: 1280, height: 900 }]]) {
    const context = await browser.newContext({ viewport, timezoneId: 'Asia/Tokyo' })
    await context.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value)) }, { key, value: session(a) })
    const rows = Array.from({ length: 35 }, (_, i) => ({ id: `40000000-0000-4000-8000-${String(100-i).padStart(12,'0')}`, type: 'event_update', title: i === 0 ? 'Actualización del evento' : i === 1 ? 'Aviso sin destino' : `Aviso de prueba ${i}`, body: i === 1 ? null : 'Contenido registrado para esta cuenta. Datos de prueba.', created_at: '2026-10-11T12:30:00', read_at: i === 2 ? '2026-10-11T12:40:00' : null, target: i === 0 ? '/events/'+event : null }))
    let mode = 'success', failMark = false, target = '/events/'+event, denyNextTarget = false, listCalls = 0, markCalls = 0, release = null
    const errors = [], requests = []
  await context.routeWebSocket('**/realtime/v1/websocket**', ws => { ws.onMessage(() => {}) })
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const req = route.request(), url = new URL(req.url()), id = req.headers().authorization?.includes(b) ? b : a
      const reply = (body, status=200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (url.pathname === '/rest/v1/notifications') return route.fulfill({status:200,headers:{'content-range':'0-0/'+(id===a?rows.filter(row=>!row.read_at).length:0),'access-control-expose-headers':'content-range'},contentType:'application/json',body:''})
      if (url.pathname === '/rest/v1/rpc/get_notification_changes') return reply(id===a?rows.filter(row=>req.postDataJSON().p_ids.includes(row.id)).map(row=>({...row,target})):[])
      if (url.pathname === '/auth/v1/user') return reply(user(id))
      if (url.pathname === '/rest/v1/rpc/get_notifications') {
        listCalls++; const params = req.postDataJSON(); requests.push(params)
        assert.deepEqual(Object.keys(params).sort(), ['p_before_at','p_before_id'])
        if (mode === 'delay') await new Promise(resolve => { release = resolve })
        if (mode === 'error') return reply({code:'XX000',message:'fixture error'},500)
        if (mode === 'missing') return reply({code:'PGRST202',message:'not deployed'},404)
        if (mode === 'empty' || id === b) return reply([])
        const start = params.p_before_id ? rows.findIndex(row=>row.id===params.p_before_id)+1 : 0
        return reply(rows.slice(start,start+31).map(row=>({...row,target:row.target?target:null})))
      }
      if (url.pathname === '/rest/v1/rpc/mark_notification_read') {
        markCalls++; const params=req.postDataJSON(); assert.deepEqual(Object.keys(params),['p_id'])
        if(failMark) return reply({code:'42501',message:'unavailable'},403)
        const row=rows.find(item=>item.id===params.p_id); row.read_at ??= '2026-10-11T13:00:00'; return reply(row.read_at)
      }
      if (url.pathname === '/rest/v1/rpc/get_notification_target') {
        // Revoke at the authoritative action check, after listing. Background
        // polling must not race the test by removing its button before the click.
        if (denyNextTarget) { target = null; denyNextTarget = false }
        return reply(target)
      }
      if (url.pathname === '/rest/v1/events') return reply({ id:event,organizer_id:a,title:'Evento de prueba',description:'Fixture',starts_at:'2099-10-11T20:00:00',ends_at:'2099-10-11T22:00:00',address:'Buenos Aires',capacity:10,category_id:'fixture',visibility:'public',cancelled_at:null,archived_at:null })
      return reply([])
    })
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror',error=>errors.push(error.message))
    await page.goto(origin+'/me'); await page.locator('.profile-account').getByRole('link',{name:'Notificaciones',exact:true}).click()
    await page.getByRole('heading',{name:'Actualización del evento',exact:true}).waitFor()
    assert.equal(await page.locator('.notification-row').count(),30)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.getByText(/11.*oct.*2026.*12:30/).first().waitFor()
    assert.equal(await page.locator('.notification-row').nth(1).getByRole('button',{name:'Ver evento'}).count(),0)
    await page.screenshot({path:`${output}/${name}-inbox.png`})
    check(`${name}: CA-01/02 navigation, 30 persisted fixtures, full Argentina date/time even with Tokyo device, read/unread and absent body/target`)
    await page.getByRole('button',{name:'Ver más avisos'}).click(); await page.getByRole('heading',{name:'Aviso de prueba 34',exact:true}).waitFor()
    assert.equal(await page.locator('.notification-row').count(),35); assert.equal(requests.at(-1).p_before_id,rows[29].id)
    check(`${name}: keyset next page and no duplicates`)
    const row = page.locator('.notification-row').first()
    failMark=true; await row.getByRole('button',{name:'Marcar leído'}).click(); await page.getByRole('alert').waitFor(); assert.ok(await row.getByText('No leído',{exact:true}).isVisible())
    failMark=false; await row.getByRole('button',{name:'Marcar leído'}).focus(); await page.keyboard.press('Enter'); await row.getByText('Leído',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Actualizar',exact:true}).click(); await row.getByText('Leído',{exact:true}).waitFor()
    check(`${name}: failed marking stays unread; success and reload reflect persisted read state`)
    denyNextTarget=true; await row.getByRole('button',{name:'Ver evento'}).click(); await page.getByRole('alert').waitFor(); assert.equal(new URL(page.url()).pathname,'/notifications'); assert.equal(await row.getByRole('button',{name:'Ver evento'}).count(),0)
    check(`${name}: access revoked after listing prevents navigation and removes stale action`)
    target='/events/'+event; await page.getByRole('button',{name:'Actualizar',exact:true}).click(); await row.getByRole('button',{name:'Ver evento'}).click(); await page.waitForURL('**/events/'+event)
    check(`${name}: authorized target opens existing event detail`)
    mode='empty'; const before=markCalls; await page.goto(origin+'/notifications'); await page.getByRole('heading',{name:'Todavía no tenés notificaciones'}).waitFor(); assert.equal(markCalls,before)
    await page.screenshot({path:`${output}/${name}-empty.png`,fullPage:true})
    check(`${name}: CA-04 honest empty state without generated notices`)
    mode='error'; await page.getByRole('button',{name:'Actualizar',exact:true}).click(); await page.getByRole('heading',{name:'No se pudo cargar'}).waitFor()
    await page.screenshot({path:`${output}/${name}-error.png`,fullPage:true})
    mode='missing'; await page.getByRole('button',{name:'Reintentar',exact:true}).click(); await page.getByText('La bandeja todavía no está disponible.',{exact:false}).waitFor()
    mode='delay'; await page.getByRole('button',{name:'Reintentar',exact:true}).click(); await page.getByRole('heading',{name:'Cargando notificaciones'}).waitFor()
    await page.waitForFunction(()=>document.querySelector('[aria-busy="true"]'))
    while(!release) await new Promise(resolve=>setTimeout(resolve,20))
    mode='success';release(); await page.getByRole('heading',{name:'Actualización del evento',exact:true}).waitFor()
    check(`${name}: loading, network error, missing migration and retry recovery`)
    const calls=listCalls; await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); for(let attempt=0;attempt<100&&listCalls===calls;attempt++) await page.waitForTimeout(10); await page.waitForFunction(()=>document.querySelector('.notification-row'))
    await page.getByRole('heading',{name:'Actualización del evento',exact:true}).waitFor(); assert.ok(listCalls>calls)
    release=null; mode='delay'; await page.getByRole('button',{name:'Actualizar',exact:true}).click()
    await page.getByRole('heading',{name:'Cargando notificaciones'}).waitFor()
    while(!release) await new Promise(resolve=>setTimeout(resolve,20))
    mode='success'
    await page.evaluate(({key,value})=>{
      const oldValue=localStorage.getItem(key),newValue=JSON.stringify(value)
      localStorage.setItem(key,newValue);window.dispatchEvent(new StorageEvent('storage',{key,oldValue,newValue,storageArea:localStorage}))
      const channel=new BroadcastChannel(key);channel.postMessage({event:'SIGNED_IN',session:value});channel.close()
    },{key,value:session(b)})
    await page.getByRole('heading',{name:'Todavía no tenés notificaciones'}).waitFor();assert.equal(await page.locator('.notification-row').count(),0)
    release(); await page.waitForTimeout(100);assert.equal(await page.locator('.notification-row').count(),0)
    check(`${name}: focus refresh and cross-tab account change discard old account rows and late A response`)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
    await context.close()
  }
  const context=await browser.newContext(); const page=await context.newPage();await page.goto(origin+'/notifications');await page.waitForURL(url=>url.pathname==='/login')
  check('Anonymous direct route redirects to login');await context.close()
  await writeFile(output+'/ui-results.json',JSON.stringify({results},null,2))
} finally { await browser.close() }
