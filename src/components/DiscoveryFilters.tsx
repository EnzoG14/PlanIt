import { useEffect, useRef, useState } from 'react'
import { loadCategories } from '../features/events/api'
import { hasActiveFilters, searchQueryMaxLength, type DiscoveryFilters } from '../features/events/search'
import type { Category } from '../features/events/validation'
import { FormField } from './FormField'
import { Icon } from './Icon'

export function DiscoveryFilters({ filters, onChange, idPrefix }: { filters: DiscoveryFilters; onChange: (next: DiscoveryFilters) => void; idPrefix: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [text, setText] = useState(filters.q)
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
  useEffect(() => {
    if (text.trim() === latest.current.q) return
    const timer = window.setTimeout(() => change.current({ ...latest.current, q: text }), 300)
    return () => window.clearTimeout(timer)
  }, [text])
  const toggle = (id: string) => onChange({ ...filters, categoryIds: filters.categoryIds.includes(id) ? filters.categoryIds.filter(value => value !== id) : [...filters.categoryIds, id] })
  const active = hasActiveFilters(filters)
  const selectedNames = filters.categoryIds.map(id => categories.find(category => category.id === id)?.name).filter(Boolean)
  return <section className="discovery-filters" aria-label="Buscar y filtrar eventos">
    <FormField id={`${idPrefix}-search`} label="Buscar eventos" icon="search" type="search" inputRef={input} value={text} maxLength={searchQueryMaxLength}
      placeholder="Nombre o descripción" autoComplete="off" enterKeyHint="search"
      onChange={event => setText(event.target.value)}
      trailing={text ? <button type="button" className="password-toggle" aria-label="Borrar búsqueda" onClick={() => { setText(''); onChange({ ...filters, q: '' }); input.current?.focus() }}><Icon name="close" /></button> : undefined} />
    <div role="group" aria-label="Categorías" className="discovery-category-filters">
      {categories.map(category => <button key={category.id} type="button" aria-pressed={filters.categoryIds.includes(category.id)} onClick={() => toggle(category.id)}>{category.name}</button>)}
    </div>
    {categoryError && <p className="field-hint" role="status">No pudimos cargar las categorías. <button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></p>}
    {active && <div className="discovery-applied">
      <p role="status">Filtros aplicados: {[filters.q && `“${filters.q}”`, ...selectedNames].filter(Boolean).join(' · ') || 'categorías seleccionadas'}</p>
      <button type="button" className="text-button" onClick={() => { setText(''); onChange({ q: '', categoryIds: [] }) }}>Limpiar filtros</button>
    </div>}
  </section>
}
