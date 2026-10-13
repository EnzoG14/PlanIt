import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const luminance = hex => hex.match(/../g).map(x => parseInt(x,16)/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4).reduce((sum,x,i) => sum+x*[.2126,.7152,.0722][i],0)
const whiteContrast = hex => 1.05/(luminance(hex)+.05)
const results = []
// The shared legacy dialog remains for compatibility; check its two stops as well.
const legacy = await readFile('src/components/event-actions.css','utf8')
const gradient = legacy.match(/linear-gradient\(95deg,#([a-f0-9]{6}),#([a-f0-9]{6})\)/)
assert.ok(gradient)
for (const color of gradient.slice(1)) {
  const ratio = whiteContrast(color); assert.ok(ratio >= 4.5)
  results.push({ surface: 'Legacy shared cancel dialog', color, ratio, result: 'PASS' })
}
// Amanecer destructive controls use the normative solid danger-action token.
const tokens = await readFile('src/styles/tokens.css','utf8')
const color = tokens.match(/--pi-color-danger-action:\s*#([a-f0-9]{6})/)[1]
const ratio = whiteContrast(color); assert.ok(ratio >= 4.5)
for (const [file, selector] of [['src/components/event-actions.css','.event-management .event-action-dialog .event-action-danger'],['src/styles/event-management.css','.management-dialog .management-danger'],['src/styles/amanecer.css','.amanecer-shell .event-action-danger']]) {
  const css = await readFile(file,'utf8')
  const rule = css.slice(css.indexOf(`${selector} {`)).split('}')[0]
  assert.ok(rule.includes('background: var(--pi-color-danger-action)'), `${file}: destructive action must use the solid normative token`)
  results.push({ file, selector, color, ratio, result: 'PASS' })
}
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-7'
await mkdir(out,{recursive:true})
await writeFile(`${out}/contrast-results.json`,JSON.stringify({method:'sRGB relative luminance against white; legacy stops and Amanecer solid action token, not full-page WCAG certification',results},null,2))
console.log('PASS: legacy cancel stops and Amanecer destructive actions meet 4.5:1')
