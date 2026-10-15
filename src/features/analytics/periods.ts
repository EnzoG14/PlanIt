export type Bucket = 'day' | 'week'
export type Period = { from: string; to: string; bucket: Bucket }
export type SeriesPoint = { bucket_start: string; new_confirmations: number; reconfirmations: number; departures: number }
export type ParticipationSeries = Period & { event_id: string; as_of: string; points: SeriesPoint[] }
const dayMs = 86400000

// UTC is only calendar arithmetic here; values sent to SQL have no UTC suffix.
export function dateNumber(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const n = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n : NaN
}
export function addDays(value: string, days: number) {
  return new Date(dateNumber(value) + days * dayMs).toISOString().slice(0, 10)
}
export function argentinaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-')
}
export function presetPeriod(days: number, today = argentinaToday(), bucket: Bucket = 'day'): Period {
  return periodFromDates(addDays(today, 1 - days), today, bucket)
}
export function periodFromDates(start: string, end: string, bucket: Bucket): Period {
  const from = dateNumber(start), to = dateNumber(end)
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Completá ambas fechas con valores válidos.')
  if (from > to) throw new Error('La fecha inicial no puede ser posterior a la final.')
  if ((to - from) / dayMs >= 366) throw new Error('Elegí un intervalo de hasta 366 días.')
  if (end >= '9999-12-31' || start < '0001-01-01' || !['day', 'week'].includes(bucket)) throw new Error('Elegí un intervalo válido.')
  return { from: `${start}T00:00:00`, to: `${addDays(end, 1)}T00:00:00`, bucket }
}
export function bucketStarts(period: Period) {
  let n = dateNumber(period.from.slice(0, 10))
  if (period.bucket === 'week') n -= ((new Date(n).getUTCDay() + 6) % 7) * dayMs
  const result: string[] = []
  for (; n < dateNumber(period.to.slice(0, 10)); n += (period.bucket === 'day' ? 1 : 7) * dayMs) result.push(new Date(n).toISOString().slice(0, 19))
  return result
}
export function parseParticipationSeries(value: unknown, eventId: string, period: Period): ParticipationSeries {
  const invalid = () => new Error('No pudimos leer los movimientos del período.')
  if (!value || typeof value !== 'object') throw invalid()
  const v = value as Record<string, unknown>
  const keys = (o: object, expected: string[]) => Object.keys(o).sort().join() === expected.sort().join()
  if (!keys(v, ['event_id', 'from', 'to', 'bucket', 'as_of', 'points'])
    || v.event_id !== eventId || v.from !== period.from || v.to !== period.to || v.bucket !== period.bucket
    || typeof v.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(v.as_of)
    || !Array.isArray(v.points)) throw invalid()
  const starts = bucketStarts(period)
  if (v.points.length !== starts.length || starts.length > (period.bucket === 'day' ? 366 : 54)) throw invalid()
  const points = v.points.map((p: unknown, index: number) => {
    if (!p || typeof p !== 'object' || !keys(p, ['bucket_start', 'new_confirmations', 'reconfirmations', 'departures'])) throw invalid()
    const point = p as SeriesPoint
    if (point.bucket_start !== starts[index] || ![point.new_confirmations, point.reconfirmations, point.departures].every(n => Number.isSafeInteger(n) && n >= 0)) throw invalid()
    return { bucket_start: point.bucket_start, new_confirmations: point.new_confirmations, reconfirmations: point.reconfirmations, departures: point.departures }
  })
  return { ...period, event_id: eventId, as_of: v.as_of, points }
}
