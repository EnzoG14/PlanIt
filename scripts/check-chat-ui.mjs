import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({headless:true,channel:'msedge'})
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
const output = process.env.PLANIT_CHAT_UI_OUTPUT ?? 'docs/design/verification/event-chat'
await mkdir(output,{recursive:true})
const user = {id:'20000000-0000-4000-8000-000000000001',email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const eventId='30000000-0000-4000-8000-000000000001'
const results=[]
const check=test=>{results.push({test,result:'PASS',evidence:'Playwright intercepted fixtures, not Supabase REST/Auth'});console.log(`PASS: ${test}`)}
async function setup(viewport) {
  const context=await browser.newContext({viewport,timezoneId:'Asia/Tokyo'})
  await context.addInitScript(({user})=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),{user})
  let mode='success'; let state='open'; let lostResponse=true; const sends=[]
  const messages=[{id:'40000000-0000-4000-8000-000000000001',sender_id:'20000000-0000-4000-8000-000000000002',display_name:'Sofía de prueba',username:'sofia_fixture',body:'¡Hola! Nos encontramos en el evento.',created_at:'2026-10-10T19:12:00'}]
  await context.routeWebSocket('**/realtime/v1/websocket**', ws => { ws.onMessage(() => {}) })
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
    const path=new URL(route.request().url()).pathname
    const reply=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)})
    if(path==='/auth/v1/user') return reply(user)
    if(path==='/rest/v1/rpc/get_event_chat') {
      if(mode==='denied') return reply({message:'chat_unavailable',code:'42501'},403)
      if(mode==='error') return reply({message:'fixture network error'},500)
      return reply([{conversation_id:'50000000-0000-4000-8000-000000000001',title:'Encuentro de música · prueba',event_state:state}])
    }
    if(path==='/rest/v1/rpc/get_event_chat_messages') {
      assert.equal(route.request().postDataJSON().p_event_id,eventId)
      if(mode==='empty') return reply([])
      if(mode==='pagination') {
        if(route.request().postDataJSON().p_before_id) return reply([{...messages[0],id:'older-message',body:'Mensaje anterior',created_at:'2026-10-09T19:12:00'}])
        return reply(Array.from({length:51},(_,n)=>({...messages[0],id:`page-${n}`,body:`Mensaje ${n}`,created_at:`2026-10-10T19:${String(59-n).padStart(2,'0')}:00`})))
      }
      return reply([...messages].reverse())
    }
    if(path==='/rest/v1/rpc/send_event_chat_message') {
      const body=route.request().postDataJSON(); sends.push(body)
      assert.deepEqual(Object.keys(body).sort(),['p_body','p_event_id','p_message_id'])
      if(!messages.some(m=>m.id===body.p_message_id)) messages.push({id:body.p_message_id,sender_id:user.id,display_name:'Usuario de prueba',username:'yo_fixture',body:body.p_body,created_at:'2026-10-10T19:15:00'})
      if(lostResponse) {lostResponse=false;return route.abort('failed')}
      return reply(body.p_message_id)
    }
    return reply([])
  })
  return {context,sends,setMode:value=>{mode=value},setState:value=>{state=value}}
}
try {
  for(const [name,viewport] of [['mobile',{width:375,height:812}],['desktop',{width:1280,height:900}]]) {
    const fixture=await setup(viewport); const page=await fixture.context.newPage()
    page.setDefaultTimeout(8000)
    const errors=[];page.on('pageerror',error=>errors.push(error.message))
    await page.goto(`${origin}/events/${eventId}/chat`)
    await page.getByText('¡Hola! Nos encontramos en el evento.').waitFor()
    await page.getByText('Sofía de prueba',{exact:true}).waitFor()
    assert.match(await page.locator('time').first().textContent(),/19:12/)
    assert.equal(await page.getByRole('button',{name:'Enviar',exact:true}).isDisabled(),true)
    await page.getByLabel('Mensaje',{exact:true}).fill('   ')
    assert.equal(await page.getByRole('button',{name:'Enviar',exact:true}).isDisabled(),true)
    await page.getByLabel('Mensaje',{exact:true}).fill('x'.repeat(2001))
    assert.equal(await page.getByRole('button',{name:'Enviar',exact:true}).isDisabled(),true)
    await page.getByLabel('Mensaje',{exact:true}).fill('¡Nos vemos! Texto de prueba')
    await page.getByRole('button',{name:'Enviar',exact:true}).click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByLabel('Mensaje',{exact:true}).inputValue(),'¡Nos vemos! Texto de prueba')
    await page.getByRole('button',{name:'Enviar',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('#chat-text')?.value==='')
    assert.equal(fixture.sends.length,2);assert.equal(fixture.sends[0].p_message_id,fixture.sends[1].p_message_id)
    await page.getByText('¡Nos vemos! Texto de prueba',{exact:true}).waitFor()
    assert.equal(await page.getByText('¡Nos vemos! Texto de prueba',{exact:true}).count(),1)
    assert.ok(await page.locator('.chat-own').count())
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth))
    await page.screenshot({path:`${output}/chat-${name}.png`,fullPage:true})
    await page.reload();await page.getByText('¡Nos vemos! Texto de prueba',{exact:true}).waitFor()
    check(`${name}: chronological sender history, Argentina time in Tokyo browser, send/reopen, blank/size validation, lost-response retry same UUID without duplicates; no horizontal overflow`)
    fixture.setState('ended');await page.getByRole('button',{name:'Actualizar chat'}).click()
    await page.getByText('Evento finalizado · Chat de sólo lectura.').waitFor()
    assert.equal(await page.locator('#chat-text').count(),0)
    await page.screenshot({path:`${output}/chat-read-only-${name}.png`,fullPage:true})
    fixture.setState('open');fixture.setMode('empty');await page.getByRole('button',{name:'Actualizar chat'}).click()
    await page.getByRole('heading',{name:'Todavía no hay mensajes'}).waitFor()
    fixture.setMode('error');await page.getByRole('button',{name:'Actualizar chat'}).click()
    await page.getByRole('heading',{name:'No se pudo cargar'}).waitFor()
    assert.equal(await page.locator('.chat-messages').count(),0)
    fixture.setMode('denied');await page.getByRole('button',{name:'Actualizar chat'}).click()
    await page.getByRole('heading',{name:'Chat no disponible'}).waitFor()
    assert.equal(await page.locator('#chat-text').count(),0)
    await page.reload();await page.getByRole('heading',{name:'Chat no disponible'}).waitFor()
    check(`${name}: closed composer hidden, empty/error states, denied direct route and cleared cached messages`)
    fixture.setMode('pagination');await page.getByRole('button',{name:'Actualizar chat'}).click()
    await page.getByRole('button',{name:'Cargar mensajes anteriores'}).click()
    await page.getByText('Mensaje anterior',{exact:true}).waitFor()
    assert.equal(await page.locator('.chat-messages li').count(),51)
    assert.equal(await page.getByRole('button',{name:'Cargar mensajes anteriores'}).count(),0)
    assert.deepEqual(errors,[])
    check(`${name}: older history prepends without duplicate or page errors`)
    await fixture.context.close()
  }
  await writeFile(`${output}/ui-results.json`,JSON.stringify({environment:'Playwright UI fixtures; no remote changes',results},null,2))
} finally {await browser.close()}
