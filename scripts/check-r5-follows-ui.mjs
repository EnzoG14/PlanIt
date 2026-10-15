import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Reuse B3 build server + isolated fake session, with B6 REST fixtures/assertions.
// Fixtures test UI behavior; real authorization is covered by local SQL separately.
const source = await readFile('scripts/check-r5-profile-ui.mjs', 'utf8')
const prefix = source.slice(0, source.indexOf('const results=[], errors=[]'))
  .replace("'docs/qa/r5-block-3/ui'", "'docs/qa/r5-block-6/ui'")
const tests = String.raw`
const results=[],errors=[];let failure;
try {
  for(const width of baseline?[390,1280]:[320,360,375,390,768,1280]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    await context.addInitScript(value=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value)),session);
    let visibility='public',status=null,blocked=false,blockOnWrite=false,network=false,loseResponse=false,slow=false,release,writeCount=0,deniedList=false,malformed=false,long=false,peopleCount=34;
    const people=Array.from({length:34},(_,i)=>({user_id:'88000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),display_name:'Persona '+(i+1),username:'persona_'+(i+1),avatar:null}));
    await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
      const path=new URL(route.request().url()).pathname,args=route.request().postDataJSON();
      const reply=(data,code=200)=>route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)});
      const deny=()=>reply({code:'42501',message:'profile_unavailable'},403);
      const expanded=visibility==='public'||status==='accepted';
      if(path==='/auth/v1/user') return reply(user);
      if(path==='/auth/v1/logout') return reply({});
      if(path==='/rest/v1/profiles') return reply({username:'fixture_me',display_name:'Mi cuenta fixture',first_name:null,last_name:null,birth_date:null,sex:null,bio:null,visibility:'public',avatar_file_id:null});
      if(path==='/rest/v1/rpc/get_social_profile') {
        if(network) return route.abort('failed');
        if(blocked) return reply({unavailable:true});
        return reply({display_name:args.p_user_id===target?'Camila Torres':'Persona',username:'camila',avatar:null,...(expanded?{bio:'Bio social autorizada'}:{}),email:'PRIVATE_SENTINEL',birth_date:'PRIVATE_SENTINEL'});
      }
      if(path==='/rest/v1/rpc/get_social_relationship') return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility,follow:status?{status,request_version:target}:null});
      if(path==='/rest/v1/rpc/get_social_profile_events') return expanded&&!blocked?reply({events:[],next_cursor:null}):deny();
      if(path==='/rest/v1/rpc/get_social_counts') return expanded&&!blocked?reply({followers:status==='accepted'?35:34,following:2,email:'PRIVATE_SENTINEL'}):deny();
      if(path==='/rest/v1/rpc/list_social_follows') {
        if(network) return route.abort('failed');
        if(deniedList||!expanded||blocked) return deny();
        const rows=people.slice(0,peopleCount).filter(p=>!args.p_after_user_id||p.user_id>args.p_after_user_id);
        return reply({users:rows.slice(0,30).map(p=>({...p,display_name:long?'Nombre visible muy extenso '.repeat(8):p.display_name,email:'PRIVATE_SENTINEL'})),next_cursor:malformed?'bad':rows.length>30?rows[29].user_id:null});
      }
      if(path.endsWith('/follow_user')||path.endsWith('/unfollow_user')) {
        writeCount++;assert.deepEqual(Object.keys(args),['p_target_id']);assert.equal(args.p_target_id,target);
        if(blockOnWrite) {blockOnWrite=false;blocked=true}
        if(blocked) return deny();
        status=path.endsWith('/unfollow_user')?null:visibility==='public'?'accepted':'pending';
        if(slow) {slow=false;await new Promise(resolve=>{release=resolve})}
        if(loseResponse) {loseResponse=false;return route.abort('failed')}
        return reply(status?{status,request_version:target}:null);
      }
      if(path==='/functions/v1/social-avatar') return reply({error:'avatar_unavailable'},503);
      if(path.startsWith('/rest/v1/')) return reply([]);
      return reply({});
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const check=test=>{results.push({viewport:width,test,result:'PASS'});console.log('PASS '+width+': '+test)};
    const shot=async name=>{if(width===390||width===1280) await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true})};
    const update=async()=>{await page.getByRole('button',{name:'Actualizar perfil',exact:true}).click();await page.getByRole('heading',{name:'Camila Torres',exact:true}).waitFor()};
    const button=name=>page.getByRole('button',{name,exact:true});
    await page.goto(origin+'/users/'+target);await page.getByRole('heading',{name:'Camila Torres',exact:true}).waitFor();
    if(baseline) {await shot('before-public');await context.close();continue;}
    await button('Seguir').waitFor();
    const contrast=async name=>{
      const ratio=await button(name).evaluate(node=>{
        const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>{const channel=value/255;return channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4});return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722};
        const style=getComputedStyle(node),fg=luminance(style.color),bg=luminance(style.backgroundColor);
        return (Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05);
      });
      assert.ok(ratio>=4.5,name+': measured text contrast '+ratio);
    };
    await contrast('Seguir');await shot('public');
    await button('Seguir').click();await button('Dejar de seguir').waitFor();assert.equal(writeCount,1);
    await page.getByRole('link',{name:'35 seguidores',exact:true}).waitFor();await shot('accepted');
    await page.reload();await button('Dejar de seguir').waitFor();
    await button('Dejar de seguir').click();await button('Volver').click();assert.equal(writeCount,1);
    await button('Dejar de seguir').click();await button('Confirmar').click();await button('Seguir').waitFor();assert.equal(writeCount,2);
    check('CA01/03 public follow count, reload, cancel and confirmed unfollow');
    visibility='private';await update();await contrast('Solicitar seguimiento');await button('Solicitar seguimiento').click();await button('Cancelar solicitud').waitFor();
    assert.equal(await page.locator('.social-profile-bio').count(),0);assert.equal(await page.locator('.social-follow-counts').count(),0);await shot('pending');
    await page.reload();await button('Cancelar solicitud').waitFor();
    visibility='public';status='accepted';await update();await button('Dejar de seguir').waitFor();
    visibility='private';await update();await button('Dejar de seguir').waitFor();assert.equal(await page.locator('.social-profile-bio').count(),1);
    await button('Dejar de seguir').click();await button('Confirmar').click();await button('Solicitar seguimiento').waitFor();assert.equal(await page.locator('.social-profile-bio').count(),0);
    await button('Solicitar seguimiento').click();await button('Cancelar solicitud').waitFor();await button('Cancelar solicitud').click();await button('Confirmar').click();await button('Solicitar seguimiento').waitFor();
    check('CA02/03 private pending exact minimum, cancellation, D04 polling acceptance, accepted survives privatization, unfollow revocation');
    visibility='public';status=null;await update();loseResponse=true;await button('Seguir').click();await button('Consultar estado').waitFor();
    assert.equal(await button('Seguir').isDisabled(),true);assert.equal(await page.locator('.social-profile-bio').count(),0);await shot('uncertain');
    const before=writeCount;await button('Consultar estado').click();await button('Dejar de seguir').waitFor();assert.equal(writeCount,before);
    check('Lost mutation response: no uncertain success, no resend, explicit read reconciles committed follow');
    status=null;await update();slow=true;await button('Seguir').click();await button('Confirmando…').waitFor();assert.equal(await button('Confirmando…').isDisabled(),true);
    for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);release();release=null;await button('Dejar de seguir').waitFor();
    check('CA04 double-submit disabled, allowlist args actor/status never provided');
    status=null;await update();await page.clock.install();await page.reload();await button('Seguir').waitFor();slow=true;
    await button('Seguir').click();for(let i=0;!release&&i<100;i++) await new Promise(r=>setTimeout(r,10));assert.ok(release);
    await page.clock.runFor(10001);await button('Consultar estado').waitFor();assert.equal(await button('Seguir').isDisabled(),true);assert.equal(await page.locator('.social-profile-bio').count(),0);
    release();release=null;await button('Consultar estado').click();await button('Dejar de seguir').waitFor();
    check('10s mutation timeout hides derived content and requery confirms server state without resend');
    blocked=true;await button('Actualizar perfil').click();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();assert.equal(await page.locator('.social-identity,.social-follow-counts,.social-follow-action').count(),0);await shot('blocked');
    blocked=false;visibility='public';status=null;await page.reload();await button('Seguir').waitFor();
    blockOnWrite=true;await button('Seguir').click();await page.getByRole('heading',{name:'Perfil no disponible',exact:true}).waitFor();assert.equal(await page.locator('.social-identity,.social-follow-action').count(),0);
    blocked=false;await page.reload();await button('Seguir').waitFor();
    check('Blocking between render and mutation immediately reconciles denial and clears identity/controls');
    await page.getByRole('link',{name:'34 seguidores',exact:true}).click();await page.locator('.social-participant-link').first().waitFor();assert.equal(await page.locator('.social-participant-link').count(),30);
    await button('Cargar más personas').click();await page.locator('.social-participant-link').nth(33).waitFor();assert.equal(await page.locator('.social-participant-link').count(),34);await shot('followers');
    await page.locator('.social-participant-link').first().click();await page.getByRole('link',{name:'Volver a la lista',exact:true}).waitFor();await page.getByRole('link',{name:'Volver a la lista',exact:true}).click();await page.locator('.social-participant-link').first().waitFor();
    deniedList=true;await button('Actualizar lista').click();await page.getByRole('heading',{name:'Lista no disponible',exact:true}).waitFor();assert.equal(await page.locator('.social-participant-link').count(),0);await shot('denied');
    deniedList=false;await button('Actualizar lista').click();await page.locator('.social-participant-link').first().waitFor();
    network=true;await button('Actualizar lista').click();await button('Reintentar').waitFor();assert.equal(await page.locator('.social-participant-link').count(),0);
    network=false;await button('Reintentar').click();await page.locator('.social-participant-link').first().waitFor();
    malformed=true;await button('Actualizar lista').click();await button('Reintentar').waitFor();assert.equal(await page.locator('.social-participant-link').count(),0);malformed=false;await button('Reintentar').click();await page.locator('.social-participant-link').first().waitFor();
    peopleCount=0;await button('Actualizar lista').click();await page.getByRole('heading',{name:'Todavía no hay seguidores visibles',exact:true}).waitFor();await shot('empty');
    peopleCount=34;long=true;await button('Actualizar lista').click();await page.locator('.social-participant-link').first().waitFor();await page.setViewportSize({width,height:480});
    await page.addStyleTag({content:'html { font-size: 200%; } .social-follow-name { font-size: 2em; }'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('long-text');
    await page.locator('.social-participant-link').first().focus();assert.equal(await page.locator('.social-participant-link').first().evaluate(el=>getComputedStyle(el).outlineWidth),'3px');
    await page.keyboard.press('Enter');await page.getByRole('link',{name:'Volver a la lista',exact:true}).waitFor();
    check('Lists: 30+4, safe return, denial/network/malformed clears previous rows, retry/empty, 200% long text and keyboard focus');
    await page.goto(origin+'/users/'+target+'/following');await page.locator('.social-participant-link').first().waitFor();assert.equal(await page.locator('.social-participant-link').count(),30);
    assert.equal((await page.locator('body').innerText()).includes('PRIVATE_SENTINEL'),false);
    const count=await page.locator('nav[aria-label="Navegación principal"] a').count();assert.ok(count<=4);
    check('following route, no private payload in DOM, no primary tab added');
    await page.goto(origin+'/me');await page.getByRole('heading',{name:'Mi cuenta fixture',exact:true}).waitFor();
    await page.getByRole('link',{name:'34 seguidores',exact:true}).click();assert.ok(page.url().endsWith('/users/'+viewer+'/followers'));await page.locator('.social-participant-link').first().waitFor();
    await page.getByRole('link',{name:'Volver al perfil',exact:true}).click();await page.getByRole('heading',{name:'Mi cuenta fixture',exact:true}).waitFor();assert.equal(await page.locator('.social-follow-action').count(),0);
    check('Own profile counts and follower list return to me; self has no follow action');
    await context.close();
  }
  assert.deepEqual(errors,[]);
} catch(error) {failure={message:error.message,stack:error.stack};throw error}
finally {await writeFile(out+'/ui-results.json',JSON.stringify({base:'54b4749b1c12775e0d6c800b15d82aeb8ecdafbc',branch:'codex/r5-block-6',environment:'Vite build + Edge headless, REST/session fixtures; not live JWT authorization',results,errors,failure,result:failure?'FAIL':'PASS'},null,2));await browser.close();await new Promise(r=>server.close(r));}
`
await mkdir('.r5-check.local', { recursive: true })
const path = '.r5-check.local/follows-ui.mjs'
await writeFile(path, prefix + tests)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: process.env })
  console.log(stdout)
  const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r5-block-6/ui'
  await writeFile(`${out}/harness.json`, JSON.stringify({ inherited: 'scripts/check-r5-profile-ui.mjs', sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r5-follows-ui.mjs', stdout, stderr }, null, 2))
} finally { await unlink(path) }
