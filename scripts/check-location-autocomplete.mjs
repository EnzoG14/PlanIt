import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/features/location/autocomplete.ts', import.meta.url), 'utf8')
async function moduleFor(key) {
  const compiled = ts.transpileModule(source.replace('import.meta.env.VITE_GEOAPIFY_API_KEY', JSON.stringify(key)), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}
const originalFetch = globalThis.fetch
try {
  const { searchAddresses } = await moduleFor('fixture-browser-key')
  let payload = { results: [{ formatted: 'Corrientes 123, Buenos Aires', lat: -34.6, lon: -58.38 }] }
  globalThis.fetch = async (input, options) => {
    const url = new URL(input)
    assert.equal(url.origin, 'https://api.geoapify.com')
    assert.equal(url.searchParams.get('text'), 'Calle & número')
    assert.equal(url.searchParams.get('bias'), 'countrycode:ar')
    assert.equal(url.searchParams.has('filter'), false)
    assert.equal(options.cache, 'no-store')
    return new Response(JSON.stringify(payload))
  }
  const search = () => searchAddresses('Calle & número', new AbortController().signal)
  assert.equal((await search())[0].latitude, -34.6)
  payload = { results: [null, {}, { formatted: 'Inválida', lat: 91, lon: 0 }, ...Array.from({ length: 7 }, (_, index) => ({ place_id: String(index), formatted: 'Válida', lat: 0, lon: 0 }))] }
  assert.equal((await search()).length, 5)
  payload = { results: [] }; assert.deepEqual(await search(), [])
  payload = {}; await assert.rejects(search, /leer las direcciones/)
  globalThis.fetch = async () => new Response('{}', { status: 429 })
  await assert.rejects(search, /Revisá la conexión/)
  const missing = await moduleFor('')
  assert.equal(missing.hasGeoapifyKey, false)
  await assert.rejects(() => missing.searchAddresses('Calle', new AbortController().signal), /no están configuradas/)
  console.log('PASS: request encoding, Argentina bias without country filter, coordinate validation, five-result limit, empty/malformed/error responses and missing key; fetch mocked.')
} finally { globalThis.fetch = originalFetch }
