import { supabase } from './supabase'

// Memory only: never persist private media URLs in localStorage or the SW.
const cache = new Map<string, { url: string; expiresAt: number }>()
const pending = new Map<string, Promise<string | null>>()
let generation = 0

supabase?.auth.onAuthStateChange(() => {
  generation += 1
  cache.clear()
  pending.clear()
})

export async function signedImageUrls(bucket: string, paths: string[], lifetimeSeconds: 60 | 300 = 300) {
  const client = supabase
  if (!client) throw new Error('La conexión no está configurada.')
  const unique = [...new Set(paths)]
  const key = (path: string) => JSON.stringify([bucket, lifetimeSeconds, path])
  const now = Date.now()
  for (const [id, entry] of cache) if (entry.expiresAt <= now) cache.delete(id)
  const missing = unique.filter(path => !cache.has(key(path)) && !pending.has(key(path)))
  if (missing.length) {
    const revision = generation
    // Expiry starts before the request, with a margin for download time.
    const expiresAt = now + (lifetimeSeconds - 10) * 1000
    const batch = (async () => {
      try {
        const { data, error } = await client.storage.from(bucket).createSignedUrls(missing, lifetimeSeconds)
        if (error || revision !== generation) return new Map<string, string>()
        const urls = new Map<string, string>()
        for (const item of data ?? []) {
          if (item.path && item.signedUrl && !item.error) {
            urls.set(item.path, item.signedUrl)
            // Bound memory usage during long map browsing sessions.
            if (cache.size >= 500) cache.delete(cache.keys().next().value!)
            cache.set(key(item.path), { url: item.signedUrl, expiresAt })
          }
        }
        return urls
      } catch { return new Map<string, string>() }
    })()
    for (const path of missing) {
      const id = key(path)
      const request = batch.then(urls => urls.get(path) ?? null).finally(() => {
        if (pending.get(id) === request) pending.delete(id)
      })
      pending.set(id, request)
    }
  }
  const revision = generation
  const entries = await Promise.all(unique.map(async path => {
    const url = cache.get(key(path))?.url ?? await pending.get(key(path)) ?? null
    return [path, url] as const
  }))
  const urls = new Map<string, string>()
  if (revision === generation) for (const [path, url] of entries) if (url) urls.set(path, url)
  return { urls, imageError: urls.size !== unique.length }
}
