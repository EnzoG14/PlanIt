import webpush from 'web-push'
import type { Config, Delivery } from './handler.ts'
import { safeEndpoint } from './handler.ts'

export function createTransport(config: Config, request: typeof fetch = fetch) {
  return async (delivery: Delivery): Promise<number> => {
    if (!safeEndpoint(delivery.endpoint)) throw new Error('invalid_delivery')
    let details
    try {
      details = webpush.generateRequestDetails({ endpoint: delivery.endpoint,
        keys: { p256dh: delivery.p256dh, auth: delivery.auth } }, JSON.stringify(delivery.payload), {
        TTL: delivery.ttl, urgency: 'normal', contentEncoding: 'aes128gcm',
        vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey },
      })
    } catch { throw new Error('invalid_delivery') }
    try {
      const result = await request(delivery.endpoint, { method: 'POST', headers: details.headers,
        body: new Uint8Array(details.body), redirect: 'error', signal: AbortSignal.timeout(8000) })
      // Do not read, retain or log provider bodies (they may echo endpoint/key material).
      await result.body?.cancel()
      return result.status
    } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new Error('timeout')
      throw new Error('network_error')
    }
  }
}
