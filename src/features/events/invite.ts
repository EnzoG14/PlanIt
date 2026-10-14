import { supabase } from '../../lib/supabase'

// The organizer secret lives only in this module's memory (never in the URL after
// capture, query params, Storage, logs or analytics). A reload drops it on purpose:
// the original link must be opened again. See docs/design/verification/r4-block-7.
const TOKEN_PATTERN = /^[0-9a-f]{64}$/
let pending: { token: string; owner: string | null } | null = null

/** Reads `#token=` from a location hash. Returns true when a valid secret was stored. */
export function captureInviteFromHash(hash: string): boolean {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token')
  if (!token || !TOKEN_PATTERN.test(token)) return false
  pending = { token, owner: null }
  return true
}
/** The pending secret for this identity; a different account never inherits it. */
export function currentInviteToken(userId: string | null): string | null {
  if (!pending) return null
  if (pending.owner && pending.owner !== userId) { pending = null; return null }
  return pending.token
}
export function bindInviteOwner(userId: string) { if (pending && !pending.owner) pending.owner = userId }
export function clearInviteToken() { pending = null }

export type RedeemResult =
  | { kind: 'ok'; eventId: string }
  | { kind: 'unavailable' } // one indistinguishable outcome: invalid, rotated, revoked, closed, no access
  | { kind: 'auth' }
  | { kind: 'network' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function redeemInvite(token: string): Promise<RedeemResult> {
  if (!supabase) return { kind: 'network' }
  try {
    const { data, error } = await supabase.rpc('redeem_event_link', { p_token: token })
    if (error) {
      if (error.message === 'invite_unavailable' || error.code === 'PGRST202') return { kind: 'unavailable' }
      const status = (error as { status?: number }).status
      if (error.code === '42501' || error.code === 'PGRST301' || status === 401 || status === 403) return { kind: 'auth' }
      return { kind: 'network' }
    }
    // Success is only trusted with a well-formed event id; the caller re-reads the event.
    return typeof data === 'string' && UUID.test(data) ? { kind: 'ok', eventId: data } : { kind: 'network' }
  } catch { return { kind: 'network' } }
}
