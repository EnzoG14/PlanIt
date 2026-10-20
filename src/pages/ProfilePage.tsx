import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import type { OwnProfile } from '../features/profile/api'
import { loadProfileContent, profileContentKey, type ProfileContent } from '../features/startup/content'
import { contentUpdatedAt, readContent } from '../lib/session-content'
import './profile.css'
import { participantsReturn } from '../features/social/api'
import { OwnSocialCounts } from '../components/SocialCounts'
import { followsReturn } from '../features/social/follows'
import { PushSettings } from '../features/notifications/PushSettings'

type ProfileResult = { profile: OwnProfile; avatarUrl: string | null } | { error: true }

export function ProfilePage() {
  const { session } = useAuth()
  // A new identity/token gets fresh state, including signed URLs and pending requests.
  return session ? <OwnProfileView key={`${session.user.id}:${session.access_token}`} userId={session.user.id} email={session.user.email} /> : null
}

function OwnProfileView({ userId, email }: { userId: string; email?: string }) {
  const location = useLocation()
  const interestsLink = useRef<HTMLAnchorElement>(null), editLink = useRef<HTMLAnchorElement>(null)
  const messagesLink = useRef<HTMLAnchorElement>(null)
  const requestsLink = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!location.state?.focusInterests && !location.state?.focusEdit && !location.state?.focusRequests && !location.state?.focusMessages) return
    // Restore the trigger after AppLayout applies its route-level main focus.
    const frame = window.requestAnimationFrame(() => (location.state?.focusMessages ? messagesLink : location.state?.focusRequests ? requestsLink : location.state?.focusEdit ? editLink : interestsLink).current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [location.key, location.state])
  const [result, setResult] = useState<ProfileResult | null>(() => readContent<ProfileContent>(profileContentKey(userId)) ?? null)
  const [attempt, setAttempt] = useState(0)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const refresh = () => { setResult(null); setAvatarFailed(false); setAttempt(value => value + 1) }
  useEffect(() => { document.title = 'Mi perfil · PlanIt' }, [])
  useEffect(() => {
    let active = true
    let revision = 0
    let controller = new AbortController()
    let avatarExpiry: number | undefined
    async function load(force = false) {
      const request = ++revision
      controller.abort(); controller = new AbortController()
      const signal = controller.signal
      window.clearTimeout(avatarExpiry)
      setAvatarFailed(false)
      try {
        const data = await loadProfileContent(userId, force)
        if (active && request === revision && !signal.aborted) {
          setResult(data)
          avatarExpiry = window.setTimeout(() => { if (active && request === revision) setAvatarFailed(true) }, Math.max(1, contentUpdatedAt(profileContentKey(userId)) + 45000 - Date.now()))
        }
      } catch { if (active && request === revision && !signal.aborted) setResult({ error: true }) }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); else { controller.abort() } }
    void load(attempt > 0)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false; controller.abort(); window.clearTimeout(avatarExpiry)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, attempt])
  return <div className="profile-page">
    {followsReturn(location.state?.followsReturnTo) && <Link className="secondary-link" to={followsReturn(location.state.followsReturnTo)!} state={location.state?.followsOrigin}><Icon name="back" />Volver a la lista</Link>}
    {participantsReturn(location.state?.participantsReturnTo) && <Link className="secondary-link" to={participantsReturn(location.state.participantsReturnTo)!} state={location.state}><Icon name="back" />Volver a participantes</Link>}
    <header className="profile-heading"><h1>Mi perfil</h1><button className="text-button" type="button" onClick={refresh} disabled={!result}>Actualizar perfil</button></header>
    {!result ? <div role="status"><StatusMessage title="Cargando perfil">Consultando los datos de tu cuenta…</StatusMessage></div>
      : 'error' in result ? <><StatusMessage title="No se pudo consultar el perfil" tone="error">No pudimos recuperar tus datos. Revisá la conexión y volvé a intentar.</StatusMessage><button className="gradient-link gradient-button" type="button" onClick={refresh}>Reintentar</button></>
      : <>
        <section className="profile-identity" aria-label="Datos de tu perfil">
          <div className="profile-avatar">{result.avatarUrl && !avatarFailed
            ? <img src={result.avatarUrl} alt="Tu avatar" width="98" height="98" onError={() => setAvatarFailed(true)} />
            : <span role="img" aria-label="Sin avatar disponible"><Icon name="user" /></span>}</div>
          <h2>{result.profile.display_name}</h2>
          <p className="profile-username">@{result.profile.username}</p>
          <OwnSocialCounts userId={userId} />
          <p className={result.profile.bio?.trim() ? 'profile-bio' : 'profile-bio profile-missing'}>{result.profile.bio?.trim() || 'Todavía no agregaste una biografía.'}</p>
        </section>
        <p className="profile-visibility">Perfil {result.profile.visibility === 'private' ? 'privado' : 'público'}</p>
        <dl className="profile-email"><dt><Icon name="email" />Correo de tu cuenta</dt><dd>{email || 'Correo no disponible'}</dd></dl>
      </>}
    <nav className="profile-account" aria-label="Información de tu cuenta">
      <Link ref={editLink} to="/me/edit"><Icon name="user" /><span>Editar perfil y privacidad</span><span aria-hidden="true">›</span></Link>
      <Link ref={messagesLink} to="/messages"><Icon name="email" /><span>Mensajes privados</span><span aria-hidden="true">›</span></Link>
      <Link ref={requestsLink} to="/me/follow-requests"><Icon name="user" /><span>Solicitudes de seguimiento</span><span aria-hidden="true">›</span></Link>
      <Link ref={interestsLink} to="/me/interests"><Icon name="category" /><span>Mis intereses</span><span aria-hidden="true">›</span></Link>
      <Link to="/my-events"><Icon name="calendar" /><span>Mis eventos</span><span aria-hidden="true">›</span></Link>
      <Link to="/notifications"><Icon name="bell" /><span>Notificaciones</span><span aria-hidden="true">›</span></Link>
    </nav>
    <PushSettings userId={userId} />
  </div>
}
