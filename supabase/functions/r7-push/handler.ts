import { createECDH, createHash, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'

export interface Job { notification_id: string; subscription_id: string; lease_token: string }
export interface PushPayload {
  version: 1; notification_id: string; recipient_id: string; title: string; body: string; target: string
}
export interface Delivery { endpoint: string; p256dh: string; auth: string; ttl: number; payload: PushPayload }
export interface Config {
  url: string; serviceKey: string; workerToken: string; publicKey: string; privateKey: string; subject: string
}
export interface Dependencies {
  rpc(name: string, args: Record<string, unknown>): Promise<unknown>
  send(delivery: Delivery): Promise<number>
  now?: () => number
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const genericTitle = 'Nuevo aviso en PlanIt'
const genericBody = 'Abrí PlanIt para consultar tus notificaciones.'
const codes = new Set(['timeout', 'invalid_delivery'])
function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function canonicalKey(value: string, length: number): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value) && Buffer.from(value, 'base64url').length === length
    && Buffer.from(value, 'base64url').toString('base64url') === value
}
export function validConfig(c: Config): boolean {
  try {
    const url = new URL(c.url)
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return false
    if (!c.serviceKey || !/^[A-Za-z0-9_-]{43,128}$/.test(c.workerToken)) return false
    if (!canonicalKey(c.publicKey, 65) || !canonicalKey(c.privateKey, 32)) return false
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(Buffer.from(c.privateKey, 'base64url'))
    if (ecdh.getPublicKey().toString('base64url') !== c.publicKey) return false
    const subject = new URL(c.subject)
    return c.subject.length <= 256 && !/[\s\p{Cc}]/u.test(c.subject) &&
      ((subject.protocol === 'mailto:' && /^[^@]+@[^@]+\.[^@]+$/.test(subject.pathname)) ||
       (subject.protocol === 'https:' && !subject.username && !subject.password && subject.hostname !== 'localhost'))
  } catch { return false }
}
// Trusted push-provider domains only. B9's general URL validation alone cannot
// prevent DNS rebinding. Never follow a redirect carrying VAPID credentials.
export function safeEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\\\p{Cc}]/u.test(value)) return false
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && !u.hash &&
      (['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(u.hostname)
        || /^[a-z0-9-]+\.notify\.windows\.com$/.test(u.hostname))
  } catch { return false }
}
export function plainText(value: unknown, max: number, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const text = value.replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/\b(?:https?|javascript|data|vbscript):\S*/gi, '').replace(/\s+/g, ' ').trim()
  if (!text) return fallback
  const chars = Array.from(text)
  return chars.length > max ? chars.slice(0, max - 1).join('').trimEnd() + '…' : text
}
export function safeTarget(value: unknown): string {
  if (value === '/me/follow-requests') return value
  if (typeof value === 'string' && (/^\/messages\/[0-9a-f-]{36}$/i.test(value)
    || /^\/events\/[0-9a-f-]{36}(\/chat)?$/i.test(value))) {
    if (uuid.test(value.split('/')[2])) return value
  }
  return '/notifications'
}
function parseJob(value: unknown): Job {
  const row = object(value)
  if (![row.notification_id, row.subscription_id, row.lease_token].every(v => typeof v === 'string' && uuid.test(v))) throw new Error('invalid_job')
  return row as unknown as Job
}
export function parseDelivery(value: unknown, job: Job): Delivery {
  const row = object(value), payload = object(row.payload)
  if (!safeEndpoint(row.endpoint) || typeof row.p256dh !== 'string' || !canonicalKey(row.p256dh, 65)
    || typeof row.auth !== 'string' || !canonicalKey(row.auth, 16)
    || typeof row.ttl !== 'number' || !Number.isInteger(row.ttl) || row.ttl < 1 || row.ttl > 900
    || payload.version !== 1 || payload.notification_id !== job.notification_id
    || typeof payload.recipient_id !== 'string' || !uuid.test(payload.recipient_id)) throw new Error('invalid_delivery')
  return { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth, ttl: row.ttl,
    payload: { version: 1, notification_id: job.notification_id, recipient_id: payload.recipient_id,
      title: plainText(payload.title, 80, genericTitle), body: plainText(payload.body, 120, genericBody), target: safeTarget(payload.target) } }
}
export function classify(status: number): string | null {
  if (status >= 200 && status < 300) return null
  if (status === 404 || status === 410) return 'gone'
  if (status === 429) return 'rate_limited'
  if (status >= 500 && status < 600) return 'provider_error'
  return 'permanent'
}
function args(job: Job): Record<string, unknown> {
  return { p_notification_id: job.notification_id, p_subscription_id: job.subscription_id, p_lease_token: job.lease_token }
}
const response = (status: number, data: unknown) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

export function createPushHandler(config: Config, deps: Dependencies) {
  const configured = validConfig(config)
  const tokenHash = createHash('sha256').update(`Bearer ${config.workerToken}`).digest()
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return response(405, { code: 'method_not_allowed' })
    const authorization = request.headers.get('authorization') ?? ''
    if (!configured) return response(503, { code: 'push_runtime_unconfigured' })
    if (authorization.length > 256 || !timingSafeEqual(createHash('sha256').update(authorization).digest(), tokenHash)) {
      return response(401, { code: 'unauthorized' })
    }
    if (Number(request.headers.get('content-length') ?? 0) > 1024) return response(413, { code: 'body_too_large' })
    const metrics = { enqueued: 0, claimed: 0, accepted: 0, retry: 0, failed: 0, discarded: 0, infrastructure_errors: 0 }
    const now = deps.now ?? Date.now, started = now()
    try {
      const enqueued = await deps.rpc('enqueue_missing_push_jobs', { p_limit: 100 })
      if (typeof enqueued !== 'number') throw new Error('invalid_rpc')
      metrics.enqueued = enqueued
      // Claim only five immediately before I/O; a 100-item reservation would
      // expire while waiting for network. SQL leases coordinate all invocations.
      while (metrics.claimed < 100 && now() - started < 40000) {
        const rows = await deps.rpc('claim_push_jobs', { p_limit: Math.min(5, 100 - metrics.claimed) })
        if (!Array.isArray(rows) || rows.length > 5) throw new Error('invalid_rpc')
        if (!rows.length) break
        const jobs = rows.map(parseJob)
        metrics.claimed += jobs.length
        await Promise.all(jobs.map(async job => {
          try {
            const raw = await deps.rpc('get_push_job_delivery', args(job))
            if (raw === null) { metrics.discarded++; return }
            let errorCode: string | null
            try {
              const delivery = parseDelivery(raw, job)
              errorCode = classify(await deps.send(delivery))
            } catch (error) {
              const message = error instanceof Error ? error.message : ''
              errorCode = codes.has(message) ? message : 'network_error'
            }
            if (errorCode === null) {
              metrics.accepted++ // Only provider acceptance; an ACK failure remains ambiguous.
              await deps.rpc('complete_push_job', args(job))
            } else {
              await deps.rpc('fail_push_job', { ...args(job), p_error_code: errorCode })
              if (['gone', 'permanent', 'invalid_delivery'].includes(errorCode)) metrics.failed++
              else metrics.retry++ // SQL may terminalize an exhausted/expired job.
            }
          } catch { metrics.infrastructure_errors++ }
        }))
      }
      return response(metrics.infrastructure_errors ? 503 : 200, { code: 'push_batch_complete', ...metrics })
    } catch { return response(503, { code: 'push_backend_unavailable', ...metrics }) }
  }
}
