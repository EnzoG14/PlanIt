import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { SocialAvatar } from '../components/SocialAvatar'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadSocialProfile, loadSocialEvents, participantsReturn, type SocialEvents } from '../features/social/api'
import { formatEventTime } from '../features/events/validation'
import { validatedMyEventsReturn } from '../features/events/my-events'
import { validatedDiscoveryReturn } from '../features/events/search'
import { useSocialRead } from '../features/social/useSocialRead'
import '../styles/event-management.css'
import './event-attendees.css'
import './social-participants.css'
import './social-profile.css'

export function SocialIdentityPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  const location = useLocation()
  return id === session?.user.id ? <Navigate to="/me" replace state={location.state} /> : <IdentityContent key={`${id}:${session?.user.id}:${session?.access_token}`} userId={id} />
}
function IdentityContent({ userId }: { userId: string }) {
  const location = useLocation()
  const back = participantsReturn(location.state?.participantsReturnTo)
  const [pages, setPages] = useState(1)
  const load = useCallback(async (signal: AbortSignal) => {
    const profile = await loadSocialProfile(userId, signal)
    if (!profile) return null
    let result: SocialEvents = { events: [], next_cursor: null }
    if (!profile.content) return { profile, ...result }
    const cursors = new Set<string>()
    for (let index = 0; index < pages; index++) {
      const next = await loadSocialEvents(userId, result.next_cursor, signal)
      result = { events: [...new Map([...result.events, ...next.events].map(row => [row.id, row])).values()], next_cursor: next.next_cursor }
      if (!result.next_cursor) break
      const key = `${result.next_cursor.starts_at}:${result.next_cursor.id}`
      if (cursors.has(key)) throw new Error('invalid_social_response')
      cursors.add(key)
    }
    // Events and profile are separate RPC snapshots. Recheck the gate before
    // publishing the combined view; a revoked audience must not keep old rows.
    const current = await loadSocialProfile(userId, signal)
    if (!current) return null
    return current.content ? { profile: current, ...result } : { profile: current, events: [], next_cursor: null }
  }, [userId, pages])
  const { data, loading, denied, error, refresh } = useSocialRead(load)
  const origin = { participantsReturnTo: back, myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo), returnTo: validatedDiscoveryReturn(location.state?.returnTo) }
  useEffect(() => { document.title = 'Perfil · PlanIt' }, [])
  return <><div className="management-wash" aria-hidden="true" /><section className="management-page social-identity-page">
    <Link className="secondary-link management-back" to={back ?? '/home'} state={back ? location.state : undefined}><Icon name="back" />{back ? 'Volver a participantes' : 'Volver al inicio'}</Link>
    <header className="management-header"><h1>Perfil</h1></header>
    <div aria-busy={loading}>{loading ? <p role="status">Consultando perfil…</p> : denied || (!error && !data) ? <StatusMessage title="Perfil no disponible">No se puede consultar este perfil.</StatusMessage> : error ? <><p className="field-error" role="alert">{error}</p><button className="secondary-button" onClick={() => void refresh()}>Reintentar</button></> : data && <>
      <div className="social-identity"><SocialAvatar key={data.profile.avatar} avatar={data.profile.avatar} /><h2>{data.profile.display_name}</h2><p>@{data.profile.username}</p></div>
      {data.profile.content && <>
        <section className="social-profile-bio" aria-labelledby="social-bio-title"><h2 id="social-bio-title">Acerca de</h2><p>{data.profile.bio?.trim() ? data.profile.bio : 'Todavía no agregó una biografía.'}</p></section>
        <section className="social-profile-events" aria-labelledby="social-events-title"><h2 id="social-events-title">Eventos públicos</h2>
          {!data.events.length && <StatusMessage title="No hay eventos públicos vigentes">Cuando organice un evento público vigente, aparecerá acá.</StatusMessage>}
          <ul className="social-profile-event-list">{data.events.map(event => <li key={event.id}>
            <Link className="social-profile-event" to={`/events/${event.id}`} state={{ socialProfileReturnTo: `/users/${userId}`, socialProfileOrigin: origin }} aria-label={`Ver detalle de ${event.title}`}>
              <h3>{event.title}</h3><p><Icon name="clock" />{formatEventTime(event.starts_at)}</p><p><Icon name="pin" />{event.location_name?.trim() || 'Consultá la ubicación en el detalle'}</p><span>Ver detalle <Icon name="back" /></span>
            </Link>
          </li>)}</ul>
          {data.next_cursor && <button className="secondary-button" onClick={() => setPages(count => count + 1)}>Cargar más eventos</button>}
        </section>
      </>}
    </>}</div>
    <button className="text-button" disabled={loading} onClick={() => void refresh()}>Actualizar perfil</button>
  </section></>
}
