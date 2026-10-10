import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuth } from '../features/auth/useAuth'
import { StatusMessage } from '../components/StatusMessage'
import { loadCategories, loadEvent, loadEventImages, type EventRecord } from '../features/events/api'
import { argentinaNow, formatEventTime } from '../features/events/validation'
import './discovery.css'

export function EventDetailPage() {
  const { id = '' } = useParams()
  return <EventDetailContent key={id} id={id} />
}

function EventDetailContent({ id }: { id: string }) {
  const location = useLocation()
  const { session } = useAuth()
  const [category, setCategory] = useState('Categoría no disponible')
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    loadEvent(id).then(async data => {
      if (!active) return
      setEvent(data)
      if (data) {
        document.title = `${data.title} · PlanIt`
        try { const categories = await loadCategories(); if (active) setCategory(categories.find(item => item.id === data.category_id)?.name ?? 'Categoría no disponible') } catch { /* Category failure must not hide the event. */ }
        try { const photos = await loadEventImages(id); if (active) setImages(photos) } catch { if (active) setImageError(true) }
      }
    }).catch(() => { if (active) setError('No pudimos consultar el evento. Revisá la conexión y reintentá.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, attempt])
  if (loading) return <StatusMessage title="Cargando evento">Esperá un momento.</StatusMessage>
  function retry() { setLoading(true); setError(''); setImageError(false); setImages([]); setAttempt(value => value + 1) }
  if (error) return <><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button className="secondary-button" onClick={retry}>Reintentar</button></>
  if (!event) return <StatusMessage title="Evento no disponible">No encontramos el evento o no tenés permiso para consultarlo.</StatusMessage>
  return <div className="event-detail-page">
    {location.state?.published && <StatusMessage title="Evento publicado">Tu evento ya está disponible para la comunidad.</StatusMessage>}
    <Link className="detail-back secondary-link" to="/map"><Icon name="back" />Volver al mapa</Link>
    <div className="event-hero">{images[0] && !imageError ? <img src={images[0]} width="960" height="600" alt={`Foto de ${event.title}`} onError={() => setImageError(true)} /> : <div className="event-hero-placeholder"><Icon name="calendar" /><span>Sin foto de portada</span></div>}<div className="event-hero-overlay" /></div>
    <h1>{event.title}</h1>
    <span className="category-chip">{category}</span>
    {imageError && <p role="status" className="field-error">No pudimos cargar las fotos. <button className="text-button" onClick={retry}>Reintentar</button></p>}
    <dl className="detail-metadata"><dt><Icon name="calendar" />Inicio</dt><dd>{formatEventTime(event.starts_at)}</dd><dt><Icon name="clock" />Fin</dt><dd>{formatEventTime(event.ends_at)}</dd><dt><Icon name="pin" />Lugar</dt><dd>{event.location_name ?? event.address}</dd>{event.location_name && <><dt>Dirección</dt><dd>{event.address}</dd></>}</dl>
    <p className="event-description">{event.description}</p>
    <p className="field-hint">Horarios de Argentina.</p>
    <div className="event-capacity"><Icon name="people" /><div><strong>Cupo: {event.capacity} participantes</strong><p>La cantidad de confirmados estará disponible cuando se habiliten las inscripciones.</p></div></div>
    <p className="participation-notice" role="status">{event.archived_at ? 'Este evento está archivado.' : event.cancelled_at ? 'Este evento está cancelado.' : event.ends_at <= argentinaNow() ? 'Este evento ya finalizó.' : event.organizer_id === session?.user.id ? 'Organizás este evento. No ocupás cupo ni podés inscribirte.' : 'Las inscripciones todavía no están habilitadas.'}</p>
    <Link className="secondary-link" to="/my-events">Ir a Mis eventos</Link>
  </div>
}
