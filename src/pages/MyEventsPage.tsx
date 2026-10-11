import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CompactEventCard } from '../components/EventCard'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadMyEvents, myEventsError, myEventsPageSize, organizedFilters, organizedFilter, myEventsPath, type OrganizedEventsFilter, type MyEventListItem, type MyEventsSection } from '../features/events/my-events'
import './discovery.css'
import './my-events.css'

export function MyEventsPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const section: MyEventsSection = params.get('section') === 'participating' ? 'participating' : 'organizing'
  const filter = organizedFilter(params.get('filter'))
  function select(value: MyEventsSection) { setParams(value === 'organizing' ? { section: value, filter } : { section: value }, { replace: true }) }
  return <div className="my-events-page">
    <header className="my-events-heading"><div><h1>Mis eventos</h1><p>{section === 'organizing' ? 'Eventos que organizás' : 'Tus planes y tu participación.'}</p></div><Link to="/events/new" className="gradient-link my-events-create" aria-label="Crear evento"><Icon name="plus" /></Link></header>
    <div className="my-events-tabs" role="tablist" aria-label="Tu relación con los eventos">
      {(['organizing', 'participating'] as const).map(value => <button key={value} id={`tab-${value}`} type="button" role="tab" aria-selected={section === value} aria-controls={section === value ? `panel-${value}` : undefined} tabIndex={section === value ? 0 : -1} onClick={() => select(value)} onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'organizing' : event.key === 'End' ? 'participating' : section === 'organizing' ? 'participating' : 'organizing'
        select(next); document.getElementById(`tab-${next}`)?.focus()
      }}>{value === 'organizing' ? 'Organizo' : 'Participo'}</button>)}
    </div>
    {section === 'organizing' && <>
      <div className="my-events-filters" role="group" aria-label="Filtrar eventos organizados">
        {Object.entries(organizedFilters).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setParams({ section, filter: value }, { replace: true })}>{label}</button>)}
      </div>
      <p className="field-hint my-events-filter-hint">{filter === 'upcoming' ? 'Próximos incluye eventos en curso que todavía no finalizaron.' : 'Los eventos archivados están en su sección histórica: Archivados.'}</p>
    </>}
    <MyEventsList key={`${session?.user.id}:${section}:${section === 'organizing' ? filter : 'all'}`} section={section} filter={section === 'organizing' ? filter : 'all'} />
  </div>
}

function MyEventsList({ section, filter }: { section: MyEventsSection; filter: OrganizedEventsFilter }) {
  const [events, setEvents] = useState<MyEventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [appendError, setAppendError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const revision = useRef(0)
  const busy = useRef(false)
  const offset = useRef(0)
  const reload = useRef<() => void>(() => {})
  const more = useRef<() => void>(() => {})

  useEffect(() => {
    document.title = 'Mis eventos · PlanIt'
    let active = true
    async function fetchPage(append = false) {
      if (append && busy.current) return
      const request = ++revision.current
      busy.current = true
      setError('')
      setAppendError(false)
      if (append) setLoadingMore(true)
      else { offset.current = 0; setEvents([]); setHasMore(false); setImageError(false); setLoading(true); setLoadingMore(false) }
      try {
        const result = await loadMyEvents(section, append ? offset.current : 0, filter)
        if (!active || revision.current !== request) return
        setEvents(previous => append ? [...new Map([...previous, ...result.events].map(item => [item.id, item])).values()] : result.events)
        offset.current += myEventsPageSize
        setHasMore(result.hasMore)
        setImageError(previous => previous || result.imageError)
      } catch (failure) {
        if (active && revision.current === request) { setError(myEventsError(failure)); setAppendError(append) }
      } finally {
        if (active && revision.current === request) { busy.current = false; setLoading(false); setLoadingMore(false) }
      }
    }
    reload.current = () => { void fetchPage() }
    more.current = () => { void fetchPage(true) }
    const onReturn = () => { if (document.visibilityState === 'visible' && !busy.current) void fetchPage() }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    void fetchPage()
    return () => { active = false; revision.current += 1; window.removeEventListener('focus', onReturn); document.removeEventListener('visibilitychange', onReturn) }
  }, [section, filter])
  return <section id={`panel-${section}`} role="tabpanel" aria-labelledby={`tab-${section}`} tabIndex={0} aria-busy={loading || loadingMore}>
    <div className="my-events-refresh"><button type="button" className="text-button" disabled={loading || loadingMore} onClick={() => reload.current()}>Actualizar</button></div>
    {loading ? <div role="status"><StatusMessage title="Cargando tus eventos">Esperá un momento.</StatusMessage></div> : <>
      {error && <div><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button type="button" className="secondary-button" disabled={loadingMore} onClick={() => appendError ? more.current() : reload.current()}>{appendError ? 'Reintentar carga adicional' : 'Reintentar'}</button></div>}
      {!error && !events.length && !hasMore && <><StatusMessage title={section === 'organizing' ? `No hay eventos en ${organizedFilters[filter]}` : 'Todavía no tenés participaciones'}>{section === 'organizing' ? filter === 'all' ? 'Creá un evento o consultá tu histórico en Archivados.' : 'Probá otro filtro para consultar tus eventos.' : 'Explorá el mapa y elegí un evento para sumarte.'}</StatusMessage><Link className="secondary-link" to={section === 'organizing' ? '/events/new' : '/map'}>{section === 'organizing' ? 'Crear evento' : 'Explorar el mapa'}</Link></>}
      {imageError && <p className="field-hint" role="status">No pudimos cargar algunas fotos. <button className="text-button" type="button" onClick={() => reload.current()}>Reintentar fotos</button></p>}
      {events.length > 0 && <ul className="my-events-list">{events.map(event => <li key={event.id}><CompactEventCard event={event} returnTo={myEventsPath(section, filter)} showMenu={section === 'organizing'} /></li>)}</ul>}
      {hasMore && !error && <button className="secondary-button load-more-events" type="button" disabled={loadingMore} onClick={() => more.current()}>{loadingMore ? 'Cargando más…' : 'Cargar más'}</button>}
      <span className="sr-only" role="status">{!loading && !error ? `${events.length} eventos cargados.` : ''}</span>
    </>}
  </section>
}
