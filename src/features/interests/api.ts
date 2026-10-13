import { supabase } from '../../lib/supabase'
import { loadCategories } from '../events/api'
import type { Category } from '../events/validation'

export class InterestsSaveError extends Error {
  uncertain: boolean
  constructor(message: string, uncertain: boolean) { super(message); this.uncertain = uncertain }
}
export function sameInterests(a: string[], b: string[]) {
  return a.length === b.length && a.every(id => b.includes(id))
}
async function ownClient(userId: string) {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.auth.getSession()
  if (error || data.session?.user.id !== userId) throw new Error('La sesión cambió. Volvé a ingresar.')
  return supabase
}
function parseCategory(value: unknown): Category {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string'
    || !('name' in value) || typeof value.name !== 'string'
    || !('is_active' in value) || typeof value.is_active !== 'boolean') throw new Error('No pudimos leer tus intereses.')
  return { id: value.id, name: value.name, is_active: value.is_active }
}
export async function loadMyInterests(userId: string, signal: AbortSignal): Promise<Category[]> {
  const client = await ownClient(userId)
  const { data, error } = await client.from('user_category_interests')
    .select('category:categories(id,name,is_active)').eq('user_id', userId).abortSignal(signal)
  if (error) throw error
  return (data ?? []).map(row => parseCategory(Array.isArray(row.category) ? row.category[0] : row.category))
}
export async function loadInterestsEditor(userId: string, signal: AbortSignal) {
  const [categories, interests] = await Promise.all([loadCategories(), loadMyInterests(userId, signal)])
  return { categories: [...new Map([...categories, ...interests].map(category => [category.id, category])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'es-AR')), selected: interests.map(category => category.id) }
}
export async function saveMyInterests(userId: string, ids: string[], signal: AbortSignal): Promise<string[]> {
  const client = await ownClient(userId)
  try {
    const { data, error } = await client.rpc('set_my_category_interests', { p_category_ids: ids }).abortSignal(signal)
    if (error) {
      const rejected = /^(22|23|42|P0001|PGRST)/.test(error.code ?? '')
      throw new InterestsSaveError(error.message.includes('interests_category_unavailable')
        ? 'Una categoría ya no está disponible. Actualizá las categorías y revisá tu selección.'
        : 'No pudimos guardar tus intereses. Revisá la conexión y volvé a intentar.', !rejected)
    }
    if (!Array.isArray(data) || data.some(row => typeof row?.category_id !== 'string'))
      throw new InterestsSaveError('No pudimos confirmar la respuesta del guardado.', true)
    return data.map(row => row.category_id as string)
  } catch (error) {
    if (error instanceof InterestsSaveError) throw error
    throw new InterestsSaveError('Se interrumpió el guardado. Comprobá el estado antes de reintentar.', true)
  }
}
