import type { ParticipationSeries } from './periods'

export const MAX_EXPORT_BYTES = 10 * 1024 * 1024
export const MAX_EXPORT_ROWS = 5000
export type AttendeeExport = {
  version: 1; event_id: string; event_title: string; as_of: string
  rows: { username: string; display_name: string; status: 'confirmed'; first_registered_at: string | null }[]
}
const timestamp = (v: unknown): v is string => typeof v === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/.test(v)
  && Number.isFinite(Date.parse(`${v}Z`))
const keys = (v: object, expected: string[]) => Object.keys(v).sort().join() === [...expected].sort().join()
export function checkExportSize(value: string) {
  if (new TextEncoder().encode(value).byteLength > MAX_EXPORT_BYTES) throw new Error('El reporte supera el límite de 10 MiB. No se descargó ningún archivo.')
}
export function parseAttendeeExport(value: unknown, eventId: string): AttendeeExport {
  const invalid = () => new Error('No pudimos verificar el reporte de asistentes. Volvé a intentar.')
  if (!value || typeof value !== 'object') throw invalid()
  const v = value as AttendeeExport
  if (!keys(v, ['version', 'event_id', 'event_title', 'as_of', 'rows']) || v.version !== 1
    || v.event_id !== eventId || typeof v.event_title !== 'string' || !timestamp(v.as_of)
    || !Array.isArray(v.rows) || v.rows.length > MAX_EXPORT_ROWS) throw invalid()
  checkExportSize(JSON.stringify(v))
  const rows = v.rows.map(row => {
    if (!row || typeof row !== 'object' || !keys(row, ['username', 'display_name', 'status', 'first_registered_at'])
      || typeof row.username !== 'string' || typeof row.display_name !== 'string' || row.status !== 'confirmed'
      || (row.first_registered_at !== null && !timestamp(row.first_registered_at))) throw invalid()
    return { username: row.username, display_name: row.display_name, status: row.status, first_registered_at: row.first_registered_at }
  })
  return { version: 1, event_id: eventId, event_title: v.event_title, as_of: v.as_of, rows }
}
// Reversible: duplicate an original leading apostrophe; otherwise prefix one
// before formula-like text (including whitespace, control and format prefixes).
export function neutralizeCsvText(value: string): string {
  return value.startsWith("'") || /^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(value) ? `'${value}` : value
}
export function serializeCsv(headers: readonly string[], rows: readonly (readonly (string | number | null)[])[]): string {
  const quote = (value: string | number | null) => {
    if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) throw new Error('El reporte contiene cantidades inválidas.')
    const text = typeof value === 'string' ? neutralizeCsvText(value) : value === null ? '' : String(value)
    return `"${text.replaceAll('"', '""')}"`
  }
  if (rows.some(row => row.length !== headers.length)) throw new Error('El reporte contiene columnas inválidas.')
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(quote).join(';')).join('\r\n') + '\r\n'
  checkExportSize(csv)
  return csv
}
export function attendeesCsv(data: AttendeeExport): string | null {
  if (!data.rows.length) return null
  return serializeCsv(['evento', 'username', 'nombre_visible', 'estado', 'fecha_primera_inscripcion'],
    data.rows.map(r => [data.event_title, r.username, r.display_name, r.status, r.first_registered_at]))
}
export function statisticsCsv(title: string, data: ParticipationSeries): string | null {
  if (!data.points.some(p => p.new_confirmations + p.reconfirmations + p.departures > 0)) return null
  return serializeCsv(['evento', 'desde', 'hasta', 'granularidad', 'inicio_periodo', 'inscripciones_nuevas', 'reincorporaciones', 'bajas'],
    data.points.map(p => [title, data.from, data.to, data.bucket, p.bucket_start, p.new_confirmations, p.reconfirmations, p.departures]))
}
