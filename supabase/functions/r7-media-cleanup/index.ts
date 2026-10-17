import { createCleanupHandler, type Config } from './handler.ts'

const config: Config = {
  url: Deno.env.get('SUPABASE_URL') ?? '',
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  workerToken: Deno.env.get('STORY_GC_WORKER_TOKEN') ?? '',
}
const headers = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
// Deploy with gateway JWT verification disabled ONLY after separate approval.
// The handler authenticates its dedicated server-to-server secret before I/O.
Deno.serve(createCleanupHandler(config, {
  async rpc(name, args) {
    const r = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST', headers, body: JSON.stringify(args), redirect: 'error', signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) { await r.body?.cancel(); throw new Error('cleanup_rpc_failed') }
    return r.json()
  },
  async remove(path) {
    // Storage API physically deletes bytes. Never DELETE storage.objects in SQL.
    // Missing objects are an idempotent success for this exact reserved path;
    // complete_r7_story_gc additionally checks absence of Storage metadata.
    const r = await fetch(`${config.url}/storage/v1/object/event_media`, {
      method: 'DELETE', headers, body: JSON.stringify({ prefixes: [path] }),
      redirect: 'error', signal: AbortSignal.timeout(5000),
    })
    await r.body?.cancel()
    if (!r.ok) throw new Error('cleanup_storage_failed')
  },
}))
