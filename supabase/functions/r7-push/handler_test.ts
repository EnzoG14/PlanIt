import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createECDH } from 'node:crypto'
import ece from 'npm:http_ece@1.2.0'
import { classify, createPushHandler, parseDelivery, plainText, safeEndpoint, safeTarget, validConfig, type Config, type Delivery, type Job } from './handler.ts'
import { createTransport } from './transport.ts'

const sender = createECDH('prime256v1'); sender.generateKeys()
const recipient = createECDH('prime256v1'); recipient.generateKeys()
const config: Config = {
  url: 'https://iepeqmvzjguwlhnecsdq.supabase.co', serviceKey: 'fixture-service-not-real', workerToken: 'x'.repeat(43),
  publicKey: sender.getPublicKey().toString('base64url'), privateKey: sender.getPrivateKey().toString('base64url'),
  subject: 'mailto:push@example.invalid',
}
const job: Job = { notification_id: '10000000-0000-4000-8000-000000000001', subscription_id: '20000000-0000-4000-8000-000000000001', lease_token: '30000000-0000-4000-8000-000000000001' }
const raw: Delivery = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/fixture', p256dh: recipient.getPublicKey().toString('base64url'),
  auth: Buffer.alloc(16, 42).toString('base64url'), ttl: 900,
  payload: { version: 1, notification_id: job.notification_id, recipient_id: '40000000-0000-4000-8000-000000000001',
    title: 'Mensaje de Fixture', body: 'Texto privado de prueba 🔒', target: '/messages/50000000-0000-4000-8000-000000000001' },
}
const request = (token = config.workerToken, method = 'POST') => new Request('https://edge.example.invalid/r7-push', { method, headers: { Authorization: `Bearer ${token}` } })

Deno.test('B10 config: missing, malformed and mismatched VAPID fails before RPC or send', async () => {
  assert.equal(validConfig(config), true)
  for (const overrides of [{ privateKey: '' }, { privateKey: '!wrong' }, { publicKey: recipient.getPublicKey().toString('base64url') },
    { workerToken: '' }, { subject: 'bad' }, { url: 'http://localhost' }]) {
    let calls = 0
    const handler = createPushHandler({ ...config, ...overrides }, { rpc: async () => { calls++; return [] }, send: async () => { calls++; return 201 } })
    const result = await handler(request()); assert.equal(result.status, 503); assert.equal(calls, 0)
    assert.equal(await result.text(), '{"code":"push_runtime_unconfigured"}')
  }
})
Deno.test('B10 private worker: rejects anonymous, public key, user JWT, service key and wrong method', async () => {
  let calls = 0
  const handler = createPushHandler(config, { rpc: async () => { calls++; return [] }, send: async () => { calls++; return 201 } })
  for (const token of ['', 'public-fixture', 'eyJhbGciOi.fixture.user-signature', config.serviceKey, 'x'.repeat(42)]) {
    assert.equal((await handler(request(token))).status, 401)
  }
  assert.equal((await handler(request(config.workerToken, 'GET'))).status, 405); assert.equal(calls, 0)
})
Deno.test('B10 payload: strict recipient/job correlation, Unicode limits, plain text, internal routes, trusted provider endpoints', () => {
  assert.equal(Array.from(plainText('🔒'.repeat(200), 120, '')).length, 120)
  assert.equal(plainText('<b>Hola</b>\u0000 https://evil.invalid/path\u202e', 120, ''), 'Hola')
  for (const endpoint of ['https://127.0.0.1/', 'http://fcm.googleapis.com/', 'https://fcm.googleapis.com.evil.invalid/',
    'https://user:secret@fcm.googleapis.com/', 'https://fcm.googleapis.com:444/', 'https://fcm.googleapis.com/#fragment',
    'https://random-public.example/', 'https://fcm.googleapis.com\\@evil.invalid/',
    'https://jmt17.google.com/log', 'https://jmt17.google.com.evil.invalid/fcm/send/x']) assert.equal(safeEndpoint(endpoint), false)
  for (const endpoint of ['https://updates.push.services.mozilla.com/wpush/v2/x', 'https://web.push.apple.com/x', 'https://wns2-par02p.notify.windows.com/w/?x', 'https://jmt17.google.com/fcm/send/fixture']) assert.equal(safeEndpoint(endpoint), true)
  for (const target of ['//evil.invalid', 'https://evil.invalid', '/events/../secret', '/invite#token=secret', '/messages/------------------------------------']) assert.equal(safeTarget(target), '/notifications')
  assert.equal(safeTarget(raw.payload.target), raw.payload.target)
  assert.throws(() => parseDelivery({ ...raw, payload: { ...raw.payload, notification_id: job.subscription_id } }, job))
  assert.throws(() => parseDelivery({ ...raw, ttl: 0 }, job))
})
Deno.test('B10 transport: real aes128gcm encryption/decryption and verified VAPID signature; mocked HTTPS transport', async () => {
  let called = 0
  let assertionError: unknown
  const transport = createTransport(config, async (url, init) => {
    try {
    called++; assert.equal(url, raw.endpoint); assert.equal(init?.redirect, 'error'); assert.ok(init?.signal)
    const headers = new Headers(init?.headers)
    assert.equal(headers.get('content-encoding'), 'aes128gcm'); assert.equal(headers.get('ttl'), '900')
    const encrypted = Buffer.from(init?.body as Uint8Array)
    assert.equal(encrypted.includes(raw.payload.body), false)
    const decrypted = ece.decrypt(encrypted, { version: 'aes128gcm', privateKey: recipient, authSecret: Buffer.from(raw.auth, 'base64url') })
    assert.deepEqual(JSON.parse(decrypted.toString()), raw.payload)
    const authorization = headers.get('authorization')!
    const jwt = /t=([^,]+)/.exec(authorization)![1]
    const [head, body, signature] = jwt.split('.')
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString())
    assert.equal(claims.aud, 'https://fcm.googleapis.com'); assert.equal(claims.sub, config.subject)
    assert.equal(claims.exp > Date.now() / 1000, true)
    const publicBytes = sender.getPublicKey()
    const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: publicBytes.subarray(1, 33).toString('base64url'), y: publicBytes.subarray(33).toString('base64url') }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    assert.equal(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, new Uint8Array(Buffer.from(signature, 'base64url')), new TextEncoder().encode(head + '.' + body)), true)
    } catch (error) { assertionError = error }
    return new Response('provider response must not be persisted', { status: 201 })
  })
  assert.equal(await transport(raw), 201); assert.equal(called, 1)
  if (assertionError) throw assertionError
  await assert.rejects(transport({ ...raw, endpoint: 'https://127.0.0.1/' }), /invalid_delivery/); assert.equal(called, 1)
})
Deno.test('B10 HTTP classifier separates provider acceptance, stale endpoint, transient and permanent errors', () => {
  for (const status of [200, 201, 202, 204, 299]) assert.equal(classify(status), null)
  for (const status of [404, 410]) assert.equal(classify(status), 'gone')
  assert.equal(classify(429), 'rate_limited')
  for (const status of [500, 502, 503]) assert.equal(classify(status), 'provider_error')
  for (const status of [301, 400, 401, 403, 413]) assert.equal(classify(status), 'permanent')
})
Deno.test('B10 handler acknowledges only acceptance; errors never contain provider body, endpoint, keys or preview', async () => {
  for (const code of [201, 404, 410, 429, 500, 400, 'timeout', 'network']) {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = []
    let claimed = false
    const handler = createPushHandler(config, {
      rpc: async (name, args) => {
        calls.push({ name, args })
        if (name === 'enqueue_missing_push_jobs') return 0
        if (name === 'claim_push_jobs') { if (claimed) return []; claimed = true; return [job] }
        if (name === 'get_push_job_delivery') return raw
        return null
      },
      send: async () => { if (typeof code === 'number') return code; throw new Error(code === 'timeout' ? 'timeout' : raw.endpoint + config.privateKey + raw.payload.body) },
    })
    const result = await handler(request()), text = await result.text()
    assert.equal(result.status, 200)
    for (const secret of [raw.endpoint, raw.p256dh, raw.auth, config.privateKey, raw.payload.body]) assert.equal(text.includes(secret), false)
    const terminal = calls.find(c => ['complete_push_job', 'fail_push_job'].includes(c.name))!
    assert.equal(terminal.name, code === 201 ? 'complete_push_job' : 'fail_push_job')
    if (code !== 201) assert.equal(terminal.args.p_error_code, typeof code === 'number' ? classify(code) : code === 'timeout' ? 'timeout' : 'network_error')
  }
})
Deno.test('B10 transport normalizes timeout and redirect/network exceptions without exposing request data', async () => {
  const timeout = createTransport(config, async () => { throw new DOMException('sensitive', 'TimeoutError') })
  const redirect = createTransport(config, async () => { throw new TypeError(raw.endpoint) })
  await assert.rejects(timeout(raw), /^Error: timeout$/); await assert.rejects(redirect(raw), /^Error: network_error$/)
})
Deno.test('B10 invalid/disabled delivery never sends; lost ACK returns infrastructure failure without false completion', async () => {
  for (const mode of ['disabled', 'unsafe', 'ack_lost']) {
    let once = false, sends = 0, failures = 0
    const handler = createPushHandler(config, {
      rpc: async name => {
        if (name === 'enqueue_missing_push_jobs') return 0
        if (name === 'claim_push_jobs') { if (once) return []; once = true; return [job] }
        if (name === 'get_push_job_delivery') return mode === 'disabled' ? null : mode === 'unsafe' ? { ...raw, endpoint: 'https://127.0.0.1/' } : raw
        if (name === 'fail_push_job') failures++
        if (name === 'complete_push_job' && mode === 'ack_lost') throw new Error('private infrastructure detail')
        return null
      }, send: async () => { sends++; return 201 },
    })
    const result = await handler(request()), metrics = await result.json()
    assert.equal(sends, mode === 'ack_lost' ? 1 : 0)
    assert.equal(failures, mode === 'unsafe' ? 1 : 0)
    assert.equal(result.status, mode === 'ack_lost' ? 503 : 200)
    if (mode === 'ack_lost') { assert.equal(metrics.accepted, 1); assert.equal(metrics.infrastructure_errors, 1) }
  }
})
Deno.test('B10 invocation bounds: no more than 100 claims; five immediate sends per lease batch', async () => {
  let total = 0, active = 0, maxActive = 0
  const handler = createPushHandler(config, {
    rpc: async (name, args) => {
      if (name === 'enqueue_missing_push_jobs') return 0
      if (name === 'claim_push_jobs') { assert.equal(args.p_limit, 5); total += 5; return Array.from({ length: 5 }, () => job) }
      if (name === 'get_push_job_delivery') return raw
      return null
    }, send: async () => { active++; maxActive = Math.max(active, maxActive); await new Promise(r => setTimeout(r, 1)); active--; return 201 },
  })
  const result = await handler(request())
  assert.equal(result.status, 200); assert.equal(total, 100); assert.equal(maxActive, 5)
})
