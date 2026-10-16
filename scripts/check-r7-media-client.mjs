import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import ts from 'typescript'

const results = []
const record = test => { results.push({ test, result: 'PASS' }); console.log('PASS:', test) }
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText).toString('base64')
const validation = moduleUrl(await readFile('src/features/events/validation.ts', 'utf8'))
const imagesUrl = moduleUrl((await readFile('src/features/events/media/images.ts', 'utf8')).replace("'../validation'", JSON.stringify(validation)))
const images = await import(imagesUrl)
const uploads = await import(moduleUrl((await readFile('src/features/events/media/uploads.ts', 'utf8')).replace("'./images'", JSON.stringify(imagesUrl))))
let closed = 0
globalThis.createImageBitmap = async () => ({ close: () => { closed++ } })
const png = new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], 'fixture.png', { type: 'image/png' })
assert.equal(await images.validateMediaImage(png), 'image/png')
assert.equal(closed, 1)
assert.ok(images.mediaImageError({ type: 'image/png', size: 0 }))
assert.ok(images.mediaImageError({ type: 'image/png', size: 5242881 }))
assert.equal(images.mediaImageError({ type: 'image/png', size: 5242880 }), null)
for (const file of [new Blob(['GIF89a'], { type: 'image/gif' }), new Blob(['fake'], { type: 'image/png' }), new Blob([new Uint8Array([255,216,255])], { type: 'image/png' })]) {
  await assert.rejects(images.validateMediaImage(file))
}
globalThis.createImageBitmap = async () => { throw new Error('decode failed') }
await assert.rejects(images.validateMediaImage(png), /leer la imagen/)
globalThis.createImageBitmap = async () => ({ close() {} })
record('Size boundaries, MIME allowlist, spoofed magic and decode failure rejected; bitmap closed (decoder stub, not real browser)')

const attempt = uploads.createMediaAttempt(png, crypto.randomUUID(), 'chat')
assert.ok(Object.isFrozen(attempt))
const reservations = [], transfers = []
let duplicate = false, badState = false, interrupted = false, forged = false
const reservation = {
  file_id: attempt.fileId, attempt_id: attempt.attemptId, bucket_name: 'event_media',
  storage_path: `r7/chat/${crypto.randomUUID()}/${attempt.eventId}/${attempt.attemptId}.png`,
}
const client = {
  functions: { invoke: async () => ({ data: { file_id: attempt.fileId, verified: true }, error: null }) },
  rpc: async (name, args) => {
    if (name === 'reserve_event_media_upload') {
      reservations.push(args)
      return { data: forged ? { ...reservation, file_id: crypto.randomUUID() } : reservation, error: null }
    }
    assert.equal(name, 'get_event_media_upload_state')
    return { data: { state: 'reserved', uploaded: !badState }, error: null }
  },
  storage: { from: bucket => {
    assert.equal(bucket, 'event_media')
    return { upload: async (path, bytes, options) => {
      transfers.push({ path, bytes, options })
      return { error: interrupted ? { statusCode: '500', message: 'interrupted' } : duplicate ? { statusCode: '409', message: 'duplicate' } : null }
    } }
  } },
}
assert.deepEqual(await uploads.uploadEventMedia(client, attempt), reservation)
duplicate = true
assert.deepEqual(await uploads.uploadEventMedia(client, attempt), reservation)
assert.deepEqual(reservations[0], reservations[1])
assert.equal(transfers[0].options.upsert, false)
assert.equal(transfers[0].options.headers['cache-control'], 'no-store')
assert.ok(transfers[0].bytes instanceof ArrayBuffer)
badState = true
await assert.rejects(uploads.uploadEventMedia(client, attempt), e => e.uncertain && /confirmar el archivo/.test(e.message))
interrupted = true
await assert.rejects(uploads.uploadEventMedia(client, attempt), e => e.uncertain && /interrumpió/.test(e.message))
forged = true
const count = transfers.length
await assert.rejects(uploads.uploadEventMedia(client, attempt), /confirmar la reserva/)
assert.equal(transfers.length, count)
record('Immutable retry IDs/path, raw no-store upload, 409 requires server reconciliation, failure never publishes or deletes, forged reservation rejected (API stub)')
await mkdir('docs/qa/r7-block-1', { recursive: true })
await writeFile('docs/qa/r7-block-1/client-results.json', JSON.stringify({
  environment: 'Node 24; transpiled actual TS helpers; decoder and Supabase API stubs. No HTTP/Storage/browser validation.',
  results, result: 'PASS',
}, null, 2) + '\n')
