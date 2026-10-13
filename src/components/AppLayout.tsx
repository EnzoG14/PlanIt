import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, matchPath } from 'react-router-dom'
import { supabase, supabaseConfigError } from '../lib/supabase'
import { useAuth } from '../features/auth/useAuth'
import { GradientButton } from './GradientButton'
import { Icon } from './Icon'
import { NotificationsProvider } from '../features/notifications/NotificationsProvider'
import { useNotificationsRealtime } from '../features/notifications/realtime-context'
import { StatusMessage } from './StatusMessage'
import { AccountMenu } from './AccountMenu'
import '../styles/social.css'

export function AppLayout() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  return <NotificationsProvider key={userId} userId={userId}><LayoutContent /></NotificationsProvider>
}
function LayoutContent() {
  const { count } = useNotificationsRealtime()
  const { pathname } = useLocation()
  const isAuth = pathname === '/login' || pathname === '/register'
  const isEventForm = pathname === '/events/new' || Boolean(matchPath('/events/:id/edit', pathname))
  const isEventManagement = Boolean(matchPath('/events/:id/gallery', pathname) || matchPath('/events/:id/attendees', pathname))
  const isChat = Boolean(matchPath('/events/:id/chat', pathname))
  const isSocial = isChat || pathname === '/me' || pathname === '/notifications'
  const isDiscovery = pathname === '/home' || pathname === '/map' || (Boolean(matchPath('/events/:id', pathname)) && pathname !== '/events/new')
  const shell = useRef<HTMLDivElement>(null)
  const { session, loading, error, retry } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  async function logout() {
    if (!supabase || signingOut) return
    setSigningOut(true)
    setLogoutError(false)
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) setLogoutError(true)
    } catch { setLogoutError(true) }
    finally { setSigningOut(false) }
  }
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])
  useLayoutEffect(() => {
    if (!isChat) return
    const element = shell.current
    if (!element) return
    document.documentElement.classList.add('chat-active')
    // VisualViewport also shrinks when mobile keyboards overlay the layout viewport.
    const viewport = window.visualViewport
    const resize = () => {
      element.style.setProperty('--chat-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
      element.style.setProperty('--chat-viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    resize()
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', resize)
    window.addEventListener('resize', resize)
    return () => {
      document.documentElement.classList.remove('chat-active')
      viewport?.removeEventListener('resize', resize)
      viewport?.removeEventListener('scroll', resize)
      window.removeEventListener('resize', resize)
      element.style.removeProperty('--chat-viewport-height')
      element.style.removeProperty('--chat-viewport-top')
    }
  }, [isChat])
  return (
    <div ref={shell} className={`app-shell ${isChat ? 'chat-shell' : isAuth ? 'auth-shell' : 'product-shell'}${pathname === '/my-events' ? ' amanecer-shell my-events-shell' : isEventForm ? ' amanecer-shell event-form-shell' : isAuth ? ' amanecer-shell' : isEventManagement ? ' amanecer-shell event-management-shell' : isDiscovery ? ' amanecer-shell discovery-shell' : isSocial ? ' amanecer-shell social-shell' : ''}`}>
      {isAuth && <div className="auth-wash" aria-hidden="true" />}
      {isSocial && <div className="social-wash" aria-hidden="true" />}
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      {!isChat && (isAuth ? <div className="auth-topbar">
        <Link className="icon-link" to="/map" aria-label="Volver al mapa"><Icon name="back" /></Link>
        <Link className="brand" to="/map" aria-label="PlanIt, inicio">Plan<span>It</span></Link>
      </div> : <header className="app-header">
        <NavLink className="brand" to="/home" aria-label="PlanIt, inicio"><img src="/favicon.svg" width="32" height="32" alt="" />Plan<span>It</span></NavLink>
        <nav className="account-nav" aria-label="Cuenta">{loading ? <span role="status">Comprobando sesión…</span> : session ? <><NavLink className="icon-link notifications-bell" to="/notifications" aria-label={count ? `Notificaciones, ${count} no leídas` : "Notificaciones"}><Icon name="bell" />{count !== null && count > 0 && <span className="notifications-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>}</NavLink><AccountMenu key={pathname} signingOut={signingOut} onLogout={logout} /></> : <><NavLink to="/login">Ingresar</NavLink><NavLink to="/register">Crear cuenta</NavLink></>}</nav>
      </header>)}
      <main id="main-content" className="screen-entrance" tabIndex={-1}>
        {supabaseConfigError && <StatusMessage title="Configuración pendiente" tone="error">{supabaseConfigError}</StatusMessage>}
        {error && <div className="session-error"><StatusMessage title="No se pudo recuperar la sesión" tone="error">{error}</StatusMessage><GradientButton type="button" onClick={retry}>Reintentar</GradientButton></div>}
        {logoutError && <StatusMessage title="No se pudo cerrar la sesión" tone="error">Revisá la conexión y volvé a elegir Cerrar sesión en Cuenta.</StatusMessage>}
        <Outlet />
      </main>
      {!isAuth && !isChat && <nav className="primary-nav" aria-label="Navegación principal">
        <NavLink to="/home"><Icon name="home" /><span>Inicio</span></NavLink>
        <NavLink to="/map"><Icon name="map" /><span>Mapa</span></NavLink>
        <NavLink to="/my-events"><Icon name="calendar" /><span>Mis eventos</span></NavLink>
        {session && <NavLink to="/me"><Icon name="user" /><span>Perfil</span></NavLink>}
      </nav>}
    </div>
  )
}
