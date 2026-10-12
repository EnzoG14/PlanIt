import type { ComponentType } from 'react'
import type { Tab } from './shared/data'
import { Nav as NavA, Screens as ScreensA } from './a/A'
import { Nav as NavB, Screens as ScreensB } from './b/B'
import { Nav as NavC, Screens as ScreensC } from './c/C'
import { extraB } from './b/extra'

// Pantalla adicional de una dirección (ej. Detalle del evento). `navTab` indica qué pestaña queda activa.
export type Extra = { id: string; label: string; group: string; navTab: Tab; nav: boolean; Component: ComponentType; variants?: { id: string; label: string }[]; defaultVariant?: string }
export type DirectionId = 'a' | 'b' | 'c'
export type Direction = {
  id: DirectionId
  letter: string
  name: string
  reference: string
  tagline: string
  tone: 'dark' | 'light'
  palette: { name: string; hex: string }[]
  keeps: string[]
  breaks: string[]
  font: string
  Nav: ComponentType<{ tab: Tab }>
  Screens: Record<Tab, ComponentType>
  extra?: Extra[]
}

export const directions: Direction[] = [
  {
    id: 'a', letter: 'A', name: 'Marea nocturna', reference: 'Referencia 1 · app de cruceros', tone: 'dark',
    tagline: 'Fotografía a sangre sobre marino profundo. El evento es la imagen; la interfaz flota encima.',
    palette: [{ name: 'Marino', hex: '#060b27' }, { name: 'Elevado', hex: '#0d1638' }, { name: 'Azul', hex: '#0753ff' }, { name: 'Violeta', hex: '#8d66fa' }, { name: 'Texto', hex: '#f8f8ff' }],
    keeps: ['Dark-first marino', 'Azul para acción y selección', 'Violeta puntual', 'Iconos lineales y cuatro pestañas'],
    breaks: ['Fotos protagonistas a gran escala con overlay', 'Barra inferior flotante con sombra', 'Sombras y blur funcionales sobre foto', 'Fuente externa (Urbanist)'],
    font: 'Urbanist',
    Nav: NavA, Screens: ScreensA,
  },
  {
    id: 'b', letter: 'B', name: 'Amanecer', reference: 'Referencia 2 · agenda con luz difusa', tone: 'light',
    tagline: 'Claro, aireado y tipográfico. Una mancha de luz violeta-azul detrás de tarjetas blancas; la agenda manda.',
    palette: [{ name: 'Lavanda', hex: '#f6f5fd' }, { name: 'Tinta', hex: '#060b27' }, { name: 'Azul', hex: '#0753ff' }, { name: 'Violeta', hex: '#8d66fa' }, { name: 'Foco', hex: '#c5b5ff' }],
    keeps: ['Marino como tinta y dock', 'Azul/violeta como luz y selección', 'Mismas pestañas y datos'],
    breaks: ['Modo claro como base', 'Gradiente difuso decorativo de fondo', 'Tarjetas con vidrio y sombra suave', 'Pill grande de tinta como acción', 'Fuente externa (Bricolage Grotesque)'],
    font: 'Bricolage Grotesque',
    Nav: NavB, Screens: ScreensB, extra: extraB,
  },
  {
    id: 'c', letter: 'C', name: 'Bento tonal', reference: 'Referencia 3 · panel de reuniones', tone: 'light',
    tagline: 'Un tablero de baldosas tonales: números, atención y listas en bloques claros. Informa antes de decorar.',
    palette: [{ name: 'Gris frío', hex: '#eef0f7' }, { name: 'Marino', hex: '#0d1638' }, { name: 'Azul', hex: '#0753ff' }, { name: 'Violeta suave', hex: '#e7e0ff' }, { name: 'Menta suave', hex: '#d3f5ea' }],
    keeps: ['Marino como baldosa oscura', 'Azul de acción', 'Success verde en estados', 'Violeta como tono de baldosa'],
    breaks: ['Modo claro como base', 'Baldosas de color tonal (rellenos suaves)', 'Acción central elevada en la barra', 'Fuente externa (Onest)'],
    font: 'Onest',
    Nav: NavC, Screens: ScreensC,
  },
]

export const directionById = (id: string) => directions.find(direction => direction.id === id)
