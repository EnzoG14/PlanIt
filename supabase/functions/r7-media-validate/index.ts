import { createImageDecoder } from './decoder.ts'
import { createMediaValidationHandler } from './handler.ts'

const url = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !anonKey || !serviceKey) throw new Error('media_runtime_unconfigured')

// Exact pinned package asset, integrity checked before instantiation. No dynamic
// unversioned code/asset, no secret in this URL; no per-request CDN image upload.
const wasm = new Uint8Array(await (await fetch('https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.44/dist/x86/magick.wasm', {
  signal: AbortSignal.timeout(30000), redirect: 'error',
})).arrayBuffer())
const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', wasm)), b => b.toString(16).padStart(2, '0')).join('')
if (hash !== 'b7d6710436b150dc5bd1ca04d80b6b7614c54854d7470f888f7e69a2a41b00e4') throw new Error('decoder_integrity_failed')
const decode = await createImageDecoder(wasm)
Deno.serve(createMediaValidationHandler({ url, anonKey, serviceKey }, decode))
