import type { Coordinates } from '../location/geolocation'
import { emptyFilters, searchEvents, type DiscoveryFilters, type SearchCursor } from './search'

export const homeEventsPageSize = 30
export type HomeEventsCursor = SearchCursor

export function loadHomeEvents(cursor: HomeEventsCursor | null = null, filters: DiscoveryFilters = emptyFilters, origin: Coordinates | null = null) {
  return searchEvents(filters, { cursor, origin, limit: homeEventsPageSize })
}
