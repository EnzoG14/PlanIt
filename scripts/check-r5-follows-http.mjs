import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const env = await readFile('.env.local', 'utf8')
const field = name => env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '')
const url = field('VITE_SUPABASE_URL'), key = field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url, 'https://iepeqmvzjguwlhnecsdq.supabase.co'); assert.ok(key?.startsWith('sb_publishable_'))
const id = '90000000-0000-4000-8000-000000000001', results = []
// Reads only. No remote users, follows or fixtures are created by this runner.
for (const [path, body] of [
  ['rpc/get_social_relationship', { p_user_id: id }],
  ['rpc/get_social_counts', { p_user_id: id }],
  ['rpc/list_social_follows', { p_user_id: id, p_direction: 'followers', p_limit: 30 }],
  ['rpc/list_social_follows', { p_user_id: id, p_direction: 'following', p_limit: 30 }],
  ['user_follows?select=follower_id,followed_id,status', null],
]) {
  const response = await fetch(`${url}/rest/v1/${path}`, { method: body ? 'POST' : 'GET', headers: { apikey: key, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000) })
  results.push({ path, status: response.status, result: [401, 403].includes(response.status) ? 'PASS' : 'FAIL' })
}
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-6/remote'
await mkdir(out, { recursive: true })
await writeFile(`${out}/http-anon.json`, JSON.stringify({ date: new Date().toISOString(), project: 'iepeqmvzjguwlhnecsdq', environment: 'Real HTTPS, public key only, no authenticated JWT or writes', results, authenticated: 'NOT RUN: no preexisting authorized test sessions supplied' }, null, 2) + '\n')
assert.ok(results.every(row => row.result === 'PASS')); console.log('PASS: five real anonymous HTTP read denials for B6')
