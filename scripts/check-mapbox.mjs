import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { resolveConfig } from 'vite'
const source = await readFile(new URL('../src/components/maps/provider.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { normalizeBounds, fallbackBounds, publicMapboxToken } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
assert.deepEqual(normalizeBounds({south:-100,north:100,west:-540,east:540}), {south:-90,north:90,west:-180,east:180})
assert.deepEqual(normalizeBounds({south:-10,north:10,west:170,east:190}), {south:-10,north:10,west:170,east:-170})
assert.deepEqual(normalizeBounds({south:0,north:1,west:-190,east:-170}), {south:0,north:1,west:170,east:-170})
const polar = fallbackBounds({latitude:90,longitude:179.99})
assert.equal(polar.north, 90)
assert.ok(Math.abs(polar.south - 89.975) < 1e-8)
assert.ok(Math.abs(polar.west - 179.95) < 1e-8 && Math.abs(polar.east + 179.97) < 1e-8)
assert.equal(publicMapboxToken(undefined), null)
assert.equal(publicMapboxToken('replace_with_public_mapbox_token'), null)
assert.equal(publicMapboxToken('sk.fixture'), null)
assert.equal(publicMapboxToken('pk.fixture'), 'pk.fixture')
const previous = process.env.VITE_MAPBOX_ACCESS_TOKEN
try {
  process.env.VITE_MAPBOX_ACCESS_TOKEN = 'sk.fixture'
  await assert.rejects(resolveConfig({}, 'build'), /debe ser público pk/)
} finally {
  if (previous === undefined) delete process.env.VITE_MAPBOX_ACCESS_TOKEN
  else process.env.VITE_MAPBOX_ACCESS_TOKEN = previous
}
console.log('PASS: wrapped/world/antimeridian/polar bounds, missing/public/secret tokens, build rejects secrets before bundling.')
