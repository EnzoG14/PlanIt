import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

// Opt-in to keep the existing functional runners usable against legacy baselines.
export async function auditManagement(page, out, surface, width) {
  if (!process.env.PLANIT_MANAGEMENT_AUDIT) return
  await page.evaluate(() => document.fonts.ready)
  const read = () => page.evaluate(() => {
    const root = document.querySelector('.management-page')
    const visible = node => node.getClientRects().length > 0
    const controls = [...root.querySelectorAll('button,a,input,summary')].filter(visible).map(node => {
      const box = node.getBoundingClientRect(), style = getComputedStyle(node)
      return { name: node.getAttribute('aria-label') || node.textContent.trim(), width: box.width, height: box.height, font: parseFloat(style.fontSize), color: style.color, background: style.backgroundColor }
    })
    return { overflow: document.documentElement.scrollWidth > innerWidth, scoped: !!document.querySelector('.event-management-shell.amanecer-shell'), font: getComputedStyle(root).fontFamily, controls, headline: getComputedStyle(root.querySelector('h1')).fontSize }
  })
  const normal = await read()
  assert.equal(normal.overflow, false)
  assert.equal(normal.scoped, true)
  assert.ok(normal.font.includes('Bricolage Grotesque'))
  assert.deepEqual(normal.controls.filter(control => control.height < 43.9 || control.width < 43.9), [], '44 px controls including file input and ordering')
  const focus = page.locator('.management-page button:not(:disabled)').first()
  await focus.focus()
  const outline = await focus.evaluate(node => ({ width: getComputedStyle(node).outlineWidth, color: getComputedStyle(node).outlineColor }))
  assert.equal(outline.width, '3px')
  assert.equal(outline.color, 'rgb(91, 52, 214)')
  await page.screenshot({ path: `${out}/focus-${width}.png` })
  if (surface === 'gallery') {
    const shortcut = page.getByRole('link', { name: 'Agregar fotos', exact: true })
    await shortcut.focus(); await page.keyboard.press('Enter')
    const uploader = page.getByLabel('Seleccionar imágenes', { exact: true })
    const box = await uploader.boundingBox()
    assert.ok(box.y >= 0 && box.y + box.height < page.viewportSize().height, 'upload shortcut brings picker into viewport')
    await page.screenshot({ path: `${out}/upload-shortcut-${width}.png` })
  }
  const clearPath = []
  for (const control of await page.locator('.management-page button:not(:disabled), .management-page a, .management-page input:not(:disabled), .management-page summary').all()) {
    if (!await control.isVisible()) continue
    await control.focus()
    await control.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }))
    const accessible = await control.evaluate(node => {
      const box = node.getBoundingClientRect()
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return node.contains(hit)
    })
    assert.ok(accessible, 'scrolling must expose the control outside the floating dock')
    clearPath.push(await control.getAttribute('aria-label') || await control.innerText() || 'file picker')
  }
  const restoreText = await page.evaluate(() => {
    const originals = [...document.querySelectorAll('.management-page *')].map(node => [node, node.style.fontSize])
    const sizes = originals.map(([node]) => getComputedStyle(node).fontSize)
    originals.forEach(([node], i) => { node.style.fontSize = `${parseFloat(sizes[i]) * 2}px` })
    // Keep original style values on DOM only for this test; never persisted in the app.
    window.__managementTextSizes = originals
    return originals.length
  })
  assert.ok(restoreText > 0)
  const enlarged = await read()
  assert.equal(enlarged.overflow, false, 'text at 200% has no document overflow')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${out}/text-200-${width}.png` })
  await page.evaluate(() => { window.__managementTextSizes.forEach(([node, size]) => { node.style.fontSize = size }); delete window.__managementTextSizes })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reducedMotion = await page.evaluate(() => [...new Set([...document.querySelectorAll('.management-page *')].map(node => getComputedStyle(node).animationName))])
  assert.deepEqual(reducedMotion, ['none'])
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
  const transparency = await page.evaluate(() => ({ active: matchMedia('(prefers-reduced-transparency: reduce)').matches, blur: getComputedStyle(document.querySelector('.amanecer-shell')).getPropertyValue('--pi-glass-blur').trim() }))
  assert.equal(transparency.active, true)
  assert.equal(transparency.blur, 'none')
  await page.screenshot({ path: `${out}/reduced-transparency-${width}.png` })
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })
  await cdp.detach()
  await writeFile(`${out}/geometry-${width}.json`, JSON.stringify({ normal, outline, enlarged, clearPath, reducedMotion, reducedTransparency: transparency, limits: 'Text sizes doubled in DOM, not native zoom. Physical device and screen reader untested.' }, null, 2))
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) })
}

export async function auditManagementDialog(page, out, surface, width) {
  if (!process.env.PLANIT_MANAGEMENT_AUDIT) return
  const original = page.viewportSize()
  await page.setViewportSize({ width, height: 320 })
  const dialog = page.getByRole('dialog')
  const buttons = dialog.locator('button:not(:disabled)')
  for (const button of await buttons.all()) {
    await button.focus()
    await button.scrollIntoViewIfNeeded()
    const box = await button.boundingBox()
    assert.ok(box.y >= 0 && box.y + box.height <= 321, `${surface} dialog action reachable at 320px height`)
  }
  await page.screenshot({ path: `${out}/dialog-short-${width}.png` })
  await page.setViewportSize(original)
}
export async function settleManagement(page) { await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))); await Promise.all([...document.images].map(image => image.decode().catch(() => {}))) }) }
