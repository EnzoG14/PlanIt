type AvatarConfig = { url: string; anonKey: string; serviceKey: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
}

// Service key is server-only. No client-chosen path, viewer, bucket or expiry.
export function createAvatarHandler(config: AvatarConfig, requestFetch: typeof fetch = fetch) {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' })
    const authorization = request.headers.get('Authorization')
    if (!authorization?.match(/^Bearer \S+$/)) return reply(401, { error: 'authentication_required' })
    try {
      const rawBody = await request.text()
      if (rawBody.length > 1024) return reply(400, { error: 'invalid_request' })
      let body: { user_id?: unknown }
      try { body = JSON.parse(rawBody) } catch { return reply(400, { error: 'invalid_request' }) }
      if (!body || typeof body.user_id !== 'string' || !uuidPattern.test(body.user_id)) {
        return reply(400, { error: 'invalid_request' })
      }
      const identityResponse = await requestFetch(`${config.url}/auth/v1/user`, {
        signal: AbortSignal.timeout(10000),
        headers: { apikey: config.anonKey, Authorization: authorization },
      })
      if (!identityResponse.ok) return reply(401, { error: 'authentication_required' })
      const identity = await identityResponse.json() as { id?: string }
      if (!identity.id || !uuidPattern.test(identity.id)) return reply(401, { error: 'authentication_required' })
      const adminHeaders = {
        apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json',
      }
      const pathResponse = await requestFetch(`${config.url}/rest/v1/rpc/get_social_avatar_for_signing`, {
        signal: AbortSignal.timeout(10000),
        method: 'POST', headers: adminHeaders,
        body: JSON.stringify({ p_viewer_id: identity.id, p_user_id: body.user_id }),
      })
      if (!pathResponse.ok) return reply(503, { error: 'avatar_unavailable' })
      const path = await pathResponse.json() as string | null
      // Nonexistent, blocked and no-avatar have the same response; no path leaks.
      if (!path) return reply(200, { signed_url: null, expires_in: 60 })
      const encodedPath = path.split('/').map(encodeURIComponent).join('/')
      const signatureResponse = await requestFetch(`${config.url}/storage/v1/object/sign/avatars/${encodedPath}`, {
        signal: AbortSignal.timeout(10000),
        method: 'POST', headers: adminHeaders, body: JSON.stringify({ expiresIn: 60 }),
      })
      if (!signatureResponse.ok) return reply(503, { error: 'avatar_unavailable' })
      const signature = await signatureResponse.json() as { signedURL?: string }
      if (!signature.signedURL?.startsWith('/object/sign/avatars/')) return reply(503, { error: 'avatar_unavailable' })
      // Revalidate after signing so a block/avatar change committed during the
      // Storage request does not deliver that now-withdrawn social projection.
      const recheck = await requestFetch(`${config.url}/rest/v1/rpc/get_social_avatar_for_signing`, {
        signal: AbortSignal.timeout(10000), method: 'POST', headers: adminHeaders,
        body: JSON.stringify({ p_viewer_id: identity.id, p_user_id: body.user_id }),
      })
      if (!recheck.ok) return reply(503, { error: 'avatar_unavailable' })
      if (await recheck.json() !== path) return reply(200, { signed_url: null, expires_in: 60 })
      return reply(200, { signed_url: `${config.url}/storage/v1${signature.signedURL}`, expires_in: 60 })
    } catch {
      return reply(503, { error: 'avatar_unavailable' })
    }
  }
}
