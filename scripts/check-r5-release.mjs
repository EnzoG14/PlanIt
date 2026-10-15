import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'

// Existing assertions run unchanged. Every suite gets a new evidence directory;
// wrapper metadata overrides historical base labels only in this manifest.
const run = promisify(execFile)
const out = 'docs/qa/r5-block-10'
const sql = ['participants', 'profile', 'edit-profile', 'private-profile', 'follows', 'requests', 'messages', 'blocks', 'request-notifications', 'message-notifications', 'avatar']
const ui = ['participants', 'profile', 'edit-profile', 'private-profile', 'follows', 'requests', 'messages', 'blocks', 'request-notifications', 'message-notifications']
const stage = process.argv[2]
if (!['sql', 'ui', 'http', 'regressions'].includes(stage)) throw new Error('Choose sql, ui, http or regressions')
const available = stage === 'sql' ? sql : stage === 'ui' ? ui : stage === 'http' ? sql.filter(name => !['request-notifications', 'message-notifications', 'avatar'].includes(name)) : ['regressions']
const selected = process.argv.slice(3)
if (selected.some(name => !available.includes(name))) throw new Error('Unknown suite')
const suites = selected.length ? selected : available
const base = (await run('git', ['rev-parse', 'HEAD'], { windowsHide: true })).stdout.trim()
let results = []
if (selected.length) {
  try { results = JSON.parse(await readFile(`${out}/${stage}.json`, 'utf8')).results.filter(row => !selected.includes(row.suite)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
}
let server, origin
if (stage === 'ui') {
  const root = resolve('dist')
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
  server = createServer(async (request, response) => {
    const file = resolve(root, `.${new URL(request.url, 'http://localhost').pathname}`)
    if (!file.startsWith(root + '/') && !file.startsWith(root + '\\') && file !== root) { response.writeHead(403); response.end(); return }
    try { response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream'); response.end(await readFile(file)) }
    catch { response.setHeader('Content-Type', 'text/html'); response.end(await readFile(resolve(root, 'index.html'))) }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  origin = `http://127.0.0.1:${server.address().port}`
}
await mkdir(out, { recursive: true })
for (const suite of suites) {
  const script = stage === 'ui' && suite === 'participants' ? 'scripts/check-r5-profile-regression-ui.mjs' : `scripts/check-r5-${suite}${stage === 'ui' ? '-ui' : stage === 'http' ? '-http' : ''}.mjs`
  const directory = `${out}/${stage}/${suite}`
  await mkdir(directory, { recursive: true })
  const source = await readFile(script, 'utf8')
  const startedAt = new Date().toISOString()
  let result = 'PASS', stdout = '', stderr = '', error
  try {
    ;({ stdout, stderr } = await run(process.execPath, [script], {
      windowsHide: true, timeout: 600000, maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, ...(origin ? { PLANIT_UI_ORIGIN: origin } : {}), PLANIT_SQL_OUTPUT: directory, PLANIT_UI_OUTPUT: directory, PLANIT_HTTP_OUTPUT: directory },
    }))
  } catch (failure) {
    result = 'FAIL'; stdout = failure.stdout ?? ''; stderr = failure.stderr ?? ''; error = failure.message
  }
  await writeFile(`${directory}/stdout.txt`, stdout)
  await writeFile(`${directory}/stderr.txt`, stderr)
  results.push({ suite, script, source_sha256: createHash('sha256').update(source).digest('hex'), result, startedAt, finishedAt: new Date().toISOString(), error })
  await writeFile(`${directory}/run.json`, JSON.stringify({ base, branch: 'codex/r5-block-10', ...results.at(-1) }, null, 2) + '\n')
  await writeFile(`${out}/${stage}.json`, JSON.stringify({ base, branch: 'codex/r5-block-10', stage, migrations: (await readdir('supabase/migrations')).filter(name => name.endsWith('.sql')).length, results, result: results.every(row => row.result === 'PASS') ? 'PASS' : 'FAIL' }, null, 2) + '\n')
  console.log(`${result}: ${stage}/${suite}`)
}
if (server) await new Promise(done => server.close(done))
if (results.some(row => row.result === 'FAIL')) process.exitCode = 1
