import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { chatUnavailable, loadChat, loadChatMessages, sendChatMessage, type ChatHeader, type ChatMessage } from '../features/events/chat'
import { formatEventTime } from '../features/events/validation'
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
  const busy = useRef(false)
  const sendBusy = useRef(false)
  const retry = useRef<{ id: string; body: string } | null>(null)
  const list = useRef<HTMLOListElement>(null)
  const refresh = useCallback(async (before?: ChatMessage) => {
    if (busy.current) return
    busy.current = true
    setPending(true); setError('')
    try {
      const current = await loadChat(eventId)
      const rows = await loadChatMessages(eventId, before)
      if (!mounted.current) return
      setHeader(current); setUnavailable(false); setHasOlder(rows.length > 50)
      const page = rows.slice(0, 50).reverse()
      setMessages(previous => before ? [...page, ...previous].filter((row, index, all) => all.findIndex(item => item.id === row.id) === index) : page)
      if (!before) requestAnimationFrame(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight })
    } catch (cause) {
      if (!mounted.current) return
      // Clear all cached chat data after any failed authorization/refresh.
      setHeader(null); setMessages([]); setHasOlder(false)
      setUnavailable(chatUnavailable(cause)); setError('No pudimos consultar el chat. Revisá la conexión y reintentá.')
    } finally { busy.current = false; if (mounted.current) setPending(false) }
  }, [eventId])
  useEffect(() => {
    mounted.current = true
    const timer = window.setTimeout(() => void refresh(), 0)
    const focus = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', focus)
    return () => { mounted.current = false; window.clearTimeout(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus) }
  }, [refresh])
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
      await refresh()
    } catch {
      if (mounted.current) { setSendError('No pudimos confirmar el envío. Reintentá el mismo texto para evitar duplicados.'); await refresh() }
    } finally { sendBusy.current = false; if (mounted.current) setSending(false) }
  }
  const closed = header && header.event_state !== 'open'
  return <section className="chat-page" aria-label="Chat del evento">
    <header className="chat-header"><Link className="secondary-link" to={`/events/${eventId}`} aria-label="Volver al evento"><Icon name="back" /></Link><span className="chat-event-icon" aria-hidden="true"><Icon name="calendar" /></span><div><h1>{header?.title ?? 'Chat del evento'}</h1><p>Organizador y asistentes confirmados</p></div></header>
    <div className="chat-refresh"><p>Actualizá para consultar nuevos mensajes.</p><button className="text-button" disabled={pending || sending} onClick={() => void refresh()}>Actualizar chat</button></div>
    {unavailable ? <StatusMessage title="Chat no disponible">Sólo el organizador y los asistentes confirmados pueden acceder.</StatusMessage> : error ? <StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage> : pending && !header ? <StatusMessage title="Cargando chat">Esperá un momento.</StatusMessage> : <>
      {closed && <p className="chat-read-only" role="status">{header.event_state === 'ended' ? 'Evento finalizado' : header.event_state === 'archived' ? 'Evento archivado' : 'Evento cancelado'} · Chat de sólo lectura.</p>}
      {hasOlder && <button className="text-button" disabled={pending || sending} onClick={() => void refresh(messages[0])}>Cargar mensajes anteriores</button>}
      {messages.length === 0 ? <StatusMessage title="Todavía no hay mensajes">El historial de este evento está vacío.</StatusMessage> : <ol className="chat-messages" ref={list} aria-label="Historial de mensajes">{messages.map(message => <li key={message.id} className={message.sender_id === userId ? 'chat-own' : 'chat-incoming'}><div className="chat-message-meta"><strong>{message.sender_id === userId ? 'Vos' : message.display_name}</strong><span>@{message.username}</span></div><p className="chat-bubble">{message.body}</p><time dateTime={`${message.created_at}-03:00`}>{formatEventTime(message.created_at)}</time></li>)}</ol>}
      {!closed && <form className="chat-composer" onSubmit={send}><label htmlFor="chat-text">Mensaje</label><div><textarea id="chat-text" value={text} disabled={sending} onChange={e => setText(e.target.value)} placeholder="Escribí un mensaje…" rows={2} aria-describedby="chat-text-limit" /><button className="gradient-link gradient-button" disabled={pending || sending || !text.trim() || [...text.trim()].length > 2000} type="submit">{sending ? 'Enviando…' : 'Enviar'}</button></div><p id="chat-text-limit">{[...text.trim()].length}/2000 caracteres</p></form>}
    </>}
    {sendError && <p role="alert" className="field-error">{sendError}</p>}
  </section>
}
