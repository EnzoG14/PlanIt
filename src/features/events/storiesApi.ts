import { supabase } from '../../lib/supabase'

// B5 consumes this API; no route, UI, cached bytes or signed URLs in B4.
export type StoryCursor = { created_at: string; id: string }
export type EventStory = StoryCursor & {
  event_id: string
  author_id: string
  display_name: string
  username: string
  file_id: string
  bucket_name: 'event_media'
  storage_path: string
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp'
  size_bytes: number
  expires_at: string
}
export type StoryPage = { server_now: string; items: EventStory[]; next_cursor: StoryCursor | null }
export type StoryErrorCode = 'unavailable' | 'read_only' | 'conflict' | 'invalid' | 'unverified' | 'uncertain'
export class StoryApiError extends Error {
  readonly code: StoryErrorCode
  readonly uncertain: boolean
  constructor(code: StoryErrorCode, message: string) { super(message); this.code = code; this.uncertain = code === 'uncertain' }
}

export function storyFailure(cause: unknown): StoryApiError {
  if (cause instanceof StoryApiError) return cause
  const message = typeof cause === 'object' && cause !== null && 'message' in cause ? String(cause.message) : ''
  const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : ''
  if (code === '42501') return new StoryApiError('unavailable', 'La historia no está disponible o ya no tenés acceso al evento.')
  if (/event_read_only/.test(message)) return new StoryApiError('read_only', 'El evento ya terminó, se canceló o se archivó. No admite nuevas historias.')
  if (/story_conflict|media_conflict/.test(message)) return new StoryApiError('conflict', 'Este intento ya está asociado a otro contenido. Volvé a consultar las historias.')
  if (/image_verification_required/.test(message)) return new StoryApiError('unverified', 'La imagen necesita validación del servidor antes de publicar.')
  if (['22023', '23514', 'P0001'].includes(code)) return new StoryApiError('invalid', 'No pudimos publicar la imagen. Revisá el archivo y el intento.')
  return new StoryApiError('uncertain', 'No pudimos confirmar el resultado. Conservá el mismo identificador y archivo antes de reintentar.')
}

// Caller uploads with createMediaAttempt(file,eventId,'story') + uploadEventMedia.
// Keep storyId and fileId across uncertain retries. Upload alone is not publication.
export async function publishEventStory(eventId: string, storyId: string, fileId: string): Promise<string> {
  if (!supabase) throw new StoryApiError('unavailable', 'La conexión no está disponible.')
  try {
    const { data, error } = await supabase.rpc('publish_event_story', { p_event_id: eventId, p_story_id: storyId, p_file_id: fileId })
    if (error) throw error
    if (data !== storyId) throw new Error('unconfirmed_story')
    return data
  } catch (cause) { throw storyFailure(cause) }
}

export async function loadEventStories(eventId: string, cursor: StoryCursor | null = null, limit = 30, signal?: AbortSignal): Promise<StoryPage> {
  if (!supabase) throw new StoryApiError('unavailable', 'La conexión no está disponible.')
  try {
    let query = supabase.rpc('get_event_stories', { p_event_id: eventId, p_before_at: cursor?.created_at ?? null, p_before_id: cursor?.id ?? null, p_limit: limit })
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query
    if (error) throw error
    if (!data || typeof data.server_now !== 'string' || !Array.isArray(data.items)
      || data.items.some((s: EventStory) => s.event_id !== eventId || s.bucket_name !== 'event_media' || !s.storage_path?.startsWith('r7/stories/')))
      throw new Error('invalid_story_page')
    return data as StoryPage
  } catch (cause) { throw storyFailure(cause) }
}

// The Edge reader checks Auth and server TTL both before and after Storage I/O.
// B5 must discard responses on session/route change and revoke its Blob URLs.
export async function downloadStoryImage(storyId: string, userId: string, signal: AbortSignal): Promise<Blob> {
  if (!supabase) throw new StoryApiError('unavailable', 'La conexión no está disponible.')
  try {
    const identity = await supabase.auth.getUser()
    if (identity.error || identity.data.user?.id !== userId) throw new StoryApiError('unavailable', 'La sesión cambió. Volvé a abrir las historias.')
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session || data.session.user.id !== userId) throw new StoryApiError('unavailable', 'La sesión cambió. Volvé a abrir las historias.')
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r7-story-image?story_id=${encodeURIComponent(storyId)}`, {
      headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY! }, cache: 'no-store', signal,
    })
    if (!response.ok) throw new StoryApiError('unavailable', 'La historia venció o ya no tenés permiso para verla.')
    const blob = await response.blob()
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size < 1 || blob.size > 5242880) throw new Error('invalid_image')
    return blob
  } catch (cause) { throw storyFailure(cause) }
}
