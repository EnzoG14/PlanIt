/* oxlint-disable react/only-export-components -- las variantes de estado viven junto a su pantalla */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../shared/Icon'
import { byId } from '../shared/data'
import { useVariant } from '../shared/variant'
import { messages as seed, type Msg } from './mock'
import { BackBar } from './ui'

export const chatVariants = [
  { id: 'open', label: 'Conversación' },
  { id: 'empty', label: 'Sin mensajes' },
  { id: 'readonly', label: 'Finalizado · solo lectura' },
]

export function Chat() {
  const event = byId('e1')
  const variant = useVariant()
  const readonly = variant === 'readonly'
  const [items, setItems] = useState<Msg[]>(variant === 'empty' ? [] : seed)
  const [text, setText] = useState('')
  const list = useRef<HTMLOListElement>(null)
  const length = [...text.trim()].length
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }) }, [items])

  function send(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || length > 2000) return
    setItems(current => [...current, { id: `m${current.length + 1}`, from: 'Lucía Benítez', mine: true, text: text.trim(), time: '18:30' }])
    setText('')
  }

  return (
    <div className="bx-chat">
      <div className="b-wash" aria-hidden="true"><i className="w1" /><i className="w2" /><i className="w3" /></div>
      <header className="bx-chat-head b-glass">
        <BackBar fallback="/b/event" label="Volver al evento" />
        <div><h1>{event.title}</h1><p><i className="bx-live" />{readonly ? 'Chat de solo lectura' : 'Mensajes en tiempo real'} · 12 participantes</p></div>
      </header>
      {readonly && <p className="bx-readonly" role="status">Evento finalizado · Chat de solo lectura.</p>}
      {items.length === 0 ? (
        <div className="bx-chat-empty" role="status"><span className="bx-empty-ico"><Icon name="chat" size={26} /></span><h2>Todavía no hay mensajes</h2><p>El historial de este evento está vacío. Rompé el hielo.</p></div>
      ) : (
        <ol className="bx-msgs" ref={list} tabIndex={0} aria-label="Mensajes del evento">
          <li className="bx-day"><span>Hoy</span></li>
          {items.map((item, index) => {
            const prev = items[index - 1]
            const continued = prev && prev.from === item.from
            return (
              <li key={item.id} className={`bx-msg ${item.mine ? 'mine' : ''} ${continued ? 'cont' : ''}`}>
                {!item.mine && !continued && <span className="bx-msg-author">{item.from}</span>}
                <p>{item.text}</p>
                <time>{item.time}</time>
              </li>
            )
          })}
        </ol>
      )}
      {!readonly && (
        <form className="bx-composer" onSubmit={send}>
          <label htmlFor="bx-chat-text" className="sr-only">Mensaje</label>
          <div className="b-glass">
            <textarea id="bx-chat-text" rows={1} value={text} placeholder="Escribí un mensaje…" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} />
            {length > 1800 && <span className={`bx-counter ${length > 2000 ? 'over' : ''}`}>{length}/2000</span>}
          </div>
          <button type="submit" className="bx-send" aria-label="Enviar mensaje" disabled={!text.trim() || length > 2000}><Icon name="send" size={20} /></button>
        </form>
      )}
    </div>
  )
}
