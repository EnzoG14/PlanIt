import { supabase } from '../../lib/supabase'
import type { ParticipationStatus } from './participation'
import { argentinaNow, formatEventTime } from './validation'

export type MyEventsSection = 'organizing' | 'participating'
export const organizedFilters = { all: 'Todos', upcoming: 'Próximos', past: 'Pasados', cancelled: 'Cancelados', archived: 'Archivados' } as const
export type OrganizedEventsFilter = keyof typeof organizedFilters

export function organizedFilter(value: string | null): OrganizedEventsFilter {
  return value && Object.hasOwn(organizedFilters, value) ? value as OrganizedEventsFilter : 'all'
}

export function myEventsPath(section: MyEventsSection, filter: OrganizedEventsFilter = 'all'): string {
  return section === 'organizing' ? `/my-events?section=organizing&filter=${filter}` : '/my-events?section=participating'
}

// Accept only the list's known internal routes; never redirect to arbitrary state URLs.
export function validatedMyEventsReturn(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!/^\/my-events\?section=(organizing|participating)(&filter=(all|upcoming|past|cancelled|archived))?$/.test(value)) return null
  const params = new URLSearchParams(value.split('?')[1])
  const section = params.get('section') as MyEventsSection
  return myEventsPath(section, organizedFilter(params.get('filter')))
}
export type MyEventListItem = {
  id: string; title: string; starts_at: string; ends_at: string
  location_name: string | null; address: string; category_name: string
  event_state: 'open' | 'ended' | 'cancelled' | 'archived'
  participation_status: ParticipationStatus | null; image_path: string | null; imageUrl: string | null
}
export const myEventsPageSize = 30

// Presentation only: starts_at is Argentina wall-clock text, so it is sliced and never parsed with the device zone.
const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export function eventStartTime(startsAt: string): string { return startsAt.slice(11, 16) }
export function eventDayLabel(startsAt: string, now = argentinaNow()): string {
  const [year, month, day] = startsAt.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return formatEventTime(startsAt)
  const date = new Date(Date.UTC(year, month - 1, day))
  const key = date.toISOString().slice(0, 10)
  const today = now.slice(0, 10)
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)
  const prefix = key === today ? 'Hoy · ' : key === tomorrow ? 'Mañana · ' : ''
  return `${prefix}${weekdays[date.getUTCDay()]} ${day} de ${months[month - 1]}${String(year) === now.slice(0, 4) ? '' : ` de ${year}`}`
}
// Consecutive grouping keeps the server order and the pagination untouched.
export function groupEventsByDay(events: MyEventListItem[]): { key: string; label: string; events: MyEventListItem[] }[] {
  const now = argentinaNow()
  const groups: { key: string; label: string; events: MyEventListItem[] }[] = []
  for (const event of events) {
    const key = event.starts_at.slice(0, 10), last = groups[groups.length - 1]
    if (last && last.key === key) last.events.push(event)
    else groups.push({ key, label: eventDayLabel(event.starts_at, now), events: [event] })
  }
  return groups
}

export async function loadMyEvents(section: MyEventsSection, offset = 0, filter: OrganizedEventsFilter = 'all') {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = section === 'organizing'
    ? await supabase.rpc('get_my_organized_events', { p_filter: filter, p_offset: offset })
    : await supabase.rpc('get_my_events', { p_section: section, p_offset: offset })
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
