export type EventIntegrationV1 = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  location_name: string | null
  address: string
  visibility: 'public' | 'unlisted'
  state: 'open' | 'ended' | 'cancelled' | 'archived'
}

export const calendarTimeZone = 'America/Argentina/Buenos_Aires'
export const calendarMimeType = 'text/calendar;charset=utf-8'
const invalid = () => new Error('Los datos del evento no permiten generar el calendario. Actualizá el detalle y reintentá.')

/** Project timestamps are Argentina wall-clock values, never device-local dates. */
export function calendarInstant(value: string): Date {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(value)
  if (!match || match[1].startsWith('0000')) throw invalid()
  const local = `${match[1]}T${match[2]}`
  const wallClock = new Date(`${local}Z`)
  if (!Number.isFinite(wallClock.getTime()) || wallClock.toISOString().slice(0, 19) !== local) throw invalid()
  // Same explicit -03:00 convention as formatEventTime; fractional seconds are
  // omitted because RFC 5545 DATE-TIME has second precision.
  const instant = new Date(`${local}-03:00`)
  if (instant.getUTCFullYear() > 9999) throw invalid()
  return instant
}

function stamp(value: Date): string {
  if (!Number.isFinite(value.getTime()) || value.getUTCFullYear() < 1 || value.getUTCFullYear() > 9999) throw invalid()
  return value.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
}

function calendarData(event: EventIntegrationV1) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id)
    || !event.title.trim() || !['public', 'unlisted'].includes(event.visibility)) throw invalid()
  const start = calendarInstant(event.starts_at), end = calendarInstant(event.ends_at)
  if (end.getTime() <= start.getTime()) throw invalid()
  const location = [...new Set([event.location_name?.trim(), event.address.trim()].filter(Boolean))].join(' · ')
  return { start: stamp(start), end: stamp(end), title: event.title, location }
}

function escapeText(value: string): string {
  return [...value].filter(character => { const code = character.codePointAt(0)!; return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127) }).join('').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

/** Fold physical lines at 75 UTF-8 octets, counting the continuation space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  let result = '', bytes = 0
  for (const character of line) {
    const length = encoder.encode(character).length
    if (bytes + length > 75) { result += '\r\n '; bytes = 1 }
    result += character; bytes += length
  }
  return result
}

/** Pure snapshot export: deliberately no description, links, people or tokens. */
export function createEventCalendar(event: EventIntegrationV1, now = new Date()): string {
  const data = calendarData(event)
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PlanIt//Event Calendar//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${event.id.toLowerCase()}@planit.invalid`, `DTSTAMP:${stamp(now)}`,
    `DTSTART:${data.start}`, `DTEND:${data.end}`, `SUMMARY:${escapeText(data.title)}`]
  if (data.location) lines.push(`LOCATION:${escapeText(data.location)}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

export function eventGoogleCalendarUrl(event: EventIntegrationV1): string {
  const data = calendarData(event)
  const url = new URL('https://calendar.google.com/calendar/r/eventedit')
  url.search = new URLSearchParams({ action: 'TEMPLATE', dates: `${data.start}/${data.end}`,
    stz: calendarTimeZone, etz: calendarTimeZone, text: data.title, ...(data.location ? { location: data.location } : {}) }).toString()
  return url.href
}

export function downloadEventCalendar(event: EventIntegrationV1): void {
  const content = createEventCalendar(event)
  const url = URL.createObjectURL(new Blob([content], { type: calendarMimeType }))
  const link = document.createElement('a')
  try {
    link.href = url; link.download = `planit-${event.id.toLowerCase()}.ics`
    document.body.append(link); link.click()
  } finally {
    link.remove()
    // Delay revocation so browsers can consume the download before release.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

