/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { directionById, type DirectionId } from '../registry'
import { tabLabels, tabs, type Tab } from './data'
import { VariantContext } from './variant'

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span className="sb-time">9:41</span>
      <span className="sb-island" />
      <span className="sb-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6.4 6.4 0 0 1 9 0M6 9.4a3 3 0 0 1 4 0" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" /></svg>
      </span>
    </div>
  )
}

export const isTab = (value?: string): value is Tab => tabs.includes(value as Tab)

// `screen` es una pestaña principal o el id de una pantalla extra de la dirección.
export function Phone({ dir, screen, variant = null, live = false }: { dir: DirectionId; screen: string; variant?: string | null; live?: boolean }) {
  const direction = directionById(dir)!
  const extra = direction.extra?.find(item => item.id === screen)
  const Screen = extra ? extra.Component : isTab(screen) ? direction.Screens[screen] : direction.Screens.home
  const navTab: Tab = extra ? extra.navTab : isTab(screen) ? screen : 'home'
  const label = extra ? extra.label : tabLabels[navTab]
  return (
    <div className={`phone dir-${dir} ${direction.tone} ${live ? 'live' : ''}`}>
      <StatusBar />
      <VariantContext.Provider value={variant}>
        <div className="screen" key={`${screen}:${variant}`} role="region" aria-label={`Dirección ${direction.letter}, ${label}`}><Screen /></div>
      </VariantContext.Provider>
      {(!extra || extra.nav) && <direction.Nav tab={navTab} />}
    </div>
  )
}
