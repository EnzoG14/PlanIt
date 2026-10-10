import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { loadEnv } from 'vite'

const source = await readFile(new URL('../src/lib/supabase-config.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { validateSupabaseConfig } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const url = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
const key = 'sb_publishable_test_only'
assert.equal(validateSupabaseConfig(url, key), null)
for (const [badUrl, badKey] of [
  [undefined, undefined], [url, ''], [url, 'replace_with_project_publishable_key'],
  ['https://fmqzokxvpqxfzvcnzvjm.supabase.co', key],
  ['https://iepeqmvzjguwlhnecsdq.supabase.co.evil.example', key],
  ['http://iepeqmvzjguwlhnecsdq.supabase.co', key],
  [url, 'sb_secret_do_not_expose'], [url, 'legacy-jwt'],
]) {
  const error = validateSupabaseConfig(badUrl, badKey)
  assert.ok(error, 'Unsafe or incomplete configuration must be rejected')
  if (badKey) assert.ok(!error.includes(badKey), 'Error must not echo credentials')
}
console.log('PASS: configuration accepts only planit-v2 and publishable keys; errors do not echo keys.')

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'))
assert.equal(manifest.start_url, '/')
assert.equal(manifest.scope, '/')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.lang, 'es-AR')
for (const icon of manifest.icons) {
  const png = await readFile(`dist${icon.src}`)
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes)
  assert.equal(png[25], 2, 'Icons must use opaque RGB')
}
assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'))
const worker = await readFile('dist/sw.js', 'utf8')
assert.ok(!worker.includes('supabase.co'), 'No Supabase URL in service worker caching')
assert.ok(!worker.includes('tile.openstreetmap.org'), 'No tile caching in service worker')
assert.ok(worker.includes('pwa-192.png') && worker.includes('pwa-maskable.png'))
assert.ok((await readFile('dist/registerSW.js', 'utf8')).includes('sw.js'))
console.log('PASS: manifest, PNG dimensions/opacity, icon precache and service worker registration.')

if (process.argv.includes('--connection')) {
  const env = loadEnv('production', process.cwd(), 'VITE_')
  assert.equal(validateSupabaseConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY), null)
  const response = await fetch(`${url}/rest/v1/categories?select=id&limit=1`, {
    headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(15000),
  })
  const result = await response.json()
  // Categories intentionally deny SELECT to anon. A permission error proves
  // the API is reachable, not that the catalog is empty.
  if ([401, 403].includes(response.status) && result.code === '42501') {
    console.log(`PASS: planit-v2 reachable; anonymous catalog read denied (HTTP ${response.status}, 42501).`)
  } else {
    assert.equal(response.status, 200, `Unexpected API status ${response.status}`)
    assert.ok(Array.isArray(result))
    console.log('API reachable, but anonymous categories SELECT is allowed: review grants before delivery.')
    process.exitCode = 1
  }
}
