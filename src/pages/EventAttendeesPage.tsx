import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { attendeesDenied, attendeesError, attendeesPageSize, loadAttendees, removeAttendee, type Attendee, type AttendeesPage, type AttendeeStatus } from '../features/events/attendees'
import { validatedMyEventsReturn } from '../features/events/my-events'
import '../styles/event-management.css'
import './event-attendees.css'
import { loadParticipationSummary } from '../features/events/participation'
import { EventSocialParticipants } from './EventSocialParticipants'

export function EventAttendeesPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  const location = useLocation()
  return <><div className="management-wash" aria-hidden="true" /><AttendeesEntry key={`${id}:${session?.user.id}:${session?.access_token}:${location.search}`} eventId={id} /></>
}
function AttendeesEntry({ eventId }: { eventId: string }) {
  const location = useLocation()
  const social = new URLSearchParams(location.search).get('view') === 'social'
  const [owner, setOwner] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (social) return
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    const timer = window.setTimeout(() => {
      setOwner(null); setFailed(false)
      void loadParticipationSummary(eventId, controller.signal).then(summary => { if (active) setOwner(summary.is_organizer) }).catch(() => { if (active) setFailed(true) }).finally(() => window.clearTimeout(timeout))
    }, 0)
    return () => { active = false; controller.abort(); window.clearTimeout(timer); window.clearTimeout(timeout) }
  }, [eventId, social, attempt])
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: location.state?.returnTo === '/home' || location.state?.returnTo === '/map' ? location.state.returnTo : undefined }
  if (social || owner === false) return <EventSocialParticipants eventId={eventId} origin={origin} />
  if (owner) return <AttendeesContent eventId={eventId} />
  return <section className="management-page"><Link className="secondary-link management-back" to={`/events/${eventId}`} state={origin}><Icon name="back" />Volver al evento</Link><StatusMessage title={failed ? 'Asistentes no disponibles' : 'Consultando asistentes'}>{failed ? 'No pudimos comprobar el evento y tus permisos.' : 'Esperá un momento.'}</StatusMessage>{failed && <button className="secondary-button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>}</section>
}
function AttendeesContent({ eventId }: { eventId: string }) {
  const location = useLocation()
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: location.state?.returnTo === '/home' || location.state?.returnTo === '/map' ? location.state.returnTo : undefined }
  const [status, setStatus] = useState<AttendeeStatus>('confirmed')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState<AttendeesPage | null>(null)
  const [pending, setPending] = useState(true)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState<Attendee | null>(null)
  const [removing, setRemoving] = useState(false)
  const lifetime = useRef({ mounted: false, revision: 0 })
  const offset = useRef(0)
  const fetching = useRef(false)
  const locked = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const update = useRef<HTMLButtonElement>(null)
  useEffect(() => { const state = lifetime.current; state.mounted = true; return () => { state.mounted = false; state.revision++ } }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])
  const fetchPage = useCallback(async (append = false) => {
    if (append && fetching.current) return
    const request = ++lifetime.current.revision
    fetching.current = true
    setPending(true); setError(''); setDenied(false)
    if (!append) { offset.current = 0; setPage(null) }
    try {
      const data = await loadAttendees(eventId, status, query, append ? offset.current : 0)
      if (!lifetime.current.mounted || lifetime.current.revision !== request) return
      offset.current += attendeesPageSize
      setPage(previous => ({ ...data, attendees: append && previous ? [...new Map([...previous.attendees, ...data.attendees].map(row => [row.participation_id, row])).values()] : data.attendees }))
    } catch (failure) {
      if (lifetime.current.mounted && lifetime.current.revision === request) {
        const forbidden = attendeesDenied(failure)
        setDenied(forbidden); setError(attendeesError(failure))
        if (forbidden) setPage(null)
      }
    } finally {
      if (lifetime.current.mounted && lifetime.current.revision === request) { fetching.current = false; setPending(false) }
    }
  }, [eventId, status, query])
  useEffect(() => {
    document.title = 'Asistentes · PlanIt'
    const state = lifetime.current
    const timer = window.setTimeout(() => void fetchPage(), 0)
    return () => { window.clearTimeout(timer); state.revision++ }
  }, [fetchPage])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && !locked.current && !confirm && !fetching.current) void fetchPage() }
    window.addEventListener('focus', refresh); window.addEventListener('online', refresh); document.addEventListener('visibilitychange', refresh)
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [fetchPage, confirm])
  useEffect(() => {
    if (confirm) { dialog.current?.showModal(); cancel.current?.focus() }
    else if (dialog.current?.open) {
      dialog.current.close()
      const frame = window.requestAnimationFrame(() => (trigger.current?.isConnected ? trigger.current : update.current)?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
  }, [confirm])
  function closeDialog() {
    if (locked.current) return
    setConfirm(null)
  }
  async function remove() {
    if (!confirm || locked.current) return
    locked.current = true; setRemoving(true); setNotice(''); setError('')
    let failure: unknown
    try {
      await removeAttendee(eventId, confirm.participation_id)
      if (lifetime.current.mounted) setNotice(`La inscripción de ${confirm.display_name} fue removida del evento.`)
    } catch (cause) { failure = cause }
    if (lifetime.current.mounted) {
      await fetchPage()
      if (failure && lifetime.current.mounted) setError(attendeesError(failure))
    }
    locked.current = false
    if (lifetime.current.mounted) { setRemoving(false); closeDialog() }
  }
  return <section className="attendees-page management-page" aria-label="Administración de asistentes">
    <Link className="secondary-link management-back attendees-back" to={`/events/${eventId}`} state={origin}><Icon name="back" />Volver al evento</Link>
    <header className="management-header"><h1>Asistentes</h1>{page && <><p className="attendees-capacity">{page.confirmed_count} / {page.capacity} asistentes</p><p className="attendees-event-title management-event-title">{page.title}</p></>}</header>
    {page && <Link className="secondary-link" to={`/events/${eventId}/attendees?view=social`} state={origin}>Ver participantes</Link>}
    {!denied && <>
      <div className="attendees-filters" role="group" aria-label="Estado de inscripción">
        {(['confirmed', 'removed'] as const).map(value => <button key={value} type="button" aria-pressed={status === value} disabled={removing} onClick={() => { setStatus(value); setNotice('') }}>{value === 'confirmed' ? 'Confirmados' : 'Removidos'}{page && <span>{value === 'confirmed' ? page.confirmed_count : page.removed_count}</span>}</button>)}
        {page && <Link className="requests-filter" to={`/events/${eventId}/rejoin-requests`} state={origin}>Solicitudes{page.pending_count !== undefined && <span>{page.pending_count}</span>}</Link>}
      </div>
      <span className="attendees-search-label" id="attendees-search-label">Buscar por nombre</span><label className="attendees-search"><Icon name="search" /><span className="visually-hidden">Buscar asistentes por nombre</span><input aria-labelledby="attendees-search-label" type="search" placeholder="Buscar asistentes…" maxLength={120} value={search} disabled={removing} onChange={e => { setSearch(e.target.value); setNotice('') }} /></label>
    </>}
    <div className="attendees-update"><button ref={update} className="text-button" disabled={pending || removing} onClick={() => void fetchPage()}>Actualizar asistentes</button></div>
    <p className="attendees-notice" role="status">{notice}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    {denied ? <StatusMessage title="Asistentes no disponibles">No encontramos el evento o no tenés permiso para administrar sus asistentes.</StatusMessage> : <div aria-busy={pending}>
      {pending && <p role="status">Cargando asistentes…</p>}
      {!pending && !page && error && <button className="secondary-button" onClick={() => void fetchPage()}>Reintentar</button>}
      {page && <>
        {page.event_state !== 'open' && <p className="participation-notice">{page.event_state === 'ended' ? 'Evento finalizado' : page.event_state === 'cancelled' ? 'Evento cancelado' : 'Evento archivado'} · Asistentes de sólo lectura.</p>}
        {!page.attendees.length && <StatusMessage title={query ? 'Sin resultados' : status === 'confirmed' ? 'Todavía no hay asistentes confirmados' : 'No hay asistentes removidos'}>{query ? 'Probá con otro nombre.' : 'Las inscripciones y bajas se reflejan al actualizar.'}</StatusMessage>}
        <ul className="attendees-list">{page.attendees.map(row => <li key={row.participation_id}>
          <span className="attendee-avatar" aria-hidden="true">{row.display_name.trim().split(/\s+/).slice(0, 2).map(word => [...word][0]).join('').toLocaleUpperCase()}</span>
          <div className="attendee-identity"><strong>{row.display_name}</strong><span>@{row.username}</span></div>
          <span className={`attendee-status attendee-${row.status}`}>{row.status === 'confirmed' ? 'Confirmado' : 'Removido'}</span>
          {row.status === 'confirmed' && page.event_state === 'open' && <details className="attendee-actions" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false }} onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus() } }}>
            <summary aria-label={`Acciones de ${row.display_name}`}><Icon name="more" /></summary>
            <button type="button" disabled={pending || removing || search.trim() !== query} onClick={e => { trigger.current = e.currentTarget.closest('details')?.querySelector('summary') ?? update.current; e.currentTarget.closest('details')?.removeAttribute('open'); setConfirm(row) }}>Remover</button>
          </details>}
        </li>)}</ul>
        {page.has_more && <button className="secondary-button" disabled={pending || removing} onClick={() => void fetchPage(true)}>Cargar más asistentes</button>}
      </>}
    </div>}
    <dialog className="attendees-dialog management-dialog" ref={dialog} tabIndex={-1} aria-labelledby="remove-attendee-title" aria-describedby="remove-attendee-description" onCancel={e => { e.preventDefault(); closeDialog() }} onKeyDown={e => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (!buttons.length) e.currentTarget.focus()
      else buttons[(current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
    }}>
      <button className="attendees-dialog-close" aria-label="Cerrar confirmación" disabled={removing} onClick={closeDialog}><Icon name="close" /></button>
      <span className="attendees-danger-icon"><Icon name="userRemove" /></span>
      <h2 id="remove-attendee-title">Remover asistente</h2>
      <p id="remove-attendee-description">¿Estás seguro de que querés remover a {confirm?.display_name} de este evento?</p>
      <p className="field-hint">Dejará de ocupar cupo y de acceder al chat. Su inscripción e historial se conservan.</p>
      <div><button ref={cancel} className="secondary-button" disabled={removing} onClick={closeDialog}>Cancelar</button><button className="attendees-remove management-danger" disabled={removing} onClick={() => void remove()}>{removing ? 'Removiendo…' : 'Remover'}</button></div>
    </dialog>
  </section>
}
