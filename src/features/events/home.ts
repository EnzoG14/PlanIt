import { supabase } from '../../lib/supabase'
import type { EventPreview } from './discovery'
import type { EventRecord } from './api'

export const homeEventsPageSize = 30
export type HomeEventsCursor = { starts_at: string; id: string }
type HomeEventRow = EventRecord & { category_name: string; image_path: string | null }

export async function loadHomeEvents(cursor: HomeEventsCursor | null = null) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_home_events', {
    p_before_starts_at: cursor?.starts_at ?? null,
    p_before_id: cursor?.id ?? null,
    p_limit: homeEventsPageSize,
  })
  if (error) throw error

  const rows = (data ?? []) as HomeEventRow[]
  const visible = rows.slice(0, homeEventsPageSize)
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

  const events: EventPreview[] = visible.map(row => ({
    ...row,
    categoryName: row.category_name,
    imageUrl: row.image_path ? urls.get(row.image_path) ?? null : null,
  }))
  const last = visible.at(-1)
  return {
    events,
    hasMore: rows.length > homeEventsPageSize,
    cursor: last ? { starts_at: last.starts_at, id: last.id } : cursor,
    imageError,
  }
}
