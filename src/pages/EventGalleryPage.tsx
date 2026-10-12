import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { loadEvent, type EventRecord } from '../features/events/api'
import { addImage, cleanupUpload, imageValidation, loadGallery, loadUnregisteredUploads, removeImage, reorderImages, type GalleryImage, type ImageAttempt } from '../features/events/gallery'
import { imageTypes } from '../features/events/validation'
import { validatedMyEventsReturn } from '../features/events/my-events'
import { StatusMessage } from '../components/StatusMessage'
import { Icon } from '../components/Icon'
import './event-gallery.css'

type PendingImage = { attempt: ImageAttempt; preview: string; status: string; error: string }
export function EventGalleryPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  return <GalleryContent key={`${id}:${session?.user.id}`} id={id} userId={session?.user.id ?? ''} />
}
function GalleryContent({ id, userId }: { id: string; userId: string }) {
  const location = useLocation()
  const origin = { myEventsReturnTo: validatedMyEventsReturn(location.state?.myEventsReturnTo) ?? undefined, returnTo: ['/home','/map'].includes(location.state?.returnTo) ? location.state.returnTo : undefined }
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [pending, setPending] = useState<PendingImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [unregistered, setUnregistered] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<GalleryImage | null>(null)
  const [failedPhotos, setFailedPhotos] = useState<string[]>([])
  const [revision, setRevision] = useState(0)
  const mounted = useRef(true)
  const locked = useRef(false)
  const previews = useRef<string[]>([])
  const dialog = useRef<HTMLDialogElement>(null)
  const removeButton = useRef<HTMLButtonElement | null>(null)
  useEffect(() => { mounted.current = true; const urls = previews.current; return () => { mounted.current = false; urls.forEach(URL.revokeObjectURL) } }, [])
  useEffect(() => {
    let active = true
    void loadEvent(id).then(async data => {
      if (!active) return
      setEvent(data)
      if (data?.organizer_id === userId) {
        const photos = await loadGallery(id)
        if (active) { setImages(photos); setFailedPhotos([]) }
      }
    }).catch(() => { if (active) setError('No pudimos cargar la galería. Revisá la conexión y reintentá.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, userId, revision])
  useEffect(() => {
    if (!pending.length) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending.length])
  useEffect(() => { if (confirm) dialog.current?.showModal(); else dialog.current?.close() }, [confirm])
  async function refresh() {
    const photos = await loadGallery(id)
    if (mounted.current) { setImages(photos); setFailedPhotos([]) }
  }
  async function operation(work: () => Promise<void>) {
    if (locked.current) return
    locked.current = true; setBusy(true); setError(''); setNotice('')
    try { await work() }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'No pudimos confirmar la operación. Actualizá y reintentá.') }
    finally { locked.current = false; if (mounted.current) setBusy(false) }
  }
  function select(files: File[]) {
    if (locked.current) return
    setError('')
    if (files.length + images.length + pending.length > 10) { setError('Podés guardar hasta diez imágenes. Quitá una o seleccioná menos archivos.'); return }
    const valid: PendingImage[] = []
    for (const file of files) {
      const invalid = imageValidation(file)
      if (invalid) { setError(`${file.name}: ${invalid}`); continue }
      const preview = URL.createObjectURL(file); previews.current.push(preview)
      valid.push({ attempt: { file, path: `${userId}/${id}/${crypto.randomUUID()}.${['jpg','png','webp'][imageTypes.indexOf(file.type)]}`, uploaded: false }, preview, status: 'Lista para subir', error: '' })
    }
    setPending(items => [...items, ...valid])
  }
  function updatePending(item: PendingImage, patch: Partial<PendingImage>) { if (mounted.current) setPending(items => items.map(row => row.attempt.path === item.attempt.path ? { ...row, ...patch } : row)) }
  async function upload(item: PendingImage) {
    updatePending(item, { error: '' })
    try {
      await addImage(id, item.attempt, status => updatePending(item, { status }))
      if (!mounted.current) return
      setPending(items => items.filter(row => row.attempt.path !== item.attempt.path))
      await refresh(); setNotice('Imagen guardada.')
    } catch (e) {
      updatePending(item, { status: 'Carga pendiente', error: e instanceof Error ? e.message : 'No se pudo completar. Reintentá la misma carga.' })
    }
  }
  function closeConfirm() { setConfirm(null); removeButton.current?.focus() }
  if (loading) return <StatusMessage title="Cargando galería">Esperá un momento.</StatusMessage>
  if (!event || event.organizer_id !== userId) return <><StatusMessage title={error ? 'No se pudo cargar' : 'Galería no disponible'}>{error || 'Sólo el organizador puede administrar las imágenes del evento.'}</StatusMessage>{error && <button className="secondary-button" onClick={() => setRevision(n => n+1)}>Reintentar</button>}<Link to={`/events/${id}`} state={origin}>Volver al evento</Link></>
  return <div className="gallery-page">
    <Link className="secondary-link" to={`/events/${id}`} state={origin}><Icon name="back" />Volver al evento</Link>
    <header><h1>Galería de imágenes</h1><p>Agregá y gestioná las imágenes de tu evento</p><strong>{event.title}</strong></header>
    <section className="gallery-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); select(Array.from(e.dataTransfer.files)) }} aria-label="Agregar imágenes">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 17a5 5 0 0 1-1-10 7 7 0 0 1 14-1 5 5 0 0 1-1 11M12 21V10m-4 4 4-4 4 4" /></svg>
      <label className="gallery-picker"><span>Seleccionar imágenes</span><input aria-label="Seleccionar imágenes" type="file" accept={imageTypes.join(',')} multiple disabled={busy || images.length + pending.length >= 10} onChange={e => { select(Array.from(e.target.files ?? [])); e.target.value = '' }} /></label>
      <p>Arrastrá y soltá o seleccioná archivos</p><small>JPEG, PNG y WebP · hasta 5 MiB por imagen</small>
      <strong aria-live="polite">{images.length} / 10 guardadas{pending.length > 0 && ` · ${pending.length} pendientes`}</strong>
    </section>
    {error && <p role="alert" className="field-error">{error}</p>}
    <p role="status" className="gallery-notice">{busy ? 'Procesando…' : notice}</p>
    <button className="text-button" disabled={busy} onClick={() => void operation(refresh)}>Actualizar galería y renovar fotos</button>
    <button className="text-button" disabled={busy} onClick={() => void operation(async () => { const paths = await loadUnregisteredUploads(id); setUnregistered(paths.filter(path => !pending.some(item => item.attempt.path === path))); setNotice(paths.length ? 'Encontramos cargas sin guardar. Podés limpiarlas.' : 'No hay cargas sin guardar.') })}>Revisar cargas interrumpidas</button>
    {unregistered.length > 0 && <section className="gallery-recovery"><p>{unregistered.length} cargas sin registrar. Cerrá otras sesiones de carga antes de limpiarlas.</p><button className="secondary-button" disabled={busy} onClick={() => void operation(async () => { for (const path of unregistered) await cleanupUpload(path); setUnregistered([]); setNotice('Limpieza completada.'); await refresh() })}>Limpiar cargas sin guardar</button></section>}
    <p className="field-hint">La primera imagen será la portada. Usá los controles para cambiar el orden.</p>
    {!images.length && <p>Tu evento todavía no tiene imágenes. Seleccioná la primera para agregar una portada.</p>}
    <ol className="gallery-grid" aria-label="Imágenes guardadas">{images.map((image, index) => <li key={image.id} className={index === 0 ? 'is-cover' : ''}>
      <div className="gallery-photo">{image.url && !failedPhotos.includes(image.id) ? <img src={image.url} alt={`Imagen ${index+1} de ${event.title}`} onError={() => setFailedPhotos(ids => [...ids,image.id])} /> : <span>Foto no disponible. Renovala con Actualizar.</span>}{index === 0 && <span className="gallery-cover">Portada</span>}
        <button className="gallery-remove" disabled={busy} aria-label={`Quitar imagen ${index+1}`} onClick={e => { removeButton.current = e.currentTarget; setConfirm(image) }}>×</button></div>
      <div className="gallery-order">{[-1,1].map(direction => <button key={direction} className="text-button" aria-label={`Mover imagen ${index+1} ${direction === -1 ? 'antes' : 'después'}`} disabled={busy || index+direction < 0 || index+direction >= images.length} onClick={() => void operation(async () => {
        const ids = images.map(row => row.id); [ids[index],ids[index+direction]] = [ids[index+direction],ids[index]]
        await reorderImages(id, ids, images.map(row => row.id)); await refresh(); setNotice('Orden guardado.')
      })}>{direction === -1 ? '← Antes' : 'Después →'}</button>)}</div>
    </li>)}</ol>
    {pending.length > 0 && <section aria-label="Cargas pendientes"><h2>Imágenes por subir</h2><p>Las vistas previas se guardan al subir cada imagen.</p><ul className="gallery-grid">{pending.map(item => <li key={item.attempt.path}><div className="gallery-photo"><img src={item.preview} alt={`Vista previa de ${item.attempt.file.name}`} /></div><p className="gallery-filename">{item.attempt.file.name}</p><p role="status">{item.status}</p>{busy && item.status.endsWith('…') && <progress aria-label={`Carga de ${item.attempt.file.name}`} />}{item.error && <p className="field-error" role="alert">{item.error}</p>}<div className="gallery-pending-actions"><button className="secondary-button" disabled={busy} onClick={() => void operation(() => upload(item))}>{item.error ? 'Reintentar carga' : 'Subir imagen'}</button><button className="text-button" disabled={busy} onClick={() => void operation(async () => { await cleanupUpload(item.attempt.path); setPending(rows => rows.filter(row => row.attempt.path !== item.attempt.path)); await refresh() })}>Descartar y limpiar</button></div></li>)}</ul></section>}
    <dialog ref={dialog} className="gallery-dialog" onCancel={e => { e.preventDefault(); if (!busy) closeConfirm() }} aria-labelledby="gallery-confirm-title"><h2 id="gallery-confirm-title">¿Quitar esta imagen?</h2><p>Dejará de aparecer en este evento. Las imágenes usadas en otros eventos se conservarán.</p>{error && <p role="alert" className="field-error">{error}</p>}<div><button className="secondary-button" autoFocus disabled={busy} onClick={closeConfirm}>Conservar imagen</button><button className="secondary-button" disabled={busy} onClick={() => void operation(async () => { if (!confirm) return; await removeImage(id, confirm.id); closeConfirm(); await refresh(); setNotice('Imagen quitada.') })}>Quitar imagen</button></div></dialog>
  </div>
}
