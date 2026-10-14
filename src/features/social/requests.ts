import { supabase } from '../../lib/supabase'
import { isSocialId, type SocialIdentity } from './api'

export type FollowDecision = 'accepted' | 'rejected'
export type FollowRequest = SocialIdentity & { follower_id: string; request_version: string; requested_at: string }
export type RequestCursor = { requested_at: string; follower_id: string }
export type RequestPage = { requests: FollowRequest[]; next_cursor: RequestCursor | null }
const timestamp = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/.test(value) && Number.isFinite(Date.parse(`${value}Z`))
const order = (a: RequestCursor, b: RequestCursor) => a.requested_at.localeCompare(b.requested_at) || a.follower_id.localeCompare(b.follower_id)

export async function loadFollowRequests(cursor: RequestCursor | null, signal: AbortSignal): Promise<RequestPage> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('list_follow_requests', {
    p_after_requested_at: cursor?.requested_at ?? null, p_after_follower_id: cursor?.follower_id ?? null, p_limit: 30,
  }).abortSignal(signal)
  if (error) throw error
  if (!data || !Array.isArray(data.requests) || data.requests.length > 30) throw new Error('invalid_social_response')
  const requests: FollowRequest[] = data.requests.map((row: Record<string, unknown>) => {
    if (!row || !isSocialId(row.follower_id) || !isSocialId(row.request_version) || !timestamp(row.requested_at) || typeof row.display_name !== 'string' || typeof row.username !== 'string' || (row.avatar !== null && !isSocialId(row.avatar))) throw new Error('invalid_social_response')
    return { follower_id: row.follower_id, request_version: row.request_version, requested_at: row.requested_at, display_name: row.display_name, username: row.username, avatar: row.avatar as string | null }
  })
  if (requests.some((row, i) => (i > 0 && order(row, requests[i - 1]) <= 0) || (cursor && order(row, cursor) <= 0))) throw new Error('invalid_social_response')
  const next = data.next_cursor
  const last = requests.at(-1)
  if (next !== null && (!next || !timestamp(next.requested_at) || !isSocialId(next.follower_id) || requests.length !== 30 || !last || last.requested_at !== next.requested_at || last.follower_id !== next.follower_id)) throw new Error('invalid_social_response')
  return { requests, next_cursor: next === null ? null : { requested_at: next.requested_at, follower_id: next.follower_id } }
}
export async function resolveFollowRequest(followerId: string, version: string, decision: FollowDecision, signal: AbortSignal): Promise<void> {
  if (!supabase || !isSocialId(followerId) || !isSocialId(version) || !['accepted', 'rejected'].includes(decision)) throw new Error('invalid_request')
  const { data, error } = await supabase.rpc('resolve_follow_request', { p_follower_id: followerId, p_request_version: version, p_decision: decision }).abortSignal(signal)
  if (error) throw error
  if (data !== decision) throw new Error('invalid_social_response')
}
// Reconcile only the incoming edge owned by the current recipient. RLS remains
// authoritative; no identity projection, broad SELECT or write through the table.
export async function loadIncomingFollow(userId: string, followerId: string, signal: AbortSignal): Promise<{ request_version: string; status: 'pending' | FollowDecision } | null> {
  if (!supabase || !isSocialId(userId) || !isSocialId(followerId)) throw new Error('invalid_request')
  const { data, error } = await supabase.from('user_follows').select('request_version,status').eq('followed_id', userId).eq('follower_id', followerId).abortSignal(signal).maybeSingle()
  if (error) throw error
  if (data === null) return null
  if (!isSocialId(data.request_version) || !['pending', 'accepted', 'rejected'].includes(data.status)) throw new Error('invalid_social_response')
  return { request_version: data.request_version, status: data.status }
}
export function requestsReturn(value: unknown): string | null { return value === '/me/follow-requests' ? value : null }
