import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { SocialAvatar } from '../components/SocialAvatar'
import { StatusMessage } from '../components/StatusMessage'
import { loadSocialParticipants, type SocialParticipants } from '../features/social/api'
import { useSocialRead } from '../features/social/useSocialRead'
import './social-participants.css'

export function EventSocialParticipants({ eventId, origin }: { eventId: string; origin: Record<string, unknown> }) {
  const [pages, setPages] = useState(1)
  const load = useCallback(async (signal: AbortSignal) => {
    let result: SocialParticipants = { participants: [], next_cursor: null }
    // Refetch earlier pages too: a removal or block must never survive append.
    for (let index = 0; index < pages; index++) {
      const next = await loadSocialParticipants(eventId, result.next_cursor, signal)
      result = { participants: [...new Map([...result.participants, ...next.participants].map(row => [row.user_id, row])).values()], next_cursor: next.next_cursor }
      if (!result.next_cursor) break
    }
    return result
  }, [eventId, pages])
  const { data, loading, denied, error, refresh } = useSocialRead(load)
  useEffect(() => { document.title = 'Participantes · PlanIt' }, [])
  const returnTo = `/events/${eventId}/attendees?view=social`
  return <section className="attendees-page management-page social-participants" aria-label="Participantes del evento">
    <Link className="secondary-link management-back" to={`/events/${eventId}`} state={origin}><Icon name="back" />Volver al evento</Link>
    <header className="management-header"><h1>Participantes</h1><p>Personas con inscripción confirmada en este evento.</p></header>

    <div aria-busy={loading}>
      {loading && <p role="status">Cargando participantes…</p>}
      {denied ? <StatusMessage title="Participantes no disponibles">Sólo el organizador y los asistentes confirmados pueden consultar esta lista. Conocer el enlace no concede acceso.</StatusMessage> : error ? <><p className="field-error" role="alert">{error}</p><button className="secondary-button" onClick={() => void refresh()}>Reintentar</button></> : data && <>
        {!data.participants.length && <StatusMessage title="No hay participantes visibles">No hay personas para mostrar en este evento.</StatusMessage>}
        <ul className="social-participants-list">{data.participants.map(row => <li key={row.user_id}>
          <Link className="social-participant-link" to={`/users/${row.user_id}`} state={{ ...origin, participantsReturnTo: returnTo }} aria-label={`Ver perfil de ${row.display_name}`}>
            <SocialAvatar key={row.avatar} avatar={row.avatar} /><div className="attendee-identity"><strong>{row.display_name}</strong><span>@{row.username}</span></div><span className="social-profile-arrow"><Icon name="back" /></span>
          </Link>
        </li>)}</ul>
        {data.next_cursor && <button className="secondary-button" onClick={() => setPages(count => count + 1)}>Cargar más participantes</button>}
      </>}
    </div>
  </section>
}
