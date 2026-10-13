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
 for(const [width,height,name,large]of [[320,800,'profile',true],[390,844,'notifications',true],[320,240,'chat',false],[390,240,'chat',false],[320,240,'chat',true]]){
  mode='long';await page.setViewportSize({width,height});await page.goto(origin+routes[name]);await page.waitForTimeout(850);await page.evaluate(()=>document.fonts.ready);
  if(large)await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.social-shell *')].filter(n=>n instanceof HTMLElement);const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const[n,s]of sizes)n.style.fontSize=`${s*2}px`;});
  const state=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,header:document.querySelector('.app-header')?.getBoundingClientRect().toJSON(),offscreen:[...document.querySelectorAll('.social-shell *')].filter(n=>n instanceof HTMLElement&&n.getBoundingClientRect().right>innerWidth+1).map(n=>({className:n.className,text:n.textContent.slice(0,60),rect:n.getBoundingClientRect().toJSON()})).slice(0,15),composer:document.querySelector('.chat-composer')?.getBoundingClientRect().toJSON(),rootOverflow:getComputedStyle(document.documentElement).overflow,bodyOverflow:getComputedStyle(document.body).overflow}));
  let focus=null;if(name==='chat'){await page.getByLabel('Mensaje',{exact:true}).focus();await page.getByLabel('Mensaje',{exact:true}).evaluate(n=>n.scrollIntoView({block:'center'}));focus=await page.getByLabel('Mensaje',{exact:true}).evaluate(n=>{const r=n.getBoundingClientRect();return {rect:r.toJSON(),hit:r.top>=0&&r.bottom<=innerHeight&&n.contains(document.elementFromPoint(r.left+5,r.top+5))}});}
  await page.screenshot({path:`${output}/${name}-${width}x${height}-${large?'200':'100'}-viewport.png`});measurements.push({name,width,height,large,state,focus});
 }
 await writeFile(`${output}/measurements.json`,JSON.stringify({sha:'a378259a60106ddd07b111080a24677ad509bc49',environment:'Edge intercepted social fixtures; normal and doubled text, scrollIntoView probe',measurements},null,2));console.log(JSON.stringify(measurements.map(x=>({name:x.name,width:x.width,height:x.height,large:x.large,scrollWidth:x.state.scrollWidth,composer:x.state.composer,focus:x.focus}))));
}finally{await browser.close()}
