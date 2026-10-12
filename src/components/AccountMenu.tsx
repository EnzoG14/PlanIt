import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import './account-menu.css'

export function AccountMenu({ signingOut, onLogout }: { signingOut: boolean; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const profile = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!open) return
    profile.current?.focus()
    function close() { setOpen(false); trigger.current?.focus() }
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) close() }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { event.preventDefault(); close() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  return <div className="account-menu" ref={root} onBlur={event => { if (!signingOut && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button className="account-menu-trigger" ref={trigger} type="button" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); profile.current?.focus() } }}>
      <Icon name="user" /><span>Cuenta</span><Icon name="chevronDown" />
    </button>
    {open && <div className="account-menu-panel" id={panelId}>
      <Link ref={profile} to="/me"><Icon name="user" /><span>Mi perfil</span></Link>
      <button type="button" disabled={signingOut} onClick={() => { void onLogout() }}><Icon name="logout" /><span>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span></button>
    </div>}
  </div>
}
