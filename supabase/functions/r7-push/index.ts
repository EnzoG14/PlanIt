import { createPushHandler, type Config } from './handler.ts'
import { createTransport } from './transport.ts'

const config: Config = {
  url: Deno.env.get('SUPABASE_URL') ?? '', serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  workerToken: Deno.env.get('PUSH_WORKER_TOKEN') ?? '', publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '', subject: Deno.env.get('VAPID_SUBJECT') ?? '',
}
// The gateway is configured with --no-verify-jwt at authorized deployment.
// This handler checks a dedicated server-to-server bearer secret. User JWTs
// and public API keys cannot invoke it; service_role never leaves the server.
Deno.serve(createPushHandler(config, {
  send: createTransport(config),
  async rpc(name, args) {
    const result = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`,
        'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: AbortSignal.timeout(5000),
      redirect: 'error',
    })
    if (!result.ok) { await result.body?.cancel(); throw new Error('push_rpc_failed') }
    return result.status === 204 ? null : result.json()
  },
}))
