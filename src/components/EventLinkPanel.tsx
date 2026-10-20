import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { EventRecord } from '../features/events/api'
import { argentinaNow } from '../features/events/validation'
import { loadEventLinkStatus, rotateEventLink } from '../features/events/links'
import { Icon } from './Icon'
import './event-links.css'

export function EventLinkPanel({ event, renderInviteAction }: { event: EventRecord; renderInviteAction?: (url: string) => ReactNode }) {
  const [hasLink, setHasLink] = useState<boolean | null>(null)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [url, setUrl] = useState(''), [copied, setCopied] = useState(false), [manual, setManual] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [ended, setEnded] = useState(() => event.ends_at <= argentinaNow())
  const mounted = useRef(false), sending = useRef(false), trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null), input = useRef<HTMLInputElement>(null)
  const titleId = useId(), descriptionId = useId(), inputId = useId()
  const closed = ended || Boolean(event.cancelled_at || event.archived_at)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    const check = () => setEnded(event.ends_at <= argentinaNow())
    const timer = window.setInterval(check, 30000)
    const delay = Date.parse(`${event.ends_at}-03:00`) - Date.now()
    const exact = delay > 0 && delay <= 2147483647 ? window.setTimeout(check, delay) : undefined
    return () => { window.clearInterval(timer); window.clearTimeout(exact) }
  }, [event.ends_at])
  useEffect(() => {
    let active = true
    loadEventLinkStatus(event.id).then(data => { if (active) setHasLink(data) }).catch(() => { if (active) setError('No pudimos comprobar el enlace. Actualizá antes de generar otro.') })
    return () => { active = false }
  }, [event.id, revision])
  function close() {
    if (sending.current) return
    dialog.current?.close(); setOpenDialog(false); setUrl(''); setCopied(false); setManual(false); setError('')
    trigger.current?.focus()
  }
  function open() { setError(''); setOpenDialog(true); dialog.current?.showModal(); cancel.current?.focus() }
  async function generate() {
    if (sending.current || closed) return
    sending.current = true; setBusy(true); setError(''); setUrl(''); setCopied(false); setManual(false)
    try {
      const result = await rotateEventLink(event.id)
      if (mounted.current) { setUrl(result); setHasLink(true); requestAnimationFrame(() => cancel.current?.focus()) }
    } catch (failure) {
      if (mounted.current) { setHasLink(true); setError(failure instanceof Error ? failure.message : 'No pudimos generar el enlace. Regenerá para reemplazarlo.') }
    } finally { sending.current = false; if (mounted.current) setBusy(false) }
  }
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard_unavailable')
      await navigator.clipboard.writeText(url)
      if (mounted.current) { setCopied(true); setManual(false) }
    } catch {
      if (mounted.current) { setManual(true); requestAnimationFrame(() => { input.current?.focus(); input.current?.select() }) }
    }
  }
  return <div className="event-link-panel" aria-label="Enlace de acceso">
    <h3>Enlace del evento oculto</h3>
    <p>{closed ? 'El evento terminó, fue cancelado o archivado. No admite nuevos accesos.' : 'El enlace se entrega una sola vez. Si lo perdiste, regeneralo; no podemos recuperar el anterior.'}</p>
    <button ref={trigger} type="button" className="secondary-button" disabled={closed || hasLink === null} onClick={open}><Icon name="copy" />{hasLink ? 'Regenerar enlace' : hasLink === null ? 'Comprobando enlace…' : 'Generar enlace'}</button>
    {error && !openDialog && <><p role="alert" className="field-error">{error}</p><button type="button" className="secondary-button" onClick={() => { setError(''); setRevision(value => value + 1) }}>Reintentar</button></>}
    <dialog ref={dialog} className="event-action-dialog event-link-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} onCancel={e => { e.preventDefault(); close() }} onKeyDown={e => {
      if (e.key !== 'Tab') return
      const nodes = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')]
      const index = nodes.indexOf(document.activeElement as HTMLElement)
      e.preventDefault()
      if (!nodes.length) e.currentTarget.focus()
      else nodes[(index + (e.shiftKey ? -1 : 1) + nodes.length) % nodes.length].focus()
    }}>
      <h2 id={titleId}>{url ? 'Guardá tu enlace' : hasLink ? 'Regenerar enlace' : 'Generar enlace'}</h2>
      <p id={descriptionId}>Al regenerar, el enlace anterior deja de funcionar para nuevos accesos; usuarios ya autorizados mantienen su permiso.</p>
      {url && <div className="form-field"><label htmlFor={inputId}>Enlace de acceso (una sola vez)</label><input ref={input} id={inputId} readOnly value={url} onFocus={e => e.currentTarget.select()} autoComplete="off" spellCheck={false} /><p className="field-hint">Al cerrar se borra de esta pantalla. Copialo antes de continuar.</p></div>}
      {manual && <p role="status">No pudimos usar el portapapeles. El enlace está seleccionado: copialo manualmente.</p>}
      {copied && <p role="status">Enlace copiado.</p>}
      {url && !closed && renderInviteAction?.(url)}
      {error && <p role="alert" className="field-error">{error}</p>}
      <div className="event-action-dialog-buttons"><button ref={cancel} type="button" className="secondary-button" disabled={busy} onClick={close}>{url ? 'Listo' : 'Volver'}</button>{url ? <button type="button" className="gradient-link" onClick={() => void copy()}>Copiar enlace</button> : <button type="button" className="gradient-link" disabled={busy || closed} onClick={() => void generate()}>{busy ? 'Generando…' : hasLink ? 'Confirmar regeneración' : 'Confirmar generación'}</button>}</div>
    </dialog>
  </div>
}
