import { supabase } from '../../lib/supabase'
import { isSocialId } from './api'

export type BlockState = { available: boolean; blockedByMe: boolean }
export async function loadBlockState(userId: string, signal: AbortSignal): Promise<BlockState> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  const { data, error } = await supabase.rpc('get_social_relationship', { p_user_id: userId }).abortSignal(signal)
  if (error) throw error
  // Only the actor's own block bit; never retain identity or another user's block row.
  if (data?.unavailable === true && typeof data.blocked_by_me === 'boolean') return { available: false, blockedByMe: data.blocked_by_me }
  if (!data || !['public', 'private'].includes(data.visibility)) throw new Error('invalid_social_response')
  return { available: true, blockedByMe: false }
}
export async function changeUserBlock(userId: string, blocked: boolean, signal: AbortSignal): Promise<void> {
  if (!supabase || !isSocialId(userId)) throw new Error('profile_unavailable')
  const { error } = await supabase.rpc(blocked ? 'block_user' : 'unblock_user', { p_target_id: userId }).retry(false).abortSignal(signal)
  if (error) throw error
}
