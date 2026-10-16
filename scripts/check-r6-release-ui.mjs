import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend the existing real-app fixture suite; do not replace its assertions.
const source = await readFile('scripts/check-r6-compare-ui.mjs', 'utf8')
const marker = '    await context.close()'
assert.equal(source.split(marker).length, 2)
const out = 'docs/qa/r6-block-9/accessibility-extended'
await mkdir(out, { recursive: true }); await mkdir('.r6-check.local', { recursive: true })
const extra = String.raw`
    // Fresh normal-size page, then measured focus/contrast/targets and CSS zoom.
    mode = 'data'; await page.reload(); await box('Evento A').waitFor()
    await box('Evento A').check(); await box('Evento B').check(); await rows().first().waitFor()
    await page.keyboard.press('Tab')
    await page.getByRole('button', { name: 'Actualizar', exact: true }).focus()
    const metrics = await page.evaluate(() => {
      const focus = getComputedStyle(document.activeElement)
      const targets = [...document.querySelectorAll('.compare-page button, .compare-options label')].filter(n => n.getClientRects().length).map(n => { const r = n.getBoundingClientRect(); return { label: n.textContent.trim().slice(0,70), width: r.width, height: r.height } })
      const sample = document.querySelector('.compare-count')
      const style = getComputedStyle(sample)
      return { font: style.fontFamily, text: style.color, background: getComputedStyle(document.documentElement).getPropertyValue('--pi-color-bg').trim(), focus: { width: focus.outlineWidth, style: focus.outlineStyle, color: focus.outlineColor }, targets_below_44: targets.filter(t => t.width < 44 || t.height < 44), targets }
    })
    assert.match(metrics.font, /Bricolage/)
    assert.ok(parseFloat(metrics.focus.width) >= 3, 'Keyboard focus has the approved visible outline')
    await page.screenshot({ path: out+'/keyboard-'+width+'.png', fullPage:true })
    await writeFile(out+'/metrics-'+width+'.json',JSON.stringify(metrics,null,2)+'\n')
    check('Measured loaded font and keyboard focus; touch target dimensions recorded for review')
    await page.evaluate(() => { document.body.style.zoom = '2' })
    const zoomWidth = await page.evaluate(() => ({document:document.documentElement.scrollWidth,viewport:innerWidth}));
    results.push({width,test:'CSS zoom200 reflow measurement; not native browser zoom',result:zoomWidth.document <= zoomWidth.viewport + 1 ? 'PASS' : 'FAIL',measurement:zoomWidth});
    await page.screenshot({path:out+'/css-zoom-200-'+width+'.png',fullPage:true})
    await page.evaluate(() => { document.body.style.zoom = '' })
`
const script = '.r6-check.local/release-accessibility.mjs'
await writeFile(script, source.replaceAll('docs/qa/r6-block-8/ui', out).replace(marker, extra + marker))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [script], { windowsHide: true, timeout: 300000, maxBuffer: 8 * 1024 * 1024 })
  await writeFile(`${out}/stdout.txt`, stdout); await writeFile(`${out}/stderr.txt`, stderr)
} catch (e) {
  await writeFile(`${out}/stdout.txt`, e.stdout ?? ''); await writeFile(`${out}/stderr.txt`, e.stderr ?? '')
  process.exitCode = 1
} finally {
  await unlink(script)
  const report = JSON.parse(await readFile(out + '/results.json','utf8'))
  if (report.results.some(row => row.result === 'FAIL')) { report.result = 'FAIL'; process.exitCode = 1; await writeFile(out+'/results.json',JSON.stringify(report,null,2)+'\n') }
  await writeFile(`${out}/extension.json`, JSON.stringify({ source: 'scripts/check-r6-compare-ui.mjs', source_sha256: createHash('sha256').update(source).digest('hex'), scope: 'Additional keyboard/metrics/CSS zoom200 checks; fixture transport; no native browser zoom/device certification' }, null, 2) + '\n')
}
