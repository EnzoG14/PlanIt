import { useBackLocation as useLocation } from '../components/back-navigation-context'
import { BackButton } from '../components/BackButton'
import type { AddressSuggestion } from '../features/location/autocomplete'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EventFields } from '../components/EventFields'
import { GradientButton } from '../components/GradientButton'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadCategories, loadEvent, loadEventImages, type EventRecord } from '../features/events/api'
import { EditError, eventValues, isEventEditable, matchesEdit, updateEvent } from '../features/events/edit'
import { loadParticipationSummary } from '../features/events/participation'
import { validatedMyEventsReturn } from '../features/events/my-events'
import { checkEventOperation } from '../features/events/actions'
import { emptyEvent, validateEvent, type Category, type EventErrors, type EventValues } from '../features/events/validation'
import { getCurrentLocation } from '../features/location/geolocation'
import './discovery.css'
import './edit-event.css'
import './event-forms.css'

export function EditEventPage({ reactivate = false }: { reactivate?: boolean }) {
  const { id = '' } = useParams()
  const { session } = useAuth()
  // A token refresh keeps the same user's local edits; event/account changes reset.
  return <EditEventForm key={`${id}:${session?.user.id}:${reactivate}`} reactivate={reactivate} id={id} userId={session?.user.id ?? ''} />
}
function EditEventForm({ id, userId, reactivate }: { id: string; userId: string; reactivate: boolean }) {
  const operation = useRef(crypto.randomUUID())
  const editable = (data: EventRecord) => reactivate ? Boolean(data.archived_at) : isEventEditable(data)
  const navigate = useNavigate()
  const location = useLocation()
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: ['/home', '/map'].includes(location.state?.returnTo) ? location.state.returnTo : undefined }
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [values, setValues] = useState<EventValues>({ ...emptyEvent })
  const [categories, setCategories] = useState<Category[]>([])
  const [confirmed, setConfirmed] = useState<number>()
  const [photo, setPhoto] = useState('')
  const [photoError, setPhotoError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [errors, setErrors] = useState<EventErrors>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const active = useRef(false)
  const sending = useRef(false)
  const locationRevision = useRef(0)
  const form = useRef<HTMLFormElement>(null)
  const feedback = useRef<HTMLDivElement>(null)
  const locked = busy || uncertain
  useEffect(() => { active.current = true; return () => { active.current = false; locationRevision.current += 1 } }, [])
  useEffect(() => {
    let current = true
    document.title = `${reactivate ? 'Desarchivar evento' : 'Editar evento'} · PlanIt`
    async function load() {
      try {
        const data = await loadEvent(id)
        if (!current) return
        setEvent(data)
        if (!data || data.organizer_id !== userId || !(reactivate ? data.archived_at : isEventEditable(data))) return
        const [catalog, summary] = await Promise.all([loadCategories(), loadParticipationSummary(id)])
        if (!current) return
        setCategories(catalog); setConfirmed(reactivate ? 0 : summary.confirmed_count); setValues(reactivate ? { ...eventValues(data), start_date: '', start_time: '', end_date: '', end_time: '' } : eventValues(data))
        loadEventImages(id).then(images => { if (current) { setPhoto(images[0] ?? ''); setPhotoError(false) } }).catch(() => { if (current) setPhotoError(true) })
      } catch { if (current) setLoadError('No pudimos cargar el formulario. Revisá la conexión y reintentá.') }
      finally { if (current) setLoading(false) }
    }
    void load()
    return () => { current = false }
  }, [id, userId, attempt, reactivate])
  useEffect(() => { if (error) feedback.current?.focus() }, [error])
  const retry = () => { setLoading(true); setLoadError(''); setAttempt(value => value + 1) }
  const success = () => navigate(`/events/${id}`, { replace: true, state: { ...origin, edited: !reactivate, reactivated: reactivate } })
  function change(field: keyof EventValues, value: string) {
    if (locked) return
    if (field === 'address' || field === 'latitude' || field === 'longitude') { locationRevision.current += 1; setLocating(false); setLocationError('') }
    if (field === 'address') {
      setValues(current => ({ ...current, address: value, latitude: '', longitude: '' }))
      setErrors(current => ({ ...current, address: undefined, latitude: undefined, longitude: undefined }))
      return
    }
    setValues(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined }))
  }
  function selectLocation(value: AddressSuggestion) {
    if (locked) return
    locationRevision.current += 1
    setLocating(false); setLocationError('')
    setValues(current => ({ ...current, address: value.address, latitude: String(value.latitude), longitude: String(value.longitude) }))
    setErrors(current => ({ ...current, address: undefined, latitude: undefined, longitude: undefined }))
  }
  async function locate() {
    const revision = ++locationRevision.current
    setLocating(true); setLocationError('')
    try {
      const position = await getCurrentLocation()
      if (!active.current || revision !== locationRevision.current) return
      setValues(current => ({ ...current, latitude: position.latitude.toFixed(6), longitude: position.longitude.toFixed(6) }))
      setErrors(current => ({ ...current, latitude: undefined, longitude: undefined }))
    } catch { if (active.current && revision === locationRevision.current) setLocationError('No pudimos obtener tu ubicación. Elegí una dirección sugerida o reintentá.') }
    finally { if (active.current && revision === locationRevision.current) setLocating(false) }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending.current || locating) return
    if (!uncertain) {
      const validation = validateEvent(values, categories, [])
      if (confirmed !== undefined && Number(values.capacity) < confirmed) validation.capacity = `El cupo no puede ser menor que ${confirmed} inscriptos confirmados.`
      setErrors(validation)
      const first = Object.keys(validation)[0]
      if (first) { form.current?.querySelector<HTMLElement>(`[name="${first === 'latitude' || first === 'longitude' ? 'address' : first}"]`)?.focus(); return }
    }
    sending.current = true; setBusy(true); setError('')
    try {
      if (uncertain) {
        const current = await loadEvent(id)
        if (!active.current) return
        if (reactivate ? await checkEventOperation(id, operation.current, 'reactivate') : current?.organizer_id === userId && matchesEdit(current, values)) { success(); return }
        setUncertain(false)
        setError('El guardado no se confirmó. Conservamos tus cambios; revisalos y volvé a guardar.')
        return
      }
      await updateEvent(id, { ...values }, reactivate ? operation.current : undefined)
      if (active.current) success()
    } catch (failure) {
      if (!active.current) return
      setUncertain(failure instanceof EditError ? failure.uncertain : uncertain)
      setError(failure instanceof Error ? failure.message : 'No pudimos comprobar el guardado. Revisá la conexión.')
      loadParticipationSummary(id).then(summary => { if (active.current) setConfirmed(reactivate ? 0 : summary.confirmed_count) }).catch(() => { /* Server validates capacity even if refresh fails. */ })
    } finally { sending.current = false; if (active.current) setBusy(false) }
  }
  const back = <BackButton to={`/events/${id}`} state={origin} />
  if (loading) return <StatusMessage title="Cargando formulario">Esperá un momento.</StatusMessage>
  if (loadError) return <>{back}<StatusMessage title="No se pudo cargar" tone="error">{loadError}</StatusMessage><button className="secondary-button" onClick={retry}>Reintentar</button></>
  if (!event) return <>{back}<StatusMessage title="Evento no encontrado">No encontramos un evento disponible para tu cuenta.</StatusMessage></>
  if (event.organizer_id !== userId) return <>{back}<StatusMessage title="No autorizado" tone="error">Sólo el organizador puede editar este evento.</StatusMessage></>
  if (!editable(event)) return <>{back}<StatusMessage title="Evento no editable">{reactivate ? 'Sólo podés desarchivar un evento archivado.' : 'Sólo podés editar antes del inicio, sin cancelar ni archivar el evento.'}</StatusMessage></>
  return <div className="create-event-page edit-event-page">
    <div className="event-form-wash" aria-hidden="true" />
    {back}<header><h1>{reactivate ? 'Desarchivar evento' : 'Editar evento'}</h1><p>{reactivate ? 'Elegí nuevas fechas para reactivar el evento. Los asistentes deberán inscribirse otra vez; el historial, el chat y las expulsiones se conservan.' : 'Modificá la información de tu evento.'}</p></header>
    <div className="edit-event-cover">{photo && !photoError ? <img src={photo} alt={`Portada de ${event.title}`} onError={() => setPhotoError(true)} /> : <><Icon name="calendar" /><span>{photoError ? 'No pudimos cargar la portada.' : 'Sin foto de portada'}</span></>}</div>
    <form ref={form} className="event-form" onSubmit={submit} noValidate aria-busy={busy}>
      <EventFields selectLocation={selectLocation} values={values} errors={errors} categories={categories} locked={locked} change={change} locating={locating} locate={() => void locate()} locationError={locationError} catalogLoading={false} catalogError="" retryCategories={retry} confirmedCount={confirmed} />
      {error && <div ref={feedback} tabIndex={-1}><StatusMessage title={uncertain ? 'Guardado por confirmar' : 'No se pudo guardar'} tone="error">{error}{uncertain && ' Conservamos este intento. Comprobá el resultado antes de volver a guardar.'}</StatusMessage></div>}
      <GradientButton type="submit" disabled={busy || locating || !categories.length}>{busy ? 'Comprobando cambios…' : uncertain ? 'Comprobar guardado' : reactivate ? 'Desarchivar y reactivar' : 'Guardar cambios'}</GradientButton>
      <Link className="secondary-link" to={`/events/${id}`} state={origin}>{reactivate ? 'Volver sin desarchivar' : 'Cancelar edición'}</Link>
    </form>
  </div>
}
