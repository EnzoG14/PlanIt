import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

let listener
let calls = 0
let fail = false
let clock = 1000
const realNow = Date.now
Date.now = () => clock
const mock = {
  auth: { onAuthStateChange(callback) { listener = callback } },
  storage: { from() { return { async createSignedUrls(paths) {
    calls++
    await Promise.resolve()
    return fail ? { error: true } : { data: paths.map(path => ({ path, signedUrl: `signed-${calls}-${path}` })) }
  } } } },
}
globalThis.__imageClient = mock
try {
  const source = (await readFile('src/lib/signed-images.ts', 'utf8')).replace("import { supabase } from './supabase'", 'const supabase = globalThis.__imageClient')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
  const { signedImageUrls } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
  const [a, b] = await Promise.all([signedImageUrls('event_media', ['a', 'b']), signedImageUrls('event_media', ['b'])])
  assert.equal(calls, 1)
  assert.equal(a.urls.get('b'), b.urls.get('b'))
  await signedImageUrls('event_media', ['a'])
  assert.equal(calls, 1)
  clock += 291000
  await signedImageUrls('event_media', ['a'])
  assert.equal(calls, 2)
  listener('SIGNED_OUT')
  await signedImageUrls('event_media', ['a'])
  assert.equal(calls, 3)
  await signedImageUrls('other_bucket', ['a'])
  assert.equal(calls, 4)
  fail = true
  assert.equal((await signedImageUrls('event_media', ['failed'])).imageError, true)
  fail = false
  assert.equal((await signedImageUrls('event_media', ['failed'])).imageError, false)
  const beforeShort = calls
  await signedImageUrls('event_media', ['a'], 60)
  assert.equal(calls, beforeShort + 1, 'short TTL must not reuse the public 300-second URL')
  clock += 51000
  await signedImageUrls('event_media', ['a'], 60)
  assert.equal(calls, beforeShort + 2, 'short TTL expires with a safety margin')
  const pending = signedImageUrls('event_media', ['late'])
  listener('SIGNED_OUT')
  assert.equal((await pending).urls.size, 0)
  console.log('PASS: shared URLs, concurrent deduplication, expiration, session isolation, bucket isolation, retry and in-flight session change')
} finally {
  Date.now = realNow
  delete globalThis.__imageClient
}
