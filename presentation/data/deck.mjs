// Editorial structure and verified values from Planificación Oficial, §§2–4.
import { releaseSlideSpecs } from './release-content.mjs'
export const sources = {
  planning: 'https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti',
  requirements: 'https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r',
}
export const deck = [
  ['cover', 'Portada'], ['team', 'Equipo de proyecto'], ['agenda', 'Agenda'],
  ['problem', 'Situación problemática'], ['product', 'Solución propuesta'],
  ['features', 'Funcionalidades principales'],
  ['participant-opportunity', 'Oportunidad de mejora — Participantes'],
  ['organizer-opportunity', 'Oportunidad de mejora — Organizadores'],
  ['benefits', 'Beneficios esperados'], ['scope', 'Alcance'], ['limitations', 'Limitaciones'],
  ['requirements', 'Especificación de requisitos'], ['domains', 'Agrupación funcional y módulos'],
  ['users', 'Usuarios del sistema'], ['stack', 'Stack tecnológico'], ['architecture', 'Arquitectura tecnológica'],
  ['method', 'Enfoque de trabajo'], ['estimation', 'Priorización y estimación'],
  ['tools', 'Herramientas de colaboración'], ['planning', 'Planificación general'], ['roadmap', 'Roadmap'],
].map(([id, title]) => ({ id, title, clicks: id === 'architecture' ? 2 : 0 })).concat(releaseSlideSpecs, [
  { id: 'demo', title: 'Demo', clicks: 0 },
  { id: 'evolution', title: 'Evolución del producto', clicks: 0 },
  { id: 'conclusions', title: 'Conclusiones', clicks: 0 },
  { id: 'thanks', title: '¡Muchas gracias!', clicks: 0 },
])

export const team = [
  { name: 'Carlos Federico Almirón', role: 'Análisis funcional y desarrollo' },
  { name: 'Rodrigo Córdoba', role: 'Desarrollo full stack' },
  { name: 'Enzo Joaquin González Urbieta', role: 'Backend y bases de datos' },
  { name: 'Rafael Lezcano', role: 'Scrum Master y desarrollo' },
  { name: 'Joaquín González Zago', role: 'Diseño UI/UX y frontend' },
]
export const releases = [
  { id: 'R0', name: 'Fundamentos', start: '25/08/2025', end: '07/09/2025', sprints: 1, rf: 0, ca: 0 },
  { id: 'R1', name: 'Lanzamiento (MVP)', start: '08/09/2025', end: '23/09/2025', sprints: 1, rf: 7, ca: 28 },
  { id: 'R2', name: 'Experiencia del participante', start: '24/09/2025', end: '28/10/2025', sprints: 2, rf: 7, ca: 28 },
  { id: 'R3', name: 'Gestión básica de eventos', start: '04/11/2025', end: '09/12/2025', sprints: 2, rf: 9, ca: 37 },
  { id: 'R4', name: 'Descubrimiento y personalización', start: '24/06/2026', end: '21/07/2026', sprints: 2, rf: 9, ca: 39 },
  { id: 'R5', name: 'Comunidad y relaciones sociales', start: '22/07/2026', end: '18/08/2026', sprints: 2, rf: 8, ca: 33 },
  { id: 'R6', name: 'Gestión avanzada y analítica', start: '19/08/2026', end: '15/09/2026', sprints: 2, rf: 6, ca: 24 },
  { id: 'R7', name: 'Contenido social e integraciones', start: '16/09/2026', end: '13/10/2026', sprints: 2, rf: 7, ca: 29 },
]
