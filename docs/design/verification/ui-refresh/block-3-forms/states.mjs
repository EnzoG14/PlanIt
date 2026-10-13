import { readFile } from 'node:fs/promises'
let source = (await readFile('scripts/check-events-ui.mjs', 'utf8')).replaceAll('\r\n', '\n')
source = source.slice(0, source.indexOf('try {\n  for (const [width'))
source = source.replace("if (url.pathname === '/rest/v1/rpc/create_event') {", "if (url.pathname === '/rest/v1/rpc/create_event') { if(state.slow) await new Promise(resolve => setTimeout(resolve, 1600));")
source += `
try {
  const reference = await browser.newPage({viewport:{width:390,height:844}})
  await reference.goto('http://127.0.0.1:5191/b/create')
  await reference.screenshot({path:output+'/lab-b-create.png',fullPage:true})
  await reference.close()
  const metrics=[]
  for(const width of [320,360,375,390,768,1280]) {
    const {context,page,state}=await fixture(width,844)
    state.emptyCatalog=true
    await page.reload()
    await page.getByText('No hay categorías disponibles',{exact:true}).waitFor()
    await page.screenshot({path:output+'/categories-empty-'+width+'.png',fullPage:true})
    state.emptyCatalog=false
    await page.reload()
    await page.getByRole('button',{name:'Publicar evento',exact:true}).waitFor()
    await page.getByRole('button',{name:'Usar mi ubicación actual'}).click()
    await page.getByText('No pudimos obtener tu ubicación.',{exact:false}).waitFor()
    await page.screenshot({path:output+'/location-denied-'+width+'.png',fullPage:true})
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({latitude:-34.6037,longitude:-58.3816})
    await page.getByRole('button',{name:'Usar mi ubicación actual'}).click()
    await page.waitForFunction(()=>document.querySelector('[name="latitude"]').value==='-34.603700')
    await fill(page)
    await page.locator('[name="images"]').setInputFiles(photo)
    state.failure='upload'
    await page.getByRole('button',{name:'Publicar evento',exact:true}).click()
    await page.getByRole('heading',{name:'No se pudo publicar',exact:true}).waitFor()
    await page.screenshot({path:output+'/upload-error-'+width+'.png',fullPage:true})
    state.failure='';state.slow=true
    await page.getByRole('button',{name:'Publicar evento',exact:true}).click()
    await page.locator('form[aria-busy="true"]').waitFor()
    await page.screenshot({path:output+'/sending-'+width+'.png',fullPage:true})
    assert.equal(await page.locator('form [name="title"]').isDisabled(),true)
    metrics.push(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,dateControls:[...document.querySelectorAll('input[type="date"],input[type="time"]')].map(el=>({type:el.type,value:el.value,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,padding:getComputedStyle(el).paddingInline,font:getComputedStyle(el).fontSize})),font:getComputedStyle(document.querySelector('form')).fontFamily})))
    await page.getByRole('heading',{name:'Evento publicado',exact:true}).waitFor()
    assert.equal(state.events.size,1)
    await context.close()
  }
  await writeFile(output+'/states-metrics.json',JSON.stringify(metrics,null,2))
  console.log('PASS: six widths, empty categories, denied and successful geolocation, image failure, retry, sending, native date/time dimensions; local fixtures only')
} finally {await browser.close()}
`
try { await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`) }
catch(error) { console.error(error.message); process.exitCode=1 }
