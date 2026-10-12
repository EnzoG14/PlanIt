import type { Extra } from '../registry'
import { Attendees, attendeesVariants } from './Attendees'
import { Chat, chatVariants } from './Chat'
import { Create, createVariants } from './Create'
import { Detail, detailVariants } from './Detail'
import { Notifications, notificationsVariants } from './Notifications'
import { Requests, requestsVariants } from './Requests'

// Pantallas de R1–R3 más allá de las cuatro pestañas. Subpantallas: sin barra inferior.
export const extraB: Extra[] = [
  { id: 'event', label: 'Detalle del evento', group: 'Evento', navTab: 'home', nav: false, Component: Detail, variants: detailVariants },
  { id: 'attendees', label: 'Asistentes', group: 'Evento', navTab: 'events', nav: false, Component: Attendees, variants: attendeesVariants, defaultVariant: 'open' },
  { id: 'requests', label: 'Solicitudes de reincorporación', group: 'Evento', navTab: 'events', nav: false, Component: Requests, variants: requestsVariants, defaultVariant: 'list' },
  { id: 'chat', label: 'Chat del evento', group: 'Evento', navTab: 'home', nav: false, Component: Chat, variants: chatVariants, defaultVariant: 'open' },
  { id: 'notifications', label: 'Notificaciones', group: 'Cuenta', navTab: 'profile', nav: false, Component: Notifications, variants: notificationsVariants, defaultVariant: 'list' },
  { id: 'create', label: 'Crear evento', group: 'Evento', navTab: 'events', nav: false, Component: Create, variants: createVariants, defaultVariant: 'form' },
]
