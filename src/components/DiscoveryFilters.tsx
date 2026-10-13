import { useEffect, useId, useRef, useState } from 'react'
import { loadCategories } from '../features/events/api'
import { dateRangeError, emptyFilters, hasActiveFilters, radiusOptions, searchQueryMaxLength, type DiscoveryFilters } from '../features/events/search'
import { originLabel, type useSearchOrigin } from '../features/location/origin'
import type { Category } from '../features/events/validation'
import { FormField } from './FormField'
import { Icon } from './Icon'

export type OriginInfo = ReturnType<typeof useSearchOrigin>
const formatDay = (day: string) => day.split('-').reverse().join('/')

export function DiscoveryFilters({ filters, onChange, idPrefix, origin }: { filters: DiscoveryFilters; onChange: (next: DiscoveryFilters) => void; idPrefix: string; origin: OriginInfo }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [text, setText] = useState(filters.q)
  const [from, setFrom] = useState(filters.dateFrom)
  const [to, setTo] = useState(filters.dateTo)
  const [manualOpen, setManualOpen] = useState<boolean | null>(null)
  const panelId = useId()
  const input = useRef<HTMLInputElement>(null)
  const latest = useRef(filters)
  const change = useRef(onChange)
  useEffect(() => { latest.current = filters; change.current = onChange })
  useEffect(() => {
    let active = true
    loadCategories().then(rows => { if (active) { setCategories(rows); setCategoryError(false) } }).catch(() => { if (active) setCategoryError(true) })
    return () => { active = false }
  }, [attempt])
  useEffect(() => { setText(current => current.trim() === filters.q ? current : filters.q) }, [filters.q])
  const [syncedDates, setSyncedDates] = useState({ from: filters.dateFrom, to: filters.dateTo })
  if (syncedDates.from !== filters.dateFrom || syncedDates.to !== filters.dateTo) {
    setSyncedDates({ from: filters.dateFrom, to: filters.dateTo }); setFrom(filters.dateFrom); setTo(filters.dateTo)
  }
  useEffect(() => {
    if (text.trim() === latest.current.q) return
    const timer = window.setTimeout(() => change.current({ ...latest.current, q: text }), 300)
    return () => window.clearTimeout(timer)
  }, [text])
  const toggle = (id: string) => onChange({ ...filters, categoryIds: filters.categoryIds.includes(id) ? filters.categoryIds.filter(value => value !== id) : [...filters.categoryIds, id] })
  // An invalid draft stays visible with its error and never reaches the URL or the query.
  const rangeError = dateRangeError(from, to)
  function setDates(nextFrom: string, nextTo: string) {
    setFrom(nextFrom); setTo(nextTo)
    if (!dateRangeError(nextFrom, nextTo)) onChange({ ...filters, dateFrom: nextFrom, dateTo: nextTo })
  }
  const active = hasActiveFilters(filters)
  const selectedNames = filters.categoryIds.map(id => categories.find(category => category.id === id)?.name).filter(Boolean)
  const dateSummary = filters.dateFrom ? (filters.dateTo && filters.dateTo !== filters.dateFrom ? `${formatDay(filters.dateFrom)} al ${formatDay(filters.dateTo)}` : formatDay(filters.dateFrom)) : ''
  const radiusSummary = filters.radiusKm ? `hasta ${filters.radiusKm} km${origin.origin ? ` desde ${originLabel(origin)}` : ''}` : ''
  const extraCount = (filters.dateFrom ? 1 : 0) + (filters.radiusKm ? 1 : 0)
  const open = manualOpen ?? extraCount > 0
  return <section className="discovery-filters" aria-label="Buscar y filtrar eventos">
    <FormField id={`${idPrefix}-search`} label="Buscar eventos" icon="search" type="search" inputRef={input} value={text} maxLength={searchQueryMaxLength}
      placeholder="Nombre o descripción" autoComplete="off" enterKeyHint="search"
      onChange={event => setText(event.target.value)}
      trailing={text ? <button type="button" className="password-toggle" aria-label="Borrar búsqueda" onClick={() => { setText(''); onChange({ ...filters, q: '' }); input.current?.focus() }}><Icon name="close" /></button> : undefined} />
    <div role="group" aria-label="Categorías" className="discovery-category-filters">
      {categories.map(category => <button key={category.id} type="button" aria-pressed={filters.categoryIds.includes(category.id)} onClick={() => toggle(category.id)}>{category.name}</button>)}
    </div>
    {categoryError && <p className="field-hint" role="status">No pudimos cargar las categorías. <button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></p>}
    <button type="button" className="secondary-button discovery-more-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setManualOpen(!open)}>
      <Icon name="calendar" />Fecha y distancia{extraCount > 0 && <span className="discovery-count"> · {extraCount} activo{extraCount > 1 ? 's' : ''}</span>}
    </button>
    <div id={panelId} className="discovery-date-radius" hidden={!open}>
      <div className="discovery-dates">
        <FormField id={`${idPrefix}-from`} label="Fecha o inicio del rango" icon="calendar" type="date" value={from} min="2000-01-01" max="2100-12-31"
          onChange={event => setDates(event.target.value, to)} />
        <FormField id={`${idPrefix}-to`} label="Hasta (opcional)" icon="calendar" type="date" value={to} min={from || '2000-01-01'} max="2100-12-31" disabled={!from}
          error={rangeError ?? undefined} onChange={event => setDates(from, event.target.value)} />
      </div>
      <p className="field-hint">Con una sola fecha se muestra ese día completo (hora de Argentina), según cuándo empieza el evento.</p>
      {(from || to) && <button type="button" className="text-button" onClick={() => { setFrom(''); setTo(''); onChange({ ...filters, dateFrom: '', dateTo: '' }) }}>Quitar fechas</button>}
      <div role="group" aria-label="Radio de búsqueda" className="discovery-category-filters discovery-radius">
        <button type="button" aria-pressed={filters.radiusKm === null} onClick={() => onChange({ ...filters, radiusKm: null })}>Sin límite</button>
        {radiusOptions.map(km => <button key={km} type="button" aria-pressed={filters.radiusKm === km} onClick={() => onChange({ ...filters, radiusKm: km })}>{km} km</button>)}
      </div>
      {filters.radiusKm !== null && <div className="discovery-origin" role="status">
        {origin.locating ? <p>Buscando tu ubicación…</p> : origin.origin ? <p>Distancia desde: <strong>{originLabel(origin)}</strong>.{origin.origin.kind === 'map' && !origin.initialCenter && ' Se actualiza al mover el mapa.'}</p>
          : <p>No pudimos determinar un punto de referencia, así que no aplicamos la distancia. Permití tu ubicación o abrí el mapa para elegir un centro.</p>}
        {!origin.locating && origin.gpsError && origin.origin?.kind !== 'gps' && <p>{origin.gpsError}{origin.origin ? ' Usamos el centro del mapa como alternativa.' : ''}</p>}
        <div className="discovery-origin-actions">
          {!origin.locating && origin.origin?.kind !== 'gps' && <button type="button" className="text-button" onClick={() => void origin.locate()}>Usar mi ubicación</button>}
          {origin.origin?.kind === 'gps' && origin.hasMapCenter && <button type="button" className="text-button" onClick={origin.preferMapCenter}>Usar el centro del mapa</button>}
        </div>
      </div>}
    </div>
    {active && <div className="discovery-applied">
      <p role="status">Filtros aplicados: {[filters.q && `“${filters.q}”`, ...selectedNames, dateSummary && `fecha ${dateSummary}`, radiusSummary].filter(Boolean).join(' · ') || 'categorías seleccionadas'}</p>
      <button type="button" className="text-button" onClick={() => { setText(''); onChange(emptyFilters) }}>Limpiar filtros</button>
    </div>}
  </section>
}
