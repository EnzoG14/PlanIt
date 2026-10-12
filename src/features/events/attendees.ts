import { supabase } from '../../lib/supabase'

export type AttendeeStatus = 'confirmed' | 'removed'
export type Attendee = { participation_id: string; user_id: string; status: AttendeeStatus; display_name: string; username: string }
export type AttendeesPage = {
  title: string; capacity: number; confirmed_count: number; removed_count: number; pending_count?: number
  event_state: 'open' | 'ended' | 'cancelled' | 'archived'; has_more: boolean; attendees: Attendee[]
}
export const attendeesPageSize = 30
export async function loadAttendees(eventId: string, status: AttendeeStatus, search: string, offset = 0): Promise<AttendeesPage> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_attendees', { p_event_id: eventId, p_status: status, p_search: search, p_offset: offset })
  if (error) throw error
  if (!data || !Array.isArray(data.attendees)) throw new Error('invalid_attendees_response')
  return data as AttendeesPage
}
export async function removeAttendee(eventId: string, participationId: string): Promise<void> {
  if (!supabase) throw new Error('unconfigured')
  const { error } = await supabase.rpc('remove_participant', { p_event_id: eventId, p_participation_id: participationId })
  if (error) throw error
}
export function attendeesDenied(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '42501'
}
export function attendeesError(error: unknown): string {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === '42501') return 'Sólo el organizador puede administrar los asistentes. Comprobá tu sesión.'
  if (code === 'PGRST202') return 'La gestión de asistentes todavía no está habilitada en este entorno.'
  if (message === 'event_closed') return 'El evento ya finalizó, fue cancelado o archivado. No se pueden remover asistentes.'
  if (message === 'attendee_not_confirmed' || message === 'attendee_unavailable') return 'La inscripción cambió o ya no está disponible. Actualizá la lista.'
  return 'No pudimos confirmar la operación. Actualizá los datos antes de reintentar.'
}
