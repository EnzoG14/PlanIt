type Config = { url: string; anonKey: string; serviceKey: string }
type Target = { file_id: string; storage_path: string; mime_type: string; size_bytes: number; object_id: string; etag: string | null }
type Decoder = (bytes: Uint8Array, mime: string) => void | Promise<void>
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store',
}
export function createMediaValidationHandler(config: Config, decode: Decoder, requestFetch: typeof fetch = fetch) {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {
    status, headers: { ...headers, 'Content-Type': 'application/json' },
  })
  const serviceHeaders = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
  const rpc = (name: string, args: unknown) => requestFetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: 'POST', signal: AbortSignal.timeout(10000), headers: serviceHeaders, body: JSON.stringify(args), redirect: 'error',
  })
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' })
    const bearer = request.headers.get('Authorization')
    if (!bearer?.match(/^Bearer \S+$/)) return reply(401, { error: 'authentication_required' })
    try {
      // Bound input while reading, before JSON parse; only file_id is accepted.
      const input = await readBounded(request.body, 1024)
      const body = JSON.parse(new TextDecoder().decode(input))
      if (!body || Object.keys(body).length !== 1 || typeof body.file_id !== 'string' || !uuid.test(body.file_id)) {
        return reply(400, { error: 'invalid_request' })
      }
      const auth = await requestFetch(`${config.url}/auth/v1/user`, {
        headers: { apikey: config.anonKey, Authorization: bearer }, signal: AbortSignal.timeout(10000), redirect: 'error',
      })
      if (!auth.ok) return reply(401, { error: 'authentication_required' })
      const viewer = await auth.json()
      if (typeof viewer.id !== 'string' || !uuid.test(viewer.id)) return reply(401, { error: 'authentication_required' })
      const targetResponse = await rpc('get_r7_media_validation_target', { p_viewer_id: viewer.id, p_file_id: body.file_id })
      if (!targetResponse.ok) return reply(403, { error: 'media_unavailable' })
      const target = await targetResponse.json() as Target | null
      if (!target || target.file_id !== body.file_id || !uuid.test(target.object_id)
        || !['image/jpeg','image/png','image/webp'].includes(target.mime_type)
        || !Number.isSafeInteger(Number(target.size_bytes)) || Number(target.size_bytes) < 1 || Number(target.size_bytes) > 5242880
        || !target.storage_path.startsWith(`r7/`) || target.storage_path.split('/')[2] !== viewer.id) {
        return reply(403, { error: 'media_unavailable' })
      }
      const path = target.storage_path.split('/').map(encodeURIComponent).join('/')
      const object = await requestFetch(`${config.url}/storage/v1/object/authenticated/event_media/${path}`, {
        headers: serviceHeaders, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
      })
      if (!object.ok) return reply(503, { error: 'upload_unavailable' })
      const bytes = await readBounded(object.body, 5242880)
      if (bytes.length !== Number(target.size_bytes)) return reply(422, { error: 'invalid_image' })
      try { await decode(bytes, target.mime_type) } catch { return reply(422, { error: 'invalid_image' }) }
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer))
      const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')
      // SQL locks and rechecks owner/event/membership/state/object identity after
      // the network read. A close, GC claim or replacement prevents attestation.
      const completion = await rpc('complete_r7_media_validation', {
        p_viewer_id: viewer.id, p_file_id: target.file_id, p_object_id: target.object_id, p_etag: target.etag, p_sha256: sha256,
      })
      if (!completion.ok || await completion.json() !== true) return reply(409, { error: 'media_unavailable' })
      return reply(200, { file_id: target.file_id, verified: true })
    } catch { return reply(400, { error: 'invalid_or_unavailable_image' }) }
  }
}
async function readBounded(stream: ReadableStream<Uint8Array> | null, limit: number): Promise<Uint8Array> {
  if (!stream) throw new Error('empty_body')
  const reader = stream.getReader(), chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > limit) { await reader.cancel(); throw new Error('body_too_large') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return bytes
}
