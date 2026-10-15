import { useState } from 'react'
import { addDays, periodFromDates, presetPeriod, type Bucket, type Period } from '../../features/analytics/periods'

export function PeriodSelector({ initial, onChange }: { initial: Period; onChange: (value: Period | null) => void }) {
  const [start, setStart] = useState(initial.from.slice(0, 10))
  const [end, setEnd] = useState(addDays(initial.to.slice(0, 10), -1))
  const [bucket, setBucket] = useState<Bucket>(initial.bucket)
  const [preset, setPreset] = useState<number | null>(30)
  const [error, setError] = useState('')
  function update(from: string, to: string, unit: Bucket) {
    setStart(from); setEnd(to); setBucket(unit)
    try { const value = periodFromDates(from, to, unit); setError(''); onChange(value) }
    catch (reason) { setError((reason as Error).message); onChange(null) }
  }
  function choose(days: number) {
    const value = presetPeriod(days, undefined, bucket)
    setPreset(days); update(value.from.slice(0, 10), addDays(value.to.slice(0, 10), -1), bucket)
  }
  return <fieldset className="analytics-period" aria-describedby="period-help period-error">
    <legend>Período de movimientos</legend>
    <div className="analytics-presets">{[7, 30, 90].map(days => <button type="button" className="secondary-button" key={days} aria-pressed={preset === days} onClick={() => choose(days)}>{days} días</button>)}</div>
    <div className="analytics-period-fields">
      <label>Desde<input type="date" value={start} min="0001-01-01" max="9999-12-30" aria-invalid={!!error} onChange={e => { setPreset(null); update(e.target.value, end, bucket) }} /></label>
      <label>Hasta (inclusive)<input type="date" value={end} min="0001-01-01" max="9999-12-30" aria-invalid={!!error} onChange={e => { setPreset(null); update(start, e.target.value, bucket) }} /></label>
      <label>Agrupar por<select aria-label="Agrupar por" value={bucket} onChange={e => update(start, end, e.target.value as Bucket)}><option value="day">Día</option><option value="week">Semana</option></select></label>
    </div>
    <p id="period-help" className="field-hint">Hora de Argentina. Hasta 366 días. Los accesos rápidos incluyen hoy; las semanas comienzan el lunes. El filtro sólo modifica los movimientos, no la ocupación ni la demografía actuales.</p>
    <p id="period-error" className="analytics-period-error" role="status">{error}</p>
  </fieldset>
}
