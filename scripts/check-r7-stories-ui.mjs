import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { createHash } from 'node:crypto'

const out = process.env.PLANIT_STORIES_UI_OUTPUT ?? 'docs/design/verification/ui-back-navigation/stories', fixture = '.r7-stories-ui.local'
await mkdir(out, { recursive: true }); await mkdir(fixture, { recursive: true })
await writeFile(`${fixture}/index.html`, '<html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Historias · fixture B5</title><div id="root"></div><script type="module" src="/\u002er7-stories-ui.local/main.tsx"></script></html>')
await writeFile(`${fixture}/main.tsx`, `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{AuthContext}from'/src/features/auth/useAuth';import{EventStoriesEntry}from'/src/features/events/stories/EventStoriesEntry';import'/src/styles/tokens.css';function Fixture(){const[account,setAccount]=useState('user-a'),[allowed,setAllowed]=useState(true);return <AuthContext.Provider value={{session:{user:{id:account},access_token:'fixture'},loading:false,error:null,retry:()=>{}}}><main style={{maxWidth:560,margin:'auto',padding:16,background:'var(--pi-color-bg)'}}><h1>Encuentro de fotografía</h1><p>Datos sintéticos · prueba aislada B5</p><button onClick={()=>setAccount('user-b')}>Cambiar cuenta</button><button onClick={()=>setAllowed(false)}>Quitar permiso</button><EventStoriesEntry eventId="event-a" returnTo="/events/event-a" permissions={{can_read_stories:allowed,can_publish_story:true}} durationMs={1100}/></main></AuthContext.Provider>}createRoot(document.getElementById('root')).render(<Fixture/>);`)
const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
await server.listen()
const origin = `http://127.0.0.1:${server.httpServer.address().port}`
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = [], record = test => { results.push({ test, result: 'PASS' }); console.log('PASS', test) }
// Synthetic image with explicit label, never content from the original mockup.
const imagePage = await browser.newPage()
const png = Buffer.from(await imagePage.evaluate(() => { const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1080;const ctx=canvas.getContext('2d');ctx.fillStyle='#dfd6ff';ctx.fillRect(0,0,720,1080);ctx.fillStyle='#0753ff';ctx.fillRect(80,240,560,420);ctx.fillStyle='#060b27';ctx.font='36px sans-serif';ctx.fillText('Imagen sintética · QA B5',80,160);ctx.fillText('720 × 1080',80,760);return canvas.toDataURL('image/png').split(',')[1] }), 'base64')
await imagePage.close()
try {
  for (const width of [320,375,390,768,1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      const active = new Set(), create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
      URL.createObjectURL = blob => { const url = create(blob); active.add(url); return url }
      URL.revokeObjectURL = url => { active.delete(url); revoke(url) }
      window.__blobs = active
    })
    let mode = 'live', rpcFail = true, shortTTL = false, imageDenied = false
    const writes = [], uploads = []
    const stories = () => ['Sofía','Lucas','Sofía'].map((display_name, i) => ({ id: `story-${i}`, author_id: i % 2 ? 'b' : 'a', display_name, username: '', event_id: 'event-a', file_id: `file-${i}`, bucket_name: 'event_media', storage_path: `r7/stories/a/event-a/${i}.png`, mime_type: 'image/png', size_bytes: png.length, created_at: '2026-10-17T12:00:00', expires_at: shortTTL ? '2026-10-18T12:00:00' : '2026-10-18T12:00:00' }))
    await page.route('**/*.supabase.co/**', async route => {
      const url = route.request().url(), body = route.request().postDataJSON?.bind(route.request())
      const respond = (data, status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if (url.includes('/auth/v1/user')) return respond({ id:'user-a' })
      if (url.includes('get_event_stories')) {
        if (mode === 'denied') return respond({code:'42501',message:'denied'},403)
        return respond({ server_now: shortTTL ? '2026-10-18T11:59:59' : '2026-10-17T12:01:00', items: mode === 'empty' ? [] : stories(), next_cursor:null })
      }
      if (url.includes('reserve_event_media_upload')) { const p=body();uploads.push(p);return respond({file_id:p.p_file_id,attempt_id:p.p_attempt_id,bucket_name:'event_media',storage_path:`r7/stories/20000000-0000-4000-8000-000000000001/event-a/${p.p_attempt_id}.png`}) }
      if (url.includes('/storage/v1/object/')) return respond({Key:'fixture'})
      if (url.includes('get_event_media_upload_state')) return respond({uploaded:true,state:'reserved'})
      if (url.includes('r7-media-validate')) return respond({verified:true,file_id:body().file_id})
      if (url.includes('publish_event_story')) { const p=body();writes.push(p);return rpcFail ? respond({code:'40001',message:'uncertain'},500) : respond(p.p_story_id) }
      if (url.includes('r7-story-image')) return imageDenied ? respond({message:'denied'},403) : route.fulfill({contentType:'image/png',body:png,headers:{'Cache-Control':'no-store'}})
      return respond({})
    })
    // getSession reads the real Supabase storage adapter; only synthetic tokens.
    await context.addInitScript(() => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'user-a'},token_type:'bearer'})))
    await page.goto(`${origin}/${fixture}/index.html`)
    await page.getByRole('button',{name:'Sofía 2 historias'}).waitFor()
    await page.evaluate(()=>document.fonts.ready)
    await page.screenshot({path:`${out}/entry-${width}.png`,fullPage:true})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    await page.getByRole('button',{name:'Sofía 2 historias'}).click()
    await page.locator('.story-image img').waitFor()
    await page.waitForFunction(()=>document.querySelector('.story-image img')?.complete)
    await page.screenshot({path:`${out}/viewer-${width}.png`,fullPage:true})
    await page.waitForTimeout(1300)
    assert.match(await page.locator('.story-viewer [role=status]').innerText(),/1 de 3/)
    await page.keyboard.press('ArrowRight'); await page.getByText('Historia 2 de 3',{exact:true}).waitFor()
    await page.keyboard.press('ArrowLeft'); await page.getByText('Historia 1 de 3',{exact:true}).waitFor()
    await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog[open]').count(),0)
    assert.match(await page.evaluate(()=>document.activeElement.textContent),/Sofía/)
    assert.equal(await page.evaluate(()=>window.__blobs.size),0)
    record(`${width}: layout, native dialog, reduced-motion, keyboard sequence, Escape, focus and Blob cleanup`)
    await page.getByRole('button',{name:'Publicar historia',exact:true}).click()
    assert.equal(await page.getByText(/Una imagen JPEG, PNG o WebP/).count(), 0)
    await page.screenshot({path:`${out}/publisher-empty-${width}.png`,fullPage:true})
    const chooserReady = page.waitForEvent('filechooser')
    await page.getByRole('button', {name:'Tomar foto',exact:true}).click()
    const chooser = await chooserReady
    assert.equal(await chooser.element().getAttribute('capture'), 'user')
    await chooser.setFiles({name:'camara.png',mimeType:'image/png',buffer:png})
    await page.locator('.story-preview').waitFor()
    assert.equal(await page.getByLabel('Tomar foto para la historia').inputValue(), '')
    // Native camera/file selection may hide the document temporarily.
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange')) })
    assert.equal(await page.locator('.story-publisher[open]').count(), 1)
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange')) })
    assert.equal(await page.locator('.story-preview').count(), 1)
    record(`${width}: camera source, preview and composer retained across native-picker visibility`)
    await page.getByLabel('Imagen de la historia', { exact: true }).setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('bad')})
    await page.getByRole('alert').filter({hasText:'JPEG'}).waitFor()
    await page.getByLabel('Imagen de la historia', { exact: true }).setInputFiles({name:'momento.png',mimeType:'image/png',buffer:png})
    await page.locator('.story-preview').waitFor()
    await page.screenshot({path:`${out}/publisher-${width}.png`,fullPage:true})
    await page.locator('.story-primary').click(); await page.getByRole('button',{name:'Comprobar y reintentar'}).waitFor()
    assert.equal(await page.getByText('Historia publicada.',{exact:true}).count(),0)
    assert.equal(writes.length,1);rpcFail=false
    await page.getByRole('button',{name:'Comprobar y reintentar'}).click();await page.getByText('Historia publicada.',{exact:true}).waitFor()
    assert.deepEqual(writes[0],writes[1]);assert.equal(uploads.length,1)
    await page.getByRole('button',{name:'Cerrar',exact:true}).click()
    record(`${width}: invalid image, preview, failed RPC never success, same UUID retry without second upload, confirmed success`)
    if (width === 390) {
      imageDenied=true;await page.getByRole('button',{name:'Sofía 2 historias'}).click();await page.getByRole('button',{name:'Reintentar imagen'}).waitFor()
      imageDenied=false;await page.getByRole('button',{name:'Reintentar imagen'}).click();await page.locator('.story-image img').waitFor();await page.keyboard.press('Escape')
      record('Image GET denied, clear error, pointer retry successfully loads image')
      await page.getByRole('button',{name:'Sofía 2 historias'}).click()
      await page.getByRole('button',{name:'Reanudar'}).click()
      const image = await page.locator('.story-image').boundingBox()
      await page.mouse.move(image.x+image.width/2,image.y+image.height/2);await page.mouse.down();await page.waitForTimeout(1300)
      assert.match(await page.locator('.story-viewer [role=status]').innerText(),/1 de 3/)
      await page.mouse.up();await page.getByRole('button',{name:'Pausar',exact:true}).click()
      await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.closest('.story-viewer')!==null),true)
      await page.waitForTimeout(1300);assert.match(await page.locator('.story-viewer [role=status]').innerText(),/1 de 3/)
      await page.getByRole('button',{name:'Reanudar'}).click()
      await page.getByText('Historia 2 de 3',{exact:true}).waitFor()
      await page.getByText('Historia 3 de 3',{exact:true}).waitFor()
      await page.waitForFunction(()=>!document.querySelector('.story-viewer[open]'))
      record('Hold and manual pause freeze progress, Tab stays in dialog; autoplay explicitly enabled across 3 alternating-author stories, final closes')
      mode='empty';await page.evaluate(() => window.dispatchEvent(new Event('focus')));await page.getByText('Todavía no hay historias vigentes.').waitFor()
      mode='denied';await page.evaluate(() => window.dispatchEvent(new Event('focus')));await page.getByRole('alert').waitFor()
      mode='live';shortTTL=true;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await page.getByRole('button',{name:'Sofía 2 historias'}).click()
      await page.evaluate(()=>{Date.now=()=>0})
      await page.waitForFunction(()=>!document.querySelector('.story-viewer[open]'));assert.equal(await page.evaluate(()=>window.__blobs.size),0)
      shortTTL=false;await page.evaluate(() => window.dispatchEvent(new Event('focus')));await page.getByRole('button',{name:'Sofía 2 historias'}).click()
      await page.keyboard.press('Escape');await page.getByRole('button',{name:'Cambiar cuenta'}).click()
      await page.getByRole('button',{name:'Quitar permiso'}).click();assert.equal(await page.locator('.event-stories').count(),0)
      record('Empty, denied/retry, server TTL while open revokes Blob despite changed device clock, account remount and permission gate')
    }
    assert.deepEqual(errors,[])
    await context.close()
  }
} finally { await browser.close(); await server.close() }
const paths=['EventStoriesEntry.tsx','StoryViewer.tsx','StoryPublisher.tsx','stories.css']
const hashes=Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(`src/features/events/stories/${p}`)).digest('hex')])))
await writeFile(`${out}/results.json`,JSON.stringify({environment:'Edge headless, actual isolated components served by Vite; HTTP/Auth/Storage intercepted, labeled synthetic image; no real authorization evidence',hashes,results},null,2)+'\n')
