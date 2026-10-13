import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { defaultLocation, getCurrentLocation, type Coordinates } from './geolocation'

// Reference point for the radius filter (A01): consented GPS first, otherwise the
// map centre, always labelled. Held in memory only (never in the URL or storage)
// so Inicio and Mapa agree without publishing coordinates.
export type SearchOrigin = Coordinates & { kind: 'gps' | 'map' }
type OriginState = { gps: Coordinates | null; gpsTried: boolean; gpsError: string; locating: boolean; preferMap: boolean; mapCenter: Coordinates | null }
let state: OriginState = { gps: null, gpsTried: false, gpsError: '', locating: false, preferMap: false, mapCenter: null }
const listeners = new Set<() => void>()
const update = (patch: Partial<OriginState>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()) }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
const snapshot = () => state

export function setMapCenter(center: Coordinates) {
  if (state.mapCenter?.latitude === center.latitude && state.mapCenter.longitude === center.longitude) return
  update({ mapCenter: center })
}
export const isInitialMapCenter = (center: Coordinates) => Math.abs(center.latitude - defaultLocation.latitude) < 1e-4 && Math.abs(center.longitude - defaultLocation.longitude) < 1e-4
// Centre of a bounds box, valid across the antimeridian.
export function boundsCenter(bounds: { south: number; north: number; west: number; east: number }): Coordinates {
  const east = bounds.east < bounds.west ? bounds.east + 360 : bounds.east
  const longitude = (bounds.west + east) / 2
  return { latitude: (bounds.south + bounds.north) / 2, longitude: longitude > 180 ? longitude - 360 : longitude }
}

export function originLabel(origin: { origin: SearchOrigin | null; initialCenter: boolean }) {
  if (!origin.origin) return ''
  return origin.origin.kind === 'gps' ? 'Tu ubicación' : origin.initialCenter ? 'Centro del mapa (Buenos Aires, punto inicial)' : 'Centro del mapa'
}

export function useSearchOrigin(active: boolean, onGps?: (coordinates: Coordinates) => void) {
  const current = useSyncExternalStore(subscribe, snapshot)
  const locate = useCallback(async (): Promise<string | null> => {
    if (state.locating) return null
    update({ locating: true, gpsTried: true, gpsError: '', preferMap: false })
    try {
      const gps = await getCurrentLocation()
      update({ gps, locating: false })
      onGps?.(gps)
      return null
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'No pudimos obtener tu ubicación.'
      update({ locating: false, gps: null, gpsError: message })
      return message
    }
  }, [onGps])
  // The first radius selection asks for GPS once; a refusal is not retried automatically.
  useEffect(() => { if (active && !state.gpsTried && !state.locating) void locate() }, [active, locate])
  const preferMapCenter = useCallback(() => update({ preferMap: true }), [])
  const origin: SearchOrigin | null = !current.preferMap && current.gps ? { ...current.gps, kind: 'gps' } : current.mapCenter ? { ...current.mapCenter, kind: 'map' } : null
  return { origin, locating: current.locating, gpsError: current.gpsError, hasGps: Boolean(current.gps), hasMapCenter: Boolean(current.mapCenter), locate, preferMapCenter, initialCenter: origin?.kind === 'map' && isInitialMapCenter(origin) }
}
