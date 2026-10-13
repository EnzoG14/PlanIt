import { supabase } from '../../lib/supabase'
import { loadMyInterests } from '../interests/api'
import type { SearchOrigin } from '../location/origin'
import type { EventPreview } from './discovery'

export type SuggestedEvent = EventPreview & { matches_interest: boolean; distance_km: number | null; starts_soon: boolean }
type SuggestionRow = Omit<SuggestedEvent, 'categoryName' | 'imageUrl'> & { category_name: string; image_path: string | null; has_interests: boolean }
export function eventEndsAt(event: Pick<EventPreview, 'ends_at'>) {
  // Own timestamps have no zone and always mean Argentina, regardless of browser TZ.
  return Date.parse(`${event.ends_at.replace(' ', 'T')}-03:00`)
}
export async function loadSuggestions(userId: string, origin: SearchOrigin | null, signal: AbortSignal) {
  const client = supabase
  if (!client) throw new Error('La conexión no está configurada.')
  // Reading preferences is required even for an empty response. A failed read must
  // never be mistaken for no interests. The RPC independently derives auth.uid().
  const interests = await loadMyInterests(userId, signal)
  const { data, error } = await client.rpc('get_suggested_events', {
    p_origin_lat: origin?.latitude ?? null, p_origin_lng: origin?.longitude ?? null, p_limit: 6,
  }).abortSignal(signal)
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('No pudimos leer tus sugerencias.')
  const rows = data as SuggestionRow[]
  const paths = [...new Set(rows.flatMap(row => row.image_path ? [row.image_path] : []))]
  const urls = new Map<string, string>()
  let imageError = false
  if (paths.length) {
    try {
      const signed = await client.storage.from('event_media').createSignedUrls(paths, 300)
      imageError = Boolean(signed.error || signed.data?.some(item => item.error || !item.signedUrl))
      signed.data?.forEach(item => { if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl) })
    } catch { imageError = true }
  }
  return { hasInterests: rows[0]?.has_interests ?? interests.length > 0, imageError,
    events: rows.map(row => ({ ...row, categoryName: row.category_name, imageUrl: row.image_path ? urls.get(row.image_path) ?? null : null })) }
}
