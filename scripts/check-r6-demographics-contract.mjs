import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { ageKeys, sexKeys, parseEventDemographics } from '../src/features/analytics/demographics.ts'

const base = { event_id: 'fixture', as_of: '2026-10-15T12:30:00', age_as_of: '2026-10-15',
  age: { state: 'empty', groups: [] }, sex: { state: 'empty', groups: [] } }
const available = keys => ({ state: 'available', groups: keys.map((key, i) => ({ key, count: i === 0 ? 10 : 0 })) })
const valid = { ...base, age: available(ageKeys), sex: available(sexKeys) }
assert.deepEqual(parseEventDemographics(valid), valid)
assert.deepEqual(parseEventDemographics(base), base)
assert.equal(parseEventDemographics({ ...base, age: {state:'empty',groups:[]}, sex:{state:'empty',groups:[]} }).age.state, 'empty')
for (const count of [1, 4, 5]) {
  const small = structuredClone(valid)
  small.age.groups[0].count = count; small.sex.groups[0].count = count
  assert.deepEqual(parseEventDemographics(small), small)
}
const mixed = structuredClone(valid)
mixed.age.groups[0].count = 9; mixed.age.groups.at(-1).count = 1
mixed.sex.groups[0].count = 4; mixed.sex.groups.at(-1).count = 6
assert.deepEqual(parseEventDemographics(mixed), mixed)
for (const change of [
  v => { v.age.groups[0].count = 4 },
  v => { v.age.groups[0].count = -1 },
  v => { v.age.groups[0].count = Infinity },
  v => { v.age.groups[0].count = 1.5 },
  v => { v.age.groups[0].count = 5 },
  v => { v.age.groups.forEach(g => { g.count = 0 }) },
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
const output = 'docs/qa/statistics-demographics/contract-demographics'
await mkdir(output, { recursive: true })
await writeFile(`${output}/contract.json`, JSON.stringify({ result:'PASS', valid:7, rejected:14, layer:'DTO only; not SQL/JWT' },null,2)+'\n')
console.log('PASS: 7 valid DTOs including 1/4/5/mixed, 14 malformed/leaking/inconsistent DTOs rejected')
