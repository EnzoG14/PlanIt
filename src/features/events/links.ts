import { supabase } from '../../lib/supabase'

export class EventLinkError extends Error {
  constructor(message: string) { super(message) }
}
export async function loadEventLinkStatus(eventId: string): Promise<boolean> {
  if (!supabase) throw new EventLinkError('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_event_link_status', { p_event_id: eventId })
  if (error || typeof data !== 'boolean') throw new EventLinkError('No pudimos comprobar el enlace. Actualizá antes de generar otro.')
  return data
}
export async function rotateEventLink(eventId: string): Promise<string> {
  if (!supabase) throw new EventLinkError('La conexión no está configurada.')
  try {
    const { data, error } = await supabase.rpc('create_or_rotate_event_link', { p_event_id: eventId })
    if (error) {
      if (error.message === 'event_link_closed') throw new EventLinkError('El evento terminó, fue cancelado o archivado. No admite nuevos enlaces.')
      if (error.code === '42501') throw new EventLinkError('No tenés permiso para gestionar el enlace. Comprobá tu sesión.')
      if (error.code === 'PGRST202') throw new EventLinkError('La gestión de enlaces todavía no está habilitada en este entorno.')
      throw new EventLinkError('No pudimos recibir el enlace. Si la operación se completó, sólo se guardó su hash. Regenerá para reemplazarlo.')
    }
    if (typeof data !== 'string' || !/^[0-9a-f]{64}$/.test(data)) throw new EventLinkError('No pudimos recibir el enlace. Regenerá para reemplazarlo.')
    // Fragment only: never navigate to it here or save it in browser storage.
    const url = new URL('/invite', window.location.origin)
    url.hash = `token=${data}`
    return url.href
  } catch (error) {
    if (error instanceof EventLinkError) throw error
    throw new EventLinkError('No pudimos recibir el enlace. Regenerá para reemplazar cualquier intento anterior.')
  }
}
