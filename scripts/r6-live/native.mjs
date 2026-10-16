import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve,extname} from 'node:path'
import {pathToFileURL} from 'node:url'
import {load,identities,logout,event,evidence,out,privateDir,project} from './common.mjs'
export async function native(){
 const m=await load(),c=await identities(m),root=resolve('dist'),results=[],dir=out+'/native-'+Date.now(),extension=resolve(privateDir,'zoom-extension')
 await mkdir(extension,{recursive:true});await mkdir(dir,{recursive:true})
 await writeFile(extension+'/manifest.json',JSON.stringify({manifest_version:3,name:'PlanIt QA native zoom',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}))
 await writeFile(extension+'/worker.js','chrome.runtime.onInstalled.addListener(()=>{});')
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'}
 const server=createServer(async(req,res)=>{const f=resolve(root,`.${new URL(req.url,'http://localhost').pathname}`);if(!f.startsWith(root)){res.writeHead(403);res.end();return}try{res.setHeader('Content-Type',mime[extname(f)]??'application/octet-stream');res.end(await readFile(f))}catch{res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}})
 await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`
 const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
 let context
 try{
  context=await chromium.launchPersistentContext(resolve(privateDir,'native-profile'),{channel:'msedge',headless:true,viewport:{width:1280,height:900},ignoreDefaultArgs:['--disable-extensions'],args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]})
  const worker=context.serviceWorkers().find(w=>w.url().startsWith('chrome-extension://'))??await context.waitForEvent('serviceworker',{predicate:w=>w.url().startsWith('chrome-extension://'),timeout:15000})
  const session=(await c.A.auth.getSession()).data.session
  await context.addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:`sb-${project}-auth-token`,s:session})
  const page=await context.newPage()
  for(const width of [320,360,375,390,768,1280])for(const [name,path,selector] of [['analytics',`/events/${event(m,'occupancy')}/analytics`,'.analytics-kpis'],['compare','/my-events/compare','.compare-options'],['notifications','/notifications','.notification-row'],['my-events','/my-events','.compact-event-card']]){
   await page.setViewportSize({width,height:900});await page.goto(origin+path);await page.locator(selector).first().waitFor({timeout:30000})
   const zoom=async factor=>worker.evaluate(async({url,factor})=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url===url);if(!tab)throw Error('Native zoom tab not found');await chrome.tabs.setZoom(tab.id,factor);return await chrome.tabs.getZoom(tab.id)},{url:page.url(),factor})
   await zoom(1);const before=await page.evaluate(()=>({inner:innerWidth,outer:outerWidth,dpr:devicePixelRatio}))
   const factor=await zoom(2);await page.waitForFunction(w=>Math.abs(innerWidth-w/2)<2,before.inner)
   const after=await page.evaluate(()=>({inner:innerWidth,outer:outerWidth,dpr:devicePixelRatio,visual_scale:visualViewport.scale,css_zoom:getComputedStyle(document.body).zoom,document:document.documentElement.scrollWidth,dock:[...document.querySelectorAll('.primary-nav a')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}})}))
   assert.equal(factor,2);assert.equal(after.visual_scale,1);assert.equal(after.css_zoom,'1');assert.equal(after.outer,before.outer)
   const pass=after.document<=after.inner+1&&after.dock.length===4&&after.dock.every(r=>r.left>=-1&&r.right<=after.inner+1&&r.width>=44&&r.height>=44)
   results.push({test:`${name} native tabs.setZoom(2) + getZoom confirmation, no CSS/pinch/DPR override`,width,result:pass?'PASS':'FAIL',factor,before,after})
   await page.screenshot({path:`${dir}/${name}-${width}.png`,fullPage:false});await zoom(1)
  }
  await evidence('native',results,{screenshots:dir,method:'Edge native chrome.tabs.setZoom/getZoom via temporary local QA extension; measured innerWidth halves while outerWidth and visualViewport scale stay constant; no CSS zoom or forced device scale'})
  if(results.some(r=>r.result==='FAIL'))process.exitCode=1
 }catch(e){results.push({test:'Native browser zoom',result:'BLOCKED',reason:e.message?.slice(0,200)});await evidence('native',results,{method:'Attempted real browser tabs.setZoom; unavailable is never certified by CSS scaling'});process.exitCode=1}
 finally{await context?.close();server.closeAllConnections();await new Promise(done=>server.close(done));await logout(c)}
}
