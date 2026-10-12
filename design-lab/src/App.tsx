import { useEffect } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { directions, directionById, type Direction, type DirectionId } from './registry'
import { Phone, isTab } from './shared/Phone'
import { tabLabels, tabs } from './shared/data'

function Landing() {
  useEffect(() => { document.title = 'PlanIt · Design Lab' }, [])
  return (
    <div className="lab-page">
      <header className="lab-hero">
        <p className="lab-kicker">PlanIt · Design Lab</p>
        <h1>Tres direcciones para la nueva UI</h1>
        <p className="lab-lede">Las mismas cuatro pantallas (Inicio, Mapa, Mis eventos y Perfil) con los mismos datos, resueltas en tres mundos visuales distintos. Todo es mock: ilustraciones de reemplazo, personas y eventos ficticios. La dirección B · Amanecer ya incluye además las pantallas de detalle de R1–R3.</p>
      </header>
      <section aria-label="Direcciones" className="dir-cards">
        {directions.map(direction => (
          <article key={direction.id} className={`dir-card dir-card-${direction.id}`}>
            <div className="dir-card-head"><span className="dir-letter">{direction.letter}</span><div><h2>{direction.name}</h2><p className="dir-ref">{direction.reference}</p></div></div>
            <p className="dir-tagline">{direction.tagline}</p>
            <ul className="swatches" aria-label="Paleta">{direction.palette.map(color => <li key={color.hex}><span style={{ background: color.hex }} /><b>{color.name}</b><code>{color.hex}</code></li>)}</ul>
            <div className="dir-lists">
              <div><h3>Conserva</h3><ul>{direction.keeps.map(item => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>Rompe de DESIGN.md</h3><ul>{direction.breaks.map(item => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="dir-actions"><Link className="lab-btn primary" to={`/${direction.id}`}>Ver las pantallas</Link><Link className="lab-btn" to={`/${direction.id}/home`}>Probar interactivo</Link></div>
          </article>
        ))}
      </section>
      <section aria-label="Comparar por pantalla" className="compare-links">
        <h2>Comparar una pantalla en las tres direcciones</h2>
        <div>{tabs.map(tab => <Link key={tab} className="lab-btn" to={`/compare/${tab}`}>{tabLabels[tab]}</Link>)}</div>
      </section>
      {directions.filter(direction => direction.extra).map(direction => (
        <section key={direction.id} aria-label={`Pantallas adicionales de ${direction.name}`} className="compare-links">
          <h2>{direction.letter} · {direction.name}: pantallas R1–R3 adicionales</h2>
          <div>{direction.extra!.map(item => <Link key={item.id} className="lab-btn" to={`/${direction.id}/${item.id}`}>{item.label}</Link>)}</div>
        </section>
      ))}
      <footer className="lab-foot">Ilustraciones SVG de reemplazo: en la app real irían fotografías autorizadas. El buscador y los chips de categoría de Inicio/Mapa son composición visual del mock, no funciones nuevas.</footer>
    </div>
  )
}

function Overview() {
  const { dir } = useParams()
  const direction = directionById(dir ?? '')
  useEffect(() => { document.title = `${direction?.letter ?? ''} · ${direction?.name ?? ''} · Design Lab` }, [direction])
  if (!direction) return <Navigate to="/" replace />
  return (
    <div className="lab-page wide">
      <TopBar current={direction.id} />
      <header className="lab-hero compact"><h1>{direction.letter} · {direction.name}</h1><p className="lab-lede">{direction.tagline}</p></header>
      <h2 className="lab-section">Pestañas principales</h2>
      <div className="phone-row">
        {tabs.map(tab => (
          <figure key={tab} className="phone-cell">
            <Phone dir={direction.id} screen={tab} />
            <figcaption><Link to={`/${direction.id}/${tab}`}>{tabLabels[tab]} · abrir interactivo</Link></figcaption>
          </figure>
        ))}
      </div>
      {direction.extra && (
        <>
          <h2 className="lab-section">Pantallas de evento y cuenta (R1–R3)</h2>
          <p className="lab-lede small">Cada una tiene variantes de estado: abrila en modo interactivo y cambialas desde la barra superior.</p>
          <div className="phone-row">
            {direction.extra.map(item => (
              <figure key={item.id} className="phone-cell">
                <Phone dir={direction.id} screen={item.id} />
                <figcaption><Link to={`/${direction.id}/${item.id}`}>{item.label} · abrir interactivo</Link></figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Live() {
  const { dir, tab = '' } = useParams()
  const [params] = useSearchParams()
  const direction = directionById(dir ?? '')
  const extra = direction?.extra?.find(item => item.id === tab)
  const variant = params.get('v')
  useEffect(() => { document.title = `${direction?.letter ?? ''} · ${extra?.label ?? tabLabels[tab as keyof typeof tabLabels] ?? tab} · Design Lab` }, [direction, extra, tab])
  if (!direction || (!isTab(tab) && !extra)) return <Navigate to="/" replace />
  return (
    <div className="live-page">
      <TopBar current={direction.id} screen={tab} extra={direction.extra} />
      {extra?.variants && (
        <nav className="lab-variants" aria-label={`Estados de ${extra.label}`}>
          <span>Estado</span>
          {extra.variants.map(item => {
            const active = variant ? variant === item.id : item.id === extra.defaultVariant
            return <Link key={item.id} to={`/${direction.id}/${extra.id}?v=${item.id}${params.get('e') ? `&e=${params.get('e')}` : ''}`} replace className={`pill small ${active ? 'active' : ''}`} aria-current={active ? 'true' : undefined}>{item.label}</Link>
          })}
        </nav>
      )}
      <div className="live-stage"><Phone dir={direction.id} screen={tab} variant={variant} live /></div>
    </div>
  )
}

function Compare() {
  const { tab } = useParams()
  useEffect(() => { document.title = `Comparar ${tab ?? ''} · Design Lab` }, [tab])
  if (!isTab(tab)) return <Navigate to="/" replace />
  return (
    <div className="lab-page wide">
      <TopBar />
      <header className="lab-hero compact"><h1>Comparar · {tabLabels[tab]}</h1>
        <nav className="pill-nav" aria-label="Pantalla">{tabs.map(item => <NavLink key={item} to={`/compare/${item}`} className="pill">{tabLabels[item]}</NavLink>)}</nav></header>
      <div className="phone-row">
        {directions.map(direction => (
          <figure key={direction.id} className="phone-cell">
            <Phone dir={direction.id} screen={tab} />
            <figcaption><Link to={`/${direction.id}/${tab}`}><b>{direction.letter}</b> · {direction.name}</Link></figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function TopBar({ current, screen, extra }: { current?: DirectionId; screen?: string; extra?: Direction['extra'] }) {
  const isExtra = Boolean(screen && extra?.some(item => item.id === screen))
  return (
    <nav className="lab-topbar" aria-label="Design Lab">
      <Link to="/" className="lab-back">← Lab</Link>
      <span className="lab-sep" />
      {directions.map(direction => {
        // Al cambiar de dirección desde una pantalla extra que no existe allí, vuelve a Inicio.
        const target = !screen ? `/${direction.id}` : isExtra && !direction.extra?.some(item => item.id === screen) ? `/${direction.id}/home` : `/${direction.id}/${screen}`
        return <Link key={direction.id} to={target} className={`pill ${current === direction.id ? 'active' : ''}`} aria-current={current === direction.id ? 'page' : undefined}>{direction.letter} · {direction.name}</Link>
      })}
      {screen && <><span className="lab-sep" />{tabs.map(item => <Link key={item} to={`/${current}/${item}`} className={`pill ${item === screen ? 'active' : ''}`} aria-current={item === screen ? 'page' : undefined}>{tabLabels[item]}</Link>)}</>}
      {extra && screen && <><span className="lab-sep" /><span className="lab-group">R1–R3</span>{extra.map(item => <Link key={item.id} to={`/${current}/${item.id}`} className={`pill ${item.id === screen ? 'active' : ''}`} aria-current={item.id === screen ? 'page' : undefined}>{item.label}</Link>)}</>}
      {screen && isTab(screen) && <><span className="lab-sep" /><Link to={`/compare/${screen}`} className="pill">Comparar</Link></>}
    </nav>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/compare/:tab" element={<Compare />} />
      <Route path="/:dir" element={<Overview />} />
      <Route path="/:dir/:tab" element={<Live />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
