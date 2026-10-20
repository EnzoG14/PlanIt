import { useEffect, useId, useRef, useState } from 'react'
import { buildEventSharePayload, copyEventLink, shareEvent, type EventShareEvent, type EventSharePayload, type SharePlatform, type ShareResult } from './share'
import './event-share.css'

export type EventShareActionProps = { event: EventShareEvent; canManageInvite: boolean; inviteUrl?: string }

/** B11 must also remount on authenticated identity changes, as it does for event detail. */
export function EventShareAction(props: EventShareActionProps) {
  const { event, canManageInvite, inviteUrl } = props
  // Reset all UI and discard pending results whenever the authorized input changes.
  return <ShareAction key={JSON.stringify([event.id, event.title, event.starts_at, event.visibility, event.state, canManageInvite, inviteUrl])} {...props} />
}

function ShareAction({ event, canManageInvite, inviteUrl }: EventShareActionProps) {
  const [result, setResult] = useState<ShareResult | null>(null)
  const [busy, setBusy] = useState(false)
  const mounted = useRef(false), pending = useRef(false), input = useRef<HTMLInputElement>(null)
  const hintId = useId(), inputId = useId()
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { if (result === 'manual') { input.current?.focus(); input.current?.select() } }, [result])
  let payload: EventSharePayload | undefined
  let reason = ''
  try {
    payload = buildEventSharePayload(event, { origin: window.location.origin, baseUrl: import.meta.env.BASE_URL, canManageInvite, inviteUrl })
  } catch {
    reason = event.visibility === 'unlisted'
      ? !canManageInvite ? 'Sólo el organizador puede compartir la invitación de este evento oculto.'
        : event.state !== 'open' ? 'Este evento ya no admite nuevos accesos.'
        : 'Necesitás el enlace de invitación. Si lo perdiste, generá otro desde la gestión del enlace; el anterior dejará de funcionar.'
      : ''
  }
  const platform: SharePlatform = {
    isSecureContext: window.isSecureContext,
    share: typeof navigator.share === 'function' ? data => navigator.share(data) : undefined,
    writeText: navigator.clipboard?.writeText ? text => navigator.clipboard.writeText(text) : undefined,
  }
  const nativeShare = platform.isSecureContext && Boolean(platform.share)
  async function run(copy = false) {
    if (!payload || pending.current) return
    pending.current = true; setBusy(true); setResult(null)
    const outcome = await (copy ? copyEventLink(payload, platform) : shareEvent(payload, platform))
    if (mounted.current) { setResult(outcome); setBusy(false) }
    pending.current = false
  }
  return <div className="event-share-action">
    <button type="button" className="secondary-button" disabled={busy || !payload} aria-describedby={reason ? hintId : undefined} onClick={() => void run()}>
      {busy ? 'Abriendo…' : nativeShare ? 'Compartir' : 'Copiar enlace'}
    </button>
    {reason && <p id={hintId} className="field-hint">{reason}</p>}
    {result === 'shared' && <p role="status">La opción de compartir finalizó. La entrega depende de la aplicación elegida.</p>}
    {result === 'copied' && <p role="status">Enlace copiado.</p>}
    {result === 'error' && <><p role="alert" className="field-error">No pudimos abrir la opción de compartir. Podés copiar el enlace o volver a intentar.</p><button type="button" className="secondary-button" onClick={() => void run(true)}>Copiar enlace</button></>}
    {result === 'manual' && payload && <div className="form-field">
      <label htmlFor={inputId}>Enlace para copiar</label>
      <div className="field-control"><input ref={input} id={inputId} readOnly value={payload.url} onFocus={e => e.currentTarget.select()} autoComplete="off" spellCheck={false} /></div>
      <p role="status" className="field-hint">No pudimos usar el portapapeles. Copiá el enlace seleccionado.</p>
    </div>}
  </div>
}
