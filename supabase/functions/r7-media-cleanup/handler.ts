import { createHash, timingSafeEqual } from 'node:crypto'

export type Config = { url: string; serviceKey: string; workerToken: string }
export type Target = { upload_id: string; story_id: string; storage_path: string }
export type Job = Target & { lease_token: string }
export type Dependencies = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<unknown>
  remove: (path: string) => Promise<void>
  now?: () => number
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const path = /^r7\/stories\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i
function target(value: unknown): Target {
  if (!value || typeof value !== 'object') throw new Error('invalid_target')
  const row = value as Target
  if (!uuid.test(row.upload_id) || !uuid.test(row.story_id) || typeof row.storage_path !== 'string'
    || !path.test(row.storage_path) || !row.storage_path.split('/').slice(2).every(v => uuid.test(v.split('.')[0]))) {
    throw new Error('invalid_target')
  }
  return row
}
const response = (status: number, data: unknown) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

export function createCleanupHandler(config: Config, deps: Dependencies) {
  // Match the existing B10 server-to-server pattern. No JWT/anon key can invoke.
  const configured = /^https:\/\/iepeqmvzjguwlhnecsdq\.supabase\.co$/.test(config.url)
    && config.serviceKey.length > 20 && /^[A-Za-z0-9_-]{32,128}$/.test(config.workerToken)
  const tokenHash = createHash('sha256').update(`Bearer ${config.workerToken}`).digest()
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return response(405, { code: 'method_not_allowed' })
    if (!configured) return response(503, { code: 'cleanup_unconfigured' })
    const authorization = request.headers.get('authorization') ?? ''
    if (authorization.length > 256 || !timingSafeEqual(createHash('sha256').update(authorization).digest(), tokenHash)) {
      return response(401, { code: 'unauthorized' })
    }
    // No browser/request path, mode, limit, clock, or identity is accepted.
    const metrics = { claimed: 0, deleted: 0, retry: 0, stale: 0, errors: 0 }
    const now = deps.now ?? Date.now, start = now()
    try {
      while (metrics.claimed < 50 && now() - start < 20000) {
        const raw = await deps.rpc('claim_r7_story_gc', {})
        if (raw === null) break
        const job = target(raw) as Job
        if (!uuid.test(job.lease_token)) throw new Error('invalid_lease')
        metrics.claimed++
        const args = { p_upload_id: job.upload_id, p_lease_token: job.lease_token }
        let errorCode = 'backend_error'
        try {
          const current = await deps.rpc('get_r7_story_gc_target', args)
          if (current === null) { metrics.stale++; continue }
          const checked = target(current)
          if (checked.upload_id !== job.upload_id || checked.story_id !== job.story_id || checked.storage_path !== job.storage_path) {
            throw new Error('target_changed')
          }
          errorCode = 'storage_error'
          await deps.remove(checked.storage_path)
          errorCode = 'backend_error'
          if (await deps.rpc('complete_r7_story_gc', args) === true) metrics.deleted++
          else { metrics.stale++; throw new Error('completion_unconfirmed') }
        } catch {
          // Never drop references after ambiguous DELETE/5xx/timeout or lost ACK.
          // Lease expiry also recovers a crashed worker without manual mutation.
          metrics.retry++
          try { await deps.rpc('fail_r7_story_gc', { ...args, p_error_code: errorCode }) }
          catch { metrics.errors++ }
        }
      }
      // Independent deletion outbox: no request may supply a path or job ID.
      // The server rechecks the lease, original object identity and references.
      while (metrics.claimed < 100 && now() - start < 40000) {
        const raw = await deps.rpc('claim_event_media_gc', {})
        if (raw === null) break
        const job = raw as { job_id: string; lease_token: string; storage_path: string }
        if (!job || !uuid.test(job.job_id) || !uuid.test(job.lease_token)) throw new Error('invalid_lease')
        metrics.claimed++
        const args = { p_job_id: job.job_id, p_lease_token: job.lease_token }
        let errorCode = 'backend_error'
        try {
          const checked = await deps.rpc('get_event_media_gc_target', args) as { job_id: string; storage_path: string } | null
          if (!checked || checked.job_id !== job.job_id || checked.storage_path !== job.storage_path
            || typeof checked.storage_path !== 'string' || checked.storage_path.length > 1024
            || checked.storage_path.includes(String.fromCharCode(0))
            || checked.storage_path.split('/').some(part => !part || part === '.' || part === '..')
            || !/^(?:r7\/(?:chat|stories)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]+|[0-9a-f-]{36}\/[^\\]+)$/.test(checked.storage_path)) {
            throw new Error('invalid_target')
          }
          errorCode = 'storage_error'
          await deps.remove(checked.storage_path)
          errorCode = 'backend_error'
          if (await deps.rpc('complete_event_media_gc', args) !== true) throw new Error('completion_unconfirmed')
          metrics.deleted++
        } catch {
          metrics.retry++
          try { await deps.rpc('fail_event_media_gc', { ...args, p_error_code: errorCode }) }
          catch { metrics.errors++ }
        }
      }
      return response(metrics.errors ? 503 : 200, { code: 'cleanup_batch_complete', ...metrics })
    } catch { return response(503, { code: 'cleanup_backend_unavailable', ...metrics }) }
  }
}
