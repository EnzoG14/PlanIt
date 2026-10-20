import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { eventGoogleCalendarUrl, type EventIntegrationV1 } from './calendar'
import '../../components/event-actions.css'
import './calendar.css'

type CalendarAction = 'google'

/** B11 supplies an allowlisted, authorized DTO and remounts on identity change. */
export function EventCalendarAction({ event }: { event: EventIntegrationV1 }) {
  const revision = [event.id, event.title, event.starts_at, event.ends_at, event.location_name, event.address, event.visibility, event.state].join('\u0000')
  return <CalendarActions key={revision} event={event} />
}

function CalendarActions({ event }: { event: EventIntegrationV1 }) {
  const [pending, setPending] = useState<CalendarAction | null>(null)
  const [notice, setNotice] = useState(''), [error, setError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const heading = useId(), description = useId(), help = useId()
  useEffect(() => {
    if (!pending) return
    const node = dialog.current
    node?.showModal(); cancel.current?.focus()
    return () => { node?.close() }
  }, [pending])
  function close() {
    dialog.current?.close(); setPending(null)
    if (trigger.current?.isConnected) trigger.current.focus()
  }
  function perform() {
    setError(''); setNotice('')
    try {
      window.open(eventGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer')
      setNotice('Se solicitó abrir Google Calendar. Confirmá allí el guardado. Si no se abrió, revisá el bloqueador de ventanas.')
    } catch { setError('No pudimos preparar el calendario. Actualizá el detalle o reintentá la acción.') }
  }
  function request(action: CalendarAction) {
    setNotice(''); setError('')
    if (event.visibility === 'unlisted') {
      trigger.current = document.activeElement as HTMLElement
      setPending(action)
    } else perform()
  }
  return <section className="event-calendar" aria-label="Calendario personal" aria-describedby={help}>
    <div className="event-calendar-actions">
      <button type="button" className="secondary-button" onClick={() => request('google')}><Icon name="calendar" />Agregar a Google Calendar</button>
    </div>
    <p id={help} className="field-hint">Guardá una copia en tu calendario. Los cambios posteriores del evento no se sincronizan.</p>
    <p role="status" className="event-calendar-notice">{notice}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    <dialog ref={dialog} className="event-action-dialog event-calendar-dialog" aria-labelledby={heading} aria-describedby={description}
      onCancel={e => { e.preventDefault(); close() }}>
      <h2 id={heading}>Exportar un evento oculto</h2>
      <p id={description}>Vas a copiar el título, los horarios y la ubicación a Google Calendar. El evento es oculto: otras personas podrían ver estos datos según cómo compartas tu calendario. No se incluirán enlaces de invitación.</p>
      <div className="event-action-dialog-buttons">
        <button type="button" ref={cancel} className="secondary-button" onClick={close}>Cancelar</button>
        <button type="button" className="gradient-link" onClick={() => { const action = pending; close(); if (action) perform() }}>Continuar</button>
      </div>
    </dialog>
  </section>
}
