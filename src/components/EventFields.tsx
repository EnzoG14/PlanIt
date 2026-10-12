import { FormField } from './FormField'
import { Icon, type IconName } from './Icon'
import { StatusMessage } from './StatusMessage'
import { useState } from 'react'
import { eventDateMinimums, type Category, type EventErrors, type EventValues } from '../features/events/validation'

type Props = { values: EventValues; errors: EventErrors; categories: Category[]; locked: boolean; change: (field: keyof EventValues, value: string) => void; locating: boolean; locate: () => void; locationError: string; catalogLoading: boolean; catalogError: string; retryCategories: () => void; confirmedCount?: number }
export function EventFields({ values, errors, categories, locked, change, locating, locate, locationError, catalogLoading, catalogError, retryCategories, confirmedCount }: Props) {
  const [now, setNow] = useState(() => new Date())
  const minimums = eventDateMinimums(values, now)
  function field(name: keyof EventValues, label: string, icon: IconName, type = 'text', required = true, placeholder?: string) {
    return <FormField id={`event-${name}`} name={name} label={label} icon={icon} type={type} value={values[name]} onFocus={() => setNow(new Date())} onChange={event => change(name, event.target.value)} error={errors[name]} required={required} disabled={locked} min={name in minimums ? minimums[name as keyof typeof minimums] : name === 'capacity' ? Math.max(1, confirmedCount ?? 0) : undefined} placeholder={placeholder} inputMode={name === 'capacity' ? 'numeric' : name === 'latitude' || name === 'longitude' ? 'decimal' : undefined} step={name === 'capacity' ? 1 : name === 'latitude' || name === 'longitude' ? 'any' : undefined} />
  }
  return <>
      {field('title', 'Título del evento', 'title', 'text', true, '¿Cuál es el plan?')}
      <div className="form-field">
        <label htmlFor="event-description">Descripción del evento</label>
        <div className="field-control"><Icon name="description" /><textarea id="event-description" name="description" value={values.description} onChange={event => change('description', event.target.value)} placeholder="Contá de qué se trata" required disabled={locked} rows={3} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'event-description-error' : undefined} /></div>
        {errors.description && <p id="event-description-error" className="field-error">{errors.description}</p>}
      </div>
      <fieldset className="event-dates"><legend>Inicio del evento</legend><div className="field-pair">{field('start_date', 'Fecha de inicio', 'calendar', 'date')}{field('start_time', 'Hora de inicio', 'clock', 'time')}</div></fieldset>
      <fieldset className="event-dates"><legend>Fin del evento</legend><div className="field-pair">{field('end_date', 'Fecha de fin', 'calendar', 'date')}{field('end_time', 'Hora de fin', 'clock', 'time')}</div><p className="field-hint">Todos los horarios son de Argentina.</p></fieldset>
      <fieldset className="event-location"><legend>Ubicación</legend>
        {field('address', 'Dirección', 'pin', 'text', true, 'Calle, número y ciudad')}
        {field('location_name', 'Nombre del lugar (opcional)', 'pin', 'text', false, 'Por ejemplo, Centro Cultural')}
        <button type="button" className="secondary-button" disabled={locked || locating} onClick={locate}>{locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}</button>
        <div className="field-pair">{field('latitude', 'Latitud', 'pin', 'number', true, '−34.6037')}{field('longitude', 'Longitud', 'pin', 'number', true, '−58.3816')}</div>
        <p className="field-hint">Indicá las coordenadas del lugar. Tu ubicación actual sirve si estás allí.</p>
        {locationError && <p className="field-error" role="status">{locationError}</p>}
      </fieldset>
      <div className="form-field"><label htmlFor="event-category_id">Categoría</label><div className="field-control"><Icon name="category" /><select id="event-category_id" name="category_id" value={values.category_id} disabled={locked || catalogLoading || Boolean(catalogError)} onChange={event => change('category_id', event.target.value)} required aria-invalid={Boolean(errors.category_id)} aria-describedby={errors.category_id ? 'event-category_id-error' : undefined}><option value="">{catalogLoading ? 'Cargando categorías…' : 'Elegí una categoría'}</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>{errors.category_id && <p id="event-category_id-error" className="field-error">{errors.category_id}</p>}</div>
      {catalogError && <div><StatusMessage title="Categorías no disponibles" tone="error">{catalogError}</StatusMessage><button type="button" className="secondary-button" onClick={retryCategories}>Reintentar categorías</button></div>}
      {!catalogLoading && !catalogError && !categories.length && <StatusMessage title="No hay categorías disponibles">Todavía no podés guardar. Volvé a intentar más tarde.</StatusMessage>}
      {field('capacity', 'Capacidad máxima', 'people', 'number', true, 'Cantidad de participantes')}
      {confirmedCount !== undefined && <p className="field-hint" role="status">Inscriptos confirmados: {confirmedCount}. El cupo se verifica nuevamente al guardar.</p>}
  </>
}
