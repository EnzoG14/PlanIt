import { ImageMagick, MagickColors, MagickFormat } from 'magick'
import { createImageDecoder } from './decoder.ts'

Deno.test('pinned WASM decodes admitted images and rejects truncation in Deno', async () => {
  const path = import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.44/magick.wasm')
  const decode = await createImageDecoder(await Deno.readFile(new URL(path)))
  for (const [mime, format] of [
    ['image/jpeg', MagickFormat.Jpeg], ['image/png', MagickFormat.Png], ['image/webp', MagickFormat.WebP],
  ] as const) {
    const bytes = ImageMagick.read(MagickColors.Red, 2, 2, image => image.write(format, data => new Uint8Array(data)))
    decode(bytes, mime)
    let rejected = false
    try { decode(bytes.slice(0, 12), mime) } catch { rejected = true }
    if (!rejected) throw new Error('truncated_image_accepted')
  }
})
