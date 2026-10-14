import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { trimDirectText, directReturn, findDirectMessage, loadDirectHeader, loadDirectMessages, sendDirectMessage, type DirectHeader, type DirectMessage, type DirectCursor } from '../features/social/messages'
import { socialProfileReturn } from '../features/social/api'
import { formatEventTime } from '../features/events/validation'
import { compareRows, createReconciler, mergeRows } from '../lib/reconciliation'
import { subscribeToChanges, type ConnectionState } from '../lib/realtime'
import { supabase } from '../lib/supabase'
import { StatusMessage } from '../components/StatusMessage'
import { GradientButton } from '../components/GradientButton'
import './chat.css'
import './direct-messages.css'

export function DirectChatPage() {
  const { conversationId = '' } = useParams(), { session } = useAuth()
  return session ? <Chat key={`${conversationId}:${session.user.id}:${session.access_token}`} id={conversationId} viewer={session.user.id} /> : null
}
function Chat({ id, viewer }: { id: string; viewer: string }) {
  const location = useLocation()
  const back = socialProfileReturn(location.state?.directOrigin) ?? directReturn(location.state?.directOrigin) ?? '/messages'
  const [header, setHeader] = useState<DirectHeader | null>(null), [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true), [error, setError] = useState(false), [hasOlder, setHasOlder] = useState(false)
  const [connection, setConnection] = useState<ConnectionState>('connecting'), [text, setText] = useState('')
  const [operation, setOperation] = useState<{ id: string; body: string; status: 'pending' | 'uncertain' } | null>(null)
  const [notice, setNotice] = useState(''), [checking, setChecking] = useState(false)
  const list = useRef<HTMLOListElement>(null), scroll = useRef<{ height: number; top: number; bottom: boolean; anchor: string | null; offset: number } | null>(null)
  const refresh = useRef<(older?: boolean) => void>(() => {}), alive = useRef(false), writing = useRef(false), writeRequest = useRef<AbortController | null>(null)
  useEffect(() => { document.title = 'Conversación privada · PlanIt' }, [])
  useLayoutEffect(() => {
    const element = list.current, previous = scroll.current
    if (!element || !previous) return
    const anchor = [...element.children].find(row => row.getAttribute('data-message-id') === previous.anchor)
    if (previous.bottom) element.scrollTop = element.scrollHeight
    else if (anchor) element.scrollTop += anchor.getBoundingClientRect().top - element.getBoundingClientRect().top - previous.offset
    else element.scrollTop = previous.top + element.scrollHeight - previous.height
    scroll.current = null
  }, [messages])
  useEffect(() => {
    alive.current = true
    let active = true, revision = 0, controller: AbortController | null = null, stop: (() => void) | null = null
    let boundary: DirectCursor | null = null, older = false
    const visible = () => document.visibilityState === 'visible' && navigator.onLine
    const clear = () => {
      revision++; controller?.abort(); controller = null; stop?.(); stop = null
      setHeader(null); setMessages([]); setHasOlder(false); setLoading(false); setConnection('disconnected')
    }
    const queue = createReconciler(async () => {
      if (!active || !visible()) return
      const generation = ++revision, request = new AbortController(); controller?.abort(); controller = request
      const timer = window.setTimeout(() => request.abort(), 10000)
      const includeOlder = older; older = false
      setLoading(true); setError(false)
      try {
        const current = await loadDirectHeader(id, viewer, request.signal)
        if (active && visible() && !stop && supabase) stop = subscribeToChanges(supabase, `direct:${viewer}:${id}`,
          [{ table: 'messages', event: 'INSERT', filter: `conversation_id=eq.${id}` }], () => queue.request(), () => queue.request(), setConnection)
        let cursor: DirectCursor | null = null, rows: DirectMessage[] = [], more = false
        while (true) {
          const page = await loadDirectMessages(id, cursor, request.signal)
          rows = [...rows, ...page.rows]; more = page.next_cursor !== null
          const reached = !boundary || (page.rows.length > 0 && compareRows(page.rows.at(-1)!, boundary) <= 0)
          cursor = page.next_cursor
          if (!cursor || reached) {
            if (includeOlder && cursor) {
              const previous = await loadDirectMessages(id, cursor, request.signal)
              rows.push(...previous.rows); more = previous.next_cursor !== null
            }
            break
          }
        }
        // Recheck the social gate after history reads; blocked identity is never a historical header.
        const finalHeader = await loadDirectHeader(id, viewer, request.signal)
        if (!active || generation !== revision || request.signal.aborted || !visible()) return
        const element = list.current
        const anchor = element ? [...element.children].find(row => row.getBoundingClientRect().bottom > element.getBoundingClientRect().top) : null
        scroll.current = element ? { height: element.scrollHeight, top: element.scrollTop, bottom: !includeOlder && element.scrollHeight - element.scrollTop - element.clientHeight < 64, anchor: anchor?.getAttribute('data-message-id') ?? null, offset: anchor ? anchor.getBoundingClientRect().top - element.getBoundingClientRect().top : 0 } : { height: 0, top: 0, bottom: true, anchor: null, offset: 0 }
        const sorted = mergeRows([], rows)
        boundary = sorted[0] ?? null
        setHeader({ ...current, ...finalHeader }); setMessages(sorted); setHasOlder(more); setLoading(false)
      } catch {
        if (active && generation === revision) { clear(); setError(true) }
      } finally { window.clearTimeout(timer) }
    }, () => { if (active) { clear(); setError(true) } })
    refresh.current = value => { older ||= !!value; queue.request() }
    const check = () => { if (visible()) queue.request(); else { clear(); writeRequest.current?.abort() } }
    const interval = window.setInterval(check, 30000)
    window.addEventListener('focus', check); window.addEventListener('online', check); window.addEventListener('offline', check); document.addEventListener('visibilitychange', check)
    check()
    return () => {
      active = false; alive.current = false; revision++; controller?.abort(); stop?.(); queue.dispose(); writeRequest.current?.abort()
      window.clearInterval(interval); window.removeEventListener('focus', check); window.removeEventListener('online', check); window.removeEventListener('offline', check); document.removeEventListener('visibilitychange', check)
    }
  }, [id, viewer])
  async function send(event: FormEvent) {
    event.preventDefault()
    const body = trimDirectText(text)
    if (writing.current || operation || !header || header.read_only || !body || [...body].length > 2000) return
    writing.current = true
    const item = { id: crypto.randomUUID(), body, status: 'pending' as const }, controller = new AbortController()
    writeRequest.current = controller; setOperation(item); setNotice('')
    const timer = window.setTimeout(() => controller.abort(), 10000)
    try {
      await sendDirectMessage(id, item.id, body, controller.signal)
      if (alive.current && !controller.signal.aborted) { setOperation(null); setText(''); refresh.current() }
      else if (alive.current) setOperation({ ...item, status: 'uncertain' })
    } catch { if (alive.current) { setOperation({ ...item, status: 'uncertain' }); refresh.current() } }
    finally { clearTimeout(timer); writing.current = false; writeRequest.current = null }
  }
  async function reconcile() {
    if (!operation || writing.current) return
    writing.current = true; setChecking(true)
    const controller = new AbortController(); writeRequest.current = controller
    const timer = window.setTimeout(() => controller.abort(), 10000)
    try {
      await loadDirectHeader(id, viewer, controller.signal)
      const found = await findDirectMessage(id, operation.id, controller.signal)
      if (!alive.current || controller.signal.aborted) return
      if (found && (found.sender_id !== viewer || found.body !== operation.body)) throw new Error('message_conflict')
      if (found) { setOperation(null); setText(''); setNotice('Mensaje confirmado.'); refresh.current() }
      else setNotice('Todavía no se pudo confirmar. Podés reintentar el mismo mensaje sin duplicarlo.')
    } catch { if (alive.current) setNotice('No pudimos consultar el estado. Revisá tu conexión y reintentá.') }
    finally { clearTimeout(timer); writing.current = false; writeRequest.current = null; if (alive.current) setChecking(false) }
  }
  async function retry() {
    if (!operation || writing.current || !header || header.read_only) return
    writing.current = true; setOperation({ ...operation, status: 'pending' }); setNotice('')
    const controller = new AbortController(); writeRequest.current = controller
    const timer = window.setTimeout(() => controller.abort(), 10000)
    try {
      const existing = await findDirectMessage(id, operation.id, controller.signal)
      if (!existing) await sendDirectMessage(id, operation.id, operation.body, controller.signal)
      else if (existing.sender_id !== viewer || existing.body !== operation.body) throw new Error('message_conflict')
      if (alive.current && !controller.signal.aborted) { setOperation(null); setText(''); refresh.current() }
      else if (alive.current) setOperation({ ...operation, status: 'uncertain' })
    } catch { if (alive.current) { setOperation({ ...operation, status: 'uncertain' }); refresh.current() } }
    finally { clearTimeout(timer); writing.current = false; writeRequest.current = null }
  }
  return <section className="chat-page direct-chat">
    <header className="chat-header"><Link className="text-button" to={back} state={back === '/messages' ? { focusConversation: id } : { ...location.state?.profileOrigin, focusMessage: true }}>Volver</Link><h1>{header?.profile?.display_name ?? 'Conversación privada'}</h1><Link className="text-button" to="/messages">Bandeja</Link></header>
    <div className="chat-refresh"><p role="status">{connection === 'connected' ? 'Actualizaciones en tiempo real' : 'Reconectando · actualización de respaldo cada 30 s'}</p><button className="text-button" disabled={loading} onClick={() => refresh.current()}>Actualizar chat</button></div>
    {error ? <div className="chat-state"><StatusMessage title="Conversación no disponible" tone="error">No pudimos consultar este chat. Revisá tu acceso y conexión.</StatusMessage><button className="text-button" onClick={() => refresh.current()}>Reintentar</button></div> : !header ? <div className="chat-state" role="status">{navigator.onLine ? 'Consultando conversación…' : 'Estás sin conexión. Reconectate para consultar el historial.'}</div> : <>
      {header.read_only && <p className="chat-read-only" role="status">Perfil no disponible · Conversación de sólo lectura. El historial permanece disponible.</p>}
      {hasOlder && <button className="text-button" disabled={loading} onClick={() => refresh.current(true)}>Cargar mensajes anteriores</button>}
      <ol className="chat-messages" ref={list} tabIndex={0} aria-label="Historial de mensajes privados" aria-busy={loading}>{!messages.length && <li>Todavía no hay mensajes. Iniciá la conversación con un texto.</li>}{messages.map(row => <li key={row.id} data-message-id={row.id} className={row.sender_id === viewer ? 'chat-own' : 'chat-incoming'}><div className="chat-message-meta"><strong>{row.sender_id === viewer ? 'Vos' : header.profile?.display_name ?? 'Perfil no disponible'}</strong></div><p className="chat-bubble">{row.body}</p><time dateTime={`${row.created_at}-03:00`}>{formatEventTime(row.created_at)}</time></li>)}</ol>
      <form className="chat-composer" onSubmit={send}><label htmlFor="direct-text">Mensaje privado</label><div><textarea id="direct-text" rows={2} value={text} onChange={event => setText(event.target.value)} disabled={header.read_only || !!operation} aria-describedby="direct-limit" /><GradientButton type="submit" disabled={header.read_only || !!operation || !trimDirectText(text) || [...trimDirectText(text)].length > 2000}>Enviar</GradientButton></div><p id="direct-limit">{[...trimDirectText(text)].length}/2000 caracteres · Sólo texto</p>
      </form>
    </>}
    {operation && <div className="direct-send-state" role="status">{operation.status === 'pending' ? 'Enviando mensaje…' : <>No pudimos confirmar el envío.<button className="text-button" disabled={checking} onClick={() => void reconcile()}>Consultar estado</button>{notice.startsWith('Todavía') && <button className="text-button" disabled={!header || header.read_only || checking} onClick={() => void retry()}>Reintentar mismo mensaje</button>}</>}</div>}
    {notice && <p className="direct-send-state" role="status">{notice}</p>}
  </section>
}
