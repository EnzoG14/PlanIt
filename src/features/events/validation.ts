export type EventValues = {
  title: string; description: string; start_date: string; start_time: string
  end_date: string; end_time: string; category_id: string; capacity: string
  location_name: string; address: string; latitude: string; longitude: string
}
export type EventErrors = Partial<Record<keyof EventValues | 'images', string>>
export type Category = { id: string; name: string; is_active: boolean }
export const emptyEvent: EventValues = { title: '', description: '', start_date: '', start_time: '', end_date: '', end_time: '', category_id: '', capacity: '', location_name: '', address: '', latitude: '', longitude: '' }
export const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
export const maxImageBytes = 5 * 1024 * 1024

// Wall-clock values are always Argentina time, independent of the device zone.
export function argentinaTimestamp(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null
  const local = `${date}T${time}:00`
  const parsed = new Date(`${local}Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 19) !== local) return null
  return local
}
export function argentinaNow(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const value = (type: string) => parts.find(part => part.type === type)!.value
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}:${value('second')}`
}
// Native controls have minute precision. Advance to the first valid minute,
// including the date rollover at midnight; end must also follow start.
export function eventDateMinimums(values: EventValues, now = new Date()) {
  const afterMinute = (value: string) => new Date(Date.parse(`${value}Z`) + 60000).toISOString().slice(0, 16)
  const earliest = afterMinute(argentinaNow(now))
  const start = argentinaTimestamp(values.start_date, values.start_time)
  const end = start && afterMinute(start) > earliest ? afterMinute(start) : earliest
  return { start_date: earliest.slice(0, 10), start_time: values.start_date === earliest.slice(0, 10) ? earliest.slice(11) : undefined,
    end_date: end.slice(0, 10), end_time: values.end_date === end.slice(0, 10) ? end.slice(11) : undefined }
}
export function formatEventTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(`${value}-03:00`))
}
export function validateImages(files: Pick<File, 'type' | 'size'>[]): string | undefined {
  if (files.length > 10) return 'Podés agregar hasta 10 fotos.'
  if (files.some(file => !imageTypes.includes(file.type))) return 'Elegí fotos JPG, PNG o WebP.'
  if (files.some(file => file.size <= 0 || file.size > maxImageBytes)) return 'Cada foto debe pesar entre 1 byte y 5 MB.'
}
export function validateEvent(values: EventValues, categories: Category[], files: Pick<File, 'type' | 'size'>[], now = new Date()): EventErrors {
  const errors: EventErrors = {}
  if (![...values.title.trim()].length || [...values.title.trim()].length > 120) errors.title = 'Escribí un título de hasta 120 caracteres.'
  if (![...values.description.trim()].length || [...values.description.trim()].length > 3000) errors.description = 'Escribí una descripción de hasta 3000 caracteres.'
  const start = argentinaTimestamp(values.start_date, values.start_time)
  const end = argentinaTimestamp(values.end_date, values.end_time)
  if (!values.start_date || !argentinaTimestamp(values.start_date, '00:00')) errors.start_date = 'Elegí una fecha de inicio válida.'
  if (!start) errors.start_time = 'Elegí una hora de inicio válida.'
  else if (start <= argentinaNow(now)) errors.start_time = 'El inicio debe ser posterior a la hora actual de Argentina.'
  if (!values.end_date || !argentinaTimestamp(values.end_date, '00:00')) errors.end_date = 'Elegí una fecha de fin válida.'
  if (!end) errors.end_time = 'Elegí una hora de fin válida.'
  else if (start && end <= start) errors.end_time = 'El fin debe ser posterior al inicio.'
  if (!categories.some(category => category.id === values.category_id && category.is_active)) errors.category_id = 'Elegí una categoría disponible.'
  if (!/^\d+$/.test(values.capacity) || Number(values.capacity) < 1 || Number(values.capacity) > 2147483647) errors.capacity = 'Ingresá un cupo entero mayor que cero.'
  if (!values.address.trim()) errors.address = 'Ingresá la dirección del evento.'
  for (const [field, limit] of [['latitude', 90], ['longitude', 180]] as const) {
    const number = Number(values[field])
    if (!values[field].trim() || !Number.isFinite(number) || Math.abs(number) > limit) errors[field] = `Ingresá un valor entre −${limit} y ${limit}.`
  }
  const imageError = validateImages(files)
  if (imageError) errors.images = imageError
  return errors
}
