import { supabase } from '../../lib/supabase'

export type RejoinDecision = 'approved' | 'rejected'
export type RejoinStatus = {
  request_id: string | null; status: 'pending' | RejoinDecision | null
  requested_at: string | null; resolved_at: string | null; next_eligible_at: string | null; can_request: boolean
}
export type RejoinRequest = { request_id: string; participation_id: string; status: 'pending'; requested_at: string; display_name: string; username: string }
export type RejoinPage = { title: string; capacity: number; confirmed_count: number; pending_count: number; event_state: 'open' | 'ended' | 'cancelled' | 'archived'; has_more: boolean; requests: RejoinRequest[] }
export async function loadRejoinStatus(eventId: string): Promise<RejoinStatus> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_my_rejoin_status', { p_event_id: eventId })
  if (error) throw error
  if (!data || typeof data.can_request !== 'boolean') throw new Error('invalid_rejoin_response')
  return data as RejoinStatus
}
export async function requestRejoin(eventId: string): Promise<void> {
  if (!supabase) throw new Error('unconfigured')
  const { error } = await supabase.rpc('request_rejoin', { p_event_id: eventId })
  if (error) throw error
}
export async function loadRejoinRequests(eventId: string, offset = 0): Promise<RejoinPage> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_rejoin_requests', { p_event_id: eventId, p_offset: offset })
  if (error) throw error
  if (!data || !Array.isArray(data.requests)) throw new Error('invalid_rejoin_response')
  return data as RejoinPage
}
export async function resolveRejoin(eventId: string, requestId: string, decision: RejoinDecision): Promise<void> {
  if (!supabase) throw new Error('unconfigured')
  const { error } = await supabase.rpc('resolve_rejoin', { p_event_id: eventId, p_request_id: requestId, p_decision: decision })
  if (error) throw error
}
export async function loadRejoinResolution(eventId: string, requestId: string): Promise<'pending' | RejoinDecision> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_rejoin_resolution', { p_event_id: eventId, p_request_id: requestId })
  if (error) throw error
  if (!['pending', 'approved', 'rejected'].includes(data)) throw new Error('invalid_rejoin_response')
  return data
}
export function rejoinError(error: unknown): string {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === 'PGRST202') return 'Las solicitudes de reincorporación todavía no están habilitadas en este entorno.'
  if (code === '42501') return 'No tenés permiso para esta operación. Comprobá tu sesión y actualizá.'
  const messages: Record<string, string> = {
    event_full: 'No hay cupo disponible. La solicitud sigue pendiente y no reserva una plaza.',
    event_closed: 'El evento finalizó, fue cancelado o archivado. No admite solicitudes ni aprobaciones.',
    rejoin_already_pending: 'Ya tenés una solicitud pendiente.',
    rejoin_cooldown: 'Debés esperar siete días desde el rechazo. Actualizá para consultar la fecha habilitada.',
    rejoin_already_resolved: 'Esta solicitud ya fue resuelta. Actualizá la bandeja.',
    rejoin_not_removed: 'Sólo una participación removida puede solicitar reincorporación.',
    rejoin_unavailable: 'La solicitud no está disponible para este evento.',
  }
  return messages[message] ?? 'No pudimos confirmar la operación. Comprobá el estado antes de reintentar.'
}
