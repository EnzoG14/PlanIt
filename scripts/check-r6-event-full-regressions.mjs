import { readFile, writeFile, mkdir, unlink, readdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Run existing assertions unchanged, with all new evidence kept under B6.
const run = promisify(execFile)
const out = 'docs/qa/r6-block-6/regressions'
const retry = process.argv.includes('--catalog-retry')
const participationRetry = process.argv.includes('--participations-retry')
await mkdir(out, { recursive: true })
await mkdir('.r6-check.local', { recursive: true })
// Legacy R5 suites default to pre-R6 catalogs. Keep the B0 audited function
// bodies/ACL/RLS as regression expectations, but declare the CURRENT LOCAL
// migration list separately. This fixture is explicitly NOT a remote audit.
const baselinePath = 'docs/qa/r6-block-0/catalog.json'
const baseline = JSON.parse(await readFile(baselinePath, 'utf8')).rows[0].metadata
const fixture = {
  environment: 'Local regression expectation: B0 historical function/ACL/RLS definitions plus current local migration manifest. Not fresh remote verification.',
  source: baselinePath,
  rows: [{ metadata: { ...baseline, migrations: (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort().map(f => ({ version: f.split('_')[0] })) } }],
}
const suffix = retry ? '-retry' : participationRetry ? '-participations' : ''
const catalogPath = `.r6-check.local/event-full-catalog${suffix}.json`
await writeFile(catalogPath, JSON.stringify(fixture, null, 2) + '\n')
await writeFile(`${out}/catalog-manifest.json`, JSON.stringify({ environment: fixture.environment, source: baselinePath, source_sha256: createHash('sha256').update(await readFile(baselinePath)).digest('hex'), local_migrations: fixture.rows[0].metadata.migrations }, null, 2) + '\n')
const runner = await readFile('scripts/check-r5-release.mjs', 'utf8')
const path = `.r6-check.local/r5-release${suffix}.mjs`
await writeFile(path, runner.replace("const out = 'docs/qa/r5-block-10'", `const out = '${out}/r5-release'`).replaceAll("branch: 'codex/r5-block-10'", "branch: 'codex/r6-block-6'"))
// R1's standalone scaffold predates the server-only signing role introduced in
// R5. The established R5 regression wrapper makes this same compatibility fix.
const participationPath = `.r6-check.local/participations${suffix}.mjs`
const participationSource = await readFile('scripts/check-participations.mjs', 'utf8')
await writeFile(participationPath, participationSource.replace(/create role anon; create role authenticated;(?! create role service_role;)/, 'create role anon; create role authenticated; create role service_role;'))
const results = []
const suites = retry ? [['r5-release-sql', path, ['sql', 'edit-profile', 'private-profile', 'follows', 'requests']]] : participationRetry ? [['participations', participationPath, []]] : [
  ['r5-release-sql', path, ['sql']],
  ['r5-release-regressions', path, ['regressions']],
  ['participations', participationPath, []],
  ['rejoin', 'scripts/check-rejoin.mjs', []],
  ['event-access', 'scripts/check-event-access.mjs', []],
  ['notifications', 'scripts/check-notifications.mjs', []],
]
try {
  for (const [name, script, args] of suites) {
    const directory = `${out}/${name}`
    await mkdir(directory, { recursive: true })
    let result = 'PASS', stdout = '', stderr = '', error
    try {
      ;({ stdout, stderr } = await run(process.execPath, [script, ...args], {
        windowsHide: true, timeout: 900000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, PLANIT_R5_FULL_CATALOG: catalogPath, PLANIT_SQL_OUTPUT: directory, PLANIT_UI_OUTPUT: directory },
      }))
    } catch (failure) {
      result = 'FAIL'; stdout = failure.stdout ?? ''; stderr = failure.stderr ?? ''; error = failure.message
    }
    await writeFile(`${directory}/stdout.txt`, stdout)
    await writeFile(`${directory}/stderr.txt`, stderr)
    results.push({ name, script, args, result, error, source_sha256: createHash('sha256').update(await readFile(script)).digest('hex') })
    await writeFile(`${out}/${retry ? 'catalog-retry' : participationRetry ? 'participations-retry' : 'results'}.json`, JSON.stringify({ results, result: results.every(r => r.result === 'PASS') ? 'PASS' : 'FAIL' }, null, 2) + '\n')
    console.log(`${result}: ${name}`)
  }
} finally { await unlink(path); await unlink(catalogPath); await unlink(participationPath) }
if (results.some(r => r.result === 'FAIL')) process.exitCode = 1
