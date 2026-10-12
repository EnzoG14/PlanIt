// Datos de ejemplo de las pantallas extra de B (ficticios).
export type Person = { id: string; name: string; user: string }

export const attendees: Person[] = [
  { id: 'p1', name: 'Martina Rojas', user: 'martina.rojas' },
  { id: 'p2', name: 'Joaquín Pérez', user: 'joaquin.p' },
  { id: 'p3', name: 'Agustina Sosa', user: 'agus.sosa' },
  { id: 'p4', name: 'Tomás Quiroga', user: 'tomasq' },
  { id: 'p5', name: 'Camila Fernández', user: 'cami.fernandez' },
  { id: 'p6', name: 'Bruno Castillo', user: 'brunocas' },
  { id: 'p7', name: 'Valentina Ibarra', user: 'vale.ibarra' },
  { id: 'p8', name: 'Nicolás Duarte', user: 'nico.duarte' },
]

export const removed: Person[] = [
  { id: 'r1', name: 'Federico Luna', user: 'fede.luna' },
  { id: 'r2', name: 'Rocío Paz', user: 'rocio.paz' },
]

export const requests: (Person & { when: string })[] = [
  { id: 'q1', name: 'Federico Luna', user: 'fede.luna', when: 'Hoy, 21:10' },
  { id: 'q2', name: 'Rocío Paz', user: 'rocio.paz', when: 'Ayer, 19:42' },
]

export const detailText: Record<string, { description: string; address: string; end: string }> = {
  e1: { description: 'Una noche de bandas locales en el centro cultural. Abrimos puertas a las 19:30; el cupo es limitado, así que confirmá tu lugar con tiempo. Hay guardarropa y buffet.', address: 'Av. Santa Fe 3200, Palermo, CABA', end: '23:30' },
  e2: { description: 'Caminata guiada de dos horas por los senderos de la reserva, a ritmo tranquilo. Llevá agua y calzado cómodo.', address: 'Av. Tristán Achával Rodríguez 1550, CABA', end: '11:30' },
  e3: { description: 'Taller introductorio de fotografía con cámara propia o celular. Vemos luz, encuadre y edición básica.', address: 'Jorge Newbery 4100, Chacarita, CABA', end: '21:00' },
  e4: { description: 'Charla abierta con emprendedores del barrio sobre cómo arrancar y sostener un proyecto.', address: 'Medrano 600, Almagro, CABA', end: '21:00' },
  e5: { description: 'Más de cien proyectos independientes de diseño, ilustración y objetos. Entrada libre, patio de comidas en el parque.', address: 'Av. Díaz Vélez y Angel Gallardo, Caballito, CABA', end: '19:00' },
  e6: { description: 'Clase de yoga al aire libre frente al río. Traé tu mat y una prenda de abrigo para el final.', address: 'Av. Costanera Rafael Obligado 7000, CABA', end: '19:30' },
  e7: { description: 'Cinco cómicos y cómicas en una misma noche. Sala chica, mucha risa. Se recomienda llegar 20 minutos antes.', address: 'Mitre 1450, Palermo, CABA', end: '23:30' },
  e8: { description: 'Regata amistosa de veleros en el río. Hay botes de apoyo y buffet en el club.', address: 'Del Libertador 100, San Isidro, Buenos Aires', end: '14:00' },
  e9: { description: 'Primera clase abierta para quienes nunca tocaron el torno. Incluye materiales y cocción de una pieza.', address: 'Thames 800, Villa Crespo, CABA', end: '19:00' },
  e10: { description: 'Torneo amistoso de vóley en equipos de cuatro. Venís con tu equipo o te sumamos a uno.', address: 'Av. Costanera Rafael Obligado 6500, CABA', end: '19:30' },
}

export type Msg = { id: string; from: string; mine?: boolean; text: string; time: string }
export const messages: Msg[] = [
  { id: 'm1', from: 'Martina Rojas', text: '¿Alguien sabe si abren la puerta antes de las 20?', time: '18:02' },
  { id: 'm2', from: 'Lucía Benítez', mine: true, text: 'Abrimos 19:30. Pueden entrar mostrando la inscripción desde el celu.', time: '18:05' },
  { id: 'm3', from: 'Joaquín Pérez', text: 'Perfecto, llego con dos amigos que ya están anotados.', time: '18:07' },
  { id: 'm4', from: 'Agustina Sosa', text: '¿Hay guardarropa?', time: '18:10' },
  { id: 'm5', from: 'Lucía Benítez', mine: true, text: 'Sí, hay. Y sumamos un buffet con opciones sin TACC.', time: '18:12' },
]

export type Notif = { id: string; kind: string; title: string; body: string; time: string; group: string; read: boolean; target: 'event' | 'chat' | 'requests' }
export const notifications: Notif[] = [
  { id: 'n1', kind: 'Reincorporación', title: 'Federico Luna pidió volver', body: 'Solicitud pendiente en Encuentro de música — prueba.', time: '21:10', group: 'Hoy', read: false, target: 'requests' },
  { id: 'n2', kind: 'Chat', title: 'Mensaje nuevo de Martina Rojas', body: '¿Alguien sabe si abren la puerta antes de las 20?', time: '18:02', group: 'Hoy', read: false, target: 'chat' },
  { id: 'n3', kind: 'Inscripción', title: 'Valentina Ibarra se sumó', body: 'Ya son 48 de 60 en Encuentro de música — prueba.', time: '20:44', group: 'Ayer', read: true, target: 'event' },
  { id: 'n4', kind: 'Evento', title: 'Caminata por la reserva finalizó', body: 'Gracias por organizar. Podés duplicarlo para una próxima fecha.', time: '12:00', group: 'Ayer', read: true, target: 'event' },
  { id: 'n5', kind: 'Cupo', title: 'Quedan pocos lugares', body: 'Quedan 12 lugares en Encuentro de música — prueba.', time: '10:00', group: '10 oct', read: true, target: 'event' },
]
