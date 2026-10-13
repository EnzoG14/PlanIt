import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
await import('./check-r3-contrast.mjs')
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/design/verification/r3-block-7'
const defaults = ['foundation', 'auth', 'events', 'discovery', 'home-events', 'participations', 'my-events', 'edit-event', 'gallery', 'attendees', 'event-actions', 'rejoin', 'chat', 'profile', 'notifications', 'realtime', 'mapbox', 'my-events-ui', 'edit-event-ui', 'gallery-ui', 'attendees-ui', 'event-actions-ui', 'rejoin-ui', 'participations-ui', 'home-ui', 'chat-ui', 'realtime-ui', 'discovery-ui']
const requested = process.argv.slice(2)
const checks = requested.length ? requested : defaults
for (const name of checks) if (!defaults.includes(name)) throw new Error(`Unknown check: ${name}`)
await mkdir(out, { recursive: true })
let results = []
if (requested.length) {
  try { results = JSON.parse(await readFile(`${out}/results.json`, 'utf8')).results.filter(x => !checks.includes(x.check)) } catch (error) { if (error.code !== 'ENOENT') throw error }
}
for (const name of checks) {
  const target = `scripts/check-${name}.block-7.local.mjs`
  let source = await readFile(`scripts/check-${name}.mjs`, 'utf8')
  source = source.replaceAll(/docs\/design\/verification\/[A-Za-z0-9-]+/g, `${out}/${name}`)
  // Older fixture suites predate the shared origin environment variable.
  source = source.replaceAll(/http:\/\/127\.0\.0\.1:418\d/g, process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4189')
  if (name === 'my-events-ui') source = source.replace('[[375,812],[1280,900]]', '[[360,800],[375,812],[390,844],[768,1024],[1280,900]]')
  await mkdir(`${out}/${name}`, { recursive: true })
  await writeFile(target, source)
  const startedAt = new Date().toISOString()
  try {
    const { stdout, stderr } = await run(process.execPath, [target], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_UI_OUTPUT: `${out}/${name}` } })
    results.push({ check: name, result: 'PASS', startedAt, finishedAt: new Date().toISOString(), output: stdout, stderr })
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push({ check: name, result: 'FAIL', startedAt, finishedAt: new Date().toISOString(), output: error.stdout ?? '', stderr: error.stderr ?? '', message: error.message })
    console.error(`FAIL ${name}: ${error.stderr || error.message}`)
  } finally { await unlink(target) }
  await writeFile(`${out}/results.json`, JSON.stringify({ base: process.env.PLANIT_BASE_SHA ?? 'd9c0a69', environment: 'Local PostgreSQL/PGlite with Auth/Storage scaffolding; browser fixtures; no remote business writes or real JWT E2E', results }, null, 2))
}
if (results.some(x => x.result === 'FAIL')) process.exitCode = 1
