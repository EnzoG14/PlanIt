import { useBackLocation as useLocation } from '../components/back-navigation-context'
import { BackButton } from '../components/BackButton'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { validatedMyEventsReturn } from '../features/events/my-events'
import { validatedDiscoveryReturn } from '../features/events/search'
import { accessError, accessUnavailable, changeEventAccess, hasAccessState, loadAccessGrants, type AccessGrant, type AccessPage, type AccessStatus } from '../features/events/access'
import '../styles/event-management.css'
import './event-attendees.css'
import './event-access.css'

export function EventAccessPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <><div className="management-wash" aria-hidden="true" /><AccessContent key={`${id}:${session?.user.id}:${session?.access_token}`} eventId={id} /></>
}
function AccessContent({ eventId }: { eventId: string }) {
  const location = useLocation()
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: validatedDiscoveryReturn(location.state?.returnTo) ?? undefined }
  const [status, setStatus] = useState<AccessStatus>('active')
  const [page, setPage] = useState<AccessPage | null>(null)
  const [pending, setPending] = useState(true), [denied, setDenied] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState<AccessGrant | null>(null)
  const [busy, setBusy] = useState(false), [uncertain, setUncertain] = useState(false), [dialogError, setDialogError] = useState('')
  const lifetime = useRef({ mounted: false, revision: 0 })
  const cursor = useRef<string | null>(null), fetching = useRef(false), locked = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null), update = useRef<HTMLAnchorElement>(null)
  useEffect(() => { const state = lifetime.current; state.mounted = true; return () => { state.mounted = false; state.revision++ } }, [])
  const fetchPage = useCallback(async (append = false) => {
    if (append && fetching.current) return
    const request = ++lifetime.current.revision
    fetching.current = true; setPending(true); setError(''); setDenied(false)
    if (!append) { cursor.current = null; setPage(null) }
    try {
      const data = await loadAccessGrants(eventId, status, append ? cursor.current : null)
      if (!lifetime.current.mounted || lifetime.current.revision !== request) return
      cursor.current = data.next_cursor
      setPage(previous => ({ ...data, grants: append && previous ? [...new Map([...previous.grants, ...data.grants].map(row => [row.id, row])).values()] : data.grants }))
    } catch (failure) {
      if (lifetime.current.mounted && lifetime.current.revision === request) {
        setDenied(accessUnavailable(failure)); setError(accessError(failure)); setPage(null)
      }
    } finally {
      if (lifetime.current.mounted && lifetime.current.revision === request) { fetching.current = false; setPending(false) }
    }
  }, [eventId, status])
  useEffect(() => {
    document.title = 'Accesos al evento · PlanIt'
    const state = lifetime.current, timer = window.setTimeout(() => void fetchPage(), 0)
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
    setConfirm(null); setUncertain(false); setDialogError('')
  }
  async function submit() {
    if (!confirm || locked.current) return
    const row = confirm, target = row.status === 'active' ? 'revoked' : 'active'
    locked.current = true; setBusy(true); setDialogError(''); setNotice('')
    let success = false
    try {
      if (uncertain) {
        success = await hasAccessState(eventId, row.user_id, target)
        if (!success && lifetime.current.mounted) { setUncertain(false); setDialogError('La operación no figura completada. Podés volver a confirmarla.') }
      } else { await changeEventAccess(eventId, row.user_id, target); success = true }
      if (success && lifetime.current.mounted) {
        setNotice(target === 'revoked' ? `El acceso de ${row.display_name} fue revocado. Si estaba confirmado, su participación fue removida.` : `El acceso de ${row.display_name} fue restituido. Su participación y acceso al chat no cambian.`)
        await fetchPage()
      }
    } catch (failure) {
      if (lifetime.current.mounted) { setUncertain(true); setDialogError(accessError(failure)) }
    } finally {
      locked.current = false
      if (lifetime.current.mounted) { setBusy(false); if (success) closeDialog() }
    }
  }
  return <section className="access-page attendees-page management-page" aria-label="Administración de accesos">
    <BackButton ref={update} to={`/events/${eventId}`} state={origin} />
    <header className="management-header"><h1>Accesos al evento</h1><p>Administrá quién puede consultar este evento oculto.</p>{page && <p className="management-event-title">{page.title}</p>}</header>
    {!denied && <div className="attendees-filters" role="group" aria-label="Estado del permiso">
      {(['active', 'revoked'] as const).map(value => <button key={value} type="button" aria-pressed={status === value} disabled={busy || Boolean(confirm)} onClick={() => { setStatus(value); setNotice('') }}>{value === 'active' ? 'Activos' : 'Revocados'}</button>)}
    </div>}

    <p className="attendees-notice" role="status">{notice}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    {denied ? <StatusMessage title="Accesos no disponibles">Este panel está disponible sólo para el organizador de un evento oculto.</StatusMessage> : <div aria-busy={pending}>
      {pending && <p role="status">Cargando accesos…</p>}
      {!pending && !page && error && <button className="secondary-button" onClick={() => void fetchPage()}>Reintentar</button>}
      {page && <>
        {page.event_state !== 'open' && <p className="participation-notice">Evento {page.event_state === 'ended' ? 'finalizado' : page.event_state === 'cancelled' ? 'cancelado' : 'archivado'} · Accesos de sólo lectura.</p>}
        {!page.grants.length && <StatusMessage title={status === 'active' ? 'No hay accesos activos' : 'No hay accesos revocados'}>{status === 'active' ? 'Las personas que canjeen una invitación aparecerán aquí. El permiso no las inscribe como asistentes.' : 'Los permisos revocados se conservan para poder restituirlos expresamente.'}</StatusMessage>}
        <ul className="attendees-list access-list">{page.grants.map(row => <li key={row.id}>
          <span className="attendee-avatar" aria-hidden="true">{row.display_name.trim().split(/\s+/).slice(0, 2).map(word => [...word][0]).join('').toLocaleUpperCase()}</span>
          <div className="attendee-identity"><strong>{row.display_name}</strong><span>@{row.username}</span><span>{row.is_confirmed ? 'Asistente confirmado' : 'Sin participación confirmada'}</span></div>
          <span className={`attendee-status attendee-${row.status === 'active' ? 'confirmed' : 'removed'}`}>{row.status === 'active' ? 'Acceso activo' : 'Acceso revocado'}</span>
          {page.event_state === 'open' && <button className="text-button access-action" disabled={pending || busy || Boolean(confirm)} aria-label={`${row.status === 'active' ? 'Revocar' : 'Restituir'} acceso de ${row.display_name}`} onClick={e => { trigger.current = e.currentTarget; setUncertain(false); setDialogError(''); setConfirm(row) }}>{row.status === 'active' ? 'Revocar' : 'Restituir'}</button>}
        </li>)}</ul>
        {page.next_cursor && <button className="secondary-button" disabled={pending || busy || Boolean(confirm)} onClick={() => void fetchPage(true)}>Cargar más accesos</button>}
      </>}
    </div>}
    <dialog className="attendees-dialog management-dialog" ref={dialog} tabIndex={-1} aria-labelledby="access-action-title" aria-describedby="access-action-description" onCancel={e => { e.preventDefault(); closeDialog() }} onKeyDown={e => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (!buttons.length) e.currentTarget.focus()
      else buttons[(current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
    }}>
      <button className="attendees-dialog-close" aria-label="Cerrar confirmación" disabled={busy} onClick={closeDialog}><Icon name="close" /></button>
      <h2 id="access-action-title">{confirm?.status === 'active' ? 'Revocar acceso' : 'Restituir acceso'}</h2>
      <p id="access-action-description">{confirm?.status === 'active' ? `¿Querés revocar el acceso de ${confirm.display_name}? Dejará de consultar el evento oculto, aunque conserve una invitación.${confirm.is_confirmed ? ' También se removerá su participación: dejará de ocupar cupo y de acceder al chat. Su historial se conserva.' : ' Si se confirmó desde que abriste el panel, también se removerá su participación.'}` : `¿Querés restituir el acceso de ${confirm?.display_name}? Podrá consultar el evento. Esto no lo reinscribe, no ocupa cupo ni le devuelve acceso al chat.`}</p>
      {dialogError && <p role="alert" className="field-error">{dialogError}</p>}
      <div><button ref={cancel} className="secondary-button" disabled={busy} onClick={closeDialog}>Cancelar</button><button className={confirm?.status === 'active' && !uncertain ? 'management-danger' : 'gradient-link'} disabled={busy} onClick={() => void submit()}>{busy ? 'Procesando…' : uncertain ? 'Comprobar estado' : confirm?.status === 'active' ? 'Revocar acceso' : 'Restituir acceso'}</button></div>
    </dialog>
  </section>
}
