import { useEffect, useState } from 'react'
import { loadMyEventSeries } from '../../features/analytics/api'
import { addDays, presetPeriod, type Period, type ParticipationSeries } from '../../features/analytics/periods'
import { StatusMessage } from '../StatusMessage'
import { PeriodSelector } from './PeriodSelector'
import { CsvDownload } from './CsvDownload'

const metrics = [
  { key: 'new_confirmations', label: 'Altas nuevas', style: 'trend-new' },
  { key: 'reconfirmations', label: 'Reincorporaciones', style: 'trend-return' },
  { key: 'departures', label: 'Bajas', style: 'trend-departure' },
] as const
const dateLabel = (value: string) => value.slice(0, 10).split('-').reverse().join('/')

export function TrendPanel({ eventId, title, revision, onPeriodChange }: { eventId: string; title: string; revision: number; onPeriodChange: () => void }) {
  const [initial] = useState(() => presetPeriod(30))
  const [period, setPeriod] = useState<Period | null>(initial)
  return <section className="analytics-trend" aria-labelledby="trend-title">
    <h2 id="trend-title">Evolución de inscripciones</h2>
    <p>Altas nuevas: primera inscripción. Reincorporaciones: regreso después de una baja. Bajas: retiros y remociones. Son movimientos registrados, no ocupación histórica ni presencia física.</p>
    <PeriodSelector initial={initial} onChange={value => { setPeriod(value); onPeriodChange() }} />
    {period && <SeriesResult key={`${eventId}:${period.from}:${period.to}:${period.bucket}:${revision}`} eventId={eventId} title={title} period={period} />}
  </section>
}
function SeriesResult({ eventId, title, period }: { eventId: string; title: string; period: Period }) {
  const [data, setData] = useState<ParticipationSeries | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    const invalidate = () => {
      if (!document.hidden && navigator.onLine) return
      active = false; controller.abort(); setData(null); setError('La consulta dejó de estar vigente. Volvé a consultar con conexión y la pestaña visible.')
    }
    window.addEventListener('offline', invalidate)
    document.addEventListener('visibilitychange', invalidate)
    void loadMyEventSeries(eventId, period, controller.signal).then(value => { if (active) setData(value) }).catch(reason => {
      if (active) setError(controller.signal.aborted ? 'La consulta tardó demasiado. Volvé a intentar.' : (reason as Error).message)
    }).finally(() => window.clearTimeout(timeout))
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); window.removeEventListener('offline', invalidate); document.removeEventListener('visibilitychange', invalidate) }
  }, [eventId, period, attempt])
  const totals = metrics.map(m => data?.points.reduce((n, p) => n + p[m.key], 0) ?? 0)
  const hasData = totals.some(n => n > 0)
  const max = data ? Math.max(1, ...data.points.flatMap(p => metrics.map(m => p[m.key]))) : 1
  function bucketLabel(start: string) {
    const from = start < period.from ? period.from : start
    const rawEnd = `${addDays(start.slice(0, 10), period.bucket === 'day' ? 1 : 7)}T00:00:00`
    const to = rawEnd > period.to ? period.to : rawEnd
    return period.bucket === 'day' ? dateLabel(start) : `${dateLabel(from)} – ${dateLabel(addDays(to.slice(0, 10), -1))}${start < period.from || rawEnd > period.to ? ' (parcial)' : ''}`
  }
  return <div aria-live="polite" aria-busy={!data && !error}>
    {!data && !error && <StatusMessage title="Consultando movimientos">Esperá un momento.</StatusMessage>}
    {error && <StatusMessage title="Movimientos no disponibles" tone="error">{error} <button type="button" className="secondary-button" onClick={() => { setData(null); setError(''); setAttempt(n => n + 1) }}>Reintentar movimientos</button></StatusMessage>}
    {data && <>
      <p className="analytics-range">{dateLabel(period.from)} – {dateLabel(addDays(period.to.slice(0, 10), -1))} · {period.bucket === 'day' ? 'Por día' : 'Por semana'} · Hora de Argentina</p>
      {!hasData ? <StatusMessage title="Sin movimientos en este período">No hay altas, reincorporaciones ni bajas registradas en el intervalo seleccionado.</StatusMessage> : <>
        <dl className="analytics-trend-totals">{metrics.map((m, i) => <div key={m.key}><dt className={m.style}>{m.label}</dt><dd>{totals[i].toLocaleString('es-AR')}</dd></div>)}</dl>
        <p className="field-hint">Escala del gráfico: 0 a {max} movimientos por {period.bucket === 'day' ? 'día' : 'semana'}.</p>
        <svg className="analytics-trend-chart" viewBox="0 0 600 190" role="img" aria-labelledby="trend-chart-title trend-chart-description">
          <title id="trend-chart-title">Movimientos por {period.bucket === 'day' ? 'día' : 'semana'}</title>
          <desc id="trend-chart-description">Tres series independientes. Los valores exactos están en la tabla de movimientos que sigue.</desc>
          {[0, max].map(n => <line key={n} x1="42" x2="584" y1={180 - n / max * 150} y2={180 - n / max * 150} className="trend-axis" />)}
          {metrics.map(m => <g key={m.key} className={m.style}><polyline fill="none" strokeWidth="3" points={data.points.map((p, i) => `${42 + i / Math.max(1, data.points.length - 1) * 542},${180 - p[m.key] / max * 150}`).join(' ')} />{data.points.length === 1 && <circle cx="42" cy={180 - data.points[0][m.key] / max * 150} r="4" />}</g>)}
        </svg>
        <div className="analytics-trend-axis" aria-hidden="true"><span>{dateLabel(period.from)}</span><span>{dateLabel(addDays(period.to.slice(0, 10), -1))}</span></div>
      </>}
      <details className="analytics-series-table"><summary>Ver tabla de movimientos</summary><table><caption>Movimientos registrados por {period.bucket === 'day' ? 'día' : 'semana'}. Cero indica una consulta sin movimientos en ese intervalo.</caption><thead><tr><th scope="col">Período</th>{metrics.map(m => <th scope="col" key={m.key}>{m.label}</th>)}</tr></thead><tbody>{data.points.map(p => <tr key={p.bucket_start}><th scope="row">{bucketLabel(p.bucket_start)}</th>{metrics.map(m => <td key={m.key}>{p[m.key].toLocaleString('es-AR')}</td>)}</tr>)}</tbody></table></details>
      <p className="field-hint">Fuente: historial de cambios de inscripción. Consulta: {dateLabel(data.as_of)} {data.as_of.slice(11, 16)} (Argentina).</p>
      <CsvDownload key={`csv:${attempt}`} kind="statistics" eventId={eventId} title={title} data={data} />
    </>}
  </div>
}
