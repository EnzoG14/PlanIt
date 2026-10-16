import React from 'react'
import { createRoot } from 'react-dom/client'
import { EventShareAction, type EventShareActionProps } from '../../src/features/events/EventShareAction'
import '../../src/index.css'
import '../../src/styles/amanecer.css'

const root = createRoot(document.getElementById('root')!)
const event: EventShareActionProps['event'] = { id: '30000000-0000-4000-8000-000000000001', title: 'Encuentro de música 🎵', starts_at: '2099-10-12T20:00:00', ends_at: '2099-10-12T23:00:00', visibility: 'public', state: 'open', location_name: null, address: '' }
let props: EventShareActionProps = { event, canManageInvite: false }
function render(patch: Partial<EventShareActionProps> = {}) {
  props = { ...props, ...patch }
  root.render(<React.StrictMode><main className="app-shell amanecer-shell" style={{ minHeight: '100vh', padding: '24px', boxSizing: 'border-box', maxWidth: '600px', margin: '0 auto' }}>
    <h1>Compartir evento</h1><p>Fixture aislado · B8</p><h2>{props.event.title}</h2>
    <EventShareAction {...props} />
  </main></React.StrictMode>)
}
Object.assign(window, { r7Share: { render, event, unmount: () => root.render(null) } })
render()
