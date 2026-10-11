import type { SupabaseClient } from '@supabase/supabase-js'
export type ConnectionState = 'connecting' | 'connected' | 'disconnected'
export type Change = { eventType: string; new: Record<string, unknown> }
export function subscribeToChanges(client: SupabaseClient, name: string,
  bindings: { table: string; event: 'INSERT' | 'UPDATE'; filter: string }[],
  onChange: (change: Change) => void, recover: () => void, status: (state: ConnectionState) => void) {
  let active = true, retry = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let channel: ReturnType<SupabaseClient['channel']> | undefined
  function connect() {
    if (!active) return
    status('connecting')
    const current = client.channel(name)
    channel = current
    for (const binding of bindings) current.on('postgres_changes', { ...binding, schema: 'public' }, payload => {
      if (active && channel === current) onChange(payload as Change)
    })
    current.subscribe(state => {
      if (!active || channel !== current) return
      if (state === 'SUBSCRIBED') { retry = 0; status('connected'); recover() }
      else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
        status('disconnected')
        // Supabase retries ERROR/TIMED_OUT itself. CLOSED needs a fresh channel.
        if (state === 'CLOSED' && timer === undefined) {
          timer = setTimeout(() => {
            timer = undefined
            channel = undefined
            void client.removeChannel(current).then(() => { if (active) connect() })
          }, Math.min(1000 * 2 ** retry++, 30000))
        }
      }
    })
  }
  const onReturn = () => { if (document.visibilityState === 'visible') recover() }
  window.addEventListener('focus', onReturn)
  window.addEventListener('online', onReturn)
  document.addEventListener('visibilitychange', onReturn)
  // Auth's callback must stay synchronous; the SDK updates its Realtime JWT.
  const { data: { subscription } } = client.auth.onAuthStateChange(event => {
    if (event === 'TOKEN_REFRESHED') queueMicrotask(() => { if (active) recover() })
  })
  connect()
  return () => {
    active = false; clearTimeout(timer); subscription.unsubscribe()
    window.removeEventListener('focus', onReturn); window.removeEventListener('online', onReturn)
    document.removeEventListener('visibilitychange', onReturn)
    if (channel) void client.removeChannel(channel)
  }
}
