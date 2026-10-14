import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ headless:true, channel:'msedge', args:['--no-proxy-server'] })
// Serve the actual Vite build; same-process server avoids optimizer/proxy races.
const root=resolve(process.env.PLANIT_UI_BUILD??'dist')
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'}
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname
  const file=resolve(root,`.${path}`)
  if(!file.startsWith(root)) {res.writeHead(403);res.end();return}
  try {res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file))}
  catch {res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const origin=process.env.PLANIT_UI_ORIGIN??`http://127.0.0.1:${server.address().port}`
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-3/ui'
const baseline=process.env.PLANIT_R5_BASELINE==='1'
await mkdir(out,{recursive:true})
const viewer='20000000-0000-4000-8000-000000000001', target='50000000-0000-4000-8000-000000000001'
const participantEvent='30000000-0000-4000-8000-000000000001', category='10000000-0000-4000-8000-000000000001'
const user={id:viewer,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const session={access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}
const results=[], errors=[]
let failure
try {
  for(const width of baseline?[390,1280]:[320,360,375,390,768,1280]) {
    const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Tokyo',reducedMotion:'reduce'})
    await context.addInitScript(value=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value)),session)
    let blocked=false, minimal=false, network=false, malformed=false, invalidCursor=false, count=34, nullBio=false, long=false, reads=0, avatarRequests=0, eventsDenied=false, slow=false, release
    const rows=Array.from({length:34},(_,i)=>({id:`82000000-0000-4000-8000-${String(34-i).padStart(12,'0')}`,title:`Plan público ${i+1}`,starts_at:'2099-01-01T18:00:00',ends_at:'2099-01-01T20:00:00',category_id:category,location_name:i===0?null:'Centro cultural'}))
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
      const path=new URL(route.request().url()).pathname,args=route.request().postDataJSON()
      const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if(path==='/auth/v1/user') return reply(user)
      if(path==='/auth/v1/logout') return reply({})
      // B6 added relationship/count reads to the existing profile. Keep this
      // historical harness compatible without relaxing any B3 assertions.
      if(path==='/rest/v1/rpc/get_social_relationship') return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility:minimal?'private':'public',follow:null})
      if(path==='/rest/v1/rpc/get_social_counts') return reply({followers:0,following:0})
      if(path==='/rest/v1/rpc/get_social_profile') {
        if(network) return route.abort('failed')
        if(slow) {slow=false;await new Promise(resolve=>{release=resolve})}
        if(blocked) return reply({unavailable:true})
        return reply({display_name:long?'María de los Ángeles Fernández '.repeat(6):'Camila Torres',username:long?'nombre_largo_'.repeat(12):'camila',avatar:target,...(minimal?{}:{bio:malformed?42:nullBio?null:long?'Biografía extensa sin datos sensibles. '.repeat(50):'Bio social autorizada'}),birth_date:'PRIVATE_SENTINEL',sex:'PRIVATE_SENTINEL',email:'PRIVATE_SENTINEL',file_id:'PRIVATE_SENTINEL'})
      }
      if(path==='/rest/v1/rpc/get_social_profile_events') {
        reads++;assert.deepEqual(Object.keys(args).sort(),['p_before_id','p_before_starts_at','p_limit','p_user_id']);assert.equal(args.p_limit,30)
        if(eventsDenied) return reply({code:'42501',message:'profile_unavailable'},403)
        if(network) return route.abort('failed')
        const selected=rows.slice(0,count).filter(row=>!args.p_before_id||row.id<args.p_before_id)
        if(malformed) return reply({events:[{...rows[0],id:'bad'}],next_cursor:null})
        return reply({events:selected.slice(0,30).map(row=>({...row,title:long?'Título extenso de evento '.repeat(12):row.title,email:'PRIVATE_SENTINEL'})),next_cursor:invalidCursor?{id:'bad',starts_at:rows[0].starts_at}:selected.length>30?{id:selected[29].id,starts_at:selected[29].starts_at}:null})
      }
      if(path==='/functions/v1/social-avatar') {avatarRequests++;return reply({error:'avatar_unavailable'},503)}
      if(path==='/rest/v1/rpc/get_event_social_participants') return reply({participants:[{user_id:target,display_name:'Camila Torres',username:'camila',avatar:null}],next_cursor:null})
      if(path==='/rest/v1/events') return reply([{...rows[0],id:new URL(route.request().url()).searchParams.get('id')?.replace('eq.','')??rows[0].id,organizer_id:target,description:'Descripción fixture',address:'Buenos Aires',latitude:-34.6,longitude:-58.38,capacity:80,visibility:'public',cancelled_at:null,archived_at:null}])
      if(path==='/rest/v1/categories') return reply([{id:category,name:'Música',is_active:true}])
      if(path==='/rest/v1/rpc/get_event_organizer') return reply([{display_name:'Camila Torres',username:'camila'}])
      if(path==='/rest/v1/rpc/get_event_participation_summary') return reply([{confirmed_count:1,capacity:80,available_spots:79,is_organizer:false,own_status:'confirmed',event_state:'open'}])
      if(path.startsWith('/rest/v1/')) return reply([])
      return reply({})
    })
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message))
    const check=test=>{results.push({viewport:width,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
    const loaded=()=>page.getByRole('heading',{name:'Camila Torres',exact:true}).waitFor()
    const links=()=>page.locator('.social-profile-event')
    const update=()=>page.getByRole('button',{name:'Actualizar perfil',exact:true}).click()
    const screenshot=name=>page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true})
    await page.goto(`${origin}/users/${target}`);await loaded();await page.evaluate(()=>document.fonts.ready)
    if(baseline) {await screenshot('before');check('Actual B2 minimal profile baseline');await context.close();continue}
    await page.waitForFunction(()=>document.querySelectorAll('.social-profile-event').length===30)
    assert.equal(await page.getByText('Bio social autorizada',{exact:true}).count(),1)
    assert.equal((await page.locator('body').innerText()).includes('PRIVATE_SENTINEL'),false)
    assert.ok(avatarRequests>0);assert.equal(await page.locator('.social-avatar img').count(),0)
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await screenshot('profile')
    assert.ok((await page.getByRole('button',{name:'Actualizar perfil',exact:true}).boundingBox()).height>=44)
    assert.ok((await links().first().boundingBox()).height>=44)
    check('Public identity/bio/events, private fields stripped, avatar gateway fallback, no overflow')
    await page.getByRole('button',{name:'Cargar más eventos',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.social-profile-event').length===34)
    assert.equal(await page.getByRole('button',{name:'Cargar más eventos',exact:true}).count(),0)
    assert.equal(new Set(await links().evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))).size,34)
    check('30+4 equal-date cursor pagination, refetch previous pages, unique events')
    await page.goto(`${origin}/events/${participantEvent}/attendees?view=social`);await page.locator('.social-participant-link').click();await loaded()
    await links().first().focus();assert.equal(await links().first().evaluate(node=>getComputedStyle(node).outlineWidth),'3px');await screenshot('focus')
    await page.keyboard.press('Enter');await page.getByRole('link',{name:'Volver al perfil',exact:true}).click();await loaded()
    await page.getByRole('link',{name:'Volver a participantes',exact:true}).click();await page.locator('.social-participant-link').waitFor()
    check('Keyboard participants→profile→event→profile→participants with visible focus')
    await page.goto(`${origin}/users/${target}`);await loaded();eventsDenied=true
    await page.getByRole('button',{name:'Cargar más eventos',exact:true}).click();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();assert.equal(await links().count(),0);assert.equal(await page.locator('.social-avatar').count(),0)
    eventsDenied=false;await update();await loaded();minimal=true;const before=reads;await update();await loaded()
    assert.equal(reads,before);assert.equal(await page.getByText('Bio social autorizada',{exact:true}).count(),0);assert.equal(await page.getByRole('heading',{name:'Eventos públicos',exact:true}).count(),0)
    check('Denied pagination clears whole projection; private minimum issues no events query')
    minimal=false;count=0;nullBio=true;await update();await loaded();await page.getByRole('heading',{name:'No hay eventos públicos vigentes',exact:true}).waitFor();assert.equal(await page.getByText('Todavía no agregó una biografía.',{exact:true}).count(),1);await screenshot('empty')
    check('Null bio retains content permission; explicit bio/event empty states')
    count=34;nullBio=false;await update();await loaded();blocked=true;await update();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();assert.equal(await page.getByText('Camila Torres',{exact:true}).count(),0);assert.equal(await page.locator('.social-avatar').count(),0);await screenshot('unavailable')
    blocked=false;network=true;await update();await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();assert.equal(await links().count(),0);await screenshot('error');network=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await loaded()
    malformed=true;await update();await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();assert.equal(await links().count(),0);malformed=false;invalidCursor=true;await update();await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();invalidCursor=false;await update();await loaded()
    check('Blocked neutral state, network retry and malformed bio/event/cursor fail closed')
    long=true;count=1;await update();await page.waitForFunction(()=>document.querySelectorAll('.social-profile-event').length===1);await screenshot('long')
    await page.evaluate(()=>{for(const node of document.querySelectorAll('.social-identity-page *')) node.style.fontSize=`${parseFloat(getComputedStyle(node).fontSize)*2}px`})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await screenshot('text-200')
    await page.setViewportSize({width,height:480});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('Long names/bio/event titles, 200% text and low-height responsive')
    long=false;count=34;await page.reload();await loaded();await page.clock.install();blocked=true;await page.clock.fastForward(31000);await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();assert.equal(await links().count(),0);await page.clock.resume();blocked=false
    await update();await loaded();await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));assert.equal(await links().count(),0);await context.setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await loaded()
    check('Visible 30s revocation and offline/reconnect clear previous content')
    slow=true;await update();await page.waitForFunction(()=>document.querySelector('[aria-busy=true]'));await page.goto(`${origin}/users/not-a-uuid`);await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();release?.();assert.equal(await links().count(),0)
    await page.goto(`${origin}/users/${viewer}`);await page.waitForURL('**/me')
    await page.goto(`${origin}/users/${target}`);await loaded();await page.getByRole('button',{name:'Cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.waitForURL(url=>url.pathname==='/login');assert.equal(await links().count(),0)
    check('Late request/invalid route safe, self→me, logout clears social view')
    await context.close()
  }
  assert.deepEqual(errors,[])
} catch(error) {failure=String(error.stack??error);console.error(error);process.exitCode=1}
finally {await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await writeFile(`${out}/ui-results.json`,JSON.stringify({environment:'Real Vite build and Edge headless; Auth/RPC/gateway fixtures, no real JWT/RLS transport',results,errors,failure,result:failure?'FAIL':'PASS'},null,2)+'\n')}
