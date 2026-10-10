import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabaseConfigError } from '../lib/supabase'
import { StatusMessage } from './StatusMessage'

export function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <header className="app-header">
        <NavLink className="brand" to="/map" aria-label="PlanIt, inicio">
          <img src="/favicon.svg" width="36" height="36" alt="" />
          <span>PlanIt<span className="brand-dot">.</span></span>
        </NavLink>
        <nav className="primary-nav" aria-label="Navegación principal">
          <NavLink to="/map">Explorar</NavLink>
          <NavLink to="/my-events">Mis eventos</NavLink>
          <NavLink to="/events/new">Crear evento</NavLink>
        </nav>
        <nav className="account-nav" aria-label="Cuenta">
          <NavLink to="/login">Ingresar</NavLink>
          <NavLink className="button button-small" to="/register">Registrarme</NavLink>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        {supabaseConfigError && (
          <StatusMessage title="Configuración pendiente" tone="error">
            {supabaseConfigError}
          </StatusMessage>
        )}
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>PlanIt · Encontrá tu próximo plan.</span>
        <span>Versión inicial en preparación</span>
      </footer>
    </div>
  )
}
