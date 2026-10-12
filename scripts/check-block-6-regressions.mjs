import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)
const requested = process.argv.slice(2)
const checks = requested.length ? requested : ['events', 'edit-event', 'participations', 'attendees', 'event-actions', 'chat', 'participations-ui', 'attendees-ui', 'event-actions-ui', 'chat-ui']
let results = []
if (requested.length) {
  try { results = JSON.parse(await readFile('docs/design/verification/r3-block-6/regression-results.json', 'utf8')).results.filter(x => !requested.includes(x.check)) } catch { /* First partial run. */ }
}
for (const name of checks) {
  const target = `scripts/check-${name}.block-6.local.mjs`
  // Keep historical evidence byte-for-byte intact. Temporary copies remain in
  // scripts/ so the existing relative imports resolve, then are removed.
  let source = await readFile(`scripts/check-${name}.mjs`, 'utf8')
  source = source.replaceAll(/docs\/design\/verification\/[A-Za-z0-9-]+/g, `docs/design/verification/r3-block-6/regression-${name}`)
  source = source.replaceAll('http://127.0.0.1:4186', 'http://127.0.0.1:4188')
  await mkdir(`docs/design/verification/r3-block-6/regression-${name}`, { recursive: true })
  await writeFile(target, source)
  try {
    const { stdout, stderr } = await run(process.execPath, [target], { windowsHide: true, timeout: 300000, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, PLANIT_UI_ORIGIN: process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4188', PLANIT_PLAYWRIGHT_PATH: process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' } })
    results.push({ check: name, result: 'PASS', output: stdout, stderr }); console.log(`PASS regression ${name}`)
  } catch (error) {
    results.push({ check: name, result: 'FAIL', output: error.stdout, stderr: error.stderr, message: error.message }); console.error(`FAIL regression ${name}: ${error.stderr || error.message}`)
  } finally { await unlink(target) }
}
await writeFile('docs/design/verification/r3-block-6/regression-results.json', JSON.stringify({ environment: 'Local PostgreSQL/scaffolding, validation scripts and browser fixtures; no remote HTTP/JWT', results }, null, 2))
if (results.some(x => x.result === 'FAIL')) process.exitCode = 1
