import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventFields } from '../components/EventFields'
import { GradientButton } from '../components/GradientButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { loadCategories, PublicationError, publishEvent, type PublishAttempt } from '../features/events/api'
import { emptyEvent, validateEvent, validateImages, type Category, type EventErrors, type EventValues } from '../features/events/validation'
import { getCurrentLocation } from '../features/location/geolocation'

export function CreateEventPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
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
  const locationRevision = useRef(0)
  const attempt = useRef<PublishAttempt | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const locked = busy || uncertain

  useEffect(() => { document.title = 'Crear evento · PlanIt' }, [])
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
    if (field === 'latitude' || field === 'longitude') { locationRevision.current += 1; setLocating(false) }
    setValues(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
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
      setLocationError('No pudimos obtener tu ubicación. Ingresá las coordenadas manualmente.'); setLocating(false)
    })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || !session || catalogLoading || catalogError || locating) return
    setError('')
    if (!uncertain) {
      const validation = validateEvent(values, categories, files)
      setErrors(validation)
      const first = Object.keys(validation)[0]
      if (first) { formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return }
      attempt.current = { id: crypto.randomUUID(), values: { ...values }, files: [...files], paths: [] }
    }
    if (!attempt.current) return
    sending.current = true; setBusy(true)
    locationRevision.current += 1
    try {
      const id = await publishEvent(attempt.current, session.user.id, setProgress)
      navigate(`/events/${id}`, { replace: true, state: { published: true } })
    } catch (failure) {
      const pending = failure instanceof PublicationError && failure.uncertain
      setUncertain(pending)
      setError(failure instanceof Error ? failure.message : 'No se pudo publicar. Revisá la conexión e intentá nuevamente.')
      if (!pending) {
        attempt.current = null
        setCatalogLoading(true); setCatalogError('')
        setCatalogAttempt(value => value + 1)
      }
    } finally { sending.current = false; setBusy(false); setProgress('') }
  }
  return <div className="create-event-page">
    <ScreenHeader title="Creá un evento" description="Compartí un plan con la comunidad." icon="calendar" />
    <form ref={formRef} className="event-form" onSubmit={submit} noValidate aria-busy={busy}>
      <EventFields values={values} errors={errors} categories={categories} locked={locked} change={change} locating={locating} locate={locate} locationError={locationError} catalogLoading={catalogLoading} catalogError={catalogError} retryCategories={() => { setCatalogLoading(true); setCatalogError(''); setCatalogAttempt(value => value + 1) }} />
      <div className="form-field"><label htmlFor="event-images">Fotos (opcional)</label><input className="image-picker" id="event-images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={locked} aria-invalid={Boolean(errors.images)} aria-describedby={errors.images ? 'event-images-error' : 'event-images-hint'} onChange={event => {
        const selected = [...files, ...Array.from(event.target.files ?? [])]
        const imageError = validateImages(selected)
        setErrors(current => ({ ...current, images: imageError }))
        if (!imageError) setFiles(selected)
        event.target.value = ''
      }} /><p id="event-images-hint" className="field-hint">Hasta 10 fotos JPG, PNG o WebP, de hasta 5 MB cada una.</p>{errors.images && <p id="event-images-error" className="field-error">{errors.images}</p>}
      {files.length > 0 && <ul className="image-previews">{files.map((file, index) => <li key={`${file.name}-${index}`}><img src={previews[index]} alt={`Foto seleccionada ${index + 1}`} /><button className="secondary-button" type="button" disabled={locked} aria-label={`Quitar foto ${index + 1}`} onClick={() => { setFiles(current => current.filter((_, position) => position !== index)); setErrors(current => ({ ...current, images: undefined })) }}>Quitar</button></li>)}</ul>}</div>
      {error && <div ref={feedbackRef} tabIndex={-1} className="auth-feedback"><StatusMessage title={uncertain ? 'Publicación por confirmar' : 'No se pudo publicar'} tone="error">{error}{uncertain && ' Conservamos los datos de este intento. Reintentá para comprobarlo sin crear otro evento.'}</StatusMessage></div>}
      <GradientButton type="submit" disabled={busy || locating || catalogLoading || Boolean(catalogError) || !categories.length}>{busy ? progress || 'Publicando…' : uncertain ? 'Comprobar publicación' : 'Publicar evento'}</GradientButton>
      <p className="field-hint event-public-note">El evento será público. Los datos se envían al pulsar Publicar evento.</p>
      <span role="status" className="sr-only">{progress}</span>
    </form>
  </div>
}
