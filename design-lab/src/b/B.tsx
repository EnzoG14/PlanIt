import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, categoryIcon, type IconName } from '../shared/Icon'
import { MapSketch } from '../shared/MapSketch'
import { NavLinkTo } from '../shared/NavLinkTo'
import { Scene } from '../shared/Scene'
import { byId, events, me, statusFilters, tabLabels, tabs, upcoming, weekCounts, weekDays, type Ev, type Tab } from '../shared/data'
import { useMyEvents } from '../shared/useMyEvents'
import { eventLink } from './Detail'

const navIcons: Record<Tab, IconName> = { home: 'home', map: 'map', events: 'calendar', profile: 'user' }

export function Nav({ tab }: { tab: Tab }) {
  return (
    <nav className="b-dock" aria-label="Navegación principal">
      {tabs.map(item => (
        <NavLinkTo key={item} dir="b" tab={item} label={tabLabels[item]} current={item === tab} className={`b-dock-item ${item === tab ? 'on' : ''}`}>
          <Icon name={navIcons[item]} size={21} />{item === tab && <span>{tabLabels[item]}</span>}
        </NavLinkTo>
      ))}
    </nav>
  )
}

function Wash() { return <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div> }

function Wordmark() { return <span className="b-word"><b>P.</b>PlanIt</span> }

function Home() {
  const [day, setDay] = useState(3) // jueves 15
  const items = upcoming.filter(event => event.dayShort.startsWith(String(weekDays[day].n)))
  const rest = upcoming.filter(event => !items.includes(event))
  const next = byId('e6')
  return (
    <div className="b-home">
      <Wash />
      <header className="b-top rise">
        <Wordmark />
        <Link to="/b/notifications" className="b-ink-round" aria-label="Notificaciones, 2 sin leer"><Icon name="bell" size={21} /><i className="b-pip" /></Link>
      </header>
      <section className="b-greet rise" style={{ '--i': 1 } as never}>
        <p>Hola, {me.firstName}</p>
        <h1>¿Qué plan armamos esta semana?</h1>
      </section>
      <ul className="b-quick rise" style={{ '--i': 2 } as never}>
        <li className="b-glass">
          <span className="b-ico-dark"><Icon name="clock" size={20} /></span>
          <h2>{next.title}</h2>
          <p>{next.day} · {next.time}</p>
          <Link to={eventLink(next)} className="b-ink-btn">Ver evento</Link>
        </li>
        <li className="b-glass">
          <span className="b-ico-light"><Icon name="calendarPlus" size={20} /></span>
          <h2>Armá el tuyo</h2>
          <p>Sumá fecha, lugar y cupo</p>
          <Link to="/b/create" className="b-line-btn">Crear evento</Link>
        </li>
      </ul>
      <section className="b-week rise" style={{ '--i': 3 } as never} aria-label="Elegí un día">
        <div className="b-head"><h2>Esta semana</h2><span>Octubre</span></div>
        <ul>
          {weekDays.map((value, i) => (
            <li key={value.n}>
              <button type="button" className={`b-day ${i === day ? 'on' : ''}`} aria-pressed={i === day} onClick={() => setDay(i)}>
                <b>{value.n}</b><span>{value.d}</span><i aria-label={`${weekCounts[i]} eventos`}>{weekCounts[i]}</i>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="b-list">
        <div className="b-head"><h2>{weekDays[day].d} {weekDays[day].n}</h2><span>{items.length} {items.length === 1 ? 'evento' : 'eventos'}</span></div>
        {items.length ? <ul>{items.map(event => <li key={event.id}><EventCard event={event} /></li>)}</ul> : <p className="b-none">No hay eventos publicados este día. Probá con otro.</p>}
      </section>
      <section className="b-list">
        <div className="b-head"><h2>Más esta semana</h2></div>
        <ul>{rest.map(event => <li key={event.id}><EventCard event={event} /></li>)}</ul>
      </section>
    </div>
  )
}

function EventCard({ event }: { event: Ev }) {
  const free = event.capacity - event.going
  return (
    <Link to={eventLink(event)} className="b-card">
      <div className="b-card-photo"><Scene id={event.scene} /><span className="b-time">{event.time}</span></div>
      <div className="b-card-body">
        <span className="b-cat"><Icon name={categoryIcon[event.category]} size={14} />{event.category}</span>
        <h3>{event.title}</h3>
        <p><Icon name="pin" size={15} />{event.place}</p>
        <p className="b-free"><Icon name="people" size={15} />{free} lugares libres</p>
      </div>
    </Link>
  )
}

function MapScreen() {
  const [selectedId, setSelectedId] = useState('e1')
  const selected = byId(selectedId)
  const others = upcoming.filter(event => event.id !== selectedId)
  return (
    <div className="b-map map-full">
      <div className="b-map-canvas"><MapSketch selectedId={selectedId} onSelect={setSelectedId} /></div>
      <header className="b-map-top">
        <div className="b-glass b-map-title"><h1>Encontrá tu próximo plan</h1><p>Eventos públicos en el mapa</p></div>
        <button type="button" className="b-ink-round lg" aria-label="Mi ubicación"><Icon name="locate" /></button>
      </header>
      <section className="b-sheet" aria-label="Eventos en esta zona">
        <span className="b-handle" aria-hidden="true" />
        <div className="b-head"><h2>En esta zona</h2><span>{upcoming.length} eventos</span></div>
        <article className="b-sel">
          <div className="b-sel-photo"><Scene id={selected.scene} /></div>
          <div className="b-sel-body"><span className="b-cat"><Icon name={categoryIcon[selected.category]} size={14} />{selected.category}</span><h3>{selected.title}</h3><p>{selected.day} · {selected.time} · {selected.zone}</p></div>
          <Link to={eventLink(selected)} className="b-ink-round" aria-label={`Ver ${selected.title}`}><Icon name="arrowUpRight" size={20} /></Link>
        </article>
        <ul className="b-mini-list" aria-label="Otros eventos">
          {others.slice(0, 3).map(event => (
            <li key={event.id}><button type="button" onClick={() => setSelectedId(event.id)}><span className="b-mini-time">{event.time}</span><span className="b-mini-title"><b>{event.title}</b><i>{event.day} · {event.zone}</i></span><Icon name="chevronRight" size={18} /></button></li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function MyEvents() {
  const { role, setRole, filter, setFilter, list, counts } = useMyEvents()
  const groups = [...new Map(list.map(event => [event.dayShort, event.day])).entries()]
  const barClass = (status: Ev['status']) => status === 'Publicado' ? 'ok' : status === 'Cancelado' ? 'bad' : 'past'
  return (
    <div className="b-events">
      <Wash />
      <header className="b-ev-head rise">
        <h1>Mis eventos</h1>
        <Link to="/b/create" className="b-ink-round lg" aria-label="Crear evento"><Icon name="plus" size={24} /></Link>
      </header>
      <div className="b-seg rise" style={{ '--i': 1 } as never} role="tablist" aria-label="Rol">
        {(['organizo', 'participo'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={role === value} className={role === value ? 'on' : ''} onClick={() => { setRole(value); setFilter('Todos') }}>
            {value === 'organizo' ? 'Organizo' : 'Participo'} <span>{counts[value]}</span>
          </button>
        ))}
      </div>
      <ul className="b-filters rise" style={{ '--i': 2 } as never} aria-label="Filtrar por estado">
        {statusFilters.map(item => <li key={item}><button type="button" className={filter === item ? 'on' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button></li>)}
      </ul>
      {list.length === 0 && <div className="b-empty b-glass" role="status"><Icon name="calendar" size={26} /><h2>No hay eventos {filter.toLowerCase()}</h2><p>Cuando haya, aparecen acá en orden cronológico.</p></div>}
      <div className="b-timeline">
        {groups.map(([key, label]) => (
          <section key={key} aria-label={label}>
            <h2 className="b-day-title">{label} <span>{key.split(' ')[1]}</span></h2>
            <ul>
              {list.filter(event => event.dayShort === key).map(event => (
                <li key={event.id} className="b-slot">
                  <time>{event.time}</time>
                  <article className={`b-event ${barClass(event.status)}`}>
                    <div className="b-event-main">
                      <div className="b-event-thumb"><Scene id={event.scene} /></div>
                      <div><h3><Link to={eventLink(event)} className="bx-stretch">{event.title}</Link></h3><p>{event.category} · {event.place}</p></div>
                      <button type="button" className="b-more" aria-label={`Acciones de ${event.title}`}><Icon name="more" /></button>
                    </div>
                    <div className="b-event-foot"><span className={`b-state ${barClass(event.status)}`}><i />{event.status}</span><span>{event.going}/{event.capacity} inscriptos</span></div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function Profile() {
  const organizo = events.filter(event => event.role === 'organizo').length
  const participo = events.filter(event => event.role === 'participo').length
  return (
    <div className="b-profile">
      <Wash />
      <header className="b-top rise"><h2 className="b-page">Mi perfil</h2><Link to="/b/notifications" className="b-ink-round" aria-label="Notificaciones, 2 sin leer"><Icon name="bell" size={21} /><i className="b-pip" /></Link></header>
      <section className="b-id rise" style={{ '--i': 1 } as never} aria-label="Tus datos">
        <span className="b-avatar" role="img" aria-label="Avatar de ejemplo">LB</span>
        <h1>{me.name}</h1>
        <p className="b-user">@{me.username}</p>
      </section>
      <p className="b-bio b-glass rise" style={{ '--i': 2 } as never}>{me.bio}</p>
      <dl className="b-stats rise" style={{ '--i': 3 } as never}>
        <div className="b-glass"><dd>{organizo}</dd><dt>Organizás</dt></div>
        <div className="b-glass"><dd>{participo}</dd><dt>Participás</dt></div>
        <div className="b-glass"><dd>{upcoming.length}</dd><dt>Próximos</dt></div>
      </dl>
      <ul className="b-account b-glass rise" style={{ '--i': 4 } as never} aria-label="Tu cuenta">
        <li><span className="b-ico-light"><Icon name="email" size={20} /></span><div><b>Correo de tu cuenta</b><i>{me.email}</i></div></li>
        <li><NavLinkTo dir="b" tab="events" label="Mis eventos"><span className="b-ico-light"><Icon name="calendar" size={20} /></span><div><b>Mis eventos</b></div><Icon name="chevronRight" size={18} /></NavLinkTo></li>
        <li><Link to="/b/notifications"><span className="b-ico-light"><Icon name="bell" size={20} /></span><div><b>Notificaciones</b></div><span className="b-badge">2</span></Link></li>
        <li><button type="button" className="danger"><span className="b-ico-light"><Icon name="logout" size={20} /></span><div><b>Cerrar sesión</b></div></button></li>
      </ul>
    </div>
  )
}

// oxlint-disable-next-line react/only-export-components -- el registro consume Screens como mapa de pantallas
export const Screens: Record<Tab, () => React.JSX.Element> = { home: Home, map: MapScreen, events: MyEvents, profile: Profile }
