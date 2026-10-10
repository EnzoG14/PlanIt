import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StatusMessage } from '../components/StatusMessage'

const pages = {
  map: {
    eyebrow: 'DESCUBRÍ PLANES CERCA TUYO', title: 'Un lugar para encontrarnos.',
    description: 'Descubrí eventos, compartí tus intereses y hacé espacio para nuevos encuentros.',
    pending: 'Estamos preparando el mapa de eventos públicos. Los lugares y eventos aparecerán cuando esté disponible la exploración.',
  },
  register: {
    eyebrow: 'SUMATE A PLANIT', title: 'Tu próximo plan empieza acá.',
    description: 'Una cuenta para descubrir, organizar y participar en eventos.',
    pending: 'El registro estará disponible en la próxima etapa. Todavía no se pueden crear cuentas desde esta pantalla.',
  },
  login: {
    eyebrow: 'TU CUENTA', title: 'Volvé a tus planes.',
    description: 'Ingresá para seguir organizando encuentros y participar en nuevos eventos.',
    pending: 'El inicio de sesión estará disponible en la próxima etapa.',
  },
  create: {
    eyebrow: 'ORGANIZÁ UN ENCUENTRO', title: 'Dale lugar a tu idea.',
    description: 'Un evento empieza con una idea y las ganas de compartirla.',
    pending: 'Estamos preparando el formulario de publicación. Todavía no se pueden guardar ni publicar eventos.',
  },
  myEvents: {
    eyebrow: 'TUS ENCUENTROS', title: 'Todos tus planes, a mano.',
    description: 'Acá vas a encontrar los eventos que organizás y aquellos en los que participás.',
    pending: 'Esta sección estará disponible cuando puedas ingresar y participar. Todavía no se consultan tus eventos.',
  },
  detail: {
    eyebrow: 'EL PLAN EN DETALLE', title: 'Conocé el encuentro.',
    description: 'La información que necesitás para decidir tu próximo plan.',
    pending: 'Estamos preparando el detalle de eventos. Esta pantalla todavía no consulta ni confirma la existencia del evento solicitado.',
  },
} as const

export function FoundationPage({ page }: { page: keyof typeof pages }) {
  const content = pages[page]
  useEffect(() => { document.title = `${page === 'map' ? 'Explorar' : content.title} · PlanIt` }, [page, content.title])

  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="page-description">{content.description}</p>
      </section>
      <div className="foundation-grid">
        <StatusMessage title="Próximamente">{content.pending}</StatusMessage>
        <aside className="welcome-card" aria-label="Sobre PlanIt">
          <span className="card-mark" aria-hidden="true">P.</span>
          <h2>Más encuentros.<br />Más historias.</h2>
          <p>Planes que nacen de lo que te gusta y de las personas con quienes lo compartís.</p>
          <Link className="text-link" to={page === 'map' ? '/events/new' : '/map'}>
            {page === 'map' ? 'Conocé dónde crear tu evento' : 'Volver a explorar'} <span aria-hidden="true">↗</span>
          </Link>
        </aside>
      </div>
    </>
  )
}

export function NotFoundPage() {
  useEffect(() => { document.title = 'Página no encontrada · PlanIt' }, [])
  return (
    <section className="page-intro">
      <p className="eyebrow">404 · PÁGINA NO ENCONTRADA</p>
      <h1>Este camino no lleva a un plan.</h1>
      <p className="page-description">Revisá la dirección o volvé al inicio.</p>
      <Link className="button" to="/map">Volver a explorar</Link>
    </section>
  )
}
