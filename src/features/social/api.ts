import { supabase } from '../../lib/supabase'

export type SocialIdentity = { display_name: string; username: string; avatar: string | null }
export type SocialParticipant = SocialIdentity & { user_id: string }
export type SocialParticipants = { participants: SocialParticipant[]; next_cursor: string | null }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isSocialId(value: unknown): value is string { return typeof value === 'string' && uuid.test(value) }
function identity(value: unknown): SocialIdentity {
  if (!value || typeof value !== 'object') throw new Error('invalid_social_response')
  const row = value as Record<string, unknown>
  if (typeof row.display_name !== 'string' || typeof row.username !== 'string' || (row.avatar !== null && !isSocialId(row.avatar))) throw new Error('invalid_social_response')
  // Explicit allowlist: never put an entire backend profile in React state.
  return { display_name: row.display_name, username: row.username, avatar: row.avatar as string | null }
}
export async function loadSocialParticipants(eventId: string, after: string | null, signal: AbortSignal): Promise<SocialParticipants> {
  if (!supabase || !isSocialId(eventId)) throw new Error('participants_unavailable')
  const { data, error } = await supabase.rpc('get_event_social_participants', { p_event_id: eventId, p_after_user_id: after, p_limit: 30 }).abortSignal(signal)
  if (error) throw error
  if (!data || !Array.isArray(data.participants) || (data.next_cursor !== null && !isSocialId(data.next_cursor))) throw new Error('invalid_social_response')
  const participants = data.participants.map((value: unknown) => {
    const row = value as Record<string, unknown>
    if (!row || !isSocialId(row.user_id)) throw new Error('invalid_social_response')
    return { ...identity(row), user_id: row.user_id }
  })
  return { participants, next_cursor: data.next_cursor }
}
export async function loadSocialIdentity(userId: string, signal: AbortSignal): Promise<SocialIdentity | null> {
  if (!supabase || !isSocialId(userId)) return null
  const { data, error } = await supabase.rpc('get_social_profile', { p_user_id: userId }).abortSignal(signal)
  if (error) throw error
  return data?.unavailable === true ? null : identity(data)
}
export async function loadSocialAvatar(userId: string, signal: AbortSignal): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.functions.invoke('social-avatar', { body: { user_id: userId }, signal })
  if (error) throw error
  if (data?.signed_url === null) return null
  const prefix = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/sign/avatars/`
  if (data?.expires_in !== 60 || typeof data.signed_url !== 'string' || !data.signed_url.startsWith(prefix)) throw new Error('invalid_avatar_response')
  return data.signed_url
}
export function socialDenied(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === '42501'
}
export function socialError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST202') return 'La consulta social todavía no está habilitada en este entorno.'
  return 'No pudimos consultar los datos. Revisá tu conexión y reintentá.'
}
export function participantsReturn(value: unknown): string | null {
  return typeof value === 'string' && /^\/events\/[0-9a-f-]{36}\/attendees\?view=social$/i.test(value) && isSocialId(value.split('/')[2]) ? value : null
}
