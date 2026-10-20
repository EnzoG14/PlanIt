import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { GradientButton } from '../components/GradientButton'
import { SocialAvatar } from '../components/SocialAvatar'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadFollowRequests, loadIncomingFollow, resolveFollowRequest, type FollowDecision, type RequestPage } from '../features/social/requests'
import { useSocialRead } from '../features/social/useSocialRead'
import { formatEventTime } from '../features/events/validation'
import '../styles/event-management.css'
import './social-participants.css'
import './social-follows.css'
import './follow-requests.css'

type Operation = { followerId: string; version: string; decision: FollowDecision }
export function FollowRequestsPage() {
  const { session } = useAuth()
  return session ? <RequestsContent key={`${session.user.id}:${session.access_token}`} userId={session.user.id} /> : null
}
function RequestsContent({ userId }: { userId: string }) {
  const [pages, setPages] = useState(1)
  const [confirmation, setConfirmation] = useState<Operation | null>(null)
  const [uncertain, setUncertain] = useState<Operation | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const request = useRef<AbortController | null>(null)
  const mounted = useRef(false)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const cancelButton = useRef<HTMLButtonElement | null>(null)
  const feedback = useRef<HTMLParagraphElement | null>(null)
  const load = useCallback(async (signal: AbortSignal) => {
    let result: RequestPage = { requests: [], next_cursor: null }
    for (let index = 0; index < pages; index++) {
      const next = await loadFollowRequests(result.next_cursor, signal)
      result = { requests: [...new Map([...result.requests, ...next.requests].map(row => [row.follower_id, row])).values()], next_cursor: next.next_cursor }
      if (!result.next_cursor) break
    }
    return result
  }, [pages])
  const { data, loading, denied, error, refresh } = useSocialRead(load)
  useEffect(() => {
    mounted.current = true
    document.title = 'Solicitudes de seguimiento · PlanIt'
    const clear = () => { request.current?.abort(); setConfirmation(null) }
    const visibility = () => { if (document.visibilityState !== 'visible') clear() }
    window.addEventListener('offline', clear); document.addEventListener('visibilitychange', visibility)
    return () => { mounted.current = false; request.current?.abort(); window.removeEventListener('offline', clear); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => { if (confirmation) cancelButton.current?.focus() }, [confirmation])
  const cancel = () => { setConfirmation(null); trigger.current?.focus() }
  async function act(operation: Operation, reconcile: boolean) {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller; setBusy(true); setConfirmation(null); setNotice('')
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    try {
      let message: string
      if (reconcile) {
        const current = await loadIncomingFollow(userId, operation.followerId, controller.signal)
        message = !current || current.request_version !== operation.version ? 'La solicitud cambió o ya no está disponible. Actualizamos la bandeja.'
          : current.status === 'pending' ? 'La solicitud sigue pendiente. Podés volver a elegir una acción.'
          : current.status === 'accepted' ? 'La solicitud está aceptada.' : 'La solicitud está rechazada. Puede enviar una nueva solicitud inmediatamente, salvo bloqueo.'
      } else {
        await resolveFollowRequest(operation.followerId, operation.version, operation.decision, controller.signal)
        message = operation.decision === 'accepted' ? 'Solicitud aceptada.' : 'Solicitud rechazada. Puede enviar una nueva solicitud inmediatamente, salvo bloqueo.'
      }
      if (!mounted.current || controller.signal.aborted) throw new Error('uncertain')
      setUncertain(null); setNotice(message)
      void refresh()
      window.requestAnimationFrame(() => feedback.current?.focus())
    } catch {
      if (mounted.current) {
        setUncertain(operation)
        setNotice('No pudimos confirmar el resultado. Consultá el estado antes de volver a operar.')
        // Also clear any identity that might have been revoked during the write.
        if (document.visibilityState === 'visible' && navigator.onLine) void refresh()
      }
    } finally {
      window.clearTimeout(timeout)
      if (request.current === controller) request.current = null
      if (mounted.current) setBusy(false)
    }
  }
  const disabled = busy || uncertain !== null
  return <><section className="management-page social-identity-page follow-requests-page">
    <Link className="secondary-link management-back" to="/me" state={{ focusRequests: true }}><Icon name="back" />Volver a mi perfil</Link>
    <header className="management-header"><h1>Solicitudes de seguimiento</h1><p>Elegí quién puede seguir tu perfil privado. Al aceptar, podrá ver tu biografía y tus eventos públicos.</p></header>
    <p ref={feedback} tabIndex={-1} role="status" className="follow-request-feedback">{busy ? 'Consultando resultado…' : notice}</p>
    {uncertain && <button className="secondary-button" disabled={busy} onClick={() => void act(uncertain, true)}>Consultar estado</button>}
    <div aria-busy={loading || busy}>{loading ? <p role="status">Consultando solicitudes…</p> : denied ? <StatusMessage title="Solicitudes no disponibles">No se pueden consultar las solicitudes de esta cuenta.</StatusMessage> : error ? <><p className="field-error" role="alert">{error}</p><button className="secondary-button" onClick={() => void refresh()}>Reintentar</button></> : data && <>
      {!data.requests.length && <StatusMessage title="No hay solicitudes pendientes">Los nuevos pedidos de seguimiento aparecerán acá.</StatusMessage>}
      <ul className="social-participants-list follow-requests-list">{data.requests.map(row => {
        const selected = confirmation?.followerId === row.follower_id && confirmation.version === row.request_version
        return <li key={`${row.follower_id}:${row.request_version}`}>
          <Link className="follow-request-identity" to={`/users/${row.follower_id}`} state={{ requestsReturnTo: '/me/follow-requests' }}><SocialAvatar avatar={row.avatar} /><span className="social-follow-name"><strong>{row.display_name}</strong><span>@{row.username}</span></span></Link>
          <p className="follow-request-date">Solicitó el <time dateTime={`${row.requested_at}-03:00`}>{formatEventTime(row.requested_at)}</time></p>
          {selected ? <div className="follow-request-actions" role="group" aria-label="Confirmar resolución" onKeyDown={event => { if (event.key === 'Escape') cancel() }}>
            <p>{confirmation.decision === 'accepted' ? '¿Querés aceptar esta solicitud?' : '¿Querés rechazar esta solicitud? Podrá volver a solicitar inmediatamente, salvo bloqueo.'}</p>
            <button ref={cancelButton} className="secondary-button" onClick={cancel}>Volver</button>
            <GradientButton disabled={disabled} onClick={() => void act(confirmation, false)}>Confirmar {confirmation.decision === 'accepted' ? 'aceptación' : 'rechazo'}</GradientButton>
          </div> : <div className="follow-request-actions">{(['accepted', 'rejected'] as const).map(decision => {
            const Button = decision === 'accepted' ? GradientButton : 'button'
            return <Button key={decision} className={decision === 'rejected' ? 'secondary-button' : undefined} disabled={disabled} aria-label={`${decision === 'accepted' ? 'Aceptar' : 'Rechazar'} solicitud de @${row.username}`} onClick={event => { trigger.current = event.currentTarget; setConfirmation({ followerId: row.follower_id, version: row.request_version, decision }) }}>{decision === 'accepted' ? 'Aceptar' : 'Rechazar'}</Button>
          })}</div>}
        </li>
      })}</ul>
      {data.next_cursor && <button className="secondary-button" disabled={disabled} onClick={() => { setConfirmation(null); setPages(value => value + 1) }}>Cargar más solicitudes</button>}
    </>}</div>

  </section></>
}
