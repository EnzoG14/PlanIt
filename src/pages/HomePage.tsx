import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { HomeSuggestions } from '../components/HomeSuggestions'
import { StatusMessage } from '../components/StatusMessage'
import { DiscoveryFilters } from '../components/DiscoveryFilters'
import { useDiscoveryFilters } from '../features/events/useDiscoveryFilters'
import { hasActiveFilters } from '../features/events/search'
import { useSearchOrigin } from '../features/location/origin'
import type { HomeEventsCursor } from '../features/events/home'
import { homeContentKey, loadHomeContent, type HomeContent } from '../features/startup/content'
import { readContent } from '../lib/session-content'
import type { EventPreview } from '../features/events/discovery'
import './discovery.css'
import './home.css'

type CategoryGroup = { id: string; name: string; events: EventPreview[] }

export function HomePage() {
  const { filters, filtersKey, search, setFilters } = useDiscoveryFilters()
  const radiusOn = filters.radiusKm !== null
  const origin = useSearchOrigin(radiusOn)
  const cached = readContent<HomeContent>(homeContentKey(filters, origin.origin))

  const [events, setEvents] = useState<EventPreview[]>(cached?.events ?? [])
  const [loading, setLoading] = useState(!cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(cached?.imageError ?? false)
  // Radius needs a reference point: wait while GPS is being asked, never query without one.
  const originKey = !radiusOn ? '' : origin.locating ? 'wait' : origin.origin ? `${origin.origin.kind}:${origin.origin.latitude},${origin.origin.longitude}` : 'none'
  const filtersRef = useRef(filters)
  const originRef = useRef(origin.origin)
  useEffect(() => { filtersRef.current = filters; originRef.current = origin.origin })
  const cursor = useRef<HomeEventsCursor | null>(cached?.cursor ?? null)
  const busy = useRef(false)
  const revision = useRef(0)
  const reload = useRef<() => void>(() => {})
  const more = useRef<() => void>(() => {})

  useEffect(() => { document.title = 'Inicio · PlanIt' }, [])
  useEffect(() => {
    let active = true
    async function fetchPage(append = false, force = false) {
      if (append && busy.current) return
      const request = ++revision.current
      if (originKey === 'wait' || originKey === 'none') {
        busy.current = false; cursor.current = null
        setEvents([]); setHasMore(false); setImageError(false); setError('')
        setLoading(originKey === 'wait'); setLoadingMore(false)
        return
      }
      busy.current = true
      setError('')
      if (append) setLoadingMore(true)
      else {
        cursor.current = null
        const previous = readContent<HomeContent>(homeContentKey(filtersRef.current, originRef.current))
        if (previous) {
          setEvents(previous.events); setHasMore(previous.hasMore); setImageError(previous.imageError)
        } else { setEvents([]); setHasMore(false); setImageError(false) }
        setLoading(!previous)
        setLoadingMore(false)
      }
      try {
        const result = await loadHomeContent(append ? cursor.current : null, filtersRef.current, originRef.current, force)
        if (!active || revision.current !== request) return
        setEvents(previous => append
          ? [...new Map([...previous, ...result.events].map(event => [event.id, event])).values()]
          : result.events)
        cursor.current = result.cursor
        setHasMore(result.hasMore)
        setImageError(previous => append ? previous || result.imageError : result.imageError)
      } catch {
        if (active && revision.current === request) setError('No pudimos consultar los próximos eventos. Revisá la conexión y reintentá.')
      } finally {
        if (active && revision.current === request) {
          busy.current = false
          setLoading(false)
          setLoadingMore(false)
        }
      }
    }
    reload.current = () => { void fetchPage(false, true) }
    more.current = () => { void fetchPage(true) }
    const refresh = () => {
      if (document.visibilityState === 'visible' && !busy.current) void fetchPage()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    void fetchPage()
    return () => {
      active = false
      revision.current += 1
      busy.current = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [filtersKey, originKey])

  const groups = new Map<string, CategoryGroup>()
  for (const event of events) {
    let group = groups.get(event.category_id)
    if (!group) {
      group = { id: event.category_id, name: event.categoryName, events: [] }
      groups.set(event.category_id, group)
    }
    group.events.push(event)
  }

  const filtered = hasActiveFilters(filters)
  return <div className="home-page">
    <header className="home-heading">
      <div><h1>Inicio</h1><p>Próximos eventos para compartir.</p></div>
    </header>
    <HomeSuggestions returnTo={`/home${search}`} />
    <DiscoveryFilters filters={filters} onChange={setFilters} idPrefix="home" origin={origin} />
    <div aria-busy={loading || loadingMore}>
      {loading ? <div role="status"><StatusMessage title="Buscando eventos">Esperá un momento.</StatusMessage></div> : <>
        {error && <div><StatusMessage title="No se pudo cargar Inicio" tone="error">{error}</StatusMessage><button type="button" className="secondary-button" onClick={() => reload.current()}>Reintentar</button></div>}
        {imageError && <p className="field-hint" role="status">No pudimos cargar algunas fotos. <button className="text-button" type="button" onClick={() => reload.current()}>Reintentar fotos</button></p>}
        {!error && !events.length && (originKey === 'none' ? <StatusMessage title="No pudimos aplicar la distancia">Sin un punto de referencia no podemos calcular distancias, así que no mostramos resultados. Permití tu ubicación, abrí <Link to="/map">el mapa</Link> o elegí «Sin límite».</StatusMessage> : filtered
          ? <StatusMessage title="Ningún evento coincide con tu búsqueda">Probá con otro texto, otra fecha o radio, quitá una categoría o limpiá los filtros.</StatusMessage>
          : <><StatusMessage title="Todavía no hay eventos próximos">Cuando haya eventos públicos disponibles, los vas a encontrar acá.</StatusMessage><Link className="secondary-link home-map-link" to={`/map${search}`}>Explorar el mapa</Link></>)}
        {groups.size > 0 && <div className="home-category-groups">
          {[...groups.values()].map(group => <section className="home-category" key={group.id} aria-labelledby={`home-category-${group.id}`}>
            <h2 id={`home-category-${group.id}`}>{group.name}</h2>
            <ul className="home-event-list">{group.events.map(event => <li key={event.id}><EventCard event={event} returnTo={`/home${search}`} /></li>)}</ul>
          </section>)}
        </div>}
        {hasMore && !error && <button className="secondary-button home-load-more" type="button" disabled={loadingMore} onClick={() => more.current()}>{loadingMore ? 'Cargando más…' : 'Cargar más'}</button>}
        <span className="sr-only" role="status">{!loading && !error ? `${events.length} eventos cargados en ${groups.size} categorías.` : ''}</span>
      </>}
    </div>
  </div>
}
