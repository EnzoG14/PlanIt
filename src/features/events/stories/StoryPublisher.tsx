import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { createMediaAttempt, uploadEventMedia, type MediaAttempt } from '../media/uploads'
import { validateMediaImage } from '../media/images'
import { publishEventStory } from '../storiesApi'

export function StoryPublisher({ eventId, onClose, onPublished }: { eventId: string; onClose: () => void; onPublished: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [attempt, setAttempt] = useState<{ media: MediaAttempt; storyId: string } | null>(null)
  const [preview, setPreview] = useState(''), [error, setError] = useState(''), [status, setStatus] = useState('')
  const [locked, setLocked] = useState(false), [busy, setBusy] = useState(false)
  const sending = useRef(false), alive = useRef(true), selection = useRef(0), uploaded = useRef(false)
  useEffect(() => {
    alive.current = true
    const trigger = document.activeElement as HTMLElement | null, node = dialog.current!
    node.showModal(); node.querySelector<HTMLInputElement>('input')?.focus()
    return () => { alive.current = false; node.close(); trigger?.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])
  async function choose(file?: File) {
    if (!file || locked) return
    const generation = ++selection.current
    setError(''); setAttempt(null); setPreview(''); setStatus('Revisando imagen…')
    try {
      await validateMediaImage(file)
      if (alive.current && selection.current === generation) {
        uploaded.current = false
        setAttempt({ media: createMediaAttempt(file, eventId, 'story'), storyId: crypto.randomUUID() }); setPreview(URL.createObjectURL(file)); setStatus('')
      }
    } catch (cause) { if (alive.current && selection.current === generation) { setStatus(''); setError(cause instanceof Error ? cause.message : 'Elegí una imagen válida.') } }
  }
  async function publish() {
    if (!attempt || sending.current || !supabase) return
    sending.current = true; setBusy(true); setLocked(true); setError('')
    try {
      // Once upload is confirmed, retry only the same domain RPC. An uncertain
      // ACK cannot create a second story or extend TTL with these stable IDs.
      if (!uploaded.current) { setStatus('Subiendo y validando imagen…'); await uploadEventMedia(supabase, attempt.media); uploaded.current = true }
      if (!alive.current) return
      setStatus('Confirmando publicación…')
      await publishEventStory(eventId, attempt.storyId, attempt.media.fileId)
      if (alive.current) { setStatus('Historia publicada.'); setAttempt(null); setPreview(''); setLocked(false); onPublished() }
    } catch (cause) {
      if (alive.current) { setStatus(''); setError(`${cause instanceof Error ? cause.message : 'No pudimos confirmar la publicación.'} Reintentá el mismo intento para comprobar el resultado.`) }
    } finally { sending.current = false; if (alive.current) setBusy(false) }
  }
  return <dialog className="story-publisher event-stories" ref={dialog} aria-labelledby="story-publisher-title" onCancel={e => { e.preventDefault(); if (!busy) onClose() }}>
    <header><h2 id="story-publisher-title">Publicar historia</h2><button type="button" disabled={busy} onClick={onClose}>Cerrar</button></header>
    <p>Una imagen JPEG, PNG o WebP, de hasta 5 MiB. Disponible durante 24 horas.</p>
    <label>Imagen de la historia<input type="file" accept="image/jpeg,image/png,image/webp" disabled={locked || busy} onChange={e => void choose(e.target.files?.[0])} /></label>
    {preview && <img className="story-preview" src={preview} alt="Vista previa de la imagen que vas a publicar" />}
    {attempt && <p>{attempt.media.file.name}</p>}
    {status && <p role="status">{status}</p>}
    {error && <p role="alert">{error}</p>}
    <button className="story-primary" type="button" disabled={!attempt || busy} onClick={() => void publish()}>{busy ? 'Publicando…' : locked ? 'Comprobar y reintentar' : 'Publicar historia'}</button>
    {locked && <p>Conservamos la misma imagen y sus identificadores hasta confirmar el resultado.</p>}
  </dialog>
}
