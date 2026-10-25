import { EventImage } from './EventImage'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { argentinaNow, formatEventTime } from '../features/events/validation'
import type { EventPreview } from '../features/events/discovery'
import type { MyEventListItem } from '../features/events/my-events'
import type { EventAction } from '../features/events/actions'
import { EventActionDialog } from './EventActionDialog'

const eventStates = { open: 'Publicado', ended: 'Finalizado', cancelled: 'Cancelado', archived: 'Archivado' }
const participationStates = { confirmed: 'Confirmada', cancelled: 'Cancelada', removed: 'Removida' }

export function CompactEventCard({ event, returnTo, showMenu = false, onChanged = () => {} }: { event: MyEventListItem; returnTo: string; showMenu?: boolean; onChanged?: (message: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuLayout, setMenuLayout] = useState({ maxHeight: 240, above: false })
  const [action, setAction] = useState<EventAction | null>(null)
  const menu = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const detail = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    function position() {
      const anchor = trigger.current?.getBoundingClientRect()
      if (!anchor) return
      const nav = document.querySelector('.primary-nav')?.getBoundingClientRect()
      const bottom = nav && nav.top > innerHeight / 2 ? nav.top : innerHeight
      const below = bottom - anchor.bottom - 12, above = anchor.top - 12
      const useAbove = below < 180 && above > below
      setMenuLayout({ maxHeight: Math.max(88, Math.min(360, useAbove ? above : below)), above: useAbove })
    }
    position()
    window.addEventListener('resize', position)
    detail.current?.focus()
    function close() { setMenuOpen(false); trigger.current?.focus() }
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) close() }
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', position) }
  }, [menuOpen])
  return <article className={`compact-event-card is-${event.event_state}${showMenu ? ' has-menu' : ''}`}>
    <Link to={`/events/${event.id}`} state={{ myEventsReturnTo: returnTo }} className="compact-event-link">
      <div className="compact-event-main">
        <span className="compact-event-photo" aria-hidden="true"><EventImage src={event.imageUrl} alt="" fallback={<Icon name="calendar" />} /></span>
        <div className="compact-event-body">
          <h3>{event.title}</h3>
        </div>
      </div>
      <div className="compact-event-badges"><span className={`event-state state-${event.event_state}`}>{eventStates[event.event_state]}</span>
        {event.participation_status && <span className={`event-state participation-${event.participation_status}`}>Inscripción: {participationStates[event.participation_status]}</span>}
        <span className="category-chip">{event.category_name}</span>
      </div>
    </Link>
    {showMenu && <div className="compact-event-menu" ref={menu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false) }}>
      <button ref={trigger} type="button" className="compact-event-menu-trigger" aria-label={`Acciones de ${event.title}`} aria-expanded={menuOpen} aria-controls={menuOpen ? `event-menu-${event.id}` : undefined} onClick={() => setMenuOpen(open => !open)}><Icon name="more" /></button>
      {menuOpen && <div className="compact-event-menu-panel" style={{ maxHeight: menuLayout.maxHeight, ...(menuLayout.above ? { top: 'auto', bottom: 44 } : {}) }} id={`event-menu-${event.id}`}>
        {menuLayout.maxHeight < 320 && <p className="compact-event-menu-hint">Desplazá para ver más acciones</p>}
        <Link ref={detail} to={`/events/${event.id}`} state={{ myEventsReturnTo: returnTo }}>Ver detalle</Link>{event.event_state === 'open' && event.starts_at > argentinaNow() && <Link to={`/events/${event.id}/edit`} state={{ myEventsReturnTo: returnTo }}>Editar evento</Link>}<Link to={`/events/${event.id}/gallery`} state={{ myEventsReturnTo: returnTo }}>Gestionar imágenes</Link><Link to={`/events/${event.id}/attendees`} state={{ myEventsReturnTo: returnTo }}>Ver asistentes</Link>
        <button type="button" onClick={() => { setMenuOpen(false); setAction('duplicate') }}>Duplicar evento</button>
        {event.event_state === 'open' && <button type="button" className="event-menu-danger" onClick={() => { setMenuOpen(false); setAction('cancel') }}>Cancelar evento</button>}
        {event.event_state === 'archived' && <Link to={`/events/${event.id}/reactivate`} state={{ myEventsReturnTo: returnTo }}>Desarchivar</Link>}
        {event.event_state !== 'open' && <button type="button" className="event-menu-danger" onClick={() => { setMenuOpen(false); setAction('delete') }}>Eliminar definitivamente</button>}
        {event.event_state !== 'archived' && <button type="button" className="event-menu-danger" onClick={() => { setMenuOpen(false); setAction('archive') }}>Archivar evento</button>}
      </div>}
    </div>}
    {showMenu && <EventActionDialog event={event} action={action} onClose={() => setAction(null)} restoreFocus={() => trigger.current?.focus()} onChanged={onChanged} origin={{ myEventsReturnTo: returnTo }} />}
  </article>
}

export function EventCard({ event, selected, onSelect, returnTo }: { event: EventPreview; selected?: boolean; onSelect?: (id: string) => void; returnTo?: string }) {
  const state = returnTo ? { returnTo } : undefined
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const hasPhoto = Boolean(event.imageUrl && failedImage !== event.imageUrl)
  return <article data-event-id={event.id} className={`event-card ${selected ? 'is-selected' : ''} ${hasPhoto ? 'has-photo' : 'without-photo'}`}>
    <Link to={`/events/${event.id}`} state={state} className="event-card-open" aria-label={`Ver detalle de ${event.title}`}>
      {hasPhoto && <div className="event-card-photo"><EventImage src={event.imageUrl} alt="" onError={() => setFailedImage(event.imageUrl ?? null)} /></div>}
      <div className="event-card-body"><span className="category-chip">{event.categoryName}</span><h3>{event.title}</h3>
        <p className="event-card-time"><Icon name="clock" />{formatEventTime(event.starts_at)}</p>
        {!hasPhoto && <span className="event-card-no-photo"><Icon name="calendar" />Sin foto</span>}
        <span className="event-card-detail">Ver detalle <Icon name="back" /></span>
      </div>
    </Link>
    {onSelect && <div className="event-card-actions"><button className="text-button" onClick={() => onSelect(event.id)} aria-pressed={Boolean(selected)}>Ver marcador</button></div>}
  </article>
}
