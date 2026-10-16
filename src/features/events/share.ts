import { formatEventTime } from './validation.ts'
import type { EventRecord } from './api'

/** B0 integration DTO. B11 constructs this from an authorized detail read. */
export type EventShareEvent = Pick<EventRecord, 'id' | 'title' | 'starts_at' | 'ends_at' | 'location_name' | 'address'> & {
  visibility: 'public' | 'unlisted'
  state: 'open' | 'ended' | 'cancelled' | 'archived'
}
export type EventSharePayload = { title: string; text: string; url: string }
export type SharePlatform = {
  isSecureContext: boolean
  share?: (data: EventSharePayload) => Promise<void>
  writeText?: (text: string) => Promise<void>
}
export type ShareResult = 'shared' | 'cancelled' | 'copied' | 'manual' | 'error'

function deploymentBase(origin: string, baseUrl: string): URL {
  const site = new URL(origin)
  const host = site.hostname.toLowerCase().replace(/\.$/, '')
  // Only externally usable HTTPS deployment origins; never publish local URLs.
  if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash ||
    !host.includes('.') || /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    /\.(localhost|local|test|invalid)$/.test(host) || host.includes(':')) throw new Error('unsafe_origin')
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(baseUrl)) throw new Error('invalid_base_url')
  return new URL(baseUrl, site)
}

export function buildEventSharePayload(event: EventShareEvent, options: {
  origin: string; baseUrl: string; canManageInvite: boolean; inviteUrl?: string
}): EventSharePayload {
  const base = deploymentBase(options.origin, options.baseUrl)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id)) throw new Error('invalid_event')
  if (!event.title.trim() || [...event.title].length > 120 || /[\p{Cc}\u202a-\u202e\u2066-\u2069]/u.test(event.title)) throw new Error('invalid_title')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?$/.test(event.starts_at) ||
    !Number.isFinite(Date.parse(event.starts_at + '-03:00')) ||
    new Date(event.starts_at + 'Z').toISOString().slice(0, 19) !== event.starts_at.slice(0, 19)) throw new Error('invalid_date')
  let url: string
  if (event.visibility === 'public') {
    url = new URL('events/' + event.id, base).href
  } else if (event.visibility === 'unlisted') {
    if (!options.canManageInvite) throw new Error('organizer_only')
    if (event.state !== 'open') throw new Error('invite_closed')
    if (!options.inviteUrl) throw new Error('invite_missing')
    const invite = new URL(options.inviteUrl)
    if (invite.origin !== base.origin || invite.pathname !== base.pathname + 'invite' || invite.search ||
      invite.username || invite.password || !/^#token=[0-9a-f]{64}$/.test(invite.hash)) throw new Error('invalid_invite')
    // Format checks do not prove that a token is still active. The server decides at redemption.
    url = invite.href
  } else throw new Error('invalid_visibility')
  return { title: event.title.trim(), text: event.title.trim() + ' · ' + formatEventTime(event.starts_at), url }
}

export async function copyEventLink(payload: EventSharePayload, platform: SharePlatform): Promise<ShareResult> {
  if (!platform.isSecureContext || !platform.writeText) return 'manual'
  try { await platform.writeText(payload.url); return 'copied' } catch { return 'manual' }
}

/** Called directly by a click handler: no preceding async work consumes user activation. */
export async function shareEvent(payload: EventSharePayload, platform: SharePlatform): Promise<ShareResult> {
  if (!platform.isSecureContext || !platform.share) return copyEventLink(payload, platform)
  try { await platform.share(payload); return 'shared' } catch (error) {
    return error && typeof error === 'object' && 'name' in error && error.name === 'AbortError' ? 'cancelled' : 'error'
  }
}
