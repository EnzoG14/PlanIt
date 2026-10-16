import { imageTypes, maxImageBytes } from '../validation'

export type MediaImageType = 'image/jpeg' | 'image/png' | 'image/webp'

export function mediaImageError(file: Pick<Blob, 'type' | 'size'>): string | null {
  if (!imageTypes.includes(file.type)) return 'Elegí una imagen JPEG, PNG o WebP.'
  if (file.size < 1 || file.size > maxImageBytes) return 'La imagen debe pesar entre 1 byte y 5 MiB.'
  return null
}

// This improves selection feedback; the database independently checks actual
// Storage metadata. Browser decoding is not a trusted server byte inspection.
export async function validateMediaImage(file: Blob): Promise<MediaImageType> {
  const error = mediaImageError(file)
  if (error) throw new Error(error)
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  const detected = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg'
    : bytes.length >= 8 && bytes.slice(0, 8).every((byte, i) => byte === [137, 80, 78, 71, 13, 10, 26, 10][i]) ? 'image/png'
      : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? 'image/webp' : null
  if (detected !== file.type) throw new Error('El contenido no coincide con un archivo JPEG, PNG o WebP válido.')
  try {
    const decoded = await createImageBitmap(file)
    decoded.close()
  } catch { throw new Error('No pudimos leer la imagen. Elegí otro archivo válido.') }
  return detected
}
