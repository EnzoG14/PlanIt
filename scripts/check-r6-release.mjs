import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { resolve, extname } from 'node:path'
import { createServer } from 'node:http'

// Local-only suites. No remote credentials, signups, DDL or fixture writes.
const run = promisify(execFile)
const out = 'docs/qa/r6-block-9'
const scratch = '.r6-check.local'
const stage = process.argv[2]
const names = {
  sql: ['occupancy', 'demographics', 'periods', 'csv', 'event-full', 'event-full-inbox', 'compare'],
  contract: ['occupancy', 'demographics', 'periods', 'csv', 'compare'],
  ui: ['occupancy', 'demographics', 'periods', 'csv', 'event-full', 'compare'],
  r5: ['participants', 'profile', 'edit-profile', 'private-profile', 'follows', 'requests', 'messages', 'blocks', 'request-notifications', 'message-notifications', 'avatar'],
  regression: ['profile', 'chat', 'notifications', 'interests', 'hidden-access', 'event-links', 'invite', 'event-access', 'gallery', 'attendees', 'rejoin', 'event-actions', 'edit-event', 'participations', 'home-events', 'search'],
  'regression-ui': ['notifications', 'realtime', 'r5-message-notifications', 'r5-request-notifications', 'my-events-refresh'],
  checks: ['build', 'lint', 'auth', 'events', 'amanecer'],
}
assert.ok(names[stage], 'Choose sql, contract, ui, r5, regression, regression-ui or checks')
const selected = process.argv.slice(3)
assert.ok(selected.every(name => names[stage].includes(name)), 'Unknown suite')
await mkdir(out, { recursive: true }); await mkdir(scratch, { recursive: true })
const base = (await run('git', ['rev-parse', 'HEAD'], { windowsHide: true })).stdout.trim()
let previous = []
try { previous = JSON.parse(await readFile(`${out}/${stage}.json`, 'utf8')).results } catch (e) { if (e.code !== 'ENOENT') throw e }
// Append attempts: a corrected rerun never erases an original failure.
const results = [...previous]
let server, origin
if (stage === 'regression-ui') {
  const root = resolve('dist'), mime = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png' }
  server = createServer(async (req, res) => {
    const path = resolve(root, `.${new URL(req.url,'http://localhost').pathname}`)
    if (!path.startsWith(root)) { res.writeHead(403); res.end(); return }
    try { res.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream'); res.end(await readFile(path)) }
    catch { res.setHeader('Content-Type','text/html'); res.end(await readFile(resolve(root,'index.html'))) }
  })
  await new Promise(done=>server.listen(0,'127.0.0.1',done))
  origin = `http://127.0.0.1:${server.address().port}`
}
for (const name of selected.length ? selected : names[stage]) {
  const attempt = results.filter(row => row.name === name).length + 1
  const directory = `${out}/${stage}/${name}/attempt-${attempt}`
  await mkdir(directory, { recursive: true })
  const script = stage === 'checks'
    ? ['build', 'lint'].includes(name) ? null : name === 'amanecer' ? 'scripts/check-amanecer-tokens.mjs' : `scripts/check-${name}.mjs`
    : stage === 'regression-ui' ? `scripts/check-${name}-ui.mjs` : stage === 'regression' ? `scripts/check-${name}.mjs`
      : stage === 'r5' ? `scripts/check-r5-${name}.mjs`
        : `scripts/check-r6-${name}${stage === 'contract' ? '-contract' : stage === 'ui' ? '-ui' : ''}.mjs`
  let target, source, transformed, command, args
  if (script) {
    source = await readFile(script, 'utf8')
    // Relocate outputs only. Actual assertions and product sources stay intact.
    transformed = source.replaceAll(/docs\/qa\/r6-block-[0-8]/g, directory)
    if (stage === 'regression') transformed = transformed.replaceAll(/docs\/design\/verification\/[A-Za-z0-9-]+/g, directory).replaceAll(/docs\/qa\/r4-block-[0-9]+/g, directory)
    if (stage === 'regression') transformed = transformed.replace(/create role anon; create role authenticated;(?! create role service_role;)/, 'create role anon; create role authenticated; create role service_role;')
    target = `${scratch}/release-${stage}-${name}.mjs`
    await writeFile(target, transformed)
    command = process.execPath; args = [target]
  } else {
    // Invoke installed tools directly: avoids npm.cmd shell interpolation on Windows.
    command = process.execPath
    args = name === 'build' ? ['node_modules/typescript/bin/tsc', '-b'] : ['node_modules/oxlint/bin/oxlint']
  }
  const record = { name, stage, attempt, script, command: script ? `node ${script}` : `npm run ${name}`, base, started_at: new Date().toISOString(), environment: ['ui','regression-ui'].includes(stage) ? 'Compiled React app, synthetic Auth/REST/WebSocket fixtures; no real JWT/Realtime' : 'Local execution; PostgreSQL SQL Auth/Storage scaffolds where applicable', source_sha256: source ? createHash('sha256').update(source).digest('hex') : null, relocation: source !== transformed, result: 'PASS', directory }
  let stdout = '', stderr = ''
  try {
    const env = { ...process.env, PLANIT_SQL_OUTPUT: directory, PLANIT_UI_OUTPUT: directory, PLANIT_REALTIME_UI_OUTPUT: directory, ...(origin ? { PLANIT_UI_ORIGIN: origin } : {}), PLANIT_PLAYWRIGHT_PATH: process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs', PLANIT_R5_FULL_CATALOG: resolve(`${out}/catalog.json`) }
    const options = { windowsHide: true, timeout: 600000, maxBuffer: 8 * 1024 * 1024, env }
    const first = await run(command, args, options); stdout = first.stdout; stderr = first.stderr
    if (stage === 'checks' && name === 'build') {
      const vite = await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], options)
      stdout += vite.stdout; stderr += vite.stderr
    }
    // Never let a process exit hide an inner failed assertion artifact.
    async function inspect(path) {
      for (const entry of await readdir(path, { withFileTypes: true })) {
        const file = `${path}/${entry.name}`
        if (entry.isDirectory()) await inspect(file)
        else if (entry.name.endsWith('.json') && !['run.json'].includes(entry.name)) {
          let data
          try { data = JSON.parse(await readFile(file, 'utf8')) } catch { continue }
          if (data.result === 'FAIL' || data.failure || data.results?.some(row => row.result === 'FAIL')) throw new Error(`Failed inner evidence: ${file}`)
        }
      }
    }
    await inspect(directory)
  } catch (error) {
    record.result = 'FAIL'; record.error = { message: error.message, code: error.code ?? null }
    stdout += error.stdout ?? ''; stderr += error.stderr ?? ''
  } finally {
    if (target) await unlink(target)
    record.finished_at = new Date().toISOString()
    await writeFile(`${directory}/stdout.txt`, stdout); await writeFile(`${directory}/stderr.txt`, stderr)
    await writeFile(`${directory}/run.json`, JSON.stringify(record, null, 2) + '\n')
    results.push(record)
    const latest = Object.values(Object.fromEntries(results.map(row => [row.name, row])))
    await writeFile(`${out}/${stage}.json`, JSON.stringify({ base, branch: 'codex/r6-block-9', stage, results, result: latest.every(row => row.result === 'PASS') ? 'PASS' : 'FAIL' }, null, 2) + '\n')
    console.log(`${record.result}: ${stage}/${name} attempt ${attempt}`)
  }
}
const latest = Object.values(Object.fromEntries(results.map(row => [row.name, row])))
if (server) { server.closeAllConnections(); await new Promise(done=>server.close(done)) }
if (latest.some(row => row.result !== 'PASS')) process.exitCode = 1
