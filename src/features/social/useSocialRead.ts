import { useCallback, useEffect, useRef, useState } from 'react'
import { socialDenied, socialError } from './api'

// Recheck on return, reconnect and every 30s; no persisted social cache or Realtime
// publication of profiles. Hide data while permission is being revalidated.
export function useSocialRead<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; denied: boolean; error: string }>({ data: null, loading: true, denied: false, error: '' })
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(false)
  const refresh = useCallback(async () => {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setState({ data: null, loading: true, denied: false, error: '' })
    const timeout = window.setTimeout(() => request.abort(), 10000)
    try {
      const data = await load(request.signal)
      if (mounted.current && controller.current === request && !request.signal.aborted) setState({ data, loading: false, denied: false, error: '' })
      else if (mounted.current && controller.current === request) setState({ data: null, loading: false, denied: false, error: socialError(null) })
    } catch (error) {
      if (mounted.current && controller.current === request) setState({ data: null, loading: false, denied: socialDenied(error), error: socialError(error) })
    } finally { window.clearTimeout(timeout) }
  }, [load])
  useEffect(() => {
    mounted.current = true
    const clear = () => { controller.current?.abort(); controller.current = null; setState({ data: null, loading: false, denied: false, error: navigator.onLine ? '' : 'Estás sin conexión. Reconectate para consultar los datos.' }) }
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void refresh()
      else clear()
    }
    const timer = window.setTimeout(check, 0)
    const interval = window.setInterval(check, 30000)
    window.addEventListener('focus', check); window.addEventListener('online', check); window.addEventListener('offline', clear); document.addEventListener('visibilitychange', check)
    return () => {
      mounted.current = false; controller.current?.abort(); controller.current = null
      window.clearTimeout(timer); window.clearInterval(interval)
      window.removeEventListener('focus', check); window.removeEventListener('online', check); window.removeEventListener('offline', clear); document.removeEventListener('visibilitychange', check)
    }
  }, [refresh])
  return { ...state, refresh }
}
