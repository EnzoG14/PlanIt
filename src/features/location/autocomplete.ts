export type AddressSuggestion = { id: string; address: string; latitude: number; longitude: number }

export const geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim()
export const hasGeoapifyKey = Boolean(geoapifyKey && geoapifyKey !== 'replace_with_browser_geoapify_key')

export async function searchAddresses(text: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  if (!hasGeoapifyKey) throw new Error('Las sugerencias no están configuradas. Podés usar tu ubicación actual si estás en el lugar.')
  const params = new URLSearchParams({ text, lang: 'es', limit: '5', bias: 'countrycode:ar', format: 'json', apiKey: geoapifyKey! })
  const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]), cache: 'no-store' })
  if (!response.ok) throw new Error('No pudimos buscar direcciones. Revisá la conexión y reintentá.')
  const body: unknown = await response.json()
  if (!body || typeof body !== 'object' || !('results' in body) || !Array.isArray(body.results)) throw new Error('No pudimos leer las direcciones. Reintentá.')
  return body.results.flatMap((item: Record<string, unknown>) => {
    if (!item || typeof item.formatted !== 'string' || !item.formatted.trim() || typeof item.lat !== 'number' || typeof item.lon !== 'number' || !Number.isFinite(item.lat) || !Number.isFinite(item.lon) || Math.abs(item.lat) > 90 || Math.abs(item.lon) > 180) return []
    return [{ id: typeof item.place_id === 'string' ? item.place_id : `${item.lat}:${item.lon}:${item.formatted}`, address: item.formatted, latitude: item.lat, longitude: item.lon }]
  }).slice(0, 5)
}
