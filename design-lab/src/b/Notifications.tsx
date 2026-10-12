/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../shared/Icon'
import { useVariant } from '../shared/variant'
import { notifications as seed, type Notif } from './mock'
import { BackBar } from './ui'

export const notificationsVariants = [
  { id: 'list', label: 'Con avisos' },
  { id: 'empty', label: 'Sin notificaciones' },
]

const iconFor = (target: Notif['target']): IconName => (target === 'chat' ? 'chat' : target === 'requests' ? 'userRemove' : 'calendar')
const hrefFor = (target: Notif['target']) => (target === 'chat' ? '/b/chat' : target === 'requests' ? '/b/requests' : '/b/event')

export function Notifications() {
  const variant = useVariant()
  const [items, setItems] = useState<Notif[]>(variant === 'empty' ? [] : seed)
  const unread = items.filter(item => !item.read).length
  const groups = [...new Set(items.map(item => item.group))]
  const read = (id: string) => setItems(current => current.map(item => (item.id === id ? { ...item, read: true } : item)))

  return (
    <div className="bx-page">
      <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div>
      <BackBar fallback="/b/home"><button type="button" className="bx-pill" onClick={() => setItems(seed.map(item => ({ ...item })))}>Actualizar</button></BackBar>
      <header className="bx-head rise">
        <h1>Notificaciones</h1>
        <p className="bx-sub">{items.length === 0 ? 'Todo al día.' : unread ? `${unread} sin leer` : 'No tenés avisos sin leer.'} · Avisos en tiempo real.</p>
      </header>
      {items.length === 0 ? (
        <div className="bx-empty b-glass" role="status"><Icon name="bell" size={26} /><h2>Todavía no tenés notificaciones</h2><p>Cuando tengas avisos registrados, aparecerán acá.</p></div>
      ) : groups.map(group => (
        <section key={group} className="bx-group" aria-label={group}>
          <h2 className="bx-group-title">{group}</h2>
          <ul>
            {items.filter(item => item.group === group).map(item => (
              <li key={item.id} className={`bx-note b-glass ${item.read ? 'is-read' : 'is-unread'}`}>
                <span className="bx-note-ico"><Icon name={iconFor(item.target)} size={20} />{!item.read && <i aria-hidden="true" />}</span>
                <div className="bx-note-body">
                  <span className="bx-kind">{item.kind}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <div className="bx-note-foot">
                    <time>{item.time}</time><span className={`bx-readstate ${item.read ? '' : 'on'}`}>{item.read ? 'Leído' : 'No leído'}</span>
                  </div>
                  <div className="bx-note-actions">
                    {!item.read && <button type="button" onClick={() => read(item.id)}>Marcar leído</button>}
                    <Link to={hrefFor(item.target)} onClick={() => read(item.id)}>{item.target === 'chat' ? 'Ver chat' : item.target === 'requests' ? 'Ver solicitudes' : 'Ver evento'}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
