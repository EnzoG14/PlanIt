import { useState } from 'react'
import { Icon, categoryIcon, type IconName } from '../shared/Icon'
import { MapSketch } from '../shared/MapSketch'
import { NavLinkTo } from '../shared/NavLinkTo'
import { Scene } from '../shared/Scene'
import { byId, categories, events, me, statusFilters, tabLabels, tabs, upcoming, type Category, type Ev, type Tab } from '../shared/data'
import { useMyEvents } from '../shared/useMyEvents'

const navIcons: Record<Tab, IconName> = { home: 'home', map: 'map', events: 'calendar', profile: 'user' }

export function Nav({ tab }: { tab: Tab }) {
  return (
    <nav className="a-nav" aria-label="Navegación principal">
      {tabs.map(item => (
        <NavLinkTo key={item} dir="a" tab={item} label={tabLabels[item]} current={item === tab} className={`a-nav-item ${item === tab ? 'on' : ''}`}>
          <Icon name={navIcons[item]} size={22} /><span>{tabLabels[item]}</span>
        </NavLinkTo>
      ))}
    </nav>
  )
}

function Seats({ event }: { event: Ev }) {
  const free = event.capacity - event.going
  return (
    <div className="a-seats">
      <span className="a-seats-bar" aria-hidden="true"><i style={{ width: `${(event.going / event.capacity) * 100}%` }} /></span>
      <span>{free === 0 ? 'Cupo completo' : `${free} lugares libres`}</span>
    </div>
  )
}

function Faces({ n }: { n: number }) {
  const initials = ['MR', 'JP', 'AS']
  return (
    <span className="a-faces"><span className="a-faces-stack" aria-hidden="true">{initials.map((value, i) => <i key={value} className={`f${i}`}>{value}</i>)}</span><b>{n} van</b></span>
  )
}

function Home() {
  const [liked, setLiked] = useState<Set<string>>(new Set(['e1']))
  const [cat, setCat] = useState<Category | null>(null)
  const popular = upcoming.filter(event => !cat || event.category === cat)
  const next = ['e6', 'e7', 'e1', 'e5'].map(byId)
  const toggle = (id: string) => setLiked(current => { const copy = new Set(current); if (copy.has(id)) copy.delete(id); else copy.add(id); return copy })
  return (
    <div className="a-home">
      <header className="a-top rise">
        <button className="a-place" type="button"><Icon name="pin" size={18} /><span>Buenos Aires, AR</span><Icon name="chevronDown" size={16} /></button>
        <div className="a-top-actions">
          <button className="a-round" type="button" aria-label="Notificaciones, 2 sin leer"><Icon name="bell" /><i className="a-dot" /></button>
          <span className="a-avatar sm" aria-hidden="true">LB</span>
        </div>
      </header>
      <section className="a-greet rise" style={{ '--i': 1 } as never}>
        <h1>Hola, {me.firstName}</h1>
        <p>Encontrá tu próximo plan</p>
      </section>
      <div className="a-search rise" style={{ '--i': 2 } as never}><Icon name="search" /><span>Buscar eventos, lugares, fechas…</span><span className="a-search-btn"><Icon name="sliders" size={20} /></span></div>
      <ul className="a-cats rise" style={{ '--i': 3 } as never} aria-label="Categorías">
        {categories.map(category => (
          <li key={category}>
            <button type="button" className={`a-cat ${cat === category ? 'on' : ''}`} aria-pressed={cat === category} onClick={() => setCat(cat === category ? null : category)}>
              <span className="a-cat-tile"><Icon name={categoryIcon[category]} size={26} /></span><span>{category}</span>
            </button>
          </li>
        ))}
      </ul>
      <section className="a-section">
        <div className="a-section-head"><h2>Populares</h2><button type="button" className="a-link">Ver todo<Icon name="arrowRight" size={16} /></button></div>
        <ul className="a-carousel" aria-label="Eventos populares">
          {popular.map(event => (
            <li key={event.id} className="a-pop">
              <Scene id={event.scene} />
              <span className="a-pop-shade" aria-hidden="true" />
              <span className="a-chip">{event.category}</span>
              <button type="button" className={`a-heart ${liked.has(event.id) ? 'on' : ''}`} aria-pressed={liked.has(event.id)} aria-label={`Guardar ${event.title}`} onClick={() => toggle(event.id)}><Icon name="heart" size={20} /></button>
              <div className="a-pop-info">
                <h3>{event.title}</h3>
                <p>{event.day} · {event.time} · {event.zone}</p>
                <Faces n={event.going} />
              </div>
            </li>
          ))}
          {!popular.length && <li className="a-empty">No hay eventos próximos de esta categoría.</li>}
        </ul>
      </section>
      <section className="a-section">
        <div className="a-section-head"><h2>Próximos esta semana</h2></div>
        <ul className="a-rows">
          {next.map(event => (
            <li key={event.id} className="a-row">
              <div className="a-thumb"><Scene id={event.scene} /></div>
              <div className="a-row-body">
                <h3>{event.title}</h3>
                <p><Icon name="clock" size={15} />{event.day} · {event.time}</p>
                <p><Icon name="pin" size={15} />{event.place}</p>
                <Seats event={event} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="a-banner" aria-label="Resumen de la semana">
        <Scene id="sunset" />
        <span className="a-banner-shade" aria-hidden="true" />
        <div><h2>Esta semana, {upcoming.length} eventos</h2><p>Cerca de donde estás ahora</p></div>
        <span className="a-go"><Icon name="arrowRight" /></span>
      </section>
    </div>
  )
}

function MapScreen() {
  const [selectedId, setSelectedId] = useState<string>('e1')
  const selected = byId(selectedId)
  const others = upcoming.filter(event => event.id !== selectedId)
  return (
    <div className="a-map map-full">
      <div className="a-map-canvas"><MapSketch selectedId={selectedId} onSelect={setSelectedId} /></div>
      <header className="a-map-top">
        <div><h1>Encontrá tu próximo plan</h1><p>Eventos públicos en el mapa</p></div>
        <button type="button" className="a-round big" aria-label="Mi ubicación"><Icon name="locate" /></button>
      </header>
      <section className="a-sheet" aria-label="Eventos en esta zona">
        <span className="a-handle" aria-hidden="true" />
        <div className="a-section-head tight"><h2>En esta zona</h2><span className="a-count">{upcoming.length} eventos</span></div>
        <article className="a-selected">
          <div className="a-thumb lg"><Scene id={selected.scene} /></div>
          <div className="a-selected-body">
            <span className="a-chip flat">{selected.category}</span>
            <h3>{selected.title}</h3>
            <p><Icon name="clock" size={15} />{selected.day} · {selected.time}</p>
            <p><Icon name="pin" size={15} />{selected.place}</p>
          </div>
          <button type="button" className="a-cta" aria-label={`Ver ${selected.title}`}><span>Ver evento</span><span className="a-go sm"><Icon name="arrowRight" size={18} /></span></button>
        </article>
        <ul className="a-mini-strip" aria-label="Otros eventos">
          {others.map(event => (
            <li key={event.id}><button type="button" className="a-mini" onClick={() => setSelectedId(event.id)}><span className="a-thumb sm"><Scene id={event.scene} /></span><span><b>{event.title}</b><i>{event.day} · {event.zone}</i></span></button></li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const statusClass: Record<Ev['status'], string> = { Publicado: 'ok', Finalizado: 'past', Cancelado: 'bad', Archivado: 'past' }

function MyEvents() {
  const { role, setRole, filter, setFilter, list, counts } = useMyEvents()
  const hero = list.find(event => event.status === 'Publicado' && event.upcoming)
  const rest = list.filter(event => event !== hero)
  return (
    <div className="a-events">
      <header className="a-ev-head rise">
        <div><h1>Mis eventos</h1><p>{role === 'organizo' ? 'Eventos que organizás' : 'Eventos en los que participás'}</p></div>
        <button type="button" className="a-create"><Icon name="plus" size={20} />Crear</button>
      </header>
      <div className="a-seg rise" style={{ '--i': 1 } as never} role="tablist" aria-label="Rol">
        {(['organizo', 'participo'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={role === value} className={role === value ? 'on' : ''} onClick={() => { setRole(value); setFilter('Todos') }}>
            {value === 'organizo' ? 'Organizo' : 'Participo'}<span>{counts[value]}</span>
          </button>
        ))}
      </div>
      <ul className="a-filters rise" style={{ '--i': 2 } as never} aria-label="Filtrar por estado">
        {statusFilters.map(item => <li key={item}><button type="button" className={filter === item ? 'on' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button></li>)}
      </ul>
      {hero && (
        <section className="a-hero rise" style={{ '--i': 3 } as never} aria-label="Tu próximo evento">
          <Scene id={hero.scene} />
          <span className="a-hero-shade" aria-hidden="true" />
          <span className="a-countdown">Tu próximo evento · {hero.day} · {hero.time}</span>
          <div className="a-hero-info">
            <h2>{hero.title}</h2>
            <p><Icon name="pin" size={16} />{hero.place}</p>
            <div className="a-hero-foot"><Seats event={hero} /><button type="button" className="a-cta sm"><span>{role === 'organizo' ? 'Gestionar' : 'Ver evento'}</span><span className="a-go sm"><Icon name="arrowRight" size={18} /></span></button></div>
          </div>
        </section>
      )}
      {list.length === 0 && (
        <div className="a-emptystate" role="status"><Icon name="calendar" size={28} /><h2>No hay eventos {filter.toLowerCase()}</h2><p>Cuando haya, los vas a ver acá.</p><button type="button" className="a-cta"><span>Crear evento</span><span className="a-go sm"><Icon name="plus" size={18} /></span></button></div>
      )}
      <ul className="a-rows managed">
        {rest.map(event => (
          <li key={event.id} className="a-row">
            <div className="a-thumb"><Scene id={event.scene} /></div>
            <div className="a-row-body">
              <h3>{event.title}</h3>
              <p><Icon name="clock" size={15} />{event.dayShort} · {event.time}</p>
              <p><Icon name="pin" size={15} />{event.place}</p>
              <span className={`a-status ${statusClass[event.status]}`}><i />{event.status}</span>
            </div>
            <button type="button" className="a-more" aria-label={`Acciones de ${event.title}`}><Icon name="more" /></button>
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
    <div className="a-profile">
      <div className="a-cover"><Scene id="sunset" /><span className="a-cover-shade" aria-hidden="true" /><button type="button" className="a-round on-photo" aria-label="Notificaciones, 2 sin leer"><Icon name="bell" /><i className="a-dot" /></button></div>
      <section className="a-identity" aria-label="Tus datos">
        <span className="a-avatar xl" role="img" aria-label="Avatar de ejemplo">LB</span>
        <h1>{me.name}</h1>
        <p className="a-user">@{me.username}</p>
        <p className="a-bio">{me.bio}</p>
      </section>
      <dl className="a-stats">
        <div><dt>Organizás</dt><dd>{organizo}</dd></div>
        <div><dt>Participás</dt><dd>{participo}</dd></div>
        <div><dt>Próximos</dt><dd>{upcoming.length}</dd></div>
      </dl>
      <ul className="a-account" aria-label="Tu cuenta">
        <li><span className="a-ico"><Icon name="email" /></span><div><b>Correo de tu cuenta</b><i>{me.email}</i></div></li>
        <li><NavLinkTo dir="a" tab="events" label="Mis eventos"><span className="a-ico"><Icon name="calendar" /></span><div><b>Mis eventos</b></div><Icon name="chevronRight" size={18} /></NavLinkTo></li>
        <li><button type="button"><span className="a-ico"><Icon name="bell" /></span><div><b>Notificaciones</b></div><span className="a-badge">2</span></button></li>
        <li><button type="button" className="danger"><span className="a-ico"><Icon name="logout" /></span><div><b>Cerrar sesión</b></div></button></li>
      </ul>
    </div>
  )
}

// oxlint-disable-next-line react/only-export-components -- el registro consume Screens como mapa de pantallas
export const Screens: Record<Tab, () => React.JSX.Element> = { home: Home, map: MapScreen, events: MyEvents, profile: Profile }
