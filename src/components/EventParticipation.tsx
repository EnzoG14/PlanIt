import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { changeParticipation, loadParticipationSummary, participationError, type ParticipationSummary } from '../features/events/participation'
import { loadRejoinStatus, requestRejoin, rejoinError, type RejoinStatus } from '../features/events/rejoin'
import { formatEventTime } from '../features/events/validation'
import '../pages/event-rejoin.css'

export function EventParticipation({ eventId, onSummary }: { eventId: string; onSummary?: (summary: ParticipationSummary | null) => void }) {
  const location = useLocation()
  const [summary, setSummary] = useState<ParticipationSummary | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState('')
  const [rejoin, setRejoin] = useState<RejoinStatus | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const busy = useRef(false)
  const mounted = useRef(false)
  const revision = useRef({ value: 0 })
  const refresh = useCallback(async (action?: 'register' | 'leave' | 'rejoin') => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setSummary(null)
    if (action) onSummary?.(null)
    setRejoin(null)
    setError('')
    let operationError = ''
    const request = ++revision.current.value
    const current = () => mounted.current && revision.current.value === request
    try {
      if (action) {
        try { if (action === 'rejoin') await requestRejoin(eventId); else await changeParticipation(eventId, action) }
        catch (cause) { operationError = action === 'rejoin' ? rejoinError(cause) : participationError(cause) }
      }
      // Reconcile even on failure/lost response. Never increment occupancy locally.
      const summaryData = await loadParticipationSummary(eventId)
      if (!current()) return
      setSummary(summaryData)
      onSummary?.(summaryData)
      if (!summaryData.is_organizer && (summaryData.own_status === 'removed' || summaryData.own_status === 'confirmed')) {
        try {
          const status = await loadRejoinStatus(eventId)
          if (current()) { setRejoin(status); setUncertain(false); if (action === 'rejoin' && status.status === 'pending') operationError = '' }
        } catch (cause) {
          if (current()) { setUncertain(true); operationError = `${operationError ? `${operationError} ` : ''}${rejoinError(cause)}` }
        }
      }
      if (current()) setError(operationError)
    } catch {
      if (current()) onSummary?.(null)
      if (current()) { setUncertain(true); setError(`${operationError ? `${operationError} ` : ''}No pudimos consultar el estado actual. Revisá la conexión y actualizá.`) }
    } finally {
      if (current()) { busy.current = false; setPending(false) }
    }
  }, [eventId, onSummary])
  useEffect(() => {
    const state = revision.current
    mounted.current = true
    const initial = window.setTimeout(() => void refresh(), 0)
    const update = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    const timer = window.setInterval(update, 30000)
    window.addEventListener('online', update)
    return () => { mounted.current = false; state.value++; busy.current = false; window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener('focus', update); window.removeEventListener('online', update); document.removeEventListener('visibilitychange', update) }
  }, [refresh])

  const closed = summary?.event_state !== 'open'
  const label = !summary ? 'Consultando participación…'
    : summary.event_state === 'ended' ? 'Evento finalizado'
    : closed ? 'Evento cancelado'
    : summary.is_organizer ? 'Organizás este evento'
    : summary.own_status === 'removed' ? 'Reingreso sujeto a aprobación'
    : summary.own_status === 'confirmed' ? 'Retirarme'
    : summary.available_spots === 0 ? 'Evento completo' : 'Unirme'
  // A holder can still leave an ended/cancelled event; registration stays disabled.
  const canLeave = summary?.own_status === 'confirmed' && !summary.is_organizer
  const canJoin = summary && !closed && !summary.is_organizer && summary.own_status !== 'removed' && summary.own_status !== 'confirmed' && summary.available_spots > 0
  return <section className="event-participation" aria-label="Participación y cupos" aria-busy={pending}>
    <div className="event-capacity"><Icon name="people" /><div>
      {summary ? <><strong>{summary.confirmed_count} / {summary.capacity} confirmados</strong>
        <progress className="capacity-bar" max={summary.capacity} value={summary.confirmed_count} aria-label="Ocupación del evento" />
        <p>{summary.available_spots} cupos disponibles</p></> : <p role="status">{pending ? 'Consultando cupos…' : 'Cupos sin confirmar'}</p>}
    </div></div>
    {summary?.is_organizer && <p className="participation-notice">Organizás este evento. No ocupás cupo ni podés inscribirte.</p>}
    {summary?.own_status === 'confirmed' && <p className="participation-notice" role="status">Ya participás.</p>}
    {summary && (summary.is_organizer || summary.own_status === 'confirmed') && <div className="participation-links">
      <Link className="secondary-link" to={`/events/${eventId}/chat`}>Abrir chat del evento</Link>
      <Link className="secondary-link" to={`/events/${eventId}/attendees?view=social`} state={location.state}>Ver participantes</Link>
    </div>}
    {summary?.own_status === 'cancelled' && <p className="participation-notice" role="status">Tu participación está cancelada.</p>}
    {summary?.own_status === 'removed' && <div className={`rejoin-own-state rejoin-state-${rejoin?.status ?? 'eligible'}`} role="status">
      <strong>{rejoin?.status === 'pending' ? 'Solicitud en revisión' : rejoin?.status === 'rejected' ? 'Solicitud rechazada' : 'Solicitud de reincorporación'}</strong>
      <p>{rejoin?.status === 'pending' ? 'Tu solicitud fue enviada al organizador. Sigue pendiente de resolución.' : rejoin?.status === 'rejected' && rejoin.next_eligible_at ? `Podés volver a solicitar desde el ${formatEventTime(rejoin.next_eligible_at)} (hora de Argentina).` : 'Tu inscripción fue removida. Podés pedir al organizador volver a participar si el evento sigue vigente.'}</p>
      {!closed && rejoin?.can_request && <button className="gradient-button gradient-link" disabled={pending || uncertain} onClick={() => void refresh('rejoin')}>Solicitar reincorporación</button>}
    </div>}
    {summary?.own_status === 'confirmed' && rejoin?.status === 'approved' && <p className="participation-notice rejoin-approved" role="status">Solicitud aprobada. Volvés a participar del evento.</p>}
    {summary && closed && <p className="participation-notice" role="status">{label}{summary.event_state === 'archived' ? ' · Archivado' : ''}</p>}
    {error && <><p className="field-error" role="alert">{error}</p><button className="text-button" disabled={pending} onClick={() => void refresh()}>Reintentar</button></>}

    <button className={`gradient-link gradient-button participation-action${canJoin ? ' participation-action-floating' : ''}`} disabled={pending || !(canLeave || canJoin)} onClick={() => void refresh(canLeave ? 'leave' : 'register')}>
      {pending ? 'Consultando participación…' : canLeave ? 'Retirarme' : label}
    </button>
  </section>
}
