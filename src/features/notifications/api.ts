import { supabase } from '../../lib/supabase'
import { directReturn } from '../social/messages'

export type NotificationItem = {
  id: string; type: string; title: string; body: string | null
  created_at: string; read_at: string | null; target: string | null
}
export const notificationsPageSize = 30
export async function loadNotifications(cursor: NotificationItem | null = null) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_notifications', {
    p_before_at: cursor?.created_at ?? null, p_before_id: cursor?.id ?? null,
  })
  if (error) throw error
  const rows = (data ?? []) as NotificationItem[]
  return { items: rows.slice(0, notificationsPageSize), hasMore: rows.length > notificationsPageSize }
}
export async function markNotificationRead(id: string): Promise<string> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('mark_notification_read', { p_id: id })
  if (error) throw error
  if (typeof data !== 'string') throw new Error('No se pudo confirmar la lectura.')
  return data
}
export async function notificationTarget(id: string): Promise<string | null> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_notification_target', { p_id: id })
  if (error) throw error
  // Allow only known internal destinations, never notification text or arbitrary URLs.
  return typeof data === 'string' && (data === '/me/follow-requests' || (data.startsWith('/messages/') && directReturn(data) !== null) || /^\/events\/[\da-f-]{36}(\/chat)?$/.test(data)) ? data : null
}
export function notificationsError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (['PGRST202', '42P01'].includes(code)) return 'La bandeja todavía no está disponible. Volvé a intentar más tarde.'
  if (['42501', 'PGRST301', 'PGRST303'].includes(code)) return 'No pudimos autorizar la consulta. Comprobá tu sesión y reintentá.'
  return 'No pudimos consultar tus avisos. Revisá la conexión y reintentá.'
}

export async function loadUnreadCount(userId: string): Promise<number> {
  if (!supabase) throw new Error('unconfigured')
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).is('read_at', null)
  if (error) throw error
  if (count === null) throw new Error('count_unavailable')
  return count
}
export async function loadNotificationChanges(ids: string[]): Promise<NotificationItem[]> {
  if (!supabase) throw new Error('unconfigured')
  const { data, error } = await supabase.rpc('get_notification_changes', { p_ids: ids })
  if (error) throw error
  return (data ?? []) as NotificationItem[]
}
