import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const luminance = hex => hex.match(/../g).map(x => parseInt(x,16)/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4).reduce((sum,x,i) => sum+x*[.2126,.7152,.0722][i],0)
const whiteContrast = hex => 1.05/(luminance(hex)+.05)
const results = []
for (const [file, selector] of [['src/components/event-actions.css', '.event-action-danger'], ['src/pages/event-attendees.css', '.attendees-remove']]) {
  const css = await readFile(file,'utf8')
  const rule = css.slice(css.indexOf(`${selector} {`)).split('}')[0]
  const gradient = rule.match(/linear-gradient\(95deg,#([a-f0-9]{6}),#([a-f0-9]{6})\)/)
  assert.ok(gradient, `${selector} gradient must be checked explicitly`)
  const ratios = gradient.slice(1).map(whiteContrast)
  assert.ok(ratios.every(x => x >= 4.5), `${selector}: normal white text contrast below 4.5:1`)
  results.push({ file, selector, white_text: true, colors: gradient.slice(1), ratios, result: 'PASS' })
}
const out = 'docs/design/verification/r3-block-7'
await mkdir(out,{recursive:true})
await writeFile(`${out}/contrast-results.json`,JSON.stringify({ method: 'sRGB relative luminance against white; both solid gradient stops (not a full page contrast audit)', before: { color: 'ff2254', ratio: whiteContrast('ff2254') }, results },null,2))
console.log('PASS: cancel/remove confirmation gradients meet 4.5:1 at both stops; previous bright stop was 3.74:1')
