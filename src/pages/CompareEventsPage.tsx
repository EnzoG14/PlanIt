import { BackButton } from '../components/BackButton'
import { useEffect, useRef, useState } from 'react'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadMyEventsComparison } from '../features/analytics/api'
import { MAX_COMPARE_EVENTS, MIN_COMPARE_EVENTS, selectionProblem, type EventsComparison } from '../features/analytics/compare'
import { formatOccupancyPercent } from '../features/analytics/format'
import { loadMyEvents, myEventsError, myEventsPageSize, myEventsPath, organizedFilter, organizedFilters, type MyEventListItem, type OrganizedEventsFilter } from '../features/events/my-events'
import { formatEventTime } from '../features/events/validation'
import '../styles/event-management.css'
import './event-analytics.css'
import './my-events.css'
import './compare-events.css'

const stateLabels = { open: 'Vigente', ended: 'Finalizado', cancelled: 'Cancelado', archived: 'Archivado' } as const
type Chosen = { id: string; title: string; state: MyEventListItem['event_state'] }

export function CompareEventsPage() {
  const { session } = useAuth()
  // Remount before rendering another identity or renewed session: selection and results are private.
  return <CompareContent key={`${session?.user.id}:${session?.access_token}`} />
}

function CompareContent() {
  const [filter, setFilter] = useState<OrganizedEventsFilter>('all')
  const [chosen, setChosen] = useState<Chosen[]>([])
  const ids = chosen.map(item => item.id)
  const idsKey = ids.join(',')
  const problem = selectionProblem(ids)
  useEffect(() => { document.title = 'Comparar eventos · PlanIt' }, [])
  function toggle(event: MyEventListItem) {
    setChosen(previous => previous.some(item => item.id === event.id)
      ? previous.filter(item => item.id !== event.id)
      : previous.length >= MAX_COMPARE_EVENTS ? previous : [...previous, { id: event.id, title: event.title, state: event.event_state }])
  }
  return <section className="management-page analytics-page compare-page">
    <BackButton to={myEventsPath('organizing', filter)} />
    <header className="management-header"><h1>Comparar eventos</h1><p>Inscriptos confirmados y ocupación actual de tus eventos</p></header>
    <EventPicker filter={filter} onFilter={setFilter} chosen={chosen} onToggle={toggle} />
    <p className="field-hint compare-count" id="compare-hint" role="status">
      {chosen.length === 0 ? `Elegí entre ${MIN_COMPARE_EVENTS} y ${MAX_COMPARE_EVENTS} eventos.` : `${chosen.length} de ${MAX_COMPARE_EVENTS} seleccionados.`}
      {chosen.length >= MAX_COMPARE_EVENTS ? ` Llegaste al máximo de ${MAX_COMPARE_EVENTS}; quitá uno para elegir otro.` : ''}
      {problem && chosen.length > 0 ? ` ${problem}` : ''}
    </p>
    {chosen.length > 0 && <ul className="compare-chosen" aria-label="Eventos seleccionados">
      {chosen.map(item => <li key={item.id}><span>{item.title}</span><button type="button" className="text-button" aria-label={`Quitar ${item.title} de la comparación`} onClick={() => setChosen(previous => previous.filter(other => other.id !== item.id))}>Quitar</button></li>)}
    </ul>}
    {problem ? <StatusMessage title="Comparación no disponible">{problem}</StatusMessage>
      : <ComparisonResult key={idsKey} ids={ids} />}
  </section>
}

function EventPicker({ filter, onFilter, chosen, onToggle }: { filter: OrganizedEventsFilter; onFilter: (value: OrganizedEventsFilter) => void; chosen: Chosen[]; onToggle: (event: MyEventListItem) => void }) {
  const [events, setEvents] = useState<MyEventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const offset = useRef(0)
  const revision = useRef(0)
  async function fetchPage(append: boolean) {
    const request = ++revision.current
    setError(''); if (!append) { offset.current = 0; setEvents([]); setMore(false) }
    setLoading(true)
    try {
      const result = await loadMyEvents('organizing', append ? offset.current : 0, filter)
      if (revision.current !== request) return
      offset.current += myEventsPageSize
      setEvents(previous => append ? [...new Map([...previous, ...result.events].map(item => [item.id, item])).values()] : result.events)
      setMore(result.hasMore)
    } catch (failure) { if (revision.current === request) setError(myEventsError(failure)) }
    finally { if (revision.current === request) setLoading(false) }
  }
  useEffect(() => {
    void fetchPage(false)
    return () => { revision.current += 1 }
    // fetchPage closes over the filter that triggers this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, attempt])
  const full = chosen.length >= MAX_COMPARE_EVENTS
  return <fieldset className="compare-picker" aria-describedby="compare-hint">
    <legend>Tus eventos</legend>
    <div className="my-events-filters" role="group" aria-label="Filtrar eventos organizados">
      {Object.entries(organizedFilters).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => onFilter(organizedFilter(value))}>{label}</button>)}
    </div>
    <div aria-busy={loading}>
      {loading && !events.length && <StatusMessage title="Cargando tus eventos">Esperá un momento.</StatusMessage>}
      {error && <div><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button type="button" className="secondary-button" onClick={() => events.length ? void fetchPage(true) : setAttempt(value => value + 1)}>Reintentar</button></div>}
      {!loading && !error && !events.length && <StatusMessage title={`No hay eventos en ${organizedFilters[filter]}`}>{filter === 'all' ? 'Necesitás al menos 2 eventos propios para comparar. Probá también el filtro Archivados.' : 'Probá otro filtro: tu selección se conserva.'}</StatusMessage>}
      {events.length > 0 && <ul className="compare-options">
        {events.map(event => {
          const checked = chosen.some(item => item.id === event.id)
          return <li key={event.id}><label>
            <input type="checkbox" checked={checked} disabled={!checked && full} onChange={() => onToggle(event)} />
            <span className="compare-option-text"><b>{event.title}</b><span>{stateLabels[event.event_state]} · <time dateTime={event.starts_at}>{formatEventTime(event.starts_at)}</time></span></span>
          </label></li>
        })}
      </ul>}
      {more && !error && <button type="button" className="secondary-button load-more-events" disabled={loading} onClick={() => void fetchPage(true)}>{loading ? 'Cargando más…' : 'Cargar más'}</button>}
    </div>
  </fieldset>
}

function ComparisonResult({ ids }: { ids: string[] }) {
  const [data, setData] = useState<EventsComparison | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [stale, setStale] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    // Request key: this effect instance owns its ids and attempt; any other change aborts it and drops its result.
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    const invalidate = () => { active = false; controller.abort(); setData(null); setStale(true); setOffline(!navigator.onLine) }
    const online = () => { setOffline(false); retry() }
    const onHide = () => { if (document.hidden) invalidate(); else if (navigator.onLine) retry() }
    window.addEventListener('offline', invalidate); window.addEventListener('online', online); document.addEventListener('visibilitychange', onHide)
    if (navigator.onLine) {
      loadMyEventsComparison(ids, controller.signal).then(value => { if (active) setData(value) })
        .catch(reason => { if (active) setError(controller.signal.aborted ? 'La consulta tardó demasiado. Volvé a intentar.' : reason instanceof Error ? reason.message : 'No pudimos cargar la comparación.') })
        .finally(() => window.clearTimeout(timeout))
    } else queueMicrotask(() => { if (active) setStale(true) })
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); window.removeEventListener('offline', invalidate); window.removeEventListener('online', online); document.removeEventListener('visibilitychange', onHide) }
    // ids is stable per mount: the parent remounts this component whenever the selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])
  function retry() { setData(null); setError(null); setStale(false); setAttempt(value => value + 1) }
  const count = new Intl.NumberFormat('es-AR')
  const pending = !data && !error && !stale && !offline
  return <section className="compare-result" aria-labelledby="compare-title" aria-live="polite" aria-busy={pending}>
    <h2 id="compare-title">Comparación</h2>
    {pending && <StatusMessage title="Comparando eventos">Esperá un momento.</StatusMessage>}
    {offline ? <StatusMessage title="Sin conexión">Recuperaremos la comparación cuando vuelvas a conectarte.</StatusMessage>
      : stale ? <StatusMessage title="Actualizá la comparación">La consulta anterior dejó de estar vigente.</StatusMessage>
        : error ? <StatusMessage title="Comparación no disponible" tone="error">{error}</StatusMessage>
          : data && <>
            <div className="compare-table-wrap"><table className="compare-table">
              <caption>Inscriptos confirmados y ocupación por evento, calculados con el mismo criterio.</caption>
              <thead><tr><th scope="col">Evento</th><th scope="col">Estado</th><th scope="col">Inscriptos</th><th scope="col">Cupo</th><th scope="col">Disponibles</th><th scope="col">Ocupación</th></tr></thead>
              <tbody>{data.events.map(event => {
                const percent = event.capacity_usable ? formatOccupancyPercent(event.occupancy_percent) : 'N/D'
                return <tr key={event.event_id}>
                  <th scope="row" data-label="Evento">{event.title}</th>
                  <td data-label="Estado">{stateLabels[event.event_state]}</td>
                  <td data-label="Inscriptos">{count.format(event.confirmed_count)}</td>
                  <td data-label="Cupo">{event.capacity_usable ? count.format(event.capacity) : 'N/D'}</td>
                  <td data-label="Disponibles">{event.capacity_usable ? count.format(event.available_spots) : 'N/D'}</td>
                  <td data-label="Ocupación">{event.capacity_usable && event.occupancy_percent !== null
                    ? <><progress max={100} value={Math.min(100, event.occupancy_percent)} aria-label={`${event.title}: ${percent}; ${count.format(event.confirmed_count)} de ${count.format(event.capacity)} lugares`}>{percent}</progress><span>{percent}</span></>
                    : <span>N/D · sin cupo utilizable</span>}</td>
                </tr>
              })}</tbody>
            </table></div>
            {data.events.some(event => !event.capacity_usable) && <p className="field-hint">N/D: el evento no tiene un cupo utilizable, por eso no se calcula el porcentaje.</p>}
            <p className="field-hint">Las inscripciones no acreditan presencia física. Los datos reflejan inscripciones vigentes al actualizar.</p>
            <p className="analytics-updated">Última consulta: <time dateTime={`${data.as_of}-03:00`}>{formatEventTime(data.as_of)}</time> (hora de Argentina).</p>
          </>}
    {error && <button type="button" className="secondary-button" disabled={pending || offline} onClick={retry}>Reintentar</button>}
  </section>
}
