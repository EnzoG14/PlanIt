import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { createMediaAttempt, uploadEventMedia, type MediaAttempt } from '../media/uploads'
import { validateMediaImage } from '../media/images'
import { publishEventStory } from '../storiesApi'
import { Icon } from '../../../components/Icon'

export function StoryPublisher({ eventId, onClose, onPublished }: { eventId: string; onClose: () => void; onPublished: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const library = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null)
  const [attempt, setAttempt] = useState<{ media: MediaAttempt; storyId: string } | null>(null)
  const [preview, setPreview] = useState(''), [error, setError] = useState(''), [status, setStatus] = useState('')
  const [locked, setLocked] = useState(false), [busy, setBusy] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const sending = useRef(false), alive = useRef(true), selection = useRef(0), uploaded = useRef(false)
  useEffect(() => {
    alive.current = true
    const trigger = document.activeElement as HTMLElement | null, node = dialog.current!
    node.showModal(); node.querySelector<HTMLButtonElement>('.story-source-button')?.focus()
    return () => { alive.current = false; node.close(); trigger?.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])
  async function choose(file?: File) {
    if (!file || locked || sending.current) return
    const generation = ++selection.current
    setSelecting(true); setError(''); setAttempt(null); setPreview(''); setStatus('Revisando imagen…')
    try {
      await validateMediaImage(file)
      if (alive.current && selection.current === generation) {
        uploaded.current = false
        setAttempt({ media: createMediaAttempt(file, eventId, 'story'), storyId: crypto.randomUUID() }); setPreview(URL.createObjectURL(file)); setStatus('')
      }
    } catch (cause) { if (alive.current && selection.current === generation) { setStatus(''); setError(cause instanceof Error ? cause.message : 'Elegí una imagen válida.') } }
    finally { if (alive.current && selection.current === generation) setSelecting(false) }
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
    <input ref={library} hidden aria-label="Imagen de la historia" type="file" accept="image/jpeg,image/png,image/webp" disabled={locked || busy} onChange={e => { void choose(e.target.files?.[0]); e.target.value = '' }} />
    <input ref={camera} hidden aria-label="Tomar foto para la historia" type="file" accept="image/*" capture="user" disabled={locked || busy} onChange={e => { void choose(e.target.files?.[0]); e.target.value = '' }} />
    <div className={`story-selection${preview ? ' has-preview' : ''}`} aria-busy={selecting}>
      {preview ? <img className="story-preview" src={preview} alt="Vista previa de la imagen que vas a publicar" />
        : <div className="story-selection-empty"><Icon name="image" /><p>Compartí un momento del evento</p></div>}
    </div>
    <div className="story-sources">
      <button className="story-source-button" type="button" disabled={locked || busy || selecting} onClick={() => library.current?.click()}><Icon name="image" />{preview ? 'Cambiar imagen' : 'Elegir imagen'}</button>
      <button className="story-source-button" type="button" disabled={locked || busy || selecting} onClick={() => camera.current?.click()}><Icon name="camera" />Tomar foto</button>
    </div>
    {status && <p role="status">{status}</p>}
    {error && <p role="alert">{error}</p>}
    <button className="story-primary" type="button" disabled={!attempt || busy || selecting} onClick={() => void publish()}>{busy ? 'Publicando…' : locked ? 'Comprobar y reintentar' : 'Publicar historia'}</button>
    {locked && <p>Conservamos la misma imagen y sus identificadores hasta confirmar el resultado.</p>}
  </dialog>
}
