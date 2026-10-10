import { supabase } from '../../lib/supabase'

export type ChatHeader = { conversation_id: string; title: string; event_state: 'open' | 'ended' | 'cancelled' | 'archived' }
export type ChatMessage = { id: string; sender_id: string; body: string; created_at: string; display_name: string; username: string }
export async function loadChat(eventId: string): Promise<ChatHeader> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_chat', { p_event_id: eventId })
  if (error) throw error
  if (!data?.[0]) throw new Error('chat_unavailable')
  return data[0] as ChatHeader
}
export async function loadChatMessages(eventId: string, before?: ChatMessage): Promise<ChatMessage[]> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_chat_messages', { p_event_id: eventId, p_before_at: before?.created_at ?? null, p_before_id: before?.id ?? null })
  if (error) throw error
  return (data ?? []) as ChatMessage[]
}
export async function sendChatMessage(eventId: string, id: string, body: string): Promise<void> {
  if (!supabase) throw new Error('unconfigured')
  const { error } = await supabase.rpc('send_event_chat_message', { p_event_id: eventId, p_message_id: id, p_body: body })
  if (error) throw error
}
export function chatUnavailable(cause: unknown): boolean {
  return typeof cause === 'object' && cause !== null && 'message' in cause && String(cause.message) === 'chat_unavailable'
}
