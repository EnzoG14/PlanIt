import { supabase } from '../../lib/supabase'
import { isSocialId, type SocialParticipant } from './api'

export type FollowStatus = 'pending' | 'accepted' | 'rejected' | null
export type SocialRelationship = { visibility: 'public' | 'private'; status: FollowStatus } | null
export type FollowDirection = 'followers' | 'following'
export type SocialCounts = { followers: number; following: number }
export type FollowPage = { users: SocialParticipant[]; next_cursor: string | null }
export async function loadSocialRelationship(userId: string, signal: AbortSignal): Promise<SocialRelationship> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  const { data, error } = await supabase.rpc('get_social_relationship', { p_user_id: userId }).abortSignal(signal)
  if (error) throw error
  if (data?.unavailable === true) return null
  if (!data || !['public', 'private'].includes(data.visibility) || (data.follow !== null && !['pending', 'accepted', 'rejected'].includes(data.follow?.status))) throw new Error('invalid_social_response')
  return { visibility: data.visibility, status: data.follow?.status ?? null }
}
export async function loadSocialCounts(userId: string, signal: AbortSignal): Promise<SocialCounts> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  const { data, error } = await supabase.rpc('get_social_counts', { p_user_id: userId }).abortSignal(signal)
  if (error) throw error
  if (!data || !Number.isSafeInteger(data.followers) || data.followers < 0 || !Number.isSafeInteger(data.following) || data.following < 0) throw new Error('invalid_social_response')
  return { followers: data.followers, following: data.following }
}
export async function loadSocialFollows(userId: string, direction: FollowDirection, after: string | null, signal: AbortSignal): Promise<FollowPage> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  const { data, error } = await supabase.rpc('list_social_follows', { p_user_id: userId, p_direction: direction, p_after_user_id: after, p_limit: 30 }).abortSignal(signal)
  if (error) throw error
  if (!data || !Array.isArray(data.users) || data.users.length > 30 || (data.next_cursor !== null && !isSocialId(data.next_cursor))) throw new Error('invalid_social_response')
  const users: SocialParticipant[] = data.users.map((row: Record<string, unknown>) => {
    if (!row || !isSocialId(row.user_id) || typeof row.display_name !== 'string' || typeof row.username !== 'string' || (row.avatar !== null && !isSocialId(row.avatar))) throw new Error('invalid_social_response')
    return { user_id: row.user_id, display_name: row.display_name, username: row.username, avatar: row.avatar as string | null }
  })
  if (users.some((row, i) => (i > 0 && row.user_id <= users[i - 1].user_id) || (after !== null && row.user_id <= after))) throw new Error('invalid_social_response')
  if (data.next_cursor && (users.length !== 30 || users.at(-1)?.user_id !== data.next_cursor)) throw new Error('invalid_social_response')
  return { users, next_cursor: data.next_cursor }
}
export async function changeSocialFollow(userId: string, following: boolean, signal: AbortSignal): Promise<void> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  // The server chooses accepted/pending. Never send actor, status or visibility.
  const { data, error } = await supabase.rpc(following ? 'follow_user' : 'unfollow_user', { p_target_id: userId }).abortSignal(signal)
  if (error) throw error
  if (following && (!data || !['pending', 'accepted'].includes(data.status))) throw new Error('invalid_social_response')
}
export function followsReturn(value: unknown): string | null {
  return typeof value === 'string' && /^\/users\/[0-9a-f-]{36}\/(followers|following)$/i.test(value) && isSocialId(value.split('/')[2]) ? value : null
}
