import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Replay legacy assertions against R7. Add only the Storage scaffold now
// required by R7 migrations; never rewrite the assertions or product SQL.
const run = promisify(execFile), out = 'docs/qa/r7-block-11/regressions'
const original = (await readFile('scripts/check-r5-social.mjs', 'utf8')).replace(/\r\n/g, '\n')
const marker = '  const files = (await readdir'
assert.equal(original.split(marker).length, 2)
const scaffold = "  await admin.query(\"alter table storage.objects add unique(bucket_id,name); create function storage.allow_only_operation(text) returns boolean language sql stable as $$ select coalesce(current_setting('test.storage_operation',true)=$1,false) $$;\")\n"
const adapted = original.replace(marker, () => scaffold + marker)
const suites = process.argv.includes('--ui')
  ? ['r7-stories-ui','r7-calendar-ui','r7-share-ui','r7-push-subscriptions-ui']
  : ['r5-social','r6-compare','r6-event-full']
const results = []
for (const name of suites) {
  const directory = `${out}/${name}`
  await mkdir(directory, { recursive: true })
  const source = (await readFile(`scripts/check-${name}.mjs`, 'utf8')).replace(/\r\n/g, '\n')
  let code = name === 'r5-social' ? adapted : source.replace("await readFile('scripts/check-r5-social.mjs', 'utf8')", () => JSON.stringify(adapted))
  code = code.replaceAll(/docs\/qa\/r[567]-block-\d+(?:\/ui|\/sql|\/visual)?/g, directory)
  const temp = `scripts/.b11-${name}.local.mjs`
  await writeFile(temp, code)
  let result = 'PASS', log = ''
  try {
    const r = await run(process.execPath, [temp], { windowsHide: true, timeout: 360000, maxBuffer: 8*1024*1024,
      env: { ...process.env, PLANIT_SQL_OUTPUT: directory, PLANIT_UI_OUTPUT: directory } })
    log = r.stdout + r.stderr
  } catch (error) { result = 'FAIL'; log = `${error.stdout ?? ''}${error.stderr ?? ''}\n${error.message}` }
  finally { await unlink(temp) }
  await writeFile(`${directory}/run.txt`, log)
  results.push({ suite: name, result, source_sha256: createHash('sha256').update(source).digest('hex'), adapter: name.includes('-ui') ? 'output relocation only' : 'R7 Storage unique and operation-aware helper scaffold only; original assertions', directory })
  await writeFile(`${out}/${process.argv.includes('--ui') ? 'ui' : 'sql'}.json`, JSON.stringify({ results }, null, 2) + '\n')
  console.log(result, name)
}
if (results.some(r => r.result !== 'PASS')) process.exitCode = 1
