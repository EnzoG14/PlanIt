import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Coordinates, MapBounds } from '../../features/location/geolocation'
import { fallbackBounds, mapProvider, normalizeBounds, publicMapboxToken } from './provider'
import 'mapbox-gl/dist/mapbox-gl.css'
import './map.css'

export type MapEvent = Coordinates & { id: string; title: string }
type Props = {
  events: MapEvent[]; center: Coordinates; selectedId: string | null
  onSelect: (id: string) => void; onBoundsChange: (bounds: MapBounds) => void
}
const token = publicMapboxToken(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
const unavailable = 'No pudimos cargar el mapa. Podés consultar las tarjetas y actualizar los eventos de la zona consultada.'
export function EventMap({ events, center, selectedId, onSelect, onBoundsChange }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef(new Map<string, mapboxgl.Marker>())
  const callbacks = useRef({ onSelect, onBoundsChange })
  const initialCenter = useRef(center)
  const [error, setError] = useState(token ? '' : 'El mapa no está configurado: falta un token público válido de Mapbox. Las tarjetas muestran una zona aproximada alrededor del centro elegido.')
  const [ready, setReady] = useState(false)
  useEffect(() => { callbacks.current = { onSelect, onBoundsChange } }, [onSelect, onBoundsChange])
  useEffect(() => {
    if (!container.current || !token) return
    const activeMarkers = markers.current
    let active = true
    let instance: mapboxgl.Map | null = null
    let observer: ResizeObserver | undefined
    const report = () => {
      const bounds = instance?.getBounds()
      if (bounds) callbacks.current.onBoundsChange(normalizeBounds({ south: bounds.getSouth(), north: bounds.getNorth(), west: bounds.getWest(), east: bounds.getEast() }))
    }
    const loaded = () => { setReady(true); setError(''); report() }
    const failed = () => setError(unavailable)
    try {
      if (!mapboxgl.supported()) throw new Error('WebGL unavailable')
      instance = new mapboxgl.Map({ container: container.current, accessToken: token, style: mapProvider.style,
        config: { basemap: { lightPreset: 'day' } }, center: [initialCenter.current.longitude, initialCenter.current.latitude],
        zoom: mapProvider.initialZoom, minZoom: mapProvider.minZoom, maxZoom: mapProvider.maxZoom,
        projection: 'mercator', attributionControl: false,
        locale: { 'NavigationControl.ZoomIn': 'Acercar', 'NavigationControl.ZoomOut': 'Alejar', 'NavigationControl.ResetBearing': 'Orientar al norte' },
      })
      map.current = instance
      instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      instance.addControl(new mapboxgl.AttributionControl({ compact: false }))
      instance.scrollZoom.disable()
      instance.getCanvas().setAttribute('aria-label', 'Mapa interactivo de eventos; usá las flechas para desplazarte')
      instance.on('load', loaded); instance.on('moveend', report); instance.on('error', failed)
      instance.getCanvas().addEventListener('webglcontextlost', failed)
      observer = new ResizeObserver(() => instance?.resize())
      observer.observe(container.current)
      report()
    } catch { queueMicrotask(() => { if (active) setError(unavailable) }) }
    return () => {
      active = false
      observer?.disconnect()
      activeMarkers.forEach(marker => marker.remove()); activeMarkers.clear()
      if (instance) {
        instance.off('load', loaded); instance.off('moveend', report); instance.off('error', failed)
        instance.getCanvas().removeEventListener('webglcontextlost', failed)
        instance.remove()
      }
      map.current = null
    }
  }, [])
  useEffect(() => {
    if (map.current) map.current.jumpTo({ center: [center.longitude, center.latitude], zoom: mapProvider.initialZoom })
    else callbacks.current.onBoundsChange(fallbackBounds(center))
  }, [center])
  useEffect(() => {
    const instance = map.current
    if (!instance) return
    const ids = new Set(events.map(event => event.id))
    markers.current.forEach((marker, id) => { if (!ids.has(id)) { marker.remove(); markers.current.delete(id) } })
    for (const event of events) {
      let marker = markers.current.get(event.id)
      if (!marker) {
        const button = document.createElement('button')
        button.type = 'button'; button.className = 'planit-marker'; button.dataset.eventId = event.id
        button.appendChild(document.createElement('span'))
        button.addEventListener('click', input => { input.stopPropagation(); callbacks.current.onSelect(event.id) })
        marker = new mapboxgl.Marker({ element: button, anchor: 'bottom' }).setLngLat([event.longitude, event.latitude]).addTo(instance)
        markers.current.set(event.id, marker)
      }
      marker.setLngLat([event.longitude, event.latitude])
      const button = marker.getElement()
      button.classList.toggle('is-selected', event.id === selectedId)
      button.setAttribute('aria-label', `Seleccionar ${event.title}`)
      button.setAttribute('aria-pressed', String(event.id === selectedId)); button.title = event.title
    }
  }, [events, selectedId])
  return <div className={`event-map-frame ${error ? 'has-error' : ''}`} role="region" aria-label="Mapa de eventos públicos">
    <div ref={container} className="event-map" />
    {error ? <p className="map-tile-error" role="status">{error}</p> : !ready && <p className="map-tile-error" role="status">Cargando mapa… Podés consultar las tarjetas mientras tanto.</p>}
  </div>
}
