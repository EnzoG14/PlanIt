import { events } from './data'

type Props = {
  selectedId: string | null
  onSelect: (id: string) => void
  viewBox?: string
  className?: string
}

// Mapa estilizado (no es un proveedor real). Los colores vienen de variables CSS --map-*.
export function MapSketch({ selectedId, onSelect, viewBox = '0 0 390 844', className }: Props) {
  const pins = events.filter(event => event.status === 'Publicado')
  const streetsH = [60, 140, 220, 300, 380, 460, 540, 620, 700, 780]
  const streetsV = [30, 100, 170, 240, 310, 370]
  return (
    <svg className={`map-sketch ${className ?? ''}`} viewBox={viewBox} preserveAspectRatio="xMidYMid slice" role="group" aria-label="Mapa de ejemplo con eventos">
      <rect x="-40" y="-40" width="480" height="940" className="m-bg" />
      <path d="M-40 90q120-30 200 20t240 10v-170h-440z" className="m-water" />
      <path d="M392 330q-60 50-40 130t60 140v-310z" className="m-water" />
      <path d="M40 180h104v66H40zM214 236h86v90h-86zM64 398h120v86H64zM250 420h110v76H250z" className="m-park" />
      {streetsH.map(y => <path key={y} d={`M-10 ${y}h410`} className="m-street" />)}
      {streetsV.map(x => <path key={x} d={`M${x} -10v880`} className="m-street" />)}
      <path d="M-10 520 400 190M-10 640 400 330" className="m-avenue" />
      <path d="M200 -10c-20 200 40 400 10 880" className="m-avenue" />
      <g className="m-labels">
        <text x="48" y="172">PALERMO</text><text x="226" y="228">CENTENARIO</text><text x="72" y="392">CHACARITA</text><text x="262" y="414">PUERTO MADERO</text>
      </g>
      {pins.map(event => {
        const selected = event.id === selectedId
        const x = event.pin.x
        const y = event.pin.y
        return (
          <g key={event.id} className={`m-pin ${selected ? 'is-selected' : ''}`} transform={`translate(${x} ${y})`} tabIndex={0} role="button" aria-label={`${event.title}, ${event.zone}`} aria-pressed={selected}
            onClick={() => onSelect(event.id)} onKeyDown={key => { if (key.key === 'Enter' || key.key === ' ') { key.preventDefault(); onSelect(event.id) } }}>
            <circle r="22" className="m-hit" />
            {selected && <circle r="20" className="m-ring" />}
            <circle r={selected ? 13 : 9} className={`m-dot ${event.category === 'Música' || event.category === 'Arte' ? 'violet' : 'blue'}`} />
            <circle r={selected ? 4 : 3} className="m-core" />
          </g>
        )
      })}
      <g className="m-me" transform="translate(196 360)"><circle r="16" className="m-me-halo" /><circle r="6" className="m-me-dot" /></g>
    </svg>
  )
}
