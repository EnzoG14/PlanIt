import { useEffect, useState, type ReactNode } from 'react'
import { StatusMessage } from '../../components/StatusMessage'
import { beginContentSession } from '../../lib/session-content'
import { filtersFromParams, rememberedFilters } from '../events/search'
import { useSearchOrigin } from '../location/origin'
import { preloadContent } from './content'

export function StartupContent({ userId, children }: { userId: string; children: ReactNode }) {
  const reference = useSearchOrigin(false)
  const [ready, setReady] = useState(false)
  const [initial] = useState(() => ({
    filters: window.location.search ? filtersFromParams(new URLSearchParams(window.location.search)) : rememberedFilters(),
    origin: reference.origin,
  }))
  useEffect(() => {
    let active = true
    beginContentSession(userId)
    void preloadContent(userId, initial.filters, initial.origin).then(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [userId, initial])
  return ready ? children : <div role="status"><StatusMessage title="Preparando tu contenido">Cargando Inicio, tu perfil y tus eventos…</StatusMessage></div>
}
