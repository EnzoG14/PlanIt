import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {readFile,mkdir} from 'node:fs/promises'
import {resolve,extname} from 'node:path'
import {pathToFileURL} from 'node:url'
import {attendeesCsv,statisticsCsv} from '../../src/features/analytics/csv.ts'
import {load,identities,logout,rpc,event,evidence,out,project} from './common.mjs'
export async function ui(){
 const m=await load(),c=await identities(m),results=[],root=resolve('dist'),directory=out+'/ui-'+Date.now()
 await mkdir(directory,{recursive:true})
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'}
 const server=createServer(async(req,res)=>{const file=resolve(root,`.${new URL(req.url,'http://localhost').pathname}`);if(!file.startsWith(root)){res.writeHead(403);res.end();return}try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file))}catch{res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}})
 await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`
 const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
 const browser=await chromium.launch({headless:true,channel:'msedge'}),authKey=`sb-${project}-auth-token`
 try{
  const session=(await c.A.auth.getSession()).data.session
  for(const width of [320,360,375,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},timezoneId:'America/Argentina/Buenos_Aires',reducedMotion:'reduce',acceptDownloads:true})
   await context.addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:authKey,s:session})
   const page=await context.newPage()
   let shownDemographics,shownSeries
   page.on('response',async response=>{
    const path=new URL(response.url()).pathname
    if(path.endsWith('/rpc/get_my_event_demographics')&&response.ok())shownDemographics=await response.json()
    if(path.endsWith('/rpc/get_my_event_participation_series')&&response.ok())shownSeries=await response.json()
   })
   const routes=[['analytics',`/events/${event(m,'occupancy')}/analytics`,'.analytics-kpis'],['compare','/my-events/compare','.compare-options'],['notifications','/notifications','.notification-row'],['my-events','/my-events','.compact-event-card']]
   for(const [name,path,selector] of routes){
    await page.goto(origin+path);await page.locator(selector).first().waitFor({timeout:30000});await page.evaluate(()=>document.fonts.ready)
    if(name==='compare'){for(const n of ['occupancy','compare'])await page.getByRole('checkbox',{name:new RegExp(m.events[n].title+'\\s')}).check();await page.locator('.compare-table tbody tr').first().waitFor();assert.match(await page.locator('.compare-table').innerText(),/40 %/);assert.match(await page.locator('.compare-table').innerText(),/50 %/)}
    if(name==='analytics'){assert.match(await page.locator('.analytics-kpis').innerText(),/40 %/);await page.locator('.analytics-trend table').waitFor({timeout:30000,state:'attached'})}
    if(name==='my-events'){assert.equal(await page.locator('.compact-event-body h3').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=44)),true,'Event titles retain readable width')}
    if(name==='notifications'){assert.ok(await page.getByRole('heading',{name:m.events.realtime.title,exact:true}).count()>0);assert.match(await page.locator('.notifications-bell').getAttribute('aria-label'),/no leídas/)}
    if(width===390&&name==='analytics'){
     const expected=attendeesCsv(await rpc(c.A,'get_my_event_export_rows',{p_event_id:event(m,'occupancy')}))
     const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar asistentes CSV',exact:true}).click();const download=await pending;const bytes=await readFile(await download.path(),'utf8');assert.equal(bytes,expected);await download.saveAs(directory+'/asistentes-real.csv')
     await page.waitForFunction(()=>Boolean(document.querySelector('.analytics-range')))
     assert.ok(shownSeries);assert.ok(shownDemographics)
     const series=shownSeries
     const expectedStats=statisticsCsv(m.events.occupancy.title,series,shownDemographics),pendingStats=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar estadísticas CSV',exact:true}).click();const stats=await pendingStats;assert.equal(await readFile(await stats.path(),'utf8'),expectedStats);await stats.saveAs(directory+'/estadisticas-real.csv')
     results.push({test:'Actual browser downloads equal real authorized RPC serialization and visible default30 period',width,result:'PASS'})
    }
    await page.screenshot({path:`${directory}/${name}-normal-${width}.png`,fullPage:true})
    for(const zoom of [1,2]){
     await page.evaluate(z=>{document.body.style.zoom=z===1?'':'2'},zoom)
     const geometry=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth,dock:[...document.querySelectorAll('.primary-nav a')].map(n=>{const r=n.getBoundingClientRect();return {label:n.textContent.trim(),left:r.left,right:r.right,width:r.width,height:r.height}}),overflow:[...document.querySelectorAll('main button, main select, .app-header button')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>({text:n.textContent.trim().slice(0,40),rect:n.getBoundingClientRect()})).filter(n=>n.rect.right>innerWidth+1||n.rect.left< -1).map(n=>n.text)}))
     const pass=geometry.document<=geometry.viewport+1&&geometry.dock.every(r=>r.left>=-1&&r.right<=width+1&&r.width>=44&&r.height>=44)&&geometry.overflow.length===0
     results.push({test:`${name} actual JWT UI; ${zoom===2?'CSS zoom200':'normal'} reflow and reachable dock/controls`,width,result:pass?'PASS':'FAIL',geometry})
     if(name==='my-events')assert.equal(await page.locator('.compact-event-body h3').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=44)),true,'Zoom keeps event titles readable')
     const reachable = await page.evaluate(async () => {
      const controls=[...document.querySelectorAll('main button, main a')].filter(n=>n.getClientRects().length && getComputedStyle(n).visibility!=='hidden')
      const last=controls.at(-1); if(!last)return true
      last.scrollIntoView({block:'end'});await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));const initial=last.getBoundingClientRect(),nav=document.querySelector('.primary-nav').getBoundingClientRect();if(initial.bottom>nav.top)window.scrollBy(0,initial.bottom-nav.top+16);await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))
      const target=last.getBoundingClientRect(),dock=document.querySelector('.primary-nav').getBoundingClientRect()
      return {pass:target.top>=-1&&target.bottom<=dock.top+1,top:target.top,bottom:target.bottom,dockTop:dock.top,padding:getComputedStyle(document.documentElement).scrollPaddingBottom,scrollY,maxScroll:document.documentElement.scrollHeight-innerHeight,label:last.textContent.trim().slice(0,60)}
     })
     assert.ok(reachable.pass,'Last control can scroll above the wrapped dock: '+JSON.stringify(reachable))
     await page.evaluate(()=>window.scrollTo(0,0))
     if(zoom===2)await page.screenshot({path:`${directory}/${name}-zoom200-${width}.png`,fullPage:true})
    }
    await page.evaluate(()=>{document.body.style.zoom=''})
   }
   await context.close()
  }
  // Actual storage identity switch while an authorized private page is open.
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage()
  await context.addInitScript(({k,s})=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify(s))},{k:authKey,s:session})
  await page.goto(origin+`/events/${event(m,'occupancy')}/analytics`);await page.locator('.analytics-kpis').waitFor()
  const bSession=(await c.B.auth.getSession()).data.session
  await page.evaluate(({k,s})=>{const oldValue=localStorage.getItem(k);localStorage.setItem(k,JSON.stringify(s));window.dispatchEvent(new StorageEvent('storage',{key:k,oldValue,newValue:JSON.stringify(s)}))},{k:authKey,s:bSession})
  await page.reload();await page.getByRole('heading',{name:'Estadísticas no disponibles',exact:true}).waitFor({timeout:30000});assert.equal(await page.locator('.analytics-kpis').count(),0);assert.ok(!(await page.locator('body').innerText()).includes(m.events.occupancy.title));await context.close()
  results.push({test:'Actual JWT A→B account switch clears analytics; unauthorized RPC cannot restore owner data',result:'PASS'})
  await evidence('ui',results,{transport:'Real Auth/REST/WebSocket; no intercepted RPCs or synthetic tokens',native_browser_zoom:'NOT RUN; CSS zoom and text scaling are separate',screenshots:directory})
  if(results.some(r=>r.result==='FAIL'))process.exitCode=1
 }catch(e){results.push({test:'Real UI assertion failure',result:'FAIL',reason:e.message?.slice(0,200)});await evidence('ui',results);throw e}
 finally{await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));await logout(c)}
}
