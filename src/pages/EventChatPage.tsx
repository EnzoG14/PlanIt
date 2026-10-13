import { useLayoutEffect, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { chatUnavailable, loadChat, loadChatMessages, sendChatMessage, type ChatHeader, type ChatMessage } from '../features/events/chat'
import { formatEventTime } from '../features/events/validation'
import { supabase } from '../lib/supabase'
import { catchUp, compareRows, createReconciler, mergeRows } from '../lib/reconciliation'
import { subscribeToChanges, type ConnectionState } from '../lib/realtime'
import './chat.css'

export function EventChatPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <ChatContent key={`${id}:${session?.user.id}`} eventId={id} userId={session?.user.id ?? ''} />
}
function ChatContent({ eventId, userId }: { eventId: string; userId: string }) {
  const [header, setHeader] = useState<ChatHeader | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasOlder, setHasOlder] = useState(false)
  const [pending, setPending] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [text, setText] = useState('')
  const mounted = useRef(false)
  const sendBusy = useRef(false)
  const retry = useRef<{ id: string; body: string } | null>(null)
  const list = useRef<HTMLOListElement>(null)
  const refresh = useRef<(before?: ChatMessage) => void>(() => {})
  const scroll = useRef<{ bottom: boolean; height: number; top: number; older: boolean; anchor: string | null; offset: number } | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  useLayoutEffect(() => {
    const position = scroll.current, element = list.current
    if (!position || !element) return
    if (position.older) {
      const anchor = [...element.children].find(child => child.getAttribute('data-message-id') === position.anchor)
      if (anchor) element.scrollTop += anchor.getBoundingClientRect().top - element.getBoundingClientRect().top - position.offset
      else element.scrollTop = position.top + element.scrollHeight - position.height
    }
    else if (position.bottom) element.scrollTop = element.scrollHeight
    scroll.current = null
  }, [messages])
  const hasMessages = messages.length > 0
  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    let height = element.clientHeight
    let atBottom = element.scrollHeight - element.scrollTop - height < 64
    const onScroll = () => {
      if (height === element.clientHeight) atBottom = element.scrollHeight - element.scrollTop - height < 64
    }
    // Keep the latest message visible on keyboard/browser resize only for readers at the bottom.
    const observer = new ResizeObserver(() => {
      if (atBottom) element.scrollTop = element.scrollHeight
      height = element.clientHeight
    })
    observer.observe(element)
    element.addEventListener('scroll', onScroll)
    return () => { observer.disconnect(); element.removeEventListener('scroll', onScroll) }
  }, [hasMessages])
  useEffect(() => {
    let active = true
    mounted.current = true
    let cached: ChatMessage[] = [], initialized = false
    let older: ChatMessage | undefined, dirty = true, recovery = true
    let hint: ChatMessage | undefined
    let stopChannel: (() => void) | undefined, conversation = ''
    const queue = createReconciler(async () => {
      const before = older; older = undefined
      const sync = dirty; dirty = false
      const revalidate = recovery; recovery = false
      const boundaryHint = hint; hint = undefined
      setPending(true); setError('')
      const current = await loadChat(eventId)
      if (!active) return
      if (supabase && conversation !== current.conversation_id) {
        stopChannel?.(); conversation = current.conversation_id
        stopChannel = subscribeToChanges(supabase, 'chat:' + userId + ':' + conversation,
          [{ table: 'messages', event: 'INSERT', filter: 'conversation_id=eq.' + conversation }],
          change => {
            const row = change.new
            if (typeof row.id === 'string' && typeof row.created_at === 'string') {
              const candidate = { id: row.id, created_at: row.created_at } as ChatMessage
              if (!hint || compareRows(candidate, hint) < 0) hint = candidate
            }
            dirty = true; queue.request()
          }, () => { recovery = true; dirty = true; queue.request() }, setConnection)
      }
      const load = async (cursor?: ChatMessage) => {
        if (!active) return { items: [], hasMore: false }
        const rows = await loadChatMessages(eventId, cursor)
        return { items: rows.slice(0, 50), hasMore: rows.length > 50 }
      }
      let rows: ChatMessage[] = []
      if (!initialized || sync) {
        let boundary = revalidate ? cached[0] : cached.at(-1)
        if (boundaryHint && boundary && compareRows(boundaryHint, boundary) < 0) boundary = boundaryHint
        const result = await catchUp(load, boundary)
        rows = initialized && boundary ? result.items.filter(row => compareRows(row, boundary!) >= 0 || cached.some(item => item.id === row.id)) : result.items
        if (!result.items.length) cached = []
        if (!initialized && active) setHasOlder(result.hasMore)
      }
      if (before) {
        const result = await load(before)
        rows = mergeRows(rows, result.items)
        if (active) setHasOlder(result.hasMore)
      }
      if (!active) return
      const element = list.current
      const anchor = element && [...element.children].find(child => child.getBoundingClientRect().bottom > element.getBoundingClientRect().top)
      scroll.current = { anchor: anchor?.getAttribute('data-message-id') ?? null,
        offset: anchor && element ? anchor.getBoundingClientRect().top - element.getBoundingClientRect().top : 0, bottom: !element || element.scrollHeight - element.scrollTop - element.clientHeight < 64,
        height: element?.scrollHeight ?? 0, top: element?.scrollTop ?? 0, older: Boolean(before) }
      cached = mergeRows(cached, rows)
      initialized = true
      setHeader(current); setUnavailable(false); setMessages(cached); setPending(false)
    }, cause => {
      if (!active) return
      // A failed authorization never leaves private cached data or an active channel.
      cached = []; initialized = false; stopChannel?.(); stopChannel = undefined; conversation = ''
      setHeader(null); setMessages([]); setHasOlder(false); setPending(false)
      setUnavailable(chatUnavailable(cause)); setError('No pudimos consultar el chat. Revisá la conexión y reintentá.')
    })
    refresh.current = before => { if (before) older = before; else dirty = true; queue.request() }
    const onReturn = () => { if (document.visibilityState === 'visible') { recovery = true; refresh.current() } }
    // Also allows recovery when the initial authorization/header query failed.
    window.addEventListener('focus', onReturn); document.addEventListener('visibilitychange', onReturn)
    const authorizationTimer = window.setInterval(onReturn, 30000)
    queue.request()
    return () => {
      active = false; mounted.current = false; queue.dispose(); stopChannel?.(); refresh.current = () => {}
      window.clearInterval(authorizationTimer)
      window.removeEventListener('focus', onReturn); document.removeEventListener('visibilitychange', onReturn)
    }
  }, [eventId, userId])
  async function send(e: FormEvent) {
    e.preventDefault()
    if (sendBusy.current || pending || !header || header.event_state !== 'open' || !text.trim() || [...text.trim()].length > 2000) return
    sendBusy.current = true; setSending(true); setSendError('')
    const body = text.trim()
    if (retry.current?.body !== body) retry.current = { id: crypto.randomUUID(), body }
    try {
      await sendChatMessage(eventId, retry.current.id, body)
      if (!mounted.current) return
      setText(''); retry.current = null
      refresh.current()
    } catch {
      if (mounted.current) { setSendError('No pudimos confirmar el envío. Reintentá el mismo texto para evitar duplicados.'); refresh.current() }
    } finally { sendBusy.current = false; if (mounted.current) setSending(false) }
  }
  const closed = header && header.event_state !== 'open'
  return <section className="chat-page" aria-label="Chat del evento">
    <header className="chat-header"><Link className="icon-link" to={`/events/${eventId}`} aria-label="Volver al evento"><Icon name="back" /></Link><h1>{header?.title ?? 'Chat del evento'}</h1></header>
    <div className="chat-refresh"><p role="status">{connection === 'connected' ? 'Mensajes en tiempo real.' : connection === 'connecting' ? 'Conectando el chat…' : 'Conexión interrumpida. Recuperaremos los mensajes al reconectar.'}</p><button className="text-button" disabled={pending || sending} onClick={() => refresh.current()}>Actualizar chat</button></div>
    {unavailable ? <div className="chat-state"><StatusMessage title="Chat no disponible">Sólo el organizador y los asistentes confirmados pueden acceder.</StatusMessage></div> : error ? <div className="chat-state"><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage></div> : pending && !header ? <div className="chat-state"><StatusMessage title="Cargando chat">Esperá un momento.</StatusMessage></div> : <>
      {closed && <p className="chat-read-only" role="status">{header.event_state === 'ended' ? 'Evento finalizado' : header.event_state === 'archived' ? 'Evento archivado' : 'Evento cancelado'} · Chat de sólo lectura.</p>}
      {hasOlder && <button className="text-button" disabled={pending || sending} onClick={() => refresh.current(messages[0])}>Cargar mensajes anteriores</button>}
      {messages.length === 0 ? <div className="chat-state"><StatusMessage title="Todavía no hay mensajes">El historial de este evento está vacío.</StatusMessage></div> : <ol className="chat-messages" ref={list} tabIndex={0} aria-label="Historial de mensajes">{messages.map(message => <li key={message.id} data-message-id={message.id} className={message.sender_id === userId ? 'chat-own' : 'chat-incoming'}><div className="chat-message-meta"><strong>{message.sender_id === userId ? 'Vos' : message.display_name}</strong><span>@{message.username}</span></div><p className="chat-bubble">{message.body}</p><time dateTime={`${message.created_at}-03:00`}>{formatEventTime(message.created_at)}</time></li>)}</ol>}
      {!closed && <form className="chat-composer" onSubmit={send}><label htmlFor="chat-text">Mensaje</label><div><textarea id="chat-text" value={text} disabled={sending} onChange={e => setText(e.target.value)} placeholder="Escribí un mensaje…" rows={2} aria-describedby="chat-text-limit" /><button className="gradient-link gradient-button" disabled={pending || sending || !text.trim() || [...text.trim()].length > 2000} type="submit">{sending ? 'Enviando…' : 'Enviar'}</button></div><p id="chat-text-limit">{[...text.trim()].length}/2000 caracteres</p>{sendError && <p role="alert" className="field-error">{sendError}</p>}</form>}
    </>}
  </section>
}
