import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from './useAuth'
import { clearInviteToken } from '../events/invite'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) return
    let active = true
    let revision = 0
    const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
      // Keep this callback synchronous: Auth holds a lock while notifying listeners.
      if (!active || event === 'INITIAL_SESSION') return
      revision += 1
      if (event === 'SIGNED_OUT') clearInviteToken()
      setSession(nextSession)
      setError(null)
      setLoading(false)
    })
    const initialRevision = revision
    async function restore() {
      try {
        const { data, error: sessionError } = await client!.auth.getSession()
        if (sessionError && !['refresh_token_not_found', 'refresh_token_already_used', 'session_not_found'].includes(sessionError.code ?? '')) throw sessionError
        let restored = data.session
        if (restored) {
          // Cached session is for UI only; verify the identity before showing private views.
          const { error: userError } = await client!.auth.getUser()
          if (userError) {
            if (userError.status === 401 || userError.status === 403 || userError.code === 'session_not_found' || userError.code === 'refresh_token_not_found') restored = null
            else throw userError
          }
        }
        if (active && revision === initialRevision) { setSession(restored); setLoading(false) }
      } catch {
        if (active && revision === initialRevision) {
          setSession(null)
          setError('No pudimos comprobar tu sesión. Revisá la conexión y volvé a intentar.')
          setLoading(false)
        }
      }
    }
    void restore()
    return () => { active = false; subscription.unsubscribe() }
  }, [attempt])

  return <AuthContext.Provider value={{ session, loading: Boolean(supabase) && loading, error, retry: () => { setLoading(true); setError(null); setAttempt(value => value + 1) } }}>{children}</AuthContext.Provider>
}
