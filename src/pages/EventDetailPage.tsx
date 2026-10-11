import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuth } from '../features/auth/useAuth'
import { StatusMessage } from '../components/StatusMessage'
import { EventParticipation } from '../components/EventParticipation'
import { loadCategories, loadEvent, loadEventImages, loadEventOrganizer, type EventRecord } from '../features/events/api'
import { formatEventTime } from '../features/events/validation'
import './discovery.css'

export function EventDetailPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <EventDetailContent key={`${id}:${session?.user.id}:${session?.access_token}`} id={id} />
}

function EventDetailContent({ id }: { id: string }) {
  const location = useLocation()
  const myEventsReturnTo = location.state?.myEventsReturnTo === '/my-events?section=organizing' || location.state?.myEventsReturnTo === '/my-events?section=participating' ? location.state.myEventsReturnTo : '/my-events'
  const returnTo = location.state?.returnTo === '/home' ? '/home' : '/map'
  const { session } = useAuth()
  const [category, setCategory] = useState('Categoría no disponible')
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [organizer, setOrganizer] = useState<{ display_name: string; username: string } | null>(null)
  const [organizerError, setOrganizerError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let revision = 0
    async function load() {
      const request = ++revision
      const current = () => active && request === revision
      setLoading(true)
      setEvent(null)
      setImages([])
      setOrganizer(null)
      setOrganizerError(false)
      setCategory('Categoría no disponible')
      setImageError(false)
      setError('')
      document.title = 'Detalle del evento · PlanIt'
      try {
        const data = await loadEvent(id)
        if (!current()) return
        setEvent(data)
        if (data) {
          document.title = `${data.title} · PlanIt`
          await Promise.all([
            loadCategories().then(categories => { if (current()) setCategory(categories.find(item => item.id === data.category_id)?.name ?? 'Categoría no disponible') }).catch(() => { /* Category failure must not hide the event. */ }),
            loadEventImages(id).then(photos => { if (current()) setImages(photos) }).catch(() => { if (current()) setImageError(true) }),
            loadEventOrganizer(id).then(profile => { if (current()) setOrganizer(profile) }).catch(() => { if (current()) setOrganizerError(true) }),
          ])
        }
      } catch { if (current()) setError('No pudimos consultar el evento. Revisá la conexión y reintentá.') }
      finally { if (current()) setLoading(false) }
    }
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    void load()
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [id, attempt])
  if (loading) return <StatusMessage title="Cargando evento">Esperá un momento.</StatusMessage>
  function retry() { setLoading(true); setError(''); setImageError(false); setImages([]); setAttempt(value => value + 1) }
  if (error) return <><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button className="secondary-button" onClick={retry}>Reintentar</button></>
  if (!event) return <StatusMessage title="Evento no disponible">No encontramos el evento o no tenés permiso para consultarlo.</StatusMessage>
  return <div className="event-detail-page">
    {location.state?.published && <StatusMessage title="Evento publicado">Tu evento ya está disponible para la comunidad.</StatusMessage>}
    <Link className="detail-back secondary-link" to={returnTo}><Icon name="back" />{returnTo === '/home' ? 'Volver al inicio' : 'Volver al mapa'}</Link>
    <div className="event-hero">{images[0] && !imageError ? <img src={images[0]} width="960" height="600" alt={`Foto de ${event.title}`} onError={() => setImageError(true)} /> : <div className="event-hero-placeholder"><Icon name="calendar" /><span>Sin foto de portada</span></div>}<div className="event-hero-overlay" /></div>
    <h1>{event.title}</h1>
    <span className="category-chip">{category}</span>
    {imageError && <p role="status" className="field-error">No pudimos cargar las fotos. <button className="text-button" onClick={retry}>Reintentar</button></p>}
    <dl className="detail-metadata"><dt><Icon name="calendar" />Inicio</dt><dd>{formatEventTime(event.starts_at)}</dd><dt><Icon name="clock" />Fin</dt><dd>{formatEventTime(event.ends_at)}</dd><dt><Icon name="pin" />Lugar</dt><dd>{event.location_name ?? event.address}</dd>{event.location_name && <><dt>Dirección</dt><dd>{event.address}</dd></>}</dl>
    <p className="event-description">{event.description}</p>
    {images.length > 1 && <section className="event-gallery" aria-label="Fotos del evento">{images.slice(1).map((url, index) => <img key={`${url}-${index}`} src={url} width="360" height="240" alt={`Foto ${index + 2} de ${event.title}`} loading="lazy" onError={e => { e.currentTarget.hidden = true }} />)}</section>}
    <section className="event-organizer" aria-labelledby="event-organizer-title">
      <h2 id="event-organizer-title">Organizador</h2>
      {organizer ? <><strong>{organizer.display_name}</strong><p>@{organizer.username}</p></> : organizerError ? <p role="status">No pudimos cargar los datos del organizador. <button className="text-button" type="button" onClick={retry}>Reintentar</button></p> : <p>Datos del organizador no disponibles.</p>}
    </section>
    <p className="field-hint">Horarios de Argentina.</p>
    <EventParticipation key={`${id}:${session?.user.id}`} eventId={id} />
    <Link className="secondary-link" to={myEventsReturnTo}>Ir a Mis eventos</Link>
  </div>
}
