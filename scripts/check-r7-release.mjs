import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Local suites only. Preserve the producer evidence rather than overwriting it.
const run = promisify(execFile), out = 'docs/qa/r7-block-11'
await mkdir(out + '/suites', { recursive: true })
const snapshot = new Map()
async function files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (path.startsWith(out)) continue
    if (entry.isDirectory()) await files(path)
    else if (/\.(json|txt|ics)$/.test(path)) snapshot.set(path, await readFile(path))
  }
}
await files('docs/qa')
const suites = process.argv.slice(2)
if (!suites.length) throw new Error('Supply explicit local script names; no HTTP/live suites are selected automatically.')
const results = []
const attempt = Date.now()
const base = (await run('git', ['rev-parse', 'HEAD'], { windowsHide: true })).stdout.trim()
for (const name of suites) {
  if (!/^check-[a-z0-9-]+$/.test(name) || /-(?:http|live|google)$/.test(name)) throw new Error('Only reviewed local suites are allowed')
  let result = 'PASS', output = ''
  try {
    const r = await run(process.execPath, [`scripts/${name}.mjs`], { windowsHide: true, timeout: 240000, maxBuffer: 8 * 1024 * 1024 })
    output = r.stdout + r.stderr
  } catch (error) { result = 'FAIL'; output = `${error.stdout ?? ''}${error.stderr ?? ''}\n${error.message}` }
  await writeFile(`${out}/suites/${name}-${attempt}.txt`, output)
  const evidence = []
  for (const [path, original] of snapshot) {
    const current = await readFile(path)
    if (!current.equals(original)) {
      if (/\.(json|ics)$/.test(path)) {
        const target = `${out}/suites/${name}/${path.slice('docs/qa/'.length)}`
        await mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true })
        await writeFile(target, current); evidence.push(target)
      }
      await writeFile(path, original)
    }
  }
  results.push({ command: `node scripts/${name}.mjs`, result, evidence, log: `suites/${name}-${attempt}.txt` })
  await writeFile(`${out}/run-${attempt}.json`, JSON.stringify({ base, branch: 'codex/r7-block-11', results }, null, 2) + '\n')
  console.log(result, name)
}
const migrations = []
for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) {
  migrations.push({ file, sha256: createHash('sha256').update((await readFile(`supabase/migrations/${file}`, 'utf8')).replace(/\r\n/g, '\n')).digest('hex') })
}
await writeFile(`${out}/results-${attempt}.json`, JSON.stringify({ base, branch: 'codex/r7-block-11', date: new Date().toISOString(), environment: 'Local; SQL Auth/Storage scaffolds and handler mocks are not HTTP/JWT or physical delivery', node: process.version, migrations, results }, null, 2) + '\n')
if (results.some(r => r.result !== 'PASS')) process.exitCode = 1
