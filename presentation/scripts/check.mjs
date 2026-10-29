import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { deck, releases, sources } from '../data/deck.mjs'
import { stories } from '../data/release-stories.mjs'
import { releaseContent } from '../data/release-content.mjs'

const slides = await readFile(new URL('../slides.md', import.meta.url), 'utf8')
assert.equal(deck.length, 51, 'Approved complete deck')
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
assert.equal(deck[17].id, 'roadmap')
assert.deepEqual(deck.slice(-4).map(slide => slide.id), ['demo', 'evolution', 'conclusions', 'thanks'])
const snapshot = JSON.parse(await readFile(new URL('../references/release-stories.source.json', import.meta.url), 'utf8'))
const normalize = text => text.replace(/\s+/g, ' ').trim()
assert.equal(stories.length, 53)
assert.equal(new Set(stories.map(story => story.id)).size, 53)
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
console.log(`PASS: ${deck.length} slides, 53 verbatim unique stories, 13 functional sprints, approved narrative, official notes and local assets`)
