import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

// Read-only REST/RPC/Storage verification against separately provisioned fixtures.
// Never provisions users/events, applies SQL, redeems tokens or logs credentials.
// Explicit --run after authorized migration/fixture setup. JWTs only in env.
if (!process.argv.includes('--run')) throw new Error('NOT RUN: requires --run, deployed migration and an approved fixture manifest. See docs/qa/r4-block-5/README.md.')
const origin = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
const key = process.env.PLANIT_HTTP_PUBLISHABLE_KEY
assert.match(key ?? '', /^sb_publishable_[A-Za-z0-9_-]+$/)
const manifest = JSON.parse(await readFile(process.env.PLANIT_HTTP_FIXTURES, 'utf8'))
const results = []
async function request(path, token, payload) {
  const response = await fetch(`${origin}${path}`, {
    method: payload ? 'POST' : 'GET', cache: 'no-store',
    headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  })
  return { status: response.status, body: await response.json() }
}
const rowDenied = r => (r.status === 200 && Array.isArray(r.body) && r.body.length === 0)
  || [401, 403].includes(r.status) && ['42501', 'PGRST301', 'PGRST302'].includes(r.body.code)
for (const actor of ['A', 'B', 'C', 'D', 'anon']) {
  const token = actor === 'anon' ? null : process.env[`PLANIT_HTTP_JWT_${actor}`]
  if (actor !== 'anon') {
    assert.ok(token, `Missing JWT ${actor}`)
    const identity = await request('/auth/v1/user', token)
    assert.equal(identity.status, 200, `JWT ${actor} must be valid, not a denial from an expired token`)
    assert.equal(identity.body.id, manifest.users[actor])
  }
  for (const fixture of manifest.events) {
    const expected = fixture.actors[actor]
    assert.ok(expected, `Missing expectation ${fixture.label}/${actor}`)
    const endpoints = [
      [`/rest/v1/events?id=eq.${fixture.id}`, expected.detail],
      [`/rest/v1/event_images?event_id=eq.${fixture.id}`, expected.detail],
      [`/rest/v1/files?id=eq.${fixture.file_id}`, expected.media ?? expected.detail],
    ]
    for (const [path, allowed] of endpoints) {
      const r = await request(path, token)
      assert.ok(allowed ? r.status === 200 && r.body.length > 0 : rowDenied(r), `${fixture.label}/${actor}: ${path}`)
    }
    for (const [rpc, allowed] of [
      ['get_event_participation_summary', expected.detail], ['get_event_organizer', expected.detail],
      ['get_my_rejoin_status', expected.detail], ['get_event_chat', expected.chat],
      ['get_event_chat_messages', expected.chat], ['get_event_attendees', actor === 'A'],
      ['get_event_duplicate_source', actor === 'A'],
    ]) {
      const r = await request(`/rest/v1/rpc/${rpc}`, token, { p_event_id: fixture.id })
      assert.ok(allowed ? r.status === 200 : rowDenied(r), `${fixture.label}/${actor}: ${rpc}`)
    }
    const signed = await request(`/storage/v1/object/sign/event_media/${fixture.path}`, token, { expiresIn: 60 })
    assert.ok((expected.media ?? expected.detail)
      ? signed.status === 200 && typeof signed.body.signedURL === 'string'
      : [400, 401, 403, 404].includes(signed.status) && /not found|permission|unauthorized|jwt/i.test(signed.body.message ?? signed.body.error ?? ''), `${fixture.label}/${actor}: Storage new signature`)
    const hashes = await request('/rest/v1/event_access_links?select=token_hash', token)
    assert.ok(rowDenied(hashes), `${actor}: hashes denied`)
    results.push({ fixture: fixture.label, actor, result: 'PASS', environment: 'HTTP real JWT; read-only; URLs and tokens omitted' })
  }
}
const output = process.env.PLANIT_HTTP_OUTPUT ?? 'docs/qa/r4-block-5/http-results.json'
await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true })
await writeFile(output, JSON.stringify({ results }, null, 2))
console.log(`PASS: ${results.length} HTTP actor/event cases (no secrets recorded)`)
