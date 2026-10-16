import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import ts from 'typescript'
import { pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

async function module(path, replacements = []) {
  let source = await readFile(path, 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  // Resolve later analytics imports against their real files, keeping all assertions.
  js = js.replace(/from '(\.\/[^']+)'/g, (_, specifier) =>
    `from '${pathToFileURL(resolve(dirname(path), specifier + '.ts')).href}'`)
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
}
const { parseEventOccupancy } = await module('src/features/analytics/types.ts')
const { formatOccupancyPercent } = await module('src/features/analytics/format.ts')
const dto = { event_id: 'fixture', title: 'Fixture', event_state: 'open', as_of: '2026-10-15T10:00:00', capacity: 10, confirmed_count: 4, available_spots: 6, occupancy_percent: 40, capacity_usable: true }
assert.deepEqual(parseEventOccupancy(dto), dto)
for (const patch of [{ capacity: 0 }, { confirmed_count: -1 }, { available_spots: 7 }, { occupancy_percent: NaN }, { occupancy_percent: 41 }, { as_of: dto.as_of + 'Z' }, { event_state: 'draft' }, { capacity_usable: false }]) assert.throws(() => parseEventOccupancy({ ...dto, ...patch }))
assert.equal(formatOccupancyPercent(100 / 3), '33,3 %')
for (const v of [null, NaN, Infinity, -1]) assert.equal(formatOccupancyPercent(v), 'N/D')
globalThis.__occupancyClient = { rpc(name, args) {
  assert.equal(name, 'get_my_event_occupancy'); assert.deepEqual(args, { p_event_id: 'fixture' })
  return { abortSignal(signal) { assert.equal(signal, controller.signal); return Promise.resolve(response) } }
} }
const controller = new AbortController()
let response = { data: dto, error: null }
globalThis.__parseOccupancy = parseEventOccupancy
const { loadMyEventOccupancy } = await module('src/features/analytics/api.ts', [
  ["import { supabase } from '../../lib/supabase'", 'const supabase = globalThis.__occupancyClient'],
  ["import { parseEventOccupancy, type EventOccupancy } from './types'", 'const parseEventOccupancy = globalThis.__parseOccupancy'],
])
assert.deepEqual(await loadMyEventOccupancy('fixture', controller.signal), dto)
response = { data: null, error: { code: '42501' } }
await assert.rejects(loadMyEventOccupancy('fixture', controller.signal), /No tenés acceso/)
response = { data: dto, error: { code: '500' } }
await assert.rejects(loadMyEventOccupancy('fixture', controller.signal), /Volvé a intentar/)
response = { data: { ...dto, capacity: 0 }, error: null }
await assert.rejects(loadMyEventOccupancy('fixture', controller.signal), /No pudimos leer/)
await mkdir('docs/qa/r6-block-1', { recursive: true })
await writeFile('docs/qa/r6-block-1/contract.json', JSON.stringify({ result: 'PASS', tests: ['DTO and formula consistency; invalid payloads rejected', 'es-AR rounding only in presentation; N/D invalid numbers', 'RPC parameters and AbortSignal; denied/network/malformed responses never return stale success'], transport: 'Simulated; not HTTP/JWT' }, null, 2) + '\n')
console.log('PASS: R6 DTO,format and RPC adapter')
