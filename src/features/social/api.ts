import { supabase } from '../../lib/supabase'

export type SocialIdentity = { display_name: string; username: string; avatar: string | null }
export type SocialProfile = SocialIdentity & ({ content: false } | { content: true; bio: string | null })
export type SocialEvent = { id: string; title: string; starts_at: string; ends_at: string; category_id: string; location_name: string | null }
export type SocialEventCursor = { starts_at: string; id: string }
export type SocialEvents = { events: SocialEvent[]; next_cursor: SocialEventCursor | null }
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
  const profile = await loadSocialProfile(userId, signal)
  return profile ? identity(profile) : null
}
export async function loadSocialProfile(userId: string, signal: AbortSignal): Promise<SocialProfile | null> {
  if (!isSocialId(userId)) return null
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_social_profile', { p_user_id: userId }).abortSignal(signal)
  if (error) throw error
  if (data?.unavailable === true) return null
  const minimal = identity(data)
  if (!Object.hasOwn(data, 'bio')) return { ...minimal, content: false }
  if (data.bio !== null && typeof data.bio !== 'string') throw new Error('invalid_social_response')
  return { ...minimal, content: true, bio: data.bio }
}
function socialTimestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/.test(value) && Number.isFinite(Date.parse(`${value}Z`))
}
export async function loadSocialEvents(userId: string, cursor: SocialEventCursor | null, signal: AbortSignal): Promise<SocialEvents> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  const { data, error } = await supabase.rpc('get_social_profile_events', {
    p_user_id: userId, p_before_starts_at: cursor?.starts_at ?? null, p_before_id: cursor?.id ?? null, p_limit: 30,
  }).abortSignal(signal)
  if (error) throw error
  if (!data || !Array.isArray(data.events) || data.events.length > 30) throw new Error('invalid_social_response')
  const events = data.events.map((row: Record<string, unknown>) => {
    if (!row || !isSocialId(row.id) || typeof row.title !== 'string' || !socialTimestamp(row.starts_at) || !socialTimestamp(row.ends_at) || !isSocialId(row.category_id) || (row.location_name !== null && typeof row.location_name !== 'string')) throw new Error('invalid_social_response')
    return { id: row.id, title: row.title, starts_at: row.starts_at, ends_at: row.ends_at, category_id: row.category_id, location_name: row.location_name as string | null }
  })
  const next = data.next_cursor
  if (next !== null && (!next || !socialTimestamp(next.starts_at) || !isSocialId(next.id))) throw new Error('invalid_social_response')
  const last = events.at(-1)
  if (next && (events.length !== 30 || last?.id !== next.id || last.starts_at !== next.starts_at)) throw new Error('invalid_social_response')
  return { events, next_cursor: next === null ? null : { starts_at: next.starts_at, id: next.id } }
}
export function socialProfileReturn(value: unknown): string | null {
  return typeof value === 'string' && /^\/users\/[0-9a-f-]{36}$/i.test(value) && isSocialId(value.split('/')[2]) ? value : null
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
