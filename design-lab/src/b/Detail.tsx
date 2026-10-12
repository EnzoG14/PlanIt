/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon, categoryIcon, type IconName } from '../shared/Icon'
import { Scene } from '../shared/Scene'
import { byId, type Ev } from '../shared/data'
import { useVariant } from '../shared/variant'
import { detailText } from './mock'
import { Avatar, BackBar, Modal, Notice } from './ui'

export type PState = 'join' | 'joined' | 'full' | 'removed' | 'pending' | 'ended' | 'organizer'
export const detailVariants: { id: PState; label: string }[] = [
  { id: 'join', label: 'Participante · Unirme' },
  { id: 'joined', label: 'Ya inscripto' },
  { id: 'full', label: 'Cupo completo' },
  { id: 'removed', label: 'Removido · reingreso' },
  { id: 'pending', label: 'Solicitud en revisión' },
  { id: 'ended', label: 'Finalizado' },
  { id: 'organizer', label: 'Organizador' },
]

function defaultState(event: Ev): PState {
  if (event.role === 'organizo') return 'organizer'
  if (event.role === 'participo') return 'joined'
  return event.going >= event.capacity ? 'full' : 'join'
}

export function eventLink(event: Ev) {
  return `/b/event?e=${event.id}`
}

const MANAGE: { label: string; icon: IconName; to?: string }[] = [
  { label: 'Editar evento', icon: 'edit' },
  { label: 'Gestionar imágenes', icon: 'image' },
  { label: 'Ver asistentes', icon: 'people', to: '/b/attendees' },
  { label: 'Duplicar evento', icon: 'copy', to: '/b/create' },
]

export function Detail() {
  const [params] = useSearchParams()
  const event = byId(params.get('e') ?? 'e1') ?? byId('e1')
  const variant = useVariant()
  const initial = (detailVariants.some(item => item.id === variant) ? variant : defaultState(event)) as PState
  const [state, setState] = useState<PState>(initial)
  const [going, setGoing] = useState(initial === 'full' ? event.capacity : event.going)
  const [requested, setRequested] = useState(initial === 'pending')
  const [dialog, setDialog] = useState<'cancel' | 'archive' | 'leave' | null>(null)
  const [closed, setClosed] = useState<'cancelled' | 'archived' | null>(null)
  const text = detailText[event.id] ?? detailText.e1
  const free = event.capacity - going
  const ended = state === 'ended' || closed === 'cancelled'
  const organizer = state === 'organizer'
  const effective: PState = requested && state === 'removed' ? 'pending' : state

  const cta = (() => {
    if (ended) return <button type="button" className="bx-cta" disabled>{closed === 'cancelled' ? 'Evento cancelado' : 'Evento finalizado'}</button>
    if (organizer) return <Link to="/b/chat" className="bx-cta"><Icon name="chat" size={20} />Abrir chat del evento</Link>
    switch (effective) {
      case 'joined': return <div className="bx-cta-row"><Link to="/b/chat" className="bx-cta"><Icon name="chat" size={20} />Abrir chat</Link><button type="button" className="bx-cta ghost" onClick={() => setDialog('leave')}>Retirarme</button></div>
      case 'full': return <button type="button" className="bx-cta" disabled>Evento completo</button>
      case 'removed': return <button type="button" className="bx-cta" onClick={() => setRequested(true)}>Solicitar reincorporación</button>
      case 'pending': return <button type="button" className="bx-cta" disabled>Reingreso sujeto a aprobación</button>
      default: return <button type="button" className="bx-cta" onClick={() => { setGoing(value => value + 1); setState('joined') }}>Unirme</button>
    }
  })()

  return (
    <div className="bx-detail">
      <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div>
      <section className="bx-hero" aria-label="Fotos del evento">
        <Scene id={event.scene} />
        <span className="bx-hero-shade" aria-hidden="true" />
        <BackBar fallback="/b/home" label="Volver"><span className="bx-count">1 / 4</span></BackBar>
        <span className="bx-hero-cat"><Icon name={categoryIcon[event.category]} size={15} />{event.category}</span>
      </section>
      <div className="bx-body">
        <h1>{event.title}</h1>
        {(closed || state === 'ended') && <Notice tone="warn">{closed === 'cancelled' ? 'Evento cancelado' : closed === 'archived' ? 'Evento archivado' : 'Evento finalizado'}. {closed === 'cancelled' || state === 'ended' ? 'La inscripción está cerrada.' : 'Ya no aparece en Inicio ni en el mapa.'}</Notice>}
        <dl className="bx-meta b-glass">
          <div><dt><Icon name="calendar" size={18} />Inicio</dt><dd>{event.day} oct · {event.time}</dd></div>
          <div><dt><Icon name="clock" size={18} />Fin</dt><dd>{event.day} oct · {text.end}</dd></div>
          <div><dt><Icon name="pin" size={18} />Lugar</dt><dd>{event.place}<small>{text.address}</small></dd></div>
        </dl>
        <p className="bx-tz">Horarios de Argentina.</p>

        <section className="bx-capacity b-glass" aria-label="Participación y cupos">
          <div className="bx-cap-head"><span className="bx-cap-ico"><Icon name="people" size={20} /></span><div><strong>{going} / {event.capacity} confirmados</strong><p>{free === 0 ? 'No quedan cupos' : `${free} cupos disponibles`}</p></div></div>
          <progress className="bx-bar" max={event.capacity} value={going} aria-label="Ocupación del evento" />
          {organizer && <p className="bx-line">Organizás este evento. No ocupás cupo ni podés inscribirte.</p>}
          {effective === 'joined' && !organizer && <p className="bx-line ok">Ya participás.</p>}
          {state === 'removed' && !requested && <div className="bx-rejoin"><strong>Solicitud de reincorporación</strong><p>Fuiste removido del evento. Podés pedirle al organizador que te vuelva a aceptar.</p></div>}
          {effective === 'pending' && state !== 'ended' && <div className="bx-rejoin"><strong>Solicitud en revisión</strong><p>Tu solicitud fue enviada al organizador. Sigue pendiente de resolución.</p></div>}
        </section>

        <p className="bx-desc">{text.description}</p>

        <section aria-label="Fotos adicionales" className="bx-gallery">
          {(['studio', 'market', 'night'] as const).map((scene, index) => <figure key={scene}><Scene id={scene} /><figcaption className="sr-only">Foto {index + 2}</figcaption></figure>)}
        </section>

        <section className="bx-org b-glass" aria-labelledby="bx-org-title">
          <h2 id="bx-org-title">Organizador</h2>
          <div><Avatar name="Lucía Benítez" tone={1} size={48} /><div><strong>Lucía Benítez</strong><p>@lucia.benitez</p></div></div>
        </section>

        {organizer && !closed && (
          <section className="bx-manage b-glass" aria-label="Gestión del evento">
            <h2>Gestión del evento</h2>
            <ul>{MANAGE.map(row => <li key={row.label}>{row.to ? <Link to={row.to}><Icon name={row.icon} size={20} /><span>{row.label}</span><Icon name="chevronRight" size={18} /></Link> : <button type="button"><Icon name={row.icon} size={20} /><span>{row.label}</span><Icon name="chevronRight" size={18} /></button>}</li>)}</ul>
            <ul className="danger">
              <li><button type="button" onClick={() => setDialog('cancel')}><Icon name="pause" size={20} /><span>Cancelar evento</span><Icon name="chevronRight" size={18} /></button></li>
              <li><button type="button" onClick={() => setDialog('archive')}><Icon name="archive" size={20} /><span>Archivar evento</span><Icon name="chevronRight" size={18} /></button></li>
            </ul>
          </section>
        )}
        {closed === 'archived' && <Notice tone="info">Evento archivado. Podés duplicarlo desde Mis eventos.</Notice>}
      </div>

      <div className="bx-actionbar">{cta}</div>

      <Modal open={dialog !== null} onClose={() => setDialog(null)} label="Confirmar acción">
        <span className="bx-dialog-ico bad"><Icon name={dialog === 'archive' ? 'archive' : dialog === 'leave' ? 'userRemove' : 'pause'} size={26} /></span>
        <h2>{dialog === 'cancel' ? 'Cancelar evento' : dialog === 'archive' ? 'Archivar evento' : 'Retirarme del evento'}</h2>
        <p>{dialog === 'cancel' ? `¿Querés cancelar “${event.title}”? Los asistentes recibirán un aviso.` : dialog === 'archive' ? `¿Querés archivar “${event.title}”? Dejará de mostrarse en Inicio y en el mapa.` : `¿Querés retirarte de “${event.title}”? Vas a liberar tu lugar.`}</p>
        <p className="bx-hint">{dialog === 'leave' ? 'Podés volver a unirte mientras haya cupo.' : 'El evento y su historial se conservan; no se elimina nada.'}</p>
        <div className="bx-dialog-actions">
          <button type="button" className="bx-btn ghost" data-autofocus onClick={() => setDialog(null)}>Volver</button>
          <button type="button" className="bx-btn danger" onClick={() => {
            if (dialog === 'leave') { setGoing(value => value - 1); setState('join') }
            else setClosed(dialog === 'cancel' ? 'cancelled' : 'archived')
            setDialog(null)
          }}>{dialog === 'cancel' ? 'Cancelar evento' : dialog === 'archive' ? 'Archivar' : 'Retirarme'}</button>
        </div>
      </Modal>
    </div>
  )
}
