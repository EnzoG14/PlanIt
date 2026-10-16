import type { SupabaseClient } from '@supabase/supabase-js'
import { validateMediaImage } from './images'

export type MediaPurpose = 'chat' | 'story'
export type MediaAttempt = Readonly<{
  file: File
  eventId: string
  purpose: MediaPurpose
  fileId: string
  attemptId: string
}>
export type ReservedMedia = {
  file_id: string
  attempt_id: string
  bucket_name: 'event_media'
  storage_path: string
}
export class MediaUploadError extends Error {
  readonly uncertain: boolean
  constructor(message: string, uncertain = false) { super(message); this.uncertain = uncertain }
}

// Preserve this object across retries. Replacing the selected file starts a new
// attempt; never mutate/reuse a reservation for different bytes.
export function createMediaAttempt(file: File, eventId: string, purpose: MediaPurpose): MediaAttempt {
  return Object.freeze({ file, eventId, purpose, fileId: crypto.randomUUID(), attemptId: crypto.randomUUID() })
}

export async function uploadEventMedia(client: SupabaseClient, attempt: MediaAttempt): Promise<ReservedMedia> {
  const mime = await validateMediaImage(attempt.file)
  const { data, error } = await client.rpc('reserve_event_media_upload', {
    p_event_id: attempt.eventId, p_attempt_id: attempt.attemptId, p_file_id: attempt.fileId,
    p_purpose: attempt.purpose, p_mime_type: mime, p_size_bytes: attempt.file.size,
  })
  if (error) throw new MediaUploadError('No pudimos reservar la carga. Comprobá tu acceso y reintentá el mismo intento.', true)
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime]
  const namespace = attempt.purpose === 'chat' ? 'chat' : 'stories'
  const reservation = data as Partial<ReservedMedia> | null
  const segments = reservation?.storage_path?.split('/')
  if (reservation?.file_id !== attempt.fileId || reservation.attempt_id !== attempt.attemptId
    || reservation.bucket_name !== 'event_media' || segments?.length !== 5
    || segments[0] !== 'r7' || segments[1] !== namespace || !/^[0-9a-f-]{36}$/.test(segments[2])
    || segments[3] !== attempt.eventId || segments[4] !== `${attempt.attemptId}.${extension}`) {
    throw new MediaUploadError('No pudimos confirmar la reserva. Conservá el intento y reintentá.', true)
  }
  // ArrayBuffer selects the SDK's raw upload branch. File/Blob would use
  // multipart cacheControl=max-age=..., incompatible with exact no-store.
  const result = await client.storage.from('event_media').upload(reservation.storage_path!, await attempt.file.arrayBuffer(), {
    contentType: mime, upsert: false, headers: { 'cache-control': 'no-store' },
  })
  if (result.error && !['409', 'Duplicate'].includes(result.error.statusCode ?? '')
    && !/already exists|duplicate/i.test(result.error.message)) {
    throw new MediaUploadError('La carga se interrumpió. Reintentá con la misma imagen.', true)
  }
  const state = await client.rpc('get_event_media_upload_state', { p_file_id: attempt.fileId })
  if (state.error || state.data?.uploaded !== true || !['reserved', 'published'].includes(state.data?.state)) {
    throw new MediaUploadError('No pudimos confirmar el archivo subido. Conservá el intento y reintentá.', true)
  }
  const validation = await client.functions.invoke('r7-media-validate', { body: { file_id: attempt.fileId } })
  if (validation.error || validation.data?.verified !== true || validation.data?.file_id !== attempt.fileId) {
    throw new MediaUploadError('No pudimos validar la imagen en el servidor. Reintentá con el mismo intento.', true)
  }
  // Uploaded is not published. B2/B4 must commit their own domain RPC, then
  // reconcile its UUID. Never delete on timeout or call this a sent message.
  return reservation as ReservedMedia
}
