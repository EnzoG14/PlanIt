import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import ts from 'typescript'

async function module(path, replacements = []) {
  let source = await readFile(path, 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
}
const compare = await module('src/features/analytics/compare.ts')
const { parseEventsComparison, normalizeSelection, selectionProblem } = compare
const event = (id, patch = {}) => ({ event_id: id, title: id, event_state: 'open', capacity: 10, confirmed_count: 4, available_spots: 6, occupancy_percent: 40, capacity_usable: true, ...patch })
const dto = { as_of: '2026-10-15T10:00:00', events: [event('a'), event('b', { capacity: 20, confirmed_count: 15, available_spots: 5, occupancy_percent: 75 })] }
assert.deepEqual(parseEventsComparison(dto, ['a', 'b']), dto)
// Legacy capacity: N/D, never a percentage.
const legacy = { ...dto, events: [event('a', { capacity: 0, confirmed_count: 2, available_spots: 0, occupancy_percent: null, capacity_usable: false }), dto.events[1]] }
assert.equal(parseEventsComparison(legacy, ['a', 'b']).events[0].occupancy_percent, null)
for (const bad of [
  { ...dto, events: [dto.events[1], dto.events[0]] },                                  // order differs from request
  { ...dto, events: [dto.events[0]] },                                                 // missing event
  { ...dto, events: [dto.events[0], event('zzz')] },                                   // foreign id echoed back
  { ...dto, as_of: dto.as_of + 'Z' },
  { ...dto, events: [event('a', { occupancy_percent: 41 }), dto.events[1]] },
  { ...dto, events: [event('a', { available_spots: 7 }), dto.events[1]] },
  { ...dto, events: [event('a', { occupancy_percent: 10, capacity: 0, capacity_usable: false }), dto.events[1]] },
  { ...dto, events: [event('a', { capacity_usable: false }), dto.events[1]] },
  { ...dto, events: [event('a', { event_state: 'draft' }), dto.events[1]] },
  { ...dto, events: [event('a', { occupancy_percent: NaN }), dto.events[1]] },
  null, 'x',
]) assert.throws(() => parseEventsComparison(bad, ['a', 'b']))
assert.deepEqual(normalizeSelection(['b', 'a', 'b', 'c', 'a']), ['b', 'a', 'c'])
assert.match(selectionProblem([]), /al menos 2/); assert.match(selectionProblem(['a']), /al menos 2/)
assert.equal(selectionProblem(['a', 'b']), null)
assert.equal(selectionProblem(Array.from({ length: 10 }, (_, i) => String(i))), null)
assert.match(selectionProblem(Array.from({ length: 11 }, (_, i) => String(i))), /hasta 10/)

globalThis.__compareClient = { rpc(name, args) {
  assert.equal(name, 'get_my_events_occupancy'); assert.deepEqual(args, { p_event_ids: ['a', 'b'] })
  return { abortSignal(signal) { assert.equal(signal, controller.signal); return Promise.resolve(response) } }
} }
const controller = new AbortController()
let response = { data: dto, error: null }
globalThis.__parseCompare = parseEventsComparison
const { loadMyEventsComparison } = await module('src/features/analytics/api.ts', [
  ["import { supabase } from '../../lib/supabase'", 'const supabase = globalThis.__compareClient'],
  ["import { parseEventOccupancy, type EventOccupancy } from './types'", 'const parseEventOccupancy = null'],
  ["import { parseEventDemographics } from './demographics'", 'const parseEventDemographics = null'],
  ["import { parseParticipationSeries, type Period } from './periods'", 'const parseParticipationSeries = null'],
  ["import { parseAttendeeExport } from './csv'", 'const parseAttendeeExport = null'],
  ["import { MAX_COMPARE_EVENTS, MIN_COMPARE_EVENTS, parseEventsComparison } from './compare'", 'const MAX_COMPARE_EVENTS = 10, MIN_COMPARE_EVENTS = 2, parseEventsComparison = globalThis.__parseCompare'],
])
assert.deepEqual(await loadMyEventsComparison(['a', 'b'], controller.signal), dto)
response = { data: null, error: { code: '42501', message: 'event_unavailable' } }
await assert.rejects(loadMyEventsComparison(['a', 'b'], controller.signal), e => /eventos tuyos/.test(e.message) && !/event_unavailable/.test(e.message))
response = { data: null, error: { code: '22023' } }
await assert.rejects(loadMyEventsComparison(['a', 'b'], controller.signal), /entre 2 y 10/)
response = { data: dto, error: { code: '500' } }
await assert.rejects(loadMyEventsComparison(['a', 'b'], controller.signal), /Volvé a intentar/)
response = { data: { ...dto, events: [dto.events[0]] }, error: null }
await assert.rejects(loadMyEventsComparison(['a', 'b'], controller.signal), /No pudimos leer/)
await mkdir('docs/qa/r6-block-8', { recursive: true })
await writeFile('docs/qa/r6-block-8/contract.json', JSON.stringify({ result: 'PASS', tests: ['Batch DTO parser: order, ids, formula, N/D for unusable capacity; invalid/foreign payloads rejected', 'Selection normalization and 2..10 bounds', 'RPC parameters, AbortSignal and neutral denied/network/malformed errors'], transport: 'Simulated; not HTTP/JWT' }, null, 2) + '\n')
console.log('PASS: R6 compare DTO, selection and RPC adapter')
