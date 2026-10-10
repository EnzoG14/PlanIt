import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader'
import type { IconName } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'

const pages = {
  map: { title: 'Mapa', icon: 'map', description: 'Descubrí eventos cerca tuyo.', pending: 'Estamos preparando el mapa de eventos públicos. Los lugares y eventos aparecerán cuando esté disponible la exploración.' },
  create: { title: 'Creá un evento', icon: 'calendar', description: 'Compartí un plan con la comunidad.', pending: 'Estamos preparando el formulario de publicación. Todavía no se pueden guardar ni publicar eventos.' },
  myEvents: { title: 'Mis eventos', icon: 'calendar', description: 'Los eventos que organizás y aquellos en los que participás.', pending: 'Ingresaste a tu cuenta. Estamos preparando la consulta de eventos y participaciones; todavía no se muestran tus eventos.' },
  detail: { title: 'Detalle del evento', icon: 'calendar', description: 'La información para decidir tu próximo plan.', pending: 'Estamos preparando el detalle de eventos. Esta pantalla todavía no consulta ni confirma la existencia del evento solicitado.' },
} satisfies Record<string, { title: string; icon: IconName; description: string; pending: string }>

export function FoundationPage({ page }: { page: keyof typeof pages }) {
  const content = pages[page]
  const { session } = useAuth()
  const returnToMap = page !== 'map' || Boolean(session)
  useEffect(() => { document.title = `${content.title} · PlanIt` }, [content.title])
  return <div className="foundation-page">
    <ScreenHeader title={content.title} description={content.description} icon={content.icon} />
    <StatusMessage title="Funcionalidad en preparación">{content.pending}</StatusMessage>
    <div className="page-actions">
      <Link className="gradient-link" to={returnToMap ? (page === 'map' ? '/me' : '/map') : '/login'}>{returnToMap ? (page === 'map' ? 'Consultar mi perfil' : 'Volver al mapa') : 'Ingresar a mi cuenta'}</Link>
    </div>
  </div>
}

export function NotFoundPage() {
  useEffect(() => { document.title = 'Página no encontrada · PlanIt' }, [])
  return <div className="foundation-page">
    <ScreenHeader title="Página no encontrada" description="Revisá la dirección o volvé al mapa." icon="map" />
    <StatusMessage title="Error 404">No encontramos una pantalla para esta dirección.</StatusMessage>
    <div className="page-actions"><Link className="gradient-link" to="/map">Volver al mapa</Link></div>
  </div>
}
