import { supabase } from '../../lib/supabase'
import type { Coordinates, MapBounds } from '../location/geolocation'
import type { EventRecord } from './api'
import type { EventPreview } from './discovery'

// Shared Inicio/Mapa filter contract (A03). Dates are Argentina calendar days
// (YYYY-MM-DD) matched on starts_at; dateTo needs dateFrom (one day = dateFrom only).
// The radius origin (GPS / map centre) is deliberately NOT part of this URL state.
export const radiusOptions = [5, 10, 25, 50, 100] as const
export type DiscoveryFilters = { q: string; categoryIds: string[]; dateFrom: string; dateTo: string; radiusKm: number | null }
export const emptyFilters: DiscoveryFilters = { q: '', categoryIds: [], dateFrom: '', dateTo: '', radiusKm: null }
export const searchQueryMaxLength = 100
const maxCategories = 50
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type SearchRow = EventRecord & { category_name: string; image_path: string | null }
export type SearchCursor = { starts_at: string; id: string }

export function validDay(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (year < 2000 || year > 2100) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}
// Lexicographic order of YYYY-MM-DD is chronological, so no Date/time zone is involved.
export function dateRangeError(from: string, to: string): string | null {
  if (from && !validDay(from)) return 'La fecha de inicio no es válida.'
  if (to && !validDay(to)) return 'La fecha final no es válida.'
  if (to && !from) return 'Elegí primero la fecha de inicio.'
  if (from && to && to < from) return 'La fecha final no puede ser anterior a la inicial.'
  return null
}
export function normalizeFilters(filters: Partial<DiscoveryFilters>): DiscoveryFilters {
  const q = (filters.q ?? '').trim().slice(0, searchQueryMaxLength)
  const categoryIds = [...new Set((filters.categoryIds ?? []).filter(id => uuid.test(id)).map(id => id.toLowerCase()))].slice(0, maxCategories)
  const from = (filters.dateFrom ?? '').trim()
  const to = (filters.dateTo ?? '').trim()
  const dates = dateRangeError(from, to) ? { dateFrom: '', dateTo: '' } : { dateFrom: from, dateTo: to }
  const radiusKm = radiusOptions.find(option => option === filters.radiusKm) ?? null
  return { q, categoryIds, ...dates, radiusKm }
}
export const hasActiveFilters = (filters: DiscoveryFilters) => Boolean(filters.q || filters.categoryIds.length || filters.dateFrom || filters.radiusKm)
export function filtersFromParams(params: URLSearchParams): DiscoveryFilters {
  return normalizeFilters({ q: params.get('q') ?? '', categoryIds: (params.get('categories') ?? '').split(','), dateFrom: params.get('from') ?? '', dateTo: params.get('to') ?? '', radiusKm: Number(params.get('radius')) || null })
}
export function filtersToSearch(filters: DiscoveryFilters): string {
  const normalized = normalizeFilters(filters)
  const params = new URLSearchParams()
  if (normalized.q) params.set('q', normalized.q)
  if (normalized.categoryIds.length) params.set('categories', normalized.categoryIds.join(','))
  if (normalized.dateFrom) params.set('from', normalized.dateFrom)
  if (normalized.dateTo) params.set('to', normalized.dateTo)
  if (normalized.radiusKm) params.set('radius', String(normalized.radiusKm))
  const text = params.toString()
  return text ? `?${text}` : ''
}
export const filtersKey = (filters: DiscoveryFilters) => filtersToSearch(filters)
// Detail pages only trust /home or /map plus re-serialized, sanitized filters.
export function validatedDiscoveryReturn(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^(\/home|\/map)(\?[^#]*)?$/.exec(value)
  if (!match) return null
  return `${match[1]}${filtersToSearch(filtersFromParams(new URLSearchParams(match[2] ?? '')))}`
}
let remembered: DiscoveryFilters = emptyFilters
export const rememberFilters = (filters: DiscoveryFilters) => { remembered = normalizeFilters(filters) }
export const rememberedFilters = () => remembered

export async function searchEvents(filters: DiscoveryFilters, options: { cursor?: SearchCursor | null; bounds?: MapBounds; origin?: Coordinates | null; limit: number }) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const normalized = normalizeFilters(filters)
  // A radius without a known origin must never be answered as if distance had been computed.
  if (normalized.radiusKm && !options.origin) throw new Error('radius_origin_required')
  const { data, error } = await supabase.rpc('search_public_events', {
    p_query: normalized.q || null,
    p_category_ids: normalized.categoryIds.length ? normalized.categoryIds : null,
    p_before_starts_at: options.cursor?.starts_at ?? null,
    p_before_id: options.cursor?.id ?? null,
    p_limit: options.limit,
    p_south: options.bounds?.south ?? null, p_north: options.bounds?.north ?? null,
    p_west: options.bounds?.west ?? null, p_east: options.bounds?.east ?? null,
    p_date_from: normalized.dateFrom || null, p_date_to: normalized.dateTo || null,
    p_origin_lat: normalized.radiusKm ? options.origin!.latitude : null, p_origin_lng: normalized.radiusKm ? options.origin!.longitude : null,
    p_radius_km: normalized.radiusKm,
  })
  if (error) throw error
  const rows = (data ?? []) as SearchRow[]
  const visible = rows.slice(0, options.limit)
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
  const events: EventPreview[] = visible.map(row => ({ ...row, categoryName: row.category_name, imageUrl: row.image_path ? urls.get(row.image_path) ?? null : null }))
  const last = visible.at(-1)
  return { events, hasMore: rows.length > options.limit, cursor: last ? { starts_at: last.starts_at, id: last.id } : options.cursor ?? null, imageError }
}
