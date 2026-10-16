import { useLayoutEffect, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { chatSendFailure, chatUnavailable, downloadChatImage, findChatMessage, loadChat, loadChatMessages, sendChatMediaMessage, trimChatText, type ChatHeader, type ChatMessage } from '../features/events/chat'
import { createMediaAttempt, uploadEventMedia, MediaUploadError, type MediaAttempt } from '../features/events/media/uploads'
import { validateMediaImage } from '../features/events/media/images'
import { formatEventTime } from '../features/events/validation'
import { supabase } from '../lib/supabase'
import { catchUp, compareRows, createReconciler, mergeRows } from '../lib/reconciliation'
import { subscribeToChanges, type ConnectionState } from '../lib/realtime'
import './chat.css'

export function EventChatPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <ChatContent key={`${id}:${session?.user.id}`} eventId={id} userId={session?.user.id ?? ''} sessionToken={session?.access_token ?? ''} />
}
function ChatContent({ eventId, userId, sessionToken }: { eventId: string; userId: string; sessionToken: string }) {
  const [header, setHeader] = useState<ChatHeader | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasOlder, setHasOlder] = useState(false)
  const [pending, setPending] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [text, setText] = useState('')
  const [media, setMedia] = useState<MediaAttempt | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [phase, setPhase] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [canRetry, setCanRetry] = useState(false)
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const selectionVersion = useRef(0)
  const mounted = useRef(false)
  const sendBusy = useRef(false)
  const retry = useRef<{ id: string; body: string; media: MediaAttempt | null; uploaded: boolean } | null>(null)
  const list = useRef<HTMLOListElement>(null)
  const refresh = useRef<(before?: ChatMessage) => void>(() => {})
  const scroll = useRef<{ bottom: boolean; height: number; top: number; older: boolean; anchor: string | null; offset: number } | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const body = trimChatText(text)
  useLayoutEffect(() => { if (!sending && notice) textarea.current?.focus() }, [sending, notice])
  useEffect(() => {
    return () => { selectionVersion.current += 1 }
  }, [])
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
  function confirmed() {
    retry.current = null; setText(''); setMedia(null); setUncertain(false); setCanRetry(false)
    setSendError(''); setNotice('Mensaje confirmado.'); refresh.current()
  }
  async function selectImage(files: FileList | null) {
    const version = ++selectionVersion.current
    if (!files?.length || sendBusy.current || uncertain) return
    setSendError(''); setNotice('')
    if (files.length !== 1) { setSendError('Elegí una sola imagen por mensaje.'); return }
    const file = files[0]
    setSelecting(true)
    try {
      await validateMediaImage(file)
      if (mounted.current && version === selectionVersion.current) { setMedia(createMediaAttempt(file, eventId, 'chat')); retry.current = null }
    } catch (cause) {
      if (mounted.current && version === selectionVersion.current) setSendError(cause instanceof Error ? cause.message : 'No pudimos leer la imagen.')
    } finally { if (mounted.current && version === selectionVersion.current) setSelecting(false) }
  }
  async function consult() {
    const attempt = retry.current
    if (!attempt || sendBusy.current) return
    if (!navigator.onLine) { setSendError('Estás sin conexión. Reconectate para consultar el envío.'); return }
    sendBusy.current = true; setSending(true); setPhase('Consultando envío…')
    try {
      const found = await findChatMessage(eventId, attempt.id)
      if (!mounted.current) return
      if (found && found.sender_id === userId && (found.body ?? '') === attempt.body && found.file_id === (attempt.media?.fileId ?? null)) confirmed()
      else if (found) { setSendError('El identificador pertenece a otro contenido. No se reenviará.'); setCanRetry(false) }
      else { setCanRetry(true); setSendError('El mensaje todavía no figura en el historial. Podés reintentar el mismo envío.'); refresh.current() }
    } catch { if (mounted.current) { setCanRetry(false); setSendError('No pudimos consultar el envío. Conservamos el contenido; volvé a consultar.'); refresh.current() } }
    finally { sendBusy.current = false; if (mounted.current) setSending(false) }
  }
  async function send(e: FormEvent) {
    e.preventDefault()
    // Background reconciliation must not disable a submit between pointerdown
    // and click. A loaded header gates UX; the RPC rechecks current permission.
    if (sendBusy.current || selecting || !header || (!uncertain && header.event_state !== 'open') || (uncertain && !canRetry) || (!body && !media) || [...body].length > 2000) return
    if (!navigator.onLine) { setSendError('Estás sin conexión. Conservamos el contenido para que reintentes al volver.'); return }
    sendBusy.current = true; setSending(true); setSendError(''); setNotice('')
    if (!retry.current || retry.current.body !== body || retry.current.media !== media) retry.current = { id: crypto.randomUUID(), body, media, uploaded: false }
    const attempt = retry.current
    let committing = false
    try {
      if (attempt.media && !attempt.uploaded) {
        setPhase('Subiendo y validando imagen…')
        if (!supabase) throw new Error('No pudimos conectar con el servidor.')
        await uploadEventMedia(supabase, attempt.media)
        attempt.uploaded = true
      }
      if (!mounted.current) return
      committing = true; setPhase('Enviando mensaje…')
      await sendChatMediaMessage(eventId, attempt.id, body, attempt.media?.fileId ?? null)
      if (mounted.current) confirmed()
    } catch (cause) {
      if (mounted.current) {
        if (committing) { const failure = chatSendFailure(cause); setSendError(failure.message); setUncertain(failure.uncertain); setCanRetry(false); if (!failure.uncertain) retry.current = null }
        else setSendError(cause instanceof MediaUploadError || cause instanceof Error ? cause.message : 'No pudimos subir la imagen. Reintentá con el mismo archivo.')
        refresh.current()
      }
    } finally { sendBusy.current = false; if (mounted.current) setSending(false) }
  }
  const closed = header && header.event_state !== 'open'
  return <section className="chat-page event-chat-page" aria-label="Chat del evento">
    <header className="chat-header"><Link className="icon-link" to={`/events/${eventId}`} aria-label="Volver al evento"><Icon name="back" /></Link><h1>{header?.title ?? 'Chat del evento'}</h1></header>
    <div className="chat-refresh"><p role="status">{connection === 'connected' ? 'Mensajes en tiempo real.' : connection === 'connecting' ? 'Conectando el chat…' : 'Conexión interrumpida. Recuperaremos los mensajes al reconectar.'}</p><button className="text-button" disabled={pending || sending} onClick={() => refresh.current()}>Actualizar chat</button></div>
    {unavailable ? <div className="chat-state"><StatusMessage title="Chat no disponible">Sólo el organizador y los asistentes confirmados pueden acceder.</StatusMessage></div> : error ? <div className="chat-state"><StatusMessage title="No se pudo cargar" tone="error">{error}</StatusMessage></div> : pending && !header ? <div className="chat-state"><StatusMessage title="Cargando chat">Esperá un momento.</StatusMessage></div> : <>
      {closed && <p className="chat-read-only" role="status">{header.event_state === 'ended' ? 'Evento finalizado' : header.event_state === 'archived' ? 'Evento archivado' : 'Evento cancelado'} · Chat de sólo lectura.</p>}
      {hasOlder && <button className="text-button" disabled={pending || sending} onClick={() => refresh.current(messages[0])}>Cargar mensajes anteriores</button>}
      {messages.length === 0 ? <div className="chat-state"><StatusMessage title="Todavía no hay mensajes">El historial de este evento está vacío.</StatusMessage></div> : <ol className="chat-messages" ref={list} tabIndex={0} aria-label="Historial de mensajes">{messages.map(message => <li key={message.id} data-message-id={message.id} className={message.sender_id === userId ? 'chat-own' : 'chat-incoming'}><div className="chat-message-meta"><strong>{message.sender_id === userId ? 'Vos' : message.display_name}</strong><span>@{message.username}</span></div>{message.body && <p className="chat-bubble">{message.body}</p>}{message.attachment_id && <ChatImage key={`${message.file_id}:${sessionToken}`} message={message} userId={userId} />}<time dateTime={`${message.created_at}-03:00`}>{formatEventTime(message.created_at)}</time></li>)}</ol>}
      {(!closed || uncertain) && <form className="chat-composer" onSubmit={send} aria-busy={sending || selecting}>
        <label htmlFor="chat-text">Mensaje{media ? ' (texto opcional)' : ''}</label>
        {media && <div className="chat-attachment-preview"><LocalPreview key={sessionToken} file={media.file} /><span>{media.file.name}</span><button type="button" className="text-button" disabled={sending || uncertain || selecting} onClick={() => { setMedia(null); retry.current = null; setSendError(''); fileInput.current?.focus() }}>Quitar imagen</button></div>}
        <div className="chat-compose-row"><textarea ref={textarea} id="chat-text" value={text} disabled={sending || uncertain} onChange={e => { setText(e.target.value); setNotice('') }} placeholder="Escribí un mensaje…" rows={2} aria-describedby="chat-text-limit" /><button className="gradient-link gradient-button" disabled={!header || sending || selecting || Boolean(closed) || (uncertain && !canRetry) || (!body && !media) || [...body].length > 2000} type="submit">{sending ? 'Enviando…' : uncertain ? 'Reintentar mismo mensaje' : 'Enviar'}</button></div>
        <div className="chat-attachment-controls"><label className="chat-file-label" aria-disabled={sending || uncertain || selecting || Boolean(closed)}>{media ? 'Reemplazar imagen' : 'Adjuntar imagen'}<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={sending || uncertain || selecting || Boolean(closed)} onChange={e => { void selectImage(e.target.files); e.target.value = '' }} aria-label={media ? 'Reemplazar imagen' : 'Adjuntar imagen'} /></label><p id="chat-text-limit">{[...body].length}/2000 caracteres</p></div>
        <p className="chat-file-help">Una imagen JPEG, PNG o WebP · hasta 5 MiB.</p>
        <p role="status">{sending ? phase : selecting ? 'Preparando vista previa…' : notice}</p>
        {sendError && <p role="alert" className="field-error">{sendError}</p>}
        {uncertain && <button type="button" className="text-button" disabled={sending} onClick={() => void consult()}>Consultar estado</button>}
      </form>}
    </>}
  </section>
}

function LocalPreview({ file }: { file: File }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let current = ''
    const sync = () => {
      if (current) URL.revokeObjectURL(current)
      current = document.visibilityState === 'visible' && navigator.onLine ? URL.createObjectURL(file) : ''
      setUrl(current)
    }
    sync(); document.addEventListener('visibilitychange', sync); window.addEventListener('offline', sync); window.addEventListener('online', sync)
    return () => { URL.revokeObjectURL(current); document.removeEventListener('visibilitychange', sync); window.removeEventListener('offline', sync); window.removeEventListener('online', sync) }
  }, [file])
  return url ? <img src={url} alt="Vista previa de la imagen seleccionada" /> : null
}

function ChatImage({ message, userId }: { message: ChatMessage; userId: string }) {
  const element = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { root: element.current?.closest('.chat-messages') })
    if (element.current) observer.observe(element.current)
    return () => observer.disconnect()
  }, [])
  const path = message.storage_path
  useEffect(() => {
    if (!visible) return
    let active = true, blobUrl = ''
    const controller = new AbortController()
    let lifetime: ReturnType<typeof setTimeout> | undefined
    const clear = () => { active = false; controller.abort(); if (blobUrl) URL.revokeObjectURL(blobUrl); setUrl(''); setLoading(false) }
    const hide = () => { if (document.visibilityState !== 'visible') clear() }
    const timeout = setTimeout(() => { clear(); setError('La descarga tardó demasiado. Reintentá.') }, 15000)
    setLoading(true); setError('')
    void downloadChatImage(message, userId, controller.signal).then(blob => {
      if (!active) return
      clearTimeout(timeout); blobUrl = URL.createObjectURL(blob); setUrl(blobUrl); setLoading(false)
      lifetime = setTimeout(clear, 30000)
    }).catch(cause => { if (active) { clearTimeout(timeout); clear(); setError(cause instanceof Error ? cause.message : 'Imagen no disponible.') } })
    document.addEventListener('visibilitychange', hide); window.addEventListener('offline', clear)
    return () => { clear(); clearTimeout(timeout); clearTimeout(lifetime); document.removeEventListener('visibilitychange', hide); window.removeEventListener('offline', clear) }
    // Metadata is immutable for a message; dependencies identify its authorized resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, path, userId, attempt])
  return <div ref={element} className="chat-image">
    {url ? <img src={url} alt={`Imagen compartida por ${message.display_name}`} onError={e => { URL.revokeObjectURL(e.currentTarget.src); setUrl(''); setError('No pudimos mostrar la imagen. Reintentá.') }} /> : <div className="chat-image-placeholder">{error && <p role="alert">{error}</p>}{loading ? <p role="status">Cargando imagen…</p> : <button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>Ver imagen</button>}</div>}
  </div>
}
