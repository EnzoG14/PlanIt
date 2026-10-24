import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { actionLabels, checkEventAction, checkEventOperation, closeEvent, deleteEvent, EventActionError, type EventAction, type ManagedEvent } from '../features/events/actions'
import { Icon } from './Icon'
import './event-actions.css'

export function EventActionDialog({ event, action, onClose, onChanged, restoreFocus, origin, dismissLabel = 'Cancelar' }: {
  event: ManagedEvent; action: EventAction | null; onClose: () => void; onChanged: (message: string) => void
  dismissLabel?: string; restoreFocus?: () => void; origin: { myEventsReturnTo?: string; returnTo?: string }
}) {
  const operation = useRef(crypto.randomUUID())
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null), sending = useRef(false), mounted = useRef(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [uncertain, setUncertain] = useState(false)
  const labelId = useId(), descriptionId = useId()
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!action) return
    trigger.current = document.activeElement as HTMLElement
    const node = dialog.current
    node?.showModal(); cancel.current?.focus()
    return () => { node?.close() }
  }, [action])
  function close() {
    if (sending.current) return
    dialog.current?.close(); setError(''); setUncertain(false); onClose()
    if (restoreFocus) restoreFocus()
    else if (trigger.current?.isConnected) trigger.current.focus()
  }
  async function confirm() {
    if (!action || sending.current) return
    if (action === 'duplicate') {
      close()
      navigate(`/events/new?duplicateFrom=${event.id}`, { state: origin })
      return
    }
    const checking = uncertain
    sending.current = true; setBusy(true); setError('')
    let success = false
    try {
      if (uncertain) {
        if (!(action === 'delete' ? await checkEventOperation(event.id, operation.current, 'delete') : await checkEventAction(event.id, action))) {
          if (mounted.current) { setUncertain(false); setError('La operación no figura completada. Podés volver a confirmarla.') }
          return
        }
      } else if (action === 'delete') await deleteEvent(event.id, operation.current)
      else await closeEvent(event.id, action)
      success = true
    } catch (failure) {
      if (mounted.current) {
        setUncertain(checking || (failure instanceof EventActionError && failure.uncertain))
        setError(failure instanceof Error ? failure.message : 'No pudimos completar la operación.')
      }
    } finally {
      sending.current = false
      if (mounted.current) {
        setBusy(false)
        if (success) {
          const message = action === 'delete' ? 'El evento fue eliminado definitivamente.' : action === 'cancel' ? 'El evento fue cancelado. Sus datos e historial se conservan.' : 'El evento fue archivado. Podés consultarlo en Archivados.'
          close(); onChanged(message)
          if (action === 'delete' && location.pathname.startsWith(`/events/${event.id}`)) navigate(origin.myEventsReturnTo ?? '/my-events', { replace: true })
        }
      }
    }
  }
  return <dialog ref={dialog} className={`event-action-dialog action-${action ?? 'duplicate'}`} tabIndex={-1} aria-labelledby={labelId} aria-describedby={descriptionId} onCancel={e => { e.preventDefault(); close() }} onKeyDown={e => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (!buttons.length) e.currentTarget.focus()
    else buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
  }}>
    <button type="button" className="event-action-close" aria-label="Cerrar confirmación" disabled={busy} onClick={close}>×</button>
    <span className="event-action-symbol"><Icon name={action === 'cancel' ? 'pause' : action === 'delete' ? 'trash' : action === 'archive' ? 'archive' : 'copy'} /></span>
    <h2 id={labelId}>{action ? actionLabels[action] : ''}</h2>
    <p id={descriptionId}>{action === 'delete' ? `¿Querés eliminar definitivamente “${event.title}”? Se borrarán el evento, las inscripciones, el historial, el chat, las fotos, las historias y sus notificaciones para todos. No se puede deshacer. La limpieza de archivos puede terminar después.` : action === 'cancel' ? `¿Querés cancelar “${event.title}”? Se detendrán nuevas inscripciones y mensajes; los datos y el historial se conservan.` : action === 'archive' ? `¿Querés archivar “${event.title}”? Quedará fuera de los listados activos y seguirá en Archivados.${event.event_state === 'open' ? ' Como todavía no finalizó, también se cancelará.' : ''}` : 'Se abrirá un formulario editable con los datos de este evento, sin fechas ni fotos. Todavía no se guardará ningún evento nuevo.'}</p>
    {error && <p role="alert" className="field-error">{error}{uncertain && ' Comprobá el estado antes de intentar otra operación.'}</p>}
    <div className="event-action-dialog-buttons"><button type="button" ref={cancel} className="secondary-button" disabled={busy} onClick={close}>{dismissLabel}</button><button type="button" className={action === 'cancel' || action === 'delete' ? 'event-action-danger' : 'gradient-link'} disabled={busy} onClick={() => void confirm()}>{busy ? uncertain ? 'Comprobando…' : 'Procesando…' : uncertain ? 'Comprobar estado' : action === 'duplicate' ? 'Abrir formulario' : action === 'delete' ? 'Eliminar definitivamente' : action === 'archive' ? 'Archivar' : 'Cancelar evento'}</button></div>
  </dialog>
}
