import type { MapBounds } from '../location/geolocation'
import type { EventRecord } from './api'
import { emptyFilters, searchEvents, type DiscoveryFilters } from './search'

export type EventPreview = EventRecord & { categoryName: string; imageUrl: string | null }
const mapLimit = 100
export async function discoverEvents(bounds: MapBounds, filters: DiscoveryFilters = emptyFilters): Promise<{ events: EventPreview[]; truncated: boolean; imageError: boolean }> {
  // Same public search RPC as Inicio; bounds only limit what the map draws.
  const result = await searchEvents(filters, { bounds, limit: mapLimit })
  return { events: result.events, truncated: result.hasMore, imageError: result.imageError }
}
