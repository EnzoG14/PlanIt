import { useEffect, useRef, useState } from 'react'
import { divIcon, type Marker as LeafletMarker } from 'leaflet'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Coordinates, MapBounds } from '../../features/location/geolocation'
import { mapProvider } from './provider'
import 'leaflet/dist/leaflet.css'
import './map.css'

export type MapEvent = Coordinates & { id: string; title: string }
type Props = {
  events: MapEvent[]; center: Coordinates; selectedId: string | null
  onSelect: (id: string) => void; onBoundsChange: (bounds: MapBounds) => void
}
const normalIcon = divIcon({ className: 'planit-marker', html: '<span></span>', iconSize: [32, 40], iconAnchor: [16, 40] })
const selectedIcon = divIcon({ className: 'planit-marker is-selected', html: '<span></span>', iconSize: [32, 40], iconAnchor: [16, 40] })

function EventMarker({ event, selected, onSelect }: { event: MapEvent; selected: boolean; onSelect: Props['onSelect'] }) {
  const marker = useRef<LeafletMarker>(null)
  useEffect(() => {
    const element = marker.current?.getElement()
    if (!element) return
    element.setAttribute('aria-label', `Seleccionar ${event.title}`)
    const select = (input: KeyboardEvent) => {
      if (input.key === 'Enter' || input.key === ' ') { input.preventDefault(); input.stopPropagation(); onSelect(event.id) }
    }
    element.addEventListener('keydown', select)
    return () => element.removeEventListener('keydown', select)
  }, [event.id, event.title, onSelect, selected])
  return <Marker ref={marker} position={[event.latitude, event.longitude]} autoPanOnFocus={false} title={event.title} icon={selected ? selectedIcon : normalIcon} eventHandlers={{ click: () => onSelect(event.id) }}><Tooltip>{event.title}</Tooltip></Marker>
}

function Viewport({ center, onBoundsChange }: Pick<Props, 'center' | 'onBoundsChange'>) {
  const map = useMap()
  useEffect(() => { map.setView([center.latitude, center.longitude], mapProvider.initialZoom) }, [map, center])
  useEffect(() => {
    const report = () => {
      const bounds = map.getBounds()
      const west = ((bounds.getWest() + 180) % 360 + 360) % 360 - 180
      const east = bounds.getEast() - bounds.getWest() >= 360 ? 180 : ((bounds.getEast() + 180) % 360 + 360) % 360 - 180
      onBoundsChange({ south: Math.max(-90, bounds.getSouth()), north: Math.min(90, bounds.getNorth()), west: east === 180 ? -180 : west, east })
    }
    map.on('moveend', report)
    report()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => { map.off('moveend', report); observer.disconnect() }
  }, [map, onBoundsChange])
  return null
}
export function EventMap({ events, center, selectedId, onSelect, onBoundsChange }: Props) {
  const [tileError, setTileError] = useState(false)
  return <div className="event-map-frame" role="region" aria-label="Mapa de eventos públicos">
    <MapContainer center={[center.latitude, center.longitude]} zoom={mapProvider.initialZoom} minZoom={mapProvider.minZoom} maxZoom={mapProvider.maxZoom} className="event-map" scrollWheelZoom={false}>
      <TileLayer url={mapProvider.tiles} attribution={mapProvider.attribution} eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }} />
      <Viewport center={center} onBoundsChange={onBoundsChange} />
      {events.map(event => <EventMarker key={event.id} event={event} selected={event.id === selectedId} onSelect={onSelect} />)}
    </MapContainer>
    {tileError && <p className="map-tile-error" role="status">No se pudo cargar parte del mapa. Podés consultar las tarjetas.</p>}
  </div>
}
