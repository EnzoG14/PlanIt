import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

interface SwNotificationData {
  version: 1
  notification_id: string | null
  recipient_id: string | null
  target: string
}

interface SwNotificationOptions {
  body: string
  icon: string
  badge: string
  tag: string
  renotify: boolean
  data: SwNotificationData
}

interface SwNotification {
  tag?: string
  data?: unknown
  close(): void
}

interface SwRegistration {
  scope: string
  showNotification(title: string, options: SwNotificationOptions): Promise<void>
  getNotifications(filter?: { tag?: string }): Promise<SwNotification[]>
}

interface SwWindowClient {
  url: string
  focused?: boolean
  focus(): Promise<SwWindowClient>
  navigate(url: string): Promise<SwWindowClient | null>
  postMessage(message: unknown): void
}

interface SwClients {
  matchAll(options?: { type?: 'window'; includeUncontrolled?: boolean }): Promise<SwWindowClient[]>
  openWindow(url: string): Promise<SwWindowClient | null>
}

interface SwPushEvent extends Event {
  data?: {
    text(): string
    json(): unknown
  } | null
  waitUntil(promise: Promise<unknown>): void
}

interface SwNotificationClickEvent extends Event {
  notification: SwNotification
  waitUntil(promise: Promise<unknown>): void
}

interface SwMessageEvent extends Event {
  data?: unknown
  origin?: string
  waitUntil?(promise: Promise<unknown>): void
}

interface SwScope {
  __WB_MANIFEST: Array<PrecacheEntry | string>
  location: Location
  registration: SwRegistration
  clients: SwClients
  skipWaiting(): Promise<void>
  addEventListener(type: 'push', listener: (event: SwPushEvent) => void): void
  addEventListener(type: 'notificationclick', listener: (event: SwNotificationClickEvent) => void): void
  addEventListener(type: 'message', listener: (event: SwMessageEvent) => void): void
}

declare const self: SwScope & typeof globalThis

const sw = self as unknown as SwScope

// Maintain identical autoUpdate and offline app-shell behavior as generateSW.
// Never runtime-cache Supabase Auth/REST/Storage/Realtime or map tiles.
void sw.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GENERIC_TITLE = 'Nuevo aviso en PlanIt'
const GENERIC_BODY = 'Abrí PlanIt para consultar tus notificaciones.'
const FALLBACK_TAG = 'planit-notification'
const MAX_TITLE_CHARS = 80
const MAX_BODY_CHARS = 120

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function sanitizePlainText(value: unknown, maxChars: number): string {
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

function sanitizeInternalTarget(value: unknown): string {
  if (typeof value !== 'string') return '/notifications'
  const trimmed = value.trim()
  if (trimmed === '/notifications' || trimmed === '/me/follow-requests') return trimmed
  if (/^\/messages\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return trimmed
  if (/^\/events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/chat)?$/i.test(trimmed)) return trimmed
  return '/notifications'
}

function normalizePushPayload(raw: unknown): { title: string; options: SwNotificationOptions } {
  const fallbackData: SwNotificationData = {
    version: 1,
    notification_id: null,
    recipient_id: null,
    target: '/notifications',
  }
  if (typeof raw !== 'object' || raw === null) {
    return {
      title: GENERIC_TITLE,
      options: {
        body: GENERIC_BODY,
        icon: '/icons/pwa-192.png',
        badge: '/icons/pwa-192.png',
        tag: FALLBACK_TAG,
        renotify: false,
        data: fallbackData,
      },
    }
  }
  const record = raw as Record<string, unknown>
  const notificationId = isCanonicalUuid(record.notification_id) ? record.notification_id.toLowerCase() : null
  const recipientId = isCanonicalUuid(record.recipient_id) ? record.recipient_id.toLowerCase() : null
  const tag = notificationId ?? FALLBACK_TAG
  const target = sanitizeInternalTarget(record.target)

  if (record.version !== 1) {
    return {
      title: GENERIC_TITLE,
      options: {
        body: GENERIC_BODY,
        icon: '/icons/pwa-192.png',
        badge: '/icons/pwa-192.png',
        tag,
        renotify: false,
        data: { version: 1, notification_id: notificationId, recipient_id: recipientId, target: '/notifications' },
      },
    }
  }

  const title = sanitizePlainText(record.title, MAX_TITLE_CHARS) || GENERIC_TITLE
  const body = sanitizePlainText(record.body, MAX_BODY_CHARS) || GENERIC_BODY
  return {
    title,
    options: {
      body,
      icon: '/icons/pwa-192.png',
      badge: '/icons/pwa-192.png',
      tag,
      renotify: false,
      data: {
        version: 1,
        notification_id: notificationId,
        recipient_id: recipientId,
        target,
      },
    },
  }
}

sw.addEventListener('push', event => {
  let parsed: unknown = null
  if (event.data) {
    try {
      parsed = event.data.json()
    } catch {
      parsed = null
    }
  }
  const { title, options } = normalizePushPayload(parsed)
  event.waitUntil(sw.registration.showNotification(title, options))
})

sw.addEventListener('notificationclick', event => {
  event.notification.close()
  const rawData = typeof event.notification.data === 'object' && event.notification.data !== null
    ? (event.notification.data as Record<string, unknown>)
    : {}
  const notificationId = isCanonicalUuid(rawData.notification_id) ? rawData.notification_id.toLowerCase() : null
  const recipientId = isCanonicalUuid(rawData.recipient_id) ? rawData.recipient_id.toLowerCase() : null
  const safeTarget = sanitizeInternalTarget(rawData.target)
  // Always route through internal origin and revalidate Auth/RLS before exposing resources.
  const destinationUrl = new URL('/notifications', sw.location.origin)
  if (destinationUrl.origin !== sw.location.origin) return

  event.waitUntil((async () => {
    const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const sameOriginClient = clients.find(client => {
      try {
        return new URL(client.url).origin === sw.location.origin
      } catch {
        return false
      }
    })
    if (sameOriginClient) {
      sameOriginClient.postMessage({
        type: 'PLANIT_NOTIFICATION_CLICK',
        notification_id: notificationId,
        recipient_id: recipientId,
        target: safeTarget,
      })
      try {
        await sameOriginClient.focus()
      } catch {
        // Focus can throw InvalidAccessError if the browser restricts window focus.
      }
      try {
        const currentUrl = new URL(sameOriginClient.url)
        if (currentUrl.pathname !== '/notifications' && currentUrl.pathname !== safeTarget) {
          await sameOriginClient.navigate(destinationUrl.href)
        }
      } catch {
        // Messaging the same-origin client already succeeded.
      }
      return
    }
    try {
      await sw.clients.openWindow(destinationUrl.href)
    } catch {
      // Ignore if browser blocks window opening outside native gesture.
    }
  })())
})

sw.addEventListener('message', event => {
  if (event.origin && event.origin !== sw.location.origin) return
  const payload = typeof event.data === 'object' && event.data !== null
    ? (event.data as Record<string, unknown>)
    : null
  if (!payload) return
  if (payload.type === 'SKIP_WAITING') {
    void sw.skipWaiting()
    return
  }
  if (payload.type === 'PLANIT_CLEAR_NOTIFICATIONS') {
    const clearPromise = sw.registration.getNotifications().then(list => {
      for (const item of list) item.close()
    })
    if (typeof event.waitUntil === 'function') event.waitUntil(clearPromise)
  }
})
