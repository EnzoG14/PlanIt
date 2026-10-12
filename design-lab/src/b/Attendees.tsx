/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../shared/Icon'
import { byId } from '../shared/data'
import { useVariant } from '../shared/variant'
import { attendees as seedConfirmed, removed as seedRemoved, requests, type Person } from './mock'
import { Avatar, BackBar, Modal, Notice } from './ui'

export const attendeesVariants = [
  { id: 'open', label: 'Evento abierto' },
  { id: 'readonly', label: 'Finalizado · solo lectura' },
  { id: 'empty', label: 'Sin asistentes' },
]

export function Attendees() {
  const event = byId('e1')
  const variant = useVariant()
  const readonly = variant === 'readonly'
  const [confirmed, setConfirmed] = useState<Person[]>(variant === 'empty' ? [] : seedConfirmed)
  const [gone, setGone] = useState<Person[]>(variant === 'empty' ? [] : seedRemoved)
  const [tab, setTab] = useState<'confirmed' | 'removed'>('confirmed')
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState<Person | null>(null)
  const [confirm, setConfirm] = useState<Person | null>(null)
  const [notice, setNotice] = useState('')
  const base = variant === 'empty' ? 0 : event.going - seedConfirmed.length
  const total = base + confirmed.length
  const list = (tab === 'confirmed' ? confirmed : gone).filter(person => `${person.name} ${person.user}`.toLowerCase().includes(search.trim().toLowerCase()))
  const pending = variant === 'empty' ? 0 : requests.length

  function remove() {
    if (!confirm) return
    setConfirmed(items => items.filter(item => item.id !== confirm.id))
    setGone(items => [confirm, ...items])
    setNotice(`La inscripción de ${confirm.name} fue removida del evento.`)
    setConfirm(null)
  }

  return (
    <div className="bx-page">
      <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div>
      <BackBar fallback="/b/event"><Link to="/b/requests" className="bx-pill violet">Solicitudes<b>{pending}</b></Link></BackBar>
      <header className="bx-head rise">
        <h1>Asistentes</h1>
        <p className="bx-sub"><strong>{total} / {event.capacity}</strong> asistentes · {event.title}</p>
      </header>
      {readonly && <Notice tone="warn">Evento finalizado. Asistentes de solo lectura.</Notice>}
      <div className="bx-seg" role="group" aria-label="Estado de inscripción">
        {(['confirmed', 'removed'] as const).map(value => (
          <button key={value} type="button" aria-pressed={tab === value} className={tab === value ? 'on' : ''} onClick={() => { setTab(value); setNotice('') }}>
            {value === 'confirmed' ? 'Confirmados' : 'Removidos'}<span>{value === 'confirmed' ? total : gone.length}</span>
          </button>
        ))}
      </div>
      <label className="bx-search b-glass"><Icon name="search" size={20} /><span className="sr-only">Buscar asistentes por nombre</span><input type="search" placeholder="Buscar asistentes…" value={search} onChange={e => setSearch(e.target.value)} maxLength={120} /></label>
      {notice && <Notice>{notice}</Notice>}
      {list.length === 0 ? (
        <div className="bx-empty b-glass" role="status"><Icon name="people" size={26} /><h2>{search ? 'Sin resultados' : tab === 'confirmed' ? 'Todavía no hay asistentes confirmados' : 'No hay asistentes removidos'}</h2><p>{search ? 'Probá con otro nombre.' : 'Las inscripciones y bajas se reflejan acá al actualizar.'}</p></div>
      ) : (
        <ul className="bx-people b-glass">
          {list.map((person, index) => (
            <li key={person.id}>
              <Avatar name={person.name} tone={index} />
              <div className="bx-id"><strong>{person.name}</strong><span>@{person.user}</span><span className={`bx-state ${tab === 'confirmed' ? 'ok' : 'past'}`}><i />{tab === 'confirmed' ? 'Confirmado' : 'Removido'}</span></div>
              {tab === 'confirmed' && !readonly && <button type="button" className="bx-more" aria-label={`Acciones de ${person.name}`} onClick={() => setMenu(person)}><Icon name="more" /></button>}
            </li>
          ))}
        </ul>
      )}
      {list.length > 0 && tab === 'confirmed' && !search && total > confirmed.length && <button type="button" className="bx-btn ghost wide">Cargar más asistentes</button>}

      <Modal open={menu !== null} onClose={() => setMenu(null)} label={`Acciones de ${menu?.name ?? ''}`} placement="sheet">
        {menu && <>
          <div className="bx-sheet-head"><Avatar name={menu.name} size={48} /><div><strong>{menu.name}</strong><span>@{menu.user}</span></div></div>
          <button type="button" className="bx-sheet-row danger" data-autofocus onClick={() => { setConfirm(menu); setMenu(null) }}><Icon name="userRemove" size={20} />Remover asistente</button>
          <button type="button" className="bx-btn ghost wide" onClick={() => setMenu(null)}>Cerrar</button>
        </>}
      </Modal>
      <Modal open={confirm !== null} onClose={() => setConfirm(null)} label="Remover asistente">
        <span className="bx-dialog-ico bad"><Icon name="userRemove" size={26} /></span>
        <h2>Remover asistente</h2>
        <p>¿Estás seguro de que querés remover a {confirm?.name} de este evento?</p>
        <p className="bx-hint">Dejará de ocupar cupo y de acceder al chat. Su inscripción e historial se conservan.</p>
        <div className="bx-dialog-actions"><button type="button" className="bx-btn ghost" data-autofocus onClick={() => setConfirm(null)}>Cancelar</button><button type="button" className="bx-btn danger" onClick={remove}>Remover</button></div>
      </Modal>
    </div>
  )
}
