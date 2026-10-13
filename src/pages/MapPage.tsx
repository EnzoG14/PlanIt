import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { discoverEvents, type EventPreview } from '../features/events/discovery'
import { defaultLocation, getCurrentLocation, type MapBounds } from '../features/location/geolocation'
import './discovery.css'
import { fallbackBounds } from '../components/maps/provider'

const EventMap = lazy(() => import('../components/maps/EventMap').then(module => ({ default: module.EventMap })))
export function MapPage() {
  const [center, setCenter] = useState(defaultLocation)
  const [bounds, setBounds] = useState<MapBounds>(() => fallbackBounds(defaultLocation))
  const [events, setEvents] = useState<EventPreview[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationNotice, setLocationNotice] = useState('Ubicación inicial: Buenos Aires. Mové el mapa para explorar otra zona.')
  const [locating, setLocating] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [truncated, setTruncated] = useState(false)
  const [imageError, setImageError] = useState(false)
  const preview = useRef<HTMLElement>(null)
  const results = useRef<HTMLElement>(null)
  const selectionSource = useRef<string | null>(null)
  const markerSource = useRef<string | null>(null)
  function selectFromList(id: string) { selectionSource.current = id; markerSource.current = null; setSelectedId(id) }
  function selectFromMarker(id: string) { selectionSource.current = null; markerSource.current = id; setSelectedId(id || null) }
  useLayoutEffect(() => {
    if (selectedId && selectionSource.current) preview.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    if (!selectedId) {
      const card = selectionSource.current ? results.current?.querySelector<HTMLElement>(`[data-event-id="${selectionSource.current}"]`) : null
      const marker = markerSource.current && document.querySelector<HTMLButtonElement>(`.planit-marker[data-event-id="${markerSource.current}"]`)
      if (selectionSource.current) (card?.querySelector<HTMLButtonElement>('button') ?? results.current?.querySelector<HTMLButtonElement>('.results-heading button'))?.focus()
      else if (marker) marker.focus()
      selectionSource.current = null; markerSource.current = null
    }
  }, [selectedId])
  const reportBounds = useCallback((next: MapBounds) => setBounds(current => JSON.stringify(current) === JSON.stringify(next) ? current : next), [])
  useEffect(() => { document.title = 'Mapa · PlanIt' }, [])
  useEffect(() => {
    if (!bounds) return
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true); setError('')
      discoverEvents(bounds).then(result => {
        if (active) {
          setEvents(result.events); setTruncated(result.truncated); setImageError(result.imageError)
          setSelectedId(current => result.events.some(event => event.id === current) ? current : null)
        }
      }).catch(failure => {
        if (active) {
          setEvents([]); setSelectedId(null)
          setError(failure?.code === 'PGRST202' ? 'La exploración todavía no está habilitada en el servidor.' : 'No pudimos cargar los eventos. Revisá la conexión y reintentá.')
        }
      }).finally(() => { if (active) setLoading(false) })
    }, 300)
    return () => { active = false; window.clearTimeout(timer) }
  }, [bounds, attempt])
  async function locate() {
    setLocating(true)
    try { setCenter(await getCurrentLocation()); setLocationNotice('Mapa centrado en tu ubicación. Movelo para explorar.') }
    catch (failure) { setLocationNotice(`${failure instanceof Error ? failure.message : 'No pudimos obtener tu ubicación.'} Conservamos la zona actual; podés mover el mapa o volver a Buenos Aires.`) }
    finally { setLocating(false) }
  }
  const selected = events.find(event => event.id === selectedId)
  return <div className="map-page">
    <header className="map-heading"><div><h1>Encontrá tu próximo plan</h1><p>Eventos públicos en el mapa</p></div><button className="secondary-button location-button" onClick={locate} disabled={locating}><Icon name="pin" />{locating ? 'Buscando…' : 'Mi ubicación'}</button></header>
    <p className="location-notice" role="status">{locationNotice}</p>
    <button className="text-button" onClick={() => { setCenter({ ...defaultLocation }); setLocationNotice('Ubicación predeterminada: Buenos Aires.') }}>Usar Buenos Aires</button>
    <Suspense fallback={<StatusMessage title="Cargando mapa">Esperá un momento.</StatusMessage>}><EventMap events={events} center={center} selectedId={selectedId} onSelect={selectFromMarker} onBoundsChange={reportBounds} /></Suspense>
    {selected && <section ref={preview} className="map-preview" aria-label="Evento seleccionado"><EventCard event={selected} selected returnTo="/map" /><button className="text-button" onClick={() => setSelectedId(null)}>Cerrar vista previa</button></section>}
    <section ref={results} className="map-results" aria-busy={loading} aria-label="Eventos en esta zona"><div className="results-heading"><h2>En esta zona</h2><button className="text-button" onClick={() => setAttempt(value => value + 1)} disabled={loading}>Actualizar eventos</button></div>
      {loading ? <StatusMessage title="Buscando eventos">Consultando esta zona…</StatusMessage> : error ? <><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button className="secondary-button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></> : !events.length ? <StatusMessage title="No hay eventos en esta zona">Mové el mapa para explorar otros lugares o <Link to="/events/new">creá un evento</Link>.</StatusMessage> : <>
        {truncated && <p role="status">Mostramos los primeros 100 eventos. Acercá el mapa para consultar una zona menor.</p>}
        {imageError && <p role="status">Algunas fotos no pudieron cargarse. Podés consultar los eventos igualmente.</p>}
        <div className="event-card-list">{events.filter(event => event.id !== selectedId).map(event => <EventCard key={event.id} event={event} selected={event.id === selectedId} onSelect={selectFromList} returnTo="/map" />)}</div>
      </>}
    </section>
  </div>
}
