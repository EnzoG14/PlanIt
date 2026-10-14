import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { SocialAvatar } from '../components/SocialAvatar'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadSocialProfile } from '../features/social/api'
import { loadSocialFollows, type FollowDirection, type FollowPage } from '../features/social/follows'
import { useSocialRead } from '../features/social/useSocialRead'
import '../styles/event-management.css'
import './social-participants.css'
import './social-follows.css'

export function SocialFollowsPage({ direction }: { direction: FollowDirection }) {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <FollowsContent key={`${id}:${direction}:${session?.user.id}:${session?.access_token}`} userId={id} direction={direction} own={id === session?.user.id} />
}
function FollowsContent({ userId, direction, own }: { userId: string; direction: FollowDirection; own: boolean }) {
  const location = useLocation()
  const [pages, setPages] = useState(1)
  const load = useCallback(async (signal: AbortSignal) => {
    let result: FollowPage = { users: [], next_cursor: null }
    for (let i = 0; i < pages; i++) {
      const next = await loadSocialFollows(userId, direction, result.next_cursor, signal)
      result = { users: [...new Map([...result.users, ...next.users].map(row => [row.user_id, row])).values()], next_cursor: next.next_cursor }
      if (!result.next_cursor) break
    }
    // A separate final gate prevents publishing pages after access was revoked.
    const current = await loadSocialProfile(userId, signal)
    if (!current?.content) throw { code: '42501' }
    return result
  }, [userId, direction, pages])
  const { data, loading, denied, error, refresh } = useSocialRead(load)
  const title = direction === 'followers' ? 'Seguidores' : 'Siguiendo'
  useEffect(() => { document.title = `${title} · PlanIt` }, [title])
  const back = own ? '/me' : `/users/${userId}`
  return <><div className="management-wash" aria-hidden="true" /><section className="management-page social-identity-page">
    <Link className="secondary-link management-back" to={back} state={location.state?.profileOrigin}><Icon name="back" />Volver al perfil</Link>
    <header className="management-header"><h1>{title}</h1></header>
    <div aria-busy={loading}>{loading ? <p role="status">Consultando {title.toLowerCase()}…</p> : denied ? <StatusMessage title="Lista no disponible">No tenés permiso para consultar esta lista.</StatusMessage> : error ? <><p className="field-error" role="alert">{error}</p><button className="secondary-button" onClick={() => void refresh()}>Reintentar</button></> : data && <>
      {!data.users.length && <StatusMessage title={direction === 'followers' ? 'Todavía no hay seguidores visibles' : 'Todavía no hay seguimientos visibles'}>Los seguimientos aceptados aparecerán acá.</StatusMessage>}
      <ul className="social-participants-list">{data.users.map(user => <li key={user.user_id}><Link className="social-participant-link" to={`/users/${user.user_id}`} state={{ followsReturnTo: location.pathname, followsOrigin: location.state }}>
        <SocialAvatar avatar={user.avatar} /><span className="social-follow-name"><strong>{user.display_name}</strong><span>@{user.username}</span></span><span className="social-profile-arrow"><Icon name="back" /></span>
      </Link></li>)}</ul>
      {data.next_cursor && <button className="secondary-button" onClick={() => setPages(value => value + 1)}>Cargar más personas</button>}
    </>}</div>
    <button className="text-button" disabled={loading} onClick={() => void refresh()}>Actualizar lista</button>
  </section></>
}
