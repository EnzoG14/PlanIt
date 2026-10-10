import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { StatusMessage } from '../components/StatusMessage'
import { loadHomeEvents, type HomeEventsCursor } from '../features/events/home'
import type { EventPreview } from '../features/events/discovery'
import './discovery.css'
import './home.css'

type CategoryGroup = { id: string; name: string; events: EventPreview[] }

export function HomePage() {
  const [events, setEvents] = useState<EventPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const cursor = useRef<HomeEventsCursor | null>(null)
  const busy = useRef(false)
  const revision = useRef(0)
  const reload = useRef<() => void>(() => {})
  const more = useRef<() => void>(() => {})

  useEffect(() => {
    document.title = 'Inicio · PlanIt'
    let active = true
    async function fetchPage(append = false) {
      if (busy.current) return
      const request = ++revision.current
      busy.current = true
      setError('')
      if (append) setLoadingMore(true)
      else {
        cursor.current = null
        setEvents([])
        setHasMore(false)
        setImageError(false)
        setLoading(true)
        setLoadingMore(false)
      }
      try {
        const result = await loadHomeEvents(append ? cursor.current : null)
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
    reload.current = () => { void fetchPage() }
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
  }, [])

  const groups = new Map<string, CategoryGroup>()
  for (const event of events) {
    let group = groups.get(event.category_id)
    if (!group) {
      group = { id: event.category_id, name: event.categoryName, events: [] }
      groups.set(event.category_id, group)
    }
    group.events.push(event)
  }

  return <div className="home-page">
    <header className="home-heading">
      <div><h1>Inicio</h1><p>Próximos eventos para compartir.</p></div>
    </header>
    <div aria-busy={loading || loadingMore}>
      {loading ? <div role="status"><StatusMessage title="Buscando eventos">Esperá un momento.</StatusMessage></div> : <>
        {error && <div><StatusMessage title="No se pudo cargar Inicio" tone="error">{error}</StatusMessage><button type="button" className="secondary-button" onClick={() => reload.current()}>Reintentar</button></div>}
        {imageError && <p className="field-hint" role="status">No pudimos cargar algunas fotos. <button className="text-button" type="button" onClick={() => reload.current()}>Reintentar fotos</button></p>}
        {!error && !events.length && <><StatusMessage title="Todavía no hay eventos próximos">Cuando haya eventos públicos disponibles, los vas a encontrar acá.</StatusMessage><Link className="secondary-link home-map-link" to="/map">Explorar el mapa</Link></>}
        {groups.size > 0 && <div className="home-category-groups">
          {[...groups.values()].map(group => <section className="home-category" key={group.id} aria-labelledby={`home-category-${group.id}`}>
            <h2 id={`home-category-${group.id}`}>{group.name}</h2>
            <ul className="home-event-list">{group.events.map(event => <li key={event.id}><EventCard event={event} returnTo="/home" /></li>)}</ul>
          </section>)}
        </div>}
        {hasMore && !error && <button className="secondary-button home-load-more" type="button" disabled={loadingMore} onClick={() => more.current()}>{loadingMore ? 'Cargando más…' : 'Cargar más'}</button>}
        <span className="sr-only" role="status">{!loading && !error ? `${events.length} eventos cargados en ${groups.size} categorías.` : ''}</span>
      </>}
    </div>
  </div>
}
