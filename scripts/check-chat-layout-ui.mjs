import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4181'
const baseline = process.env.PLANIT_CHAT_BASELINE === '1'
const output = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/chat-layout'
await mkdir(output, { recursive: true })
const user = { id: '20000000-0000-4000-8000-000000000001', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const event = '30000000-0000-4000-8000-000000000001'
const conversation = '50000000-0000-4000-8000-000000000001'
const results = []
try {
  for (const [width, height] of [[360,800], [375,812], [390,844], [1280,900]]) {
    const context = await browser.newContext({ viewport: { width, height } })
    await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), user)
    const rows = Array.from({ length: 65 }, (_, n) => ({ id: `40000000-0000-4000-8000-${String(n).padStart(12,'0')}`, sender_id: n % 3 ? 'other' : user.id, display_name: 'Sofía de prueba', username: 'sofia_fixture', body: `Mensaje ${n} · Nos encontramos en el evento.`, created_at: `2026-10-11T12:00:00.${String(n).padStart(6,'0')}` }))
    const joins = new Map()
    let socket
    await context.routeWebSocket('**/realtime/v1/websocket**', ws => {
      socket = ws
      ws.onMessage(raw => {
        const [joinRef, ref, topic, type, payload] = JSON.parse(String(raw))
        if (type === 'phx_join') {
          const bindings = (payload.config?.postgres_changes ?? []).map((binding, index) => ({ ...binding, id: index+1 }))
          joins.set(topic, { joinRef, bindings })
          ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: bindings } }]))
        } else if (type === 'phx_leave') { joins.delete(topic); ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}])) }
        else if (type === 'heartbeat') ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]))
      })
    })
    let state = 'open'
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const path = new URL(route.request().url()).pathname
      const reply = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/auth/v1/user') return reply(user)
      if (path.endsWith('/get_event_chat')) return reply([{ conversation_id: conversation, title: 'Encuentro de música · prueba', event_state: state }])
      if (path.endsWith('/get_event_chat_messages')) {
        const p = route.request().postDataJSON()
        return reply([...rows].reverse().filter(row => !p.p_before_id || row.created_at < p.p_before_at || row.created_at === p.p_before_at && row.id < p.p_before_id).slice(0,51))
      }
      if (path.endsWith('/send_event_chat_message')) {
        const p = route.request().postDataJSON()
        rows.push({ ...rows.at(-1), id: p.p_message_id, sender_id: user.id, body: p.p_body, created_at: '2026-10-11T13:00:00.000000' })
        emit(rows.at(-1)); return reply(p.p_message_id)
      }
      return reply([])
    })
    function emit(row) {
      for (const [topic, join] of joins) {
        const ids = join.bindings.filter(b => b.table === 'messages').map(b => b.id)
        if (ids.length) socket.send(JSON.stringify([join.joinRef,null,topic,'postgres_changes',{ ids, data: { schema:'public',table:'messages',type:'INSERT',commit_timestamp:'2026-10-11T16:00:00Z',errors:null,columns:[],record:{...row,conversation_id:conversation},old_record:{} } }]))
      }
    }
    const page = await context.newPage()
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/events/${event}/chat`)
    await page.getByText('Mensajes en tiempo real.', { exact:true }).waitFor()
    await page.getByText(rows.at(-1).body, { exact:true }).waitFor()
    const history = page.locator('.chat-messages')
    async function geometry() {
      return page.evaluate(() => {
        const list = document.querySelector('.chat-messages'), composer = document.querySelector('.chat-composer')
        const rect = element => { const r = element.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, height:r.height } }
        return { pageHeight:document.documentElement.scrollHeight, viewport:innerHeight, pageScroll:scrollY, list:rect(list), composer:composer && rect(composer), last:rect(list.lastElementChild), bottomGap:list.scrollHeight-list.scrollTop-list.clientHeight }
      })
    }
    const before = await geometry()
    await page.screenshot({ path:`${output}/${baseline?'before':'after'}-${width}x${height}.png`, fullPage:true })
    if (baseline) { results.push({ width,height,geometry:before }); await context.close(); continue }
    async function assertLayout(lastVisible = false) {
      const g = await geometry()
      assert.ok(g.pageHeight <= g.viewport, JSON.stringify(g))
      assert.equal(g.pageScroll, 0)
      assert.ok(g.list.height > 0)
      if (g.composer) { assert.ok(g.composer.bottom <= g.viewport+1); assert.ok(g.list.bottom <= g.composer.top+1) }
      if (lastVisible) { assert.ok(g.last.bottom <= g.list.bottom+1); assert.ok(g.bottomGap < 2) }
      assert.equal(await page.locator('.app-header, .primary-nav').count(), 0)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    }
    await assertLayout(true)
    await page.mouse.move(width/2, height-40); await page.mouse.wheel(0,1000)
    await assertLayout(true)
    await page.mouse.move(width/2, height/2); await page.mouse.wheel(0,1000)
    await assertLayout(true)
    await page.getByLabel('Mensaje',{exact:true}).fill('Mensaje enviado desde el formulario')
    await page.getByRole('button',{name:'Enviar',exact:true}).click()
    await page.getByText('Mensaje enviado desde el formulario',{exact:true}).waitFor()
    await assertLayout(true)
    await history.evaluate(el => el.scrollTop = 400)
    const anchor = await history.evaluate(el => {
      const child = [...el.children].find(child => child.getBoundingClientRect().bottom > el.getBoundingClientRect().top)
      return { id:child.dataset.messageId, offset:child.getBoundingClientRect().top-el.getBoundingClientRect().top }
    })
    await page.getByRole('button',{name:'Cargar mensajes anteriores'}).click()
    await page.getByText(rows[0].body,{exact:true}).waitFor()
    const offset = await history.evaluate((el, id) => el.querySelector(`[data-message-id="${id}"]`).getBoundingClientRect().top-el.getBoundingClientRect().top, anchor.id)
    assert.ok(Math.abs(offset-anchor.offset) < 2)
    const top = await history.evaluate(el => el.scrollTop)
    const incoming = { ...rows.at(-1), id:'new-incoming', sender_id:'other', body:'Nuevo mensaje mientras leés el historial', created_at:'2026-10-11T14:00:00.000000' }
    rows.push(incoming); emit(incoming)
    await page.getByText(incoming.body,{exact:true}).waitFor()
    assert.ok(Math.abs(await history.evaluate(el => el.scrollTop)-top) < 2)
    await page.getByLabel('Mensaje',{exact:true}).focus()
    await page.setViewportSize({width,height:420})
    await page.waitForFunction(() => document.querySelector('.chat-shell').getBoundingClientRect().height === 420)
    await assertLayout()
    assert.equal(await page.locator('#chat-text:focus').count(),1)
    await history.evaluate(el => el.scrollTop = el.scrollHeight)
    await page.setViewportSize({width,height:500})
    await page.waitForFunction(() => document.querySelector('.chat-shell').getBoundingClientRect().height === 500)
    await page.waitForFunction(() => { const el=document.querySelector('.chat-messages'); return el.scrollHeight-el.scrollTop-el.clientHeight<2 })
    await assertLayout(true)
    await page.screenshot({path:`${output}/keyboard-height-${width}.png`})
    await page.setViewportSize({width,height})
    await page.waitForFunction(height => document.querySelector('.chat-shell').getBoundingClientRect().height === height, height)
    // Exercise visual viewport shrink + offset independently from layout viewport (iOS keyboard/panning).
    await page.evaluate(() => {
      Object.defineProperties(visualViewport,{height:{configurable:true,value:400},offsetTop:{configurable:true,value:32}})
      visualViewport.dispatchEvent(new Event('resize')); visualViewport.dispatchEvent(new Event('scroll'))
    })
    const form = await page.locator('.chat-composer').boundingBox()
    assert.ok(form.y >= 32 && form.y+form.height <= 433)
    await page.evaluate(() => { delete visualViewport.height; delete visualViewport.offsetTop; visualViewport.dispatchEvent(new Event('resize')) })
    const safeAreas = await page.addStyleTag({ content: '.chat-header { padding-top: 32px; } .chat-composer { padding-bottom: 34px; }' })
    await page.waitForFunction(() => { const el=document.querySelector('.chat-messages'); return el.scrollHeight-el.scrollTop-el.clientHeight<2 })
    await assertLayout(true)
    await safeAreas.evaluate(el => el.remove())
    state='ended'; await page.getByRole('button',{name:'Actualizar chat'}).click()
    await page.getByText('Evento finalizado · Chat de sólo lectura.').waitFor()
    await assertLayout()
    assert.equal(await page.locator('#chat-text').count(),0)
    await page.evaluate(() => { history.pushState(null,'','/my-events'); window.dispatchEvent(new PopStateEvent('popstate')) })
    await page.locator('.app-header').waitFor(); await page.locator('.primary-nav').waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('chat-active')),false)
    assert.deepEqual(errors,[])
    results.push({width,height,result:'PASS',geometry:before,scenarios:['single scroll','last message','send','pagination anchor','incoming reader position','keyboard height and bottom pinning','visual viewport offset','read only','route cleanup']})
    await context.close()
  }
  await writeFile(`${output}/${baseline?'before':'after'}-results.json`,JSON.stringify({environment:'Edge; intercepted Auth/RPC/Phoenix fixtures; no remote writes',results},null,2))
  console.log(JSON.stringify(results,null,2))
} finally { await browser.close() }
