import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Narrow parser for the committed frontmatter shape, not a YAML engine/generator.
const design = (await readFile('DESIGN.md', 'utf8')).replaceAll('\r\n', '\n').split('---')[1]
const css = await readFile('src/styles/tokens.css', 'utf8')
const tokens = new Map([...css.matchAll(/(--pi-[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
let group, role, checked = 0
const prefixes = { colors: 'color', rounded: 'radius', spacing: 'space' }
const typeProps = { fontSize: 'size', fontWeight: 'weight', lineHeight: 'line-height', letterSpacing: 'tracking' }
for (const line of design.split('\n')) {
  const heading = line.match(/^(\w+):$/)
  if (heading) group = heading[1]
  const entry = line.match(/^  ([\w-]+): "([^"]+)"$/)
  if (entry && prefixes[group]) {
    assert.equal(tokens.get(`--pi-${prefixes[group]}-${entry[1]}`), entry[2], `${group}.${entry[1]}`)
    checked++
  }
  if (group === 'typography') {
    const title = line.match(/^  ([\w-]+):$/)
    if (title) role = title[1]
    const prop = line.match(/^    (\w+): (.+)$/)
    if (prop?.[1] === 'fontFamily') assert.equal(tokens.get('--pi-font-family'), prop[2].replace(/^"|"$/g, ''))
    if (prop && typeProps[prop[1]]) {
      assert.equal(tokens.get(`--pi-font-${role}-${typeProps[prop[1]]}`), prop[2].replace(/^"|"$/g, ''), `${role}.${prop[1]}`)
      checked++
    }
  }
}
assert.equal(checked, 83, 'All normative colors, radii, spaces and type properties must be checked')
for (const path of ['src/styles/amanecer.css', 'src/pages/my-events.css']) {
  const source = await readFile(path, 'utf8')
  for (const match of source.matchAll(/var\((--pi-[\w-]+)/g)) assert.ok(tokens.has(match[1]), `${path}: unresolved ${match[1]}`)
  assert.ok(!source.includes('--am-'), `${path}: obsolete pilot palette`)
}
console.log(`PASS: ${checked} normative token values, font family, all shared/pilot references`)
