import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthState = { session: Session | null; loading: boolean; error: string | null; retry: () => void }
export const AuthContext = createContext<AuthState | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requires AuthProvider')
  return context
}
