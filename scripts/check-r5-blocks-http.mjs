import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const env = await readFile('.env.local', 'utf8')
const field = name => env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '')
const url = field('VITE_SUPABASE_URL'), key = field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url, 'https://iepeqmvzjguwlhnecsdq.supabase.co'); assert.ok(key?.startsWith('sb_publishable_'))
const id = '90000000-0000-4000-8000-000000000001', results = []
for (const path of ['user_blocks?select=blocked_id', 'user_follows?select=follower_id,followed_id',
  'rpc/get_social_relationship?p_user_id='+id, 'rpc/get_social_profile?p_user_id='+id]) {
  // GET only, public key and no user JWT. No mutation RPCs or remote fixtures.
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key }, signal: AbortSignal.timeout(10000) })
  results.push({ path, status: response.status, result: [401, 403].includes(response.status) ? 'PASS' : 'FAIL' })
}
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-9/remote'
await mkdir(out, { recursive: true })
await writeFile(`${out}/http-anon.json`, JSON.stringify({ date: new Date().toISOString(), project: 'iepeqmvzjguwlhnecsdq', environment: 'Real HTTPS anonymous GET only; no authenticated JWT or allowed writes', results }, null, 2) + '\n')
assert.ok(results.every(row => row.result === 'PASS')); console.log('PASS: four real anonymous HTTP denials for B9')
