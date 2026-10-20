import { useContext, useLayoutEffect, type Ref } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BackNavigationContext } from './back-navigation-context'
import { Icon } from './Icon'
import './back-button.css'

export function BackButton({ to = '/home', state, ref, fallback = false }: {
  to?: string; state?: Record<string, unknown>; ref?: Ref<HTMLAnchorElement>; fallback?: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { previous, distance, restore, pageBack, register } = useContext(BackNavigationContext)
  useLayoutEffect(() => fallback ? undefined : register(location.key), [fallback, register, location.key])
  if (fallback && pageBack === location.key) return null
  return <Link ref={ref} className={`icon-link navigation-back${fallback ? ' layout-back' : ''}`}
    to={previous ? previous.pathname + previous.search + previous.hash : to} state={state} aria-label="Volver"
    onClick={event => {
      if (!previous || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      event.preventDefault()
      // Keep focus hints only when the actual return destination matches the page's fallback.
      if (state && previous.pathname === to.split(/[?#]/)[0]) restore({ key: previous.key, state })
      else restore({ key: previous.key, state: {} })
      void navigate(-distance)
    }}><Icon name="back" /></Link>
}
