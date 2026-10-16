import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { buildEventSharePayload, shareEvent, copyEventLink } from '../src/features/events/share.ts'

const out = 'docs/qa/r7-block-8'
await mkdir(out, { recursive: true })
const event = { id: '30000000-0000-4000-8000-000000000001', title: 'Encuentro · música 🎵', starts_at: '2099-10-12T20:00:00', ends_at: '2099-10-12T23:00:00', location_name: 'PRIVATE', address: 'PRIVATE', visibility: 'public', state: 'open', attendees: ['PRIVATE'], chat: 'PRIVATE', statistics: 'PRIVATE', secret: 'PRIVATE' }
const options = { origin: 'https://planit.example.org', baseUrl: '/', canManageInvite: false }
const payload = buildEventSharePayload(event, options)
const results = []
const check = async (test, fn) => { await fn(); results.push({ test, result: 'PASS' }); console.log('PASS ' + test) }
await check('R7-B8-TC-03: payload allowlist, canonical URL, Unicode and no private fields', () => {
  assert.deepEqual(Object.keys(payload).sort(), ['text', 'title', 'url'])
  assert.ok(!JSON.stringify(payload).includes('PRIVATE'))
  assert.equal(payload.url, options.origin + '/events/' + event.id)
  assert.ok(payload.text.includes('20:00'))
  assert.ok(payload.text.includes('🎵'))
  assert.ok(buildEventSharePayload({ ...event, title: 'Familias 👨‍👩‍👧‍👦' }, options).title.includes('👨‍👩‍👧‍👦'))
})
await check('HTTPS public deployment, BASE_URL, no login/grant/local URLs', () => {
  for (const origin of ['http://planit.example.org', 'https://localhost', 'https://127.0.0.1', 'https://192.168.0.4', 'https://10.0.0.1', 'https://172.16.0.1', 'https://[::1]', 'https://foo.local', 'https://foo.local.', 'https://planit.example.org/login', 'https://user:secret@planit.example.org']) assert.throws(() => buildEventSharePayload(event, { ...options, origin }))
  for (const baseUrl of ['//evil.example/', '/../', '/app/../', 'https://evil.example/', '/app?x=1']) assert.throws(() => buildEventSharePayload(event, { ...options, baseUrl }))
  assert.equal(buildEventSharePayload(event, { ...options, baseUrl: '/app/' }).url, options.origin + '/app/events/' + event.id)
  for (const patch of [{ id: '../login' }, { starts_at: 'garbage' }, { starts_at: '2099-02-30T20:00:00' }, { visibility: 'private' }, { title: '\r\nPRIVATE' }]) assert.throws(() => buildEventSharePayload({ ...event, ...patch }, options))
})
await check('R7-B8-TC-02: unlisted organizer-only, no token invention and strict invite URL', () => {
  const hidden = { ...event, visibility: 'unlisted' }
  const inviteUrl = options.origin + '/invite#token=' + 'a'.repeat(64) // Synthetic only.
  assert.throws(() => buildEventSharePayload(hidden, { ...options, inviteUrl }))
  assert.throws(() => buildEventSharePayload(hidden, { ...options, canManageInvite: true }))
  const owner = { ...options, canManageInvite: true, inviteUrl }
  assert.equal(buildEventSharePayload(hidden, owner).url, inviteUrl)
  for (const inviteUrl of [options.origin + '/events/' + event.id, options.origin + '/invite?grant=foo', 'https://evil.example/invite#token=' + 'a'.repeat(64), options.origin + '/invite#token=hash', options.origin + '/invite?x=1#token=' + 'a'.repeat(64)]) assert.throws(() => buildEventSharePayload(hidden, { ...owner, inviteUrl }))
  for (const state of ['ended', 'cancelled', 'archived']) assert.throws(() => buildEventSharePayload({ ...hidden, state }, owner))
  assert.equal(buildEventSharePayload(hidden, { ...owner, baseUrl: '/app/', inviteUrl: options.origin + '/app/invite#token=' + 'b'.repeat(64) }).url.includes('/app/invite#'), true)
})
await check('R7-B8-TC-01: immediate native invocation, success, cancellation, errors', async () => {
  let invoked = false, copied = false
  const platform = { isSecureContext: true, share: async data => { invoked = true; assert.deepEqual(data, payload) }, writeText: async () => { copied = true } }
  const pending = shareEvent(payload, platform)
  assert.equal(invoked, true)
  assert.equal(await pending, 'shared')
  assert.equal(copied, false)
  for (const [name, expected] of [['AbortError', 'cancelled'], ['NotAllowedError', 'error'], ['TypeError', 'error']]) {
    assert.equal(await shareEvent(payload, { ...platform, share: () => Promise.reject({ name }) }), expected)
    assert.equal(copied, false)
  }
  assert.equal(await shareEvent(payload, { ...platform, share: () => { throw null } }), 'error')
})
await check('R7-B8-TC-01: unsupported, denied, absent/insecure clipboard; manual fallback', async () => {
  let calls = 0
  const platform = { isSecureContext: true, writeText: async text => { assert.equal(text, payload.url); calls++ } }
  assert.equal(await shareEvent(payload, platform), 'copied')
  assert.equal(calls, 1)
  assert.equal(await copyEventLink(payload, { ...platform, writeText: async () => { throw new Error('denied') } }), 'manual')
  assert.equal(await shareEvent(payload, { isSecureContext: true }), 'manual')
  assert.equal(await shareEvent(payload, { ...platform, isSecureContext: false, share: async () => { throw new Error('must not invoke') } }), 'manual')
  assert.equal(calls, 1)
})
await check('Argentina date independent of browser/system timezone', () => {
  const script = "import {buildEventSharePayload as build} from './src/features/events/share.ts';process.stdout.write(build(" + JSON.stringify(event) + ',' + JSON.stringify(options) + ').text)'
  const texts = ['UTC', 'Asia/Tokyo', 'America/Argentina/Buenos_Aires'].map(TZ => execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ }, encoding: 'utf8', windowsHide: true }))
  assert.equal(new Set(texts).size, 1)
})
await writeFile(out + '/contract-results.json', JSON.stringify({ environment: 'Node; synthetic inputs and browser API mocks; no HTTP/JWT or native chooser', results, payloadSnapshot: payload }, null, 2) + '\n')
