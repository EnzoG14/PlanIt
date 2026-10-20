import { useBackLocation as useLocation } from '../components/back-navigation-context'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GradientButton } from '../components/GradientButton'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadEvent } from '../features/events/api'
import { bindInviteOwner, captureInviteFromHash, clearInviteToken, currentInviteToken, redeemInvite } from '../features/events/invite'
import './invite.css'

type Phase = 'idle' | 'opening' | 'unavailable' | 'network' | 'auth'
const NEXT = encodeURIComponent('/invite')

export function InvitePage() {
  const { session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const hasHash = location.hash !== ''
  // Move the secret out of the address bar before the page (or anything else) can read or share it.
  if (hasHash) captureInviteFromHash(location.hash)
  useEffect(() => {
    if (hasHash) navigate({ pathname: location.pathname, search: location.search }, { replace: true })
  }, [hasHash, location.pathname, location.search, navigate])
  if (hasHash) return null
  // A different identity starts clean: the pending secret is bound to one account.
  return <InviteContent key={session?.user.id ?? 'anon'} />
}

function InviteContent() {
  const { session, loading, error: sessionError } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user.id ?? null
  const [token, setToken] = useState<string | null>(() => currentInviteToken(userId))
  const [phase, setPhase] = useState<Phase>('idle')
  const [attempt, setAttempt] = useState(0)
  const [eventId, setEventId] = useState<string | null>(null)
  const feedback = useRef<HTMLDivElement>(null)
  useEffect(() => { document.title = 'Invitación · PlanIt' }, [])
  useEffect(() => {
    if (loading || sessionError || !userId || !token) return
    let active = true
    bindInviteOwner(userId)
    void (async () => {
      const result = await redeemInvite(token)
      if (!active) return
      if (result.kind === 'unavailable') { clearInviteToken(); setToken(null); setPhase('unavailable'); return }
      if (result.kind !== 'ok') { setPhase(result.kind); return }
      // Never announce access before the server-authorized detail is read back.
      try {
        const event = await loadEvent(result.eventId)
        if (!active) return
        if (!event) { setPhase('network'); return }
        clearInviteToken()
        setEventId(result.eventId)
        setPhase('opening')
        navigate(`/events/${result.eventId}`, { replace: true })
      } catch { if (active) setPhase('network') }
    })()
    return () => { active = false }
  }, [loading, sessionError, userId, token, attempt, navigate])
  useEffect(() => { if (phase !== 'idle') feedback.current?.focus() }, [phase])

  function cancel() { clearInviteToken(); setToken(null); setPhase('idle'); navigate('/map', { replace: true }) }
  if (sessionError) return null // AppLayout shows the error and retry action.
  const signedOutActions = <div className="invite-actions">
    <Link className="gradient-link" to={`/login?next=${NEXT}`}>Ingresar</Link>
    <Link className="secondary-link" to={`/register?next=${NEXT}`}>Crear cuenta</Link>
    <button type="button" className="text-button" onClick={cancel}>Cancelar</button>
  </div>
  let body
  if (loading) body = <StatusMessage title="Comprobando sesión">Esperá un momento para continuar.</StatusMessage>
  else if (phase === 'unavailable' || (!token && phase === 'idle')) body = <>
    <StatusMessage title={phase === 'unavailable' ? 'Invitación no disponible' : 'No encontramos la invitación'} tone="error">
      {phase === 'unavailable'
        ? 'El enlace no es válido, ya no está activo o no podemos darte acceso a este evento. Pedile uno nuevo a quien lo organiza.'
        : 'Abrí de nuevo el enlace completo que te compartieron. Si recargaste la página, hay que abrirlo otra vez.'}
    </StatusMessage>
    <div className="invite-actions"><Link className="secondary-link" to="/map">Ir al mapa</Link></div>
  </>
  else if (!session) body = <>
    <p className="invite-lead">Ingresá o creá una cuenta para abrir la invitación. Abrirla no te inscribe en el evento.</p>
    {signedOutActions}
  </>
  else if (phase === 'network') body = <>
    <StatusMessage title="No pudimos comprobar la invitación" tone="error">Revisá tu conexión. Tu acceso no cambió y podés reintentar sin riesgo.</StatusMessage>
    <div className="invite-actions">
      <GradientButton type="button" onClick={() => { setPhase('idle'); setAttempt(value => value + 1) }}>Reintentar</GradientButton>
      <button type="button" className="text-button" onClick={cancel}>Cancelar</button>
    </div>
  </>
  else if (phase === 'auth') body = <>
    <StatusMessage title="Tu sesión venció" tone="error">Ingresá de nuevo para abrir la invitación.</StatusMessage>
    {signedOutActions}
  </>
  else if (phase === 'opening') body = <>
    <StatusMessage title="Acceso confirmado">Abriendo el evento. La invitación no te inscribió: podés hacerlo desde el detalle.</StatusMessage>
    {eventId && <div className="invite-actions"><Link className="gradient-link" to={`/events/${eventId}`} replace>Ver evento</Link></div>}
  </>
  else body = <StatusMessage title="Comprobando la invitación">Esperá un momento.</StatusMessage>
  return <div className="invite-page">
    <header className="invite-header">
      <h1>{session ? 'Invitación a un evento' : 'Te invitaron a un evento'}</h1>
    </header>
    <div ref={feedback} tabIndex={-1} className="invite-feedback" role="status" aria-live="polite" aria-busy={phase === 'idle' && Boolean(token && session)}>{body}</div>
  </div>
}
