import { supabase } from '../../lib/supabase'
import { argentinaTimestamp, imageTypes, type Category, type EventValues } from './validation'

export type EventRecord = {
  id: string; organizer_id: string; title: string; description: string; starts_at: string; ends_at: string
  address: string; location_name: string | null; latitude: number; longitude: number; capacity: number
  category_id: string; visibility: string; cancelled_at: string | null; archived_at: string | null
}
export type PublishAttempt = { id: string; values: EventValues; files: File[]; paths: string[] }
export class PublicationError extends Error {
  uncertain: boolean
  constructor(message: string, uncertain = false) { super(message); this.uncertain = uncertain }
}
export async function loadCategories(): Promise<Category[]> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.from('categories').select('id,name,is_active').eq('is_active', true).order('name')
  if (error) throw error
  return data ?? []
}
export function publicationMessage(code?: string, message = ''): string {
  if (code === 'P0001') {
    if (message.includes('category_inactive')) return 'La categoría ya no está disponible. Elegí otra.'
    if (message.includes('start_not_future')) return 'La fecha de inicio ya pasó. Elegí una fecha futura.'
    if (message.includes('invalid_image')) return 'No se pudo verificar una foto. Volvé a seleccionarla.'
  }
  if (code === '23514' || code === '22P02' || code === '22007') return 'Revisá los datos: fechas, cupo y ubicación deben ser válidos.'
  if (code === '42501' || code === 'PGRST301') return 'No se pudo autorizar la publicación. Comprobá tu sesión e intentá nuevamente.'
  if (code === 'PGRST202' || code === 'PGRST205' || code === '42P01') return 'La publicación todavía no está habilitada. Intentá más tarde.'
  return 'No se pudo publicar. Revisá la conexión e intentá nuevamente.'
}
export async function publishEvent(attempt: PublishAttempt, userId: string, onProgress: (message: string) => void): Promise<string> {
  const client = supabase
  if (!client) throw new PublicationError('La conexión no está configurada.')
  async function cleanup(): Promise<boolean> {
    try {
      if (!attempt.paths.length) return true
      const result = await client!.storage.from('event_media').remove(attempt.paths)
      if (result.error) return false
      attempt.paths = []
      return true
    } catch { return false }
  }
  // The same UUID is retained on an uncertain response. The RPC is idempotent.
  onProgress('Comprobando publicación…')
  const existing = await client.from('events').select('id,organizer_id').eq('id', attempt.id).maybeSingle()
  if (existing.data?.organizer_id === userId) return existing.data.id
  if (existing.error) throw new PublicationError(publicationMessage(existing.error.code), !['42P01', 'PGRST205'].includes(existing.error.code))
  try {
    for (let index = 0; index < attempt.files.length; index += 1) {
      const file = attempt.files[index]
      const extension = ['jpg', 'png', 'webp'][imageTypes.indexOf(file.type)]
      const path = attempt.paths[index] ?? `${userId}/${attempt.id}/${crypto.randomUUID()}.${extension}`
      // Track before uploading: a lost response may still have stored the object.
      attempt.paths[index] = path
      onProgress(`Subiendo foto ${index + 1} de ${attempt.files.length}…`)
      const uploaded = await client.storage.from('event_media').upload(path, file, { contentType: file.type, upsert: false })
      // On retry, an already uploaded immutable path is verified by the RPC.
      if (uploaded.error && !['409', 'Duplicate'].includes(uploaded.error.statusCode ?? '')) throw new PublicationError('No se pudieron subir las fotos. Revisá la conexión y reintentá.')
    }
  } catch (error) {
    const cleaned = await cleanup()
    throw new PublicationError(`${error instanceof Error ? error.message : 'No se pudieron subir las fotos.'}${!cleaned ? ' La limpieza quedó pendiente; el reintento usará los mismos archivos.' : ''}`, !cleaned)
  }
  onProgress('Publicando evento…')
  try {
    const result = await client.rpc('create_event', {
      p_id: attempt.id, p_title: attempt.values.title.trim(), p_description: attempt.values.description.trim(),
      p_starts_at: argentinaTimestamp(attempt.values.start_date, attempt.values.start_time), p_ends_at: argentinaTimestamp(attempt.values.end_date, attempt.values.end_time),
      p_category_id: attempt.values.category_id, p_capacity: Number(attempt.values.capacity),
      p_location_name: attempt.values.location_name.trim() || null, p_address: attempt.values.address.trim(),
      p_latitude: Number(attempt.values.latitude), p_longitude: Number(attempt.values.longitude), p_image_paths: attempt.paths,
    })
    if (result.error) {
      // Only a PostgreSQL response proves rollback. Network/PostgREST failures
      // can arrive after commit: preserve uploads and retry the same operation.
      const rollbackKnown = /^(23|22|42)/.test(result.error.code) || result.error.code === 'P0001' || result.error.code === 'PGRST202'
      if (rollbackKnown && attempt.paths.length) {
        if (!await cleanup()) throw new PublicationError(`${publicationMessage(result.error.code, result.error.message)} La limpieza de fotos quedó pendiente; reintentá la misma publicación.`, true)
      }
      throw new PublicationError(publicationMessage(result.error.code, result.error.message), !rollbackKnown)
    }
    if (typeof result.data !== 'string' || result.data !== attempt.id) throw new PublicationError('No pudimos confirmar la publicación. Reintentá para comprobarla.', true)
    return result.data
  } catch (error) {
    if (error instanceof PublicationError) throw error
    throw new PublicationError('No pudimos confirmar la publicación. Reintentá para comprobarla.', true)
  }
}
export async function loadEvent(id: string): Promise<EventRecord | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.from('events').select('id,organizer_id,title,description,starts_at,ends_at,address,location_name,latitude,longitude,capacity,category_id,visibility,cancelled_at,archived_at').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
export async function loadEventOrganizer(eventId: string): Promise<{ display_name: string; username: string } | null> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_event_organizer', { p_event_id: eventId })
  if (error) throw error
  const organizer = data?.[0]
  return organizer ? { display_name: organizer.display_name, username: organizer.username } : null
}
export async function loadEventImages(id: string): Promise<string[]> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.from('event_images').select('files(storage_path)').eq('event_id', id).order('sort_order')
  if (error) throw error
  const paths = (data ?? []).flatMap(row => (Array.isArray(row.files) ? row.files : [row.files]).filter(Boolean).map(file => file.storage_path))
  if (!paths.length) return []
  const signed = await supabase.storage.from('event_media').createSignedUrls(paths, 300)
  if (signed.error) throw new Error('No se pudieron cargar las fotos.')
  return signed.data?.flatMap(file => file.signedUrl ? [file.signedUrl] : []) ?? []
}
