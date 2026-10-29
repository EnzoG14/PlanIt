import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { bucketStarts } from '../src/features/analytics/periods.ts'
const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']})
const root=resolve('dist'),out='docs/qa/r6-block-4/ui'
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'}
const server=createServer(async(req,res)=>{
  const file=resolve(root,`.${new URL(req.url,'http://localhost').pathname}`)
  if(!file.startsWith(root)){res.writeHead(403);res.end();return}
  try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file))}
  catch{res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const origin=`http://127.0.0.1:${server.address().port}`
await mkdir(out,{recursive:true})
const viewer='20000000-0000-4000-8000-000000000001',event='30000000-0000-4000-8000-000000000001',other='30000000-0000-4000-8000-000000000002'
const user={id:viewer,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const session={access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}
const results=[],errors=[];let failure
try{
  for(const width of JSON.parse(process.env.PLANIT_UI_WIDTHS??'[320,360,375,390,768,1280]')){
    const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Tokyo',reducedMotion:'reduce'})
    await context.addInitScript(s=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(s)),session)
    let mode='normal',reads=[],releases=[]
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
      const path=new URL(route.request().url()).pathname
      const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if(path==='/auth/v1/user')return reply(user)
      if(path==='/auth/v1/logout')return reply({})
      if(path==='/rest/v1/rpc/get_my_event_occupancy'){
        if(route.request().postDataJSON().p_event_id!==event)return reply({code:'42501',message:'PRIVATE_SENTINEL'},403)
        return reply({event_id:event,title:'Encuentro de primavera',event_state:'open',as_of:'2026-10-15T10:30:00',capacity:10,confirmed_count:4,available_spots:6,occupancy_percent:40,capacity_usable:true})
      }
      if(path==='/rest/v1/rpc/get_my_event_demographics')return reply({event_id:event,as_of:'2026-10-15T10:30:00',age_as_of:'2026-10-15',age:{state:'available',groups:['under_18','18_24','25_34','35_44','45_54','55_plus','unknown'].map(key=>({key,count:key==='unknown'?4:0}))},sex:{state:'available',groups:['female','male','other','unknown'].map(key=>({key,count:key==='unknown'?4:0}))}})
      if(path==='/rest/v1/rpc/get_my_event_participation_series'){
        const args=route.request().postDataJSON();reads.push(args)
        assert.deepEqual(Object.keys(args).sort(),['p_event_id','p_from','p_to','p_bucket'].sort())
        const period={from:args.p_from,to:args.p_to,bucket:args.p_bucket},currentMode=mode
        if(mode==='slow')await new Promise(r=>releases.push(r))
        if(currentMode==='denied')return reply({code:'42501',message:'PRIVATE_SENTINEL'},403)
        if(currentMode==='error')return reply({code:'500',message:'PRIVATE_SENTINEL'},500)
        const points=bucketStarts(period).map((bucket_start,i)=>({bucket_start,new_confirmations:currentMode==='empty'?0:i%4,reconfirmations:currentMode==='empty'?0:i%2,departures:currentMode==='empty'?0:i%3}))
        return reply({event_id:currentMode==='invalid'?other:event,...period,as_of:'2026-10-15T10:30:00',points})
      }
      return reply([])
    })
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
    const loaded=()=>page.locator('.analytics-range').waitFor()
    const check=test=>{results.push({width,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
    const shot=name=>page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true})
    await page.goto(`${origin}/events/${event}/analytics`);await loaded();await page.evaluate(()=>document.fonts.ready)
    assert.equal(await page.getByRole('button',{name:'30 días',exact:true}).getAttribute('aria-pressed'),'true')
    assert.equal(await page.getByRole('img',{name:/Movimientos por día/}).count(),1)
    assert.ok(!reads.at(-1).p_from.endsWith('Z'));assert.match(await page.locator('.analytics-range').innerText(),/Argentina/)
    assert.equal(await page.locator('.primary-nav a').count(),4)
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('series')
    await page.getByRole('button',{name:'7 días',exact:true}).focus()
    assert.equal(await page.getByRole('button',{name:'7 días',exact:true}).evaluate(n=>getComputedStyle(n).outlineWidth),'3px')
    await page.keyboard.press('Enter');await loaded();assert.equal(await page.locator('.analytics-series-table tbody tr').count(),7)
    await page.getByText('Ver tabla de movimientos',{exact:true}).click();await page.getByRole('table').waitFor();await shot('table')
    check('Default30 AR,7 preset keyboard/focus, three series + accessible table and mobile layout')
    await page.getByLabel('Agrupar por',{exact:true}).selectOption('week');await loaded()
    assert.equal(reads.at(-1).p_bucket,'week');assert.match(await page.locator('tbody').textContent(),/parcial/)
    const start=page.getByLabel('Desde',{exact:true}),end=page.getByLabel('Hasta (inclusive)',{exact:true})
    await end.fill('2026-10-20');await start.fill('2026-10-14');await loaded();await shot('partial-week')
    assert.match(await page.locator('tbody').textContent(),/14\/10\/2026 – 18\/10\/2026 \(parcial\)/)
    const before=reads.length
    await start.fill('2026-10-21');await page.getByText('La fecha inicial no puede ser posterior a la final.',{exact:true}).waitFor()
    assert.equal(await page.locator('.analytics-range').count(),0);assert.equal(reads.length,before)
    await start.fill('');await page.getByText('Completá ambas fechas con valores válidos.',{exact:true}).waitFor();assert.equal(await page.locator('.analytics-trend-chart').count(),0)
    await start.fill('2024-01-01');await page.getByText('Elegí un intervalo de hasta 366 días.',{exact:true}).waitFor()
    check('Custom range, Monday partial weeks; reversed/missing/overlong invalid dates hide old results without RPC')
    mode='empty';await page.getByRole('button',{name:'30 días',exact:true}).click();await page.getByRole('heading',{name:'Sin movimientos en este período'}).waitFor()
    assert.equal(await page.locator('.analytics-trend-chart').count(),0);await shot('empty')
    mode='error';await page.getByRole('button',{name:'7 días',exact:true}).click();await page.getByRole('button',{name:'Reintentar movimientos',exact:true}).waitFor()
    assert.equal(await page.locator('.analytics-range').count(),0);assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE_SENTINEL'));await shot('error')
    mode='normal';await page.getByRole('button',{name:'Reintentar movimientos',exact:true}).click();await loaded()
    mode='invalid';await page.getByRole('button',{name:'30 días',exact:true}).click();await page.getByRole('button',{name:'Reintentar movimientos',exact:true}).waitFor();assert.equal(await page.locator('.analytics-series-table').count(),0)
    mode='denied';await page.getByRole('button',{name:'Reintentar movimientos',exact:true}).click();await page.getByText('No tenés acceso a las estadísticas de este evento.',{exact:false}).waitFor()
    check('Successful zero vs error vs denial; safe retry; mismatched request DTO rejected')
    mode='normal';await page.getByLabel('Agrupar por',{exact:true}).selectOption('day');await loaded()
    mode='slow';await page.getByRole('button',{name:'90 días',exact:true}).click()
    await page.getByRole('heading',{name:'Consultando movimientos',exact:true}).waitFor();assert.equal(await page.locator('.analytics-series-table').count(),0)
    await page.getByRole('button',{name:'7 días',exact:true}).click();mode='normal';await page.getByRole('button',{name:'30 días',exact:true}).click();await loaded()
    const last=reads.at(-1);assert.equal(last.p_to.slice(0,10),await page.getByLabel('Hasta (inclusive)').inputValue().then(v=>new Date(Date.parse(v+'T00:00:00Z')+86400000).toISOString().slice(0,10)))
    for(const release of releases)release();releases=[]
    await page.waitForTimeout(100);assert.equal(await page.locator('.analytics-series-table tbody tr').count(),30)
    check('90→7→30 delayed network; prior table removed during load and late responses discarded')
    if(width===390){
      mode='slow';await page.getByRole('button',{name:'7 días',exact:true}).click();await page.getByRole('heading',{name:'Consultando movimientos',exact:true}).waitFor()
      await page.clock.install();await page.clock.fastForward(11000);await page.getByRole('button',{name:'Reintentar movimientos',exact:true}).waitFor();assert.equal(await page.locator('.analytics-range').count(),0)
      for(const release of releases)release();releases=[];await page.clock.resume();mode='normal';await page.getByRole('button',{name:'Reintentar movimientos',exact:true}).click();await loaded()
      await context.setOffline(true);await page.getByRole('heading',{name:'Sin conexión',exact:true}).waitFor();assert.equal(await page.locator('.analytics-trend').count(),0)
      await context.setOffline(false);await page.getByRole('button',{name:'Actualizar datos',exact:true}).click();await loaded()
      check('10s timeout, late abort, offline and reconnect clear historical values before retry')
    }
    await page.getByRole('button',{name:'90 días',exact:true}).click();await loaded()
    await page.evaluate(()=>{for(const n of document.querySelectorAll('.analytics-page *'))n.style.fontSize=`${parseFloat(getComputedStyle(n).fontSize)*2}px`})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('text-200')
    await page.setViewportSize({width,height:480});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('short')
    check('200% text, reduced motion and short viewport without overflow')
    await page.goto(`${origin}/events/${other}/analytics`);await page.getByRole('heading',{name:'Estadísticas no disponibles'}).waitFor();assert.equal(await page.locator('.analytics-trend').count(),0)
    await page.goto(`${origin}/events/${event}/analytics`);await loaded()
    await page.getByRole('button',{name:'Cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.waitForURL(url=>url.pathname==='/login');assert.equal(await page.locator('.analytics-trend').count(),0)
    check('Foreign route and logout remove all historical data; session fixture only')
    await context.close()
  }
  assert.deepEqual(errors,[])
}catch(error){failure=error.message;throw error}
finally{await writeFile(`${out}/results.json`,JSON.stringify({environment:'Real React production build in Edge; simulated Auth/RPC; Tokyo browser timezone; no remote permissions certified',results,errors,failure,result:failure?'FAIL':'PASS'},null,2)+'\n');await browser.close();server.close()}
