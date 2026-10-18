const zone = 'America/Argentina/Buenos_Aires'
const clock = new Intl.DateTimeFormat('es-AR', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const calendar = new Intl.DateTimeFormat('es-AR', { timeZone: zone, day: 'numeric', month: 'long', year: 'numeric' })

// App timestamps are Argentina wall-clock values, without a stored time zone.
export function chatDay(value: string): string { return value.slice(0, 10) }
export function isChatContinuation(current: { sender_id: string; created_at: string }, previous?: { sender_id: string; created_at: string }): boolean {
  return !!previous && current.sender_id === previous.sender_id && chatDay(current.created_at) === chatDay(previous.created_at)
}
export function chatTime(value: string): string { return clock.format(new Date(`${value}-03:00`)) }
export function argentinaDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(value => value.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function chatDayLabel(day: string, today: string): string {
  if (day === today) return 'Hoy'
  const yesterday = new Date(`${today}T12:00:00-03:00`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  if (day === argentinaDay(yesterday)) return 'Ayer'
  return calendar.format(new Date(`${day}T12:00:00-03:00`))
}
