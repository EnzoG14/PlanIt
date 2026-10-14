import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
const { chromium }=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const root=resolve(process.env.PLANIT_UI_BUILD??'dist'), out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-4/ui', baseline=process.env.PLANIT_R5_BASELINE==='1'
await mkdir(out,{recursive:true})
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'}
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root)){res.writeHead(403);res.end();return}try{res.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');res.end(await readFile(path))}catch{res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const origin=`http://127.0.0.1:${server.address().port}`, browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']})
const viewer='20000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000002'
const user={id:viewer,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'}
const session={access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}
const canvasPage=await browser.newPage()
const png=Buffer.from(await canvasPage.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='#5b34d6';ctx.fillRect(0,0,32,32);return canvas.toDataURL('image/png').split(',')[1]}),'base64')
await canvasPage.close()
const pickerOnly=process.env.PLANIT_R5_PICKER_ONLY==='1'
const results=[],errors=[];let failure
try {
for(const width of baseline?[390,1280]:[320,360,375,390,768,1280]) {
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',...(pickerOnly&&width<768?{isMobile:true,hasTouch:true}:{})})
 await context.addInitScript(s=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(s)),session)
 await context.routeWebSocket('**',ws=>ws.close())
 let profile={username:'ana_fixture',display_name:'Ana Fixture',bio:'Biografía fixture',first_name:null,last_name:null,birth_date:null,sex:null,visibility:'private',avatar_file_id:null}
 let writes=0,uploads=0,relations=0,requests=0,readFail=false,saveMode='ok',avatarMode='ok',attempted=null,accepted=0,activeUser=user,delayedRelease
 const files=new Map(),objects=new Map()
 await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname
  const args=request.headers()['content-type']?.includes('json')?request.postDataJSON():null
  const reply=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)})
  if(path==='/auth/v1/user')return reply(activeUser)
  if(path==='/auth/v1/logout')return reply({})
  if(path==='/rest/v1/profiles') {assert.equal(url.searchParams.get('id'),`eq.${activeUser.id}`);if(readFail)return route.abort('failed');return reply({...profile,email:'PRIVATE_SENTINEL',irrelevant_secret:'PRIVATE_SENTINEL'})}
  if(path==='/rest/v1/files') {
   let found=[...files.values()].filter(f=>f.uploaded_by===viewer)
   const id=url.searchParams.get('id'),name=url.searchParams.get('storage_path')
   if(id)found=found.filter(f=>f.id===id.replace('eq.',''))
   if(name?.startsWith('eq.'))found=found.filter(f=>f.storage_path===name.slice(3))
   return reply(name?.startsWith('in.')?found:found[0]??null)
  }
  if(path==='/rest/v1/rpc/update_my_social_profile') {
   writes++;attempted=args;assert.deepEqual(Object.keys(args).sort(),['p_bio','p_birth_date','p_display_name','p_first_name','p_last_name','p_sex','p_username','p_visibility'])
   if(saveMode==='duplicate')return reply({code:'23505',message:'profiles_username_key'},409)
   if(saveMode==='lost')return route.abort('failed')
   if(saveMode==='delayed'||saveMode==='timeout')await new Promise(r=>{delayedRelease=r})
   const next=profile.visibility==='private'&&args.p_visibility==='public'?3:0;accepted+=next
   profile={...profile,...Object.fromEntries(Object.entries(args).map(([k,v])=>[k.slice(2),v]))}
   return reply({visibility:profile.visibility,accepted_requests:next})
  }
  if(path==='/rest/v1/rpc/get_social_counts'){relations++;return reply({followers:accepted,following:0})}
  if(path==='/rest/v1/rpc/list_follow_requests'){requests++;return reply({requests:[],next_cursor:null})}
  if(path==='/rest/v1/rpc/set_my_avatar') {
   if(avatarMode==='denied')return reply({code:'42501',message:'invalid_avatar'},403)
   if(avatarMode==='lost')return route.abort('failed')
   if(args.p_storage_path===null){profile.avatar_file_id=null;return reply(null)}
   assert.ok(args.p_storage_path.startsWith(viewer+'/'));assert.ok(objects.has(args.p_storage_path))
   const existing=files.get(args.p_storage_path),id=existing?.id??`86000000-0000-4000-8000-${String(files.size+1).padStart(12,'0')}`
   files.set(args.p_storage_path,{id,uploaded_by:viewer,bucket_name:'avatars',storage_path:args.p_storage_path,mime_type:'image/png'})
   profile.avatar_file_id=id;return reply(id)
  }
  if(path.startsWith('/storage/v1/object/avatars/')&&request.method()==='POST') {
   uploads++;const object=decodeURIComponent(path.slice('/storage/v1/object/avatars/'.length));assert.equal(request.headers()['x-upsert'],'false');assert.ok(object.startsWith(viewer+'/'))
   assert.ok(request.postDataBuffer().includes(Buffer.from('name="cacheControl"\r\n\r\n0')))
   if(objects.has(object))return reply({statusCode:'409',error:'Duplicate',message:'already exists'},409)
   objects.set(object,{id:'storage-fixture',name:object.split('/')[1],metadata:{size:png.length,mimetype:'image/png',cacheControl:'max-age=0'}})
   return reply({Id:'storage-fixture',Key:'avatars/'+object})
  }
  if(path==='/storage/v1/object/avatars'&&request.method()==='DELETE') {
   for(const name of args.prefixes)if(!files.has(name))objects.delete(name)
   return reply([])
  }
  if(path==='/storage/v1/object/list/avatars')return reply([...objects.entries()].filter(([path])=>path.startsWith(args.prefix)&&(!args.search||path.includes(args.search))).map(([,row])=>row))
  if(path.startsWith('/storage/v1/object/sign/avatars/'))return request.method()==='POST'?reply({signedURL:`/object/sign/avatars/${path.split('/avatars/')[1]}?token=fixture`}):route.fulfill({status:200,contentType:'image/png',body:png})
  if(path.startsWith('/rest/v1/'))return reply([])
  return reply({})
 })
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
 const check=test=>{results.push({width,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
 const editor=()=>page.getByLabel('Nombre visible',{exact:true}).waitFor()
 const save=()=>page.getByRole('button',{name:'Guardar datos y privacidad',exact:true}).click()
 const shot=name=>page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true})
 await page.goto(origin+'/me');await page.getByRole('heading',{name:'Ana Fixture',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready)
 if(baseline){await shot('before-own-profile');check('Baseline own profile executed with synthetic fixture');await context.close();continue}
 await page.getByRole('link',{name:'Editar perfil y privacidad'}).click();await editor()
 assert.equal(await page.getByRole('button',{name:'Guardar datos y privacidad',exact:true}).isDisabled(),true)
 assert.equal(await page.getByRole('heading',{level:1}).count(),1);assert.equal(await page.locator('.social-wash[aria-hidden=true]').count(),1)
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal((await page.locator('body').innerText()).includes('PRIVATE_SENTINEL'),false)
 await shot('editor');check('Protected route from own profile, Amanecer, no overflow, allowlisted state, unchanged values disable save')

 if(pickerOnly) {
  const input=page.getByLabel('Elegir foto',{exact:true})
  const attributes=await input.evaluate(node=>({accept:node.accept,capture:node.getAttribute('capture'),multiple:node.multiple,disabled:node.disabled}))
  assert.equal(attributes.capture,null);assert.equal(attributes.multiple,false);assert.equal(attributes.disabled,false)
  if(process.env.PLANIT_R5_PICKER_EXPECT_IMAGES==='1')assert.equal(attributes.accept,'image/*')
  const [cancelled]=await Promise.all([page.waitForEvent('filechooser'),page.locator('.profile-photo-picker').click()])
  assert.equal(cancelled.isMultiple(),false);await cancelled.setFiles([])
  assert.equal(await page.getByRole('button',{name:'Guardar foto',exact:true}).count(),0)
  await input.focus()
  const [keyboard]=await Promise.all([page.waitForEvent('filechooser'),page.keyboard.press('Space')]);await keyboard.setFiles([])
  const [chosen]=await Promise.all([page.waitForEvent('filechooser'),width<768?page.locator('.profile-photo-picker').tap():page.locator('.profile-photo-picker').click()])
  await chosen.setFiles({name:'galeria.png',mimeType:'image/png',buffer:png})
  await page.getByRole('button',{name:'Guardar foto',exact:true}).waitFor()
  assert.ok((await page.getByAltText('Vista previa de tu foto').getAttribute('src')).startsWith('blob:'));assert.equal(uploads,0);assert.equal(writes,0)
  await shot('picker-preview');results.push({width,test:'Native filechooser opened by click, keyboard and touch; cancel safe, selected photo previews with no upload',attributes,result:'PASS'})
  await page.getByRole('button',{name:'Descartar foto y limpiar carga'}).click()
  await page.getByText('Selección descartada; los archivos ya registrados se conservan.',{exact:true}).waitFor()
  const [invalid]=await Promise.all([page.waitForEvent('filechooser'),page.locator('.profile-photo-picker').click()])
  await invalid.setFiles({name:'galeria.gif',mimeType:'image/gif',buffer:png})
  await page.getByRole('alert').filter({hasText:'Elegí JPEG, PNG o WebP'}).waitFor();assert.equal(uploads,0)
  check('Picker choice still enforces JPEG/PNG/WebP validation before any upload')
  await context.close();continue
 }
 await page.getByLabel('Nombre visible',{exact:true}).fill('Ana Editada')
 await page.getByLabel('Username',{exact:true}).fill('ANA_EDITADA')
 await page.getByLabel('Biografía',{exact:true}).fill('Biografía actualizada')
 await page.getByLabel('Nombre',{exact:true}).fill('Dato privado fixture')
 await page.getByLabel('Apellido',{exact:true}).fill('Otro dato privado')
 await page.getByLabel('Fecha de nacimiento').fill('2000-02-29');await page.getByLabel('Sexo',{exact:true}).selectOption('other')
 await page.getByRole('radio',{name:/^Público/}).check();await save()
 await page.getByRole('dialog',{name:'¿Hacer público tu perfil?'}).waitFor();assert.equal(writes,0)
 assert.ok((await page.getByRole('dialog').innerText()).includes('Todas las solicitudes pendientes sin bloqueo'))
 assert.equal(await page.getByRole('button',{name:'Seguir editando',exact:true}).evaluate(n=>n===document.activeElement),true)
 await shot('privacy-confirm');await page.keyboard.press('Escape');assert.equal(writes,0)
 assert.equal(await page.getByRole('button',{name:'Guardar datos y privacidad',exact:true}).evaluate(n=>n===document.activeElement),true)
 await save();await page.getByRole('button',{name:'Hacer público y guardar'}).click()
 await page.getByText('Tus datos y privacidad quedaron guardados.',{exact:true}).waitFor()
 assert.equal(writes,1);assert.equal(profile.username,'ana_editada');assert.equal(accepted,3);assert.ok(relations>0&&requests>0)
 check('D04 explicit confirmation/cancel/focus, one RPC with no owner ID, lowercase normalization, personal fields, relationship refresh')
 await page.getByRole('radio',{name:/^Privado/}).check();await save();await page.getByText('Tus datos y privacidad quedaron guardados.',{exact:true}).waitFor();assert.equal(accepted,3);assert.equal(await page.getByRole('dialog').count(),0)
 await page.getByRole('link',{name:'Volver a mi perfil'}).click();await page.getByRole('heading',{name:'Ana Editada',exact:true}).waitFor();assert.equal(await page.getByText('Perfil privado',{exact:true}).count(),1)
 await page.getByRole('link',{name:'Editar perfil y privacidad'}).click();await editor();assert.equal(await page.getByLabel('Username',{exact:true}).inputValue(),'ana_editada')
 check('Public→private keeps accepted, return and reload persist all editable values in fixture backend')
 await page.getByLabel('Username',{exact:true}).fill('ab');await save();await page.getByText('Usá entre 3 y 24 letras minúsculas, números o guiones bajos.',{exact:true}).waitFor();assert.equal(writes,2)
 await page.getByLabel('Username',{exact:true}).fill('duplicado');saveMode='duplicate';await save();await page.getByRole('alert').filter({hasText:'Ese username ya está en uso'}).waitFor();assert.equal(profile.username,'ana_editada')
 check('Invalid username prevented before write; backend duplicate shown without false success')
 saveMode='lost';await page.getByLabel('Username',{exact:true}).fill('guardado_tardio');await save();await page.getByRole('button',{name:'Comprobar guardado'}).waitFor();assert.equal(await page.getByLabel('Username',{exact:true}).isDisabled(),true)
 await page.getByRole('link',{name:'Volver a mi perfil'}).click();await page.getByRole('dialog',{name:'¿Salir de Editar perfil?'}).waitFor();await page.getByRole('button',{name:'Seguir editando',exact:true}).click()
 const writesBefore=writes;profile={...profile,...Object.fromEntries(Object.entries(attempted).map(([k,v])=>[k.slice(2),v]))};saveMode='ok'
 await page.getByRole('button',{name:'Comprobar guardado'}).click();await page.getByText('Tus datos y privacidad quedaron guardados.',{exact:true}).waitFor();assert.equal(writes,writesBefore)
 check('Lost response locks edits, navigation warns, check-only reconciles late commit without another write')
 const picker=page.getByLabel('Elegir foto',{exact:true})
 await picker.setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await page.getByRole('alert').filter({hasText:'Elegí JPEG, PNG o WebP'}).waitFor();assert.equal(uploads,0)
 await picker.setInputFiles({name:'empty.png',mimeType:'image/png',buffer:Buffer.alloc(0)});assert.equal(uploads,0)
 await picker.setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)});assert.equal(uploads,0)
 await picker.setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.getByRole('alert').filter({hasText:'No pudimos leer'}).waitFor();assert.equal(uploads,0)
 await picker.setInputFiles({name:'foto.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'Guardar foto',exact:true}).waitFor();await shot('avatar-preview')
 avatarMode='denied';await page.getByRole('button',{name:'Guardar foto',exact:true}).click();await page.getByRole('alert').filter({hasText:'No tenés permiso'}).waitFor();assert.equal(profile.avatar_file_id,null)
 avatarMode='ok';await page.getByRole('button',{name:'Guardar foto',exact:true}).click();await page.getByText('Tu foto quedó guardada.',{exact:true}).waitFor();assert.equal(uploads,1)
 const first=profile.avatar_file_id;assert.ok(first)
 await page.getByLabel('Elegir foto',{exact:true}).setInputFiles({name:'conflict.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'Guardar foto',exact:true}).waitFor()
 profile.avatar_file_id='86000000-0000-4000-8000-000000000099';const beforeConflict=uploads
 await page.getByRole('button',{name:'Guardar foto',exact:true}).click();await page.getByRole('alert').filter({hasText:'La foto cambió en otra sesión'}).waitFor();assert.equal(uploads,beforeConflict)
 profile.avatar_file_id=first;await page.getByRole('button',{name:'Descartar foto y limpiar carga'}).click();await page.getByText('Selección descartada; los archivos ya registrados se conservan.',{exact:true}).waitFor()
 check('Avatar selection detects a concurrent reference change before upload and preserves the other session')
 await page.getByLabel('Elegir foto',{exact:true}).setInputFiles({name:'otra.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'Guardar foto',exact:true}).waitFor()
 avatarMode='lost';await page.getByRole('button',{name:'Guardar foto',exact:true}).click();await page.getByRole('button',{name:'Comprobar foto',exact:true}).waitFor();assert.equal(profile.avatar_file_id,first)
 avatarMode='ok';await page.getByRole('button',{name:'Comprobar foto',exact:true}).click();await page.getByRole('button',{name:'Guardar foto',exact:true}).waitFor()
 await page.getByRole('button',{name:'Descartar foto y limpiar carga'}).click();await page.getByText('Selección descartada; los archivos ya registrados se conservan.',{exact:true}).waitFor();assert.equal(objects.size,1);assert.equal(files.size,1)
 await page.getByRole('button',{name:'Quitar foto',exact:true}).click();await page.getByText('Foto retirada del perfil.',{exact:true}).waitFor();assert.equal(profile.avatar_file_id,null);assert.equal(objects.size,1)
 check('Avatar MIME/size/decode validation; immutable owner path/cacheControl0/no upsert; failed link preserves old; lost response reconciles; staging cleanup and registered retention; remove')
 objects.set(viewer+'/87000000-0000-4000-8000-000000000001.png',{id:'orphan-fixture',name:'87000000-0000-4000-8000-000000000001.png',metadata:{mimetype:'image/png',size:png.length}})
 await page.getByRole('button',{name:'Revisar cargas interrumpidas'}).click();await page.getByRole('button',{name:'Limpiar cargas sin vincular'}).waitFor();await page.getByRole('button',{name:'Limpiar cargas sin vincular'}).click();await page.getByText('No encontramos cargas sin vincular entre las últimas 100.',{exact:true}).waitFor();assert.equal(objects.size,1)
 check('Reload recovery discovers only unregistered own uploads; cleanup retains registered former avatar')
 await page.getByLabel('Biografía',{exact:true}).fill('Texto largo '.repeat(50));await page.getByLabel('Nombre visible',{exact:true}).fill('María de los Ángeles Fernández '.repeat(2));await save();await page.getByText('La biografía puede tener hasta 500 caracteres.',{exact:true}).waitFor()
 await page.getByRole('link',{name:'Volver a mi perfil'}).click();await page.getByRole('button',{name:'Salir y descartar edición'}).click();await page.getByRole('heading',{name:'Ana Editada',exact:true}).waitFor()
 readFail=true;await page.getByRole('link',{name:'Editar perfil y privacidad'}).click();await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();readFail=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await editor()
 await page.getByLabel('Username',{exact:true}).focus();assert.equal(await page.getByLabel('Username',{exact:true}).evaluate(n=>getComputedStyle(n).outlineWidth),'3px')
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('expanded-text')
 check('Long-text validation, discard navigation, loading failure/retry, visible keyboard focus and enlarged text without page overflow')
 if(width===390) {
  await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width,height:480});await shot('short-height')
  await page.getByLabel('Nombre visible',{exact:true}).fill('Nombre después de timeout');saveMode='timeout';await save()
  await page.getByRole('button',{name:'Comprobar guardado'}).waitFor({timeout:15000});assert.equal(await page.getByLabel('Nombre visible',{exact:true}).isDisabled(),true)
  await shot('timeout');const beforeTimeoutCheck=writes;delayedRelease?.();await page.waitForTimeout(100);saveMode='ok'
  await page.getByRole('button',{name:'Comprobar guardado'}).click();await page.getByText('Tus datos y privacidad quedaron guardados.',{exact:true}).waitFor();assert.equal(writes,beforeTimeoutCheck)
  check('Actual 10s RPC deadline remains uncertain; late commit reconciled without repeating mutation')
  await page.getByLabel('Nombre visible',{exact:true}).fill('Sesión anterior');saveMode='delayed';await save();await page.waitForTimeout(100)
  activeUser={...user,id:other,email:'other@example.invalid'}
  const next={...session,access_token:'fixture-other',user:activeUser}
  await page.evaluate(s=>{const key='sb-iepeqmvzjguwlhnecsdq-auth-token',old=localStorage.getItem(key);localStorage.setItem(key,JSON.stringify(s));window.dispatchEvent(new StorageEvent('storage',{key,oldValue:old,newValue:JSON.stringify(s),storageArea:localStorage}));new BroadcastChannel(key).postMessage({event:'SIGNED_IN',session:s})},next)
  await page.waitForTimeout(250);delayedRelease?.();await page.waitForTimeout(400)
  assert.equal(await page.getByText('Tus datos y privacidad quedaron guardados.',{exact:true}).count(),0)
  check('Account/token change discards old editor and ignores late save response; short viewport emulation')
 }
 await context.close()
}
assert.deepEqual(errors,[])
} catch(error){failure=error.message;throw error}
finally {await writeFile(out+'/results.json',JSON.stringify({environment:'Edge production build; synthetic Auth/REST/Storage fixtures, no real JWT or Storage transport',baseline,pickerOnly,results,errors,failure:failure??null,result:failure?'FAIL':'PASS'},null,2)+'\n');await browser.close();await new Promise(r=>server.close(r))}
