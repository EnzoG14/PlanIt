import { useState } from 'react'
import { events, matchesFilter, type Role, type StatusFilter } from './data'

// Misma lógica funcional que Mis eventos real: Organizo/Participo + filtro por estado.
export function useMyEvents() {
  const [role, setRole] = useState<Role>('organizo')
  const [filter, setFilter] = useState<StatusFilter>('Todos')
  const list = events.filter(event => event.role === role && matchesFilter(event, filter))
  const counts = { organizo: events.filter(e => e.role === 'organizo').length, participo: events.filter(e => e.role === 'participo').length }
  return { role, setRole, filter, setFilter, list, counts }
}
