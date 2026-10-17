import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const out = 'docs/qa/r7-block-11'
const expected = JSON.parse(await readFile('docs/qa/r7-block-0/traceability.json', 'utf8')).criteria
const current = JSON.parse(await readFile(`${out}/criteria.json`, 'utf8')).criteria
const requirements = await readFile('docs/requirements/RELEASE_7_REQUIREMENTS.md', 'utf8')
const acceptance = await readFile('docs/qa/RELEASE_7_ACCEPTANCE.md', 'utf8')
const results = []
for (const criterion of current) {
  const source = expected.find(c => c.id === criterion.ca)
  assert.ok(source)
  assert.equal(source.text, criterion.text)
  assert.equal(source.sha256_utf8, createHash('sha256').update(criterion.text).digest('hex'))
  assert.ok(requirements.includes(criterion.text) && acceptance.includes(criterion.text))
  assert.ok(['PASS','FAIL','NOT RUN','BLOCKED'].includes(criterion.status))
  assert.ok(criterion.executed && criterion.limitation)
  results.push({ test: `${criterion.ca}: literal text/hash, result and executed/pending layers`, result: 'PASS' })
}
assert.equal(current.length, 29)
assert.equal(new Set(current.map(c => c.ca)).size, 29)
const prerequisites = JSON.parse(await readFile(`${out}/prerequisites.json`, 'utf8'))
for (const pr of prerequisites.pull_requests) {
  assert.equal(pr.merged, true)
  execFileSync('git', ['merge-base','--is-ancestor',pr.merge_commit_sha,'HEAD'], { windowsHide: true })
}
results.push({ test: '12 producer/corrective PRs merged and ancestors of B11 base', result: 'PASS' })
const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql'))
assert.equal(files.length, 47)
const detail = await readFile('src/pages/EventDetailPage.tsx', 'utf8')
for (const component of ['EventStoriesEntry','EventCalendarAction','EventShareAction']) assert.ok(detail.includes(`<${component} `))
assert.ok(detail.includes('onSummary={setParticipation}'))
const profile = await readFile('src/pages/ProfilePage.tsx', 'utf8')
assert.equal(profile.split('<PushSettings ').length - 1, 1)
execFileSync('git', ['check-ignore', '.env.local'], { windowsHide: true })
assert.equal(execFileSync('git', ['ls-files', '.env.local'], { encoding: 'utf8', windowsHide: true }).trim(), '')
results.push({ test: '47 migration files, three entrypoints integrated, one PushSettings mount, env ignored/untracked', result: 'PASS' })
await writeFile(`${out}/report-checks.json`, JSON.stringify({ environment: 'Documentary/static checks only, not functional acceptance', results }, null, 2) + '\n')
console.log(`${results.length}/${results.length} PASS documentary/static; CA acceptance remains independent`)
