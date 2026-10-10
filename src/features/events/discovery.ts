import { supabase } from '../../lib/supabase'
import type { MapBounds } from '../location/geolocation'
import type { EventRecord } from './api'

export type EventPreview = EventRecord & { categoryName: string; imageUrl: string | null }
type DiscoveryRow = EventRecord & { category_name: string; image_path: string | null }
export async function discoverEvents(bounds: MapBounds): Promise<{ events: EventPreview[]; truncated: boolean; imageError: boolean }> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  // Server-side clock and visibility predicates; engine-independent domain data.
  const { data, error } = await supabase.rpc('discover_public_events', {
    p_south: bounds.south, p_north: bounds.north, p_west: bounds.west, p_east: bounds.east,
  })
  if (error) throw error
  const rows = (data ?? []) as DiscoveryRow[]
  const visible = rows.slice(0, 100)
  const paths = [...new Set(visible.flatMap(row => row.image_path ? [row.image_path] : []))]
  const urls = new Map<string, string>()
  let imageError = false
  if (paths.length) {
    try {
      const signed = await supabase.storage.from('event_media').createSignedUrls(paths, 300)
      imageError = Boolean(signed.error || signed.data?.some(item => item.error))
      signed.data?.forEach(item => { if (item.signedUrl && item.path) urls.set(item.path, item.signedUrl) })
    } catch { imageError = true }
  }
  return { events: visible.map(row => ({ ...row, categoryName: row.category_name, imageUrl: row.image_path ? urls.get(row.image_path) ?? null : null })), truncated: rows.length > 100, imageError }
}
