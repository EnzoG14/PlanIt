import { supabase } from '../../lib/supabase'
import { parseEventOccupancy, type EventOccupancy } from './types'
import { parseEventDemographics } from './demographics'
import { parseParticipationSeries, type Period } from './periods'

export async function loadMyEventSeries(eventId: string, period: Period, signal: AbortSignal) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_event_participation_series', {
    p_event_id: eventId, p_from: period.from, p_to: period.to, p_bucket: period.bucket,
  }).abortSignal(signal)
  if (error) throw new Error(error.code === '42501' ? 'No tenés acceso a las estadísticas de este evento.'
    : error.code === '22023' ? 'Elegí un intervalo válido de hasta 366 días.'
      : 'No pudimos cargar los movimientos. Volvé a intentar.')
  return parseParticipationSeries(data, eventId, period)
}

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
