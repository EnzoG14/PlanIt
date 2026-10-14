import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { changeUserBlock, loadBlockState } from '../features/social/blocks'
import { useSocialRead } from '../features/social/useSocialRead'
import './block-user-action.css'

export function BlockUserAction({ userId, disabled = false, revision = 0, onSafetyChange, onChanged }: {
  userId: string; disabled?: boolean; revision?: number; onSafetyChange: () => void; onChanged: () => void
}) {
  const { session } = useAuth()
  return !session || session.user.id === userId ? null : <Action key={`${userId}:${session.access_token}`} userId={userId} disabled={disabled} revision={revision} onSafetyChange={onSafetyChange} onChanged={onChanged} />
}
function Action({ userId, disabled, revision, onSafetyChange, onChanged }: {
  userId: string; disabled: boolean; revision: number; onSafetyChange: () => void; onChanged: () => void
}) {
  const load = useCallback((signal: AbortSignal) => { void revision; return loadBlockState(userId, signal) }, [userId, revision])
  const { data, loading, error, refresh } = useSocialRead(load)
  const [action, setAction] = useState<boolean | null>(null), [busy, setBusy] = useState(false)
  const [uncertain, setUncertain] = useState(false), [message, setMessage] = useState(''), [notice, setNotice] = useState('')
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const request = useRef<AbortController | null>(null), alive = useRef(false)
  const expected = useRef(false)
  const restoreFocus = useRef(false)
  const title = useId(), description = useId()
  useEffect(() => {
    alive.current = true
    const abort = () => request.current?.abort()
    const hidden = () => { if (document.visibilityState !== 'visible') abort() }
    window.addEventListener('offline', abort); document.addEventListener('visibilitychange', hidden)
    return () => { alive.current = false; abort(); window.removeEventListener('offline', abort); document.removeEventListener('visibilitychange', hidden) }
  }, [])
  useEffect(() => {
    if (action === null) return
    const node = dialog.current
    node?.showModal(); cancel.current?.focus()
    return () => node?.close()
  }, [action])
  useEffect(() => {
    if (restoreFocus.current && action === null && !loading && !busy && trigger.current?.isConnected) {
      trigger.current.focus(); restoreFocus.current = false
    }
  }, [action, loading, busy, data])
  function close() {
    if (request.current) return
    restoreFocus.current = true
    dialog.current?.close(); setAction(null); setMessage('')
    if (trigger.current?.isConnected) trigger.current.focus()
  }
  async function confirm() {
    if (action === null || request.current) return
    const controller = new AbortController(), checking = uncertain
    request.current = controller; setBusy(true); setMessage(''); setNotice(''); onSafetyChange()
    const timer = window.setTimeout(() => controller.abort(), 10000)
    try {
      if (!checking) await changeUserBlock(userId, action, controller.signal)
      const current = await loadBlockState(userId, controller.signal)
      if (!alive.current || controller.signal.aborted) throw new Error('uncertain')
      if (current.blockedByMe !== action) {
        setUncertain(false); setMessage('El cambio no figura completado. Podés volver a confirmarlo.'); onChanged()
        return
      }
      request.current = null
      setUncertain(false); close(); setNotice(action ? 'Bloqueo confirmado. Los seguimientos y solicitudes entre ambas cuentas se eliminaron.' : 'Desbloqueo confirmado. Los seguimientos anteriores no se restauran.')
      void refresh(); onChanged()
    } catch {
      if (alive.current) { setUncertain(true); setMessage('No pudimos confirmar el resultado. Consultá el estado antes de volver a operar.') }
    } finally {
      window.clearTimeout(timer); request.current = null
      if (alive.current) setBusy(false)
    }
  }
  return <div className="block-user-action" aria-busy={busy}>
    {uncertain ? <button ref={trigger} className="text-button" disabled={busy} onClick={() => setAction(expected.current)}>Consultar estado del bloqueo</button> : loading && action === null ? <p role="status">Consultando opciones de bloqueo…</p> : error ? <><p role="alert">No pudimos consultar las opciones de bloqueo.</p><button className="text-button" onClick={() => void refresh()}>Reintentar opciones</button></> : data && (data.available || data.blockedByMe) && <button ref={trigger} className="text-button" disabled={disabled || busy} onClick={() => { setNotice(''); expected.current = !data.blockedByMe; setAction(expected.current) }}>{data.blockedByMe ? 'Desbloquear usuario' : 'Bloquear usuario'}</button>}
    {notice && <p role="status">{notice}</p>}
    <dialog ref={dialog} className="block-user-dialog" aria-labelledby={title} aria-describedby={description} onCancel={event => { event.preventDefault(); close() }}>
      <h2 id={title}>{action ? 'Bloquear usuario' : 'Desbloquear usuario'}</h2>
      <p id={description}>{action ? 'Se eliminarán los seguimientos y solicitudes en ambos sentidos. No podrán consultar sus perfiles ni enviarse nuevos mensajes privados. El historial y el chat de los eventos se conservan.' : 'Se habilitarán las interacciones si no hay otro bloqueo entre las cuentas. Se reutilizará la conversación privada y los seguimientos anteriores no se restaurarán.'}</p>
      {message && <p className="field-error" role="alert">{message}</p>}
      <div className="block-user-dialog-actions"><button ref={cancel} className="secondary-button" disabled={busy} onClick={close}>{uncertain ? 'Cerrar' : 'Cancelar'}</button><button className={action ? 'block-user-danger' : 'gradient-link gradient-button'} disabled={busy} onClick={() => void confirm()}>{busy ? 'Consultando…' : uncertain ? 'Consultar estado' : action ? 'Confirmar bloqueo' : 'Confirmar desbloqueo'}</button></div>
    </dialog>
  </div>
}
