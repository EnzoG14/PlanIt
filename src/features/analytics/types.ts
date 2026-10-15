export type EventOccupancy = {
  event_id: string
  title: string
  event_state: 'open' | 'ended' | 'cancelled' | 'archived'
  /** Argentina wall time, without a UTC offset. */
  as_of: string
  capacity: number
  confirmed_count: number
  available_spots: number
  occupancy_percent: number | null
  capacity_usable: boolean
}

export function parseEventOccupancy(value: unknown): EventOccupancy {
  const invalid = () => new Error('No pudimos leer la ocupación del evento.')
  if (!value || typeof value !== 'object') throw invalid()
  const v = value as Record<string, unknown>
  if (typeof v.event_id !== 'string' || typeof v.title !== 'string'
    || !['open', 'ended', 'cancelled', 'archived'].includes(String(v.event_state))
    || typeof v.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(v.as_of)
    || !Number.isSafeInteger(v.capacity) || (v.capacity as number) <= 0
    || !Number.isSafeInteger(v.confirmed_count) || (v.confirmed_count as number) < 0
    || !Number.isSafeInteger(v.available_spots) || v.capacity_usable !== true
    || v.available_spots !== Math.max((v.capacity as number) - (v.confirmed_count as number), 0)
    || typeof v.occupancy_percent !== 'number' || !Number.isFinite(v.occupancy_percent)
    || Math.abs(v.occupancy_percent - 100 * (v.confirmed_count as number) / (v.capacity as number)) > 1e-9) throw invalid()
  return {
    event_id: v.event_id, title: v.title, event_state: v.event_state as EventOccupancy['event_state'],
    as_of: v.as_of, capacity: v.capacity as number, confirmed_count: v.confirmed_count as number,
    available_spots: v.available_spots as number, occupancy_percent: v.occupancy_percent, capacity_usable: true,
  }
}
