import assert from 'node:assert/strict'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const out = 'docs/qa/r6-block-9'
const catalog = JSON.parse(await readFile(`${out}/catalog.json`, 'utf8')).rows[0].metadata
const results = []
const check = (test, value) => { assert.ok(value, test); results.push({ test, result: 'PASS' }) }
const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
check('Fresh remote migration versions exactly match integrated Git migrations', JSON.stringify(catalog.migrations.map(m => m.version)) === JSON.stringify(files.map(f => f.split('_')[0])))
check('All public tables have RLS', catalog.tables.filter(t => t.schema === 'public').every(t => t.rls))
const names = ['get_my_event_occupancy', 'get_my_event_demographics', 'get_my_event_participation_series', 'get_my_event_export_rows', 'get_my_events_occupancy']
const rpc = catalog.functions.filter(f => f.schema === 'public' && names.includes(f.name))
check('All five owner analytics RPCs exist, restricted DEFINER/search_path/UID/owner guards', rpc.length === 5 && rpc.every(f => f.definer && f.config.includes('search_path=""') && !f.anon_execute && f.authenticated_execute && f.definition.includes('auth.uid()') && f.definition.includes('organizer_id')))
const producer = catalog.functions.find(f => f.name === 'notify_event_full')
check('Producer private/invoker, no client EXECUTE', producer?.schema === 'planit_private' && !producer.definer && !producer.anon_execute && !producer.authenticated_execute)
check('Producer trigger active in versioned remote definition', catalog.triggers.some(t => t.name === 'participations_notify_event_full' && t.definition.includes('notify_event_full')))
const notification = catalog.functions.filter(f => ['get_notifications', 'get_notification_changes', 'get_notification_target'].includes(f.name))
check('B7 inbox RPCs are restricted invokers with event_full branch', notification.length === 3 && notification.every(f => !f.definer && !f.anon_execute && f.authenticated_execute && f.config.includes('search_path=""') && f.definition.includes('event_full')))
check('Profile SELECT remains owner-only', catalog.policies.filter(p => p.tablename === 'profiles' && p.cmd === 'SELECT').every(p => p.policyname === 'profiles_select_own' && p.qual.includes('auth.uid()') && p.qual.includes('= id')))
check('Realtime publication excludes profiles/history and contains only messages/notifications', JSON.stringify(catalog.publications.map(p => p.tablename).sort()) === JSON.stringify(['messages', 'notifications']))
check('No events.timezone column', !catalog.columns.some(c => c.table === 'events' && c.column === 'timezone'))
const sw = await readFile('dist/sw.js', 'utf8'), manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'))
check('Built SW has no Supabase/network-response cache route', !sw.includes('supabase.co') && !sw.includes('NetworkFirst') && !sw.includes('StaleWhileRevalidate'))
check('PWA standalone manifest and local icons exist', manifest.display === 'standalone' && manifest.icons.length >= 2)
for (const icon of manifest.icons) await readFile(`dist/${icon.src.replace(/^\//, '')}`)
check('Environment ignored and never tracked', execFileSync('git', ['check-ignore', '.env.local'], { encoding: 'utf8' }).trim() === '.env.local' && !execFileSync('git', ['ls-files', '.env.local'], { encoding: 'utf8' }).trim())
if (process.env.PLANIT_MAIN_ENV_PATH) check('Environment copied byte-for-byte from original main checkout', (await readFile('.env.local')).equals(await readFile(process.env.PLANIT_MAIN_ENV_PATH)))
const history = execFileSync('git', ['log', '--format=%H %s', 'HEAD'], { encoding: 'utf8' })
for (const pr of [60, 63, 64, 65, 66, 67, 68, 69, 70, 71]) check(`Integrated PR #${pr} is in base ancestry`, history.includes(`Merge pull request #${pr} `))
const advisors = JSON.parse(await readFile(`${out}/advisors.json`, 'utf8')).lints
const audit = { base: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), captured_at: catalog.audited_at, server_version: catalog.server_version, migration_count: files.length, public_rls_tables: catalog.tables.filter(t => t.schema === 'public').length, function_count: catalog.functions.length, rpc: rpc.map(({ definition: _definition, ...f }) => f), producer: { schema: producer.schema, name: producer.name }, advisors: advisors.map(a => ({ name: a.name, level: a.level, findings: a.count ?? a.findings?.length, remediation: a.remediation })), migration_sha256: Object.fromEntries(await Promise.all(files.map(async file => [file, createHash('sha256').update(await readFile(`supabase/migrations/${file}`)).digest('hex')]))), results, result: 'PASS', environment: 'Remote READ ONLY catalog and local build checks; no authenticated JWT/Realtime acceptance' }
await writeFile(`${out}/audit.json`, JSON.stringify(audit, null, 2) + '\n')
console.log(`PASS: ${results.length} catalog/build/baseline assertions`)

// Real anonymous HTTPS: public key only, read-only SELECT/RPC. Never mint tokens.
const env = await readFile('.env.local', 'utf8')
const field = name => env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '')
const url = field('VITE_SUPABASE_URL'), key = field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url, 'https://iepeqmvzjguwlhnecsdq.supabase.co'); assert.ok(key?.startsWith('sb_publishable_'))
const id = '90000000-0000-4000-8000-000000000001'
const paths = [
  ...names.map(name => [`rpc/${name}`, name === 'get_my_events_occupancy' ? { p_event_ids: [id, '90000000-0000-4000-8000-000000000002'] } : name === 'get_my_event_participation_series' ? { p_event_id: id, p_from: '2026-10-01T00:00:00', p_to: '2026-10-16T00:00:00', p_bucket: 'day' } : { p_event_id: id }]),
  ['profiles?select=id,birth_date,sex', null], ['participation_history?select=id', null], ['notifications?select=id,title', null],
  ['rpc/get_notifications', { p_before_at: null, p_before_id: null }],
]
const http = []
for (const [path, body] of paths) {
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, { method: body ? 'POST' : 'GET', headers: { apikey: key, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) })
    // Capture no response rows or diagnostic messages that could contain private data.
    http.push({ path, status: res.status, result: [401, 403].includes(res.status) ? 'PASS' : 'FAIL' })
    await res.body?.cancel()
  } catch (e) { http.push({ path, result: 'BLOCKED', reason: e.name }) }
}
await writeFile(`${out}/http-anon.json`, JSON.stringify({ environment: 'Real HTTPS/public key; no user JWT, no writes, no signup', results: http, result: http.some(r => r.result === 'FAIL') ? 'FAIL' : http.every(r => r.result === 'PASS') ? 'PASS' : 'BLOCKED' }, null, 2) + '\n')
console.log(`HTTP anonymous: ${http.filter(r => r.result === 'PASS').length}/${http.length}; authenticated JWT NOT RUN`)
if (http.some(r => r.result === 'FAIL')) process.exitCode = 1
