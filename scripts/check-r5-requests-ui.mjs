import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Reuse the real build server/Edge launcher. Auth and API are explicit fixtures.
const source = await readFile('scripts/check-r5-profile-ui.mjs', 'utf8')
const prefix = source.slice(0, source.indexOf('const results=[], errors=[]'))
  .replace("'docs/qa/r5-block-3/ui'", "'docs/qa/r5-block-7/ui'")
const tests = String.raw`
const results=[],errors=[];let failure;
try {
  for(const width of [320,360,375,390,768,1280]) {
    const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Tokyo',reducedMotion:'reduce'});
    await context.addInitScript(value=>{if(!sessionStorage.getItem('fixture-installed')) {localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value));sessionStorage.setItem('fixture-installed','1')}},session);
    const seed=Array.from({length:34},(_,i)=>({follower_id:'98000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),request_version:'99000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),requested_at:'2026-10-14T10:00:00',display_name:'Persona '+(i+1),username:'persona_'+(i+1),avatar:null,status:'pending'}));
    let rows=structuredClone(seed),network=false,malformed=false,denied=false,long=false,loseResponse=false,doNotCommit=false,slowWrite=false,slowRead=false,otherAccount=false,release,writeCount=0,reconcileCount=0,listReads=0;
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
      const url=new URL(route.request().url()),path=url.pathname,args=route.request().postDataJSON();
      const reply=(data,code=200)=>route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)});
      const deny=()=>reply({code:'42501',message:'request_unavailable'},403);
      if(path==='/auth/v1/user') return reply(user);
      if(path==='/auth/v1/logout') return reply({});
      if(path==='/rest/v1/profiles') return reply({username:'fixture_me',display_name:'Mi cuenta fixture',first_name:null,last_name:null,birth_date:null,sex:null,bio:null,visibility:'private',avatar_file_id:null});
      if(path==='/rest/v1/rpc/list_follow_requests') {
        listReads++;
        assert.deepEqual(Object.keys(args).sort(),['p_after_follower_id','p_after_requested_at','p_limit']);assert.equal(args.p_limit,30);
        if(network) return route.abort('failed');if(denied) return deny();
        if(otherAccount) return reply({requests:[],next_cursor:null});
        if(slowRead) {slowRead=false;await new Promise(resolve=>{release=resolve})}
        const selected=rows.filter(r=>r.status==='pending'&&(!args.p_after_follower_id||r.follower_id>args.p_after_follower_id));
        return reply({requests:selected.slice(0,30).map(r=>({...r,display_name:long?'Nombre visible muy extenso '.repeat(8):r.display_name,email:'PRIVATE_SENTINEL',birth_date:'PRIVATE_SENTINEL',sex:'PRIVATE_SENTINEL'})),next_cursor:malformed?{requested_at:'bad',follower_id:'bad'}:selected.length>30?{requested_at:selected[29].requested_at,follower_id:selected[29].follower_id}:null});
      }
      if(path==='/rest/v1/rpc/resolve_follow_request') {
        writeCount++;assert.deepEqual(Object.keys(args).sort(),['p_decision','p_follower_id','p_request_version']);
        const row=rows.find(r=>r.follower_id===args.p_follower_id);
        if(denied||!row||row.request_version!==args.p_request_version) return deny();
        if(!doNotCommit) row.status=args.p_decision;
        if(slowWrite) {slowWrite=false;await new Promise(resolve=>{release=resolve})}
        if(loseResponse) {loseResponse=false;return route.abort('failed')}
        return reply(args.p_decision);
      }
      if(path==='/rest/v1/user_follows') {
        reconcileCount++;assert.equal(url.searchParams.get('select'),'request_version,status');assert.equal(url.searchParams.get('followed_id'),'eq.'+viewer);
        if(network) return route.abort('failed');
        const row=rows.find(r=>'eq.'+r.follower_id===url.searchParams.get('follower_id'));
        return reply(row?[{request_version:row.request_version,status:row.status,email:'PRIVATE_SENTINEL'}]:[]);
      }
      if(path==='/rest/v1/rpc/get_social_profile') return reply({display_name:'Persona 1',username:'persona_1',avatar:null});
      if(path==='/rest/v1/rpc/get_social_relationship') return reply({visibility:'private',follow:null});
      if(path==='/rest/v1/rpc/get_social_counts') return reply({followers:2,following:0});
      if(path==='/functions/v1/social-avatar') return reply({error:'avatar_unavailable'},503);
      if(path.startsWith('/rest/v1/')) return reply([]);
      return reply({});
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const button=name=>page.getByRole('button',{name,exact:true});
    const count=()=>page.locator('.follow-request-identity').count();
    const loaded=()=>page.locator('.follow-request-identity').first().waitFor();
    const update=async()=>{await button('Actualizar solicitudes').click();await loaded()};
    const pick=async(decision='Aceptar',index=0)=>{await page.getByRole('button',{name:new RegExp('^'+decision+' solicitud de @')}).nth(index).click()};
    const confirm=decision=>button('Confirmar '+(decision==='Aceptar'?'aceptación':'rechazo')).click();
    const check=test=>{results.push({viewport:width,test,result:'PASS'});console.log('PASS '+width+': '+test)};
    const shot=async name=>{if(width===390||width===1280) await page.screenshot({path:out+'/'+name+'-'+width+'.png'})};
    await page.goto(origin+'/me');await page.getByRole('heading',{name:'Mi perfil',exact:true}).waitFor();
    await page.getByRole('link',{name:'Solicitudes de seguimiento',exact:true}).click();await loaded();await page.evaluate(()=>document.fonts.ready);
    assert.equal(await count(),30);assert.equal(await page.locator('.primary-nav a').count(),4);assert.match(await page.locator('.follow-request-date').first().textContent(),/10:00/);
    await shot('pending');
    await button('Cargar más solicitudes').click();await page.locator('.follow-request-identity').nth(33).waitFor();assert.equal(await count(),34);
    await page.locator('.follow-request-identity').first().click();await page.getByRole('link',{name:'Volver a la lista',exact:true}).click();await loaded();
    await page.getByRole('link',{name:'Volver a mi perfil',exact:true}).click();await page.getByRole('link',{name:'Solicitudes de seguimiento',exact:true}).waitFor();
    assert.equal(await page.getByRole('link',{name:'Solicitudes de seguimiento',exact:true}).evaluate(e=>e===document.activeElement),true);
    await page.getByRole('link',{name:'Solicitudes de seguimiento',exact:true}).click();await loaded();
    check('CA01: profile entry,30+4 tie cursor pagination,Argentina time in Tokyo,4 dock tabs,profile round trip and restored focus');
    await pick();assert.equal(await button('Volver').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(writeCount,0);
    await pick();await button('Volver').click();assert.equal(writeCount,0);
    await pick();await shot('confirm');await confirm('Aceptar');await loaded();assert.equal(writeCount,1);assert.equal(rows[0].status,'accepted');assert.equal(await page.getByRole('button',{name:'Aceptar solicitud de @persona_1',exact:true}).count(),0);
    await pick('Rechazar');await confirm('Rechazar');await loaded();assert.equal(rows[1].status,'rejected');
    rows[1]={...rows[1],request_version:'91000000-0000-4000-8000-000000000002',status:'pending'};await update();await page.getByRole('button',{name:'Aceptar solicitud de @persona_2',exact:true}).waitFor();
    check('CA02/03: Escape/cancel focus,no write;confirmed accept/reject remove pending;renewal immediately visible');
    loseResponse=true;await pick();await confirm('Aceptar');await button('Consultar estado').waitFor();const before=writeCount;
    await shot('uncertain');await button('Consultar estado').click();await loaded();assert.equal(writeCount,before);assert.ok(reconcileCount>0);
    check('Lost committed response: status/version RLS read only,never resends or claims uncertain success');
    doNotCommit=true;loseResponse=true;await pick('Rechazar');await confirm('Rechazar');await button('Consultar estado').waitFor();
    network=true;await button('Consultar estado').click();await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Consultar estado'&&!b.disabled));
    network=false;await button('Consultar estado').click();await loaded();doNotCommit=false;
    await pick();await confirm('Aceptar');await loaded();
    check('Lost uncommitted response and failed reconciliation:actions locked until current pending confirmed;explicit retry then allowed');
    doNotCommit=true;loseResponse=true;await pick();await confirm('Aceptar');await button('Consultar estado').waitFor();
    const pending=rows.find(r=>r.status==='pending');pending.request_version='91000000-0000-4000-8000-000000000003';doNotCommit=false;
    const oldWrites=writeCount;await button('Consultar estado').click();await loaded();assert.equal(writeCount,oldWrites);assert.match(await page.locator('.follow-request-feedback').textContent(),/cambió/);assert.equal(pending.status,'pending');
    check('CA04 stale generation:reconciliation sees replacement,never resolves new request');
    slowWrite=true;await pick();await confirm('Aceptar');await button('Actualizar solicitudes').waitFor();assert.equal(await button('Actualizar solicitudes').isDisabled(),true);
    for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);const single=writeCount;release();release=null;await loaded();assert.equal(writeCount,single);
    await page.clock.install();slowWrite=true;await pick();await confirm('Aceptar');
    for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);await page.clock.runFor(10001);await button('Consultar estado').waitFor();release();release=null;
    const timedWrites=writeCount;await button('Consultar estado').click();await loaded();assert.equal(writeCount,timedWrites);
    check('Double submit locked;10s write timeout reconciles without duplicate');
    slowWrite=true;await pick();await confirm('Aceptar');for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);
    const readsAtHide=listReads;
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Consultar estado'&&!b.disabled));assert.equal(await count(),0);assert.equal(listReads,readsAtHide);release();release=null;
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await loaded();await button('Consultar estado').click();await loaded();
    check('Mutation aborted on hide never reloads identities in background;visible return requires reconciliation');
    rows.forEach(r=>r.status='accepted');await page.clock.runFor(30001);await page.getByRole('heading',{name:'No hay solicitudes pendientes',exact:true}).waitFor();assert.equal(await count(),0);await shot('empty');
    rows=structuredClone(seed);await button('Actualizar solicitudes').click();await loaded();rows=[];await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('heading',{name:'No hay solicitudes pendientes',exact:true}).waitFor();
    check('D04 external conversion empties pending at30s/focus;no residual cached identities');
    rows=structuredClone(seed);network=true;await button('Actualizar solicitudes').click();await button('Reintentar').waitFor();assert.equal(await count(),0);await shot('error');network=false;await button('Reintentar').click();await loaded();
    malformed=true;await button('Actualizar solicitudes').click();await button('Reintentar').waitFor();assert.equal(await count(),0);malformed=false;await button('Reintentar').click();await loaded();
    denied=true;await button('Actualizar solicitudes').click();await page.getByRole('heading',{name:'Solicitudes no disponibles',exact:true}).waitFor();assert.equal(await count(),0);await shot('denied');denied=false;await button('Actualizar solicitudes').click();await loaded();
    check('Network/invalid cursor/denied clear rows;real retry recovers');
    await page.evaluate(()=>window.dispatchEvent(new Event('offline')));assert.equal(await count(),0);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await loaded();
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await count(),0);
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await loaded();
    check('Offline/hidden clear identities;online/visible revalidate');
    long=true;await update();await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('long-text');await page.evaluate(()=>document.documentElement.style.fontSize='');long=false;await update();
    const metrics=await page.getByRole('button',{name:'Aceptar solicitud de @persona_1',exact:true}).evaluate(e=>{e.focus();const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,outline:s.outlineWidth,font:s.fontFamily,color:s.color,background:s.backgroundColor}});
    assert.ok(metrics.height>=44&&metrics.width>=44);assert.equal(metrics.outline,'3px');assert.match(metrics.font,/Bricolage/);
    assert.equal(metrics.color,'rgb(255, 255, 255)');assert.equal(metrics.background,'rgb(6, 11, 39)');
    assert.ok(!(await page.locator('body').textContent()).includes('PRIVATE_SENTINEL'));
    assert.equal(await page.locator('[data-request-version]').count(),0);
    check('Amanecer text200%,long names,no overflow,44px controls,3px focus,self-hosted font,allowlist excludes private sentinels');
    await page.clock.resume();await page.setViewportSize({width,height:400});await pick('Rechazar');await button('Volver').scrollIntoViewIfNeeded();assert.ok(await button('Volver').isVisible());await page.keyboard.press('Escape');
    await page.setViewportSize({width,height:900});
    slowRead=true;await button('Actualizar solicitudes').click();for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);
    const broadcast=async value=>page.evaluate(value=>{const key='sb-iepeqmvzjguwlhnecsdq-auth-token';localStorage.setItem(key,JSON.stringify(value));const channel=new BroadcastChannel(key);channel.postMessage({event:'SIGNED_IN',session:value});channel.close()},value);
    otherAccount=true;await broadcast({...session,access_token:'fixture-other-token',user:{...user,id:target}});await page.getByRole('heading',{name:'No hay solicitudes pendientes',exact:true}).waitFor();release();release=null;assert.equal(await count(),0);
    otherAccount=false;await broadcast(session);await loaded();
    check('Cross-tab account/token change remounts inbox,aborts old read,and never republishes previous identities');
    // Delayed list response cannot repopulate the authenticated route after logout.
    slowRead=true;await button('Actualizar solicitudes').click();for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);
    await page.getByRole('button',{name:'Cuenta',exact:true}).click();await button('Cerrar sesión').click();await page.waitForURL(url=>url.pathname==='/login');release();release=null;assert.equal(await count(),0);
    await page.goto(origin+'/me/follow-requests');await page.waitForURL(url=>url.pathname==='/login');assert.equal(await count(),0);
    check('Short viewport keyboard navigation;logout aborts late read;anonymous direct route protected');
    await context.close();
  }
  assert.deepEqual(errors,[]);
} catch(error) {failure={message:error.message,stack:error.stack};throw error}
finally {await writeFile(out+'/ui-results.json',JSON.stringify({base:'cbb05479388d508cb910b98ca6837d0d55614d36',branch:'codex/r5-block-7',environment:'Vite build + Edge headless; REST/session fixtures; no live JWT authorization or physical keyboard',results,errors,failure,result:failure?'FAIL':'PASS'},null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
`
await mkdir('.r5-check.local', { recursive: true })
const path = '.r5-check.local/requests-ui.mjs'
await writeFile(path, prefix + tests)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: process.env })
  console.log(stdout)
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r5-block-7/ui'
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-profile-ui.mjs', sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r5-requests-ui.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
