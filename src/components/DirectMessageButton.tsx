import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { openDirectConversation } from '../features/social/messages'
import '../pages/direct-messages.css'

export function DirectMessageButton({ userId, origin }: { userId: string; origin: unknown }) {
  const navigate = useNavigate(), request = useRef<AbortController | null>(null)
  const trigger = useRef<HTMLButtonElement>(null), location = useLocation()
  const [pending, setPending] = useState(false), [error, setError] = useState(false)
  useEffect(() => {
    const cancel = () => { if (document.visibilityState !== 'visible' || !navigator.onLine) request.current?.abort() }
    document.addEventListener('visibilitychange', cancel); window.addEventListener('offline', cancel)
    return () => { request.current?.abort(); request.current = null; document.removeEventListener('visibilitychange', cancel); window.removeEventListener('offline', cancel) }
  }, [])
  useEffect(() => {
    if (!location.state?.focusMessage) return
    const frame = window.requestAnimationFrame(() => trigger.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [location.state])
  async function open() {
    if (request.current) return
    const controller = new AbortController(); request.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    setPending(true); setError(false)
    try {
      const id = await openDirectConversation(userId, controller.signal)
      if (!controller.signal.aborted && request.current === controller) navigate(`/messages/${id}`, { state: { directOrigin: `/users/${userId}`, profileOrigin: origin } })
    } catch { if (request.current === controller) setError(true) }
    finally { clearTimeout(timeout); if (request.current === controller) { request.current = null; setPending(false) } }
  }
  return <div className="direct-start"><button ref={trigger} className="gradient-link gradient-button" onClick={() => void open()} disabled={pending}>{pending ? 'Abriendo conversación…' : 'Enviar mensaje'}</button>{error && <p role="alert">No pudimos abrir la conversación. Reintentá para consultar o recuperar la misma conversación.</p>}</div>
}
