import { supabase } from '../../lib/supabase'
import type { SuggestedEvent } from './suggestions'

export type SuggestionsResult = { events: SuggestedEvent[]; hasInterests: boolean; imageError: boolean }
// One recent result, in memory only. Never persist preferences or coordinates.
let entry: { key: string; expiresAt: number; result: SuggestionsResult } | null = null
let identity: string | null = null
export function clearSuggestions() { entry = null }
supabase?.auth.onAuthStateChange((event, session) => {
  const next = session?.user.id ?? null
  if (next !== identity || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') clearSuggestions()
  identity = next
})
export function readSuggestions(key: string): SuggestionsResult | null {
  return entry?.key === key && entry.expiresAt > Date.now() ? entry.result : null
}
export function rememberSuggestions(key: string, result: SuggestionsResult) {
  entry = { key, result, expiresAt: Date.now() + 30000 }
}
