import { useEffect, useRef, useState } from 'react'
import { downloadStoryImage, type EventStory } from '../storiesApi'
import { formatEventTime } from '../validation'

export function StoryViewer({ stories, initialId, userId, durationMs = 5000, paused, setPaused, onClose, onSelect }: {
  stories: EventStory[]; initialId: string; userId: string; durationMs?: number; paused: boolean; setPaused: (value: boolean | ((previous: boolean) => boolean)) => void; onClose: () => void; onSelect: (id: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const story = stories.find(s => s.id === initialId)!
  const index = stories.indexOf(story)
  const [url, setUrl] = useState(''), [error, setError] = useState(''), [loaded, setLoaded] = useState(false)
  const [retry, setRetry] = useState(0), [progress, setProgress] = useState(0)
  const [held, setHeld] = useState(false), [inactive, setInactive] = useState(false)
  const running = !paused && !held && !inactive && loaded && !error
  const pressedAt = useRef(0)
  const select = useRef(onSelect), close = useRef(onClose)
  useEffect(() => { select.current = onSelect; close.current = onClose }, [onSelect, onClose])
  function move(delta: number) {
    const next = stories[index + delta]
    if (next) onSelect(next.id)
    else if (delta > 0) onClose()
  }
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const node = dialog.current!
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node.showModal()
    node.querySelector<HTMLButtonElement>('button')?.focus()
    const visibility = () => setInactive(document.hidden || !document.hasFocus())
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const reduce = () => { if (media.matches) setPaused(true) }
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', visibility); window.addEventListener('focus', visibility); media.addEventListener('change', reduce)
    return () => { node.close(); document.body.style.overflow = overflow; trigger?.focus({ preventScroll: true }); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', visibility); window.removeEventListener('focus', visibility); media.removeEventListener('change', reduce) }
  }, [setPaused])
  useEffect(() => {
    const controller = new AbortController(); let objectUrl = ''
    void downloadStoryImage(story.id, userId, controller.signal).then(blob => {
      if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) }
    }).catch(() => { if (!controller.signal.aborted) setError('La imagen venció, no está disponible o ya no tenés acceso.') })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [story.id, userId, retry])
  useEffect(() => {
    if (!running) return
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now(), elapsed = now - previous; previous = now
      setProgress(p => Math.min(1, p + elapsed / Math.max(1000, durationMs)))
    }, 50)
    return () => clearInterval(timer)
  }, [running, durationMs])
  useEffect(() => { if (progress >= 1) { const next = stories[index + 1]; if (next) select.current(next.id); else close.current() } }, [progress, stories, index])
  return <dialog className="story-viewer event-stories" ref={dialog} aria-label="Visor de historias" onCancel={e => { e.preventDefault(); onClose() }} onKeyDown={e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1) }
    if (e.key === 'Tab') {
      const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
      e.preventDefault(); buttons[(current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
  }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInactive(true) }} onFocus={() => setInactive(document.hidden)}>
    <div className="story-progress" aria-hidden="true">{stories.map((s, i) => <span key={s.id}><i style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }} /></span>)}</div>
    <header><div><strong>{story.display_name || 'Participante'}</strong><p><time dateTime={`${story.created_at}-03:00`}>{formatEventTime(story.created_at)}</time></p><p role="status" aria-live="polite">Historia {index + 1} de {stories.length}</p></div><button type="button" onClick={onClose}>Cerrar</button></header>
    <div className="story-image" onPointerDown={e => { if ((e.target as HTMLElement).closest('button')) return; pressedAt.current = performance.now(); e.currentTarget.setPointerCapture(e.pointerId); setHeld(true) }} onPointerUp={e => {
      setHeld(false)
      if (performance.now() - pressedAt.current > 250 || (e.target as HTMLElement).closest('button')) return
      const bounds = e.currentTarget.getBoundingClientRect(), position = (e.clientX - bounds.left) / bounds.width
      if (position < .3) move(-1)
      else if (position > .7) move(1)
    }} onPointerCancel={() => setHeld(false)} onLostPointerCapture={() => setHeld(false)}>
      {!error && url && <img src={url} alt={`Imagen compartida por ${story.display_name || 'un participante'}`} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setError('No pudimos mostrar la imagen.') }} />}
      {!loaded && !error && <p role="status">Cargando imagen…</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => { setUrl(''); setError(''); setLoaded(false); setRetry(n => n + 1) }}>Reintentar imagen</button></div>}
    </div>
    <footer><button type="button" disabled={index === 0} onClick={() => move(-1)}>Anterior</button><button type="button" aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? 'Reanudar' : 'Pausar'}</button><button type="button" onClick={() => move(1)}>{index === stories.length - 1 ? 'Finalizar' : 'Siguiente'}</button></footer>
  </dialog>
}
