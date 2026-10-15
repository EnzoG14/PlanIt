export const ageKeys = ['under_18', '18_24', '25_34', '35_44', '45_54', '55_plus', 'unknown'] as const
export const sexKeys = ['female', 'male', 'other', 'unknown'] as const
export type Distribution = { state: 'empty' | 'suppressed' | 'available'; groups: { key: string; count: number }[] }
export type EventDemographics = { event_id: string; as_of: string; age_as_of: string; age: Distribution; sex: Distribution }

export function parseEventDemographics(input: unknown): EventDemographics {
  const invalid = () => new Error('No pudimos leer los datos demográficos.')
  const object = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw invalid()
    return v as Record<string, unknown>
  }
  const exactKeys = (v: Record<string, unknown>, keys: readonly string[]) => {
    if (Object.keys(v).length !== keys.length || keys.some(key => !(key in v))) throw invalid()
  }
  const v = object(input)
  exactKeys(v, ['event_id', 'as_of', 'age_as_of', 'age', 'sex'])
  if (typeof v.event_id !== 'string' || typeof v.as_of !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(v.as_of)
    || typeof v.age_as_of !== 'string' || v.age_as_of !== v.as_of.slice(0, 10)) throw invalid()
  const distribution = (input: unknown, keys: readonly string[]): Distribution => {
    const d = object(input)
    exactKeys(d, ['state', 'groups'])
    if (!['empty', 'suppressed', 'available'].includes(String(d.state)) || !Array.isArray(d.groups)) throw invalid()
    if (d.state !== 'available') {
      if (d.groups.length !== 0) throw invalid()
      return { state: d.state as Distribution['state'], groups: [] }
    }
    if (d.groups.length !== keys.length) throw invalid()
    const groups = d.groups.map((row, index) => {
      const g = object(row)
      exactKeys(g, ['key', 'count'])
      if (g.key !== keys[index] || !Number.isSafeInteger(g.count) || (g.count as number) < 0
        || ((g.count as number) > 0 && (g.count as number) < 5)) throw invalid()
      return { key: g.key as string, count: g.count as number }
    })
    if (!groups.some(g => g.count >= 5) || !Number.isSafeInteger(groups.reduce((n, g) => n + g.count, 0))) throw invalid()
    return { state: 'available', groups }
  }
  const age = distribution(v.age, ageKeys), sex = distribution(v.sex, sexKeys)
  if ((age.state === 'empty') !== (sex.state === 'empty')) throw invalid()
  if (age.state === 'available' && sex.state === 'available'
    && age.groups.reduce((n, g) => n + g.count, 0) !== sex.groups.reduce((n, g) => n + g.count, 0)) throw invalid()
  return { event_id: v.event_id, as_of: v.as_of, age_as_of: v.age_as_of, age, sex }
}
