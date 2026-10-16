import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useAuth } from '../auth/useAuth'
import {
  clearDisplayedPushNotifications,
  derivePushSubscriptionId,
  detectPushEnvironment,
  disableMyPushSubscription,
  extractPushSubscriptionCredentials,
  getCurrentBrowserPushSubscription,
  getReadyServiceWorkerRegistration,
  loadMyPushSettings,
  pushErrorMessage,
  setMyPushPreviews,
  upsertMyPushSubscription,
  urlBase64ToUint8Array,
  type PushBrowserState,
  type PushEnvironmentCapability,
  type PushSettingsData,
} from './push'
import './push-settings.css'

/**
 * Isolated Web Push settings component (R7 Block 9).
 * B11 connects this component into Profile/Settings routes.
 */
export function PushSettings({ userId }: { userId?: string }) {
  if (userId !== undefined) {
    return <PushSettingsResolved userId={userId} />
  }
  return <PushSettingsFromAuth />
}

function PushSettingsFromAuth() {
  const { session } = useAuth()
  return <PushSettingsResolved userId={session?.user.id ?? ''} />
}

function PushSettingsResolved({ userId }: { userId: string }) {
  useEffect(() => {
    return () => {
      void clearDisplayedPushNotifications()
    }
  }, [userId])
  if (!userId) return null
  return <PushSettingsPanel key={userId} userId={userId} />
}

function PushSettingsPanel({ userId }: { userId: string }) {
  const headingId = useId()
  const privacyId = useId()
  const previewDescId = useId()
  const [env, setEnv] = useState<PushEnvironmentCapability>(() => detectPushEnvironment())
  const [settings, setSettings] = useState<PushSettingsData | null>(null)
  const [browserSubId, setBrowserSubId] = useState<string | null>(null)
  const [hasLocalSub, setHasLocalSub] = useState(false)
  const [syncUncertain, setSyncUncertain] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | 'preview' | 'discard' | null>(null)
  const [showPreviews, setShowPreviews] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const alive = useRef(true)
  const busy = useRef(false)
  const revision = useRef(0)

  const synchronize = useCallback(async (preserveFeedback = false) => {
    const req = ++revision.current
    if (!preserveFeedback) {
      setError('')
      setNotice('')
    }
    setLoading(true)
    const nextEnv = detectPushEnvironment()
    setEnv(nextEnv)
    try {
      const [remote, localSub] = await Promise.all([
        loadMyPushSettings(),
        getCurrentBrowserPushSubscription(),
      ])
      let derivedId: string | null = null
      if (localSub?.endpoint) {
        try {
          derivedId = await derivePushSubscriptionId(userId, localSub.endpoint)
        } catch {
          derivedId = null
        }
      }
      if (!alive.current || req !== revision.current) return
      setSettings(remote)
      setShowPreviews(remote.show_previews)
      setHasLocalSub(Boolean(localSub))
      setBrowserSubId(derivedId)
      const isRegisteredActive = Boolean(
        derivedId && remote.subscriptions.some(item => item.id === derivedId && item.disabled_at === null),
      )
      if (isRegisteredActive) {
        setSyncUncertain(false)
      }
      setLoading(false)
    } catch (failure) {
      if (!alive.current || req !== revision.current) return
      setLoading(false)
      setError(pushErrorMessage(failure))
    }
  }, [userId])

  useEffect(() => {
    alive.current = true
    queueMicrotask(() => {
      if (alive.current) {
        void synchronize()
      }
    })
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !busy.current) {
        void synchronize(true)
      }
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive.current = false
      revision.current += 1
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [synchronize])

  const activeSubscriptions = settings?.subscriptions.filter(item => item.disabled_at === null) ?? []
  const isCurrentBrowserActive = Boolean(
    browserSubId && activeSubscriptions.some(item => item.id === browserSubId),
  )

  let browserState: PushBrowserState = 'inactive'
  if (env.requiresIosInstall) browserState = 'ios_install_required'
  else if (!env.supported) browserState = 'unsupported'
  else if (env.permission === 'denied') browserState = 'denied'
  else if (syncUncertain) browserState = 'uncertain'
  else if (isCurrentBrowserActive && env.permission === 'granted') browserState = 'active'
  else if (!env.vapidConfigured) browserState = 'unconfigured'

  async function handleTogglePreviews(nextValue: boolean) {
    if (busy.current) return
    setShowPreviews(nextValue)
    setError('')
    setNotice('')
    if (!settings) return
    busy.current = true
    setPendingAction('preview')
    try {
      const persisted = await setMyPushPreviews(nextValue)
      if (!alive.current) return
      setShowPreviews(persisted)
      setSettings(prev => (prev ? { ...prev, show_previews: persisted } : prev))
      setNotice(
        persisted
          ? 'Las vistas previas quedaron activadas para tus notificaciones Push.'
          : 'Las vistas previas quedaron ocultas. Recibirás avisos Push genéricos y tu bandeja interna seguirá intacta.',
      )
    } catch (failure) {
      if (!alive.current) return
      setShowPreviews(settings.show_previews)
      setError(pushErrorMessage(failure))
    } finally {
      if (alive.current) {
        busy.current = false
        setPendingAction(null)
      }
    }
  }

  async function handleEnablePush() {
    if (busy.current) return
    setError('')
    setNotice('')
    const currentEnv = detectPushEnvironment()
    setEnv(currentEnv)
    if (currentEnv.requiresIosInstall) {
      setError('En iPhone o iPad, instalá primero PlanIt en la pantalla de inicio para habilitar notificaciones Push.')
      return
    }
    if (!currentEnv.supported) {
      setError('Este navegador no admite notificaciones Web Push. Tu bandeja interna de notificaciones sigue disponible.')
      return
    }
    if (!currentEnv.vapidConfigured || !currentEnv.vapidPublicKey) {
      setError('Las notificaciones Push no están configuradas en este entorno. Tu bandeja interna sigue disponible.')
      return
    }

    busy.current = true
    setPendingAction('enable')
    try {
      let permission: NotificationPermission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }
      if (!alive.current) return
      setEnv(detectPushEnvironment())

      if (permission === 'denied') {
        setNotice('Rechazaste el permiso de notificaciones en el navegador. Tu bandeja interna de notificaciones continúa disponible.')
        return
      }
      if (permission !== 'granted') {
        setNotice('No se concedió el permiso de notificaciones. Podés activarlo cuando quieras; tu bandeja interna continúa disponible.')
        return
      }

      const registration = await getReadyServiceWorkerRegistration()
      let subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const existingId = await derivePushSubscriptionId(userId, subscription.endpoint)
        const ownedActive = settings?.subscriptions.some(item => item.id === existingId)
        if (!ownedActive && !syncUncertain) {
          // Shared browser or leftover endpoint: unsubscribe first so a fresh endpoint is issued.
          await subscription.unsubscribe()
          subscription = null
        }
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(currentEnv.vapidPublicKey),
        })
      }

      if (!alive.current) return
      setHasLocalSub(true)
      const credentials = extractPushSubscriptionCredentials(subscription)
      const derivedId = await derivePushSubscriptionId(userId, credentials.endpoint)
      setBrowserSubId(derivedId)

      try {
        await upsertMyPushSubscription({
          id: derivedId,
          endpoint: credentials.endpoint,
          p256dh: credentials.p256dh,
          auth: credentials.auth,
        })
        if (!showPreviews) {
          await setMyPushPreviews(false)
        }
      } catch (rpcError) {
        const code = typeof rpcError === 'object' && rpcError !== null && 'code' in rpcError ? String(rpcError.code) : ''
        const msg = rpcError instanceof Error ? rpcError.message : ''
        if (code === '42501' || msg.includes('push_subscription_unavailable')) {
          // Endpoint belongs to another account: revoke local subscription immediately, no takeover.
          try { await subscription.unsubscribe() } catch { /* ignore */ }
          if (alive.current) {
            setHasLocalSub(false)
            setBrowserSubId(null)
            setSyncUncertain(false)
          }
        } else if (alive.current) {
          setSyncUncertain(true)
        }
        throw rpcError
      }

      if (!alive.current) return
      setSyncUncertain(false)
      await synchronize(true)
      if (!alive.current) return
      setNotice('Notificaciones Web Push activadas en este navegador.')
    } catch (failure) {
      if (!alive.current) return
      setError(pushErrorMessage(failure))
    } finally {
      if (alive.current) {
        busy.current = false
        setPendingAction(null)
      }
    }
  }

  async function handleDiscardLocalSubscription() {
    if (busy.current) return
    busy.current = true
    setPendingAction('discard')
    setError('')
    setNotice('')
    try {
      const localSub = await getCurrentBrowserPushSubscription()
      if (localSub) {
        await localSub.unsubscribe()
      }
      await clearDisplayedPushNotifications()
      if (!alive.current) return
      setHasLocalSub(false)
      setBrowserSubId(null)
      setSyncUncertain(false)
      setNotice('Se canceló la suscripción pendiente en este navegador. Tu bandeja interna sigue disponible.')
    } catch (failure) {
      if (!alive.current) return
      setError(pushErrorMessage(failure))
    } finally {
      if (alive.current) {
        busy.current = false
        setPendingAction(null)
      }
    }
  }

  async function handleDisablePush() {
    if (busy.current) return
    const targetId = browserSubId
    if (!targetId) return
    busy.current = true
    setPendingAction('disable')
    setError('')
    setNotice('')
    try {
      await disableMyPushSubscription(targetId)
      const localSub = await getCurrentBrowserPushSubscription()
      if (localSub) {
        try { await localSub.unsubscribe() } catch { /* Server already disabled this endpoint. */ }
      }
      await clearDisplayedPushNotifications()
      if (!alive.current) return
      setHasLocalSub(false)
      setBrowserSubId(null)
      setSyncUncertain(false)
      await synchronize(true)
      if (!alive.current) return
      setNotice('Desactivaste las notificaciones Push en este navegador. Tu historial de avisos en PlanIt sigue intacto.')
    } catch (failure) {
      if (!alive.current) return
      setError(pushErrorMessage(failure))
    } finally {
      if (alive.current) {
        busy.current = false
        setPendingAction(null)
      }
    }
  }

  const stateLabels: Record<PushBrowserState, { badge: string; tone: 'active' | 'warn' | 'muted' | 'danger'; summary: string }> = {
    active: {
      badge: 'Activas en este navegador',
      tone: 'active',
      summary: 'Recibirás avisos en este dispositivo incluso cuando PlanIt no esté abierta.',
    },
    inactive: {
      badge: 'Desactivadas en este navegador',
      tone: 'muted',
      summary: 'Podés activar avisos opcionales en este dispositivo. La bandeja interna funciona siempre.',
    },
    uncertain: {
      badge: 'Sincronización pendiente',
      tone: 'warn',
      summary: 'El navegador creó la suscripción, pero no pudimos confirmarla en el servidor. No están activas todavía.',
    },
    denied: {
      badge: 'Permiso bloqueado en el navegador',
      tone: 'danger',
      summary: 'El navegador tiene bloqueados los avisos para este sitio. Tu bandeja interna de notificaciones sigue disponible.',
    },
    ios_install_required: {
      badge: 'Requiere instalar la app',
      tone: 'warn',
      summary: 'En iPhone o iPad, agregá PlanIt a la pantalla de inicio para habilitar notificaciones Web Push. Tu bandeja interna sigue disponible.',
    },
    unsupported: {
      badge: 'Navegador no compatible',
      tone: 'muted',
      summary: 'Este navegador o contexto no admite Web Push. Tu bandeja interna de notificaciones continúa disponible.',
    },
    unconfigured: {
      badge: 'Clave pública pendiente',
      tone: 'warn',
      summary: 'Falta configurar la clave pública VAPID en este entorno. Tu bandeja interna de notificaciones continúa disponible.',
    },
  }

  const currentStatus = stateLabels[browserState]
  const controlsDisabled = loading || pendingAction !== null

  return (
    <section className="push-settings" aria-labelledby={headingId} aria-busy={loading || pendingAction !== null}>
      <div className="push-settings-header">
        <div className="push-settings-title-group">
          <span className="push-settings-icon" aria-hidden="true">
            <Icon name="bell" />
          </span>
          <div>
            <h2 id={headingId}>Notificaciones Web Push</h2>
            <p className="push-settings-subtitle">
              Complementan tu bandeja interna sin reemplazarla ni duplicar avisos.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-button push-settings-refresh"
          disabled={controlsDisabled}
          onClick={() => void synchronize()}
        >
          Actualizar estado
        </button>
      </div>

      <div className={`push-settings-status is-${currentStatus.tone}`} role="status">
        <span className="push-settings-badge">
          <Icon name={browserState === 'active' ? 'check' : browserState === 'denied' ? 'close' : 'bell'} />
          <span>{loading ? 'Comprobando estado…' : currentStatus.badge}</span>
        </span>
        <p className="push-settings-summary">
          {loading ? 'Consultando tus preferencias y el estado de este navegador…' : currentStatus.summary}
        </p>
        {!loading && activeSubscriptions.length > 0 && (
          <p className="push-settings-devices">
            Dispositivos activos en tu cuenta: <strong>{activeSubscriptions.length}</strong>
          </p>
        )}
      </div>

      <div className="push-settings-privacy" id={privacyId}>
        <span className="push-settings-privacy-icon" aria-hidden="true">
          <Icon name="lock" />
        </span>
        <p>
          Las notificaciones pueden mostrar el remitente y parte de tus mensajes privados incluso con la pantalla bloqueada.
        </p>
      </div>

      <div className="push-settings-toggle-row">
        <label className="push-settings-toggle-label" htmlFor={`${headingId}-previews`}>
          <span className="push-settings-toggle-title">
            <Icon name={showPreviews ? 'eye' : 'eyeOff'} />
            <span>Mostrar vistas previas</span>
          </span>
          <span id={previewDescId} className="push-settings-toggle-hint">
            {showPreviews
              ? 'Activado: muestra quién te escribió y un fragmento del mensaje privado.'
              : 'Oculto: muestra un aviso genérico sin remitente ni texto en pantalla bloqueada. Tu bandeja interna no cambia.'}
          </span>
        </label>
        <input
          id={`${headingId}-previews`}
          type="checkbox"
          className="push-settings-checkbox"
          checked={showPreviews}
          disabled={controlsDisabled}
          aria-describedby={`${privacyId} ${previewDescId}`}
          onChange={event => void handleTogglePreviews(event.target.checked)}
        />
      </div>

      {notice && (
        <p className="push-settings-notice" role="status">
          <Icon name="check" />
          <span>{notice}</span>
        </p>
      )}

      {error && (
        <p className="push-settings-error field-error" role="alert">
          <Icon name="close" />
          <span>{error}</span>
        </p>
      )}

      <div className="push-settings-actions">
        {browserState === 'active' && (
          <button
            type="button"
            className="secondary-button push-settings-action"
            disabled={controlsDisabled}
            onClick={() => void handleDisablePush()}
          >
            {pendingAction === 'disable' ? 'Desactivando…' : 'Desactivar en este navegador'}
          </button>
        )}

        {browserState === 'inactive' && (
          <button
            type="button"
            className="gradient-link gradient-button push-settings-action"
            disabled={controlsDisabled}
            aria-describedby={privacyId}
            onClick={() => void handleEnablePush()}
          >
            <Icon name="bell" />
            <span>
              {pendingAction === 'enable'
                ? 'Activando…'
                : hasLocalSub
                  ? 'Vincular notificaciones en este navegador'
                  : 'Activar notificaciones Push'}
            </span>
          </button>
        )}

        {browserState === 'uncertain' && (
          <>
            <button
              type="button"
              className="gradient-link gradient-button push-settings-action"
              disabled={controlsDisabled}
              onClick={() => void handleEnablePush()}
            >
              {pendingAction === 'enable' ? 'Sincronizando…' : 'Reintentar sincronización'}
            </button>
            <button
              type="button"
              className="secondary-button push-settings-action"
              disabled={controlsDisabled}
              onClick={() => void handleDiscardLocalSubscription()}
            >
              {pendingAction === 'discard' ? 'Cancelando…' : 'Cancelar suscripción local'}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
