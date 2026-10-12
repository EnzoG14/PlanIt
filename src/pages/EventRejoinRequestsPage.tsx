import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { attendeesDenied } from '../features/events/attendees'
import { validatedMyEventsReturn } from '../features/events/my-events'
import { loadRejoinRequests, loadRejoinResolution, resolveRejoin, rejoinError, type RejoinDecision, type RejoinPage, type RejoinRequest } from '../features/events/rejoin'
import { formatEventTime } from '../features/events/validation'
import './event-attendees.css'
import './event-rejoin.css'

export function EventRejoinRequestsPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <RequestsContent key={`${id}:${session?.user.id}`} eventId={id} />
}
function RequestsContent({ eventId }: { eventId: string }) {
  const location = useLocation()
  const { session } = useAuth()
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: location.state?.returnTo === '/home' || location.state?.returnTo === '/map' ? location.state.returnTo : undefined }
  const [page, setPage] = useState<RejoinPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selection, setSelection] = useState<{ request: RejoinRequest; decision: RejoinDecision } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const life = useRef({ active: false, revision: 0 })
  const offset = useRef(0)
  const fetching = useRef(false)
  const locked = useRef(false)
  const unresolved = useRef(new Set<string>())
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const update = useRef<HTMLButtonElement>(null)
  useEffect(() => { const state = life.current; state.active = true; return () => { state.active = false; state.revision++ } }, [])
  const refresh = useCallback(async (append = false) => {
    if (append && fetching.current) return
    const revision = ++life.current.revision
    fetching.current = true; setLoading(true); setError('')
    if (!append) { offset.current = 0; setPage(null) }
    try {
      const data = await loadRejoinRequests(eventId, append ? offset.current : 0)
      if (!life.current.active || life.current.revision !== revision) return
      offset.current += 30
      setDenied(false)
      setPage(previous => ({ ...data, requests: append && previous ? [...new Map([...previous.requests, ...data.requests].map(row => [row.request_id, row])).values()] : data.requests }))
    } catch (cause) {
      if (life.current.active && life.current.revision === revision) { setDenied(attendeesDenied(cause)); setError(rejoinError(cause)); if (attendeesDenied(cause)) setPage(null) }
    } finally { if (life.current.active && life.current.revision === revision) { fetching.current = false; setLoading(false) } }
  }, [eventId])
  useEffect(() => {
    document.title = 'Solicitudes de reincorporación · PlanIt'
    const timer = window.setTimeout(() => { if (!locked.current) void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh, session?.access_token])
  useEffect(() => {
    const change = () => { if (document.visibilityState === 'visible' && !locked.current && !fetching.current && !selection) void refresh() }
    window.addEventListener('focus', change); window.addEventListener('online', change); document.addEventListener('visibilitychange', change)
    return () => { window.removeEventListener('focus', change); window.removeEventListener('online', change); document.removeEventListener('visibilitychange', change) }
  }, [refresh, selection])
  useEffect(() => {
    if (selection) { dialog.current?.showModal(); cancel.current?.focus() }
    else if (dialog.current?.open) { dialog.current.close(); requestAnimationFrame(() => (trigger.current?.isConnected ? trigger.current : update.current)?.focus()) }
  }, [selection])
  function close() { if (!locked.current) { setSelection(null); setUncertain(false) } }
  async function resolve(checkOnly = false) {
    if (!selection || locked.current) return
    locked.current = true; setSaving(true); setError(''); setNotice('')
    let failure: unknown
    let status: 'pending' | RejoinDecision | undefined
    try {
      if (!checkOnly && !unresolved.current.has(selection.request.request_id)) { try { await resolveRejoin(eventId, selection.request.request_id, selection.decision); status = selection.decision } catch (cause) { failure = cause; unresolved.current.add(selection.request.request_id) } }
      if (!life.current.active) return
      if (!status) status = await loadRejoinResolution(eventId, selection.request.request_id)
      if (!life.current.active) return
      unresolved.current.delete(selection.request.request_id)
      setUncertain(false)
      await refresh()
      if (!life.current.active) return
      if (status === 'pending') setError(failure ? rejoinError(failure) : 'La solicitud sigue pendiente. Podés volver a resolverla.')
      else setNotice(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}: ${selection.request.display_name}.${status === 'rejected' ? ' El usuario deberá esperar siete días para volver a solicitar.' : ''}`)
      setSelection(null)
    } catch (cause) {
      if (life.current.active) { unresolved.current.add(selection.request.request_id); setUncertain(true); setError(`No pudimos comprobar la resolución. ${rejoinError(cause)}`) }
    } finally { locked.current = false; if (life.current.active) setSaving(false) }
  }
  const approve = selection?.decision === 'approved'
  return <section className="attendees-page rejoin-page" aria-label="Solicitudes de reincorporación">
    <Link className="secondary-link attendees-back" to={`/events/${eventId}/attendees`} state={origin}><Icon name="back" />Volver a asistentes</Link>
    <header><h1>Solicitudes de reincorporación</h1><p className="attendees-event-title">Usuarios removidos que solicitaron volver a participar del evento</p>{page && <><p>{page.title}</p><p className="attendees-capacity">{page.confirmed_count} / {page.capacity} asistentes · {page.pending_count} solicitudes pendientes</p></>}</header>
    <div className="attendees-update"><button ref={update} className="text-button" disabled={loading || saving || !!selection} onClick={() => void refresh()}>Actualizar solicitudes</button></div>
    <p className="attendees-notice" role="status">{notice}</p>
    {!selection && error && <p role="alert" className="field-error">{error}</p>}
    {denied ? <StatusMessage title="Solicitudes no disponibles">No encontramos el evento o no tenés permiso para administrar sus solicitudes.</StatusMessage> : <div aria-busy={loading}>
      {loading && <p role="status">Cargando solicitudes…</p>}
      {!loading && !page && error && <button className="secondary-button" onClick={() => void refresh()}>Reintentar</button>}
      {page && <>
        {page.event_state !== 'open' && <p className="participation-notice">El evento está cerrado. Podés rechazar solicitudes pendientes; no aprobarlas.</p>}
        {!page.requests.length && <StatusMessage title="No hay solicitudes pendientes">Los pedidos y resoluciones se reflejan al actualizar.</StatusMessage>}
        <ul className="rejoin-list">{page.requests.map(row => <li key={row.request_id}>
          <div className="rejoin-identity"><span className="attendee-avatar" aria-hidden="true">{row.display_name.trim().split(/\s+/).slice(0,2).map(word => [...word][0]).join('').toLocaleUpperCase()}</span><div className="attendee-identity"><strong>{row.display_name}</strong><span>@{row.username}</span></div><span className="rejoin-pending">Pendiente</span></div>
          <p className="rejoin-date"><Icon name="calendar" />Solicitó: {formatEventTime(row.requested_at)}</p>
          <div className="rejoin-actions">{(['approved','rejected'] as const).map(decision => <button key={decision} className={decision === 'approved' ? 'gradient-button gradient-link' : 'rejoin-reject'} disabled={loading || saving || (decision === 'approved' && page.event_state !== 'open')} aria-label={`${decision === 'approved' ? 'Aprobar' : 'Rechazar'} solicitud de ${row.display_name}`} onClick={e => { trigger.current = e.currentTarget; setUncertain(unresolved.current.has(row.request_id)); setError(''); setSelection({ request: row, decision }) }}><Icon name={decision === 'approved' ? 'check' : 'close'} />{decision === 'approved' ? 'Aprobar' : 'Rechazar'}</button>)}</div>
        </li>)}</ul>
        {page.has_more && <button className="secondary-button" disabled={loading || saving} onClick={() => void refresh(true)}>Cargar más solicitudes</button>}
        <p className="rejoin-info">Luego de rechazar, el usuario deberá esperar siete días desde la resolución para realizar una nueva solicitud.</p>
      </>}
    </div>}
    <dialog ref={dialog} className="attendees-dialog" aria-labelledby="rejoin-title" aria-describedby="rejoin-description" tabIndex={-1} onCancel={e => { e.preventDefault(); close() }} onKeyDown={e => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (!buttons.length) e.currentTarget.focus()
      else buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
    }}>
      <button className="attendees-dialog-close" disabled={saving} aria-label="Cerrar confirmación" onClick={close}>×</button>
      <h2 id="rejoin-title">{approve ? 'Aprobar' : 'Rechazar'} solicitud</h2>
      <p id="rejoin-description">¿Querés {approve ? 'aprobar' : 'rechazar'} la reincorporación de {selection?.request.display_name}?</p>
      <p className="field-hint">{approve ? 'Volverá a participar si el evento sigue vigente y hay cupo. Sin plaza, la solicitud seguirá pendiente.' : 'Su participación seguirá removida. Deberá esperar siete días desde este rechazo para volver a solicitar.'}</p>
      {selection && error && <p className="field-error" role="alert">{error}</p>}
      <div><button ref={cancel} className="secondary-button" disabled={saving} onClick={close}>Cancelar</button><button className={approve ? 'gradient-button gradient-link' : 'attendees-remove'} disabled={saving} onClick={() => void resolve(uncertain)}>{saving ? 'Comprobando…' : uncertain ? 'Comprobar estado' : approve ? 'Aprobar' : 'Rechazar'}</button></div>
    </dialog>
  </section>
}
