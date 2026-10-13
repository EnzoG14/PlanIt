import { readFile } from 'node:fs/promises'
const base = 'docs/design/verification/ui-refresh/block-3-forms'
const mode = process.argv[2] ?? 'after'
const files = mode === 'before' || mode === 'confirm' ? ['check-events-ui.mjs', 'check-edit-event-ui.mjs'] : ['check-events-ui.mjs', 'check-edit-event-ui.mjs', 'check-event-actions-ui.mjs', 'check-my-events-ui.mjs']
for (const file of files) {
  if (process.argv[3] && file !== process.argv[3]) continue
  let source = (await readFile(`scripts/${file}`, 'utf8')).replaceAll('\r\n', '\n')
  const out = `${base}/${mode}/${file.replace('.mjs', '')}`
  source = source.replace(/const output = 'docs\/design\/verification\/create-event-r1'/, `const output = '${out}'`).replace(/const out = 'docs\/design\/verification\/r3-block-2'/, `const out = '${out}'`)
  process.env.PLANIT_UI_OUTPUT = out
  source = source.replace(/\[\[360,\s*800\]/g, '[[320, 800], [360, 800]')
  if (mode === 'after' && file === 'check-events-ui.mjs') source = source.replace('    if (width === 390) {', `
    await page.getByRole('button', {name:'Publicar evento',exact:true}).click()
    await page.screenshot({path: \x60\x24{output}/validation-\x24{width}.png\x60,fullPage:true})
    await fill(page)
    await page.locator('[name="title"]').fill('Encuentro de música y comunidad — '.repeat(5))
    await page.locator('form [name="description"]').fill('Descripción extensa con acentos, emoji 🎶 y una dirección de referencia. '.repeat(12))
    await page.screenshot({path: \x60\x24{output}/long-filled-\x24{width}.png\x60,fullPage:true})
    await page.goto(\x60\x24{origin}/events/new\x60)
    await page.getByRole('button', {name:'Publicar evento',exact:true}).waitFor()
    if (width === 390) {`)
  if ((mode === 'before' || mode === 'confirm') && file === 'check-events-ui.mjs') source = source.slice(0, source.indexOf('try {\n  for (const [width')) + 'try { for (const width of [320,360,375,390,768,1280]) { const {context,page}=await fixture(width,844); await page.screenshot({path: `${output}/create-${width}.png`,fullPage:true}); await context.close(); } } finally {await browser.close()}'
  if ((mode === 'before' || mode === 'confirm') && file === 'check-edit-event-ui.mjs') source = source.slice(0, source.indexOf('    await open();')) + '    await open(); await page.screenshot({path: `${out}/edit-${width}.png`,fullPage:true}); for(const context of contexts) await context.close();\n } } finally {await browser.close()}'
  console.log(`RUN ${file} (${mode})`)
  try { await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`) }
  catch(error) { console.error(`FAIL ${file}: ${error.message}`); process.exitCode = 1 }
}
