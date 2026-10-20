import { readContent } from '../lib/session-content'
import { loadMyEventsContent, myEventsContentKey, type MyEventsContent } from '../features/startup/content'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CompactEventCard } from '../components/EventCard'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { eventStartTime, groupEventsByDay, myEventsError, myEventsPageSize, organizedFilters, organizedFilter, myEventsPath, type OrganizedEventsFilter, type MyEventListItem, type MyEventsSection } from '../features/events/my-events'
import './discovery.css'
import './my-events.css'

export function MyEventsPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const section: MyEventsSection = params.get('section') === 'participating' ? 'participating' : 'organizing'
  const filter = organizedFilter(params.get('filter'))
  function select(value: MyEventsSection) { setParams(value === 'organizing' ? { section: value, filter } : { section: value }, { replace: true }) }
  return <div className="my-events-page">
    <header className="my-events-heading"><div><h1>Mis eventos</h1><p>{section === 'organizing' ? 'Eventos que organizás' : 'Tus planes y tu participación.'}</p></div><Link to="/events/new" className="my-events-create" aria-label="Crear evento"><Icon name="plus" /><span>Crear<span className="my-events-create-extra"> evento</span></span></Link></header>
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
      <p className="my-events-compare-link"><Link className="secondary-link" to="/my-events/compare">Comparar eventos</Link></p>
      {filter === 'upcoming' && <p className="field-hint my-events-filter-hint">Próximos incluye eventos en curso que todavía no finalizaron.</p>}
    </>}
    <MyEventsList key={`${session?.user.id}:${section}:${section === 'organizing' ? filter : 'all'}`} section={section} filter={section === 'organizing' ? filter : 'all'} />
  </div>
}

function MyEventsList({ section, filter }: { section: MyEventsSection; filter: OrganizedEventsFilter }) {
  const cached = readContent<MyEventsContent>(myEventsContentKey(section, filter))
  const [events, setEvents] = useState<MyEventListItem[]>(cached?.events ?? [])
  const [loading, setLoading] = useState(!cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? false)
  const [error, setError] = useState('')
  const [appendError, setAppendError] = useState(false)
  const [imageError, setImageError] = useState(cached?.imageError ?? false)
  const [notice, setNotice] = useState('')
  const revision = useRef(0)
  const busy = useRef(false)
  const offset = useRef(0)
  const reload = useRef<() => void>(() => {})
  const more = useRef<() => void>(() => {})

  useEffect(() => {
    document.title = 'Mis eventos · PlanIt'
    let active = true
    async function fetchPage(append = false, force = false) {
      if (append && busy.current) return
      const request = ++revision.current
      busy.current = true
      setError('')
      setAppendError(false)
      if (append) setLoadingMore(true)
      else {
        offset.current = 0
        const previous = readContent<MyEventsContent>(myEventsContentKey(section, filter))
        if (previous) { setEvents(previous.events); setHasMore(previous.hasMore); setImageError(previous.imageError) }
        else { setEvents([]); setHasMore(false); setImageError(false) }
        setLoading(!previous); setLoadingMore(false)
      }
      try {
        const result = await loadMyEventsContent(section, append ? offset.current : 0, filter, force)
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
    reload.current = () => { void fetchPage(false, true) }
    more.current = () => { void fetchPage(true) }
    const onReturn = () => { if (document.visibilityState === 'visible' && !busy.current && !document.querySelector('dialog[open]')) void fetchPage() }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    void fetchPage()
    return () => { active = false; revision.current += 1; window.removeEventListener('focus', onReturn); document.removeEventListener('visibilitychange', onReturn) }
  }, [section, filter])
  return <section id={`panel-${section}`} role="tabpanel" aria-labelledby={`tab-${section}`} tabIndex={0} aria-busy={loading || loadingMore}>
    <p className="event-action-notice my-events-notice" role="status">{notice}</p>
    <div className="my-events-refresh"><button type="button" className="text-button" disabled={loading || loadingMore} onClick={() => reload.current()}>Actualizar</button></div>
    {loading ? <div role="status"><StatusMessage title="Cargando tus eventos">Esperá un momento.</StatusMessage></div> : <>
      {error && <div><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button type="button" className="secondary-button" disabled={loadingMore} onClick={() => appendError ? more.current() : reload.current()}>{appendError ? 'Reintentar carga adicional' : 'Reintentar'}</button></div>}
      {!error && !events.length && !hasMore && <><StatusMessage title={section === 'organizing' ? `No hay eventos en ${organizedFilters[filter]}` : 'Todavía no tenés participaciones'}>{section === 'organizing' ? filter === 'all' ? 'Creá un evento o consultá tu histórico en Archivados.' : 'Probá otro filtro para consultar tus eventos.' : 'Explorá el mapa y elegí un evento para sumarte.'}</StatusMessage><Link className="secondary-link" to={section === 'organizing' ? '/events/new' : '/map'}>{section === 'organizing' ? 'Crear evento' : 'Explorar el mapa'}</Link></>}
      {imageError && <p className="field-hint" role="status">No pudimos cargar algunas fotos. <button className="text-button" type="button" onClick={() => reload.current()}>Reintentar fotos</button></p>}
      {events.length > 0 && <ul className="my-events-days">{groupEventsByDay(events).map(day => <li key={`${day.key}-${day.events[0].id}`} className="my-events-day">
        <h2>{day.label}</h2>
        <ul className="my-events-list">{day.events.map(event => <li key={event.id} className="my-events-slot"><time dateTime={event.starts_at}>{eventStartTime(event.starts_at)}</time><CompactEventCard event={event} returnTo={myEventsPath(section, filter)} showMenu={section === 'organizing'} onChanged={message => { setNotice(message); reload.current(); requestAnimationFrame(() => document.getElementById(`panel-${section}`)?.focus()) }} /></li>)}</ul>
      </li>)}</ul>}
      {hasMore && !error && <button className="secondary-button load-more-events" type="button" disabled={loadingMore} onClick={() => more.current()}>{loadingMore ? 'Cargando más…' : 'Cargar más'}</button>}
      <span className="sr-only" role="status">{!loading && !error ? `${events.length} eventos cargados.` : ''}</span>
    </>}
  </section>
}
