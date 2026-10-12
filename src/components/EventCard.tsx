import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { argentinaNow, formatEventTime } from '../features/events/validation'
import type { EventPreview } from '../features/events/discovery'
import type { MyEventListItem } from '../features/events/my-events'

const eventStates = { open: 'Publicado', ended: 'Finalizado', cancelled: 'Cancelado', archived: 'Archivado' }
const participationStates = { confirmed: 'Confirmada', cancelled: 'Cancelada', removed: 'Removida' }

export function CompactEventCard({ event, returnTo, showMenu = false }: { event: MyEventListItem; returnTo: string; showMenu?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menu = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const detail = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    detail.current?.focus()
    function close() { setMenuOpen(false); trigger.current?.focus() }
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) close() }
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [menuOpen])
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
    {showMenu && <div className="compact-event-menu" ref={menu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false) }}>
      <button ref={trigger} type="button" className="compact-event-menu-trigger" aria-label={`Acciones de ${event.title}`} aria-expanded={menuOpen} aria-controls={menuOpen ? `event-menu-${event.id}` : undefined} onClick={() => setMenuOpen(open => !open)}><Icon name="more" /></button>
      {menuOpen && <div className="compact-event-menu-panel" id={`event-menu-${event.id}`}><Link ref={detail} to={`/events/${event.id}`} state={{ myEventsReturnTo: returnTo }}>Ver detalle</Link>{event.event_state === 'open' && event.starts_at > argentinaNow() && <Link to={`/events/${event.id}/edit`} state={{ myEventsReturnTo: returnTo }}>Editar evento</Link>}<Link to={`/events/${event.id}/gallery`} state={{ myEventsReturnTo: returnTo }}>Gestionar imágenes</Link></div>}
    </div>}
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
