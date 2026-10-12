import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Tab } from './data'

// Enlace de la navegación inferior: lleva a la pantalla interactiva de la misma dirección.
export function NavLinkTo({ dir, tab, className, children, label, current }: { dir: string; tab: Tab; className?: string; children: ReactNode; label: string; current?: boolean }) {
  return <Link to={`/${dir}/${tab}`} className={className} aria-label={label} aria-current={current ? 'page' : undefined}>{children}</Link>
}
