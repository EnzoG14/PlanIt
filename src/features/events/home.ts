import { emptyFilters, searchEvents, type DiscoveryFilters, type SearchCursor } from './search'

export const homeEventsPageSize = 30
export type HomeEventsCursor = SearchCursor

export function loadHomeEvents(cursor: HomeEventsCursor | null = null, filters: DiscoveryFilters = emptyFilters) {
  return searchEvents(filters, { cursor, limit: homeEventsPageSize })
}
