import { supabase } from '../../lib/supabase'
import { loadEvent, type EventRecord } from './api'
import { argentinaNow, argentinaTimestamp, type EventValues } from './validation'

export function isEventEditable(event: Pick<EventRecord, 'starts_at' | 'cancelled_at' | 'archived_at'>): boolean {
  return !event.cancelled_at && !event.archived_at && event.starts_at > argentinaNow()
}
export function eventValues(event: EventRecord): EventValues {
  return { title: event.title, description: event.description, start_date: event.starts_at.slice(0, 10), start_time: event.starts_at.slice(11, 16), end_date: event.ends_at.slice(0, 10), end_time: event.ends_at.slice(11, 16), category_id: event.category_id, capacity: String(event.capacity), location_name: event.location_name ?? '', address: event.address, latitude: String(event.latitude), longitude: String(event.longitude), visibility: event.visibility }
}
export function matchesEdit(event: EventRecord | null, values: EventValues): boolean {
  return Boolean(event && event.title === values.title.trim() && event.description === values.description.trim()
    && event.starts_at.replace(' ', 'T') === argentinaTimestamp(values.start_date, values.start_time)
    && event.ends_at.replace(' ', 'T') === argentinaTimestamp(values.end_date, values.end_time)
    && event.category_id === values.category_id && event.capacity === Number(values.capacity)
    && event.address === values.address.trim() && (event.location_name ?? '') === values.location_name.trim()
    && event.latitude === Number(values.latitude) && event.longitude === Number(values.longitude)
    && event.visibility === (values.visibility ?? 'public'))
}
export class EditError extends Error {
  uncertain: boolean
  constructor(message: string, uncertain = false) { super(message); this.uncertain = uncertain }
}
export function editMessage(code: string, message: string): string {
  const messages: Record<string, string> = {
    authentication_required: 'Tu sesión venció. Volvé a ingresar.',
    not_event_organizer: 'Sólo el organizador puede editar este evento.',
    event_unavailable: 'El evento no está disponible para tu cuenta.',
    event_not_editable: 'Sólo podés editar antes del inicio, sin cancelar ni archivar el evento.',
    start_not_future: 'Elegí una fecha y hora de inicio futuras, en horario de Argentina.',
    end_before_start: 'El fin debe ser posterior al inicio.',
    category_inactive: 'La categoría ya no está disponible. Elegí otra.',
    capacity_below_confirmed: 'El cupo no puede ser menor que los inscriptos confirmados. Actualizá el cupo y reintentá.',
    confirmed_access_revoked: 'Hay asistentes confirmados con acceso revocado. No se guardó ningún cambio. Resolvé sus permisos expresamente antes de ocultar el evento.',
  }
  if (messages[message]) return messages[message]
  if (code === 'PGRST202') return 'La edición todavía no está habilitada en este entorno.'
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST303') return 'No se pudo autorizar la edición. Comprobá tu sesión.'
  if (/^22|^23/.test(code)) return 'Revisá los datos: fechas, cupo, categoría y ubicación deben ser válidos.'
  return 'No pudimos guardar los cambios. Revisá la conexión y reintentá.'
}
export async function updateEvent(id: string, values: EventValues): Promise<void> {
  if (!supabase) throw new EditError('La conexión no está configurada.')
  try {
    const { data, error } = await supabase.rpc('update_event', {
      p_event_id: id, p_title: values.title.trim(), p_description: values.description.trim(),
      p_starts_at: argentinaTimestamp(values.start_date, values.start_time), p_ends_at: argentinaTimestamp(values.end_date, values.end_time),
      p_category_id: values.category_id, p_capacity: Number(values.capacity), p_address: values.address.trim(),
      p_latitude: Number(values.latitude), p_longitude: Number(values.longitude), p_location_name: values.location_name.trim() || null,
      p_visibility: values.visibility ?? 'public',
    })
    if (error) throw new EditError(editMessage(error.code, error.message), !/^(22|23|40|42|P0001|PGRST202|PGRST30[13])/.test(error.code))
    if (data !== id) throw new EditError('No pudimos confirmar el guardado.', true)
  } catch (error) {
    const failure = error instanceof EditError ? error : new EditError('No pudimos confirmar el guardado.', true)
    if (failure.uncertain) {
      try { if (matchesEdit(await loadEvent(id), values)) return } catch { /* Keep uncertain state until a successful read. */ }
    }
    throw failure
  }
}
