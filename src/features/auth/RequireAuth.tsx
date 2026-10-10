import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { StatusMessage } from '../../components/StatusMessage'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { session, loading, error } = useAuth()
  const location = useLocation()
  if (loading) return <StatusMessage title="Comprobando sesión">Esperá un momento para continuar.</StatusMessage>
  if (error) return null // AppLayout shows the error and retry action.
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return <Outlet />
}
