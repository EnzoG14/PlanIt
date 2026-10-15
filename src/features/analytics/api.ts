import { supabase } from '../../lib/supabase'
import { parseEventOccupancy, type EventOccupancy } from './types'
import { parseEventDemographics } from './demographics'

export async function loadMyEventDemographics(eventId: string, signal: AbortSignal) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_event_demographics', { p_event_id: eventId }).abortSignal(signal)
  if (error) throw new Error(error.code === '42501'
    ? 'No tenés acceso a las estadísticas de este evento.'
    : 'No pudimos cargar los datos demográficos. Volvé a intentar.')
  return parseEventDemographics(data)
}

export async function loadMyEventOccupancy(eventId: string, signal: AbortSignal): Promise<EventOccupancy> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_event_occupancy', { p_event_id: eventId }).abortSignal(signal)
  if (error) throw new Error(error.code === '42501'
    ? 'No tenés acceso a las estadísticas de este evento.'
    : 'No pudimos cargar la ocupación. Volvé a intentar.')
  return parseEventOccupancy(data)
}
