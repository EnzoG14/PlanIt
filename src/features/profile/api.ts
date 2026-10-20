import { invalidateContent } from '../../lib/session-content'
import { signedImageUrls } from '../../lib/signed-images'
import { supabase } from '../../lib/supabase'
import { isSocialId } from '../social/api'
import { normalizedProfile, type ProfileValues } from './validation'

export type OwnProfile = ProfileValues & { avatar_file_id: string | null }
export type AvatarAttempt = { file: File; path: string; previousId: string | null; uploaded: boolean; upload?: Promise<unknown> }
export class ProfileSaveError extends Error {
  uncertain: boolean
  field?: 'username'
  constructor(message: string, uncertain = false, field?: 'username') { super(message); this.uncertain = uncertain; this.field = field }
}
const message = 'No pudimos confirmar el cambio. Revisá la conexión y comprobá el estado.'
const deadline = (signal: AbortSignal) => AbortSignal.any([signal, AbortSignal.timeout(10000)])
// Storage upload/remove do not accept AbortSignal in the installed SDK. Bound the
// wait, retain the immutable path and reconcile; a timeout never proves rollback.
async function bounded<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  const timer = deadline(signal)
  timer.throwIfAborted()
  let abort: () => void = () => {}
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      abort = () => reject(new ProfileSaveError(message, true))
      timer.addEventListener('abort', abort, { once: true })
    })])
  } finally { timer.removeEventListener('abort', abort) }
}
async function clientFor(userId: string, signal: AbortSignal) {
  if (!supabase || !isSocialId(userId)) throw new ProfileSaveError('Comprobá tu sesión antes de continuar.')
  const { data } = await bounded(supabase.auth.getSession(), signal)
  signal.throwIfAborted()
  if (data.session?.user.id !== userId) throw new ProfileSaveError('La sesión cambió. Volvé a abrir tu perfil.')
  return supabase
}
export async function loadMyProfile(userId: string, signal: AbortSignal): Promise<OwnProfile> {
  const client = await clientFor(userId, signal)
  const { data, error } = await client.from('profiles')
    .select('username,display_name,first_name,last_name,birth_date,sex,bio,visibility,avatar_file_id')
    .eq('id', userId).abortSignal(deadline(signal)).single()
  if (error) throw error
  if (!data || typeof data.username !== 'string' || typeof data.display_name !== 'string'
    || !['public', 'private'].includes(data.visibility) || (data.avatar_file_id !== null && !isSocialId(data.avatar_file_id))) throw new Error('invalid_profile')
  const optional = ['first_name', 'last_name', 'birth_date', 'sex', 'bio'] as const
  if (optional.some(key => data[key] !== null && typeof data[key] !== 'string')) throw new Error('invalid_profile')
  return { username: data.username, display_name: data.display_name, first_name: data.first_name ?? '', last_name: data.last_name ?? '',
    birth_date: data.birth_date ?? '', sex: data.sex ?? '', bio: data.bio ?? '', visibility: data.visibility, avatar_file_id: data.avatar_file_id }
}
function saveFailure(error: { code?: string; message?: string }): ProfileSaveError {
  if (error.code === '23505') return new ProfileSaveError('Ese username ya está en uso. Elegí otro.', false, 'username')
  if (error.code === '23514' || error.code?.startsWith('22')) return new ProfileSaveError('Hay datos no válidos. Revisá los campos antes de guardar.')
  if (error.code === '42501') return new ProfileSaveError('No tenés permiso para guardar este cambio. Comprobá tu sesión.')
  if (error.code === 'PGRST202') return new ProfileSaveError('La edición todavía no está habilitada en este entorno.')
  return new ProfileSaveError(message, !error.code?.startsWith('23') && error.code !== 'P0001')
}
export async function saveMyProfile(userId: string, raw: ProfileValues, signal: AbortSignal): Promise<number> {
  const client = await clientFor(userId, signal), values = normalizedProfile(raw)
  invalidateContent('profile:')
  const { data, error } = await client.rpc('update_my_social_profile', {
    p_username: values.username, p_display_name: values.display_name, p_first_name: values.first_name || null,
    p_last_name: values.last_name || null, p_birth_date: values.birth_date || null, p_sex: values.sex || null,
    p_bio: values.bio || null, p_visibility: values.visibility,
  }).abortSignal(deadline(signal))
  invalidateContent('profile:')
  if (error) throw saveFailure(error)
  if (data?.visibility !== values.visibility || !Number.isSafeInteger(data.accepted_requests) || data.accepted_requests < 0) throw new ProfileSaveError(message, true)
  return data.accepted_requests
}
export async function refreshMyRelations(userId: string, signal: AbortSignal): Promise<void> {
  const client = await clientFor(userId, signal)
  const results = await Promise.all([
    client.rpc('get_social_counts', { p_user_id: userId }).abortSignal(deadline(signal)),
    client.rpc('list_follow_requests', { p_limit: 30 }).abortSignal(deadline(signal)),
  ])
  if (results.some(result => result.error)) throw new Error('relations_unavailable')
  // No social cache, payload persistence or UI for future blocks.
}
export function avatarValidation(file: File): string | null {
  return !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024
    ? 'Elegí JPEG, PNG o WebP de hasta 5 MiB.' : null
}
function ownPath(userId: string, path: string) {
  if (!new RegExp(`^${userId}/[a-f0-9-]{36}\\.(jpg|png|webp)$`).test(path)) throw new ProfileSaveError('La carga no pertenece a esta cuenta.')
}
export async function loadMyAvatar(userId: string, fileId: string | null, signal: AbortSignal): Promise<string | null> {
  if (!fileId) return null
  const client = await clientFor(userId, signal)
  const { data, error } = await client.from('files').select('storage_path,bucket_name,mime_type,uploaded_by')
    .eq('id', fileId).eq('uploaded_by', userId).eq('bucket_name', 'avatars').abortSignal(deadline(signal)).single()
  if (error || !data || data.uploaded_by !== userId || data.bucket_name !== 'avatars' || typeof data.storage_path !== 'string' || !data.storage_path.startsWith(`${userId}/`) || !['image/jpeg', 'image/png', 'image/webp'].includes(data.mime_type)) return null
  const signed = await bounded(signedImageUrls('avatars', [data.storage_path], 60), signal)
  signal.throwIfAborted()
  return signed.urls.get(data.storage_path) ?? null
}
async function registeredAvatar(userId: string, path: string, signal: AbortSignal) {
  const client = await clientFor(userId, signal); ownPath(userId, path)
  const { data, error } = await client.from('files').select('id').eq('uploaded_by', userId).eq('bucket_name', 'avatars')
    .eq('storage_path', path).abortSignal(deadline(signal)).maybeSingle()
  if (error) throw error
  return data?.id as string | undefined
}
export async function checkMyAvatar(userId: string, attempt: AvatarAttempt | null, signal: AbortSignal): Promise<{ profile: OwnProfile; saved: boolean }> {
  const profile = await loadMyProfile(userId, signal)
  const fileId = attempt ? await registeredAvatar(userId, attempt.path, signal) : null
  return { profile, saved: profile.avatar_file_id === (fileId ?? null) && (!attempt || !!fileId) }
}
export async function saveMyAvatar(userId: string, attempt: AvatarAttempt | null, previousId: string | null, signal: AbortSignal): Promise<void> {
  invalidateContent('profile:')
  const current = await checkMyAvatar(userId, attempt, signal)
  if (current.saved) return
  if (current.profile.avatar_file_id !== previousId) throw new ProfileSaveError('La foto cambió en otra sesión. Descartá esta selección y actualizá el perfil.')
  if (attempt) {
    ownPath(userId, attempt.path)
    const invalid = avatarValidation(attempt.file)
    if (invalid) throw new ProfileSaveError(invalid)
    if (!attempt.uploaded) {
      const client = await clientFor(userId, signal)
      const work = attempt.upload ?? client.storage.from('avatars').upload(attempt.path, attempt.file, { contentType: attempt.file.type, upsert: false, cacheControl: '0' })
      attempt.upload = work
      const result = await bounded(work, signal) as Awaited<ReturnType<ReturnType<typeof client.storage.from>['upload']>>
      attempt.upload = undefined
      if (result.error && !['409', 'Duplicate', 'AssetAlreadyExists'].includes(result.error.statusCode ?? '') && !/already exists|duplicate/i.test(result.error.message)) {
        throw new ProfileSaveError('No pudimos confirmar la carga. Conservamos la selección para comprobarla o limpiarla.', true)
      }
      attempt.uploaded = true
    }
  }
  const client = await clientFor(userId, signal)
  const { data, error } = await client.rpc('set_my_avatar', { p_storage_path: attempt?.path ?? null }).abortSignal(deadline(signal))
  invalidateContent('profile:')
  if (error) throw saveFailure(error)
  if (attempt ? !isSocialId(data) : data !== null) throw new ProfileSaveError(message, true)
}
export async function discardMyAvatarUpload(userId: string, attempt: AvatarAttempt, signal: AbortSignal): Promise<void> {
  // Wait for this tab's upload before deleting: a late upload cannot recreate staging.
  if (attempt.upload) { await bounded(attempt.upload, signal); attempt.upload = undefined }
  // Registered files (even replaced ones) are retained by contract and Storage RLS.
  if (await registeredAvatar(userId, attempt.path, signal)) return
  const client = await clientFor(userId, signal)
  const { error } = await bounded(client.storage.from('avatars').remove([attempt.path]), signal)
  if (error) throw new ProfileSaveError('No pudimos limpiar la carga. Reintentá cuando vuelva la conexión.', true)
  const { data, error: readError } = await client.storage.from('avatars').list(userId, { search: attempt.path.split('/')[1], limit: 2 }, { signal: deadline(signal) })
  if (readError || data?.some(row => row.name === attempt.path.split('/')[1])) throw new ProfileSaveError('La limpieza sigue pendiente. Comprobá nuevamente.', true)
}

export async function loadUnregisteredAvatars(userId: string, signal: AbortSignal): Promise<string[]> {
  const client = await clientFor(userId, signal)
  const { data, error } = await client.storage.from('avatars').list(userId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }, { signal: deadline(signal) })
  if (error) throw error
  const paths = (data ?? []).filter(row => row.id && /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(row.name)).map(row => `${userId}/${row.name}`)
  if (!paths.length) return []
  const registered = await client.from('files').select('storage_path').eq('uploaded_by', userId).eq('bucket_name', 'avatars')
    .in('storage_path', paths).abortSignal(deadline(signal))
  if (registered.error) throw registered.error
  return paths.filter(path => !registered.data.some(row => row.storage_path === path))
}
export async function cleanUnregisteredAvatar(userId: string, path: string, signal: AbortSignal): Promise<void> {
  ownPath(userId, path)
  // Recheck every path immediately before deletion; RLS also serializes with registration.
  if (await registeredAvatar(userId, path, signal)) return
  const client = await clientFor(userId, signal)
  const { error } = await bounded(client.storage.from('avatars').remove([path]), signal)
  if (error) throw new ProfileSaveError('No pudimos limpiar las cargas. Volvé a revisarlas.', true)
}
