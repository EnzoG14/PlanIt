import { loadContent, readContent } from '../../lib/session-content'
import { loadCategories } from '../events/api'
import { loadHomeEvents, type HomeEventsCursor } from '../events/home'
import { loadMyEvents, type MyEventsSection, type OrganizedEventsFilter } from '../events/my-events'
import { filtersToSearch, type DiscoveryFilters } from '../events/search'
import { loadSuggestions } from '../events/suggestions'
import { loadMyAvatar, loadMyProfile } from '../profile/api'
import type { Coordinates } from '../location/geolocation'
import type { SearchOrigin } from '../location/origin'

export const homeContentKey = (filters: DiscoveryFilters, origin: Coordinates | null) => `home:${filtersToSearch(filters)}:${filters.radiusKm ? JSON.stringify(origin && [origin.latitude, origin.longitude]) : ''}`
export type HomeContent = Awaited<ReturnType<typeof loadHomeEvents>>
export function loadHomeContent(cursor: HomeEventsCursor | null, filters: DiscoveryFilters, origin: Coordinates | null, force = false) {
  // Pagination remains demand-driven and never overwrites the first page.
  return cursor ? loadHomeEvents(cursor, filters, origin) : loadContent(homeContentKey(filters, origin), () => loadHomeEvents(null, filters, origin), force)
}
export const myEventsContentKey = (section: MyEventsSection, filter: OrganizedEventsFilter) => `my-events:${section}:${filter}`
export type MyEventsContent = Awaited<ReturnType<typeof loadMyEvents>>
export function loadMyEventsContent(section: MyEventsSection, offset: number, filter: OrganizedEventsFilter, force = false) {
  return offset ? loadMyEvents(section, offset, filter) : loadContent(myEventsContentKey(section, filter), () => loadMyEvents(section, 0, filter), force)
}
export type ProfileContent = { profile: Awaited<ReturnType<typeof loadMyProfile>>; avatarUrl: string | null }
export const profileContentKey = (userId: string) => `profile:${userId}`
export function loadProfileContent(userId: string, force = false) {
  return loadContent(profileContentKey(userId), async signal => {
    const profile = await loadMyProfile(userId, signal)
    let avatarUrl: string | null = null
    try { avatarUrl = await loadMyAvatar(userId, profile.avatar_file_id, signal) } catch { signal.throwIfAborted() }
    return { profile, avatarUrl }
  }, force)
}
export const suggestionsContentKey = (userId: string, origin: SearchOrigin | null) => `suggestions:${JSON.stringify([userId, origin?.latitude ?? null, origin?.longitude ?? null, origin?.kind ?? null])}`
export type SuggestionsContent = Awaited<ReturnType<typeof loadSuggestions>>
export function loadSuggestionsContent(userId: string, origin: SearchOrigin | null, force = false) {
  return loadContent(suggestionsContentKey(userId, origin), signal => loadSuggestions(userId, origin, signal), force)
}
export function readSuggestionsContent(userId: string, origin: SearchOrigin | null) {
  return readContent<SuggestionsContent>(suggestionsContentKey(userId, origin))
    ?? readContent<SuggestionsContent>(suggestionsContentKey(userId, null))
}
export async function preloadContent(userId: string, filters: DiscoveryFilters, origin: SearchOrigin | null) {
  const results = await Promise.allSettled([
    loadHomeContent(null, filters.radiusKm && !origin ? { ...filters, radiusKm: null } : filters, origin),
    loadSuggestionsContent(userId, origin), loadProfileContent(userId),
    loadMyEventsContent('organizing', 0, 'all'), loadMyEventsContent('participating', 0, 'all'),
    loadCategories(),
  ])
  const urls = new Set<string>()
  for (const item of results) if (item.status === 'fulfilled' && item.value && typeof item.value === 'object') {
    const value = item.value
    if ('events' in value) for (const event of value.events) if (event.imageUrl) urls.add(event.imageUrl)
    if ('avatarUrl' in value && value.avatarUrl) urls.add(value.avatarUrl)
  }
  // Download the images now, not only their signed URLs. A slow image must not
  // hold the entire app indefinitely; its normal img element can finish later.
  await Promise.all([...urls].map(url => new Promise<void>(resolve => {
    const image = new Image()
    const finish = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; resolve() }
    const timeout = window.setTimeout(finish, 4000)
    image.onload = finish; image.onerror = finish; image.src = url
    if (image.complete) finish()
  })))
  return results
}
