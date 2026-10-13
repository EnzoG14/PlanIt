import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { eventEndsAt, loadSuggestions, type SuggestedEvent } from '../features/events/suggestions'
import { originLabel, useSearchOrigin } from '../features/location/origin'
import { EventCard } from './EventCard'
import { StatusMessage } from './StatusMessage'

export function HomeSuggestions({ returnTo }: { returnTo: string }) {
  const { session } = useAuth()
  return session ? <Suggestions key={session.user.id} userId={session.user.id} returnTo={returnTo} /> : null
}
function Suggestions({ userId, returnTo }: { userId: string; returnTo: string }) {
  const reference = useSearchOrigin(false)
  const latitude = reference.origin?.latitude ?? null, longitude = reference.origin?.longitude ?? null
  const kind = reference.origin?.kind ?? null
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ loading: boolean; error: boolean; events: SuggestedEvent[]; hasInterests: boolean; imageError: boolean }>({ loading: true, error: false, events: [], hasInterests: false, imageError: false })
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let active = true, revision = 0
    let controller: AbortController | null = null
    async function refresh() {
      const request = ++revision
      controller?.abort(); controller = new AbortController()
      setState(previous => ({ ...previous, loading: true, error: false, events: [], imageError: false }))
      try {
        const result = await loadSuggestions(userId, latitude !== null && longitude !== null && kind ? { latitude, longitude, kind } : null, controller.signal)
        if (active && request === revision) { setNow(Date.now()); setState({ ...result, loading: false, error: false }) }
      } catch {
        if (active && request === revision) setState(previous => ({ ...previous, events: [], loading: false, error: true }))
      }
    }
    const visibleRefresh = () => { if (document.visibilityState === 'visible') void refresh() }
    void refresh()
    const interval = window.setInterval(visibleRefresh, 30000)
    window.addEventListener('focus', visibleRefresh)
    window.addEventListener('online', visibleRefresh)
    document.addEventListener('visibilitychange', visibleRefresh)
    return () => {
      active = false; revision++; controller?.abort(); window.clearInterval(interval)
      window.removeEventListener('focus', visibleRefresh); window.removeEventListener('online', visibleRefresh)
      document.removeEventListener('visibilitychange', visibleRefresh)
    }
  }, [userId, latitude, longitude, kind, attempt])
  useEffect(() => {
    const next = Math.min(...state.events.map(eventEndsAt).filter(end => end > now))
    if (!Number.isFinite(next)) return
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.max(1, next - Date.now())))
    return () => window.clearTimeout(timeout)
  }, [state.events, now])
  const events = state.events.filter(event => event.visibility === 'public' && !event.cancelled_at && !event.archived_at && eventEndsAt(event) > now)
  const reason = (event: SuggestedEvent) => {
    if (!state.hasInterests) return 'Evento público próximo'
    const reasons = []
    if (event.matches_interest) reasons.push(`Por tu interés en ${event.categoryName}`)
    if (event.distance_km !== null && event.distance_km < 50 && reference.origin) reasons.push(reference.origin.kind === 'gps' ? 'Cerca de tu ubicación' : 'Cerca del centro del mapa')
    if (event.starts_soon) reasons.push('Comienza pronto o está en curso')
    return reasons.join(' · ')
  }
  return <section className="home-suggestions" aria-labelledby="home-suggestions-title" aria-busy={state.loading}>
    <div className="home-suggestions-heading"><h2 id="home-suggestions-title">Para vos</h2><Link className="text-button" to="/me/interests">Mis intereses</Link></div>
    <p className="field-hint">{state.loading ? 'Consultando tus preferencias y eventos disponibles.' : state.error ? 'Reintentá para consultar tus preferencias y eventos disponibles.' : state.hasInterests ? 'Sugerencias por tus intereses, cercanía o fecha. Son independientes de los filtros de abajo.' : 'No elegiste intereses: estos son próximos eventos públicos generales.'}</p>
    {reference.origin && !state.loading && !state.error && state.hasInterests && <p className="field-hint">Referencia de cercanía: {originLabel(reference)}.</p>}
    {state.loading ? <div role="status"><StatusMessage title="Buscando sugerencias">Esperá un momento.</StatusMessage></div> : state.error ? <><StatusMessage title="No pudimos cargar tus sugerencias" tone="error">Revisá la conexión y volvé a intentar.</StatusMessage><button className="secondary-button" type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar sugerencias</button></> : <>
      {!events.length && <StatusMessage title={state.hasInterests ? 'Todavía no hay sugerencias relevantes' : 'Todavía no hay eventos públicos disponibles'}>Cuando haya eventos disponibles para sugerirte, los vas a encontrar acá.</StatusMessage>}
      {state.imageError && <p className="field-hint" role="status">No pudimos cargar algunas fotos. <button className="text-button" type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar fotos de sugerencias</button></p>}
      {events.length > 0 && <ul className="home-event-list">{events.map(event => <li key={event.id}><EventCard event={event} returnTo={returnTo} /><p className="home-suggestion-reason">{reason(event)}</p></li>)}</ul>}
    </>}
  </section>
}
