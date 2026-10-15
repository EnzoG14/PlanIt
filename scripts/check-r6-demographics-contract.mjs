import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { ageKeys, sexKeys, parseEventDemographics } from '../src/features/analytics/demographics.ts'

const base = { event_id: 'fixture', as_of: '2026-10-15T12:30:00', age_as_of: '2026-10-15',
  age: { state: 'suppressed', groups: [] }, sex: { state: 'suppressed', groups: [] } }
const available = keys => ({ state: 'available', groups: keys.map((key, i) => ({ key, count: i === 0 ? 10 : 0 })) })
const valid = { ...base, age: available(ageKeys), sex: available(sexKeys) }
assert.deepEqual(parseEventDemographics(valid), valid)
assert.deepEqual(parseEventDemographics(base), base)
assert.equal(parseEventDemographics({ ...base, age: {state:'empty',groups:[]}, sex:{state:'empty',groups:[]} }).age.state, 'empty')
for (const change of [
  v => { v.age.groups[0].count = 4 },
  v => { v.age.groups[0].count = -1 },
  v => { v.age.groups[0].count = Infinity },
  v => { v.age.groups[0].count = 1.5 },
  v => { v.age.groups[0].count = 5 },
  v => { v.age.groups.reverse() },
  v => { v.age.groups.pop() },
  v => { v.age.groups[0].user_id = 'PRIVATE' },
  v => { v.birth_date = 'PRIVATE' },
  v => { v.age.state = 'suppressed' },
  v => { v.sex = { state:'empty',groups:[] } },
  v => { v.age_as_of = '2026-10-14' },
  v => { v.as_of += 'Z' },
]) {
  const candidate = structuredClone(valid); change(candidate)
  assert.throws(() => parseEventDemographics(candidate))
}
const output = 'docs/qa/r6-block-3'
await mkdir(output, { recursive: true })
await writeFile(`${output}/contract.json`, JSON.stringify({ result:'PASS', valid:3, rejected:13, layer:'DTO only; not SQL/JWT' },null,2)+'\n')
console.log('PASS: 3 valid DTOs, 13 malformed/leaking/inconsistent DTOs rejected')
