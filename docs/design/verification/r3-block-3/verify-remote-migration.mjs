import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const base = 'docs/design/verification/r3-block-3/'
const read = async name => JSON.parse(await readFile(base + name, 'utf8'))
const remote = (await read('remote-migration-results.json')).rows[0].verification
const migration = await readFile('supabase/migrations/20261012013634_manage_event_gallery.sql', 'utf8')
assert.equal(remote.migration_applied, true)
assert.equal(remote.functions.length, 8)
for (const fn of remote.functions) {
  const start = migration.indexOf(`function ${fn.schema}.${fn.name}(`)
  assert.ok(start >= 0)
  const tail = migration.slice(start)
  const first = tail.indexOf('$$')
  const body = tail.slice(first + 2, tail.indexOf('$$', first + 2))
  assert.equal(body.trim().replaceAll('\r', ''), fn.source.trim().replaceAll('\r', ''))
  assert.equal(fn.anon_execute, false)
  assert.ok(fn.settings.includes('search_path=""'))
  if (fn.schema === 'public') assert.equal(fn.authenticated_execute, true)
  else assert.equal(fn.authenticated_execute, fn.name === 'can_delete_event_upload')
  console.log(`PASS: ${fn.schema}.${fn.name} source/search_path/grants`)
}
for (const table of remote.tables) {
  assert.equal(table.rls, true)
  assert.equal(table.authenticated_update, false)
  assert.equal(table.authenticated_delete, false)
}
assert.equal(remote.slot_constraint.deferrable, true)
assert.equal(remote.slot_constraint.initially_deferred, false)
assert.equal(remote.missing_objects, 0)
assert.ok(remote.storage_policies.find(policy => policy.name === 'event_media_delete_unlinked').using.includes('can_delete_event_upload'))
const history = await read('migration-history-after.json')
assert.equal(history.migrations.length, 14)
assert.ok(history.migrations.every(row => row.local === row.remote))
const before = await read('advisors-before.json'), after = await read('advisors-after.json')
const newFindings = after.filter(a => !before.some(b => b.cache_key === a.cache_key))
assert.equal(newFindings.length, 4)
assert.ok(newFindings.every(finding => finding.name === 'authenticated_security_definer_function_executable'))
console.log('PASS: history synchronized, RLS, slot constraint, no missing objects')
console.log(`Advisors: ${before.length} → ${after.length}; four intended authenticated definer RPC findings`)
await writeFile(base + 'remote-migration-summary.json', JSON.stringify({
  project: 'iepeqmvzjguwlhnecsdq', migration: '20261012013634_manage_event_gallery.sql',
  applied: true, history_synchronized: true, migration_count: 14,
  function_source_match_count: 8, rls_and_minimal_grants: 'PASS',
  registered_files_without_objects: remote.missing_objects,
  advisors_before: before.length, advisors_after: after.length,
  new_findings: newFindings.map(({ name, level, metadata }) => ({ name, level, metadata })),
  vault_secrets_changed: false, business_data_written: false,
  limitation: 'Catalog/definition verification only; no remote HTTP/Auth/JWT/Storage business tests',
}, null, 2))
