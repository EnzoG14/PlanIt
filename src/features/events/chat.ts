import { supabase } from '../../lib/supabase'

export type ChatHeader = { conversation_id: string; title: string; event_state: 'open' | 'ended' | 'cancelled' | 'archived' }
export type ChatMessage = {
  id: string; sender_id: string; body: string | null; created_at: string; display_name: string; username: string
  attachment_id: string | null; file_id: string | null; bucket_name: string | null
  storage_path: string | null; mime_type: string | null; size_bytes: number | null
}
// Match the server's Unicode whitespace normalization, including NEXT LINE.
export function trimChatText(value: string): string { return value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu, '') }
export async function loadChat(eventId: string): Promise<ChatHeader> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_chat', { p_event_id: eventId })
  if (error) throw error
  if (!data?.[0]) throw new Error('chat_unavailable')
  return data[0] as ChatHeader
}
export async function loadChatMessages(eventId: string, before?: ChatMessage): Promise<ChatMessage[]> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_event_chat_messages_v2', { p_event_id: eventId, p_before_at: before?.created_at ?? null, p_before_id: before?.id ?? null })
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

export async function sendChatMediaMessage(eventId: string, id: string, body: string, fileId: string | null): Promise<void> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('send_event_chat_message_v2', {
    p_event_id: eventId, p_message_id: id, p_body: body || null, p_file_id: fileId,
  })
  if (error) throw error
  if (data !== id) throw new Error('unconfirmed_message')
}

// Read through the authorized cursor API, never query messages/files directly.
export async function findChatMessage(eventId: string, id: string): Promise<ChatMessage | undefined> {
  let cursor: ChatMessage | undefined
  while (true) {
    const rows = await loadChatMessages(eventId, cursor)
    const found = rows.find(row => row.id === id)
    if (found || rows.length <= 50) return found
    cursor = rows[49]
  }
}

export function chatSendFailure(cause: unknown): { message: string; uncertain: boolean } {
  const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : ''
  const message = cause instanceof Error ? cause.message : typeof cause === 'object' && cause !== null && 'message' in cause ? String(cause.message) : ''
  if (/chat_read_only/.test(message)) return { message: 'El evento ya no está vigente. El chat es de sólo lectura.', uncertain: false }
  if (code === '42501' || /chat_unavailable|media_unavailable|authentication_required/.test(message)) return { message: 'Ya no tenés permiso para enviar este mensaje. Actualizá el chat.', uncertain: false }
  if (code === 'P0001' || code === '22023') return { message: 'El servidor rechazó el mensaje o su imagen. Revisá el contenido antes de reintentar.', uncertain: false }
  return { message: 'No pudimos confirmar el envío. Consultá su estado antes de reintentar; conservamos el mismo mensaje y la imagen.', uncertain: true }
}

export async function downloadChatImage(message: ChatMessage, userId: string, signal: AbortSignal): Promise<Blob> {
  if (!supabase || message.bucket_name !== 'event_media' || !message.storage_path?.startsWith('r7/chat/')) throw new Error('Imagen no disponible.')
  const identity = await supabase.auth.getUser()
  if (identity.error || identity.data.user?.id !== userId) throw new Error('No pudimos verificar tu sesión. Volvé a ingresar.')
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session || data.session.user.id !== userId) throw new Error('La sesión cambió. Volvé a abrir el chat.')
  // The reader verifies Auth + current chat access twice around the Storage GET,
  // and checks the stored digest before returning bytes. No signed URL is issued.
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r7-chat-image?message_id=${encodeURIComponent(message.id)}`, {
    headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY! }, cache: 'no-store', signal,
  })
  if (!response.ok) {
    if (import.meta.env.DEV) console.warn('Chat image download failed', { status: response.status })
    throw new Error('Imagen no disponible o sin permiso de acceso. Reintentá.')
  }
  const blob = await response.blob()
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size < 1 || blob.size > 5 * 1024 * 1024) throw new Error('El archivo recibido no es una imagen admitida.')
  return blob
}
