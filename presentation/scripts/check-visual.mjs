import assert from 'node:assert/strict'
import { chromium } from 'playwright-chromium'
import { mkdir, writeFile } from 'node:fs/promises'
import { deck } from '../data/deck.mjs'
import { stories } from '../data/release-stories.mjs'
import { effortScale, storyEffort } from '../data/story-effort.mjs'
const origin = process.env.PRESENTATION_ORIGIN || 'http://localhost:3030'
const dir = new URL('../.validation/', import.meta.url)
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] })
const results = []
const errors = []
try {
  for (const [name, width, height] of [['canvas',1280,720],['projector',1920,1080]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    // Headless Chromium cannot keep a physical screen awake. Use Slidev's user setting.
    await page.addInitScript(() => localStorage.setItem('slidev-wake-lock', 'false'))
    page.on('pageerror', e => errors.push(e.message))
    for (const [index, spec] of deck.entries()) {
      const slide = index + 1
      await page.goto(`${origin}/${slide}?clicks=${spec.clicks}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(650)
      const canvas = page.locator('.slidev-layout:visible').last()
      await canvas.waitFor()
      const data = await canvas.evaluate(el => {
        const bounds = el.getBoundingClientRect()
        const overflowing = [...el.querySelectorAll('h1,h2,h3,p,figcaption,dt,dd,li,.team,.institution,.slide-footer,.phone-frame,.supporting-services,.release-roadmap,.story-note,.effort-circle')].filter(node => {
          const r = node.getBoundingClientRect()
          return r.left < bounds.left - 1 || r.right > bounds.right + 1 || r.top < bounds.top - 1 || r.bottom > bounds.bottom + 1
        }).map(node => node.textContent.trim())
        const light = el.querySelector('.background-light')
        const footer = el.querySelector('.slide-footer')?.getBoundingClientRect()
        const collidingWithFooter = footer ? [...el.querySelectorAll('h1,h2,h3,p,figcaption,dt,dd,li,.team-note,.artifacts-line')].filter(node => {
          const r = node.getBoundingClientRect()
          return r.bottom > footer.top + 1 && r.top < footer.bottom && r.right > footer.left && r.left < footer.right
        }).map(node => node.textContent.trim()) : []
        const paperNotes = [...el.querySelectorAll('.story-note')].map(note => {
          const copy = note.querySelector('.story-copy')
          const id = note.querySelector('.story-id')
          const badge = note.querySelector('.story-effort')
          const badgeBounds = badge.getBoundingClientRect(), idBounds = id.getBoundingClientRect()
          const badgeStyle = getComputedStyle(badge)
          const scale = bounds.width / el.offsetWidth
          const badgeBox = { x: (badgeBounds.left - bounds.left) / scale, y: (badgeBounds.top - bounds.top) / scale, width: badgeBounds.width / scale, height: badgeBounds.height / scale }
          const body = copy.getBoundingClientRect(), paper = note.getBoundingClientRect()
          const overlaps = [...el.querySelectorAll('.story-note')].filter(other => {
            if (other === note) return false
            const r = other.getBoundingClientRect()
            return Math.min(body.right, r.right) - Math.max(body.left, r.left) > 2 && Math.min(body.bottom, r.bottom) - Math.max(body.top, r.top) > 2
          }).map(other => other.dataset.storyId)
          const badgeOverlaps = [...el.querySelectorAll('.story-copy,.story-id,.story-effort-notice,.story-period')].filter(node => {
            const r = node.getBoundingClientRect()
            return Math.min(badgeBounds.right, r.right) - Math.max(badgeBounds.left, r.left) > 2 && Math.min(badgeBounds.bottom, r.bottom) - Math.max(badgeBounds.top, r.top) > 2
          }).map(node => node.textContent.trim())
          return { id: note.dataset.storyId, text: copy.textContent.replace(/\s+/g, ' ').trim(), font: parseFloat(getComputedStyle(copy).fontSize), idFont: parseFloat(getComputedStyle(id).fontSize), visible: getComputedStyle(note).opacity === '1' && getComputedStyle(note).visibility === 'visible', insidePaper: body.left >= paper.left - 1 && body.right <= paper.right + 1 && body.top >= paper.top - 1 && body.bottom <= paper.bottom + 1, overlaps,
            effort: { bounds: badgeBox, points: Number(badge.textContent), size: badge.dataset.size, width: badgeStyle.width, height: badgeStyle.height, font: badgeStyle.fontSize, radius: badgeStyle.borderRadius, background: badgeStyle.backgroundColor, foreground: badgeStyle.color, label: badge.getAttribute('aria-label'), visible: badgeStyle.visibility === 'visible' && badgeStyle.opacity === '1', insidePaper: badgeBounds.left >= paper.left - 1 && badgeBounds.right <= paper.right + 1 && badgeBounds.top >= paper.top - 1 && badgeBounds.bottom <= paper.bottom + 1, rightOfId: badgeBounds.left > idBounds.right, overlaps: badgeOverlaps } }
        })
        return { overflowing, collidingWithFooter, paperNotes, titleSize: getComputedStyle(el.querySelector('h1')).fontSize, background: light && getComputedStyle(light).backgroundImage, railAbsent: !el.querySelector('.background-rail'), imagesLoaded: [...el.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0), font: getComputedStyle(el).fontFamily, headings: [...el.querySelectorAll('h1')].map(h => h.textContent) }
      })
      await canvas.screenshot({ path: new URL(`${name}-slide-${slide}.png`, dir).pathname.replace(/^\/(\w:)/, '$1') })
      assert.deepEqual(data.overflowing, [], `Slide ${slide} fits ${width}`)
      assert.deepEqual(data.collidingWithFooter, [], `Slide ${slide} does not collide with footer`)
      assert.equal(data.titleSize, spec.id === 'cover' ? '142px' : '52px', 'Approved title scale')
      assert.ok(data.imagesLoaded, `Images loaded on slide ${slide}`)
      assert.ok(data.railAbsent, 'No left rail')
      assert.match(data.background, /assets\/backgrounds\/.+\.png/, 'Opaque shared PNG background')
      assert.deepEqual(data.paperNotes.map(note => note.id), spec.storyIds ?? [], 'Expected stories visible on this page')
      assert.equal(await canvas.locator('.story-effort').count(), spec.storyIds?.length ?? 0, 'Exactly one effort circle per story')
      if (spec.storyIds) assert.equal(await canvas.locator('.story-effort-notice').textContent(), 'Esfuerzo relativo propuesto para esta presentación')
      for (const note of data.paperNotes) {
        assert.equal(note.text, stories.find(story => story.id === note.id).text.replace(/\s+/g, ' ').trim(), 'Full official wording rendered')
        assert.ok(note.font >= 24 && note.idFont >= 20, 'Minimum story typography')
        assert.ok(note.visible && note.insidePaper, 'Visible story fits its rotated paper')
        assert.deepEqual(note.overlaps, [], 'No other paper covers story text')
        const expectedEffort = effortScale.find(item => item.points === storyEffort[note.id])
        const rgb = hex => `rgb(${hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16)).join(', ')})`
        assert.equal(note.effort.points, expectedEffort.points, 'Proposed points match story')
        assert.equal(note.effort.size, expectedEffort.size, 'Shirt size convention matches points')
        assert.equal(note.effort.background, rgb(expectedEffort.background), 'Consistent effort color')
        assert.equal(note.effort.foreground, rgb(expectedEffort.foreground), 'Readable effort text color')
        assert.equal(note.effort.width, '36px')
        assert.equal(note.effort.height, '36px')
        assert.equal(note.effort.radius, '50%')
        assert.equal(note.effort.font, '22px')
        assert.match(note.effort.label, /esfuerzo relativo propuesto/)
        assert.ok(note.effort.visible && note.effort.insidePaper && note.effort.rightOfId, 'Effort circle visible inside header')
        assert.deepEqual(note.effort.overlaps, [], 'Effort circle does not cover text')
      }
      assert.ok(await page.evaluate(() => document.fonts.check('700 52px "Bricolage Grotesque"')))
      results.push({ slide, id: spec.id, width, height, ...data })
    }
    const architecturePage = deck.findIndex(slide => slide.id === 'architecture') + 1
    await page.goto(`${origin}/${architecturePage}`, { waitUntil: 'networkidle' })
    assert.equal(await page.locator('.realtime-path:visible').evaluate(el => getComputedStyle(el).opacity), '0')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    assert.equal(await page.locator('.realtime-path:visible').evaluate(el => getComputedStyle(el).opacity), '1')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    assert.equal(await page.locator('.supporting-services:visible').evaluate(el => getComputedStyle(el).opacity), '1')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.locator('.realtime-path:visible').evaluate(el => getComputedStyle(el).transitionDuration), '0s')
    await page.close()
  }
  assert.deepEqual(errors, [], 'No runtime errors')
  for (const width of [1280, 1920]) assert.equal(results.filter(result => result.width === width).reduce((sum, result) => sum + result.paperNotes.length, 0), 53, '53 effort circles per viewport')
  await writeFile(new URL('results.json', dir), JSON.stringify({ result: 'PASS', results, errors, keyboardSteps: 'PASS', reducedMotion: 'PASS' }, null, 2))
  console.log(`PASS: ${deck.length} slides at 1280x720 and 1920x1080; complete visible stories/24px type/paper bounds, PNG backgrounds, footer separation, keyboard and reduced motion`)
} finally { await browser.close() }
