import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { formatEventTime } from '../features/events/validation'
import { loadNotifications, markNotificationRead, notificationTarget, notificationsError, type NotificationItem } from '../features/notifications/api'
import './notifications.css'

const notificationKinds: Record<string, string> = { event_update: 'Evento', chat: 'Conversación', system: 'Sistema' }

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
  const busy = useRef(false)
  const alive = useRef(false)
  const reload = useRef(() => {})
  const more = useRef(() => {})
  useEffect(() => {
    let active = true
    alive.current = true
    busy.current = false
    let cursor: NotificationItem | null = null
    document.title = 'Notificaciones · PlanIt'
    async function fetchPage(append = false) {
      if (busy.current) return
      busy.current = true
      setError(''); setActionError('')
      if (append) setLoadingMore(true)
      else { cursor = null; setLoading(true); setItems([]); setHasMore(false) }
      try {
        const result = await loadNotifications(append ? cursor : null)
        if (!active) return
        setItems(previous => append ? [...new Map([...previous, ...result.items].map(item => [item.id, item])).values()] : result.items)
        cursor = result.items.at(-1) ?? cursor
        setHasMore(result.hasMore)
      } catch (failure) { if (active) setError(notificationsError(failure)) }
      finally { if (active) { busy.current = false; setLoading(false); setLoadingMore(false) } }
    }
    reload.current = () => { void fetchPage() }
    more.current = () => { void fetchPage(true) }
    const onReturn = () => { if (document.visibilityState === 'visible') void fetchPage() }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    void fetchPage()
    return () => { active = false; alive.current = false; window.removeEventListener('focus', onReturn); document.removeEventListener('visibilitychange', onReturn) }
  }, [])

  async function act(item: NotificationItem, open: boolean) {
    if (busy.current) return
    busy.current = true; setPending(item.id); setActionError('')
    try {
      if (!item.read_at) {
        const readAt = await markNotificationRead(item.id)
        if (!alive.current) return
        setItems(previous => previous.map(row => row.id === item.id ? { ...row, read_at: readAt } : row))
      }
      if (open) {
        const target = await notificationTarget(item.id)
        if (!alive.current) return
        if (target) navigate(target)
        else {
          setItems(previous => previous.map(row => row.id === item.id ? { ...row, target: null } : row))
          setActionError('El recurso ya no está disponible o no tenés permiso para consultarlo.')
        }
      }
    } catch { if (alive.current) setActionError('No pudimos completar la acción. Revisá tu sesión o conexión y reintentá.') }
    finally { if (alive.current) { busy.current = false; setPending(null) } }
  }

  return <div className="notifications-page">
    <header className="notifications-heading"><h1>Notificaciones</h1><button type="button" className="text-button" disabled={loading || loadingMore || pending !== null} onClick={() => reload.current()}>Actualizar</button></header>
    <section aria-label="Tus avisos" aria-busy={loading || loadingMore}>
      {loading ? <div role="status"><StatusMessage title="Cargando notificaciones">Esperá un momento.</StatusMessage></div> : <>
        {error && <><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage><button className="secondary-button" type="button" onClick={() => items.length ? more.current() : reload.current()}>Reintentar</button></>}
        {!error && !items.length && <StatusMessage title="Todavía no tenés notificaciones">Cuando tengas avisos registrados, aparecerán acá.</StatusMessage>}
        {actionError && <p className="field-error" role="alert">{actionError}</p>}
        <ul className="notifications-list">{items.map(item => <li key={item.id} className={`notification-row ${item.read_at ? 'is-read' : 'is-unread'}`}>
          <span className="notification-icon"><Icon name={item.target?.endsWith('/chat') ? 'email' : item.target ? 'calendar' : 'bell'} /></span>
          <div className="notification-content"><span className="notification-kind">{notificationKinds[item.type] ?? 'Aviso'}</span><h2>{item.title}</h2>{item.body && <p>{item.body}</p>}
            <time dateTime={`${item.created_at}-03:00`}>{formatEventTime(item.created_at)}</time>
            <div className="notification-actions"><span className="notification-state">{item.read_at ? 'Leído' : 'No leído'}</span>
              {!item.read_at && <button type="button" className="text-button" disabled={pending !== null || loadingMore} onClick={() => void act(item, false)}>{pending === item.id ? 'Guardando…' : 'Marcar leído'}</button>}
              {item.target && <button type="button" className="text-button" disabled={pending !== null || loadingMore} onClick={() => void act(item, true)}>{item.target.endsWith('/chat') ? 'Ver chat' : 'Ver evento'}</button>}
            </div>
          </div>
        </li>)}</ul>
        {hasMore && !error && <button type="button" className="secondary-button notifications-more" disabled={loadingMore || pending !== null} onClick={() => more.current()}>{loadingMore ? 'Cargando…' : 'Ver más avisos'}</button>}
      </>}
    </section>
  </div>
}
