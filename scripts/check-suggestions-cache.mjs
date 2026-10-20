import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
let authChanged
let now = 1000
const originalNow = Date.now
Date.now = () => now
globalThis.__contentClient = { auth: { onAuthStateChange(callback) { authChanged = callback } } }
try {
  const source = (await readFile('src/lib/session-content.ts', 'utf8')).replace("import { supabase } from './supabase'", 'const supabase = globalThis.__contentClient')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
  const { loadContent, readContent, invalidateContent, beginContentSession } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
  beginContentSession('a')
  let calls = 0, release
  const loader = async () => { calls++; await new Promise(resolve => { release = resolve }); return { events: ['fixture'] } }
  const one = loadContent('suggestions:origin1', loader)
  const two = loadContent('suggestions:origin1', loader)
  assert.equal(calls, 1)
  release()
  const [first, second] = await Promise.all([one, two])
  assert.equal(first, second)
  await loadContent('suggestions:origin1', loader)
  assert.equal(calls, 1)
  now += 31000
  assert.equal(readContent('suggestions:origin1'), first, 'expired data remains available for immediate rendering')
  const refresh = loadContent('suggestions:origin1', loader)
  assert.equal(calls, 2)
  assert.equal(readContent('suggestions:origin1'), first)
  release(); await refresh
  invalidateContent('suggestions:')
  assert.equal(readContent('suggestions:origin1'), undefined)
  await assert.rejects(loadContent('profile:a', async () => { throw new Error('offline') }))
  assert.equal(await loadContent('profile:a', async () => 'retry'), 'retry')
  const late = loadContent('late', loader)
  authChanged('SIGNED_OUT', null)
  await assert.rejects(late)
  release()
  assert.equal(readContent('late'), undefined)
  beginContentSession('b')
  assert.equal(readContent('profile:a'), undefined)
  await loadContent('profile:b', async () => 'b')
  authChanged('SIGNED_IN', { user: { id: 'b' } })
  assert.equal(readContent('profile:b'), 'b')
  authChanged('SIGNED_IN', { user: { id: 'c' } })
  assert.equal(readContent('profile:b'), undefined)
  console.log('PASS: shared requests, recent reuse, stale snapshot during refresh, mutation invalidation, retry and late-response/account isolation')
} finally { Date.now = originalNow; delete globalThis.__contentClient }
