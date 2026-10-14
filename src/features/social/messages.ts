import { supabase } from '../../lib/supabase'
import { isSocialId, loadSocialProfile, type SocialProfile } from './api'
import { loadSocialRelationship } from './follows'
import { compareRows } from '../../lib/reconciliation'

export type DirectMessage = { id: string; sender_id: string; body: string; created_at: string }
export type DirectCursor = { created_at: string; id: string }
export type DirectConversation = DirectCursor & { peer_id: string; read_only: boolean }
export type DirectHeader = { peer_id: string; profile: SocialProfile | null; read_only: boolean }
// Same Unicode boundary whitespace accepted by send_direct_message in PostgreSQL.
export function trimDirectText(value: string): string { return value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu, '') }
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{1,6})?$/.test(value) && Number.isFinite(Date.parse(value + 'Z'))
}
function ordered(value: unknown): DirectCursor {
  const row = value as Record<string, unknown> | null
  if (!row || !isSocialId(row.id) || !timestamp(row.created_at)) throw new Error('invalid_direct_response')
  return { id: row.id, created_at: row.created_at }
}
function message(value: unknown): DirectMessage {
  const row = value as Record<string, unknown>
  const cursor = ordered(row)
  if (!isSocialId(row.sender_id) || typeof row.body !== 'string' || [...row.body].length > 2000 || !row.body.trim()) throw new Error('invalid_direct_response')
  return { ...cursor, sender_id: row.sender_id, body: row.body }
}
function page<T extends DirectCursor>(data: unknown, key: string, after: DirectCursor | null, parse: (row: unknown) => T) {
  const value = data as Record<string, unknown> | null
  if (!value || !Array.isArray(value[key]) || value[key].length > 30) throw new Error('invalid_direct_response')
  const rows = value[key].map(parse)
  if (rows.some((row, i) => (i > 0 && compareRows(row, rows[i - 1]) >= 0) || (after && compareRows(row, after) >= 0))) throw new Error('invalid_direct_response')
  const next = value.next_cursor === null ? null : ordered(value.next_cursor)
  if (next && (rows.length !== 30 || compareRows(next, rows[29]) !== 0)) throw new Error('invalid_direct_response')
  return { rows, next_cursor: next }
}
export async function openDirectConversation(target: string, signal: AbortSignal): Promise<string> {
  if (!supabase || !isSocialId(target)) throw new Error('conversation_unavailable')
  const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_target_id: target }).retry(false).abortSignal(signal)
  if (error) throw error
  if (!isSocialId(data)) throw new Error('invalid_direct_response')
  return data
}
export async function loadDirectConversations(after: DirectCursor | null, signal: AbortSignal) {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('list_direct_conversations', { p_before_at: after?.created_at ?? null, p_before_id: after?.id ?? null, p_limit: 30 }).abortSignal(signal)
  if (error) throw error
  return page(data, 'conversations', after, value => {
    const row = value as Record<string, unknown>, cursor = ordered(row)
    if (!isSocialId(row.peer_id) || typeof row.read_only !== 'boolean') throw new Error('invalid_direct_response')
    return { ...cursor, peer_id: row.peer_id, read_only: row.read_only }
  })
}
export async function loadDirectHeader(id: string, viewer: string, signal: AbortSignal): Promise<DirectHeader> {
  if (!supabase || !isSocialId(id)) throw new Error('conversation_unavailable')
  const { data, error } = await supabase.from('conversations').select('user_low_id,user_high_id').eq('id', id).eq('kind', 'direct').abortSignal(signal).maybeSingle()
  if (error) throw error
  if (!data || !isSocialId(data.user_low_id) || !isSocialId(data.user_high_id) || ![data.user_low_id, data.user_high_id].includes(viewer)) throw new Error('conversation_unavailable')
  const peer_id = data.user_low_id === viewer ? data.user_high_id : data.user_low_id
  const profile = await loadSocialProfile(peer_id, signal)
  const relationship = await loadSocialRelationship(peer_id, signal)
  return { peer_id, profile: relationship ? profile : null, read_only: !profile || !relationship }
}
export async function loadDirectMessages(id: string, after: DirectCursor | null, signal: AbortSignal) {
  if (!supabase || !isSocialId(id)) throw new Error('conversation_unavailable')
  const { data, error } = await supabase.rpc('get_direct_messages', { p_conversation_id: id, p_before_at: after?.created_at ?? null, p_before_id: after?.id ?? null, p_limit: 30 }).abortSignal(signal)
  if (error) throw error
  return page(data, 'messages', after, message)
}
export async function sendDirectMessage(id: string, messageId: string, body: string, signal: AbortSignal) {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('send_direct_message', { p_conversation_id: id, p_message_id: messageId, p_body: body }).retry(false).abortSignal(signal)
  if (error) throw error
  if (data !== messageId) throw new Error('invalid_direct_response')
}
export async function findDirectMessage(id: string, messageId: string, signal: AbortSignal) {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.from('messages').select('id,sender_id,body,created_at').eq('conversation_id', id).eq('id', messageId).abortSignal(signal).maybeSingle()
  if (error) throw error
  return data ? message(data) : null
}
export function directReturn(value: unknown): string | null {
  return value === '/messages' || (typeof value === 'string' && /^\/messages\/[0-9a-f-]{36}$/i.test(value) && isSocialId(value.split('/')[2])) ? value as string : null
}
