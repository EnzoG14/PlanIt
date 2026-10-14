import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isEventEditable } from '../features/events/edit'
import { actionLabels, managedEvent, type EventAction } from '../features/events/actions'
import type { EventRecord } from '../features/events/api'
import { EventActionDialog } from './EventActionDialog'
import { Icon, type IconName } from './Icon'
import { EventLinkPanel } from './EventLinkPanel'
import { useAuth } from '../features/auth/useAuth'

export function EventManagement({ event, origin, onChanged }: { event: EventRecord; origin: { myEventsReturnTo?: string; returnTo?: string }; onChanged: (message: string) => void }) {
  const [action, setAction] = useState<EventAction | null>(null)
  const { session } = useAuth()
  const section = useRef<HTMLElement>(null)
  const managed = managedEvent(event)
  const row = (label: string, path: string, icon: IconName) => <Link to={`/events/${event.id}/${path}`} state={origin}><Icon name={icon} /><span>{label}</span><span aria-hidden="true">›</span></Link>
  const button = (value: EventAction, icon: IconName) => <button type="button" onClick={() => setAction(value)}><Icon name={icon} /><span>{actionLabels[value]}</span><span aria-hidden="true">›</span></button>
  return <section ref={section} tabIndex={-1} className="event-management" aria-label="Gestión del evento">
    <h2>Gestionar evento</h2>
    {event.visibility === 'unlisted' && <EventLinkPanel key={`${event.id}:${session?.user.id}:${event.cancelled_at}:${event.archived_at}:${event.ends_at}`} event={event} />}
    <div className="event-management-rows">{isEventEditable(event) && row('Editar evento', 'edit', 'edit')}{row('Gestionar imágenes', 'gallery', 'image')}{row('Ver asistentes', 'attendees', 'people')}{event.visibility === 'unlisted' && row('Gestionar accesos', 'access', 'people')}{button('duplicate', 'copy')}</div>
    {managed.event_state !== 'archived' && <div className="event-management-rows event-management-danger">{managed.event_state === 'open' && button('cancel', 'pause')}{button('archive', 'archive')}</div>}
    <EventActionDialog key={event.id} event={managed} action={action} onClose={() => setAction(null)} onChanged={message => { onChanged(message); requestAnimationFrame(() => { if (document.activeElement === document.body) section.current?.focus() }) }} origin={origin} dismissLabel={action === 'cancel' ? 'Conservar evento' : 'Volver'} />
  </section>
}
