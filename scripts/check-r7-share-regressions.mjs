import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)
const out = 'docs/qa/r7-block-8'
const temp = '.r7-share-regressions.local'
await mkdir(temp, { recursive: true })
const suites = [['links', 'scripts/check-event-links.mjs'], ['access', 'scripts/check-event-access.mjs'], ['invite', 'scripts/check-invite.mjs']]
const results = await Promise.allSettled(suites.map(async ([name, path]) => {
  let source = (await readFile(path, 'utf8')).replace(/\r\n/g, '\n')
  const marker = "  const migrations = (await readdir('supabase/migrations'))"
  assert.equal(source.split(marker).length, 2, 'Only add the missing Storage scaffold before migration replay')
  // Same explicitly simulated operation helper used by B1's isolated PostgreSQL runner.
  // This is not a Supabase Storage transport test, nor a replacement for its real helper.
  const scaffoldSql = "alter table storage.objects add unique(bucket_id,name); " +
    "create function storage.allow_only_operation(text) returns boolean language sql stable as $$ " +
    "select coalesce(current_setting('test.storage_operation',true) = $1,false) $$;"
  const scaffold = '  await admin.query(' + JSON.stringify(scaffoldSql) + ')\n'
  source = source.replace(marker, () => scaffold + marker)
  const runner = temp + '/' + name + '.mjs'
  await writeFile(runner, source)
  try {
    const { stdout } = await run(process.execPath, [runner], { env: { ...process.env, PLANIT_UI_OUTPUT: out + '/r4-' + name }, windowsHide: true, timeout: 180000 })
    process.stdout.write(stdout)
    const evidence = JSON.parse(await readFile(out + '/r4-' + name + '/postgres-results.json', 'utf8'))
    return { suite: name, result: 'PASS', groups: evidence.results.length, migrations: evidence.migrations.length }
  } finally { await unlink(runner) }
}))
const summary = {
  environment: 'Real isolated PostgreSQL; existing R4 assertions unchanged; Auth/Storage SQL scaffolds, SET ROLE; no HTTP/JWT',
  originalRunnerOnB1: { result: 'BLOCKED', sqlstate: '42883', missingScaffold: 'storage.allow_only_operation(text)', note: 'All three original R4 bootstraps lack the helper required by the integrated B1 migration. Original assertions were not failing.' },
  adapter: 'Adds only Storage unique(bucket_id,name) and operation helper from B1 test scaffold before replay; originals untouched',
  suites: results.map((result, i) => result.status === 'fulfilled' ? result.value : { suite: suites[i][0], result: 'FAIL', error: result.reason.message })
}
await writeFile(out + '/regression-results.json', JSON.stringify(summary, null, 2) + '\n')
assert.ok(results.every(result => result.status === 'fulfilled'), 'R4 regression suite failed; inspect regression-results.json')
