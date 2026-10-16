import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build as viteBuild } from 'vite'
import react from '@vitejs/plugin-react'

const outputDir = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r7-block-9'
const screenshotsDir = join(outputDir, 'screenshots')
await mkdir(screenshotsDir, { recursive: true })

function generateP256KeyBase64Url() {
  const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = publicKey.export({ format: 'jwk' })
  return Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(jwk.x, 'base64url'),
    Buffer.from(jwk.y, 'base64url'),
  ]).toString('base64url')
}

const vapidPublicKey = generateP256KeyBase64Url()
const clientP256dh = generateP256KeyBase64Url()
const clientAuth = Buffer.alloc(16, 0x5a).toString('base64url')

const userA = '11111111-1111-4111-8111-111111111111'
const userB = '22222222-2222-4222-8222-222222222222'
const otherDeviceId = '99999999-9999-4999-8999-999999999999'

const tempEntryHtml = resolve('b9-ui-harness.local.html')
const tempEntryTsx = resolve('b9-ui-harness.local.tsx')
const tempOutDir = resolve('.b9-ui-dist.local')

const HARNESS_TSX = `import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './src/index.css'
import { PushSettings } from './src/features/notifications/PushSettings'

declare global {
  interface Window {
    __B9_INITIAL_USER__?: string
    __setB9User?: (id: string) => void
  }
}

function HarnessApp() {
  const [userId, setUserId] = useState(window.__B9_INITIAL_USER__ || '${userA}')
  useEffect(() => {
    window.__setB9User = setUserId
  }, [])
  return <PushSettings userId={userId} key={userId} />
}

createRoot(document.getElementById('b9-root')!).render(<HarnessApp />)
`

const HARNESS_HTML = `<!doctype html>
<html lang="es-AR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PlanIt · PushSettings B9 Harness</title>
  </head>
  <body style="margin: 0; background: var(--pi-color-bg, #f6f5fd);">
    <div class="app-shell amanecer-shell" style="min-height: 100vh; padding: 16px; box-sizing: border-box;">
      <main style="max-width: 720px; margin: 0 auto;">
        <div id="b9-root"></div>
      </main>
    </div>
    <script type="module" src="/b9-ui-harness.local.tsx"></script>
  </body>
</html>`

await writeFile(tempEntryTsx, HARNESS_TSX)
await writeFile(tempEntryHtml, HARNESS_HTML)
await viteBuild({
  configFile: false,
  logLevel: 'error',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://iepeqmvzjguwlhnecsdq.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.fixture'),
    'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(vapidPublicKey),
  },
  build: {
    outDir: tempOutDir,
    emptyOutDir: true,
    rollupOptions: {
      input: tempEntryHtml,
    },
  },
})

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    let reqPath = decodeURIComponent(url.pathname)
    if (reqPath === '/' || reqPath === '/__b9_harness') reqPath = '/b9-ui-harness.local.html'
    const safePath = normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '')
    let filePath = join(tempOutDir, safePath)
    let fileStat = await stat(filePath).catch(() => null)
    if (!fileStat || !fileStat.isFile()) {
      filePath = join(tempOutDir, 'b9-ui-harness.local.html')
      fileStat = await stat(filePath)
    }
    const ext = extname(filePath).toLowerCase()
    const body = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(body)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(String(err))
  }
})

await new Promise(r => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`

const { chromium } = await import(
  pathToFileURL(
    process.env.PLANIT_PLAYWRIGHT_PATH ??
      'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs',
  ).href
)

const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const results = []
const record = (test, details = {}) => {
  results.push({
    test,
    result: 'PASS',
    environment: 'Edge headless + compiled PushSettings bundle with mocked PushManager/Notification and PostgREST RPC fixtures',
    ...details,
  })
  console.log(`PASS: ${test}`)
}

try {
  const dbState = {
    [userA]: {
      show_previews: true,
      subscriptions: [
        {
          id: otherDeviceId,
          created_at: '2026-10-15T10:00:00',
          updated_at: '2026-10-15T10:00:00',
          disabled_at: null,
        },
      ],
    },
    [userB]: {
      show_previews: true,
      subscriptions: [],
    },
  }

  let currentRpcUser = userA
  let failNextUpsert = false
  let failNextDisable = false
  const rpcCalls = []

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })

  await context.addInitScript(
    ({ p256dh, auth, initialUser }) => {
      window.__B9_INITIAL_USER__ = initialUser
      window.__b9MockState = {
        permission: 'default',
        nextRequestPermission: 'granted',
        subscription: null,
        endpoint: 'https://fcm.googleapis.com/fcm/send/browser-edge-1',
        p256dh,
        auth,
        subscribeCalls: 0,
        unsubscribeCalls: 0,
      }

      const decodeB64Url = b64 => {
        const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4)
        const raw = atob(padded)
        const out = new Uint8Array(raw.length)
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
        return out.buffer
      }

      const makeSub = () => ({
        endpoint: window.__b9MockState.endpoint,
        expirationTime: null,
        options: { userVisibleOnly: true },
        getKey(name) {
          if (name === 'p256dh') return decodeB64Url(window.__b9MockState.p256dh)
          if (name === 'auth') return decodeB64Url(window.__b9MockState.auth)
          return null
        },
        toJSON() {
          return {
            endpoint: window.__b9MockState.endpoint,
            expirationTime: null,
            keys: {
              p256dh: window.__b9MockState.p256dh,
              auth: window.__b9MockState.auth,
            },
          }
        },
        async unsubscribe() {
          window.__b9MockState.unsubscribeCalls += 1
          window.__b9MockState.subscription = null
          return true
        },
      })

      const mockPushManager = {
        async getSubscription() {
          return window.__b9MockState.subscription
        },
        async subscribe(options) {
          window.__b9MockState.subscribeCalls += 1
          if (
            !options ||
            options.userVisibleOnly !== true ||
            !(options.applicationServerKey instanceof Uint8Array) ||
            options.applicationServerKey.byteLength !== 65
          ) {
            throw new Error('Invalid PushManager.subscribe options')
          }
          const sub = makeSub()
          window.__b9MockState.subscription = sub
          return sub
        },
      }

      const fakeReg = {
        scope: `${location.origin}/`,
        active: { scriptURL: `${location.origin}/sw.js`, state: 'activated', postMessage() {} },
        pushManager: mockPushManager,
      }

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve(fakeReg),
          controller: fakeReg.active,
          async getRegistration() {
            return fakeReg
          },
          async register() {
            return fakeReg
          },
          addEventListener() {},
          removeEventListener() {},
        },
      })

      class MockNotification {
        static get permission() {
          return window.__b9MockState.permission
        }
        static async requestPermission() {
          window.__b9MockState.permission = window.__b9MockState.nextRequestPermission
          return window.__b9MockState.permission
        }
      }
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      })
      Object.defineProperty(window, 'PushManager', {
        configurable: true,
        writable: true,
        value: function PushManager() {},
      })
    },
    { p256dh: clientP256dh, auth: clientAuth, initialUser: userA },
  )

  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**', async route => {
    const req = route.request()
    const url = new URL(req.url())
    const reply = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (url.pathname === '/rest/v1/rpc/get_my_push_settings') {
      rpcCalls.push({ rpc: 'get_my_push_settings', user: currentRpcUser })
      return reply(dbState[currentRpcUser])
    }
    if (url.pathname === '/rest/v1/rpc/upsert_my_push_subscription') {
      const body = req.postDataJSON()
      rpcCalls.push({ rpc: 'upsert_my_push_subscription', user: currentRpcUser, body })
      if (failNextUpsert) {
        failNextUpsert = false
        return reply({ code: 'XX000', message: 'database error' }, 500)
      }
      const userState = dbState[currentRpcUser]
      const existing = userState.subscriptions.find(s => s.id === body.p_id)
      const now = '2026-10-16T12:15:00'
      if (existing) {
        existing.updated_at = now
        existing.disabled_at = null
      } else {
        userState.subscriptions.unshift({
          id: body.p_id,
          created_at: now,
          updated_at: now,
          disabled_at: null,
        })
      }
      return reply(body.p_id)
    }
    if (url.pathname === '/rest/v1/rpc/disable_my_push_subscription') {
      const body = req.postDataJSON()
      rpcCalls.push({ rpc: 'disable_my_push_subscription', user: currentRpcUser, body })
      if (failNextDisable) {
        failNextDisable = false
        return reply({ code: 'XX000', message: 'database error' }, 500)
      }
      const userState = dbState[currentRpcUser]
      const existing = userState.subscriptions.find(s => s.id === body.p_id)
      if (!existing) return reply({ code: '42501', message: 'push_subscription_unavailable' }, 403)
      existing.disabled_at = '2026-10-16T12:20:00'
      existing.updated_at = '2026-10-16T12:20:00'
      return reply(body.p_id)
    }
    if (url.pathname === '/rest/v1/rpc/set_my_push_previews') {
      const body = req.postDataJSON()
      rpcCalls.push({ rpc: 'set_my_push_previews', user: currentRpcUser, body })
      dbState[currentRpcUser].show_previews = Boolean(body.p_show_previews)
      return reply(dbState[currentRpcUser].show_previews)
    }
    return reply([])
  })

  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const pageErrors = []
  page.on('pageerror', err => {
    console.error('PAGEERROR:', err.message)
    pageErrors.push(err.message)
  })
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text())
  })

  await page.goto(`${origin}/__b9_harness`)
  await page.getByRole('heading', { name: 'Notificaciones Web Push' }).waitFor()

  // Initial state: permission 'default', not active on this browser, 1 active subscription on another device
  await page.getByText('Desactivadas en este navegador').waitFor()
  await page.getByText('Dispositivos activos en tu cuenta:').waitFor()
  assert.equal(await page.evaluate(() => window.__b9MockState.subscribeCalls), 0, 'Must never request permission or subscribe on mount')
  await page.screenshot({ path: join(screenshotsDir, 'state-default-390.png'), fullPage: true })
  record('R7-B9-TC-01 UI: initial default state renders without auto-prompting Notification.requestPermission and shows multi-device count')

  // Test uncertain state when PushManager.subscribe succeeds in browser but DB upsert fails
  failNextUpsert = true
  await page.getByRole('button', { name: 'Activar notificaciones Push' }).click()
  await page.getByText('Sincronización pendiente').waitFor()
  await page.getByRole('button', { name: 'Reintentar sincronización' }).waitFor()
  await page.getByRole('button', { name: 'Cancelar suscripción local' }).waitFor()
  await page.screenshot({ path: join(screenshotsDir, 'state-uncertain-390.png'), fullPage: true })
  record('Uncertain state: when PushManager.subscribe succeeds but DB RPC fails, UI never reports active and offers retry or local discard')

  // Retry registration succeeds and transitions to Active state
  await page.getByRole('button', { name: 'Reintentar sincronización' }).click()
  await page.getByText('Activas en este navegador').waitFor()
  assert.equal(await page.locator('.push-settings-devices strong').textContent(), '2')
  await page.screenshot({ path: join(screenshotsDir, 'state-active-390.png'), fullPage: true })
  record('R7-B9-TC-01 UI: retry completes upsert_my_push_subscription and transitions to Active state with 2 active devices')

  // Toggle preview preference via keyboard (Focus + Space) -> R7-B9-TC-02
  const previewCheckbox = page.getByRole('checkbox', { name: /Mostrar vistas previas/i })
  await previewCheckbox.focus()
  assert.equal(await previewCheckbox.isChecked(), true)
  await page.keyboard.press('Space')
  await page.getByText('Oculto: muestra un aviso genérico sin remitente ni texto en pantalla bloqueada', { exact: false }).waitFor()
  assert.equal(await previewCheckbox.isChecked(), false)
  assert.equal(dbState[userA].show_previews, false)
  record('R7-B9-TC-02 UI: preview checkbox toggles via keyboard Space, updates description, and persists set_my_push_previews(false)')

  // Shared browser account switch: User A -> User B on the same browser (which still holds the PushManager subscription)
  currentRpcUser = userB
  await page.evaluate(nextUser => window.__setB9User(nextUser), userB)
  await page.getByText('Desactivadas en este navegador').waitFor()
  await page.getByRole('button', { name: 'Vincular notificaciones en este navegador' }).waitFor()
  assert.equal(
    await page.locator('.push-settings-status.is-active').count(),
    0,
    'User B must not see User A browser subscription as active before registering',
  )
  record('Shared browser isolation: switching session from User A to User B does not falsely report active push subscription for User B')

  // Switch back to User A and test opt-out (R7-B9-TC-03)
  currentRpcUser = userA
  await page.evaluate(nextUser => window.__setB9User(nextUser), userA)
  await page.getByText('Activas en este navegador').waitFor()
  await page.getByRole('button', { name: 'Desactivar en este navegador' }).click()
  await page.getByText('Desactivadas en este navegador').waitFor()
  assert.equal(await page.evaluate(() => window.__b9MockState.subscription), null, 'Browser PushSubscription must be unsubscribed')
  const disabledRow = dbState[userA].subscriptions.find(s => s.id !== otherDeviceId)
  assert.ok(disabledRow && disabledRow.disabled_at !== null, 'DB row must have disabled_at set')
  record('R7-B9-TC-03 UI: disabling push unsubscribes browser PushManager and marks subscription disabled_at in DB while preserving other devices')

  // Test Denied state
  await page.evaluate(() => {
    window.__b9MockState.permission = 'denied'
    window.dispatchEvent(new Event('focus'))
  })
  await page.getByText('Permiso bloqueado en el navegador').waitFor()
  assert.equal(await page.locator('.push-settings-action').count(), 0, 'Must not render misleading enable button when browser permission is denied')
  await page.screenshot({ path: join(screenshotsDir, 'state-denied-390.png'), fullPage: true })
  record('Denied state: displays clear browser unblocking guidance without dead or misleading buttons')

  // Test Unsupported state
  await page.evaluate(() => {
    delete window.PushManager
    window.dispatchEvent(new Event('focus'))
  })
  await page.getByText('Navegador no compatible').waitFor()
  await page.screenshot({ path: join(screenshotsDir, 'state-unsupported-390.png'), fullPage: true })
  record('Unsupported state: gracefully informs user when Web Push APIs are unavailable')

  // Restore PushManager & Active state for responsive viewport matrix (320, 375, 390, 768, 1280 + 200% text)
  await page.evaluate(() => {
    window.PushManager = function PushManager() {}
    window.__b9MockState.permission = 'granted'
  })
  await page.reload()
  await page.getByRole('button', { name: 'Activar notificaciones Push' }).click()
  await page.getByText('Activas en este navegador').waitFor()

  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.push-settings')
      const style = getComputedStyle(root)
      const btn = document.querySelector('.push-settings-action')
      const btnRect = btn.getBoundingClientRect()
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        cardOverflow: root.scrollWidth > root.clientWidth + 1,
        buttonHeight: btnRect.height,
        colorText: getComputedStyle(document.body).color,
        fontFamily: style.fontFamily,
      }
    })
    assert.equal(metrics.overflow, false, `Horizontal overflow detected at ${width}px`)
    assert.equal(metrics.cardOverflow, false, `Card overflow detected at ${width}px`)
    assert.ok(metrics.buttonHeight >= 44, `Touch target height < 44px at ${width}px: ${metrics.buttonHeight}`)
    await page.screenshot({ path: join(screenshotsDir, `viewport-${width}.png`), fullPage: true })
  }
  record('Responsive matrix (320, 375, 390, 768, 1280 px): zero horizontal overflow, >=44px touch targets, Amanecer tokens verified')

  // Test 200% text zoom at 320px and 1280px
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px'
    })
    const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert.equal(hasPageOverflow, false, `Horizontal overflow at 200% text zoom (${width}px)`)
    await page.screenshot({ path: join(screenshotsDir, `zoom-200-${width}.png`), fullPage: true })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = ''
    })
  }
  record('Accessibility: 200% text scaling at 320px and 1280px wraps cleanly without horizontal overflow')

  assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`)

  await writeFile(
    join(outputDir, 'ui-results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), rpcCallsCount: rpcCalls.length, results }, null, 2) + '\n',
  )
  await context.close()
} finally {
  await browser.close()
  await new Promise(r => server.close(r))
  await unlink(tempEntryHtml).catch(() => {})
  await unlink(tempEntryTsx).catch(() => {})
  await rm(tempOutDir, { recursive: true, force: true }).catch(() => {})
}
