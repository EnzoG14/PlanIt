import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
let authChanged
let now = 1000
const originalNow = Date.now
Date.now = () => now
globalThis.__suggestionsClient = { auth: { onAuthStateChange(callback) { authChanged = callback } } }
try {
  const source = (await readFile('src/features/events/suggestions-cache.ts', 'utf8')).replace("import { supabase } from '../../lib/supabase'", 'const supabase = globalThis.__suggestionsClient')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
  const { readSuggestions, rememberSuggestions, clearSuggestions } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
  const result = { events: [], hasInterests: true, imageError: false }
  authChanged('SIGNED_IN', { user: { id: 'a' } })
  rememberSuggestions('a:origin1', result)
  assert.equal(readSuggestions('a:origin1'), result)
  assert.equal(readSuggestions('b:origin1'), null)
  assert.equal(readSuggestions('a:origin2'), null)
  authChanged('SIGNED_IN', { user: { id: 'a' } })
  assert.equal(readSuggestions('a:origin1'), result, 'same-user focus event keeps recent data')
  now += 30000
  assert.equal(readSuggestions('a:origin1'), null)
  rememberSuggestions('a:origin1', result)
  clearSuggestions()
  assert.equal(readSuggestions('a:origin1'), null)
  rememberSuggestions('a:origin1', result)
  authChanged('SIGNED_IN', { user: { id: 'b' } })
  assert.equal(readSuggestions('a:origin1'), null)
  rememberSuggestions('b:origin1', result)
  authChanged('SIGNED_OUT', null)
  assert.equal(readSuggestions('b:origin1'), null)
  console.log('PASS: recent result reuse, 30-second expiry, origin/account isolation, invalidation, same-user focus and sign-out')
} finally { Date.now = originalNow; delete globalThis.__suggestionsClient }
