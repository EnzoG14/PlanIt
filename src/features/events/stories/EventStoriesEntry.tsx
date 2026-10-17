import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { loadEventStories, type EventStory, type StoryCursor } from '../storiesApi'
import { StoryViewer } from './StoryViewer'
import { StoryPublisher } from './StoryPublisher'
import './stories.css'

export type StoriesPermissions = { can_read_stories: boolean; can_publish_story: boolean }
export type EventStoriesEntryProps = { eventId: string; returnTo: string; permissions: StoriesPermissions; durationMs?: number }

// B11 mounts this in the authorized detail. Booleans are presentation only;
// RPC/Edge independently authorize every read and publication.
export function EventStoriesEntry(props: EventStoriesEntryProps) {
  const { session } = useAuth()
  if (!session || !props.permissions.can_read_stories) return null
  return <StoriesContent key={`${props.eventId}:${session.user.id}:${session.access_token}`} {...props} userId={session.user.id} />
}

function StoriesContent({ eventId, permissions, durationMs, userId }: EventStoriesEntryProps & { userId: string }) {
  const [items, setItems] = useState<EventStory[]>([])
  const [cursor, setCursor] = useState<StoryCursor | null>(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [viewer, setViewer] = useState<string | null>(null), [publisher, setPublisher] = useState(false)
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [revision, setRevision] = useState(0), [more, setMore] = useState(false)
  const deadlines = useRef(new Map<string, number>())
  const pageCount = useRef(1)
  const cursorRef = useRef(cursor)
  useEffect(() => { cursorRef.current = cursor }, [cursor])
  useEffect(() => {
    const controller = new AbortController()
    const next = more ? cursorRef.current : null
    const started = performance.now()
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError('') } })
    void (async () => {
      const pages = [await loadEventStories(eventId, next, 30, controller.signal)]
      if (!next) for (let i = 1; i < pageCount.current && pages.at(-1)!.next_cursor; i++) pages.push(await loadEventStories(eventId, pages.at(-1)!.next_cursor, 30, controller.signal))
      return pages
    })().then(pages => {
      if (controller.signal.aborted || document.hidden) return
      if (next) pageCount.current++
      for (const page of pages) {
        const server = Date.parse(`${page.server_now.replace(' ', 'T')}-03:00`)
        for (const story of page.items) {
          const expires = Date.parse(`${story.expires_at.replace(' ', 'T')}-03:00`)
          // Monotonic elapsed time; device wall-clock changes cannot extend TTL.
          deadlines.current.set(story.id, started + Math.max(0, expires - server))
        }
      }
      setItems(previous => [...new Map((next ? [...previous, ...pages.flatMap(p => p.items)] : pages.flatMap(p => p.items)).map(s => [s.id, s])).values()])
      setCursor(pages.at(-1)!.next_cursor)
    }).catch(() => {
      if (!controller.signal.aborted) { setItems([]); setViewer(null); setError('No pudimos consultar las historias. Reintentá para comprobar tu acceso.') }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [eventId, revision, more])
  useEffect(() => {
    const expire = window.setInterval(() => setItems(previous => {
      const live = previous.filter(s => (deadlines.current.get(s.id) ?? 0) > performance.now())
      return live.length === previous.length ? previous : live
    }), 100)
    const revalidate = () => { setItems([]); setViewer(null); setMore(false); setRevision(n => n + 1) }
    const visibility = () => { if (document.hidden) { setItems([]); setViewer(null); setPublisher(false) } else revalidate() }
    window.addEventListener('focus', revalidate); window.addEventListener('online', revalidate)
    document.addEventListener('visibilitychange', visibility)
    // Poll authorization while visible; failure removes already rendered bytes.
    const poll = window.setInterval(() => { if (!document.hidden) { setMore(false); setRevision(n => n + 1) } }, 15000)
    return () => { clearInterval(expire); clearInterval(poll); window.removeEventListener('focus', revalidate); window.removeEventListener('online', revalidate); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  const authors = items.filter((story, index) => items.findIndex(s => s.author_id === story.author_id) === index)
  const selected = items.find(s => s.id === viewer)
  return <section className="event-stories" aria-label="Historias del evento">
    <header><h2>Historias del evento</h2><button type="button" disabled={loading} onClick={() => { setMore(false); setRevision(n => n + 1) }}>Actualizar</button></header>
    <p>Momentos compartidos durante 24 horas.</p>
    <div className="story-authors">
      {permissions.can_publish_story && <button type="button" className="story-author" aria-label="Publicar historia" onClick={() => setPublisher(true)}><span className="story-ring" aria-hidden="true">+</span>Publicar historia</button>}
      {authors.map(author => <button type="button" className="story-author" key={author.author_id} onClick={() => setViewer(author.id)}><span className="story-ring">{author.display_name.slice(0, 1) || 'P'}</span><span>{author.display_name || 'Participante'}</span><small>{items.filter(s => s.author_id === author.author_id).length} historias</small></button>)}
    </div>
    {!permissions.can_publish_story && <p>El evento no admite nuevas historias.</p>}
    {loading && <p role="status">Consultando historias…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => { setMore(false); setRevision(n => n + 1) }}>Reintentar</button></p>}
    {!loading && !error && !items.length && <p role="status">Todavía no hay historias vigentes.</p>}
    {cursor && !loading && <button type="button" onClick={() => { setMore(true); setRevision(n => n + 1) }}>Cargar más historias</button>}
    {selected && <StoryViewer key={selected.id} stories={items} initialId={selected.id} userId={userId} paused={paused} setPaused={setPaused} durationMs={durationMs} onClose={() => setViewer(null)} onSelect={setViewer} />}
    {publisher && permissions.can_publish_story && <StoryPublisher eventId={eventId} onClose={() => setPublisher(false)} onPublished={() => { setMore(false); setRevision(n => n + 1) }} />}
  </section>
}
