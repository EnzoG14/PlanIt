/* oxlint-disable react/only-export-components -- helper junto a los componentes de UI */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../shared/Icon'

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(word => [...word][0]).join('').toLocaleUpperCase()
}

export function Avatar({ name, tone = 0, size = 44 }: { name: string; tone?: number; size?: number }) {
  return <span className={`bx-avatar t${tone % 4}`} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">{initials(name)}</span>
}

// Barra superior de subpantalla: botón volver (historial si hay, si no el destino indicado) + contenido.
export function BackBar({ fallback, label = 'Volver', children }: { fallback: string; label?: string; children?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="bx-backbar">
      <button type="button" className="bx-back" aria-label={label} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}><Icon name="back" size={22} /></button>
      {children}
    </div>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="bx-backlink"><Icon name="back" size={18} />{children}</Link>
}

// Diálogo/hoja montado dentro del teléfono (no en document.body) para respetar el marco del mock.
export function Modal({ open, onClose, label, placement = 'center', children }: { open: boolean; onClose: () => void; label: string; placement?: 'center' | 'sheet'; children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => { setHost(anchor.current?.closest('.phone') ?? null) }, [])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [open, onClose])
  return (
    <>
      <span ref={anchor} hidden />
      {open && host && createPortal(
        <div className={`bx-backdrop ${placement}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
          <div ref={panel} className="bx-dialog" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
        </div>, host)}
    </>
  )
}

export function Notice({ tone = 'ok', children }: { tone?: 'ok' | 'info' | 'warn' | 'bad'; children: ReactNode }) {
  return <p className={`bx-notice ${tone}`} role="status"><Icon name={tone === 'bad' ? 'close' : 'check'} size={18} /><span>{children}</span></p>
}
