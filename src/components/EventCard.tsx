import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { formatEventTime } from '../features/events/validation'
import type { EventPreview } from '../features/events/discovery'

export function EventCard({ event, selected, onSelect }: { event: EventPreview; selected?: boolean; onSelect?: (id: string) => void }) {
  return <article className={`event-card ${selected ? 'is-selected' : ''}`}>
    <Link to={`/events/${event.id}`} className="event-card-photo" aria-label={`Ver detalle de ${event.title}`}>
      <Icon name="calendar" />
      {event.imageUrl && <img src={event.imageUrl} alt="" width="480" height="320" loading="lazy" onError={e => { e.currentTarget.hidden = true }} />}
    </Link>
    <div className="event-card-body"><span className="category-chip">{event.categoryName}</span><h3><Link to={`/events/${event.id}`}>{event.title}</Link></h3>
      <p>{formatEventTime(event.starts_at)}</p><p>{event.location_name ?? event.address}</p>
      <div className="event-card-actions">{onSelect && <button className="text-button" onClick={() => onSelect(event.id)} aria-pressed={Boolean(selected)}>Ver marcador</button>}<Link to={`/events/${event.id}`} className="secondary-link">Ver detalle</Link></div>
    </div>
  </article>
}
