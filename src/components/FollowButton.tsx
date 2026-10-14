import { useEffect, useRef, useState } from 'react'
import { changeSocialFollow, loadSocialRelationship, type SocialRelationship } from '../features/social/follows'
import { socialDenied } from '../features/social/api'

export function FollowButton({ userId, relationship, onChanged, onSafetyChange }: { userId: string; relationship: NonNullable<SocialRelationship>; onChanged: () => void; onSafetyChange: (value: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const request = useRef<AbortController | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const button = useRef<HTMLButtonElement | null>(null)
  const mounted = useRef(false)
  const active = relationship.status === 'accepted' || relationship.status === 'pending'
  useEffect(() => {
    mounted.current = true
    const clear = () => { request.current?.abort(); if (mounted.current) setConfirm(false) }
    const visibility = () => { if (document.visibilityState !== 'visible') clear() }
    window.addEventListener('offline', clear); document.addEventListener('visibilitychange', visibility)
    return () => { mounted.current = false; clear(); window.removeEventListener('offline', clear); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  async function change() {
    if (request.current || busy) return
    const controller = new AbortController()
    request.current = controller; setBusy(true); setMessage(''); setConfirm(false); onSafetyChange(true)
    const timer = window.setTimeout(() => controller.abort(), 10000)
    try {
      await changeSocialFollow(userId, !active, controller.signal)
      // Requery relationship before publishing any success or granting content.
      await loadSocialRelationship(userId, controller.signal)
      if (mounted.current && !controller.signal.aborted) onChanged()
      else throw new Error('uncertain')
    } catch (error) {
      if (mounted.current && request.current === controller) {
        if (socialDenied(error)) { onChanged(); return }
        setUncertain(true)
        setMessage('No pudimos confirmar el resultado. Consultá el estado antes de volver a operar.')
      }
    } finally {
      window.clearTimeout(timer)
      if (mounted.current && request.current === controller) { request.current = null; setBusy(false) }
    }
  }
  const label = active ? relationship.status === 'pending' ? 'Cancelar solicitud' : 'Dejar de seguir' : relationship.visibility === 'private' ? 'Solicitar seguimiento' : 'Seguir'
  return <div className="social-follow-action" aria-busy={busy}>
    {relationship.status === 'pending' && <p role="status">Solicitud pendiente. El contenido sigue restringido hasta su aprobación.</p>}
    <button ref={button} className={active ? 'secondary-button' : 'gradient-button'} disabled={busy || uncertain} onClick={() => active ? setConfirm(true) : void change()}>{busy ? 'Confirmando…' : label}</button>
    {confirm && <div className="social-follow-confirm" role="group" aria-label={`Confirmar ${label.toLowerCase()}`} onKeyDown={event => { if (event.key === 'Escape') { setConfirm(false); button.current?.focus() } }}>
      <p>{relationship.status === 'pending' ? '¿Querés cancelar esta solicitud?' : '¿Querés dejar de seguir? Perderás el acceso reservado a seguidores.'}</p>
      <button className="secondary-button" onClick={() => { setConfirm(false); button.current?.focus() }}>Volver</button>
      <button className="gradient-button" onClick={() => void change()}>Confirmar</button>
    </div>}
    {message && <><p className="field-error" role="alert">{message}</p><button className="secondary-button" onClick={onChanged}>Consultar estado</button></>}
  </div>
}
