import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { bucketStarts } from '../src/features/analytics/periods.ts'
const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']})
const root=resolve('dist'),out=process.env.PLANIT_CSV_UI_OUTPUT??'docs/qa/statistics-demographics/ui'
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
    await context.addInitScript(()=>{
      window.csvUrls={created:0,revoked:0}
      const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL)
      URL.createObjectURL=blob=>{window.csvUrls.created++;return create(blob)}
      URL.revokeObjectURL=url=>{window.csvUrls.revoked++;revoke(url)}
    })
    let mode='normal',exportMode='normal',demoMode='normal',reads=[],releases=[]
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
      const path=new URL(route.request().url()).pathname
      const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if(path==='/auth/v1/user')return reply(user)
      if(path==='/auth/v1/logout')return reply({})
      if(path==='/rest/v1/rpc/get_my_event_occupancy'){
        if(route.request().postDataJSON().p_event_id!==event)return reply({code:'42501',message:'PRIVATE_SENTINEL'},403)
        return reply({event_id:event,title:'Encuentro de primavera',event_state:'open',as_of:'2026-10-15T10:30:00',capacity:10,confirmed_count:4,available_spots:6,occupancy_percent:40,capacity_usable:true})
      }
      if(path==='/rest/v1/rpc/get_my_event_demographics'){
        if(demoMode==='error')return reply({code:'500',message:'PRIVATE_SENTINEL'},500)
        const count=demoMode==='empty'?0:1
        const distribution=(keys,chosen)=>({state:count?'available':'empty',groups:count?keys.map(key=>({key,count:key===chosen?count:0})):[]})
        return reply({event_id:event,as_of:'2026-10-16T10:30:00',age_as_of:'2026-10-16',
          age:distribution(['under_18','18_24','25_34','35_44','45_54','55_plus','unknown'],'18_24'),
          sex:distribution(['female','male','other','unknown'],'female')})
      }

      if(path==='/rest/v1/rpc/get_my_event_export_rows'){
        const args=route.request().postDataJSON();assert.deepEqual(args,{p_event_id:event})
        const captured=exportMode
        if(captured==='slow')await new Promise(r=>releases.push(r))
        if(captured==='error')return reply({code:'500',message:'PRIVATE_SENTINEL'},500)
        if(captured==='denied')return reply({code:'42501',message:'PRIVATE_SENTINEL'},403)
        if(captured==='large')return reply({code:'54000',message:'PRIVATE_SENTINEL'},413)
        const rows=captured==='empty'?[]:[{username:'ana',display_name:'\t=SUM(1); "Ána"\nLópez',status:'confirmed',first_registered_at:'2026-10-01T12:00:00'}]
        return reply({version:captured==='version'?2:1,event_id:captured==='invalid'?other:event,event_title:'Encuentro de primavera',as_of:'2026-10-15T10:30:00',rows:captured==='too-many'?Array(5001).fill(rows[0]):rows})
      }
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
    const selectedPreset=page.getByRole('button',{name:'30 días',exact:true})
    await selectedPreset.hover()
    await page.waitForTimeout(250)
    await page.screenshot({path:`${out}/preset-hover-${width}.png`,fullPage:true})
    assert.deepEqual(await selectedPreset.evaluate(node=>{
      const style=getComputedStyle(node)
      return {background:style.backgroundColor,color:style.color}
    }),{background:'rgb(7, 83, 255)',color:'rgb(255, 255, 255)'})
    for(const days of [7,90,30]){
      const preset=page.getByRole('button',{name:`${days} días`,exact:true})
      await preset.focus();await page.keyboard.press('Enter');await preset.hover();await loaded()
      await page.waitForFunction(node=>getComputedStyle(node).backgroundColor==='rgb(7, 83, 255)',await preset.elementHandle())
      assert.equal(await preset.getAttribute('aria-pressed'),'true')
      assert.equal(await preset.evaluate(node=>getComputedStyle(node).color),'rgb(255, 255, 255)')
    }
    check('Selected 7/30/90 presets retain blue background and visible white text on hover and keyboard focus')
    let downloads=0;page.on('download',()=>downloads++)
    const attendees=()=>page.getByRole('button',{name:'Descargar asistentes CSV',exact:true})
    const stats=()=>page.getByRole('button',{name:'Descargar estadísticas CSV',exact:true})
    const collect=async(button,name)=>{
      let download
      try { [download]=await Promise.all([page.waitForEvent('download'),button.click()]) }
      catch(error){console.log('Download failure',name,await page.locator('.analytics-export').allTextContents());await shot(`failure-${name}`);throw error}
      assert.equal(await download.failure(),null);await download.saveAs(`${out}/${name}-${width}.csv`)
      return readFile(await download.path(),'utf8')
    }
    await attendees().focus();assert.equal(await attendees().evaluate(n=>getComputedStyle(n).outlineWidth),'3px')
    const attendeeCsv=await collect(attendees(),'asistentes');assert.ok(attendeeCsv.startsWith('\uFEFF"evento";"username"'))
    assert.ok(attendeeCsv.includes('"\'\t=SUM(1); ""Ána""\nLópez"'));assert.ok(!attendeeCsv.includes('user_id'))
    await page.getByRole('button',{name:'7 días',exact:true}).click();await loaded()
    const statsCsv=await collect(stats(),'estadisticas');const rows=statsCsv.trim().split('\r\n');assert.equal(rows.length,32)
    assert.equal(rows[0],'"evento_id";"evento";"tipo";"grupo";"desde";"hasta";"granularidad";"inicio_periodo";"fecha_consulta";"cantidad"')
    for(let i=0;i<7;i++)for(const [j,kind] of ['inscripciones_nuevas','reincorporaciones','bajas'].entries()){
      assert.ok(rows[1+3*i+j].includes(`;"${kind}";"";`))
      assert.ok(rows[1+3*i+j].endsWith(`;"${[i%4,i%2,i%3][j]}"`))
    }
    assert.ok(rows[22].includes(';"edad";"18–24";"";"";"";"";"2026-10-16T10:30:00";"1"'))
    assert.ok(rows[28].includes(';"sexo";"Femenino";"";"";"";"";"2026-10-16T10:30:00";"1"'))
    assert.match(await page.locator('.demographics-distribution').first().innerText(),/18–24\s+1\s+100 %/)
    assert.match(await page.locator('.demographics-distribution').last().innerText(),/Femenino\s+1\s+100 %/)
    assert.ok(!statsCsv.includes('Menores de 18'));assert.equal(await page.getByRole('rowheader',{name:'Menores de 18',exact:true}).count(),0)
    assert.ok(statsCsv.includes(reads.at(-1).p_from));assert.ok(statsCsv.includes(reads.at(-1).p_to))
    assert.equal(await page.getByText('Descarga iniciada.',{exact:true}).count(),1)
    assert.deepEqual(await page.evaluate(()=>window.csvUrls),{created:2,revoked:2})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('exports')
    check('Two actual browser downloads, BOM/quoting/formula prefix, event ID only, exact seven chart buckets/counts and current demographic totals and filters; focus and layout')
    if(width===390){
      let before=downloads
      for(const [state,text] of [['empty','No hay asistentes confirmados para exportar.'],['error','No pudimos preparar el reporte. Volvé a intentar.'],['denied','No tenés acceso al reporte de este evento.'],['large','El reporte supera el límite de 5.000 asistentes o 10 MiB. No se descargó ningún archivo.'],['invalid','No pudimos verificar el reporte de asistentes. Volvé a intentar.'],['version','No pudimos verificar el reporte de asistentes. Volvé a intentar.'],['too-many','No pudimos verificar el reporte de asistentes. Volvé a intentar.']]){
        exportMode=state;await attendees().click();await page.getByText(text,{exact:true}).waitFor();assert.equal(downloads,before)
      }
      await shot('error')
      mode='empty';await page.getByRole('button',{name:'30 días',exact:true}).click();await loaded()
      const zeroCsv=await collect(stats(),'sin-movimientos');before++
      assert.equal(downloads,before);assert.equal(zeroCsv.trim().split('\r\n').length,101)
      assert.ok(zeroCsv.trim().split('\r\n').slice(1,91).every(row=>row.endsWith(';"0"')));await shot('empty')
      demoMode='error';await page.reload();await loaded()
      await page.getByRole('heading',{name:'Datos demográficos no disponibles'}).waitFor()
      assert.equal(await stats().isDisabled(),true);assert.equal(downloads,before)
      demoMode='empty';await page.getByRole('button',{name:'Reintentar',exact:true}).click();await loaded()
      const emptyCsv=await collect(stats(),'sin-participantes');before++
      assert.ok(emptyCsv.trim().split('\r\n').slice(1).every(row=>row.endsWith(';"0"')))
      demoMode='normal';await page.reload();await loaded()
      check('Zero movements still download; failed demographics disables export; retry restores export; zero participants exports all categories as zero')
      mode='normal';await page.getByRole('button',{name:'7 días',exact:true}).click();await loaded()
      exportMode='slow';await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor();await shot('pending')
      await page.getByRole('button',{name:'Cancelar exportación',exact:true}).click();await page.getByText('Exportación cancelada. No se descargó ningún archivo.',{exact:true}).waitFor()
      for(const release of releases)release();releases=[];await page.waitForTimeout(100);assert.equal(downloads,before)
      await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      await page.clock.install();await page.clock.fastForward(16000);await page.getByText('La exportación tardó demasiado. Volvé a intentar. No se descargó ningún archivo.',{exact:true}).waitFor()
      for(const release of releases)release();releases=[];await page.clock.resume();assert.equal(downloads,before)
      // Reload starts fresh counters; all pending/cancelled requests create no Blob.
      assert.deepEqual(await page.evaluate(()=>window.csvUrls),{created:0,revoked:0})
      await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      await page.getByRole('button',{name:'30 días',exact:true}).click();await loaded()
      for(const release of releases)release();releases=[];await page.waitForTimeout(100);assert.equal(downloads,before)
      check('Empty/errors/denial/size/version/event mismatch, 5001 rows, explicit cancel and timeout discard all data without download')
      await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      await context.setOffline(true);await page.getByRole('heading',{name:'Sin conexión',exact:true}).waitFor()
      for(const release of releases)release();releases=[];await context.setOffline(false);assert.equal(downloads,before)
      exportMode='normal';await page.reload();await loaded()
      exportMode='slow';await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))})
      for(const release of releases)release();releases=[];await page.waitForTimeout(100);assert.equal(downloads,before)
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false})})
      await page.reload();await loaded()
      await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      // A manual refresh unmounts the current request before late fulfillment.
      await page.reload();await loaded()
      for(const release of releases)release();releases=[];await page.waitForTimeout(100);assert.equal(downloads,before)
      await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      await page.goto(`${origin}/events/${other}/analytics`);await page.getByRole('heading',{name:'Estadísticas no disponibles'}).waitFor()
      for(const release of releases)release();releases=[];assert.equal(downloads,before)
      await page.goto(`${origin}/events/${event}/analytics`);await loaded()
      await attendees().click();await page.getByRole('button',{name:'Cancelar exportación',exact:true}).waitFor()
      await page.getByRole('button',{name:'Cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.waitForURL(url=>url.pathname==='/login')
      for(const release of releases)release();releases=[];assert.equal(downloads,before)
      check('Filter changes, offline/reconnect, hidden tab, refresh, foreign navigation and logout invalidate pending exports; no late downloads')
      await page.goto(`${origin}/login`)
      await page.evaluate(s=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(s)),session)
      exportMode='normal';await page.goto(`${origin}/events/${event}/analytics`);await loaded()
    }
    await page.evaluate(()=>{for(const n of document.querySelectorAll('.analytics-page *'))n.style.fontSize=`${parseFloat(getComputedStyle(n).fontSize)*2}px`})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('text-200')
    await page.setViewportSize({width,height:480});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('short')
    check('200% text and 480px height without clipping/overflow; reduced motion, six viewport widths')
    await context.close()
  }
  assert.deepEqual(errors,[])
}catch(error){failure=error.message;throw error}
finally{await writeFile(`${out}/results.json`,JSON.stringify({environment:'Real React production build in Edge; simulated Auth/RPC; Tokyo browser timezone; actual CSV downloads. No remote JWT/permissions or installed device PWA certified.',results,errors,failure,result:failure?'FAIL':'PASS'},null,2)+'\n');await browser.close();server.close()}
