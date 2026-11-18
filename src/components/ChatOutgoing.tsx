import type { ReactNode } from 'react'

const statusLabels = {
  pending: 'Enviando…',
  sent: 'Enviado',
  failed: 'No se pudo enviar',
  uncertain: 'Envío sin confirmar',
}

export type OutgoingMessage = { id: string; body: string; status: keyof typeof statusLabels }

export function ChatOutgoing({ message, children }: { message: OutgoingMessage; children?: ReactNode }) {
  return <li className="chat-own" data-message-id={message.id}>
    <div className="chat-bubble">
      {message.body && <p className="chat-message-text">{message.body}</p>}
      {children}
      <span className="chat-send-status" role="status">{statusLabels[message.status]}</span>
    </div>
  </li>
}
