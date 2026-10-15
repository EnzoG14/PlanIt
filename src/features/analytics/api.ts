import { supabase } from '../../lib/supabase'
import { parseEventOccupancy, type EventOccupancy } from './types'
import { parseEventDemographics } from './demographics'
import { parseParticipationSeries, type Period } from './periods'
import { parseAttendeeExport } from './csv'
import { MAX_COMPARE_EVENTS, MIN_COMPARE_EVENTS, parseEventsComparison } from './compare'

export async function loadMyEventExport(eventId: string, signal: AbortSignal) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_event_export_rows', { p_event_id: eventId }).abortSignal(signal)
  if (error) throw new Error(error.code === '42501' ? 'No tenés acceso al reporte de este evento.'
    : error.code === '54000' ? 'El reporte supera el límite de 5.000 asistentes o 10 MiB. No se descargó ningún archivo.'
      : 'No pudimos preparar el reporte. Volvé a intentar.')
  return parseAttendeeExport(data, eventId)
}

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

export async function loadMyEventsComparison(eventIds: string[], signal: AbortSignal) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_events_occupancy', { p_event_ids: eventIds }).abortSignal(signal)
  if (error) throw new Error(error.code === '42501' ? 'No pudimos comparar esa selección. Revisá que sean eventos tuyos.'
    : error.code === '22023' ? `Elegí entre ${MIN_COMPARE_EVENTS} y ${MAX_COMPARE_EVENTS} eventos distintos.`
      : 'No pudimos cargar la comparación. Volvé a intentar.')
  return parseEventsComparison(data, eventIds)
}

export async function loadMyEventOccupancy(eventId: string, signal: AbortSignal): Promise<EventOccupancy> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_event_occupancy', { p_event_id: eventId }).abortSignal(signal)
  if (error) throw new Error(error.code === '42501'
    ? 'No tenés acceso a las estadísticas de este evento.'
    : 'No pudimos cargar la ocupación. Volvé a intentar.')
  return parseEventOccupancy(data)
}
