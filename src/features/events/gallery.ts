import { supabase } from '../../lib/supabase'
import { imageTypes, maxImageBytes } from './validation'

export type GalleryImage = { id: string; file_id: string; sort_order: number; path: string; url: string }
export type ImageAttempt = { file: File; path: string; uploaded: boolean }
export class GalleryError extends Error {
  uncertain: boolean
  constructor(message: string, uncertain = false) { super(message); this.uncertain = uncertain }
}
export function galleryMessage(code = '', message = '') {
  if (message.includes('gallery_full')) return 'El evento ya tiene diez imágenes. Quitá una antes de agregar otra.'
  if (message.includes('gallery_changed')) return 'La galería cambió en otra sesión. Actualizá antes de ordenar.'
  if (message.includes('invalid_image') || code === '23514') return 'La imagen no es válida. Usá JPEG, PNG o WebP de hasta 5 MiB.'
  if (code === '42501') return 'Sólo el organizador puede administrar estas imágenes. Comprobá tu sesión.'
  if (code === 'PGRST202') return 'La gestión de imágenes todavía no está habilitada en este entorno.'
  return 'No pudimos confirmar el cambio. Actualizá la galería o reintentá la misma operación.'
}
export function imageValidation(file: File): string | null {
  return !imageTypes.includes(file.type) || file.size < 1 || file.size > maxImageBytes
    ? 'Seleccioná JPEG, PNG o WebP de hasta 5 MiB por imagen.' : null
}
export async function loadGallery(eventId: string): Promise<GalleryImage[]> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.from('event_images').select('id,file_id,sort_order,files(storage_path)').eq('event_id', eventId).order('sort_order')
  if (error) throw error
  const rows = (data ?? []).flatMap(row => {
    const file = Array.isArray(row.files) ? row.files[0] : row.files
    return file ? [{ id: row.id, file_id: row.file_id, sort_order: row.sort_order, path: file.storage_path }] : []
  })
  if (!rows.length) return []
  const signed = await supabase.storage.from('event_media').createSignedUrls(rows.map(row => row.path), 60)
  if (signed.error) throw new Error('No se pudieron renovar las fotos. Reintentá.')
  return rows.map(row => ({ ...row, url: signed.data?.find(file => file.path === row.path)?.signedUrl ?? '' }))
}
export async function removeImage(eventId: string, imageId: string) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { error } = await supabase.rpc('remove_event_image', { p_event_id: eventId, p_image_id: imageId })
  if (error) throw new GalleryError(galleryMessage(error.code, error.message), true)
}
export async function reorderImages(eventId: string, ids: string[], expected: string[]) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { error } = await supabase.rpc('reorder_event_images', { p_event_id: eventId, p_image_ids: ids, p_expected_ids: expected })
  if (error) throw new GalleryError(galleryMessage(error.code, error.message), true)
}
// Only unregistered objects can be removed under Storage RLS. Registered files
// are retained, including those shared by a future duplicate.
export async function cleanupUpload(path: string) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const result = await supabase.storage.from('event_media').remove([path])
  if (result.error) throw new Error('No pudimos limpiar la carga. Conservá esta pantalla y reintentá.')
}
export async function loadUnregisteredUploads(eventId: string): Promise<string[]> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_event_unregistered_uploads', { p_event_id: eventId })
  if (error) throw new GalleryError(galleryMessage(error.code, error.message))
  return (data ?? []).map((row: { storage_path: string }) => row.storage_path)
}
export async function addImage(eventId: string, attempt: ImageAttempt, progress: (message: string) => void): Promise<void> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const invalid = imageValidation(attempt.file)
  if (invalid) throw new GalleryError(invalid)
  try { const decoded = await createImageBitmap(attempt.file); decoded.close() }
  catch { throw new GalleryError('No pudimos leer la imagen. Elegí otro archivo JPEG, PNG o WebP válido.') }
  progress('Comprobando carga…')
  // Reconcile first: an earlier response may have been lost after commit.
  if ((await loadGallery(eventId)).some(image => image.path === attempt.path)) return
  if (!attempt.uploaded) {
    progress('Subiendo imagen…')
    const result = await supabase.storage.from('event_media').upload(attempt.path, attempt.file, { contentType: attempt.file.type, upsert: false })
    if (result.error && !['409', 'Duplicate'].includes(result.error.statusCode ?? '') && !/already exists|duplicate/i.test(result.error.message)) {
      // Keep the immutable path: interrupted uploads can have reached Storage.
      throw new GalleryError('La carga se interrumpió. Reintentá o descartala para limpiar el archivo.', true)
    }
    // A duplicate response is checked against Storage metadata by the RPC.
    attempt.uploaded = true
  }
  progress('Guardando imagen…')
  const { data, error } = await supabase.rpc('add_event_image', { p_event_id: eventId, p_storage_path: attempt.path })
  if (error) {
    const rollbackKnown = /^(23|22|42)/.test(error.code) || error.code === 'P0001' || error.code === 'PGRST202'
    if (rollbackKnown) {
      try { await cleanupUpload(attempt.path); attempt.uploaded = false }
      catch { throw new GalleryError(`${galleryMessage(error.code, error.message)} La limpieza quedó pendiente; reintentá o descartá.`, true) }
    }
    throw new GalleryError(galleryMessage(error.code, error.message), !rollbackKnown)
  }
  if (typeof data !== 'string' || !/^[0-9a-f-]{36}$/i.test(data)) throw new GalleryError('No pudimos confirmar la imagen guardada. Reintentá para comprobarla.', true)
}
