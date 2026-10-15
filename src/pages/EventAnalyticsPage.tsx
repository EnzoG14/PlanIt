import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadMyEventOccupancy, loadMyEventDemographics } from '../features/analytics/api'
import type { EventDemographics } from '../features/analytics/demographics'
import { DemographicsPanel } from '../components/analytics/DemographicsPanel'
import { TrendPanel } from '../components/analytics/TrendPanel'
import { formatOccupancyPercent } from '../features/analytics/format'
import type { EventOccupancy } from '../features/analytics/types'
import { validatedMyEventsReturn } from '../features/events/my-events'
import { formatEventTime } from '../features/events/validation'
import '../styles/event-management.css'
import './event-analytics.css'

export function EventAnalyticsPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  // Remount before rendering another identity/event, including renewed sessions.
  return <AnalyticsContent key={`${session?.user.id}:${session?.access_token}:${id}`} eventId={id} />
}
function AnalyticsContent({ eventId }: { eventId: string }) {
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [demographics, setDemographics] = useState<EventDemographics | null>(null)
  const [demographicsError, setDemographicsError] = useState(false)
  const [data, setData] = useState<EventOccupancy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(true)
  const [stale, setStale] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    document.title = 'Estadísticas del evento · PlanIt'
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    const invalidate = () => { active = false; controller.abort(); setData(null); setDemographics(null); setDemographicsError(false); setPending(false); setStale(true); setOffline(!navigator.onLine) }
    const online = () => setOffline(false)
    window.addEventListener('offline', invalidate)
    window.addEventListener('online', online)
    const onHide = () => { if (document.hidden) invalidate() }
    document.addEventListener('visibilitychange', onHide)
    if (navigator.onLine) {
      void Promise.all([loadMyEventOccupancy(eventId, controller.signal), loadMyEventDemographics(eventId, controller.signal).catch(() => null)]).then(([value, demo]) => {
        if (value.event_id !== eventId) throw new Error('No pudimos leer la ocupación del evento.')
        if (active) { setData(value); setDemographics(demo?.event_id === eventId ? demo : null); setDemographicsError(!demo || demo.event_id !== eventId); setPending(false) }
      }).catch(reason => {
        if (active) { setError(controller.signal.aborted ? 'La consulta tardó demasiado. Volvé a intentar.' : reason instanceof Error ? reason.message : 'No pudimos cargar la ocupación.'); setPending(false) }
      }).finally(() => window.clearTimeout(timeout))
    } else { queueMicrotask(() => { if (active) { setPending(false); setStale(true) } }) }
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); window.removeEventListener('offline', invalidate); window.removeEventListener('online', online); document.removeEventListener('visibilitychange', onHide) }
  }, [eventId, attempt])
  function refresh() { setData(null); setDemographics(null); setDemographicsError(false); setError(null); setStale(false); setPending(true); setAttempt(value => value + 1) }
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: ['/home', '/map'].includes(location.state?.returnTo) ? location.state.returnTo : undefined }
  const count = new Intl.NumberFormat('es-AR')
  const percent = data?.capacity_usable ? formatOccupancyPercent(data.occupancy_percent) : 'N/D'
  const stateLabels = { open: 'Evento vigente', ended: 'Evento finalizado', cancelled: 'Evento cancelado', archived: 'Evento archivado' }
  return <section className="management-page analytics-page">
    <div className="management-wash" aria-hidden="true" />
    <Link className="secondary-link management-back" to={`/events/${eventId}`} state={origin}><Icon name="back" />Volver al evento</Link>
    <header className="management-header"><h1>Estadísticas del evento</h1><p>Estado actual de inscripciones</p></header>
    <div className="analytics-toolbar"><Link className="secondary-link" to={origin.myEventsReturnTo ?? '/my-events?section=organizing'}>Mis eventos</Link><button className="secondary-button" disabled={pending || offline} onClick={refresh}>{pending ? 'Consultando…' : error ? 'Reintentar' : 'Actualizar datos'}</button></div>
    <div aria-live="polite" aria-busy={pending}>
      {pending && <StatusMessage title="Consultando estadísticas">Esperá un momento.</StatusMessage>}
      {offline ? <StatusMessage title="Sin conexión">Conectate y elegí Actualizar datos para consultar la ocupación.</StatusMessage> : stale ? <StatusMessage title="Actualizá la ocupación">La consulta anterior dejó de estar vigente. Elegí Actualizar datos.</StatusMessage> : error ? <StatusMessage title="Estadísticas no disponibles" tone="error">{error} Indicadores no disponibles (N/D).</StatusMessage> : data && <>
        <h2 className="analytics-event-title">{data.title}</h2>
        <p className="analytics-state">{stateLabels[data.event_state]}</p>
        <dl className="analytics-kpis" aria-label="Indicadores de ocupación">
          <div><dt>Cupo total</dt><dd>{data.capacity_usable ? count.format(data.capacity) : 'N/D'}<span>lugares</span></dd></div>
          <div><dt>Inscriptos confirmados</dt><dd>{count.format(data.confirmed_count)}<span>personas</span></dd></div>
          <div><dt>Lugares disponibles</dt><dd>{data.capacity_usable ? count.format(data.available_spots) : 'N/D'}<span>lugares</span></dd></div>
          <div><dt>Ocupación</dt><dd>{percent}<span>del cupo total</span></dd></div>
        </dl>
        <section className="analytics-occupancy" aria-labelledby="occupancy-title"><h2 id="occupancy-title">Ocupación actual</h2>
          {data.capacity_usable && data.occupancy_percent !== null ? <progress max={100} value={Math.min(100, data.occupancy_percent)} aria-label={`Ocupación: ${percent}; ${count.format(data.confirmed_count)} de ${count.format(data.capacity)} lugares`}>{percent}</progress> : <p>Cupo no disponible para calcular la ocupación.</p>}
          <p>{data.confirmed_count === 0 ? 'Todavía no hay inscriptos confirmados.' : `${count.format(data.confirmed_count)} inscriptos confirmados de ${count.format(data.capacity)} lugares.`}</p>
          <p className="field-hint">Las inscripciones no acreditan presencia física. Las altas y bajas se reflejan al actualizar.</p>
        </section>
        {demographics && <DemographicsPanel data={demographics} />}
        {demographicsError && <StatusMessage title="Datos demográficos no disponibles">No pudimos consultar esta distribución. Elegí Actualizar datos para reintentar.</StatusMessage>}
        <TrendPanel eventId={eventId} revision={attempt} />
        <p className="analytics-updated">Última consulta: <time dateTime={`${data.as_of}-03:00`}>{formatEventTime(data.as_of)}</time> (hora de Argentina).</p>
      </>}
    </div>
  </section>
}
