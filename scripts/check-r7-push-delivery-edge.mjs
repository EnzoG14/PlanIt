import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, writeFile } from 'node:fs/promises'

const deno = process.env.PLANIT_DENO_PATH ?? 'deno'
const run = promisify(execFile)
const root = 'supabase/functions/r7-push'
const commands = [
  ['check', '--config', `${root}/deno.json`, `${root}/index.ts`],
  ['test', '--allow-env', '--allow-read', '--config', `${root}/deno.json`, `${root}/handler_test.ts`],
]
const results = []
for (const args of commands) {
  try {
    const { stdout, stderr } = await run(deno, args, { windowsHide: true, timeout: 60000 })
    // eslint-disable-next-line no-control-regex -- Strip terminal ANSI colors from saved evidence.
    const output = (stdout + stderr).replace(/\x1b\[[0-9;]*m/g, '')
    results.push({ command: `deno ${args.join(' ')}`, result: 'PASS', output })
    process.stdout.write(output)
  } catch (error) {
    results.push({ command: `deno ${args.join(' ')}`, result: 'FAIL' })
    process.stderr.write(error.stdout ?? ''); process.stderr.write(error.stderr ?? ''); process.exitCode = 1
  }
}
await mkdir('docs/qa/r7-block-10', { recursive: true })
await writeFile('docs/qa/r7-block-10/edge-results.json', JSON.stringify({
  environment: 'Local Deno. Real Web Push encryption and VAPID signature, mocked network and RPC; no deployed Edge or physical push.',
  results, result: results.every(r => r.result === 'PASS') ? 'PASS' : 'FAIL',
}, null, 2) + '\n')
