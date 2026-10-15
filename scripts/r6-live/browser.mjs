import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {readFile,mkdir} from 'node:fs/promises'
import {resolve,extname} from 'node:path'
import {pathToFileURL} from 'node:url'
import {load,identities,logout,rpc,event,evidence,out,project} from './common.mjs'
export async function browser(){
 const m=await load(),c=await identities(m),results=[],root=resolve('dist'),dir=out+'/browser-realtime-'+Date.now()
 await mkdir(dir,{recursive:true})
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'}
 const server=createServer(async(req,res)=>{const f=resolve(root,`.${new URL(req.url,'http://localhost').pathname}`);if(!f.startsWith(root)){res.writeHead(403);res.end();return}try{res.setHeader('Content-Type',mime[extname(f)]??'application/octet-stream');res.end(await readFile(f))}catch{res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}})
 await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`
 const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
 const engine=await chromium.launch({headless:true,channel:'msedge'})
 try{
  const pages={},contexts={}
  for(const role of ['A','B']){contexts[role]=await engine.newContext({viewport:{width:390,height:844}});const session=(await c[role].auth.getSession()).data.session;await contexts[role].addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:`sb-${project}-auth-token`,s:session});pages[role]=await contexts[role].newPage();await pages[role].goto(origin+'/notifications');await pages[role].getByRole('heading',{name:'Notificaciones',exact:true}).waitFor();await pages[role].waitForFunction(()=>!document.querySelector('.notifications-page > p[role="status"]')&&document.querySelector('section[aria-label="Tus avisos"]')?.getAttribute('aria-busy')==='false',null,{timeout:30000})}
  const title=m.events.realtime.title,id=event(m,'realtime'),count=()=>pages.A.getByRole('heading',{name:title,exact:true}).count()
  const before=await count(),bellBefore=Number((await pages.A.locator('.notifications-bell').getAttribute('aria-label')).match(/\d+/)?.[0]??0)
  await rpc(c.B,'leave_event',{p_event_id:id});await rpc(c.B,'register_for_event',{p_event_id:id})
  await pages.A.waitForFunction(({title,n})=>[...document.querySelectorAll('.notification-content h2')].filter(n=>n.textContent===title).length===n,{title,n:before+1},{timeout:30000})
  await pages.A.waitForFunction(n=>document.querySelector('.notifications-bell')?.getAttribute('aria-label')===`Notificaciones, ${n} no leídas`,bellBefore+1,{timeout:30000})
  await pages.A.screenshot({path:dir+'/delivered-390.png',fullPage:true})
  results.push({test:'Actual app open before last seat: owner inbox and bell update through real WebSocket without reload',result:'PASS'})
  await contexts.A.setOffline(true);await rpc(c.B,'leave_event',{p_event_id:id});await rpc(c.B,'register_for_event',{p_event_id:id});await contexts.A.setOffline(false)
  await pages.A.waitForFunction(({title,n})=>[...document.querySelectorAll('.notification-content h2')].filter(n=>n.textContent===title).length===n,{title,n:before+2},{timeout:30000})
  await pages.A.waitForFunction(n=>document.querySelector('.notifications-bell')?.getAttribute('aria-label')===`Notificaciones, ${n} no leídas`,bellBefore+2,{timeout:30000})
  await new Promise(done=>setTimeout(done,15000));assert.equal(await count(),before+2);assert.ok(!(await pages.B.locator('body').innerText()).includes(title));assert.equal(await pages.B.getByRole('heading',{name:title,exact:true}).count(),0)
  await pages.A.screenshot({path:dir+'/recovered-390.png',fullPage:true});await pages.B.screenshot({path:dir+'/other-account-390.png',fullPage:true})
  results.push({test:'Actual app offline/reconnect reconciles missed episode once; second real account does not receive owner notice after15s',result:'PASS'})
  await evidence('browser',results,{screenshots:dir,transport:'No interception; actual Supabase Auth/PostgREST/WebSocket',native_device:'Desktop Edge browser emulated mobile viewport; physical mobile NOT RUN'})
 }catch(e){results.push({test:'Actual app Realtime assertion',result:'FAIL',reason:e.message?.slice(0,200)});await evidence('browser',results);throw e}
 finally{await engine.close();server.closeAllConnections();await new Promise(done=>server.close(done));await logout(c)}
}
