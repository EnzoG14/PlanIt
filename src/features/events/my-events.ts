import { supabase } from '../../lib/supabase'
import type { ParticipationStatus } from './participation'

export type MyEventsSection = 'organizing' | 'participating'
export type MyEventListItem = {
  id: string; title: string; starts_at: string; ends_at: string
  location_name: string | null; address: string; category_name: string
  event_state: 'open' | 'ended' | 'cancelled' | 'archived'
  participation_status: ParticipationStatus | null; image_path: string | null; imageUrl: string | null
}
export const myEventsPageSize = 30

export async function loadMyEvents(section: MyEventsSection, offset = 0) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_events', { p_section: section, p_offset: offset })
  if (error) throw error
  const rows = (data ?? []) as Omit<MyEventListItem, 'imageUrl'>[]
  const visible = rows.slice(0, myEventsPageSize)
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
  return { events: visible.map(row => ({ ...row, imageUrl: row.image_path ? urls.get(row.image_path) ?? null : null })), hasMore: rows.length > myEventsPageSize, imageError }
}

export function myEventsError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === '42501') return 'Tu sesión no tiene permiso para consultar esta lista. Volvé a ingresar o reintentá.'
  if (code === 'PGRST202') return 'Mis eventos todavía no está disponible. Volvé a intentar más tarde.'
  if (code === 'PGRST301' || code === 'PGRST303') return 'Tu sesión venció. Volvé a ingresar.'
  return 'No pudimos consultar tus eventos. Revisá la conexión y reintentá.'
}
