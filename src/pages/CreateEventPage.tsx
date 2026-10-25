import { EventImage } from '../components/EventImage'
import { useBackLocation as useLocation } from '../components/back-navigation-context'
import { BackButton } from '../components/BackButton'
import type { AddressSuggestion } from '../features/location/autocomplete'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { EventFields } from '../components/EventFields'
import { GradientButton } from '../components/GradientButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadCategories, PublicationError, publishEvent, type PublishAttempt } from '../features/events/api'
import { emptyEvent, validateEvent, validateImages, type Category, type EventErrors, type EventValues } from '../features/events/validation'
import { getCurrentLocation } from '../features/location/geolocation'
import { loadDuplicateSource } from '../features/events/actions'
import { validatedMyEventsReturn } from '../features/events/my-events'
import './event-forms.css'

export function CreateEventPage() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const duplicateFrom = params.get('duplicateFrom')
  // Account/source changes discard old forms, token renewals preserve local edits.
  return <CreateEventForm key={`${session?.user.id}:${duplicateFrom ?? 'new'}`} duplicateFrom={duplicateFrom} />
}
function CreateEventForm({ duplicateFrom }: { duplicateFrom: string | null }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: location.state?.returnTo === '/home' || location.state?.returnTo === '/map' ? location.state.returnTo as string : undefined }
  const [sourceLoading, setSourceLoading] = useState(duplicateFrom !== null)
  const [sourceError, setSourceError] = useState('')
  const [sourceAttempt, setSourceAttempt] = useState(0)
  const [values, setValues] = useState<EventValues>({ ...emptyEvent })
  const [categories, setCategories] = useState<Category[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [errors, setErrors] = useState<EventErrors>({})
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const sending = useRef(false)
  const mounted = useRef(false)
  const locationRevision = useRef(0)
  const attempt = useRef<PublishAttempt | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const locked = busy || uncertain
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  useEffect(() => { document.title = duplicateFrom !== null ? 'Duplicar evento · PlanIt' : 'Crear evento · PlanIt' }, [duplicateFrom])
  useEffect(() => {
    if (duplicateFrom === null) return
    let active = true
    loadDuplicateSource(duplicateFrom).then(data => { if (active) setValues(data) }).catch(failure => { if (active) setSourceError(failure instanceof Error ? failure.message : 'No pudimos cargar el origen.') }).finally(() => { if (active) setSourceLoading(false) })
    return () => { active = false }
  }, [duplicateFrom, sourceAttempt])
  useEffect(() => {
    let active = true
    loadCategories().then(data => { if (active) setCategories(data) }).catch(() => { if (active) setCatalogError('No pudimos cargar las categorías. Revisá la conexión y reintentá.') }).finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [catalogAttempt])
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    // Sync external blob resources and release them on change/unmount.
    // oxlint-disable-next-line react/set-state-in-effect
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])
  useEffect(() => { if (error) feedbackRef.current?.focus() }, [error])
  useEffect(() => () => { locationRevision.current += 1 }, [])

  function change(field: keyof EventValues, value: string) {
    if (locked) return
    if (field === 'address' || field === 'latitude' || field === 'longitude') { locationRevision.current += 1; setLocating(false); setLocationError('') }
    if (field === 'address') {
      setValues(current => ({ ...current, address: value, latitude: '', longitude: '' }))
      setErrors(current => ({ ...current, address: undefined, latitude: undefined, longitude: undefined }))
      return
    }
    setValues(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
  }
  function selectLocation(value: AddressSuggestion) {
    if (locked) return
    locationRevision.current += 1
    setLocating(false); setLocationError('')
    setValues(current => ({ ...current, address: value.address, latitude: String(value.latitude), longitude: String(value.longitude) }))
    setErrors(current => ({ ...current, address: undefined, latitude: undefined, longitude: undefined }))
  }
  function locate() {
    setLocating(true); setLocationError('')
    const revision = ++locationRevision.current
    getCurrentLocation().then(position => {
      if (revision !== locationRevision.current) return
      setValues(current => ({ ...current, latitude: position.latitude.toFixed(6), longitude: position.longitude.toFixed(6) }))
      setErrors(current => ({ ...current, latitude: undefined, longitude: undefined }))
      setLocating(false)
    }).catch(() => {
      if (revision !== locationRevision.current) return
      setLocationError('No pudimos obtener tu ubicación. Elegí una dirección sugerida o reintentá.'); setLocating(false)
    })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || !session || sourceLoading || sourceError || catalogLoading || catalogError || locating) return
    setError('')
    if (!uncertain) {
      const validation = validateEvent(values, categories, files)
      setErrors(validation)
      const first = Object.keys(validation)[0]
      if (first) { formRef.current?.querySelector<HTMLElement>(`[name="${first === 'latitude' || first === 'longitude' ? 'address' : first}"]`)?.focus(); return }
      attempt.current = { id: crypto.randomUUID(), values: { ...values }, files: [...files], paths: [] }
    }
    if (!attempt.current) return
    sending.current = true; setBusy(true)
    locationRevision.current += 1
    try {
      const id = await publishEvent(attempt.current, session.user.id, setProgress)
      if (!mounted.current) return
      navigate(`/events/${id}`, { replace: true, state: { published: true, ...origin } })
    } catch (failure) {
      if (!mounted.current) return
      const pending = failure instanceof PublicationError && failure.uncertain
      setUncertain(pending)
      setError(failure instanceof Error ? failure.message : 'No se pudo publicar. Revisá la conexión e intentá nuevamente.')
      if (!pending) {
        attempt.current = null
        setCatalogLoading(true); setCatalogError('')
        setCatalogAttempt(value => value + 1)
      }
    } finally { sending.current = false; if (mounted.current) { setBusy(false); setProgress('') } }
  }
  if (sourceLoading) return <StatusMessage title="Cargando evento de origen">Esperá un momento.</StatusMessage>
  if (sourceError) return <><StatusMessage title="No se pudo duplicar" tone="error">{sourceError}</StatusMessage><button type="button" className="secondary-button" onClick={() => { setSourceLoading(true); setSourceError(''); setSourceAttempt(value => value + 1) }}>Reintentar</button><BackButton to={origin.myEventsReturnTo ?? '/my-events?section=organizing&filter=all'} /></>
  return <div className="create-event-page">
    <div className="event-form-wash" aria-hidden="true" />
    {duplicateFrom !== null && <BackButton to={`/events/${duplicateFrom}`} state={origin} />}
    <ScreenHeader title={duplicateFrom !== null ? 'Duplicá un evento' : 'Creá un evento'} description={duplicateFrom !== null ? 'Revisá los datos y elegí nuevas fechas. Las fotos y participaciones no se copian.' : 'Compartí un plan con la comunidad.'} icon="calendar" />
    <form ref={formRef} className="event-form" onSubmit={submit} noValidate aria-busy={busy}>
      <EventFields selectLocation={selectLocation} values={values} errors={errors} categories={categories} locked={locked} change={change} locating={locating} locate={locate} locationError={locationError} catalogLoading={catalogLoading} catalogError={catalogError} retryCategories={() => { setCatalogLoading(true); setCatalogError(''); setCatalogAttempt(value => value + 1) }} />
      <section className="event-form-section" aria-labelledby="event-images-heading"><h2 id="event-images-heading">Imágenes</h2><div className="form-field"><label htmlFor="event-images">Fotos (opcional)</label><input className="image-picker" id="event-images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={locked} aria-invalid={Boolean(errors.images)} aria-describedby={errors.images ? 'event-images-error' : 'event-images-hint'} onChange={event => {
        const selected = [...files, ...Array.from(event.target.files ?? [])]
        const imageError = validateImages(selected)
        setErrors(current => ({ ...current, images: imageError }))
        if (!imageError) setFiles(selected)
        event.target.value = ''
      }} /><p id="event-images-hint" className="field-hint">Hasta 10 fotos JPG, PNG o WebP, de hasta 5 MB cada una.</p>{errors.images && <p id="event-images-error" className="field-error">{errors.images}</p>}
      {files.length > 0 && <ul className="image-previews">{files.map((file, index) => <li key={`${file.name}-${index}`}><EventImage src={previews[index]} alt={`Foto seleccionada ${index + 1}`} loading="eager" /><button className="secondary-button" type="button" disabled={locked} aria-label={`Quitar foto ${index + 1}`} onClick={() => { setFiles(current => current.filter((_, position) => position !== index)); setErrors(current => ({ ...current, images: undefined })) }}>Quitar</button></li>)}</ul>}</div></section>
      {error && <div ref={feedbackRef} tabIndex={-1} className="auth-feedback"><StatusMessage title={uncertain ? 'Publicación por confirmar' : 'No se pudo publicar'} tone="error">{error}{uncertain && ' Conservamos los datos de este intento. Reintentá para comprobarlo sin crear otro evento.'}</StatusMessage></div>}
      <GradientButton type="submit" disabled={busy || locating || catalogLoading || Boolean(catalogError) || !categories.length}>{busy ? progress || 'Publicando…' : uncertain ? 'Comprobar publicación' : 'Publicar evento'}</GradientButton>
      <p className="field-hint event-public-note">El evento será público. Los datos se envían al pulsar Publicar evento.</p>
      {duplicateFrom !== null && <Link className="secondary-link" to={`/events/${duplicateFrom}`} state={origin}>Salir sin guardar</Link>}
      <span role="status" className="sr-only">{progress}</span>
    </form>
  </div>
}
