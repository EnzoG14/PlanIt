// Coalesce bursts, serialize requests, and retain invalidations received in flight.
export function createReconciler(run: () => Promise<void>, onError: (error: unknown) => void, delay = 40) {
  let active = true, running = false, dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  async function drain() {
    timer = undefined
    if (!active || running) return
    running = true
    try {
      while (active && dirty) {
        dirty = false
        try { await run() } catch (error) { if (active) onError(error) }
      }
    } finally { running = false }
  }
  return {
    request() {
      if (!active) return
      dirty = true
      if (!running && timer === undefined) timer = setTimeout(() => { void drain() }, delay)
    },
    dispose() { active = false; dirty = false; clearTimeout(timer) },
  }
}
export type OrderedRow = { id: string; created_at: string }
// Normalize optional fractional seconds without truncating PostgreSQL microseconds.
export function compareRows(a: OrderedRow, b: OrderedRow) {
  const normalize = (value: string) => { const [whole, fraction = ''] = value.replace(' ', 'T').split('.'); return whole + '.' + fraction.padEnd(6, '0') }
  const at = normalize(a.created_at), bt = normalize(b.created_at)
  return at < bt ? -1 : at > bt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}
export function mergeRows<T extends OrderedRow>(previous: T[], incoming: T[], descending = false): T[] {
  return [...new Map([...previous, ...incoming].map(row => [row.id, row])).values()]
    .sort((a, b) => (descending ? -1 : 1) * compareRows(a, b))
}
// Walk backwards from newest until the loaded boundary. Covers gaps larger than a page.
export async function catchUp<T extends OrderedRow>(load: (cursor?: T) => Promise<{ items: T[]; hasMore: boolean }>, boundary?: T) {
  const items: T[] = []
  let cursor: T | undefined
  while (true) {
    const page = await load(cursor)
    items.push(...page.items)
    const last = page.items.at(-1)
    if (!page.hasMore || !last || !boundary || compareRows(last, boundary) <= 0) return { items, hasMore: page.hasMore }
    cursor = last
  }
}
