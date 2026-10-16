import { ImageMagick, MagickFormat, MagickColors, MagickReadSettings, initializeImageMagick, ResourceLimits } from 'magick'

export async function createImageDecoder(wasm: Uint8Array) {
  await initializeImageMagick(wasm)
  // Bound decoder resources, not a product quota. Resource exhaustion fails
  // closed without an attestation. WASM has no network delegates or host files.
  ResourceLimits.memory = 96n * 1024n * 1024n
  ResourceLimits.maxMemoryRequest = 96n * 1024n * 1024n
  ResourceLimits.disk = 0n
  ResourceLimits.time = 5n
  ResourceLimits.listLength = 8n
  const formats: Record<string, MagickFormat> = {
    'image/jpeg': MagickFormat.Jpeg, 'image/png': MagickFormat.Png, 'image/webp': MagickFormat.WebP,
  }
  return (bytes: Uint8Array, mime: string): void => {
    if (!formats[mime] || bytes.length < 1 || bytes.length > 5242880) throw new Error('invalid_image')
    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
    const actual = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
      : bytes.slice(0, 8).length === 8 && bytes.slice(0, 8).every((b, i) => b === [137,80,78,71,13,10,26,10][i]) ? 'image/png'
        : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? 'image/webp' : null
    if (actual !== mime) throw new Error('invalid_image')
    // Force only the admitted decoder; never sniff arbitrary SVG/PDF/delegates.
    ImageMagick.read(MagickColors.Transparent, 1, 1, image => {
      let warning = false
      image.onWarning = () => { warning = true }
      image.read(bytes, new MagickReadSettings({ format: formats[mime] }))
      if (warning || image.width < 1 || image.height < 1) throw new Error('invalid_image')
      // read() decodes pixels; signature/header recognition alone is insufficient.
    })
  }
}
