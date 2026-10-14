import { supabase } from '../../lib/supabase'

export type ParticipationStatus = 'confirmed' | 'cancelled' | 'removed'
export type ParticipationSummary = {
  confirmed_count: number; capacity: number; available_spots: number
  own_status: ParticipationStatus | null; is_organizer: boolean
  event_state: 'open' | 'ended' | 'cancelled' | 'archived'
}

export async function loadParticipationSummary(eventId: string, signal?: AbortSignal): Promise<ParticipationSummary> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const request = supabase.rpc('get_event_participation_summary', { p_event_id: eventId })
  const { data, error } = await (signal ? request.abortSignal(signal) : request)
  if (error) throw error
  if (!data?.[0]) throw new Error('event_unavailable')
  return data[0] as ParticipationSummary
}

export async function changeParticipation(eventId: string, action: 'register' | 'leave'): Promise<void> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { error } = await supabase.rpc(action === 'register' ? 'register_for_event' : 'leave_event', { p_event_id: eventId })
  if (error) throw error
}

export function participationError(error: unknown): string {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  const messages: Record<string, string> = {
    event_full: 'El evento está completo.', event_ended: 'El evento ya finalizó.',
    event_cancelled: 'El evento está cancelado o archivado.',
    organizer_cannot_register: 'Organizás este evento. No ocupás cupo ni podés inscribirte.',
    rejoin_requires_approval: 'Reingreso sujeto a aprobación.',
    event_unavailable: 'El evento no está disponible para tu cuenta.',
    authentication_required: 'Tu sesión venció. Volvé a iniciar sesión.',
    not_participating: 'No tenés una participación en este evento.',
  }
  return messages[message] ?? 'No pudimos confirmar la operación. Actualizá el estado antes de reintentar.'
}
