import { useCallback, useEffect } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { SocialAvatar } from '../components/SocialAvatar'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadSocialIdentity, participantsReturn } from '../features/social/api'
import { useSocialRead } from '../features/social/useSocialRead'
import '../styles/event-management.css'
import './event-attendees.css'
import './social-participants.css'

// B2 destination: minimal identity only. Full social profiles belong to B3/B5.
export function SocialIdentityPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  const location = useLocation()
  return id === session?.user.id ? <Navigate to="/me" replace state={location.state} /> : <IdentityContent key={`${id}:${session?.user.id}:${session?.access_token}`} userId={id} />
}
function IdentityContent({ userId }: { userId: string }) {
  const location = useLocation()
  const back = participantsReturn(location.state?.participantsReturnTo)
  const load = useCallback((signal: AbortSignal) => loadSocialIdentity(userId, signal), [userId])
  const { data, loading, denied, error, refresh } = useSocialRead(load)
  useEffect(() => { document.title = 'Perfil · PlanIt' }, [])
  return <><div className="management-wash" aria-hidden="true" /><section className="management-page social-identity-page">
    <Link className="secondary-link management-back" to={back ?? '/home'} state={back ? location.state : undefined}><Icon name="back" />{back ? 'Volver a participantes' : 'Volver al inicio'}</Link>
    <header className="management-header"><h1>Perfil</h1></header>
    <div aria-busy={loading}>{loading ? <p role="status">Consultando perfil…</p> : denied || (!error && !data) ? <StatusMessage title="Perfil no disponible">No se puede consultar este perfil.</StatusMessage> : error ? <><p className="field-error" role="alert">{error}</p><button className="secondary-button" onClick={() => void refresh()}>Reintentar</button></> : data && <div className="social-identity"><SocialAvatar key={data.avatar} avatar={data.avatar} /><h2>{data.display_name}</h2><p>@{data.username}</p></div>}</div>
    <button className="text-button" disabled={loading} onClick={() => void refresh()}>Actualizar perfil</button>
  </section></>
}
