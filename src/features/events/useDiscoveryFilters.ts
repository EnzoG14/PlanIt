import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filtersFromParams, filtersToSearch, hasActiveFilters, normalizeFilters, rememberFilters, rememberedFilters, type DiscoveryFilters } from './search'

// Filters live in the URL (q, categories) so Inicio and Mapa share them and
// event details can return to the same result set.
export function useDiscoveryFilters() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const filters = filtersFromParams(params)
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const stored = rememberedFilters()
    if (!key && hasActiveFilters(stored)) setParams(filtersToSearch(stored).slice(1), { replace: true })
  }, [key, setParams])
  useEffect(() => { if (seeded.current) rememberFilters(filtersFromParams(new URLSearchParams(key))) }, [key])
  const apply = (next: DiscoveryFilters) => setParams(filtersToSearch(normalizeFilters(next)).slice(1), { replace: true })
  return { filters, filtersKey: filtersToSearch(filters), search: filtersToSearch(filters), setFilters: apply }
}
