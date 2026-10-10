import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { formatEventTime } from '../features/events/validation'
import type { EventPreview } from '../features/events/discovery'
import type { MyEventListItem } from '../features/events/my-events'

const eventStates = { open: 'Publicado', ended: 'Finalizado', cancelled: 'Cancelado', archived: 'Archivado' }
const participationStates = { confirmed: 'Confirmada', cancelled: 'Cancelada', removed: 'Removida' }

export function CompactEventCard({ event, returnTo }: { event: MyEventListItem; returnTo: string }) {
  return <article className="compact-event-card">
    <Link to={`/events/${event.id}`} state={{ myEventsReturnTo: returnTo }} className="compact-event-link">
      <span className="compact-event-photo"><Icon name="calendar" />{event.imageUrl && <img src={event.imageUrl} alt="" width="80" height="88" loading="lazy" onError={e => { e.currentTarget.hidden = true }} />}</span>
      <div className="compact-event-body">
        <h3>{event.title}</h3>
        <p><Icon name="calendar" />{formatEventTime(event.starts_at)}</p>
        <p><Icon name="pin" />{event.location_name ?? event.address}</p>
        <div className="compact-event-badges"><span className="category-chip">{event.category_name}</span><span className={`event-state state-${event.event_state}`}>{eventStates[event.event_state]}</span>
          {event.participation_status && <span className={`event-state participation-${event.participation_status}`}>Inscripción: {participationStates[event.participation_status]}</span>}
        </div>
      </div>
    </Link>
  </article>
}

export function EventCard({ event, selected, onSelect, returnTo }: { event: EventPreview; selected?: boolean; onSelect?: (id: string) => void; returnTo?: string }) {
  const state = returnTo ? { returnTo } : undefined
  return <article className={`event-card ${selected ? 'is-selected' : ''}`}>
    <Link to={`/events/${event.id}`} state={state} className="event-card-photo" aria-label={`Ver detalle de ${event.title}`}>
      <Icon name="calendar" />
      {event.imageUrl && <img src={event.imageUrl} alt="" width="480" height="320" loading="lazy" onError={e => { e.currentTarget.hidden = true }} />}
    </Link>
    <div className="event-card-body"><span className="category-chip">{event.categoryName}</span><h3><Link to={`/events/${event.id}`} state={state}>{event.title}</Link></h3>
      <p>{formatEventTime(event.starts_at)}</p><p>{event.location_name ?? event.address}</p>
      <div className="event-card-actions">{onSelect && <button className="text-button" onClick={() => onSelect(event.id)} aria-pressed={Boolean(selected)}>Ver marcador</button>}<Link to={`/events/${event.id}`} state={state} className="secondary-link">Ver detalle</Link></div>
    </div>
  </article>
}
