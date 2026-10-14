import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const env = await readFile('.env.local', 'utf8')
const field = name => env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '')
const url = field('VITE_SUPABASE_URL'), key = field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url, 'https://iepeqmvzjguwlhnecsdq.supabase.co'); assert.ok(key?.startsWith('sb_publishable_'))
const id = '90000000-0000-4000-8000-000000000001', results = []
for (const [path, body] of [
  ['rpc/list_follow_requests', { p_after_requested_at: null, p_after_follower_id: null, p_limit: 30 }],
  ['rpc/resolve_follow_request', { p_follower_id: id, p_request_version: id, p_decision: 'accepted' }],
  ['user_follows?select=request_version,status&followed_id=eq.' + id + '&follower_id=eq.' + id, null],
  ['profiles?select=id,birth_date,sex', null],
]) {
  // No authenticated credentials, fixtures or possible allowed writes remotely.
  const response = await fetch(`${url}/rest/v1/${path}`, { method: body ? 'POST' : 'GET', headers: { apikey: key, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000) })
  results.push({ path, status: response.status, result: [401, 403].includes(response.status) ? 'PASS' : 'FAIL' })
}
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-7/remote'
await mkdir(out, { recursive: true })
await writeFile(`${out}/http-anon.json`, JSON.stringify({ date: new Date().toISOString(), project: 'iepeqmvzjguwlhnecsdq', environment: 'Real HTTPS, public key only; no authenticated JWT, no allowed writes', results }, null, 2) + '\n')
assert.ok(results.every(row => row.result === 'PASS')); console.log('PASS: four real anonymous HTTP denials for B7')
