import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import ts from 'typescript'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'

async function importTs(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}
const { validateAuth, safeReturnPath, authErrorMessage } = await importTs('../src/features/auth/validation.ts')
const { validateSupabaseConfig } = await importTs('../src/lib/supabase-config.ts')
const valid = { display_name: '  Ana Pérez  ', email: ' ana@example.com ', password: 'pass phrase' }
assert.deepEqual(validateAuth(valid, true), {})
for (const name of ['', ' ', 'a', 'x'.repeat(61)]) assert.ok(validateAuth({ ...valid, display_name: name }, true).display_name)
assert.deepEqual(validateAuth({ ...valid, display_name: '😀'.repeat(60) }, true), {})
assert.ok(validateAuth({ ...valid, display_name: '😀'.repeat(61) }, true).display_name)
for (const email of ['', 'a', 'a@', 'a b@example.com']) assert.ok(validateAuth({ ...valid, email }, true).email)
assert.ok(validateAuth({ ...valid, password: '12345' }, true).password)
assert.deepEqual(validateAuth({ ...valid, password: '123456' }, true), {})
assert.deepEqual(validateAuth({ ...valid, display_name: '', password: 'old' }, false), {})
assert.ok(validateAuth({ ...valid, password: '' }, false).password)
for (const next of [null, '//evil.example', 'https://evil.example', '/me?next=https://evil.example', '/map/../me', '/unknown']) assert.equal(safeReturnPath(next), '/map')
for (const next of ['/map', '/my-events', '/events/new', '/me']) assert.equal(safeReturnPath(next), next)
assert.equal(authErrorMessage('server error containing secret'), authErrorMessage())
console.log('PASS: required fields, Unicode name limits, registration/login password validation and safe internal return paths.')

// Live tests are opt-in. Credentials stay in an ignored local file; no admin keys,
// SQL, profile inserts, account deletion or password changes are used.
if (process.argv.includes('--signup') || process.argv.includes('--live')) {
  const env = loadEnv('production', process.cwd(), 'VITE_')
  assert.equal(validateSupabaseConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY), null)
  const fixturePath = '.auth-test.local'
  let accounts
  try { accounts = JSON.parse(await readFile(fixturePath, 'utf8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    assert.ok(process.env.PLANIT_TEST_EMAIL_A && process.env.PLANIT_TEST_EMAIL_B, 'Set both authorized test emails before creating fixtures.')
    accounts = [process.env.PLANIT_TEST_EMAIL_A, process.env.PLANIT_TEST_EMAIL_B].map((email, index) => ({ email, password: `PlanIt-${randomBytes(24).toString('base64url')}!9a`, display_name: `Prueba Auth ${index + 1}` }))
    await writeFile(fixturePath, JSON.stringify(accounts), { mode: 0o600, flag: 'wx' })
  }
  function client(storage) {
    return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: Boolean(storage), storage } })
  }
  if (process.argv.includes('--signup')) {
    for (const [index, account] of accounts.entries()) {
      if (account.signupAttempted) { console.log(`SKIP: account ${index + 1} already attempted; no repeated email.`); continue }
      const signupClient = client()
      const { data, error } = await signupClient.auth.signUp({ email: account.email, password: account.password, options: { data: { display_name: account.display_name }, emailRedirectTo: 'http://localhost:4177/map' } })
      account.signupAttempted = true
      account.signupCode = error?.code ?? null
      account.id = error ? null : data.user?.id
      account.confirmationPending = !error && !data.session
      await writeFile(fixturePath, JSON.stringify(accounts), { mode: 0o600 })
      console.log(JSON.stringify({ account: index + 1, signupCode: account.signupCode, confirmationPending: account.confirmationPending, identityReturned: Boolean(account.id) }))
      if (data.session) await signupClient.auth.signOut({ scope: 'local' })
    }
  }
  if (process.argv.includes('--live')) {
    const clients = []
    const identities = []
    const storages = []
    for (const [index, account] of accounts.entries()) {
      const map = new Map()
      const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }
      storages.push(storage)
      const auth = client(storage)
      const { data, error } = await auth.auth.signInWithPassword({ email: account.email, password: account.password })
      if (error) { console.log(`PENDING: account ${index + 1} login (${error.code ?? 'request_failed'}).`); process.exitCode = 2; break }
      assert.ok(data.session)
      const { data: profile, error: profileError } = await auth.from('profiles').select('id,username,display_name').eq('id', data.user.id).single()
      assert.equal(profileError, null)
      assert.equal(profile.display_name, account.display_name)
      assert.match(profile.username, /^user_[a-f0-9]{12}$/)
      clients.push(auth)
      identities.push(profile)
      console.log(`PASS: account ${index + 1} login, own profile, preserved display_name and generated username.`)
    }
    if (clients.length === 2) {
      assert.notEqual(identities[0].username, identities[1].username)
      for (let index = 0; index < 2; index += 1) {
        const { data: cross, error } = await clients[index].from('profiles').select('id,display_name').eq('id', identities[1 - index].id)
        assert.equal(error, null)
        assert.deepEqual(cross, [], 'RLS must hide the other account')
        const { data: visible, error: visibleError } = await clients[index].from('profiles').select('id')
        assert.equal(visibleError, null)
        assert.deepEqual(visible.map(row => row.id), [identities[index].id])
      }
      console.log('PASS: both cross-profile reads hidden by RLS; unfiltered reads expose only the owner.')
      const restored = client(storages[0])
      assert.equal((await restored.auth.getSession()).data.session?.user.id, identities[0].id)
      assert.equal((await restored.auth.getUser()).data.user?.id, identities[0].id)
      console.log('PASS: new client restores and verifies persisted session.')
      const { error: invalid } = await client().auth.signInWithPassword({ email: accounts[0].email, password: randomBytes(24).toString('hex') })
      assert.equal(invalid?.code, 'invalid_credentials')
      console.log('PASS: incorrect credentials rejected without logging sensitive data.')
      if (!accounts[0].duplicateAttempted) {
        const { data: duplicate, error: duplicateError } = await client().auth.signUp({ email: accounts[0].email, password: accounts[0].password, options: { data: { display_name: accounts[0].display_name } } })
        accounts[0].duplicateAttempted = true
        accounts[0].duplicateCode = duplicateError?.code ?? null
        accounts[0].duplicateIdentities = duplicate.user?.identities?.length ?? null
        await writeFile(fixturePath, JSON.stringify(accounts), { mode: 0o600 })
      }
      console.log(JSON.stringify({ duplicateCode: accounts[0].duplicateCode, duplicateIdentityCount: accounts[0].duplicateIdentities }))
      assert.ok(['user_already_exists', 'email_exists'].includes(accounts[0].duplicateCode) || accounts[0].duplicateIdentities === 0, 'Duplicate registration must not create another identity')
      const expiredMap = new Map()
      // Supabase uses this storage key for the current project. Keep the revoked
      // token only in memory to exercise expiry; never print or save it.
      const storageKey = 'sb-iepeqmvzjguwlhnecsdq-auth-token'
      const cached = JSON.parse(storages[0].getItem(storageKey))
      expiredMap.set(storageKey, JSON.stringify({ ...cached, expires_at: Math.floor(Date.now() / 1000) - 60 }))
      const { error: logoutError } = await restored.auth.signOut({ scope: 'local' })
      assert.equal(logoutError, null)
      assert.equal((await restored.auth.getSession()).data.session, null)
      console.log('PASS: logout removes the persisted session.')
      const expired = client({ getItem: key => expiredMap.get(key) ?? null, setItem: (key, value) => expiredMap.set(key, value), removeItem: key => expiredMap.delete(key) })
      assert.equal((await expired.auth.getSession()).data.session, null)
      console.log('PASS: expired session with revoked refresh token cannot be restored.')
    }
    for (const auth of clients) await auth.auth.signOut({ scope: 'local' })
  }
}
