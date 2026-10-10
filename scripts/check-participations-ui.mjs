import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless:true,channel:'msedge' })
const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4184'
const output = 'docs/design/verification/participations-r1'
await mkdir(output,{recursive:true})
const user = { id:'20000000-0000-4000-8000-000000000001', email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z' }
const event = { id:'30000000-0000-4000-8000-000000000001',organizer_id:'20000000-0000-4000-8000-000000000002',title:'Encuentro de música — prueba',description:'Compartimos música con la comunidad. Datos de prueba para verificar la interfaz.',starts_at:'2099-10-11T20:00:00',ends_at:'2099-10-11T22:00:00',address:'Av. Corrientes 123, Buenos Aires',location_name:'Centro cultural',latitude:-34.6037,longitude:-58.3816,capacity:20,category_id:'10000000-0000-4000-8000-000000000001',visibility:'public',cancelled_at:null,archived_at:null }
const results=[]
try {
  for (const [width,height] of [[375,812],[1280,900]]) {
    const context = await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo'})
    await context.addInitScript(({user})=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),{user})
    let summary={confirmed_count:8,capacity:20,available_spots:12,own_status:null,is_organizer:false,event_state:'open'}
    let registerCalls=0; let leaveCalls=0; let lost=false; let summaryFailure=false; let mutationFailure=false
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
      const req=route.request(); const path=new URL(req.url()).pathname
      const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if(path==='/auth/v1/user') return reply(user)
      if(path==='/rest/v1/events') return reply([event])
      if(path==='/rest/v1/categories') return reply([{id:event.category_id,name:'Música',is_active:true}])
      if(path==='/rest/v1/event_images') return reply([])
      if(path==='/rest/v1/rpc/get_event_participation_summary') return summaryFailure?reply({message:'fixture'},500):reply([summary])
      if(path==='/rest/v1/rpc/register_for_event' || path==='/rest/v1/rpc/leave_event') {
        assert.deepEqual(req.postDataJSON(),{p_event_id:event.id})
        await new Promise(r=>setTimeout(r,150))
        if(path.endsWith('register_for_event')) {
          registerCalls++
          if(mutationFailure) { summary={...summary,confirmed_count:20,available_spots:0}; return reply({message:'event_full'},400) }
          if(summary.own_status!=='confirmed') summary={...summary,confirmed_count:summary.confirmed_count+1,available_spots:summary.available_spots-1,own_status:'confirmed'}
        } else { leaveCalls++; summary={...summary,confirmed_count:summary.confirmed_count-1,available_spots:summary.available_spots+1,own_status:'cancelled'} }
        return lost?reply({message:'response_lost'},500):reply(null)
      }
      return reply([])
    })
    const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message))
    await page.goto(`${origin}/events/${event.id}`)
    const join=page.getByRole('button',{name:'Unirme',exact:true})
    await join.waitFor()
    assert.equal(await page.getByRole('progressbar').getAttribute('value'),'8')
    await page.screenshot({path:`${output}/detail-${width}x${height}.png`,fullPage:true})
    await join.scrollIntoViewIfNeeded()
    const actionBounds=await join.boundingBox()
    assert.ok(actionBounds.y+actionBounds.height < height-70,'CTA must clear fixed navigation')
    await page.screenshot({path:`${output}/action-${width}x${height}.png`})
    // Dispatch two synchronous clicks to exercise ref guard before React repaint.
    await join.evaluate(button=>{button.click();button.click()})
    await page.getByRole('button',{name:'Retirarme',exact:true}).waitFor()
    assert.equal(registerCalls,1)
    await page.getByText('Ya participás.',{exact:true}).waitFor()
    assert.equal(await page.getByRole('progressbar').getAttribute('value'),'9')
    await page.screenshot({path:`${output}/confirmed-${width}x${height}.png`,fullPage:true})
    await page.getByRole('button',{name:'Retirarme',exact:true}).click()
    await join.waitFor(); assert.equal(leaveCalls,1)
    lost=true; await join.click()
    await page.getByRole('button',{name:'Retirarme',exact:true}).waitFor()
    await page.getByRole('alert').waitFor(); assert.equal(registerCalls,2)
    assert.equal(await page.getByRole('progressbar').getAttribute('value'),'9')
    lost=false
    summaryFailure=true; await page.getByRole('button',{name:'Actualizar estado'}).click()
    await page.getByText('Cupos sin confirmar',{exact:true}).waitFor()
    assert.equal(await page.getByRole('progressbar').count(),0)
    assert.equal(await page.locator('.participation-action').isDisabled(),true)
    summaryFailure=false
    for (const [change,label] of [[{own_status:null,confirmed_count:20,available_spots:0},'Evento completo'],
      [{own_status:'removed',available_spots:12},'Reingreso sujeto a aprobación'],
      [{own_status:null,event_state:'ended'},'Evento finalizado'],
      [{event_state:'cancelled'},'Evento cancelado'],[{event_state:'archived'},'Evento cancelado'],
      [{event_state:'open',is_organizer:true},'Organizás este evento']]) {
      summary={...summary,...change}; await page.getByRole('button',{name:'Actualizar estado'}).click()
      await page.getByRole('button',{name:label,exact:true}).waitFor()
      assert.equal(await page.getByRole('button',{name:label,exact:true}).isDisabled(),true)
    }
    summary={confirmed_count:8,capacity:20,available_spots:12,own_status:null,is_organizer:false,event_state:'open'}
    await page.getByRole('button',{name:'Actualizar estado'}).click(); await join.waitFor()
    mutationFailure=true; await join.click()
    await page.getByRole('button',{name:'Evento completo',exact:true}).waitFor()
    await page.getByRole('alert').filter({hasText:'El evento está completo.'}).waitFor()
    assert.equal(await page.getByRole('progressbar').getAttribute('value'),'20')
    await page.screenshot({path:`${output}/full-${width}x${height}.png`,fullPage:true})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    assert.deepEqual(errors,[])
    results.push({width,height,doubleClickCalls:1,lostResponseReconciled:true,summaryFailureClearsCount:true,serverFullReconciled:true,closedRemovedOrganizer:true,overflow:false,pageErrors:errors})
    await context.close()
  }
  await writeFile(`${output}/ui-results.json`,JSON.stringify({environment:'Browser with intercepted Supabase fixtures; not live Auth/HTTP',results},null,2))
  console.log('PASS: mobile/desktop, double click, withdrawal/rejoin, lost response, refresh failure/retry, full/removed/closed/organizer, safe RPC arguments, Argentina time, no overflow/errors. HTTP fixtures.')
} finally { await browser.close() }
