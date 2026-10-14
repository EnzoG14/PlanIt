import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
// Reuse B3's build server, session/REST fixtures and cleanup. B5 assertions are
// separate; SQL/HTTP tests prove authorization, these fixtures prove rendering.
const source=await readFile('scripts/check-r5-profile-ui.mjs','utf8')
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-5/ui'
const tests=String.raw`
    page.setDefaultTimeout(5000);
    minimal=true;
    await page.goto(origin+'/users/'+target);await loaded();await page.evaluate(()=>document.fonts.ready);
    const minimum=async()=>{
      await loaded();
      assert.equal(await page.getByRole('heading',{name:'Acerca de',exact:true}).count(),0);
      assert.equal(await page.getByRole('heading',{name:'Eventos públicos',exact:true}).count(),0);
      assert.equal(await links().count(),0);
      assert.equal((await page.locator('body').innerText()).includes('PRIVATE_SENTINEL'),false);
    };
    assert.equal(reads,0);await minimum();await screenshot('private-minimum');
    await page.reload();await minimum();assert.equal(reads,0);
    check('B5 direct/reloaded private minimum has exactly identity, no events request or reserved fields');
    minimal=false;await update();await loaded();
    assert.equal(await links().count(),30);await screenshot('private-accepted');
    await page.getByRole('button',{name:'Cargar más eventos',exact:true}).click();await loaded();
    assert.equal(await links().count(),34);assert.equal(new Set(await links().evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))).size,34);
    assert.equal((await page.locator('body').innerText()).includes('PRIVATE_SENTINEL'),false);
    check('B5 accepted bio/public events, allowlist, stable 30+4 pagination');
    if(process.env.PLANIT_B5_BASELINE==='1') {
      eventAction='minimal-denied';await update();
      await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();await screenshot('revoked-before-fix');
      await minimum(); // Expected FAIL on main: authorized minimum is lost until polling.
    }
    for(const action of ['minimal-success','blocked-success','blocked-denied','minimal-denied']) {
      minimal=false;blocked=false;eventsDenied=false;eventAction=action;
      await update();
      if(action.startsWith('minimal')) {await minimum();await screenshot('private-'+action)}
      else {
        await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();
        assert.equal(await page.locator('.social-identity').count(),0);assert.equal(await links().count(),0);
        await screenshot('private-'+action);
      }
      check('B5 mid-read '+action+' reconciles current authorized projection');
      minimal=false;blocked=false;eventsDenied=false;await update();await loaded();
    }
    eventsDenied=true;await update();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();
    assert.equal(await links().count(),0);eventsDenied=false;await update();await loaded();
    await page.reload();await loaded();
    eventAction='second-page-minimal';eventPages=0;
    await page.getByRole('button',{name:'Cargar más eventos',exact:true}).click();await minimum();
    check('B5 revoked second page drops all prior pages; denied events with expanded gate stay unavailable');
    minimal=false;eventAction=null;await update();await loaded();
    eventAction='minimal-denied';failRecheck=true;await update();
    await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
    assert.equal(await page.locator('.social-identity').count(),0);assert.equal(await links().count(),0);await screenshot('recheck-error');
    failRecheck=false;minimal=true;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await minimum();
    check('B5 failed reconciliation exposes no old data and retry recovers minimum');
    minimal=false;await update();await loaded();slowEvents=true;await update();
    // Condition is bounded so a fixture regression cannot hang the harness.
    for(let attempt=0;!releaseEvents&&attempt<100;attempt++) await new Promise(resolve=>setTimeout(resolve,10));
    assert.ok(releaseEvents);minimal=true;releaseEvents();releaseEvents=null;await minimum();
    check('B5 late authorized events cannot restore revoked bio or prior pages');
    minimal=false;count=0;nullBio=true;await update();await loaded();
    await page.getByRole('heading',{name:'No hay eventos públicos vigentes',exact:true}).waitFor();
    assert.equal(await page.getByText('Todavía no agregó una biografía.',{exact:true}).count(),1);await screenshot('private-accepted-empty');
    nullBio=false;count=34;await update();await loaded();
    blocked=true;await update();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();
    assert.equal(await page.locator('.social-avatar').count(),0);blocked=false;
    network=true;await update();await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
    assert.equal(await links().count(),0);network=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await loaded();
    check('B5 accepted empty, blocked neutral, network failure and retry');
    await page.goto(origin+'/events/'+participantEvent+'/attendees?view=social');await page.locator('.social-participant-link').click();await loaded();
    await links().first().focus();assert.equal(await links().first().evaluate(node=>getComputedStyle(node).outlineWidth),'3px');await screenshot('keyboard-focus');
    await page.keyboard.press('Enter');await page.getByRole('link',{name:'Volver al perfil',exact:true}).click();await loaded();
    await page.getByRole('link',{name:'Volver a participantes',exact:true}).click();await page.locator('.social-participant-link').waitFor();
    await page.goto(origin+'/users/'+target);await loaded();
    assert.ok((await page.getByRole('button',{name:'Actualizar perfil',exact:true}).boundingBox()).height>=44);
    long=true;count=1;await update();await page.waitForFunction(()=>document.querySelectorAll('.social-profile-event').length===1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await screenshot('long');
    await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.social-identity-page *')];const sizes=nodes.map(node=>parseFloat(getComputedStyle(node).fontSize));nodes.forEach((node,index)=>node.style.fontSize=(sizes[index]*2)+'px')});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await screenshot('text-200');
    await page.setViewportSize({width,height:480});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    check('B5 keyboard roundtrip, focus3px, targets44px, long text, 200% and low height');
    long=false;count=34;await page.reload();await loaded();
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});
    assert.equal(await page.locator('.social-identity').count(),0);
    minimal=true;await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});await minimum();
    minimal=false;await update();await loaded();await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
    assert.equal(await links().count(),0);await context.setOffline(false);minimal=true;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await minimum();
    check('B5 hidden/return and offline/reconnect clear data and revalidate revoked permission');
    if(width===390) {
      minimal=false;await update();await loaded();await page.clock.install();await page.reload();await loaded();
      blocked=true;await page.clock.fastForward(31000);await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();
      blocked=false;await update();await loaded();
      release=null;slow=true;await update();
      for(let attempt=0;!release&&attempt<100;attempt++) await new Promise(resolve=>setTimeout(resolve,10));
      assert.ok(release);await page.clock.fastForward(11000);await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
      assert.equal(await links().count(),0);release();release=null;await page.clock.resume();
      await page.getByRole('button',{name:'Reintentar',exact:true}).click();await loaded();
      check('B5 visible30s polling and 10s deadline discard blocked/late data');
    }
    slow=true;release=null;await update();
    await page.goto(origin+'/users/not-a-uuid');await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();release?.();
    assert.equal(await links().count(),0);
    await page.goto(origin+'/users/'+viewer);await page.waitForURL('**/me');
    await page.goto(origin+'/users/'+target);await loaded();
    await page.getByRole('button',{name:'Cuenta',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.waitForURL(url=>url.pathname==='/login');
    assert.equal(await links().count(),0);
    check('B5 late route request, invalid ID, self→me and logout remove prior social data');
`
let compiled=source.replaceAll('\r\n','\n')
const start=compiled.indexOf('    await page.goto(`${origin}/users/${target}`);await loaded();await page.evaluate(()=>document.fonts.ready)')
const end=compiled.indexOf('    await context.close()\n  }',start)
assert.ok(start>0&&end>start)
compiled=compiled.slice(0,start)+tests+compiled.slice(end)
compiled=compiled.replace('let blocked=false,','let eventAction=null,eventPages=0,failRecheck=false,slowEvents=false,releaseEvents;\n    let blocked=false,')
compiled=compiled.replace("if(path==='/rest/v1/rpc/get_social_profile') {","if(path==='/rest/v1/rpc/get_social_profile') {\n        if(failRecheck&&minimal) return route.abort('failed')")
compiled=compiled.replace('reads++;assert.deepEqual',`reads++;
        if(slowEvents) {slowEvents=false;await new Promise(resolve=>{releaseEvents=resolve})}
        if(eventAction) {
          eventPages++;
          if(eventAction!=='second-page-minimal'||eventPages===2) {
            const action=eventAction;eventAction=null;
            if(action.startsWith('minimal')||action==='second-page-minimal') minimal=true;else blocked=true;
            if(action.endsWith('denied')||action==='second-page-minimal') return reply({code:'42501',message:'profile_unavailable'},403);
          }
        }
        assert.deepEqual`)
if(process.env.PLANIT_B5_BASELINE==='1') compiled=compiled.replace('for(const width of baseline?[390,1280]:[320,360,375,390,768,1280])','for(const width of [390])')
await mkdir(out,{recursive:true});await mkdir('.r5-check.local',{recursive:true})
const path='.r5-check.local/private-profile-ui.mjs'
await writeFile(path,compiled)
let failure,stdout='',stderr=''
try {({stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_UI_OUTPUT:out}}));console.log(stdout)}
catch(error) {stdout=error.stdout??'';stderr=error.stderr??'';failure='UI assertions failed; see harness output';console.log(stdout);console.error(stderr);process.exitCode=1}
finally {await unlink(path);await writeFile(out+'/harness.json',JSON.stringify({source:'scripts/check-r5-profile-ui.mjs',sha256:createHash('sha256').update(source).digest('hex'),extension:'scripts/check-r5-private-profile-ui.mjs',stdout,stderr,result:failure?'FAIL':'PASS'},null,2)+'\n')}