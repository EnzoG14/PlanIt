import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

// Offline audit of captured READ ONLY metadata and synthetic counterexamples.
// Does not implement analytics, connect to a database, or accept any R6 CA.
const out = 'docs/qa/r6-block-0'
const read = async path => JSON.parse(await readFile(path, 'utf8'))
const catalog = (await read(`${out}/catalog.json`)).rows[0].metadata
const previous = (await read('docs/qa/r5-block-10/catalog.json')).rows[0].metadata
const requirements = await readFile('docs/requirements/RELEASE_6_REQUIREMENTS.md', 'utf8')
const source = await read(`${out}/source.json`)
const results = []
function check(name, test) { assert.ok(test, name); results.push({ name, result: 'PASS' }) }
const migrations = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
check('30 Git migration versions equal current remote catalog', migrations.length === 30 && JSON.stringify(migrations.map(f => f.split('_')[0])) === JSON.stringify(catalog.migrations.map(m => m.version)))
check('All 16 public tables use RLS', catalog.tables.length === 16 && catalog.tables.every(t => t.rls))
check('82 function signatures, definitions, ACL and config unchanged since R5 B10 catalog', JSON.stringify(catalog.functions) === JSON.stringify(previous.functions))
check('R5 public columns, constraints, indexes, policies and triggers unchanged', ['columns', 'constraints', 'indexes', 'policies', 'triggers', 'table_grants', 'column_grants'].every(k => JSON.stringify(catalog[k]) === JSON.stringify(previous[k])))
const critical = ['register_for_event', 'leave_event', 'resolve_rejoin', 'remove_participant', 'update_event', 'get_event_attendees']
for (const name of critical) {
  const f = catalog.functions.find(f => f.name === name)
  check(`${name}: authenticated only, definer, empty search_path and identity guard`, f && f.definer && !f.anon_execute && f.authenticated_execute && f.config.includes('search_path=""') && f.definition.includes('auth.uid()'))
}
check('Profiles SELECT remains owner-only', catalog.policies.filter(p => p.tablename === 'profiles' && p.cmd === 'SELECT').every(p => p.policyname === 'profiles_select_own' && p.qual.includes('= id')))
check('Only messages/notifications are published', JSON.stringify(catalog.publications.map(p => p.tablename).sort()) === JSON.stringify(['messages', 'notifications']))
check('No R6 analytics RPC has been installed', !catalog.functions.some(f => /get_my_event_occupancy|demographics|compare_my_event_occupancy/.test(f.name)))
const criteria = [...requirements.matchAll(/\*\*(RF-R6-\d{2}\.CA-\d{2}):\*\* (.+)/g)].map(m => ({ id: m[1], literal: m[2].trim() }))
check('24 local CA exactly match fresh source text', criteria.length === 24 && source.criteria.length === 24 && criteria.every(c => source.criteria.includes(`${c.id}. ${c.literal}`)))
const targets = [
  ['get_my_event_occupancy', 'B1/B2', 'events + confirmed participations; owner guard; refresh'],
  ['get_my_event_demographics + get_my_event_participation_series', 'B3/B4', 'profiles aggregate + history; D04 privacy gate'],
  ['get_my_event_participation_series', 'B4', 'history [from,to); context invalidation'],
  ['get_my_event_export_rows + series', 'B5', 'authorized snapshot + sanitized CSV; all-or-nothing'],
  ['record_participation_history producer + notifications', 'B6/B7', 'event lock + unique transition + recipient RLS'],
  ['compare_my_event_occupancy', 'B8', 'all IDs owned; same occupancy expression'],
]
await writeFile(`${out}/traceability.json`, JSON.stringify(criteria.map(c => ({ ...c, contract: targets[Number(c.id.slice(6, 8)) - 1], acceptance: 'NOT RUN' })), null, 2) + '\n')
assert.equal(source.requirements.length, 6)
assert.ok(source.requirements.every(r => requirements.includes(r.description)))
await writeFile(`${out}/rf-traceability.json`, JSON.stringify(source.requirements.map((r, i) => ({ ...r, contract: targets[i], acceptance: 'NOT RUN' })), null, 2) + '\n')
const fixtures = {
  occupancy: [{ capacity: 10, confirmed: 4, cancelled: 2, removed: 1, available: 6, percent: 40 }, { capacity: 20, confirmed: 15, available: 5, percent: 75 }],
  transitions: [[null, 'confirmed', 'alta'], ['confirmed', 'cancelled', 'baja'], ['cancelled', 'confirmed', 'reincorporacion'], ['confirmed', 'removed', 'baja'], ['removed', 'confirmed', 'reincorporacion']],
  privacy: { tiny: [1, 4], complementary: [9, 1], before: [5, 5], after: [6, 5], overlapping_events: [[5, 5], [6, 5]], unknown: [5, 0, 0, 1] },
}
check('Synthetic occupancy reconciles, excluding cancelled and removed', fixtures.occupancy.every(f => f.available === Math.max(0, f.capacity - f.confirmed) && f.percent === f.confirmed / f.capacity * 100))
check('Complementary inference counterexample: total reveals hidden singleton', fixtures.privacy.complementary.reduce((a, b) => a + b, 0) - fixtures.privacy.complementary[0] === 1)
check('Temporal inference counterexample: k=5 on both snapshots still reveals one category', fixtures.privacy.before.every(n => n >= 5) && fixtures.privacy.after.every(n => n >= 5) && fixtures.privacy.after[0] - fixtures.privacy.before[0] === 1)
check('main env copy is byte-identical and ignored', (await readFile('.env.local')).equals(await readFile('../mapbox-worktree/.env.local')) && execFileSync('git', ['check-ignore', '.env.local'], { encoding: 'utf8' }).trim() === '.env.local')
await writeFile(`${out}/synthetic-fixtures.json`, JSON.stringify(fixtures, null, 2) + '\n')
const hash = data => createHash('sha256').update(data).digest('hex')
const inputs = {}
for (const file of ['catalog.json', 'source.json', 'traceability.json', 'rf-traceability.json', 'synthetic-fixtures.json']) inputs[file] = hash(await readFile(`${out}/${file}`))
inputs.mockup = hash(await readFile('docs/design/mockups/release-6.png'))
await writeFile(`${out}/audit.json`, JSON.stringify({ base: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), captured_at: catalog.audited_at, environment: 'Offline assertions on captured current catalog; synthetic JS arithmetic only; not SQL/JWT/CA acceptance', inputs, results }, null, 2) + '\n')
console.log(`PASS: ${results.length} baseline checks; R6 acceptance remains 0/24`)
