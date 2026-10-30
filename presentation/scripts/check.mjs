import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { deck, releases, sources } from '../data/deck.mjs'
import { stories } from '../data/release-stories.mjs'
import { releaseContent } from '../data/release-content.mjs'
import { effortScale, storyEffort } from '../data/story-effort.mjs'

const slides = await readFile(new URL('../slides.md', import.meta.url), 'utf8')
assert.equal(deck.length, 54, 'Approved complete deck')
assert.equal((slides.match(/^layout: planit$/gm) || []).length, deck.length, 'One layout per manifest entry')
assert.deepEqual([...slides.matchAll(/^name: (.+)$/gm)].map(match => match[1]), deck.map(slide => slide.id), 'Approved narrative order')
assert.match(slides, /aspectRatio: 16\/9/)
const notes = slides.match(/<!--[\s\S]*?-->/g) || []
assert.equal(notes.length, deck.length, 'Speaker notes on every slide')
assert.ok(notes.every(note => note.includes(sources.planning) || note.includes(sources.requirements)), 'Official source on every slide')
assert.equal(releases.slice(1).reduce((sum, release) => sum + release.rf, 0), 53)
assert.equal(releases.slice(1).reduce((sum, release) => sum + release.ca, 0), 218)
assert.equal(releases.slice(1).reduce((sum, release) => sum + release.sprints, 0), 13)
assert.equal(releases[0].sprints, 1)
assert.deepEqual(deck.slice(0, 12).map(slide => slide.id), ['cover', 'team', 'agenda', 'problem', 'product', 'features', 'participant-opportunity', 'organizer-opportunity', 'benefits', 'scope', 'limitations', 'requirements'], 'Approved opening narrative')
const roadmapIndex = deck.findIndex(slide => slide.id === 'roadmap')
assert.ok(roadmapIndex >= 0, 'Roadmap present')
assert.equal(deck[roadmapIndex + 1].id, 'releases', 'Releases follow roadmap')
assert.equal(deck.filter(slide => slide.id === 'architecture').length, 1, 'One architecture slide')
assert.deepEqual(deck.slice(-4).map(slide => slide.id), ['demo', 'evolution', 'conclusions', 'thanks'])
const snapshot = JSON.parse(await readFile(new URL('../references/release-stories.source.json', import.meta.url), 'utf8'))
const normalize = text => text.replace(/\s+/g, ' ').trim()
assert.equal(stories.length, 53)
assert.equal(new Set(stories.map(story => story.id)).size, 53)
assert.deepEqual(Object.keys(storyEffort), stories.map(story => story.id), 'Exactly one proposed estimate for every official story')
assert.deepEqual(effortScale.map(item => item.points), [1, 2, 3, 5, 8, 13], 'Approved Planning Poker scale')
assert.deepEqual(effortScale.map(item => item.size), ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'Proposed shirt size convention')
assert.equal(new Set(effortScale.map(item => item.background)).size, 6, 'Distinct color for every point value')
assert.ok(Object.values(storyEffort).every(points => effortScale.some(item => item.points === points)), 'All estimates belong to scale')
const luminance = hex => {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
}
for (const item of effortScale) {
  const values = [luminance(item.background), luminance(item.foreground)].sort((a, b) => a - b)
  assert.ok((values[1] + .05) / (values[0] + .05) >= 4.5, `Readable effort color ${item.points}`)
}
assert.deepEqual(stories.map(story => ({ id: story.id, text: normalize(story.text) })), snapshot.stories.map(story => ({ id: story.id, text: normalize(story.text) })), 'Verbatim official stories')
const placed = releaseContent.flatMap(block => block.pages.flatMap(page => page.ids))
assert.deepEqual(placed, stories.map(story => story.id), 'Every story placed exactly once and in official order')
assert.equal(new Set(releaseContent.flatMap(block => block.pages.map(page => `${block.release}:${page.sprint}`))).size, 13, 'Thirteen distinct functional sprints')
for (const block of releaseContent) for (const page of block.pages) {
  assert.ok(page.ids.length >= 3 && page.ids.length <= 5)
  for (const id of page.ids) {
    const story = stories.find(item => item.id === id)
    assert.equal(story.release, block.release)
    assert.equal(story.sprint, page.sprint)
  }
}
for (const file of ['logos/planit.svg', 'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'screenshots/discover.png', 'screenshots/organize.png', 'screenshots/participate.png', 'backgrounds/cover.png', 'backgrounds/product.png', 'backgrounds/architecture.png']) {
  await access(new URL(`../public/assets/${file}`, import.meta.url))
}
assert.doesNotMatch(slides, /https?:\/\/[^\s"']+\.(png|jpe?g|woff2)/, 'No remote visual dependencies')
assert.match(slides, /Sprints de 2 semanas/, 'Sprint cadence confirmed by user')
const providedAssets = JSON.parse(await readFile(new URL('../public/assets/tools/provenance.json', import.meta.url), 'utf8'))
assert.equal(providedAssets.files.length, 9, 'Nine user-provided images')
for (const asset of providedAssets.files) {
  const bytes = await readFile(new URL(`../public/assets/tools/${asset.file}`, import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, 'User image preserved byte-for-byte')
  assert.ok(slides.includes(`/assets/tools/${asset.file}`), `Provided image used: ${asset.file}`)
}
console.log(`PASS: ${deck.length} slides, 53 verbatim unique stories, 13 functional sprints, approved narrative, official notes and local assets`)
