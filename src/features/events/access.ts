import { supabase } from '../../lib/supabase'

export type AccessStatus = 'active' | 'revoked'
export type AccessGrant = { id: string; user_id: string; username: string; display_name: string; avatar_url: string | null; status: AccessStatus; is_confirmed: boolean }
export type AccessPage = { title: string; event_state: 'open' | 'ended' | 'cancelled' | 'archived'; grants: AccessGrant[]; next_cursor: string | null }
export async function loadAccessGrants(eventId: string, status: AccessStatus, cursor: string | null = null): Promise<AccessPage> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_access_grants', { p_event_id: eventId, p_status: status, p_after_id: cursor, p_limit: 30 })
  if (error) throw error
  if (!data || !Array.isArray(data.grants)) throw new Error('invalid_access_response')
  return data as AccessPage
}
export async function changeEventAccess(eventId: string, userId: string, target: AccessStatus): Promise<void> {
  if (!supabase) throw new Error('unconfigured')
  const { error } = await supabase.rpc(target === 'revoked' ? 'revoke_event_access' : 'restore_event_access', { p_event_id: eventId, p_user_id: userId })
  if (error) throw error
}
// An uncertain write is reconciled through the owner-only list before retrying.
export async function hasAccessState(eventId: string, userId: string, status: AccessStatus): Promise<boolean> {
  let cursor: string | null = null
  do {
    const page = await loadAccessGrants(eventId, status, cursor)
    if (page.grants.some(row => row.user_id === userId)) return true
    cursor = page.next_cursor
  } while (cursor)
  return false
}
export function accessUnavailable(error: unknown): boolean {
  return typeof error === 'object' && error !== null && ('code' in error && error.code === '42501' || 'message' in error && error.message === 'event_not_hidden')
}
export function accessError(error: unknown): string {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === '42501') return 'Sólo el organizador puede administrar estos accesos. Comprobá tu sesión.'
  if (code === 'PGRST202') return 'La gestión de accesos todavía no está habilitada en este entorno.'
  if (message === 'event_not_hidden') return 'Los accesos individuales se administran en eventos ocultos. Este evento ahora es público.'
  if (message === 'event_closed') return 'El evento ya finalizó, fue cancelado o archivado. Los accesos son de sólo lectura.'
  if (message === 'access_grant_missing') return 'Esta persona no tiene un permiso registrado. Debe canjear una nueva invitación.'
  return 'No pudimos confirmar la operación. Comprobá el estado antes de reintentar.'
}
