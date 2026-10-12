import assert from 'node:assert/strict'
import { mkdir,writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const {chromium}=await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser=await chromium.launch({headless:true,channel:'msedge'})
const origin=process.env.PLANIT_UI_ORIGIN??'http://127.0.0.1:4186',out='docs/design/verification/r3-block-3'
await mkdir(out,{recursive:true})
const owner='20000000-0000-4000-8000-000000000001',guest='20000000-0000-4000-8000-000000000002',id='30000000-0000-4000-8000-000000000001'
const key='sb-iepeqmvzjguwlhnecsdq-auth-token',results=[]
const user=id=>({id,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-10T12:00:00Z'})
const fixturePage=await browser.newPage({viewport:{width:320,height:200}})
await fixturePage.setContent('<html><body style="background:#0753ff;color:white">Imagen de prueba</body></html>')
const file={name:'imagen.png',mimeType:'image/png',buffer:await fixturePage.screenshot()}
await fixturePage.close()
try{
 for(const [width,height] of [[360,800],[375,812],[390,844],[768,1024],[1280,900]]){
  let photos=Array.from({length:6},(_,n)=>({id:`40000000-0000-4000-8000-${String(n+1).padStart(12,'0')}`,file_id:`50000000-0000-4000-8000-${String(n+1).padStart(12,'0')}`,sort_order:n,files:{storage_path:`${owner}/${id}/${n}.png`}}))
  let uploads=0,adds=0,removes=0,orders=0,signs=0,uploadFailure=false,lost=false,missing=false,expired=false,readFailure=false,cleanupFailure=false,orphan=''
  const contexts=[],errors=[]
  const event={id,organizer_id:owner,title:'After primaveral — fixture',description:'Encuentro de prueba. Datos ficticios.',starts_at:'2099-10-12T22:00:00',ends_at:'2099-10-13T03:00:00',address:'Av. Corrientes 123',location_name:'Centro cultural',latitude:-34.6,longitude:-58.38,capacity:80,category_id:'10000000-0000-4000-8000-000000000001',visibility:'public',cancelled_at:null,archived_at:null}
  const imageSvg=path=>`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="600" height="420" fill="#101b43"/><circle cx="${100+(Number(path.split('/').at(-1)?.split('.')[0])||0)*50}" cy="110" r="150" fill="#743ade"/><path d="M0 300L200 180L400 350L600 230V420H0" fill="#0753ff"/><text x="30" y="390" fill="white" font-family="sans-serif" font-size="24">Imagen de prueba</text></svg>`
  async function pageFor(identity){
   const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo'});contexts.push(context)
   await context.addInitScript(({key,identity,user})=>localStorage.setItem(key,JSON.stringify({access_token:`fixture-${identity}`,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),{key,identity,user:user(identity)})
   await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname,body=req.headers()['content-type']?.includes('application/json') ? req.postDataJSON() : null
    const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
    if(path==='/auth/v1/user')return reply(user(identity))
    if(path==='/rest/v1/events'){if(readFailure)return route.abort('failed');return reply([event])}
    if(path==='/rest/v1/categories')return reply([{id:event.category_id,name:'Música',is_active:true}])
    if(path==='/rest/v1/event_images')return reply(photos)
    if(path==='/storage/v1/object/sign/event_media'){signs++;return reply(body.paths.map(path=>({path,signedURL:`/object/sign/event_media/${path}?token=fixture-${signs}`})))}
    if(path.startsWith('/storage/v1/object/sign/event_media/'))return expired?reply({error:'expired'},403):route.fulfill({contentType:'image/svg+xml',body:imageSvg(path)})
    if(path.startsWith('/storage/v1/object/event_media/') && req.method()==='POST'){
     uploads++;orphan=decodeURIComponent(path.slice('/storage/v1/object/event_media/'.length));if(uploadFailure)return route.abort('failed');return reply({Key:`event_media/${orphan}`})
    }
    if(path==='/storage/v1/object/event_media' && req.method()==='DELETE'){if(cleanupFailure)return route.abort('failed');orphan='';return reply([])}
    if(path==='/rest/v1/rpc/add_event_image'){
     adds++;if(missing)return reply({code:'PGRST202',message:'missing'},404)
     assert.equal(body.p_event_id,id);assert.equal(Object.keys(body).length,2)
     const saved=photos.find(row=>row.files.storage_path===body.p_storage_path)
     if(!saved){if(photos.length>=10)return reply({code:'P0001',message:'gallery_full'},400);photos.push({id:crypto.randomUUID(),file_id:crypto.randomUUID(),sort_order:photos.length,files:{storage_path:body.p_storage_path}})}
     if(lost)return route.abort('failed');return reply(saved?.id??photos.at(-1).id)
    }
    if(path==='/rest/v1/rpc/remove_event_image'){removes++;photos=photos.filter(row=>row.id!==body.p_image_id);return reply(null)}
    if(path==='/rest/v1/rpc/reorder_event_images'){orders++;assert.deepEqual(body.p_expected_ids,photos.map(row=>row.id));photos=body.p_image_ids.map((id,n)=>({...photos.find(row=>row.id===id),sort_order:n}));return reply(null)}
    if(path==='/rest/v1/rpc/get_event_unregistered_uploads')return reply(orphan?[{storage_path:orphan}]:[])
    if(path==='/rest/v1/rpc/get_event_organizer')return reply([{display_name:'Organizador de prueba',username:'fixture'}])
    if(path==='/rest/v1/rpc/get_event_participation_summary')return reply([{confirmed_count:48,capacity:80,available_spots:32,own_status:null,is_organizer:identity===owner,event_state:'open'}])
    if(path==='/rest/v1/notifications')return route.fulfill({status:200,contentType:'application/json',headers:{'content-range':'*/0'},body:'[]'})
    return reply([])
   })
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));return page
  }
  const page=await pageFor(owner),grid=()=>page.getByRole('list',{name:'Imágenes guardadas'}),input=()=>page.getByLabel('Seleccionar imágenes',{exact:true})
  const check=test=>{results.push({viewport:`${width}x${height}`,test,result:'PASS'});console.log(`PASS ${width}: ${test}`)}
  await page.goto(`${origin}/events/${id}/gallery`);await page.getByRole('heading',{name:'Galería de imágenes',exact:true}).waitFor();await grid().locator('li').last().waitFor()
  assert.equal(await grid().locator('li').count(),6);assert.equal(await grid().locator('.gallery-cover').count(),1)
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`${out}/gallery-${width}.png`,fullPage:true});check('Original layout: two columns, cover, upload area, no horizontal overflow')
  const before=photos[0].id;await page.getByRole('button',{name:'Mover imagen 1 después',exact:true}).focus();await page.keyboard.press('Enter');await page.getByText('Orden guardado.',{exact:true}).waitFor();assert.equal(photos[1].id,before);assert.equal(orders,1)
  await page.reload();await grid().locator('li').last().waitFor();assert.equal(await grid().locator('li').count(),6);check('Accessible order persisted after reopen; first image remains cover')
  await page.getByRole('button',{name:'Quitar imagen 1',exact:true}).click();await page.getByRole('dialog').waitFor();await page.screenshot({path:`${out}/confirm-${width}.png`,fullPage:true});await page.getByRole('button',{name:'Conservar imagen',exact:true}).click();assert.equal(removes,0)
  await page.getByRole('button',{name:'Quitar imagen 1',exact:true}).click();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(removes,0)
  await page.getByRole('button',{name:'Quitar imagen 1',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Quitar imagen',exact:true}).click();await page.getByText('Imagen quitada.',{exact:true}).waitFor();assert.equal(await grid().locator('li').count(),5);check('Confirmation cancel leaves data; confirm removes and refreshes')
  const requests=uploads;await input().setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('fixture')});await page.getByRole('alert').filter({hasText:'Seleccioná JPEG'}).waitFor();assert.equal(uploads,requests)
  await input().setInputFiles({name:'corrupta.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.getByRole('button',{name:'Subir imagen',exact:true}).click();await page.getByRole('alert').filter({hasText:'No pudimos leer la imagen'}).waitFor();assert.equal(uploads,requests);await page.getByRole('button',{name:'Descartar y limpiar',exact:true}).click();await page.getByRole('heading',{name:'Imágenes por subir'}).waitFor({state:'hidden'})
  await input().setInputFiles(file);await page.getByRole('heading',{name:'Imágenes por subir'}).waitFor();assert.equal(uploads,requests);await page.getByRole('button',{name:'Subir imagen',exact:true}).click();await page.getByText('Imagen guardada.',{exact:true}).waitFor();assert.equal(await grid().locator('li').count(),6);check('Invalid file rejected before upload; preview is local; successful upload registers after Storage')
  uploadFailure=true;await input().setInputFiles(file);await page.getByRole('button',{name:'Subir imagen',exact:true}).click();await page.getByRole('alert').filter({hasText:'La carga se interrumpió'}).waitFor();const beforeAdds=adds;uploadFailure=false;await page.getByRole('button',{name:'Reintentar carga',exact:true}).click();await page.getByText('Imagen guardada.',{exact:true}).waitFor();assert.equal(adds,beforeAdds+1);assert.equal(photos.length,7);check('Interrupted upload displays error, retains path and retries explicitly')
  lost=true;await input().setInputFiles(file);await page.getByRole('button',{name:'Subir imagen',exact:true}).click();await page.getByRole('alert').filter({hasText:'No pudimos confirmar'}).waitFor();const writes=adds;lost=false;await page.getByRole('button',{name:'Reintentar carga',exact:true}).click();await page.getByText('Imagen guardada.',{exact:true}).waitFor();assert.equal(adds,writes);assert.equal(photos.length,8);check('Lost commit reconciles on retry without duplicate upload/association')
  missing=true;cleanupFailure=true;await input().setInputFiles(file);await page.getByRole('button',{name:'Subir imagen',exact:true}).click();await page.getByRole('alert').filter({hasText:'La limpieza quedó pendiente'}).waitFor();cleanupFailure=false;missing=false;await page.getByRole('button',{name:'Descartar y limpiar',exact:true}).click();await page.getByRole('heading',{name:'Imágenes por subir'}).waitFor({state:'hidden'});assert.equal(photos.length,8);check('RPC absent and failed cleanup retain explicit recovery, no false success')
  for(let n=0;n<2;n++){await input().setInputFiles(file);await page.getByRole('button',{name:'Subir imagen',exact:true}).click();await page.getByText('Imagen guardada.',{exact:true}).waitFor()}
  assert.equal(photos.length,10);assert.equal(await input().isDisabled(),true);await page.locator('.gallery-upload').evaluate(element=>{const transfer=new DataTransfer();transfer.items.add(new File(['fixture'],'eleventh.png',{type:'image/png'}));element.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}))});await page.getByRole('alert').filter({hasText:'Podés guardar hasta diez'}).waitFor();await page.reload();await grid().locator('li').last().waitFor();assert.equal(await grid().locator('li').count(),10);check('Tenth image saved, eleventh selection/drop rejected, persisted on reopen')
  expired=true;await page.getByRole('button',{name:'Actualizar galería y renovar fotos',exact:true}).click();await page.getByText('Foto no disponible. Renovala con Actualizar.').first().waitFor();expired=false;await page.getByRole('button',{name:'Actualizar galería y renovar fotos',exact:true}).click();await grid().locator('img').first().waitFor();check('Expired signed URL offers explicit renewal')
  await page.getByRole('link',{name:'Volver al evento',exact:true}).click();await page.getByRole('heading',{name:event.title,exact:true}).waitFor();assert.equal(await page.locator('.event-gallery img').count(),9);assert.ok((await page.locator('.event-hero img').getAttribute('src')).includes(photos[0].files.storage_path));check('Detail reload uses new first cover and ordered remaining images')
  const foreign=await pageFor(guest);await foreign.goto(`${origin}/events/${id}/gallery`);await foreign.getByRole('heading',{name:'Galería no disponible'}).waitFor();assert.equal(await foreign.getByLabel('Seleccionar imágenes',{exact:true}).count(),0);check('Foreign account direct route denied in fixture UI')
  readFailure=true;await page.goto(`${origin}/events/${id}/gallery`);await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();readFailure=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await grid().locator('li').last().waitFor();check('Load failure recovers explicitly')
  orphan=`${owner}/${id}/abandoned.png`;await page.getByRole('button',{name:'Revisar cargas interrumpidas',exact:true}).click();await page.getByRole('button',{name:'Limpiar cargas sin guardar',exact:true}).click();await page.getByText('Limpieza completada.',{exact:true}).waitFor();assert.equal(orphan,'');check('Reloaded abandoned upload discovered and cleaned explicitly')
  assert.deepEqual(errors,[]);for(const context of contexts)await context.close()
 }
 await writeFile(`${out}/ui-results.json`,JSON.stringify({environment:'Edge headless; Auth/REST/Storage fixtures; Asia/Tokyo; no real HTTP/JWT',results},null,2))
}finally{await browser.close()}
