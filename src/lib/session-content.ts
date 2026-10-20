import { supabase } from './supabase'

type Entry = { data?: unknown; updatedAt: number; pending?: Promise<unknown>; controller?: AbortController }
const entries = new Map<string, Entry>()
let owner: string | null = null

export function invalidateContent(prefix = '') {
  for (const [key, entry] of entries) if (key.startsWith(prefix)) {
    entry.controller?.abort()
    entries.delete(key)
  }
}
export function beginContentSession(userId: string) {
  if (owner !== userId) { invalidateContent(); owner = userId }
}
supabase?.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (owner !== null && owner !== session?.user.id)) {
    invalidateContent(); owner = null
  }
})
export function readContent<T>(key: string): T | undefined {
  return entries.get(key)?.data as T | undefined
}
export function contentUpdatedAt(key: string) { return entries.get(key)?.updatedAt ?? 0 }

// Shared requests belong to the session, not to a screen that may unmount.
// Keep the last result for immediate rendering while an expired entry refreshes.
export async function loadContent<T>(key: string, loader: (signal: AbortSignal) => Promise<T>, force = false): Promise<T> {
  let entry = entries.get(key)
  if (entry?.pending) return entry.pending as Promise<T>
  if (!force && entry?.data !== undefined && Date.now() - entry.updatedAt < 30000) return entry.data as T
  if (!entry) {
    if (entries.size >= 40) {
      const oldest = [...entries].find(([, value]) => !value.pending)
      if (oldest) entries.delete(oldest[0])
    }
    entry = { updatedAt: 0 }
    entries.set(key, entry)
  }
  const current = entry
  const controller = new AbortController()
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)])
  current.controller = controller
  const work = (async () => {
    let abort: () => void = () => {}
    try {
      const data = await Promise.race([loader(signal), new Promise<never>((_, reject) => {
        abort = () => reject(signal.reason)
        signal.addEventListener('abort', abort, { once: true })
        if (signal.aborted) abort()
      })])
      signal.throwIfAborted()
      if (entries.get(key) !== current) throw new DOMException('Session changed', 'AbortError')
      current.data = data
      current.updatedAt = Date.now()
      return data
    } catch (error) {
      if (entries.get(key) === current) entries.delete(key)
      throw error
    } finally {
      signal.removeEventListener('abort', abort)
      current.pending = undefined
      current.controller = undefined
    }
  })()
  current.pending = work
  return work
}
