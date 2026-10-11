import { createContext, useContext } from 'react'
import type { ConnectionState } from '../../lib/realtime'
export type NotificationChange = { recover: boolean; ids: string[] }
export const NotificationsContext = createContext({
  count: null as number | null, connection: 'connecting' as ConnectionState,
  listen: (_listener: (change: NotificationChange) => void): (() => void) => () => {},
  invalidate: (_id?: string) => {},
})
export const useNotificationsRealtime = () => useContext(NotificationsContext)
