/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../shared/Icon'
import { Scene } from '../shared/Scene'
import { categories } from '../shared/data'
import { useVariant } from '../shared/variant'
import { BackBar, Notice } from './ui'

export const createVariants = [
  { id: 'form', label: 'Formulario' },
  { id: 'errors', label: 'Con errores' },
  { id: 'uncertain', label: 'Publicación por confirmar' },
]

type Values = { title: string; description: string; sd: string; st: string; ed: string; et: string; address: string; place: string; lat: string; lng: string; category: string; capacity: string }
const empty: Values = { title: '', description: '', sd: '', st: '', ed: '', et: '', address: '', place: '', lat: '', lng: '', category: '', capacity: '' }
const messages: Partial<Record<keyof Values, string>> = {
  title: 'Escribí un título de al menos 3 caracteres.',
  description: 'Contanos de qué se trata el plan.',
  sd: 'Elegí la fecha de inicio.', st: 'Elegí la hora de inicio.', ed: 'Elegí la fecha de fin.', et: 'Elegí la hora de fin.',
  address: 'Ingresá la dirección del lugar.', lat: 'Indicá la latitud.', lng: 'Indicá la longitud.',
  category: 'Elegí una categoría.', capacity: 'Ingresá un cupo mayor a 0.',
}

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={`bx-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="bx-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="bx-error">{error}</p>}
    </div>
  )
}

export function Create() {
  const variant = useVariant()
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>(variant === 'uncertain' ? { ...empty, title: 'Ciclo de cine al aire libre', description: 'Una película por semana en el patio.', sd: '2026-10-23', st: '20:00', ed: '2026-10-23', et: '22:30', address: 'Av. Corrientes 4800, CABA', place: 'Patio del Almagro', lat: '-34.6037', lng: '-58.3816', category: 'Arte', capacity: '40' } : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>(() => variant === 'errors' ? { title: messages.title, sd: messages.sd, st: messages.st, address: messages.address, category: messages.category, capacity: messages.capacity } : {})
  const [uncertain, setUncertain] = useState(variant === 'uncertain')
  const [photos, setPhotos] = useState<('studio' | 'market' | 'night')[]>(variant === 'uncertain' ? ['market', 'night'] : [])
  const set = (key: keyof Values) => (e: { target: { value: string } }) => { setValues(v => ({ ...v, [key]: e.target.value })); setErrors(current => ({ ...current, [key]: undefined })) }
  const input = (key: keyof Values, type = 'text', placeholder?: string, extra: Record<string, unknown> = {}) => (
    <input id={`bx-${key}`} name={key} type={type} value={values[key]} placeholder={placeholder} onChange={set(key)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `bx-${key}-error` : undefined} {...extra} />
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    if (uncertain) { navigate('/b/event?e=e1&v=organizer'); return }
    const required: (keyof Values)[] = ['title', 'description', 'sd', 'st', 'ed', 'et', 'address', 'lat', 'lng', 'category', 'capacity']
    const next: Partial<Record<keyof Values, string>> = {}
    for (const key of required) if (!values[key].trim()) next[key] = messages[key]
    setErrors(next)
    const first = required.find(key => next[key])
    if (first) { document.getElementById(`bx-${first}`)?.focus(); return }
    navigate('/b/event?e=e1&v=organizer')
  }

  return (
    <div className="bx-page">
      <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div>
      <BackBar fallback="/b/events" label="Salir sin guardar" />
      <header className="bx-head rise">
        <h1>Creá un evento</h1>
        <p className="bx-sub">Compartí un plan con la comunidad. Será público al publicarlo.</p>
      </header>
      <form className="bx-form" onSubmit={submit} noValidate>
        <section className="b-glass" aria-labelledby="bx-s1">
          <h2 id="bx-s1">Información</h2>
          <Field id="bx-title" label="Título del evento" error={errors.title}>{input('title', 'text', '¿Cuál es el plan?')}</Field>
          <Field id="bx-description" label="Descripción del evento" error={errors.description}>
            <textarea id="bx-description" rows={3} value={values.description} onChange={set('description')} placeholder="Contá de qué se trata" aria-invalid={Boolean(errors.description)} />
          </Field>
          <Field id="bx-category" label="Categoría" error={errors.category}>
            <select id="bx-category" value={values.category} onChange={set('category')} aria-invalid={Boolean(errors.category)}><option value="">Elegí una categoría</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
          </Field>
        </section>

        <section className="b-glass" aria-labelledby="bx-s2">
          <h2 id="bx-s2">Horarios</h2>
          <fieldset><legend>Inicio del evento</legend><div className="bx-pair">
            <Field id="bx-sd" label="Fecha" error={errors.sd}>{input('sd', 'date')}</Field>
            <Field id="bx-st" label="Hora" error={errors.st}>{input('st', 'time')}</Field>
          </div></fieldset>
          <fieldset><legend>Fin del evento</legend><div className="bx-pair">
            <Field id="bx-ed" label="Fecha" error={errors.ed}>{input('ed', 'date')}</Field>
            <Field id="bx-et" label="Hora" error={errors.et}>{input('et', 'time')}</Field>
          </div></fieldset>
          <p className="bx-hint">Horarios de Argentina.</p>
        </section>

        <section className="b-glass" aria-labelledby="bx-s3">
          <h2 id="bx-s3">Ubicación</h2>
          <Field id="bx-address" label="Dirección" error={errors.address}>{input('address', 'text', 'Calle, número y ciudad')}</Field>
          <Field id="bx-place" label="Nombre del lugar (opcional)">{input('place', 'text', 'Por ejemplo, Centro Cultural')}</Field>
          <button type="button" className="bx-btn ghost wide"><Icon name="locate" size={20} />Usar mi ubicación actual</button>
          <div className="bx-pair">
            <Field id="bx-lat" label="Latitud" error={errors.lat}>{input('lat', 'number', '−34.6037', { step: 'any' })}</Field>
            <Field id="bx-lng" label="Longitud" error={errors.lng}>{input('lng', 'number', '−58.3816', { step: 'any' })}</Field>
          </div>
        </section>

        <section className="b-glass" aria-labelledby="bx-s4">
          <h2 id="bx-s4">Cupo y fotos</h2>
          <Field id="bx-capacity" label="Capacidad máxima" error={errors.capacity}>{input('capacity', 'number', 'Cantidad de participantes', { min: 1 })}</Field>
          <div className="bx-field">
            <span className="bx-label">Fotos (opcional)</span>
            <button type="button" className="bx-drop" onClick={() => setPhotos(current => (current.length < 3 ? [...current, (['studio', 'market', 'night'] as const)[current.length]] : current))}><Icon name="image" size={24} /><strong>Agregar fotos</strong><span>Hasta 10 fotos JPG, PNG o WebP, de hasta 5 MB cada una.</span></button>
            {photos.length > 0 && <ul className="bx-thumbs">{photos.map((scene, index) => <li key={scene}><Scene id={scene} />{index === 0 && <span>Portada</span>}<button type="button" aria-label={`Quitar foto ${index + 1}`} onClick={() => setPhotos(current => current.filter(item => item !== scene))}><Icon name="close" size={16} /></button></li>)}</ul>}
          </div>
        </section>

        {uncertain && <Notice tone="warn"><b>Publicación por confirmar.</b> No pudimos confirmar si el evento se publicó. Conservamos los datos de este intento: comprobá antes de volver a enviar.</Notice>}
        {Object.keys(errors).some(key => errors[key as keyof Values]) && <Notice tone="bad">Revisá los campos marcados antes de publicar.</Notice>}
        <button type="submit" className="bx-cta">{uncertain ? 'Comprobar publicación' : 'Publicar evento'}</button>
        <p className="bx-hint center">El evento será público. Los datos se envían al pulsar Publicar evento.</p>
        {uncertain && <button type="button" className="bx-btn ghost wide" onClick={() => setUncertain(false)}>Descartar este intento</button>}
      </form>
    </div>
  )
}
