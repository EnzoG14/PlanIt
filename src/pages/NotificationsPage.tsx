import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { formatEventTime } from '../features/events/validation'
import { clearNotifications, loadNotificationChanges, loadNotifications, markNotificationRead, notificationTarget, notificationsError, type NotificationItem } from '../features/notifications/api'
import { catchUp, compareRows, createReconciler, mergeRows } from '../lib/reconciliation'
import { useNotificationsRealtime } from '../features/notifications/realtime-context'
import './notifications.css'

const notificationKinds: Record<string, string> = { event_full: 'Cupo completo', event_update: 'Evento', chat: 'Conversación', direct_message: 'Mensaje privado', system: 'Sistema', follow_request: 'Seguimiento' }

export function NotificationsPage() {
  const { session } = useAuth()
  return <NotificationsInbox key={session?.user.id} />
}

function NotificationsInbox() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [clearRevision, setClearRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const busy = useRef(false)
  const alive = useRef(false)
  const reload = useRef(() => {})
  const more = useRef(() => {})
  const confirmedReads = useRef(new Map<string, string>())
  const actionRevision = useRef(0)
  const targetChecks = useRef(new Map<string, { revision: number; target: string | null }>())
  const { listen, invalidate, connection } = useNotificationsRealtime()
  useEffect(() => {
    let active = true
    alive.current = true
    let cached: NotificationItem[] = [], cursor: NotificationItem | null = null
    let initialized = false, recover = true, append = false
    const changed = new Set<string>()
    document.title = 'Notificaciones · PlanIt'
    const queue = createReconciler(async () => {
      const queryRevision = actionRevision.current
      const full = recover; recover = false
      const nextPage = append; append = false
      const ids = [...changed]; changed.clear()
      setError('')
      if (!initialized || full) setLoading(true)
      if (nextPage) setLoadingMore(true)
      let incoming: NotificationItem[] = []
      if (!initialized || full) {
        // Reconnect revalidates the loaded range, including read changes missed offline.
        const result = await catchUp(async before => loadNotifications(before ?? null), cached.at(-1))
        incoming = result.items.filter(row => !cached.length || compareRows(row, cached.at(-1)!) >= 0)
        if (active) {
          cursor = incoming.at(-1) ?? null
          setHasMore(result.hasMore)
        }
      }
      for (let offset = 0; offset < ids.length; offset += 100) incoming = mergeRows(incoming, await loadNotificationChanges(ids.slice(offset, offset + 100)), true)
      if (nextPage && initialized) {
        const result = await loadNotifications(cursor)
        incoming = mergeRows(incoming, result.items, true)
        cursor = result.items.at(-1) ?? cursor
        if (active) setHasMore(result.hasMore)
      }
      if (!active) return
      if (!nextPage && initialized && cached.length) incoming = incoming.filter(row => compareRows(row, cached.at(-1)!) >= 0)
      cached = mergeRows(full ? [] : cached, incoming, true).map(row => {
        const checked = targetChecks.current.get(row.id)
        return { ...row, title: row.type === 'event_full' && checked && checked.revision > queryRevision && !checked.target ? 'Cupo completo' : row.title,
          read_at: confirmedReads.current.get(row.id) ?? row.read_at,
          target: checked && checked.revision > queryRevision ? checked.target : row.target }
      })
      initialized = true
      setItems(cached); setLoading(false); setLoadingMore(false)
    }, failure => {
      if (!active) return
      // Clear sensitive rows after any failed authenticated reconciliation.
      cached = []; initialized = false; cursor = null; recover = true
      setItems([]); setHasMore(false); setLoading(false); setLoadingMore(false); setError(notificationsError(failure))
    })
    const unlisten = listen(change => {
      recover ||= change.recover
      for (const id of change.ids) changed.add(id)
      queue.request()
    })
    reload.current = () => { recover = true; queue.request(); invalidate() }
    more.current = () => { append = true; queue.request() }
    queue.request()
    return () => { active = false; alive.current = false; queue.dispose(); unlisten(); reload.current = () => {}; more.current = () => {} }
  }, [listen, invalidate, clearRevision])
  async function clearInbox() {
    if (busy.current) return
    busy.current = true; setPending('clear'); setActionError(''); setNotice('')
    try {
      await clearNotifications()
      if (!alive.current) return
      // Remount the reconciler so no in-flight page or cached read can restore cleared rows.
      setItems([]); setHasMore(false); setLoading(true)
      confirmedReads.current.clear(); targetChecks.current.clear()
      setClearRevision(value => value + 1)
      invalidate()
      setNotice('Notificaciones limpiadas.')
    } catch {
      if (alive.current) setActionError('No pudimos limpiar las notificaciones. Revisá tu conexión y volvé a intentarlo.')
    } finally {
      if (alive.current) { busy.current = false; setPending(null) }
    }
  }
  async function act(item: NotificationItem, open: boolean) {
    if (busy.current) return
    busy.current = true; setPending(item.id); setActionError('')
    try {
      if (!item.read_at) {
        const readAt = await markNotificationRead(item.id)
        if (!alive.current) return
        confirmedReads.current.set(item.id, readAt)
        setItems(previous => previous.map(row => row.id === item.id ? { ...row, read_at: readAt } : row))
        invalidate(item.id)
      }
      if (open) {
        const target = await notificationTarget(item.id)
        if (!alive.current) return
        targetChecks.current.set(item.id, { revision: ++actionRevision.current, target })
        if (target) navigate(target)
        else {
          setItems(previous => previous.map(row => row.id === item.id ? { ...row, target: null, title: row.type === 'event_full' ? 'Cupo completo' : row.title } : row))
          setActionError('El recurso ya no está disponible o no tenés permiso para consultarlo.')
        }
      }
    } catch { if (alive.current) setActionError('No pudimos completar la acción. Revisá tu sesión o conexión y reintentá.') }
    finally { if (alive.current) { busy.current = false; setPending(null) } }
  }

  return <div className="notifications-page">
    <header className="notifications-heading"><h1>Notificaciones</h1><button type="button" className="secondary-button" disabled={loading || loadingMore || pending !== null || !items.length} onClick={() => void clearInbox()}>{pending === 'clear' ? 'Limpiando…' : 'Limpiar notificaciones'}</button></header>
    {notice && <p role="status">{notice}</p>}
    {connection !== "connected" && <p role="status">{connection === "connecting" ? "Conectando los avisos…" : "Conexión interrumpida. Recuperaremos los avisos al reconectar."}</p>}
    <section aria-label="Tus avisos" aria-busy={loading || loadingMore}>
      {loading ? <div role="status"><StatusMessage title="Cargando notificaciones">Esperá un momento.</StatusMessage></div> : <>
        {error && <><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button className="secondary-button" type="button" onClick={() => items.length ? more.current() : reload.current()}>Reintentar</button></>}
        {!error && !items.length && <StatusMessage title="Todavía no tenés notificaciones">Cuando tengas avisos registrados, aparecerán acá.</StatusMessage>}
        {actionError && <p className="field-error" role="alert">{actionError}</p>}
        <ul className="notifications-list">{items.map(item => <li key={item.id} className={`notification-row ${item.read_at ? 'is-read' : 'is-unread'}`}>
          <span className="notification-icon"><Icon name={item.type === 'event_full' ? 'calendar' : item.type === 'follow_request' ? 'user' : item.type === 'direct_message' || item.target?.endsWith('/chat') ? 'email' : item.target ? 'calendar' : 'bell'} /></span>
          <div className="notification-content"><span className="notification-kind">{notificationKinds[item.type] ?? 'Aviso'}</span><h2>{item.title}</h2>{item.body && <p>{item.body}</p>}
            <time dateTime={`${item.created_at}-03:00`}>{formatEventTime(item.created_at)}</time>
            <div className="notification-actions"><span className="notification-state">{item.read_at ? 'Leído' : 'No leído'}</span>
              {!item.read_at && <button type="button" className="text-button" disabled={pending !== null || loadingMore} onClick={() => void act(item, false)}>{pending === item.id ? 'Guardando…' : 'Marcar leído'}</button>}
              {item.target && <button type="button" className="text-button" disabled={pending !== null || loadingMore} onClick={() => void act(item, true)}>{item.target === '/me/follow-requests' ? 'Ver solicitudes' : item.target.startsWith('/messages/') ? 'Ver mensaje' : item.target.endsWith('/chat') ? 'Ver chat' : 'Ver evento'}</button>}
              {item.type === 'event_full' && !item.target && <span className="notification-state">El evento ya no está disponible o no tenés permiso para consultarlo.</span>}
            </div>
          </div>
        </li>)}</ul>
        {hasMore && !error && <button type="button" className="secondary-button notifications-more" disabled={loadingMore || pending !== null} onClick={() => more.current()}>{loadingMore ? 'Cargando…' : 'Ver más avisos'}</button>}
      </>}
    </section>
  </div>
}
