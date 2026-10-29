import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../../lib/supabase'
import { loadMyEventExport } from '../../features/analytics/api'
import { attendeesCsv, statisticsCsv } from '../../features/analytics/csv'
import type { ParticipationSeries } from '../../features/analytics/periods'
import type { EventDemographics } from '../../features/analytics/demographics'

type Props = { eventId: string } & (
  | { kind: 'attendees' }
  | { kind: 'statistics'; title: string; data: ParticipationSeries; demographics: EventDemographics | null }
)

export function CsvDownload(props: Props) {
  const { session } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const request = useRef<AbortController | null>(null)
  const mounted = useRef(false)
  const token = session?.access_token
  const userId = session?.user.id
  useEffect(() => {
    mounted.current = true
    const invalidate = () => {
      if (!request.current) return
      request.current.abort()
      request.current = null
      if (mounted.current) { setPending(false); setMessage('Exportación cancelada. No se descargó ningún archivo.') }
    }
    const hide = () => { if (document.hidden) invalidate() }
    window.addEventListener('offline', invalidate)
    document.addEventListener('visibilitychange', hide)
    // Cancel immediately, before React commits the identity/token remount.
    const subscription = supabase?.auth.onAuthStateChange((_event, next) => {
      if (next?.access_token !== token || next?.user.id !== userId) invalidate()
    }).data.subscription
    return () => {
      mounted.current = false
      invalidate()
      subscription?.unsubscribe()
      window.removeEventListener('offline', invalidate)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [token, userId])

  async function download() {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setPending(true); setMessage('')
    const deadline = performance.now() + 15000
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    let objectUrl: string | null = null
    const current = () => mounted.current && request.current === controller && !controller.signal.aborted
      && performance.now() < deadline && navigator.onLine && !document.hidden
    try {
      if (!session || !supabase || !current()) throw new Error('Conectate y volvé a intentar con la pestaña visible.')
      let csv: string | null
      let asOf: string
      if (props.kind === 'attendees') {
        const data = await loadMyEventExport(props.eventId, controller.signal)
        if (!current()) return
        csv = attendeesCsv(data); asOf = data.as_of
      } else {
        if (props.data.event_id !== props.eventId) throw new Error('El reporte no corresponde a este evento.')
        if (!props.demographics) throw new Error('Reintentá la consulta demográfica antes de exportar las estadísticas.')
        csv = statisticsCsv(props.title, props.data, props.demographics); asOf = props.data.as_of
      }
      // A local session read after serialization also catches logout/token changes
      // while a response was arriving. No Blob exists until all guards pass.
      const { data, error } = await supabase.auth.getSession()
      if (error || data.session?.access_token !== token || data.session?.user.id !== userId) throw new Error('La sesión cambió. Volvé a consultar los datos.')
      if (!current()) return
      if (csv === null) {
        setMessage('No hay asistentes confirmados para exportar.')
        return
      }
      objectUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `planit-${props.kind === 'attendees' ? 'asistentes' : 'estadisticas'}-${asOf.slice(0, 10)}.csv`
      document.body.append(anchor)
      try { anchor.click() } finally { anchor.remove() }
      setMessage('Descarga iniciada.')
    } catch (error) {
      if (mounted.current && request.current === controller) setMessage(controller.signal.aborted
        ? 'La exportación tardó demasiado. Volvé a intentar. No se descargó ningún archivo.'
        : error instanceof Error ? error.message : 'No pudimos preparar el reporte. Volvé a intentar.')
    } finally {
      window.clearTimeout(timeout)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (request.current === controller) {
        request.current = null
        if (mounted.current) {
          setPending(false)
          if (controller.signal.aborted || performance.now() >= deadline) setMessage('La exportación tardó demasiado. Volvé a intentar. No se descargó ningún archivo.')
        }
      }
    }
  }
  return <div className="analytics-export">
    <div className="analytics-export-actions">
      <button type="button" className="secondary-button" disabled={pending || (props.kind === 'statistics' && !props.demographics)} onClick={() => void download()}>
        {pending ? 'Preparando CSV…' : props.kind === 'attendees' ? 'Descargar asistentes CSV' : 'Descargar estadísticas CSV'}
      </button>
      {pending && <button type="button" className="secondary-button" onClick={() => {
        request.current?.abort(); request.current = null; setPending(false)
        setMessage('Exportación cancelada. No se descargó ningún archivo.')
      }}>Cancelar exportación</button>}
    </div>
    <p className="field-hint">{props.kind === 'attendees' ? 'Inscripciones confirmadas actuales; el período de movimientos no modifica esta lista.' : props.demographics ? 'Movimientos del período seleccionado y totales actuales por edad y sexo. Cada dato incluye su fecha de consulta (hora de Argentina).' : 'Para descargar el reporte completo, reintentá la consulta demográfica con el botón Reintentar.'}</p>
    <p role="status" aria-live="polite">{message}</p>
  </div>
}
