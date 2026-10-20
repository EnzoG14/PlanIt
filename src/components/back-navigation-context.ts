import { createContext, useContext, useMemo } from 'react'
import { useLocation, type Location } from 'react-router-dom'

export type ReturnIntent = { key: string; state: Record<string, unknown> }
export const BackNavigationContext = createContext<{
  previous?: Location
  distance: number
  intent: ReturnIntent | null
  restore: (intent: ReturnIntent) => void
  pageBack: string | null
  register: (key: string) => () => void
}>({ distance: 0, intent: null, restore: () => {}, pageBack: null, register: () => () => {} })

/** Return hints supplement router state without replacing a browser history entry. */
export function useBackLocation() {
  const location = useLocation()
  const { intent } = useContext(BackNavigationContext)
  return useMemo(() => intent?.key === location.key
    ? { ...location, state: { ...location.state, ...intent.state } }
    : location, [location, intent])
}
