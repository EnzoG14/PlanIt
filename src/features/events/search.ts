import { supabase } from '../../lib/supabase'
import type { MapBounds } from '../location/geolocation'
import type { EventRecord } from './api'
import type { EventPreview } from './discovery'

// Shared Inicio/Mapa filter contract (A03). Block 2 adds date/radius fields here.
export type DiscoveryFilters = { q: string; categoryIds: string[] }
export const emptyFilters: DiscoveryFilters = { q: '', categoryIds: [] }
export const searchQueryMaxLength = 100
const maxCategories = 50
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type SearchRow = EventRecord & { category_name: string; image_path: string | null }
export type SearchCursor = { starts_at: string; id: string }

export function normalizeFilters(filters: Partial<DiscoveryFilters>): DiscoveryFilters {
  const q = (filters.q ?? '').trim().slice(0, searchQueryMaxLength)
  const categoryIds = [...new Set((filters.categoryIds ?? []).filter(id => uuid.test(id)).map(id => id.toLowerCase()))].slice(0, maxCategories)
  return { q, categoryIds }
}
export const hasActiveFilters = (filters: DiscoveryFilters) => Boolean(filters.q || filters.categoryIds.length)
export function filtersFromParams(params: URLSearchParams): DiscoveryFilters {
  return normalizeFilters({ q: params.get('q') ?? '', categoryIds: (params.get('categories') ?? '').split(',') })
}
export function filtersToSearch(filters: DiscoveryFilters): string {
  const normalized = normalizeFilters(filters)
  const params = new URLSearchParams()
  if (normalized.q) params.set('q', normalized.q)
  if (normalized.categoryIds.length) params.set('categories', normalized.categoryIds.join(','))
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

export async function searchEvents(filters: DiscoveryFilters, options: { cursor?: SearchCursor | null; bounds?: MapBounds; limit: number }) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const normalized = normalizeFilters(filters)
  const { data, error } = await supabase.rpc('search_public_events', {
    p_query: normalized.q || null,
    p_category_ids: normalized.categoryIds.length ? normalized.categoryIds : null,
    p_before_starts_at: options.cursor?.starts_at ?? null,
    p_before_id: options.cursor?.id ?? null,
    p_limit: options.limit,
    p_south: options.bounds?.south ?? null, p_north: options.bounds?.north ?? null,
    p_west: options.bounds?.west ?? null, p_east: options.bounds?.east ?? null,
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
