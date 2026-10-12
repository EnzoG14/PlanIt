/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { useState } from 'react'
import { Icon } from '../shared/Icon'
import { byId } from '../shared/data'
import { useVariant } from '../shared/variant'
import { requests as seed } from './mock'
import { Avatar, BackBar, Modal, Notice } from './ui'

export const requestsVariants = [
  { id: 'list', label: 'Con solicitudes' },
  { id: 'empty', label: 'Sin solicitudes' },
  { id: 'closed', label: 'Evento cerrado' },
]

type Row = (typeof seed)[number]

export function Requests() {
  const event = byId('e1')
  const variant = useVariant()
  const [rows, setRows] = useState<Row[]>(variant === 'empty' ? [] : seed)
  const [selection, setSelection] = useState<{ row: Row; decision: 'approved' | 'rejected' } | null>(null)
  const [notice, setNotice] = useState('')
  const closed = variant === 'closed'
  const approve = selection?.decision === 'approved'

  function resolve() {
    if (!selection) return
    setRows(items => items.filter(item => item.id !== selection.row.id))
    setNotice(`Solicitud ${approve ? 'aprobada' : 'rechazada'}: ${selection.row.name}.${approve ? '' : ' El usuario deberá esperar siete días para volver a solicitar.'}`)
    setSelection(null)
  }

  return (
    <div className="bx-page">
      <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div>
      <BackBar fallback="/b/attendees" label="Volver a asistentes" />
      <header className="bx-head rise">
        <h1>Solicitudes de reincorporación</h1>
        <p className="bx-sub">Usuarios removidos que pidieron volver a participar · {event.title}</p>
      </header>
      {closed && <Notice tone="warn">El evento está cerrado. Podés rechazar solicitudes pendientes; no aprobarlas.</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {rows.length === 0 ? (
        <div className="bx-empty b-glass" role="status"><Icon name="check" size={26} /><h2>No hay solicitudes pendientes</h2><p>Los pedidos y resoluciones se reflejan al actualizar.</p></div>
      ) : (
        <ul className="bx-req">
          {rows.map((row, index) => (
            <li key={row.id} className="b-glass">
              <div className="bx-req-id"><Avatar name={row.name} tone={index + 1} size={48} /><div><strong>{row.name}</strong><span>@{row.user}</span></div></div>
              <p className="bx-req-when"><Icon name="calendar" size={16} />Solicitó: {row.when}</p>
              <div className="bx-req-actions">
                <button type="button" className="bx-btn primary" disabled={closed} onClick={() => setSelection({ row, decision: 'approved' })}>Aprobar</button>
                <button type="button" className="bx-btn outline-danger" onClick={() => setSelection({ row, decision: 'rejected' })}>Rechazar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="bx-info">Después de rechazar, el usuario deberá esperar siete días desde la resolución para realizar una nueva solicitud.</p>

      <Modal open={selection !== null} onClose={() => setSelection(null)} label={`${approve ? 'Aprobar' : 'Rechazar'} solicitud`}>
        <h2>{approve ? 'Aprobar' : 'Rechazar'} solicitud</h2>
        <p>¿Querés {approve ? 'aprobar' : 'rechazar'} la reincorporación de {selection?.row.name}?</p>
        <p className="bx-hint">{approve ? 'Volverá a participar si el evento sigue vigente y hay cupo. Sin plaza, la solicitud seguirá pendiente.' : 'Su participación seguirá removida. Deberá esperar siete días para volver a solicitar.'}</p>
        <div className="bx-dialog-actions"><button type="button" className="bx-btn ghost" data-autofocus onClick={() => setSelection(null)}>Cancelar</button><button type="button" className={`bx-btn ${approve ? 'primary' : 'danger'}`} onClick={resolve}>{approve ? 'Aprobar' : 'Rechazar'}</button></div>
      </Modal>
    </div>
  )
}
