import { supabase } from '../../lib/supabase'
import { notificationTarget } from './api'

export type PushSubscriptionSummary = {
  id: string
  created_at: string
  updated_at: string
  disabled_at: string | null
}

export type PushSettingsData = {
  show_previews: boolean
  subscriptions: PushSubscriptionSummary[]
}

export type PushEnvironmentCapability = {
  supported: boolean
  secureContext: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
  hasNotificationApi: boolean
  requiresIosInstall: boolean
  permission: NotificationPermission | 'unsupported'
  vapidConfigured: boolean
  vapidPublicKey: string | null
}

export type PushBrowserState =
  | 'unsupported'
  | 'ios_install_required'
  | 'unconfigured'
  | 'denied'
  | 'inactive'
  | 'active'
  | 'uncertain'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/

export function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim())
}

export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const trimmed = base64Url.trim()
  if (!trimmed || !BASE64URL_PATTERN.test(trimmed) || trimmed.length % 4 === 1) {
    throw new Error('invalid_base64url')
  }
  const padding = '='.repeat((4 - (trimmed.length % 4)) % 4)
  const base64 = (trimmed + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < view.byteLength; i++) {
    binary += String.fromCharCode(view[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function validateVapidPublicKey(rawKey: string | undefined): string | null {
  if (typeof rawKey !== 'string') return null
  const trimmed = rawKey.trim()
  if (!trimmed || trimmed === 'replace_with_vapid_public_key') return null
  try {
    const bytes = urlBase64ToUint8Array(trimmed)
    if (bytes.byteLength !== 65 || bytes[0] !== 0x04) return null
    if (bytesToBase64Url(bytes) !== trimmed) return null
    return trimmed
  } catch {
    return null
  }
}

export function getConfiguredVapidPublicKey(): string | null {
  const win = typeof window !== 'undefined' ? (window as unknown as { __PLANIT_VAPID_PUBLIC_KEY__?: string }) : undefined
  const candidate = win && typeof win.__PLANIT_VAPID_PUBLIC_KEY__ === 'string'
    ? win.__PLANIT_VAPID_PUBLIC_KEY__
    : (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)
  return validateVapidPublicKey(candidate)
}

export function isIosStandaloneRequired(
  nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
  win: Window | undefined = typeof window !== 'undefined' ? window : undefined,
): boolean {
  if (!nav || !win) return false
  const ua = nav.userAgent || ''
  const isIosDevice = /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  if (!isIosDevice) return false
  const standaloneProp = (nav as Navigator & { standalone?: boolean }).standalone === true
  const standaloneMedia = typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches
  return !standaloneProp && !standaloneMedia
}

export function detectPushEnvironment(): PushEnvironmentCapability {
  const hasWindow = typeof window !== 'undefined' && typeof navigator !== 'undefined'
  const secureContext = hasWindow && window.isSecureContext === true
  const hasServiceWorker = hasWindow && 'serviceWorker' in navigator
  const hasPushManager = hasWindow && 'PushManager' in window
  const hasNotificationApi = hasWindow && 'Notification' in window
  const requiresIosInstall = hasWindow && isIosStandaloneRequired(navigator, window)
  const permission: NotificationPermission | 'unsupported' = hasNotificationApi
    ? Notification.permission
    : 'unsupported'
  const vapidPublicKey = getConfiguredVapidPublicKey()
  const vapidConfigured = vapidPublicKey !== null
  const supported = secureContext && hasServiceWorker && hasPushManager && hasNotificationApi && !requiresIosInstall

  return {
    supported,
    secureContext,
    hasServiceWorker,
    hasPushManager,
    hasNotificationApi,
    requiresIosInstall,
    permission,
    vapidConfigured,
    vapidPublicKey,
  }
}

/**
 * Deterministically derives a canonical UUID for (userId, endpoint) using SHA-256
 * so the browser can match its active PushSubscription against `get_my_push_settings()`
 * without exposing `endpoint` in SELECT queries or storing secrets in localStorage.
 */
export async function derivePushSubscriptionId(userId: string, endpoint: string): Promise<string> {
  const normalizedUser = userId.trim().toLowerCase()
  const normalizedEndpoint = endpoint.trim()
  if (!isCanonicalUuid(normalizedUser) || !normalizedEndpoint) {
    throw new Error('invalid_push_subscription')
  }
  const data = new TextEncoder().encode(`planit:push:v1:${normalizedUser}:${normalizedEndpoint}`)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
  const bytes = digest.slice(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function validatePushEndpointUrl(endpoint: string): boolean {
  if (typeof endpoint !== 'string') return false
  const trimmed = endpoint.trim()
  if (!trimmed || trimmed.length > 2048 || /[\p{Cc}\s]/u.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) return false
    if (!parsed.pathname || parsed.pathname === '/') return false
    const host = parsed.hostname.toLowerCase()
    if (
      !host.includes('.') ||
      host === 'localhost' ||
      /\.(localhost|local|internal|invalid|test|example|lan|home|arpa)$/.test(host) ||
      /^[0-9.]+$/.test(host) ||
      host.startsWith('[') ||
      /(^|\.)-|-(?:\.|$)/.test(host)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export function extractPushSubscriptionCredentials(
  subscription: PushSubscription | PushSubscriptionJSON,
): { endpoint: string; p256dh: string; auth: string } {
  const endpoint = typeof subscription.endpoint === 'string' ? subscription.endpoint.trim() : ''
  let p256dh = ''
  let auth = ''

  if ('getKey' in subscription && typeof subscription.getKey === 'function') {
    const rawP256dh = subscription.getKey('p256dh')
    const rawAuth = subscription.getKey('auth')
    if (rawP256dh) p256dh = bytesToBase64Url(rawP256dh)
    if (rawAuth) auth = bytesToBase64Url(rawAuth)
  }
  if ((!p256dh || !auth) && 'toJSON' in subscription && typeof subscription.toJSON === 'function') {
    const json = subscription.toJSON()
    p256dh = p256dh || (json.keys?.p256dh?.trim() ?? '')
    auth = auth || (json.keys?.auth?.trim() ?? '')
  } else if (!p256dh || !auth) {
    const json = subscription as PushSubscriptionJSON
    p256dh = p256dh || (json.keys?.p256dh?.trim() ?? '')
    auth = auth || (json.keys?.auth?.trim() ?? '')
  }

  if (!validatePushEndpointUrl(endpoint)) {
    throw new Error('invalid_push_subscription')
  }
  if (!validateVapidPublicKey(p256dh)) {
    throw new Error('invalid_push_subscription')
  }
  const authBytes = urlBase64ToUint8Array(auth)
  if (authBytes.byteLength !== 16 || bytesToBase64Url(authBytes) !== auth) {
    throw new Error('invalid_push_subscription')
  }

  return { endpoint, p256dh, auth }
}

export function sanitizePushPlainText(value: unknown, maxChars: number): string {
  if (typeof value !== 'string') return ''
  const cleaned = value
    .replace(/\p{Cc}/gu, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\b(?:https?|javascript|data|vbscript):\/\/[^\s]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''
  const codePoints = Array.from(cleaned)
  return codePoints.length > maxChars ? `${codePoints.slice(0, maxChars - 1).join('').trimEnd()}…` : cleaned
}

export function sanitizePushTargetPath(value: unknown): string {
  if (typeof value !== 'string') return '/notifications'
  const trimmed = value.trim()
  if (trimmed === '/notifications' || trimmed === '/me/follow-requests') return trimmed
  if (/^\/messages\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return trimmed
  if (/^\/events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/chat)?$/i.test(trimmed)) return trimmed
  return '/notifications'
}

function parsePushSettingsPayload(raw: unknown): PushSettingsData {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('invalid_push_settings_response')
  }
  const record = raw as Record<string, unknown>
  const showPreviews = typeof record.show_previews === 'boolean' ? record.show_previews : true
  const list = Array.isArray(record.subscriptions) ? record.subscriptions : []
  const subscriptions: PushSubscriptionSummary[] = []
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue
    const row = item as Record<string, unknown>
    if (
      isCanonicalUuid(row.id) &&
      typeof row.created_at === 'string' &&
      typeof row.updated_at === 'string' &&
      (row.disabled_at === null || typeof row.disabled_at === 'string')
    ) {
      subscriptions.push({
        id: row.id.toLowerCase(),
        created_at: row.created_at,
        updated_at: row.updated_at,
        disabled_at: row.disabled_at,
      })
    }
  }
  return { show_previews: showPreviews, subscriptions }
}

export async function loadMyPushSettings(): Promise<PushSettingsData> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('get_my_push_settings')
  if (error) throw error
  return parsePushSettingsPayload(data)
}

export async function upsertMyPushSubscription(params: {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}): Promise<string> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  if (!isCanonicalUuid(params.id) || !validatePushEndpointUrl(params.endpoint)) {
    throw new Error('invalid_push_subscription')
  }
  const { data, error } = await supabase.rpc('upsert_my_push_subscription', {
    p_id: params.id,
    p_endpoint: params.endpoint,
    p_p256dh: params.p256dh,
    p_auth: params.auth,
  })
  if (error) throw error
  if (!isCanonicalUuid(data)) throw new Error('No se pudo confirmar la suscripción Push.')
  return data.toLowerCase()
}

export async function disableMyPushSubscription(id: string): Promise<string> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  if (!isCanonicalUuid(id)) throw new Error('invalid_push_subscription')
  const { data, error } = await supabase.rpc('disable_my_push_subscription', {
    p_id: id,
  })
  if (error) throw error
  if (!isCanonicalUuid(data)) throw new Error('No se pudo confirmar la baja de la suscripción Push.')
  return data.toLowerCase()
}

export async function setMyPushPreviews(showPreviews: boolean): Promise<boolean> {
  if (!supabase) throw new Error('La conexión no está configurada.')
  const { data, error } = await supabase.rpc('set_my_push_previews', {
    p_show_previews: showPreviews,
  })
  if (error) throw error
  if (typeof data !== 'boolean') throw new Error('No se pudo actualizar la preferencia de vistas previas.')
  return data
}

export async function getReadyServiceWorkerRegistration(timeoutMs = 8000): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('sw_unsupported')
  }
  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing?.active) return existing
  return await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('sw_timeout')), timeoutMs)
    }),
  ])
}

export async function getCurrentBrowserPushSubscription(): Promise<PushSubscription | null> {
  const env = detectPushEnvironment()
  if (!env.supported) return null
  try {
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (!registration?.pushManager) return null
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function clearDisplayedPushNotifications(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (registration && typeof registration.getNotifications === 'function') {
      const notifications = await registration.getNotifications()
      for (const item of notifications) item.close()
    }
    navigator.serviceWorker.controller?.postMessage({ type: 'PLANIT_CLEAR_NOTIFICATIONS' })
  } catch {
    // Best-effort cleanup of local notifications.
  }
}

export async function resolvePushNotificationNavigation(
  payload: unknown,
  currentUserId: string | null,
): Promise<string> {
  if (!currentUserId || typeof payload !== 'object' || payload === null) {
    return '/notifications'
  }
  const record = payload as Record<string, unknown>
  const recipientId = isCanonicalUuid(record.recipient_id) ? record.recipient_id.toLowerCase() : null
  if (recipientId && recipientId !== currentUserId.toLowerCase()) {
    return '/notifications'
  }
  const notificationId = isCanonicalUuid(record.notification_id) ? record.notification_id.toLowerCase() : null
  if (!notificationId) {
    return sanitizePushTargetPath(record.target)
  }
  try {
    const verifiedTarget = await notificationTarget(notificationId)
    return verifiedTarget ? sanitizePushTargetPath(verifiedTarget) : '/notifications'
  } catch {
    return '/notifications'
  }
}

export function pushErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : ''
  if (message === 'sw_timeout' || message === 'sw_unsupported') {
    return 'El Service Worker de la aplicación todavía no está listo. Recargá la página y volvé a intentar.'
  }
  if (message === 'invalid_push_subscription' || code === '22023') {
    return 'El navegador devolvió datos de suscripción inválidos. Intentá desactivar y volver a activar las notificaciones.'
  }
  if (code === 'P0001' || message.includes('push_subscription_conflict')) {
    return 'Detectamos un conflicto con la suscripción de este navegador. Volvé a sincronizar para renovarla.'
  }
  if (['42501', 'PGRST301', 'PGRST303'].includes(code) || message.includes('push_subscription_unavailable')) {
    return 'No pudimos asociar la suscripción a tu cuenta. Si compartís este navegador, volvé a intentar para generar una suscripción nueva.'
  }
  if (['PGRST202', '42P01'].includes(code)) {
    return 'El servicio de suscripciones Push todavía no está disponible en este entorno.'
  }
  return 'No pudimos completar la operación de notificaciones Push. Revisá la conexión y volvé a intentar; tu bandeja interna sigue disponible.'
}
