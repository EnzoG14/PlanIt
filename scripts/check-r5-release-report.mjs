import assert from 'node:assert/strict'
import { readFile, writeFile, readdir } from 'node:fs/promises'

const out = 'docs/qa/r5-block-10'
const read = async path => JSON.parse(await readFile(path, 'utf8'))
const names = ['participants', 'profile', 'edit-profile', 'private-profile', 'follows', 'requests', 'messages', 'blocks']
const source = await read(`${out}/source.json`)
assert.equal(source.criteria.length, 33)
assert.equal(new Set(source.criteria).size, 33)
const layers = {}
for (const layer of ['sql', 'ui']) {
  layers[layer] = []
  for (const name of [...names, 'request-notifications', 'message-notifications', ...(layer === 'sql' ? ['avatar'] : [])]) {
    const directory = `${out}/${layer}/${name}`
    const candidates = name === 'avatar' ? ['avatar-unit.json'] : layer === 'sql' ? ['sql-results.json'] : name === 'participants' ? ['participants-ui/ui-results.json', 'admin-ui/ui-results.json'] : ['edit-profile', 'request-notifications', 'message-notifications'].includes(name) ? ['results.json'] : ['ui-results.json']
    const evidence = []
    for (const file of candidates) {
      const data = await read(`${directory}/${file}`)
      const result = data.result ?? (data.results?.length > 0 && data.results.every(row => row.result === 'PASS') ? 'PASS' : 'FAIL')
      evidence.push({ path: `${layer}/${name}/${file}`, result, groups: data.results?.length ?? 0, environment: data.environment })
    }
    layers[layer].push({ suite: name, evidence, result: evidence.every(row => row.result === 'PASS') ? 'PASS' : 'FAIL' })
  }
}
const regressions = await read(`${out}/regressions/regressions/regressions.json`)
const http = []
for (const name of names) {
  for (const file of (await readdir(`${out}/http/${name}`)).filter(file => file.endsWith('.json') && file !== 'run.json')) {
    const data = await read(`${out}/http/${name}/${file}`)
    if (data.results) http.push({ suite: name, path: `http/${name}/${file}`, results: data.results })
  }
}
const criteria = source.criteria.map(literal => {
  const id = literal.match(/^RF-R5-(\d{2})\.CA-\d{2}/)[0]
  const suite = names[Number(literal.match(/^RF-R5-(\d{2})/)[1]) - 1]
  return { id, literal, suite, sql_local: layers.sql.find(row => row.suite === suite).result, ui_fixture: layers.ui.find(row => row.suite === suite).result, http_authenticated: 'NOT RUN', storage_realtime_real: 'NOT RUN', integral: 'NOT RUN', human_acceptance: suite === 'private-profile' ? 'Historical B5 approval retained; no new B10 approval' : 'Pending' }
})
const summary = { base: 'f66d70bcf4f0e28c02fe2aff88088bd238a65e1e', branch: 'codex/r5-block-10', generatedAt: new Date().toISOString(), decision: 'NO-GO', reason: 'Authenticated integrated JWT/Storage/Realtime and human acceptance pending; local/fixture PASS never grants release approval', layers, regressions: { result: regressions.result, suites: regressions.results.length, results: regressions.results.map(row => ({ suite: row.suite, result: row.result })) }, http, criteria }
await writeFile(`${out}/summary.json`, JSON.stringify(summary, null, 2) + '\n')
// Historical wrappers retain old base labels. Reconcile B10 process manifests
// with the newest completed assertion artifacts after targeted corrected reruns.
for (const layer of ['sql', 'ui']) {
  const path = `${out}/${layer}.json`
  const manifest = await read(path)
  for (const row of manifest.results) {
    const evidence = layers[layer].find(item => item.suite === row.suite)
    if (evidence && evidence.result !== row.result) {
      row.previous_attempt_result = row.result
      row.corrected_result_evidence = evidence.evidence.map(item => item.path)
      row.result = evidence.result
      delete row.error
    }
  }
  manifest.result = manifest.results.every(row => row.result === 'PASS') ? 'PASS' : 'FAIL'
  manifest.authoritative_summary = 'summary.json'
  await writeFile(path, JSON.stringify(manifest, null, 2) + '\n')
}
console.log(JSON.stringify({ decision: summary.decision, sql: layers.sql.map(row => [row.suite, row.result]), ui: layers.ui.map(row => [row.suite, row.result]), regressions: summary.regressions, criteria: criteria.length }))
if ([...layers.sql, ...layers.ui].some(row => row.result !== 'PASS') || regressions.result !== 'PASS') process.exitCode = 1
