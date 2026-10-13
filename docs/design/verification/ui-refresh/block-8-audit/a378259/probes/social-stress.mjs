import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const phase = process.argv[2] ?? 'after'
const output = process.env.PLANIT_UI_OUTPUT
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4187'
await mkdir(output, { recursive: true })
const id = '20000000-0000-4000-8000-000000000001', event = '30000000-0000-4000-8000-000000000001'
const user = { id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
const results = []
try {
  const context = await browser.newContext()
  await context.addInitScript(user => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), user)
  let mode = 'full'
  await context.routeWebSocket('**/realtime/v1/websocket**', ws => ws.onMessage(raw => {
    const [join, ref, topic, type, payload] = JSON.parse(String(raw))
    if (type === 'phx_join') ws.send(JSON.stringify([join, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: (payload.config?.postgres_changes ?? []).map((binding, index) => ({ ...binding, id: index+1 })) } }]))
    if (type === 'heartbeat' || type === 'phx_leave') ws.send(JSON.stringify([join, ref, topic, 'phx_reply', { status: 'ok', response: {} }]))
  }))
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const url = new URL(route.request().url())
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/auth/v1/user') return reply(user)
    if (url.pathname === '/rest/v1/notifications') return route.fulfill({ status: 200, headers: { 'content-range': '0-0/3' }, body: '' })
    if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 2000))
    if (mode === 'error') return reply({ message: 'Fixture offline', code: '500' }, 500)
    if (url.pathname.endsWith('/profiles')) return reply({ display_name: mode === 'long' ? 'Nombre de perfil muy largo '.repeat(6) : 'Ana de prueba', username: mode === 'long' ? 'usuario_extenso_'.repeat(8) : 'ana_fixture', bio: mode === 'empty' ? null : mode === 'long' ? 'Biografía extensa de prueba. '.repeat(35) : 'Me gusta compartir planes y conocer lugares nuevos.', avatar_file_id: null })
    if (url.pathname.endsWith('/get_event_chat')) return reply([{ conversation_id: '50000000-0000-4000-8000-000000000001', title: 'Encuentro de la comunidad fixture', event_state: mode === 'readonly' ? 'ended' : 'open' }])
    if (url.pathname.endsWith('/get_event_chat_messages')) return reply(mode === 'empty' ? [] : Array.from({ length: 51 }, (_, n) => ({ id: `40000000-0000-4000-8000-${String(60-n).padStart(12,'0')}`, sender_id: n % 2 ? id : 'other', display_name: 'Sofía de prueba', username: 'sofia_fixture', body: mode === 'long' ? 'Mensaje largo sin perder el contexto. '.repeat(15) + 'x'.repeat(120) : `Mensaje ${60-n}: Nos encontramos en el evento.`, created_at: `2026-10-11T12:00:00.${String(60-n).padStart(6,'0')}` })))
    if (url.pathname.endsWith('/get_notifications')) return reply(mode === 'empty' ? [] : Array.from({ length: 6 }, (_, n) => ({ id: `60000000-0000-4000-8000-${String(n).padStart(12,'0')}`, type: n % 2 ? 'chat' : 'event_update', title: mode === 'long' ? 'Actualización de tu evento '.repeat(8) : `Aviso de prueba ${n+1}`, body: mode === 'long' ? 'Contenido extenso de prueba. '.repeat(20) : 'Consultá las novedades de tu evento.', read_at: n % 2 ? '2026-10-11T14:00:00' : null, created_at: '2026-10-11T12:00:00', target: `/events/${event}` })))
    return reply([])
  })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  const routes = { chat: `/events/${event}/chat`, profile: '/me', notifications: '/notifications' }
 const measurements=[];
 for(const [width,height] of [[320,800],[360,800],[375,812],[390,844],[768,1024],[1280,900]])for(const [name,route] of Object.entries(routes)){
  mode='long';await page.setViewportSize({width,height});await page.goto(origin+route);await page.waitForTimeout(850);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.social-shell *')].filter(n=>n instanceof HTMLElement);const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const [n,s]of sizes)n.style.fontSize=`${s*2}px`;});
  await page.waitForTimeout(150);
  const measure=()=>page.evaluate(()=>{const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,bottom:r.bottom}};const controls=[...document.querySelectorAll('main button,main a,main input,main textarea')].filter(n=>n.getBoundingClientRect().width);return {overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth,viewport:{width:innerWidth,height:innerHeight},composer:document.querySelector('.chat-composer')?rect(document.querySelector('.chat-composer')):null,controls:controls.map(n=>({name:n.getAttribute('aria-label')??n.textContent.trim().slice(0,50),...rect(n),scrollWidth:n.scrollWidth,clientWidth:n.clientWidth})),clipped:[...document.querySelectorAll('main *')].filter(n=>n instanceof HTMLElement && n.scrollWidth>n.clientWidth+1 && getComputedStyle(n).overflowX==='hidden').map(n=>({tag:n.tagName,className:n.className,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,text:n.textContent.slice(0,60)}))};});
  let state=await measure();measurements.push({name,state:'long-text-200',width,height,...state});await page.screenshot({path:`${output}/${name}-text200-${width}.png`,fullPage:name!=='chat'});
  if(width===320||width===390){await page.setViewportSize({width,height:240});await page.waitForTimeout(200);state=await measure();measurements.push({name,state:'long-text-200-height240',width,height:240,...state});await page.screenshot({path:`${output}/${name}-text200-short-${width}.png`});}
 }
 await writeFile(`${output}/measurements.json`,JSON.stringify({sha:'a378259a60106ddd07b111080a24677ad509bc49',environment:'Edge fixture; computed text sizes collected once then doubled, long fixtures; no native zoom or mobile keyboard',measurements,errors},null,2));
 console.log(JSON.stringify({captures:measurements.length,overflow:measurements.filter(x=>x.overflow).map(x=>({name:x.name,width:x.width,state:x.state})),composerOutside:measurements.filter(x=>x.composer&&(x.composer.top<0||x.composer.bottom>x.viewport.height)).map(x=>({name:x.name,width:x.width,state:x.state,composer:x.composer})),errors}));
}finally{await browser.close()}
