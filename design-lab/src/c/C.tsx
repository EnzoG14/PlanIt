import { useState } from 'react'
import { Icon, categoryIcon, type IconName } from '../shared/Icon'
import { MapSketch } from '../shared/MapSketch'
import { NavLinkTo } from '../shared/NavLinkTo'
import { Scene } from '../shared/Scene'
import { categories, events, me, statusFilters, tabLabels, upcoming, weekCounts, weekDays, type Ev, type Tab } from '../shared/data'
import { useMyEvents } from '../shared/useMyEvents'

const navIcons: Record<Tab, IconName> = { home: 'home', map: 'map', events: 'calendar', profile: 'user' }
const catTone = { Música: 'violet', Deporte: 'mint', Arte: 'blue', Comunidad: 'sand' } as const

function NavItem({ tab, current }: { tab: Tab; current: Tab }) {
  return <NavLinkTo dir="c" tab={tab} label={tabLabels[tab]} current={tab === current} className={`c-nav-item ${tab === current ? 'on' : ''}`}><Icon name={navIcons[tab]} size={22} /><span>{tabLabels[tab]}</span></NavLinkTo>
}

export function Nav({ tab }: { tab: Tab }) {
  return (
    <nav className="c-nav" aria-label="Navegación principal">
      <NavItem tab="home" current={tab} />
      <NavItem tab="map" current={tab} />
      <span className="c-fab-slot"><button type="button" className="c-fab" aria-label="Crear evento"><Icon name="plus" size={26} /></button><span>Crear</span></span>
      <NavItem tab="events" current={tab} />
      <NavItem tab="profile" current={tab} />
    </nav>
  )
}

function Tile({ tone, children, className = '' }: { tone: 'navy' | 'blue' | 'violet' | 'mint' | 'white'; children: React.ReactNode; className?: string }) {
  return <div className={`c-tile ${tone} ${className}`}>{children}</div>
}

function Home() {
  const free = upcoming.reduce((sum, event) => sum + (event.capacity - event.going), 0)
  const attention = events.filter(event => event.attention)
  const peak = Math.max(...weekCounts)
  return (
    <div className="c-home">
      <header className="c-top rise">
        <span className="c-avatar" aria-hidden="true">LB</span>
        <div><h1>Hola, {me.firstName}</h1><p>Este es tu panorama</p></div>
        <button type="button" className="c-icon-btn" aria-label="Notificaciones, 2 sin leer"><Icon name="bell" size={21} /><i className="c-pip" /></button>
      </header>
      <h2 className="c-label rise" style={{ '--i': 1 } as never}>Esta semana</h2>
      <section className="c-week rise" style={{ '--i': 1 } as never} aria-label="Eventos por día">
        <ul>
          {weekDays.map((day, i) => (
            <li key={day.n} className={i === 0 ? 'today' : ''}>
              <b className={weekCounts[i] === peak ? 'peak' : ''}>{weekCounts[i]}</b>
              <span className="c-bars" aria-hidden="true">{Array.from({ length: weekCounts[i] }, (_, k) => <i key={k} />)}</span>
              <small>{day.d}</small>
            </li>
          ))}
        </ul>
      </section>
      <div className="c-grid two rise" style={{ '--i': 2 } as never}>
        <Tile tone="navy"><b className="c-big">{upcoming.length}</b><span>Eventos próximos</span><small>publicados cerca tuyo</small></Tile>
        <Tile tone="mint"><b className="c-big">{free}</b><span>Cupos libres</span><small>sumando todos</small></Tile>
      </div>
      <h2 className="c-label">Necesita tu atención</h2>
      <ul className="c-list-card rise" style={{ '--i': 3 } as never}>
        {attention.map(event => (
          <li key={event.id}><button type="button"><span className={`c-chip-ico ${event.id === 'e1' ? 'violet' : 'mint'}`}><Icon name={event.id === 'e1' ? 'people' : 'user'} size={18} /></span><span className="c-grow"><b>{event.title}</b><i>{event.attention}</i></span><Icon name="chevronRight" size={18} /></button></li>
        ))}
      </ul>
      {categories.map(category => {
        const items = upcoming.filter(event => event.category === category)
        if (!items.length) return null
        return (
          <section key={category} className="c-cat">
            <div className="c-cat-head"><span className={`c-chip-ico ${catTone[category]}`}><Icon name={categoryIcon[category]} size={18} /></span><h2>{category}</h2><span>{items.length}</span></div>
            <ul className="c-grid two">{items.map(event => (
              <li key={event.id} className="c-mini"><div className="c-mini-photo"><Scene id={event.scene} /></div><h3>{event.title}</h3><p>{event.day} · {event.time}</p></li>
            ))}</ul>
          </section>
        )
      })}
    </div>
  )
}

function MapScreen() {
  const [selectedId, setSelectedId] = useState('e1')
  return (
    <div className="c-map">
      <header className="c-page-head"><div><h1>Encontrá tu próximo plan</h1><p>Eventos públicos en el mapa</p></div></header>
      <div className="c-map-tile">
        <MapSketch selectedId={selectedId} onSelect={setSelectedId} viewBox="30 130 330 290" />
        <span className="c-map-chip"><Icon name="pin" size={15} />Buenos Aires</span>
        <button type="button" className="c-icon-btn floating" aria-label="Mi ubicación"><Icon name="locate" /></button>
      </div>
      <div className="c-row-head"><h2 className="c-label">En esta zona</h2><span className="c-count">{upcoming.length} eventos</span></div>
      <ul className="c-rows">
        {upcoming.map(event => (
          <li key={event.id}>
            <button type="button" className={`c-row ${event.id === selectedId ? 'sel' : ''}`} aria-pressed={event.id === selectedId} onClick={() => setSelectedId(event.id)}>
              <span className="c-row-thumb"><Scene id={event.scene} /></span>
              <span className="c-grow"><b>{event.title}</b><i>{event.day} · {event.time}</i><i><Icon name="pin" size={14} />{event.zone}</i></span>
              {event.id === selectedId ? <span className="c-go"><Icon name="arrowUpRight" size={18} /></span> : <span className="c-time">{event.time}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const tone = (status: Ev['status']) => status === 'Publicado' ? 'ok' : status === 'Cancelado' ? 'bad' : 'past'

function MyEvents() {
  const { role, setRole, filter, setFilter, list, counts } = useMyEvents()
  const attention = role === 'organizo' ? events.filter(event => event.role === 'organizo' && event.attention) : []
  return (
    <div className="c-events">
      <header className="c-page-head rise"><h1>Mis eventos</h1><button type="button" className="c-create"><Icon name="plus" size={18} />Crear</button></header>
      <div className="c-grid two rise" style={{ '--i': 1 } as never} role="tablist" aria-label="Rol">
        {(['organizo', 'participo'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={role === value} className={`c-role ${role === value ? 'on' : ''}`} onClick={() => { setRole(value); setFilter('Todos') }}>
            <b className="c-big">{counts[value]}</b><span>{value === 'organizo' ? 'Organizo' : 'Participo'}</span>
          </button>
        ))}
      </div>
      {attention.length > 0 && (
        <section className="c-attn rise" style={{ '--i': 2 } as never} aria-label="Necesitan tu atención">
          <h2>Necesitan tu atención</h2>
          <ul>{attention.map(event => <li key={event.id}><span className="c-grow"><b>{event.title}</b><i>{event.attention}</i></span><button type="button" className="c-mini-btn">Revisar</button></li>)}</ul>
        </section>
      )}
      <ul className="c-filters rise" style={{ '--i': 3 } as never} aria-label="Filtrar por estado">
        {statusFilters.map(item => <li key={item}><button type="button" className={filter === item ? 'on' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button></li>)}
      </ul>
      {list.length === 0 && <div className="c-empty" role="status"><Icon name="calendar" size={26} /><h2>No hay eventos {filter.toLowerCase()}</h2><p>Cuando haya, los vas a ver en esta lista.</p></div>}
      <ul className="c-rows">
        {list.map(event => (
          <li key={event.id} className="c-row static">
            <span className="c-row-thumb"><Scene id={event.scene} /></span>
            <span className="c-grow">
              <b>{event.title}</b>
              <i><Icon name="clock" size={14} />{event.dayShort} · {event.time}</i>
              <i><Icon name="pin" size={14} />{event.place}</i>
              <span className={`c-status ${tone(event.status)}`}>{event.status}</span>
            </span>
            <button type="button" className="c-more" aria-label={`Acciones de ${event.title}`}><Icon name="more" /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Profile() {
  const organizo = events.filter(event => event.role === 'organizo').length
  const participo = events.filter(event => event.role === 'participo').length
  return (
    <div className="c-profile">
      <header className="c-page-head rise"><h1>Mi perfil</h1><button type="button" className="c-icon-btn" aria-label="Notificaciones, 2 sin leer"><Icon name="bell" size={21} /><i className="c-pip" /></button></header>
      <div className="c-grid two bento">
        <Tile tone="navy" className="span rise"><div className="c-id"><span className="c-avatar xl" role="img" aria-label="Avatar de ejemplo">LB</span><div><h2>{me.name}</h2><p>@{me.username}</p></div></div></Tile>
        <Tile tone="white" className="span rise"><h3 className="c-label">Sobre mí</h3><p className="c-bio">{me.bio}</p></Tile>
        <Tile tone="blue" className="rise"><b className="c-big">{organizo}</b><span>Eventos que organizás</span></Tile>
        <Tile tone="mint" className="rise"><b className="c-big">{participo}</b><span>Eventos en los que participás</span></Tile>
        <Tile tone="white" className="span rise"><div className="c-line"><span className="c-chip-ico blue"><Icon name="email" size={18} /></span><span className="c-grow"><b>Correo de tu cuenta</b><i>{me.email}</i></span></div></Tile>
        <NavLinkTo dir="c" tab="events" label="Mis eventos" className="c-tile violet link"><span className="c-chip-ico white"><Icon name="calendar" size={18} /></span><span className="c-link-text"><b>Mis eventos</b><Icon name="arrowUpRight" size={18} /></span></NavLinkTo>
        <button type="button" className="c-tile white link"><span className="c-chip-ico mint"><Icon name="bell" size={18} /></span><span className="c-link-text"><b>Notificaciones</b><span className="c-count-badge">2</span></span></button>
        <button type="button" className="c-tile white link span danger"><span className="c-line"><span className="c-chip-ico rose"><Icon name="logout" size={18} /></span><b>Cerrar sesión</b></span></button>
      </div>
    </div>
  )
}

// oxlint-disable-next-line react/only-export-components -- el registro consume Screens como mapa de pantallas
export const Screens: Record<Tab, () => React.JSX.Element> = { home: Home, map: MapScreen, events: MyEvents, profile: Profile }

