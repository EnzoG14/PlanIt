import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'

// Local QA only: no live/signup flags, remote fixture provisioning or SQL push.
const output = resolve(process.env.PLANIT_R4_OUTPUT ?? 'docs/qa/r4-block-9')
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const defaults = ['build', 'lint', 'check:foundation', 'check:amanecer', 'check:auth',
  'check:events', 'check:discovery', 'check:home-events', 'check:mapbox',
  'check:search', 'check:interests', 'check:suggestions', 'check:hidden-access',
  'check:event-links', 'check:invite', 'check:event-access', 'check:participations',
  'check:my-events', 'check:edit-event', 'check:gallery', 'check:attendees',
  'check:event-actions', 'check:rejoin', 'check:profile', 'check:notifications',
  'check:realtime', 'chat', 'check:home:ui', 'check:discovery:ui', 'check:search:ui',
  'check:filters:ui', 'check:interests:ui', 'check:suggestions:ui',
  'check:event-links:ui', 'check:invite:ui', 'check:event-access:ui',
  'check:events:ui', 'check:edit-event:ui', 'check:event-actions:ui',
  'check:attendees:ui', 'check:gallery:ui', 'check:profile:ui',
  'check:participations:ui', 'check:rejoin:ui', 'check:my-events:ui',
  'check:notifications:ui', 'check:realtime:ui', 'check:amanecer:auth:ui', 'chat-ui', 'check:r4:performance', 'check:r4:ui', 'check:r4:boundaries']
const checks = process.argv.slice(2).length ? process.argv.slice(2) : defaults
for (const check of checks) if (!defaults.includes(check)) throw new Error(`Unsupported local check: ${check}`)
await mkdir(output, { recursive: true })
const npm = process.env.PLANIT_NPM_CLI ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
const env = { ...process.env, PLANIT_UI_ORIGIN: process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4199',
  PLANIT_UI_NO_PROXY: '1', PLANIT_PLAYWRIGHT_PATH: process.env.PLANIT_PLAYWRIGHT_PATH ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs') }
let server
async function execute(args, childEnv) {
  return new Promise(resolveResult => {
    const startedAt = new Date().toISOString(), start = performance.now()
    const child = spawn(process.execPath, args, { env: childEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = '', stderr = '', timedOut = false
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    const timeout = setTimeout(() => { timedOut = true; child.kill() }, 360000)
    child.on('error', error => { stderr += error.message })
    child.on('close', (exitCode, signal) => { clearTimeout(timeout); resolveResult({
      startedAt, finishedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - start),
      exitCode, signal, timedOut, result: exitCode === 0 && !timedOut ? 'PASS' : 'FAIL', stdout, stderr }) })
  })
}
let results = [], attempts = []
try {
  const previous = JSON.parse(await readFile(`${output}/commands.json`, 'utf8'))
  results = previous.results.filter(r => !checks.includes(r.check))
  attempts = previous.attempts ?? previous.results
} catch (error) { if (error.code !== 'ENOENT') throw error }
const base = (await execute(['-e', "require('child_process').execFileSync('git',['rev-parse','HEAD'],{stdio:'inherit'})"], env)).stdout.trim()
const lockSha256 = createHash('sha256').update(await readFile('package-lock.json')).digest('hex')
try {
  for (const check of checks) {
    if (check.endsWith(':ui') || check === 'chat-ui') {
      if (!server) {
        server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', new URL(env.PLANIT_UI_ORIGIN).port, '--strictPort'], { env, windowsHide: true, stdio: 'ignore' })
        let ready = false
        for (let i = 0; i < 50; i++) {
          try { ready = (await fetch(env.PLANIT_UI_ORIGIN)).ok } catch { /* Wait for preview startup. */ }
          if (ready) break
          await new Promise(r => setTimeout(r, 200))
        }
        if (!ready) throw new Error('Production preview unavailable')
      }
    }
    const label = check.replaceAll(':', '-'), destination = `${output}/${label}`
    await mkdir(destination, { recursive: true })
    const childEnv = { ...env, PLANIT_UI_OUTPUT: destination, PLANIT_SQL_OUTPUT: destination,
      PLANIT_CHAT_UI_OUTPUT: destination, PLANIT_REALTIME_UI_OUTPUT: destination }
    const args = manifest.scripts[check] ? [npm, 'run', check] : [`scripts/check-${check}.mjs`]
    console.log(`RUN ${check}`)
    const result = await execute(args, childEnv)
    // Exact stdout/stderr remain in commands.json; trim display logs for Git whitespace checks.
    await writeFile(`${destination}/command.txt`, (result.stdout + '\n' + result.stderr).replace(/[\t ]+$/gm, '').trimEnd() + '\n')
    results.push({ check, command: manifest.scripts[check] ? `npm run ${check}` : `node ${args[0]}`, ...result })
    attempts.push(results.at(-1))
    await writeFile(`${output}/commands.json`, JSON.stringify({ base, lockSha256, environment: 'Local SQL/PGlite and Edge browser fixtures; NOT real HTTP/JWT/Storage/Realtime', results, attempts }, null, 2) + '\n')
    console.log(`${result.result} ${check} (${result.durationMs}ms)`)
  }
} finally { server?.kill() }
if (results.some(r => r.result !== 'PASS')) process.exitCode = 1
