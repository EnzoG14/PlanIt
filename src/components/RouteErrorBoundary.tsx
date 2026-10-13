import { Component, useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StatusMessage } from './StatusMessage'
import './route-error.css'

type BoundaryProps = { children: ReactNode; fallback: ReactNode; resetKey: string }
type BoundaryState = { failed: boolean; resetKey: string }

// React error boundaries require a class; healthy children keep their identity on navigation.
class ScreenErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromProps({ resetKey }: BoundaryProps, state: BoundaryState) {
    return resetKey === state.resetKey ? null : { failed: false, resetKey }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function RouteRecovery() {
  const message = useRef<HTMLDivElement>(null)
  useEffect(() => { message.current?.focus() }, [])

  return <div className="route-error" ref={message} tabIndex={-1}>
    <StatusMessage title="No pudimos abrir esta pantalla" tone="error">
      Revisá la conexión y recargá la página para volver a intentarlo.
    </StatusMessage>
    <div className="route-error-actions">
      <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Recargar página</button>
      <Link className="secondary-link" to="/me">Ir a Mi perfil</Link>
    </div>
  </div>
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { key } = useLocation()
  return <ScreenErrorBoundary resetKey={key} fallback={<RouteRecovery />}>{children}</ScreenErrorBoundary>
}
