import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

// R4 block 7 REST/RPC verification against separately provisioned FIXTURE accounts and a
// FIXTURE hidden event. It redeems links (writes grants), so it needs explicit authorization,
// an applied migration and a manifest. Never prints tokens/JWTs. NOT RUN by default.
if (!process.argv.includes('--run')) throw new Error('NOT RUN: requires --run, the applied redeem_event_link migration and an approved fixture manifest (see docs/design/verification/r4-block-7/README.md).')
const origin = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
const key = process.env.PLANIT_HTTP_PUBLISHABLE_KEY
assert.match(key ?? '', /^sb_publishable_[A-Za-z0-9_-]+$/)
// manifest: { users: {A,B,C,D}, eventId, links: { current, old }, revokedUser: 'C' }; links come from the fixture owner session.
const manifest = JSON.parse(await readFile(process.env.PLANIT_HTTP_FIXTURES, 'utf8'))
const results = []
async function request(path, jwt, payload) {
  const response = await fetch(`${origin}${path}`, { method: payload ? 'POST' : 'GET', cache: 'no-store',
    headers: { apikey: key, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), 'Content-Type': 'application/json' }, ...(payload ? { body: JSON.stringify(payload) } : {}) })
  return { status: response.status, body: await response.json().catch(() => null) }
}
const jwt = actor => { const value = process.env[`PLANIT_HTTP_JWT_${actor}`]; assert.ok(value, `Missing JWT ${actor}`); return value }
for (const actor of ['A', 'B', 'C', 'D']) {
  const identity = await request('/auth/v1/user', jwt(actor)); assert.equal(identity.status, 200); assert.equal(identity.body.id, manifest.users[actor])
}
const events = actor => request(`/rest/v1/events?id=eq.${manifest.eventId}&select=id`, actor ? jwt(actor) : null)
const redeem = (actor, token) => request('/rest/v1/rpc/redeem_event_link', actor ? jwt(actor) : null, { p_token: token })
const record = (test, ok) => { assert.ok(ok, test); results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
const anon = await redeem(null, manifest.links.current)
record('anon cannot execute the RPC', [401, 403].includes(anon.status))
record('D has no row before redeem', (await events('D')).body.length === 0)
const first = await redeem('B', manifest.links.current), second = await redeem('B', manifest.links.current)
record('B redeems twice with the same result', first.status === 200 && second.status === 200 && first.body === manifest.eventId && second.body === manifest.eventId)
record('B reads the event without the link afterwards', (await events('B')).body.length === 1)
const bad = [await redeem('D', manifest.links.old), await redeem('D', 'f'.repeat(64)), await redeem('D', 'x')]
record('old/unknown/malformed tokens fail with one identical error', bad.every(r => r.status === 400 && r.body.message === 'invite_unavailable' && r.body.message === bad[0].body.message))
record('D still has no row', (await events('D')).body.length === 0)
const revoked = await redeem('C', manifest.links.current)
record('revoked C cannot recover with the current link', revoked.status === 400 && revoked.body.message === 'invite_unavailable' && (await events('C')).body.length === 0)
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r4-block-7'
await mkdir(out, { recursive: true })
await writeFile(`${out}/http-results.json`, JSON.stringify({ environment: 'REST/RPC with fixture JWTs; no tokens recorded', results }, null, 2))
