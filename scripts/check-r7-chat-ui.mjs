import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const root = resolve('dist'), out = 'docs/qa/r7-block-3/ui'
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const sourceHashes = Object.fromEntries(await Promise.all(['src/features/events/chat.ts','src/pages/EventChatPage.tsx','src/pages/chat.css'].map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])))
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  const file = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname)
  if (!file.startsWith(root + '/') && !file.startsWith(root + '\\')) { res.writeHead(403); res.end(); return }
  try { res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file)) }
  catch { res.setHeader('Content-Type', 'text/html'); res.end(await readFile(resolve(root, 'index.html'))) }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
process.env.PLANIT_UI_ORIGIN = `http://127.0.0.1:${server.address().port}`
process.env.PLANIT_PLAYWRIGHT_PATH ??= 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
await mkdir(out, { recursive: true })
try {
  if (process.env.PLANIT_CHAT_BASELINE === '1') {
    process.env.PLANIT_UI_OUTPUT = `${out}/before`
    await import('./check-chat-layout-ui.mjs')
  } else if (process.env.PLANIT_CHAT_REGRESSION === 'dm') {
    process.env.PLANIT_UI_OUTPUT = `${out}/regression-dm`
    await import('./check-r5-messages-ui.mjs')
    const path = `${out}/regression-dm/ui-results.json`, result = JSON.parse(await readFile(path,'utf8'))
    await writeFile(path,JSON.stringify({...result,base:revision,branch:'codex/r7-block-3',sourceHashes,harness:'Unmodified R5 DM regression; metadata updated by B3 wrapper to identify the actual tested build'},null,2))
  } else {
    await run()
  }
} finally { server.close() }

async function run() {
  const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH).href)
  const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--no-proxy-server'] })
  try { await checks(browser) } finally { await browser.close() }
}

async function checks(browser) {
  const viewer = '20000000-0000-4000-8000-000000000001', event = '30000000-0000-4000-8000-000000000001'
  const user = { id: viewer, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-10T12:00:00Z' }
  const session = { access_token: 'fixture-token', refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user }
  const results = []
  for (const width of [320,375,390,768,1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
    await context.addInitScript(session => {
      localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(session))
      const live = new Set(), create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
      URL.createObjectURL = blob => { const url = create(blob); live.add(url); return url }
      URL.revokeObjectURL = url => { live.delete(url); revoke(url) }
      window.__liveBlobs = live
    }, session)
    let state = 'open', denied = false, getDenied = false, uploadFailed = false, rpcFail = '', commitLost = false, validationFailed = false
    const writes = [], reservations = [], gets = [], uploads = [], sockets = []
    const seed = i => ({ id: `40000000-0000-4000-8000-${String(i).padStart(12,'0')}`, sender_id: 'other', display_name: 'Sofía fixture', username: 'sofia_fixture', body: `Mensaje fixture ${i}`, created_at: `2026-10-11T12:00:00.${String(i).padStart(6,'0')}`, attachment_id: null, file_id: null, bucket_name: null, storage_path: null, mime_type: null, size_bytes: null })
    const rows = Array.from({ length: 65 }, (_, i) => seed(i))
    let png
    const mediaFor = p => {
      const reservation = reservations.find(r => r.p_file_id === p.p_file_id)
      return { attachment_id: p.p_file_id, file_id: p.p_file_id, bucket_name: 'event_media', storage_path: `r7/chat/${viewer}/${event}/${reservation.p_attempt_id}.png`, mime_type: 'image/png', size_bytes: png.length }
    }
    await context.routeWebSocket('**/realtime/v1/websocket**', ws => {
      const joins = new Map(); sockets.push({ ws, joins })
      ws.onMessage(raw => {
        const [join, ref, topic, type, payload] = JSON.parse(String(raw))
        if (type === 'phx_join') { const bindings = (payload.config?.postgres_changes ?? []).map((b,i) => ({ ...b, id:i+1 })); joins.set(topic,{ join,bindings }); ws.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:bindings}}])) }
        if (type === 'heartbeat' || type === 'phx_leave') ws.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response:{}}]))
      })
    })
    const emit = row => { for (const {ws,joins} of sockets) for (const [topic,j] of joins) { const ids = j.bindings.filter(b => b.table === 'messages').map(b => b.id); if (ids.length) ws.send(JSON.stringify([j.join,null,topic,'postgres_changes',{ids,data:{schema:'public',table:'messages',type:'INSERT',record:{...row,conversation_id:'50000000-0000-4000-8000-000000000001'},old_record:{},columns:[],errors:null}}])) } }
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname
      const reply = data => route.fulfill({ contentType:'application/json', body:JSON.stringify(data) })
      const fail = (message, code='42501', status=403) => route.fulfill({ status, contentType:'application/json', body:JSON.stringify({message,code}) })
      if (path === '/auth/v1/user') return reply(user)
      if (path.endsWith('/get_event_chat')) return denied ? fail('chat_unavailable') : reply([{conversation_id:'50000000-0000-4000-8000-000000000001',title:'Encuentro de música · fixture',event_state:state}])
      if (path.endsWith('/get_event_chat_messages_v2')) {
        if (denied) return fail('chat_unavailable')
        const p = req.postDataJSON()
        return reply([...rows].sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id)).filter(r => !p.p_before_id || r.created_at < p.p_before_at || r.created_at === p.p_before_at && r.id < p.p_before_id).slice(0,51))
      }
      if (path.endsWith('/reserve_event_media_upload')) { const p=req.postDataJSON(); reservations.push(p); return reply({file_id:p.p_file_id,attempt_id:p.p_attempt_id,bucket_name:'event_media',storage_path:`r7/chat/${viewer}/${event}/${p.p_attempt_id}.png`}) }
      if (path.endsWith('/get_event_media_upload_state')) return reply({uploaded:true,state:'reserved'})
      if (path.endsWith('/r7-media-validate')) return validationFailed ? fail('invalid_image','P0001',422) : reply({verified:true,file_id:req.postDataJSON().file_id})
      if (path.includes('/storage/v1/object/') && req.method() === 'POST') { uploads.push(path); return uploadFailed ? fail('upload failed','500',500) : reply({Key:path}) }
      if (path.includes('/storage/v1/object/authenticated/') && req.method() === 'GET') { gets.push({method:req.method(),authorization:req.headers().authorization,cache:req.headers()['cache-control']}); return getDenied ? fail('denied') : route.fulfill({contentType:'image/png',body:png}) }
      if (path.endsWith('/send_event_chat_message_v2')) {
        const p=req.postDataJSON(); writes.push(p)
        if (rpcFail && !commitLost) { const failure=rpcFail; rpcFail=''; return failure === 'lost' ? route.abort('failed') : fail(failure,'P0001',400) }
        if (!rows.some(r => r.id === p.p_message_id)) { const r={...seed(100+writes.length),id:p.p_message_id,sender_id:viewer,body:p.p_body,created_at:`2026-10-11T13:00:00.${String(writes.length).padStart(6,'0')}`,...(p.p_file_id ? mediaFor(p) : {})}; rows.push(r); emit(r) }
        if (commitLost) { commitLost=false; return route.abort('failed') }
        return reply(p.p_message_id)
      }
      return reply([])
    })
    const page = await context.newPage(), errors=[]
    if (width === 390) await page.clock.install()
    page.on('pageerror', error => errors.push(error.message))
    const b = name => page.getByRole('button',{name,exact:true})
    const shot = name => page.screenshot({path:`${out}/${name}-${width}.png`})
    const check = name => results.push({width,name,status:'PASS'})
    try {
      await page.goto(`${process.env.PLANIT_UI_ORIGIN}/events/${event}/chat`)
      await page.getByText('Mensaje fixture 64',{exact:true}).waitFor()
      // Synthetic bitmap is clearly a fixture; no image from the original collage is extracted.
      png = Buffer.from(await page.evaluate(() => { const c=document.createElement('canvas');c.width=320;c.height=180;const g=c.getContext('2d');g.fillStyle='#c5b5ff';g.fillRect(0,0,320,180);g.fillStyle='#060b27';g.font='24px sans-serif';g.fillText('PlanIt · imagen de prueba',18,94);return c.toDataURL('image/png').split(',')[1] }), 'base64')
      const file = {name:'encuentro-fixture.png',mimeType:'image/png',buffer:png}
      const select = async (f=file) => { await page.locator('input[type=file]').setInputFiles(f); await page.waitForFunction(()=>document.querySelector('.chat-composer').getAttribute('aria-busy')==='false');await page.getByAltText('Vista previa de la imagen seleccionada').waitFor() }
      assert.equal(await page.locator('input[type=file]').getAttribute('multiple'),null)
      await page.locator('input[type=file]').evaluate(input => { const files=new DataTransfer();for(let i=0;i<2;i++)files.items.add(new File(['x'],`${i}.png`,{type:'image/png'}));input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true})) });await page.getByRole('alert').filter({hasText:'una sola imagen'}).waitFor()
      await page.locator('input[type=file]').setInputFiles({name:'invalido.gif',mimeType:'image/gif',buffer:png});await page.getByRole('alert').filter({hasText:'JPEG, PNG o WebP'}).waitFor()
      await page.locator('input[type=file]').setInputFiles({name:'grande.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)});await page.getByRole('alert').filter({hasText:'5 MiB'}).waitFor()
      await page.locator('input[type=file]').setInputFiles({name:'falso.png',mimeType:'image/png',buffer:Buffer.from('fake')});await page.getByRole('alert').filter({hasText:'contenido no coincide'}).waitFor()
      assert.equal(writes.length,0); check('Invalid MIME, size and corrupt bytes reject without send; native picker is single file')
      await select();await shot('preview');await b('Quitar imagen').click();assert.equal(await page.getByAltText('Vista previa de la imagen seleccionada').count(),0)
      await select();await select({...file,name:'reemplazo.png'});assert.equal(await page.getByText('reemplazo.png',{exact:true}).count(),1)
      await page.locator('#chat-text').fill('Nos vemos en el encuentro');await page.locator('.chat-composer').evaluate(form=>{form.requestSubmit();form.requestSubmit()});await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();assert.equal(writes.length,1)
      await page.getByAltText('Imagen compartida por Sofía fixture').waitFor();assert.ok(gets.length>0);assert.ok(gets.every(g=>g.authorization==='Bearer fixture-token' && /no-cache|no-store/.test(g.cache)))
      await shot('text-image');await select();await b('Enviar').click();await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();assert.equal(writes[1].p_body,null)
      await page.reload();await page.getByAltText('Imagen compartida por Sofía fixture').last().waitFor();check('Replace/remove, text+image, image-only, reopen and authorized GET fixture')
      await select();uploadFailed=true;const n=writes.length;await b('Enviar').click();await page.getByRole('alert').filter({hasText:'carga se interrumpió'}).waitFor();assert.equal(writes.length,n);uploadFailed=false
      await b('Enviar').click();await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();assert.equal(reservations.at(-1).p_attempt_id,reservations.at(-2).p_attempt_id);assert.equal(uploads.at(-1),uploads.at(-2));check('Upload failure never commits; retry preserves reservation and path')
      await select();validationFailed=true;await b('Enviar').click();await page.getByRole('alert').filter({hasText:'validar la imagen en el servidor'}).waitFor();validationFailed=false;await b('Enviar').click();await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();check('Validation failure is not success; retry uses original file')
      await select();await page.locator('#chat-text').fill('Respuesta perdida');commitLost=true;await b('Enviar').click();await b('Consultar estado').waitFor();assert.ok(await page.locator('#chat-text').isDisabled());const written=writes.length;await b('Consultar estado').click();await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();assert.equal(writes.length,written);check('Lost committed reply reconciles without another send')
      await select();await page.locator('#chat-text').fill('Reintento incierto');rpcFail='lost';await b('Enviar').click();await b('Consultar estado').click();await b('Reintentar mismo mensaje').waitFor();await b('Reintentar mismo mensaje').click();await page.getByText('Mensaje confirmado.',{exact:true}).waitFor();assert.deepEqual(writes.at(-1),writes.at(-2));check('Lost uncommitted reply retries identical UUID/body/file after querying')
      await page.locator('#chat-text').fill('Sólo texto R2');await b('Enviar').click();await page.locator('.chat-bubble').filter({hasText:'Sólo texto R2'}).waitFor();assert.equal(writes.at(-1).p_file_id,null)
      assert.equal(await page.locator('#chat-text:focus').count(),1)
      await page.locator('#chat-text').fill('x'.repeat(2001));assert.ok(await b('Enviar').isDisabled());await page.locator('#chat-text').fill('')
      await page.locator('#chat-text').fill('Evento cerrado durante envío');rpcFail='chat_read_only';await b('Enviar').click();await page.getByRole('alert').filter({hasText:'ya no está vigente'}).waitFor();assert.equal(rows.filter(r=>r.body==='Evento cerrado durante envío').length,0);await page.locator('#chat-text').fill('')
      await select();await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));await b('Enviar').click();await page.getByRole('alert').filter({hasText:'sin conexión'}).waitFor();await context.setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await b('Quitar imagen').click();check('Text only, 2000 codepoints and offline preserve content without sending')
      const history=page.locator('.chat-messages');await history.evaluate(el=>el.scrollTop=300)
      const anchor=await history.evaluate(el=>{const child=[...el.children].find(c=>c.getBoundingClientRect().bottom>el.getBoundingClientRect().top);return {id:child.dataset.messageId,offset:child.getBoundingClientRect().top-el.getBoundingClientRect().top}})
      await b('Cargar mensajes anteriores').click();await page.getByText('Mensaje fixture 0',{exact:true}).waitFor();const offset=await history.evaluate((el,id)=>el.querySelector(`[data-message-id="${id}"]`).getBoundingClientRect().top-el.getBoundingClientRect().top,anchor.id);assert.ok(Math.abs(offset-anchor.offset)<2)
      const top=await history.evaluate(el=>el.scrollTop);const incoming={...seed(300),id:'incoming-300',body:'Mensaje en reconexión',created_at:'2026-10-11T14:00:00.000000'};rows.push(incoming);emit(incoming);emit(incoming);await page.getByText(incoming.body,{exact:true}).waitFor();assert.equal(await page.getByText(incoming.body,{exact:true}).count(),1);assert.ok(Math.abs(await history.evaluate(el=>el.scrollTop)-top)<2);check('Stable pagination anchor and duplicate Realtime reconciliation preserve reader')
      await history.evaluate(el=>el.scrollTop=el.scrollHeight);await page.locator('#chat-text').focus();await shot('chat')
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
      await page.setViewportSize({width,height:420});await select();await shot('keyboard-height');assert.ok(await page.evaluate(()=>document.querySelector('.chat-composer').getBoundingClientRect().bottom<=innerHeight+1));await page.setViewportSize({width,height:900});await b('Quitar imagen').click()
      await page.evaluate(()=>{const sizes=[...document.querySelectorAll('.event-chat-page, .event-chat-page *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,size] of sizes)el.style.fontSize=`${size*2}px`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('text-200');await page.evaluate(()=>{for(const el of document.querySelectorAll('.event-chat-page, .event-chat-page *'))el.style.fontSize=''});check('Responsive, doubled computed text, short viewport with preview and keyboard focus')
      if(width===1280){await page.setViewportSize({width:640,height:450});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('zoom-200-reflow-emulation');await page.setViewportSize({width,height:900});check('200% desktop zoom reflow emulation at 640x450 CSS pixels; native browser zoom not claimed')}
      if (width===390) {
        await history.evaluate(el=>el.scrollTop=el.scrollHeight-250)
        await page.getByAltText('Imagen compartida por Sofía fixture').last().waitFor()
        await page.waitForFunction(()=>![...document.querySelectorAll('.chat-image [role=status]')].some(el=>el.textContent.includes('Cargando')))
        await page.clock.fastForward(31000)
        assert.equal(await page.evaluate(()=>window.__liveBlobs.size),0)
        await page.locator('.chat-image').last().getByRole('button',{name:'Ver imagen'}).click()
        await page.getByAltText('Imagen compartida por Sofía fixture').last().waitFor()
        await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))})
        assert.equal(await page.evaluate(()=>window.__liveBlobs.size),0)
        await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))})
        await page.clock.resume();check('Blob expiry after 30s and hidden document revoke all downloaded URLs')
      }
      getDenied=true;await page.reload();await page.getByRole('alert').filter({hasText:'Imagen no disponible o sin permiso'}).first().waitFor();await shot('image-denied');getDenied=false;check('Denied GET shows explicit error and no image')
      state='ended';await b('Actualizar chat').click();await page.getByText('Evento finalizado · Chat de sólo lectura.').waitFor();assert.equal(await page.locator('input[type=file]').count(),0);await shot('readonly');check('Closed event retains history without composer')
      denied=true;await b('Actualizar chat').click();await page.getByText('Chat no disponible',{exact:true}).waitFor();assert.equal(await page.locator('.chat-image').count(),0);assert.equal(await page.evaluate(()=>window.__liveBlobs.size),0);check('Permission loss clears all private Blob URLs')
      assert.deepEqual(errors,[])
    } catch(error) { await shot('failure'); throw error }
    finally { await context.close() }
  }
  await writeFile(`${out}/results.json`,JSON.stringify({base:revision,branch:'codex/r7-block-3',sourceHashes,browser:browser.version(),environment:'Edge headless; actual production build; intercepted Auth/RPC/Storage/Edge/Phoenix; NO remote authorization claim',results},null,2))
  console.log(`${results.length} UI fixture checks PASS`)
}
