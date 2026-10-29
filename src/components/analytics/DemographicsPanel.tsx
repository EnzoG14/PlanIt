import { demographicLabels as labels, type Distribution, type EventDemographics } from '../../features/analytics/demographics'
function DistributionTable({ title, data }: { title: string; data: Distribution }) {
  const total = data.groups.reduce((sum, g) => sum + g.count, 0)
  return <section className="demographics-distribution">
    <h3>{title}</h3>
    {data.state === 'empty' ? <p>Sin datos: todavía no hay inscriptos confirmados.</p>
      : <table><caption>{title}: inscripciones confirmadas actuales</caption>
          <thead><tr><th scope="col">Grupo</th><th scope="col">Personas</th><th scope="col">Porcentaje</th></tr></thead>
          <tbody>{data.groups.filter(g => g.key !== 'under_18').map(g => <tr key={g.key}><th scope="row">{labels[g.key]}</th><td>{g.count}</td>
            <td><span>{new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(100 * g.count / total)} %</span>
              <span className="demographics-bar" aria-hidden="true"><span style={{ width: `${100 * g.count / total}%` }} /></span></td></tr>)}</tbody>
        </table>}
  </section>
}
export function DemographicsPanel({ data }: { data: EventDemographics }) {
  return <section className="demographics-panel" aria-labelledby="demographics-title">
    <h2 id="demographics-title">Participantes en cifras</h2>
    <p className="field-hint">Sólo inscripciones confirmadas actuales, desde una persona. «Sin informar» indica datos no declarados.</p>
    <p className="field-hint">Edad en años cumplidos al {data.age_as_of.split('-').reverse().join('/')} (hora de Argentina). Rangos desde 18 años; porcentajes sobre el total de confirmados.</p>
    <div className="demographics-columns"><DistributionTable title="Edad" data={data.age} /><DistributionTable title="Sexo declarado" data={data.sex} /></div>
  </section>
}
