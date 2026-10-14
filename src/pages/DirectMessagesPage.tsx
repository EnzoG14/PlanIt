import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { loadDirectConversations, type DirectCursor } from '../features/social/messages'
import { loadSocialIdentity } from '../features/social/api'
import { useSocialRead } from '../features/social/useSocialRead'
import { SocialAvatar } from '../components/SocialAvatar'
import { StatusMessage } from '../components/StatusMessage'
import './direct-messages.css'

export function DirectMessagesPage() {
  const { session } = useAuth()
  return session ? <Inbox key={`${session.user.id}:${session.access_token}`} /> : null
}
function Inbox() {
  const [pages, setPages] = useState(1)
  const location = useLocation(), container = useRef<HTMLElement>(null)
  const restored = useRef(false)
  const load = useCallback(async (signal: AbortSignal) => {
    let cursor: DirectCursor | null = null
    const rows = []
    for (let index = 0; index < pages; index++) {
      const page = await loadDirectConversations(cursor, signal)
      for (const row of page.rows) rows.push({ ...row, identity: row.read_only ? null : await loadSocialIdentity(row.peer_id, signal) })
      cursor = page.next_cursor
      if (!cursor) break
    }
    return { rows, cursor }
  }, [pages])
  const { data, loading, error, refresh } = useSocialRead(load)
  useEffect(() => { document.title = 'Mensajes privados · PlanIt' }, [])
  useEffect(() => {
    if (!data || !location.state?.focusConversation || restored.current) return
    const frame = window.requestAnimationFrame(() => {
      const links = container.current?.querySelectorAll<HTMLAnchorElement>('a[data-conversation]')
      const link = links ? [...links].find(item => item.dataset.conversation === location.state.focusConversation) : null
      if (link) { link.focus(); restored.current = true }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [data, location.state])
  return <section ref={container} className="direct-inbox">
    <Link className="secondary-link" to="/me" state={{ focusMessages: true }}>Volver a mi perfil</Link>
    <header><h1>Mensajes privados</h1><button className="text-button" onClick={() => void refresh()} disabled={loading}>Actualizar mensajes</button></header>
    {loading ? <p role="status">Consultando conversaciones…</p> : error ? <><StatusMessage title="No pudimos consultar los mensajes" tone="error">{error}</StatusMessage><button className="text-button" onClick={() => void refresh()}>Reintentar</button></> : data && <>
      {!data.rows.length && <StatusMessage title="Todavía no tenés conversaciones">Podés enviar un mensaje desde el perfil de otra persona, sin necesidad de seguirla.</StatusMessage>}
      <ul>{data.rows.map(row => <li key={row.id}><Link data-conversation={row.id} to={`/messages/${row.id}`} state={{ directOrigin: '/messages' }}><SocialAvatar key={row.identity?.avatar ?? "none"} avatar={row.identity?.avatar ?? null} /><span><strong>{row.identity?.display_name ?? 'Perfil no disponible'}</strong>{row.identity && <span>@{row.identity.username}</span>}<span>{row.read_only || !row.identity ? 'Conversación de sólo lectura' : 'Abrir conversación'}</span></span><span aria-hidden="true">›</span></Link></li>)}</ul>
      {data.cursor && <button className="text-button" onClick={() => setPages(value => value + 1)}>Cargar más conversaciones</button>}
    </>}
  </section>
}
