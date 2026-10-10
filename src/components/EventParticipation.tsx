import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { changeParticipation, loadParticipationSummary, participationError, type ParticipationSummary } from '../features/events/participation'

export function EventParticipation({ eventId }: { eventId: string }) {
  const [summary, setSummary] = useState<ParticipationSummary | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const mounted = useRef(false)
  const refresh = useCallback(async (action?: 'register' | 'leave') => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setSummary(null)
    setError('')
    let operationError = ''
    try {
      if (action) {
        try { await changeParticipation(eventId, action) }
        catch (cause) { operationError = participationError(cause) }
      }
      // Reconcile even on failure/lost response. Never increment occupancy locally.
      const current = await loadParticipationSummary(eventId)
      if (mounted.current) { setSummary(current); setError(operationError) }
    } catch {
      if (mounted.current) setError(`${operationError ? `${operationError} ` : ''}No pudimos consultar el estado actual. Revisá la conexión y actualizá.`)
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }, [eventId])
  useEffect(() => {
    mounted.current = true
    const initial = window.setTimeout(() => void refresh(), 0)
    const update = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    const timer = window.setInterval(update, 30000)
    return () => { mounted.current = false; window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
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
    {summary && (summary.is_organizer || summary.own_status === 'confirmed') && <Link className="secondary-link" to={`/events/${eventId}/chat`}>Abrir chat del evento</Link>}
    {summary?.own_status === 'cancelled' && <p className="participation-notice" role="status">Tu participación está cancelada.</p>}
    <button className="gradient-link gradient-button participation-action" disabled={pending || !(canLeave || canJoin)} onClick={() => void refresh(canLeave ? 'leave' : 'register')}>
      {pending ? 'Consultando participación…' : canLeave ? 'Retirarme' : label}
    </button>
    {summary && closed && <p className="participation-notice" role="status">{label}{summary.event_state === 'archived' ? ' · Archivado' : ''}</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className="text-button" disabled={pending} onClick={() => void refresh()}>Actualizar estado</button>
  </section>
}
