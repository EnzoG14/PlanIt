// Datos de ejemplo (mock). Hoy en el lab: lunes 12/10/2026. Nada de esto es contenido real.
export type SceneId = 'sunset' | 'sea' | 'trail' | 'concert' | 'studio' | 'market' | 'night'
export type Category = 'Música' | 'Deporte' | 'Arte' | 'Comunidad'
export type Status = 'Publicado' | 'Finalizado' | 'Cancelado' | 'Archivado'
export type Role = 'organizo' | 'participo' | 'ninguno'
export type Tab = 'home' | 'map' | 'events' | 'profile'

export type Ev = {
  id: string
  title: string
  category: Category
  scene: SceneId
  day: string // "Sáb 17"
  dayShort: string // "17 oct"
  time: string
  place: string
  zone: string
  capacity: number
  going: number
  status: Status
  role: Role
  upcoming: boolean
  pin: { x: number; y: number }
  attention?: string
}

export const events: Ev[] = [
  { id: 'e1', title: 'Encuentro de música — prueba', category: 'Música', scene: 'concert', day: 'Sáb 17', dayShort: '17 oct', time: '20:00', place: 'Centro cultural', zone: 'Palermo', capacity: 60, going: 48, status: 'Publicado', role: 'organizo', upcoming: true, pin: { x: 150, y: 250 }, attention: 'Quedan 12 lugares' },
  { id: 'e2', title: 'Caminata por la reserva', category: 'Deporte', scene: 'trail', day: 'Sáb 10', dayShort: '10 oct', time: '09:00', place: 'Reserva Costanera Sur', zone: 'Puerto Madero', capacity: 30, going: 27, status: 'Finalizado', role: 'organizo', upcoming: false, pin: { x: 292, y: 360 }, attention: '1 solicitud de reingreso' },
  { id: 'e3', title: 'Taller de fotografía', category: 'Arte', scene: 'studio', day: 'Mié 21', dayShort: '21 oct', time: '18:30', place: 'Casa Taller, Chacarita', zone: 'Chacarita', capacity: 16, going: 9, status: 'Cancelado', role: 'organizo', upcoming: false, pin: { x: 96, y: 330 } },
  { id: 'e4', title: 'Charla de emprendedores', category: 'Comunidad', scene: 'night', day: 'Jue 1', dayShort: '1 oct', time: '19:00', place: 'Biblioteca Popular', zone: 'Almagro', capacity: 40, going: 31, status: 'Archivado', role: 'organizo', upcoming: false, pin: { x: 210, y: 410 } },
  { id: 'e5', title: 'Feria de diseño independiente', category: 'Comunidad', scene: 'market', day: 'Sáb 24', dayShort: '24 oct', time: '11:00', place: 'Parque Centenario', zone: 'Caballito', capacity: 150, going: 118, status: 'Publicado', role: 'participo', upcoming: true, pin: { x: 238, y: 300 } },
  { id: 'e6', title: 'Yoga al atardecer', category: 'Deporte', scene: 'sunset', day: 'Jue 15', dayShort: '15 oct', time: '18:30', place: 'Costanera Norte', zone: 'Núñez', capacity: 20, going: 14, status: 'Publicado', role: 'participo', upcoming: true, pin: { x: 312, y: 200 } },
  { id: 'e7', title: 'Noche de stand-up', category: 'Arte', scene: 'night', day: 'Vie 16', dayShort: '16 oct', time: '21:30', place: 'Sala Mitre', zone: 'Palermo', capacity: 40, going: 35, status: 'Publicado', role: 'participo', upcoming: true, pin: { x: 120, y: 190 } },
  { id: 'e8', title: 'Regata en el río', category: 'Deporte', scene: 'sea', day: 'Dom 25', dayShort: '25 oct', time: '10:00', place: 'Club Náutico, San Isidro', zone: 'San Isidro', capacity: 24, going: 11, status: 'Publicado', role: 'participo', upcoming: true, pin: { x: 330, y: 280 } },
  { id: 'e9', title: 'Clase abierta de cerámica', category: 'Arte', scene: 'studio', day: 'Mar 20', dayShort: '20 oct', time: '17:00', place: 'Taller Barro y Fuego', zone: 'Villa Crespo', capacity: 14, going: 9, status: 'Publicado', role: 'ninguno', upcoming: true, pin: { x: 74, y: 262 } },
  { id: 'e10', title: 'Torneo de vóley en la costa', category: 'Deporte', scene: 'sunset', day: 'Sáb 17', dayShort: '17 oct', time: '16:00', place: 'Costanera Norte', zone: 'Núñez', capacity: 24, going: 24, status: 'Publicado', role: 'ninguno', upcoming: true, pin: { x: 268, y: 232 } },
]

export const byId = (id: string) => events.find(event => event.id === id)!
export const upcoming = events.filter(event => event.status === 'Publicado')

export const me = {
  name: 'Lucía Benítez',
  firstName: 'Lucía',
  username: 'lucia.benitez',
  bio: 'Organizo caminatas y encuentros de música en la ciudad. Siempre hay un lugar más en la mesa.',
  email: 'lucia.benitez@ejemplo.com.ar',
}

export const categories: Category[] = ['Música', 'Deporte', 'Arte', 'Comunidad']

export const statusFilters = ['Todos', 'Próximos', 'Pasados', 'Cancelados', 'Archivados'] as const
export type StatusFilter = (typeof statusFilters)[number]

export function matchesFilter(event: Ev, filter: StatusFilter) {
  switch (filter) {
    case 'Todos': return true
    case 'Próximos': return event.status === 'Publicado'
    case 'Pasados': return event.status === 'Finalizado'
    case 'Cancelados': return event.status === 'Cancelado'
    case 'Archivados': return event.status === 'Archivado'
  }
}

export const weekDays = [
  { d: 'Lun', n: 12 }, { d: 'Mar', n: 13 }, { d: 'Mié', n: 14 }, { d: 'Jue', n: 15 },
  { d: 'Vie', n: 16 }, { d: 'Sáb', n: 17 }, { d: 'Dom', n: 18 },
]
// Cantidad de eventos públicos por día (mock).
export const weekCounts = [1, 2, 1, 3, 2, 4, 2]

export const tabLabels: Record<Tab, string> = { home: 'Inicio', map: 'Mapa', events: 'Mis eventos', profile: 'Perfil' }
export const tabs: Tab[] = ['home', 'map', 'events', 'profile']
