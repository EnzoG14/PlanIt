import { useId } from 'react'
import type { SceneId } from './data'

// "Fotos" de reemplazo: ilustraciones SVG autocontenidas. Sustituir por fotografías autorizadas en la app real.
export function Scene({ id, className }: { id: SceneId; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const g = (name: string) => `${name}${uid}`
  return (
    <svg className={`scene ${className ?? ''}`} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustración de ejemplo del evento" focusable="false">
      {id === 'sunset' && <>
        <defs>
          <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#241a63" /><stop offset=".45" stopColor="#a24ba8" /><stop offset=".72" stopColor="#ff8f5a" /><stop offset="1" stopColor="#ffd08a" /></linearGradient>
          <linearGradient id={g('sea')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b2a7a" /><stop offset="1" stopColor="#0b1450" /></linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#${g('sky')})`} />
        <circle cx="250" cy="168" r="36" fill="#ffe9b0" />
        <rect y="190" width="400" height="110" fill={`url(#${g('sea')})`} />
        {[[228, 196, 44], [234, 206, 32], [240, 217, 22], [236, 230, 30], [244, 244, 14]].map(([x, y, w]) => <rect key={y} x={x} y={y} width={w} height="3" rx="1.5" fill="#ffd9a0" opacity=".75" />)}
        <path d="M0 192V122l38 14 52-38 46 42 36 52z" fill="#1a1448" />
        <path d="M400 192v-58l-48 16-38 42z" fill="#150f3d" />
      </>}
      {id === 'sea' && <>
        <defs>
          <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b8cff" /><stop offset="1" stopColor="#dbe9ff" /></linearGradient>
          <linearGradient id={g('sea')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0753ff" /><stop offset="1" stopColor="#06194f" /></linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#${g('sky')})`} />
        <circle cx="90" cy="70" r="26" fill="#fff" opacity=".7" />
        <rect y="150" width="400" height="150" fill={`url(#${g('sea')})`} />
        <path d="M120 150 150 70v80z" fill="#fff" /><path d="M156 150V92l34 58z" fill="#e6eeff" />
        <path d="M112 152h82l-8 12h-66z" fill="#06194f" />
        <path d="M270 156 292 106v50z" fill="#fff" /><path d="M296 156v-40l24 40z" fill="#e6eeff" />
        <path d="M262 158h66l-6 9h-54z" fill="#8d66fa" />
        {[190, 216, 244, 272].map((y, i) => <path key={y} d={`M${20 + i * 40} ${y}q30-10 60 0t60 0t60 0t60 0`} stroke="#fff" strokeOpacity=".28" strokeWidth="2" fill="none" />)}
      </>}
      {id === 'trail' && <>
        <defs><linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fc0ff" /><stop offset="1" stopColor="#fff0cf" /></linearGradient></defs>
        <rect width="400" height="300" fill={`url(#${g('sky')})`} />
        <circle cx="318" cy="64" r="22" fill="#fff6d8" />
        <path d="M0 170q70-60 150-24t140-22q60-16 110 20v156H0z" fill="#4aa070" />
        <path d="M0 214q90-50 190-14t210-12v112H0z" fill="#2f7c55" />
        <path d="M0 262q120-44 230-16t170 0v54H0z" fill="#1f5a3c" />
        <path d="M150 300q30-40 20-70t48-34" stroke="#f1dfb8" strokeWidth="14" strokeLinecap="round" fill="none" opacity=".9" />
        {[[60, 190], [96, 204], [320, 190], [356, 206], [280, 176]].map(([x, y]) => <g key={`${x}${y}`}><rect x={x - 2} y={y} width="4" height="14" fill="#2a2a1c" /><circle cx={x} cy={y - 6} r="14" fill="#174530" /></g>)}
      </>}
      {id === 'concert' && <>
        <defs>
          <linearGradient id={g('bg')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0b2e" /><stop offset="1" stopColor="#2f1472" /></linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#${g('bg')})`} />
        <path d="M60 0h50l-110 230zM180 0h40l40 220H140zM300 0h50l60 230H260z" fill="#8d66fa" opacity=".26" />
        <path d="M130 0h30L60 220zM250 0h30l70 220z" fill="#0753ff" opacity=".3" />
        <rect y="176" width="400" height="124" fill="#05061c" />
        <rect x="120" y="150" width="160" height="30" rx="4" fill="#1a1446" />
        <rect x="190" y="118" width="20" height="34" rx="6" fill="#c5b5ff" />
        {Array.from({ length: 14 }, (_, i) => <g key={i}><circle cx={14 + i * 29 + (i % 2) * 8} cy={214 + (i % 3) * 14} r={15 + (i % 3) * 2} fill="#0a0a26" stroke="#1d1a4d" /><path d={`M${14 + i * 29} ${200 + (i % 3) * 12}l${i % 2 ? 5 : -5}-18`} stroke="#0a0a26" strokeWidth="5" strokeLinecap="round" /></g>)}
      </>}
      {id === 'studio' && <>
        <defs><linearGradient id={g('wall')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#efe7da" /><stop offset="1" stopColor="#c9bcab" /></linearGradient></defs>
        <rect width="400" height="300" fill={`url(#${g('wall')})`} />
        <path d="M250 0h110l40 300H210z" fill="#fff" opacity=".35" />
        <rect y="236" width="400" height="64" fill="#8a7a66" />
        {[[34, 40, 70, 90], [122, 56, 54, 70], [34, 146, 54, 60]].map(([x, y, w, h], i) => <g key={i}><rect x={x} y={y} width={w} height={h} fill="#fdfaf4" stroke="#3b3326" strokeWidth="5" /><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill={['#8d66fa', '#0753ff', '#13cb92'][i]} opacity=".75" /></g>)}
        <path d="M268 236l24-92M316 236l-24-92M292 236v-92" stroke="#2b2418" strokeWidth="5" strokeLinecap="round" />
        <rect x="262" y="116" width="62" height="38" rx="6" fill="#1b1a22" /><circle cx="300" cy="135" r="12" fill="#3a3a52" /><circle cx="300" cy="135" r="6" fill="#0753ff" />
      </>}
      {id === 'market' && <>
        <defs><linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe0c2" /><stop offset="1" stopColor="#fff7ec" /></linearGradient></defs>
        <rect width="400" height="300" fill={`url(#${g('sky')})`} />
        <rect y="238" width="400" height="62" fill="#d9c9ae" />
        {[0, 1].map(row => <g key={row}>
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={row * 210 + i * 20 - (row ? 0 : 6)} y={92 + row * 12} width="20" height="44" fill={i % 2 ? '#fdfaf4' : row ? '#0753ff' : '#8d66fa'} />)}
          <path d={`M${row * 210 - 6} ${136 + row * 12}h128l-8 10h-112z`} fill="#06194f" opacity=".18" />
          <rect x={row * 210 + 6} y={148 + row * 12} width="104" height={84 - row * 12} fill="#f3e5cc" />
          {[0, 1, 2].map(k => <rect key={k} x={row * 210 + 14 + k * 32} y={166 + row * 12} width="22" height="26" rx="4" fill={['#13cb92', '#ff8f5a', '#8d66fa'][(k + row) % 3]} opacity=".85" />)}
        </g>)}
        <path d="M0 30q100 36 200 0t200 0" stroke="#3b3326" strokeWidth="2" fill="none" />
        {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${14 + i * 34} ${i % 2 ? 44 : 38}l8 18 8-18z`} fill={['#0753ff', '#8d66fa', '#ff8f5a', '#13cb92'][i % 4]} />)}
      </>}
      {id === 'night' && <>
        <defs><linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070b2e" /><stop offset="1" stopColor="#233a8c" /></linearGradient></defs>
        <rect width="400" height="300" fill={`url(#${g('sky')})`} />
        <circle cx="318" cy="64" r="22" fill="#f1ecff" /><circle cx="328" cy="58" r="20" fill="#0f1a57" opacity=".35" />
        {[[0, 140, 58], [52, 100, 50], [98, 156, 44], [138, 84, 60], [194, 128, 48], [238, 108, 56], [290, 150, 50], [336, 118, 64]].map(([x, y, w], i) => <g key={i}>
          <rect x={x} y={y} width={w} height={300 - y} fill={i % 2 ? '#0a1038' : '#0d1647'} />
          {Array.from({ length: 8 }, (_, k) => <rect key={k} x={x + 8 + (k % 3) * 14} y={y + 12 + Math.floor(k / 3) * 22} width="6" height="9" fill="#ffd77a" opacity={(i + k) % 3 ? 0.85 : 0.2} />)}
        </g>)}
      </>}
    </svg>
  )
}
