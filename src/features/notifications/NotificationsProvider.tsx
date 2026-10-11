import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { createReconciler } from '../../lib/reconciliation'
import { subscribeToChanges, type ConnectionState } from '../../lib/realtime'
import { loadUnreadCount } from './api'
import { NotificationsContext, type NotificationChange } from './realtime-context'

export function NotificationsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [count, setCount] = useState<number | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const requestCount = useRef(() => {})
  const bus = useMemo(() => {
    const listeners = new Set<(change: NotificationChange) => void>()
    return {
      listen(listener: (change: NotificationChange) => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
      emit(change: NotificationChange) { for (const listener of listeners) listener(change) },
    }
  }, [])
  useEffect(() => {
    const client = supabase
    if (!client || !userId) return
    let active = true
    const counter = createReconciler(async () => {
      const value = await loadUnreadCount(userId)
      if (active) setCount(value)
    }, () => { if (active) setCount(null) })
    const invalidate = (change: NotificationChange) => { counter.request(); bus.emit(change) }
    requestCount.current = () => counter.request()
    const cleanup = subscribeToChanges(client, 'notifications:' + userId,
      ['INSERT', 'UPDATE'].map(event => ({ table: 'notifications', event: event as 'INSERT' | 'UPDATE', filter: 'recipient_id=eq.' + userId })),
      change => invalidate({ recover: false, ids: typeof change.new.id === 'string' ? [change.new.id] : [] }),
      () => invalidate({ recover: true, ids: [] }), setConnection)
    counter.request()
    return () => { active = false; requestCount.current = () => {}; counter.dispose(); cleanup() }
  }, [userId, bus])
  const invalidate = useCallback((id?: string) => { requestCount.current(); bus.emit({ recover: !id, ids: id ? [id] : [] }) }, [bus])
  return <NotificationsContext.Provider value={{ count, connection, listen: bus.listen, invalidate }}>{children}</NotificationsContext.Provider>
}
