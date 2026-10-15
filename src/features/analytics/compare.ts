import type { EventOccupancy } from './types'

export const MIN_COMPARE_EVENTS = 2
export const MAX_COMPARE_EVENTS = 10

export type ComparedEvent = Omit<EventOccupancy, 'as_of' | 'capacity_usable' | 'occupancy_percent'> & {
  occupancy_percent: number | null
  capacity_usable: boolean
}
export type EventsComparison = { as_of: string; events: ComparedEvent[] }

/** Unique ids in first-selected order; the caller decides what to do with the size. */
export function normalizeSelection(ids: readonly string[]): string[] {
  return [...new Set(ids)]
}

export function selectionProblem(ids: readonly string[]): string | null {
  if (ids.length < MIN_COMPARE_EVENTS) return `Elegí al menos ${MIN_COMPARE_EVENTS} eventos para comparar.`
  if (ids.length > MAX_COMPARE_EVENTS) return `Podés comparar hasta ${MAX_COMPARE_EVENTS} eventos a la vez.`
  return null
}

export function parseEventsComparison(value: unknown, requestedIds: readonly string[]): EventsComparison {
  const invalid = () => new Error('No pudimos leer la comparación de eventos.')
  if (!value || typeof value !== 'object') throw invalid()
  const v = value as Record<string, unknown>
  if (typeof v.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(v.as_of)
    || !Array.isArray(v.events) || v.events.length !== requestedIds.length) throw invalid()
  const events = v.events.map((item, index): ComparedEvent => {
    if (!item || typeof item !== 'object') throw invalid()
    const e = item as Record<string, unknown>
    if (e.event_id !== requestedIds[index] || typeof e.title !== 'string'
      || !['open', 'ended', 'cancelled', 'archived'].includes(String(e.event_state))
      || !Number.isSafeInteger(e.capacity) || !Number.isSafeInteger(e.confirmed_count) || (e.confirmed_count as number) < 0
      || !Number.isSafeInteger(e.available_spots) || typeof e.capacity_usable !== 'boolean') throw invalid()
    const capacity = e.capacity as number, confirmed = e.confirmed_count as number
    if (e.capacity_usable !== capacity > 0) throw invalid()
    if (e.capacity_usable) {
      if (typeof e.occupancy_percent !== 'number' || !Number.isFinite(e.occupancy_percent)
        || e.available_spots !== Math.max(capacity - confirmed, 0)
        || Math.abs(e.occupancy_percent - 100 * confirmed / capacity) > 1e-9) throw invalid()
    } else if (e.occupancy_percent !== null) throw invalid()
    return {
      event_id: e.event_id, title: e.title, event_state: e.event_state as EventOccupancy['event_state'],
      capacity, confirmed_count: confirmed, available_spots: e.available_spots as number,
      occupancy_percent: e.occupancy_percent as number | null, capacity_usable: e.capacity_usable,
    }
  })
  return { as_of: v.as_of, events }
}
