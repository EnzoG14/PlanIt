import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import ts from 'typescript'

const tools = process.env.PLANIT_MEDIA_TOOLS_DIR ?? '.r7-test-tools.local/node_modules'
const codecUrl = pathToFileURL(resolve(tools, '@imagemagick/magick-wasm/dist/index.js')).href
const codec = await import(codecUrl)
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText).toString('base64')
const base = 'supabase/functions/r7-media-validate/'
const { createImageDecoder } = await import(moduleUrl((await readFile(base+'decoder.ts','utf8')).replace("'magick'",JSON.stringify(codecUrl))))
const wasm = new Uint8Array(await readFile(resolve(tools,'@imagemagick/magick-wasm/dist/x86/magick.wasm')))
assert.equal(createHash('sha256').update(wasm).digest('hex'),'b7d6710436b150dc5bd1ca04d80b6b7614c54854d7470f888f7e69a2a41b00e4')
const decode = await createImageDecoder(wasm)
const results = []
const record = test => { results.push({test,result:'PASS'}); console.log('PASS:',test) }
const fixtures = new Map()
for(const [mime,format] of [['image/jpeg',codec.MagickFormat.Jpeg],['image/png',codec.MagickFormat.Png],['image/webp',codec.MagickFormat.WebP]]){
  const bytes = codec.ImageMagick.read(codec.MagickColors.Red,2,2,image=>image.write(format,data=>new Uint8Array(data)))
  fixtures.set(mime,bytes)
  decode(bytes,mime)
  assert.throws(()=>decode(bytes.slice(0,12),mime))
  assert.throws(()=>decode(bytes,mime==='image/png'?'image/jpeg':'image/png'))
}
assert.throws(()=>decode(new Uint8Array(0),'image/png'))
assert.throws(()=>decode(new Uint8Array(5242881),'image/png'))
assert.throws(()=>decode(new TextEncoder().encode('GIF89a'),'image/gif'))
record('Actual pinned WASM decodes JPEG/PNG/WebP pixel data; truncation, false MIME/magic, GIF, empty and oversize rejected; asset SHA-256 verified')

const { createMediaValidationHandler }=await import(moduleUrl(await readFile(base+'handler.ts','utf8')))
const viewer=crypto.randomUUID(),fid=crypto.randomUUID(),oid=crypto.randomUUID(),eid=crypto.randomUUID()
const image=fixtures.get('image/png')
const target={file_id:fid,storage_path:'r7/chat/'+viewer+'/'+eid+'/'+crypto.randomUUID()+'.png',mime_type:'image/png',size_bytes:image.length,object_id:oid,etag:'fixture-etag'}
const calls=[]
let unauthorized=false,unavailable=false,changed=false,badBytes=false
const fakeFetch=async(url,options)=>{
  calls.push({url,options})
  if(url.endsWith('/auth/v1/user'))return Response.json(unauthorized?{}:{id:viewer},{status:unauthorized?401:200})
  if(url.endsWith('/get_r7_media_validation_target'))return Response.json(unavailable?null:target)
  if(url.includes('/object/authenticated/'))return new Response(badBytes?new Uint8Array(image.length):image)
  assert.ok(url.endsWith('/complete_r7_media_validation'))
  const args=JSON.parse(options.body)
  assert.equal(args.p_viewer_id,viewer);assert.equal(args.p_object_id,oid);assert.equal(args.p_etag,'fixture-etag')
  assert.equal(args.p_sha256,createHash('sha256').update(image).digest('hex'))
  return Response.json(!changed,{status:changed?403:200})
}
const handler=createMediaValidationHandler({url:'https://fixture.invalid',anonKey:'test-public',serviceKey:'test-server'},decode,fakeFetch)
const req=(body={file_id:fid},auth=true)=>new Request('https://edge.invalid',{method:'POST',headers:auth?{Authorization:'Bearer fixture'}:{},body:JSON.stringify(body)})
assert.equal((await handler(req())).status,200)
assert.equal((await handler(req({},false))).status,401)
assert.equal((await handler(req({file_id:fid,user_id:viewer}))).status,400)
unauthorized=true;assert.equal((await handler(req())).status,401);unauthorized=false
unavailable=true;assert.equal((await handler(req())).status,403);unavailable=false
badBytes=true;assert.equal((await handler(req())).status,422);badBytes=false
changed=true;assert.equal((await handler(req())).status,409);changed=false
const response=await handler(req())
assert.equal(response.headers.get('Cache-Control'),'no-store')
const output=await response.text()
assert.ok(!output.includes('storage_path')&&!output.includes('test-server')&&!output.includes('signed'))
assert.ok(calls.every(call=>call.options.redirect==='error'))
record('Edge handler validates Auth identity, ignores client identity/path, rejects unauthorized and corrupt images, hashes bytes, handles revalidation race, no URLs/secrets in response (HTTP dependencies stubbed)')
await mkdir('docs/qa/r7-block-1',{recursive:true})
await writeFile('docs/qa/r7-block-1/edge-results.json',JSON.stringify({environment:'Node 24 executing actual handler/decoder TS with real ImageMagick WASM; Auth/Storage/PostgREST HTTP stubs. Deno/Supabase deployment NOT RUN.',results,result:'PASS'},null,2)+'\n')
