import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend old REST fixtures with B6 reads; keep historical assertions unchanged.
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r5-block-6/regressions'
await mkdir('.r5-check.local', { recursive: true }); await mkdir(out, { recursive: true })
const b3 = await readFile('scripts/check-r5-profile-ui.mjs', 'utf8')
const marker = "      if(path==='/rest/v1/rpc/get_social_profile') {"
const adapted = b3.replace(marker, `
      if(path==='/rest/v1/rpc/get_social_relationship') return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility:minimal?'private':'public',follow:null});
      if(path==='/rest/v1/rpc/get_social_counts') return reply({followers:0,following:0});
` + marker)
const b3Path = '.r5-check.local/profile-b6-fixture.mjs'
await writeFile(b3Path, adapted)
const results = []
const requested = process.argv.slice(2)
const suites = requested.length ? requested : ['b2', 'b3', 'b4', 'b5']
if (suites.some(suite => !['b2', 'b3', 'b4', 'b5'].includes(suite))) throw new Error('Unknown regression suite')
if (requested.length) {
  const previous = JSON.parse(await readFile(`${out}/ui-regressions.json`, 'utf8'))
  results.push(...previous.results.filter(row => !suites.includes(row.suite)))
}
try {
  for (const suite of suites) {
    let file = b3Path, source = b3
    if (suite === 'b2') {
      source = await readFile('scripts/check-r5-profile-regression-ui.mjs', 'utf8')
      const original = "const source=await readFile('scripts/check-r5-participants-ui.mjs','utf8')"
      const read = `${original}.then(source=>source.replace("        if (path === '/rest/v1/rpc/get_social_profile') {", "        if(path==='/rest/v1/rpc/get_social_relationship') return reply(blocked?{unavailable:true,blocked_by_me:false}:{visibility:'private',follow:null});\\n        if (path === '/rest/v1/rpc/get_social_profile') {"))`
      // A completed participants result is retained when repairing only admin.
      if (requested.includes('b2')) source = source.replace("[['participants-ui',target],['admin-ui','scripts/check-r5-admin-ui.mjs']]", "[['admin-ui','scripts/check-r5-admin-ui.mjs']]")
      file = '.r5-check.local/b2-regression.mjs'; await writeFile(file, source.replace(original, read))
    } else if (suite === 'b4') file = 'scripts/check-r5-edit-profile-ui.mjs'
    else if (suite === 'b5') {
      source = await readFile('scripts/check-r5-private-profile-ui.mjs', 'utf8')
      file = '.r5-check.local/b5-regression.mjs'; await writeFile(file, source.replace("readFile('scripts/check-r5-profile-ui.mjs'", `readFile('${b3Path}'`))
    }
    await mkdir(`${out}/${suite}`, { recursive: true })
    try {
      const { stdout, stderr } = await promisify(execFile)(process.execPath, [file], { windowsHide: true, timeout: 600000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_UI_NO_PROXY: '1', PLANIT_UI_OUTPUT: `${out}/${suite}` } })
      results.push({ suite, result: 'PASS', adaptation: 'Added B6 RPC read fixtures only; historical expectations preserved', source_sha256: createHash('sha256').update(source).digest('hex'), stdout, stderr }); console.log('PASS UI ' + suite)
    } catch (error) { results.push({ suite, result: 'FAIL', stdout: error.stdout, stderr: error.stderr }); console.log('FAIL UI ' + suite) }
    if (file !== b3Path && file.startsWith('.r5-check.local/')) await unlink(file)
  }
} finally { await unlink(b3Path) }
await writeFile(`${out}/ui-regressions.json`, JSON.stringify({ results, result: results.every(row => row.result === 'PASS') ? 'PASS' : 'FAIL' }, null, 2))
if (results.some(row => row.result === 'FAIL')) process.exitCode = 1
