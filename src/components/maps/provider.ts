import type { Coordinates, MapBounds } from '../../features/location/geolocation'
export const mapProvider = { style: 'mapbox://styles/mapbox/standard', initialZoom: 13, minZoom: 3, maxZoom: 19 }
export function normalizeBounds(bounds: MapBounds): MapBounds {
  const longitude = (value: number) => ((value + 180) % 360 + 360) % 360 - 180
  const world = bounds.east - bounds.west >= 360
  return { south: Math.max(-90, bounds.south), north: Math.min(90, bounds.north), west: world ? -180 : longitude(bounds.west), east: world ? 180 : longitude(bounds.east) }
}
// Approximate area for cards when the cartographic engine is unavailable.
export function fallbackBounds(center: Coordinates): MapBounds {
  return normalizeBounds({ south: center.latitude - 0.025, north: center.latitude + 0.025, west: center.longitude - 0.04, east: center.longitude + 0.04 })
}
export function publicMapboxToken(value: string | undefined): string | null {
  return value && /^pk\.[A-Za-z0-9._-]+$/.test(value) ? value : null
}
