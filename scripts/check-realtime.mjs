import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const load = async path => import('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64'))
const { createReconciler, mergeRows, compareRows, catchUp } = await load('src/lib/reconciliation.ts')
const { subscribeToChanges } = await load('src/lib/realtime.ts')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
let runs = 0, release
const queue = createReconciler(async () => { runs++; if (runs === 1) await new Promise(resolve => { release = resolve }) }, assert.fail, 0)
for (let i = 0; i < 20; i++) queue.request()
await wait(10); assert.equal(runs, 1)
for (let i = 0; i < 20; i++) queue.request()
release(); await wait(10); assert.equal(runs, 2)
queue.dispose(); queue.request(); await wait(10); assert.equal(runs, 2)
let failures = 0
const failing = createReconciler(async () => { throw Error('offline') }, () => failures++, 0)
failing.request(); await wait(10); failing.request(); await wait(10); assert.equal(failures, 2); failing.dispose()
console.log('PASS simulated: bursts coalesce; invalidations during query run again; errors recover; disposal stops queued work')
const rows = Array.from({ length: 190 }, (_, i) => ({ id: String(i).padStart(4, '0'), created_at: '2026-10-11T12:00:00.123456' }))
const page = async cursor => { const end = cursor ? rows.findIndex(row => row.id === cursor.id) : rows.length; const batch = rows.slice(0, end).reverse(); return { items: batch.slice(0, 30), hasMore: batch.length > 30 } }
const gap = await catchUp(page, rows[10]); assert.ok(gap.items.some(row => row.id === rows[10].id)); assert.equal(new Set(gap.items.map(row => row.id)).size, gap.items.length)
assert.equal(mergeRows(rows, [...rows, rows[0]]).length, 190)
assert.equal(mergeRows(rows, [], true)[0].id, '0189')
assert.ok(compareRows({ id:'a',created_at:'2026-10-11T12:00:00.000001' }, { id:'b',created_at:'2026-10-11T12:00:00' }) > 0)
assert.ok(compareRows({ id:'a',created_at:'2026-10-11T12:00:00.1' }, { id:'b',created_at:'2026-10-11T12:00:00.100000' }) < 0)
console.log('PASS simulated: UUID deduplication, chronological microsecond/UUID ordering, recovery beyond 6 pages')
globalThis.window = new EventTarget(); globalThis.document = new EventTarget(); document.visibilityState = 'visible'
const channels = [], removed = [], authListeners = new Set()
const client = {
  channel(name) { const channel = { name, bindings: [], on(_, binding, callback) { this.bindings.push({ binding, callback }); return this }, subscribe(callback) { this.status = callback; return this } }; channels.push(channel); return channel },
  async removeChannel(channel) { removed.push(channel); channel.status('CLOSED') },
  auth: { onAuthStateChange(callback) { authListeners.add(callback); return { data: { subscription: { unsubscribe() { authListeners.delete(callback) } } } } } },
}
let changes = 0, recoveries = 0; const states = []
const stop = subscribeToChanges(client, 'chat:A:event', [{ table: 'messages',event:'INSERT',filter:'conversation_id=eq.event' }], () => changes++, () => recoveries++, state => states.push(state))
const first = channels[0]; assert.equal(first.bindings[0].binding.filter, 'conversation_id=eq.event')
first.status('SUBSCRIBED'); first.bindings[0].callback({new:{id:'1'},eventType:'INSERT'})
first.status('CHANNEL_ERROR'); first.status('TIMED_OUT'); first.status('SUBSCRIBED')
window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('online'))
for (const listener of authListeners) listener('TOKEN_REFRESHED')
await wait(0); assert.equal(recoveries, 6); assert.equal(changes, 1); assert.ok(states.includes('disconnected'))
first.status('CLOSED'); await wait(1100); assert.equal(channels.length, 2)
first.bindings[0].callback({new:{id:'late'}}); assert.equal(changes,1)
stop(); channels[1].status('SUBSCRIBED'); channels[1].bindings[0].callback({new:{id:'late'}})
assert.equal(changes,1); assert.equal(authListeners.size,0); assert.equal(removed.length,2)
console.log('PASS simulated: all channel statuses, fresh channel on CLOSED, auth refresh/focus/online recovery, cleanup and ignored stale callbacks')
