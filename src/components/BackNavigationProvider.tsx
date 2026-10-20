import { useCallback, useState, type ReactNode } from 'react'
import { useLocation, useNavigationType, type Location } from 'react-router-dom'
import { BackNavigationContext, type ReturnIntent } from './back-navigation-context'

type Trail = { entries: Location[]; index: number }

export function BackNavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const action = useNavigationType()
  const [trail, setTrail] = useState<Trail>(() => ({ entries: [location], index: 0 }))
  const [intent, restore] = useState<ReturnIntent | null>(null)
  const [owner, setOwner] = useState<{ key: string } | null>(null)
  let current = trail
  if (trail.entries[trail.index].key !== location.key) {
    const found = trail.entries.findIndex(entry => entry.key === location.key)
    current = action === 'POP'
      ? found >= 0 ? { ...trail, index: found } : { entries: [location], index: 0 }
      : action === 'REPLACE'
        ? { entries: trail.entries.map((entry, index) => index === trail.index ? location : entry), index: trail.index }
        : { entries: [...trail.entries.slice(0, trail.index + 1), location], index: trail.index + 1 }
    setTrail(current)
  }
  let previousIndex = current.index - 1
  // Filter/search changes on the current screen are not a previous screen.
  while (previousIndex >= 0 && current.entries[previousIndex].pathname === location.pathname) previousIndex--
  const register = useCallback((key: string) => {
    const registration = { key }
    setOwner(registration)
    return () => setOwner(value => value === registration ? null : value)
  }, [])
  return <BackNavigationContext value={{
    previous: current.entries[previousIndex], distance: current.index - previousIndex,
    intent, restore, pageBack: owner?.key ?? null, register,
  }}>{children}</BackNavigationContext>
}
