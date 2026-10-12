import { supabase } from '../../lib/supabase'
import { loadEvent, type EventRecord } from './api'
import { argentinaNow, emptyEvent, type EventValues } from './validation'

export type EventAction = 'cancel' | 'archive' | 'duplicate'
export const actionLabels = { cancel: 'Cancelar evento', archive: 'Archivar evento', duplicate: 'Duplicar evento' } as const
export type ManagedEvent = { id: string; title: string; event_state: 'open' | 'ended' | 'cancelled' | 'archived' }
export function managedEvent(event: EventRecord): ManagedEvent {
  return { id: event.id, title: event.title, event_state: event.archived_at ? 'archived' : event.cancelled_at ? 'cancelled' : event.ends_at <= argentinaNow() ? 'ended' : 'open' }
}
export class EventActionError extends Error {
  uncertain: boolean
  constructor(message: string, uncertain = false) { super(message); this.uncertain = uncertain }
}
function actionMessage(code: string, message: string) {
  if (code === '42501' || /^PGRST30[13]$/.test(code)) return 'No tenés permiso para gestionar este evento. Comprobá tu sesión.'
  if (code === 'PGRST202') return 'Esta operación todavía no está disponible. Reintentá más tarde.'
  if (message.includes('event_ended')) return 'El evento ya finalizó. Podés archivarlo o duplicarlo.'
  if (message.includes('event_archived')) return 'El evento ya está archivado.'
  return 'No pudimos completar la operación. Revisá la conexión y reintentá.'
}
export async function checkEventAction(id: string, action: 'cancel' | 'archive') {
  const event = await loadEvent(id)
  return Boolean(event && (action === 'archive' ? event.archived_at : event.cancelled_at))
}
export async function closeEvent(id: string, action: 'cancel' | 'archive') {
  if (!supabase) throw new EventActionError('La conexión no está configurada.')
  try {
    const { data, error } = await supabase.rpc(action === 'cancel' ? 'cancel_event' : 'archive_event', { p_event_id: id })
    if (error) throw new EventActionError(actionMessage(error.code, error.message), !/^(22|23|40|42|P0001|PGRST202|PGRST30[13])/.test(error.code))
    if (data !== id) throw new EventActionError('No pudimos confirmar la operación.', true)
  } catch (failure) {
    const error = failure instanceof EventActionError ? failure : new EventActionError('No pudimos confirmar la operación.', true)
    if (error.uncertain) {
      try { if (await checkEventAction(id, action)) return } catch { /* Keep the attempt pending until a successful read. */ }
    }
    throw error
  }
}
export async function loadDuplicateSource(id: string): Promise<EventValues> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('El evento de origen no es válido.')
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_event_duplicate_source', { p_event_id: id })
  if (error) throw new Error(actionMessage(error.code, error.message))
  const source = data?.[0]
  if (!source) throw new Error('No encontramos el evento de origen o no tenés permiso para duplicarlo.')
  return { ...emptyEvent, title: source.title, description: source.description, category_id: source.category_id, location_name: source.location_name ?? '', address: source.address, latitude: String(source.latitude), longitude: String(source.longitude), capacity: String(source.capacity) }
}
