// Audit documentation only. No network, database queries, writes outside this folder, or secrets.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const dir = 'docs/qa/r7-block-0'
const read = path => readFile(path, 'utf8')
const hash = text => createHash('sha256').update(text).digest('hex')
const source = JSON.parse(await read(`${dir}/source.json`))
const requirements = await read('docs/requirements/RELEASE_7_REQUIREMENTS.md')
const acceptance = await read('docs/qa/RELEASE_7_ACCEPTANCE.md')
const catalog = JSON.parse(await read(`${dir}/catalog.json`)).rows[0].metadata
const checks = []
function check(name, condition) { checks.push({ name, result: condition ? 'PASS' : 'FAIL' }); if (!condition) process.exitCode = 1 }
const local = [...requirements.matchAll(/- \*\*(RF-R7-\d{2}\.CA-\d{2}):\*\* (.+)/g)]
const official = source.paragraphs.flatMap(p => {
  const m = p.text.match(/^(RF-R7-\d{2}\.CA-\d{2})\. (.+)$/)
  return m ? [{ id: m[1], text: m[2], tab_id: p.tabId, start_index: p.startIndex, end_index: p.endIndex }] : []
})
check('Exactly 29 unique official CA and 29 local CA', official.length === 29 && new Set(official.map(c => c.id)).size === 29 && local.length === 29)
const blocks = { '01': ['B1','B2','B3','B11'], '02': ['B1','B4','B5','B11'], '03': ['B4','B5','B11'], '04': ['B1','B4','B6','B11'], '05': ['B7','B11'], '06': ['B8','B11'], '07': ['B9','B10','B11'] }
const cases = { '01': ['SQL-01','SQL-02','SQL-03','SQL-04','UI-01'], '02': ['SQL-04','SQL-05','UI-02'], '03': ['SQL-06','UI-02','UI-03'], '04': ['SQL-07','SQL-08','SQL-09'], '05': ['UI-04'], '06': ['UI-05'], '07': ['SQL-10','SQL-11','UI-06','PUSH-01','PUSH-02','PUSH-03','PUSH-04','PUSH-05','PUSH-06'] }
const trace = official.map(c => {
  const match = local.find(m => m[1] === c.id)
  const rf = c.id.match(/RF-R7-(\d{2})/)[1]
  const equal = match?.[2] === c.text
  check(`${c.id} literal source and acceptance match`, equal && acceptance.includes(`| ${c.id} | ${c.text} |`))
  return { ...c, sha256_utf8: hash(c.text), local_sha256_utf8: match ? hash(match[2]) : null, literal_match: equal, blocks: blocks[rf], tests: cases[rf].map(id => `R7-TC-${id}`), layers: { sql: 'NOT RUN', http_jwt: 'NOT RUN', storage: 'NOT RUN', ui: 'NOT RUN', sw_push: 'NOT RUN' }, acceptance: 'NOT RUN' }
})
const descriptions = [...requirements.matchAll(/\*\*Descripción:\*\* (.+)/g)].map(m => m[1])
check('Seven RF descriptions match official current RF tab literally', descriptions.length === 7 && descriptions.every(t => source.paragraphs.some(p => p.tabId === 't.6cfgj0znk3o' && p.text === t)))
const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
check('37 Git migrations exactly match fresh remote versions', files.length === 37 && JSON.stringify(files.map(f => f.split('_')[0])) === JSON.stringify(catalog.migrations.map(m => m.version)))
check('16 public tables all have RLS; R7 tables absent', catalog.tables.filter(t => t.schema === 'public').length === 16 && catalog.tables.filter(t => t.schema === 'public').every(t => t.rls) && !catalog.tables.some(t => ['stories','message_attachments','push_subscriptions','push_jobs'].includes(t.name)))
check('Current body is NOT NULL and text-only constraint exists', catalog.columns.some(c => c.table === 'messages' && c.column === 'body' && c.nullable === 'NO') && catalog.constraints.some(c => c.table === 'messages' && /body/.test(c.definition)))
check('Storage uploader OR policy confirmed', catalog.policies.some(p => p.policyname === 'event_media_select_visible' && / OR /.test(p.qual)))
check('Only messages and notifications in Realtime', JSON.stringify(catalog.publications.map(p => p.tablename).sort()) === JSON.stringify(['messages','notifications']))
const vite = await read('vite.config.ts')
check('PWA baseline is generateSW default, autoUpdate, no runtime caching', !vite.includes('injectManifest') && vite.includes("registerType: 'autoUpdate'") && vite.includes('runtimeCaching: []'))
const migrationHashes = Object.fromEntries(await Promise.all(files.map(async f => [f, hash(await readFile(`supabase/migrations/${f}`))])))
await writeFile(`${dir}/traceability.json`, JSON.stringify({ source_document: source.documentId, source_revision: source.revisionId, hash_rule: 'SHA-256 UTF-8 of CA text only, no normalization, excludes ID and paragraph newline', criteria: trace }, null, 2) + '\n')
await writeFile(`${dir}/audit.json`, JSON.stringify({ base: execFileSync('git', ['rev-parse','origin/main'], {encoding:'utf8'}).trim(), branch: execFileSync('git', ['branch','--show-current'], {encoding:'utf8'}).trim(), catalog_captured_at: catalog.audited_at, server_version: catalog.server_version, migration_sha256: migrationHashes, checks, result: checks.every(c => c.result === 'PASS') ? 'PASS' : 'FAIL', scope: 'Documentary audit only; no functional CA acceptance or DDL executed' }, null, 2) + '\n')
console.log(`${checks.filter(c => c.result === 'PASS').length}/${checks.length} documentary checks PASS; 29 CA remain NOT RUN`)
for (const c of checks.filter(c => c.result === 'FAIL')) console.error(c.name)
