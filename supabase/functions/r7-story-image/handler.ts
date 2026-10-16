type Config = { url: string; anonKey: string; serviceKey: string }
type Target = { file_id: string; storage_path: string; mime_type: string; size_bytes: number; sha256: string; object_id: string; etag: string | null }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Cache-Control': 'no-store', Vary: 'Authorization' }
export function createStoryImageHandler(config: Config, requestFetch: typeof fetch = fetch) {
  const reply = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'GET') return reply(405, 'method_not_allowed')
    const bearer = request.headers.get('Authorization')
    if (!bearer?.match(/^Bearer \S+$/)) return reply(401, 'authentication_required')
    const query = new URL(request.url).searchParams, id = query.get('story_id')
    if (!id || !uuid.test(id) || [...query.keys()].length !== 1) return reply(400, 'invalid_request')
    try {
      const auth = await requestFetch(`${config.url}/auth/v1/user`, { headers: { apikey: config.anonKey, Authorization: bearer }, signal: AbortSignal.timeout(10000), redirect: 'error' })
      if (!auth.ok) return reply(401, 'authentication_required')
      const viewer = await auth.json()
      if (typeof viewer.id !== 'string' || !uuid.test(viewer.id)) return reply(401, 'authentication_required')
      const serviceHeaders = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
      const target = async (): Promise<Target | null> => {
        const response = await requestFetch(`${config.url}/rest/v1/rpc/get_r7_story_image_target`, {
          method: 'POST', headers: serviceHeaders, body: JSON.stringify({ p_viewer_id: viewer.id, p_story_id: id }), signal: AbortSignal.timeout(10000), redirect: 'error',
        })
        return response.ok ? await response.json() : null
      }
      const first = await target()
      const parts = first?.storage_path?.split('/')
      if (!first || !uuid.test(first.file_id) || !uuid.test(first.object_id) || !first.storage_path.startsWith('r7/stories/')
        || parts?.length !== 5 || !uuid.test(parts[2]) || !uuid.test(parts[3]) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(parts[4]) || !/^[0-9a-f]{64}$/.test(first.sha256)
        || !['image/jpeg','image/png','image/webp'].includes(first.mime_type)
        || !Number.isSafeInteger(Number(first.size_bytes)) || Number(first.size_bytes) < 1 || Number(first.size_bytes) > 5242880) return reply(403, 'image_unavailable')
      const path = first.storage_path.split('/').map(encodeURIComponent).join('/')
      const image = await requestFetch(`${config.url}/storage/v1/object/event_media/${path}`, { headers: serviceHeaders, signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' })
      if (!image.ok || !image.body) return reply(503, 'image_unavailable')
      const reader = image.body.getReader(), chunks: Uint8Array[] = []; let size = 0
      try {
        while (true) {
          const {done,value} = await reader.read(); if (done) break
          size += value.length
          if (size > Number(first.size_bytes)) { await reader.cancel(); return reply(503, 'image_unavailable') }
          chunks.push(value)
        }
      } finally { reader.releaseLock() }
      if (size !== Number(first.size_bytes)) return reply(503, 'image_unavailable')
      const bytes = new Uint8Array(size); let offset = 0
      for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length }
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), b => b.toString(16).padStart(2,'0')).join('')
      if (digest !== first.sha256) return reply(503, 'image_unavailable')
      // Server TTL, membership, claim and immutable object identity are rechecked AFTER I/O.
      const last = await target()
      if (!last || last.file_id !== first.file_id || last.object_id !== first.object_id || last.etag !== first.etag || last.sha256 !== first.sha256 || last.storage_path !== first.storage_path || last.mime_type !== first.mime_type || Number(last.size_bytes) !== Number(first.size_bytes)) return reply(403, 'image_unavailable')
      return new Response(bytes, { status: 200, headers: { ...headers, 'Content-Type': first.mime_type, 'Content-Length': String(size), 'X-Content-Type-Options': 'nosniff' } })
    } catch { return reply(503, 'image_unavailable') }
  }
}
