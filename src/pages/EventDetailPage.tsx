import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusMessage } from '../components/StatusMessage'
import { loadEvent, loadEventImages, type EventRecord } from '../features/events/api'
import { formatEventTime } from '../features/events/validation'

// Minimum readback for R1 creation. Discovery/attendance remains in its block.
export function EventDetailPage() {
  const { id = '' } = useParams()
  return <EventDetailContent key={id} id={id} />
}

function EventDetailContent({ id }: { id: string }) {
  const location = useLocation()
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
    <ScreenHeader title={event.title} description={event.location_name ?? event.address} icon="calendar" />
    {images.length > 0 && <div className="event-gallery">{images.map((url, index) => <img key={url} src={url} alt={`Foto del evento ${index + 1}`} />)}</div>}
    {imageError && <p role="status" className="field-error">No pudimos cargar las fotos. <button className="text-button" onClick={retry}>Reintentar</button></p>}
    <dl className="profile-details"><dt>Inicio</dt><dd>{formatEventTime(event.starts_at)}</dd><dt>Fin</dt><dd>{formatEventTime(event.ends_at)}</dd><dt>Dirección</dt><dd>{event.address}</dd><dt>Capacidad máxima</dt><dd>{event.capacity} participantes</dd></dl>
    <p className="event-description">{event.description}</p>
    <p className="field-hint">Horarios de Argentina.</p>
    <Link className="secondary-link" to="/map">Ir al mapa</Link>
    <Link className="secondary-link" to="/my-events">Ir a Mis eventos</Link>
  </div>
}
