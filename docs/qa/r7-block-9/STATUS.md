# R7 · Bloque 9 — Web Push Subscriptions, Preferencias de Privacidad y Service Worker (`injectManifest`)

16/10/2026, Argentina. **Entrega técnica verificada en SQL local (PostgreSQL 18.4), Service Worker / bundle de producción y UI aislada en Edge headless; aplicación remota en `planit-v2` y recepción Push en dispositivos físicos pendientes de aprobación humana y Bloque 10.**

- **Rama:** `codex/r7-block-9`
- **Base:** `3f2a498f8cb66039c114732944bb4410d708825a` (`origin/main`, con Bloques 0 y 1 integrados)
- **Worktree:** `C:/Users/enzog/planit-worktrees/r7-block-9`
- **Commit de implementación:** `47f968e`
- **Pull Request (Draft):** [#80](https://github.com/EnzoG14/PlanIt/pull/80)

---

## 1. Alcance entregado y cumplimiento de fronteras (`RELEASE_7_PARALLEL_WORK.md`)

- **Migración `supabase/migrations/20261016142017_r7_push_subscriptions.sql`:**
  - Crea `public.push_subscriptions` (`id`, `user_id`, `endpoint` único, `p256dh`, `auth`, `created_at`, `updated_at`, `disabled_at`) y `public.push_preferences` (`user_id`, `show_previews`, `updated_at`) con `ON DELETE RESTRICT` hacia `public.profiles(id)` y `timestamp without time zone` en hora de Argentina (`America/Argentina/Buenos_Aires`).
  - Activa RLS desde la creación de ambas tablas y revoca privilegios directos (`REVOKE ALL ... FROM PUBLIC, anon, authenticated`), impidiendo cualquier `SELECT`, `INSERT`, `UPDATE` o `DELETE` directo desde PostgREST sobre endpoints o material criptográfico (`p256dh`, `auth`).
  - Define helpers privados en `planit_private` (`decode_base64url`, `bytes_to_numeric`, `is_valid_p256_public_key`, `is_valid_push_endpoint`) con `search_path = ''` que verifican formato canónico `base64url`, longitud de 65 bytes con prefijo `0x04` y ecuación de la curva NIST P-256 ($y^2 \equiv x^3 - 3x + b \pmod p$) para `p256dh`, longitud exacta de 16 bytes para `auth`, y URL `https://` pública sin credenciales, fragmentos ni hosts locales/privados/literales IP contra SSRF.
  - Expone únicamente las 4 RPCs owner-only del contrato B0 §6 (`upsert_my_push_subscription`, `get_my_push_settings`, `disable_my_push_subscription`, `set_my_push_previews`) con `SECURITY DEFINER`, `SET search_path = ''`, verificación de `auth.uid()` y aislamiento `read committed` en escrituras. `get_my_push_settings()` devuelve exclusivamente `{ show_previews, subscriptions: [{ id, created_at, updated_at, disabled_at }] }`.
- **Service Worker (`vite.config.ts` y `src/sw.ts`):**
  - Migra `VitePWA` de `generateSW` a `strategies: 'injectManifest'` (`srcDir: 'src'`, `filename: 'sw.ts'`, `registerType: 'autoUpdate'`), preservando `skipWaiting()`, `clientsClaim()`, `precacheAndRoute(self.__WB_MANIFEST)`, `cleanupOutdatedCaches()` y `NavigationRoute(createHandlerBoundToURL('index.html'))` sin cachear jamás `*.supabase.co` ni tiles de Mapbox.
  - Valida en build el formato de `VITE_VAPID_PUBLIC_KEY` cuando está presente en el entorno.
  - Implementa `push` (sanitiza `PushWireV1`, elimina HTML/URLs/caracteres de control, trunca título a 80 y cuerpo a 120 caracteres, aplica `tag: notification_id` y restringe `target` a rutas internas permitidas), `notificationclick` (cierra aviso, envía `PLANIT_NOTIFICATION_CLICK` a ventana del mismo origen y navega a `/notifications` para revalidar sesión y RLS) y `message` (`PLANIT_CLEAR_NOTIFICATIONS` y `SKIP_WAITING`).
- **Cliente y UI aislada (`src/features/notifications/push.ts`, `PushSettings.tsx`, `push-settings.css`):**
  - Deriva `p_id` determinísticamente mediante `SHA-256("planit:push:v1:" + userId + ":" + endpoint)` formateado como UUID v4 canónico, permitiendo correlacionar `PushManager.getSubscription()` con `get_my_push_settings()` tras recargas o cambios de cuenta en navegador compartido sin usar `localStorage` ni exponer `endpoint` en `SELECT`.
  - Presenta estados claros en dirección visual **B · Amanecer**: inactivo (`default`), activo (`granted` + confirmado en BD), sincronización pendiente (`uncertain` cuando `PushManager.subscribe()` tiene éxito pero falla la RPC, con acciones explícitas de reintentar o cancelar suscripción local), permiso bloqueado (`denied`), navegador no compatible (`unsupported`), requerimiento de instalación en pantalla de inicio para iOS (`ios_install_required`) y falta de clave pública (`unconfigured`).
  - Respeta estrictamente la propiedad exclusiva de archivos: **no se modificaron** `src/App.tsx`, `src/pages/ProfilePage.tsx`, `src/pages/EventDetailPage.tsx`, `src/features/notifications/NotificationsProvider.tsx` ni `docs/implementation/RELEASE_7_STATUS.md` (reservados al Bloque 11).

---

## 2. Matriz de verificación por capa (`R7-B9-TC-01` .. `R7-B9-TC-04`)

| Caso / Capa | Estado | Evidencia y alcance real |
|---|---|---|
| **R7-B9-TC-01** · SQL local | **PASS** | Replay limpio desde cero de las **39 migraciones** en PostgreSQL 18.4 local aislado; alta multi-dispositivo, reintento idempotente, rotación de claves, rechazo de secuestro de `endpoint`/`id` entre cuentas (`42501`), conflicto mismo `id` con otro `endpoint` (`P0001`), validación criptográfica NIST P-256 y anti-SSRF (`22023`), aislamiento `read committed` (`40001`) y carreras concurrentes. Ver [`sql/sql-results.json`](sql/sql-results.json) e [`sql/inventory.json`](sql/inventory.json). |
| **R7-B9-TC-01** · SW / Bundle local | **PASS** | `npm run build` genera `dist/sw.js` (`injectManifest`, 86 entradas precacheadas) y `dist/registerSW.js`. Edge headless verifica registro activo de `/sw.js`, recarga offline del app shell, ausencia total de entradas `supabase.co` en Cache Storage y ejecución de `push`, `notificationclick` y `PLANIT_CLEAR_NOTIFICATIONS`. Ver [`sw-results.json`](sw-results.json). |
| **R7-B9-TC-01** · UI local (Edge headless) | **PASS** | `PushSettings` no solicita permiso al montar; solicita `Notification.requestPermission()` + `PushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` sólo tras clic explícito; maneja fallo de RPC mostrando estado `Sincronización pendiente` (nunca activo falso) y recupera al reintentar; aísla cambio de sesión Usuario A → Usuario B en el mismo navegador. Ver [`ui-results.json`](ui-results.json). |
| **R7-B9-TC-02** · SQL + UI local | **PASS** | `set_my_push_previews(false/true)` persiste en `public.push_preferences` sin ser sobrescrito por posteriores `upsert_my_push_subscription`; `get_my_push_settings()` jamás expone `endpoint`, `p256dh` ni `auth`; switch accesible por teclado (`Space`) con aviso explícito de privacidad en pantalla bloqueada. |
| **R7-B9-TC-03** · SQL + UI local | **PASS** | `disable_my_push_subscription(p_id)` marca `disabled_at` de forma idempotente sin afectar otros dispositivos activos de la misma cuenta, y el cliente ejecuta `PushSubscription.unsubscribe()`. La bandeja in-app permanece intacta. |
| **R7-B9-TC-04** · Dispositivos físicos (Android / iOS PWA instalada) | **NOT RUN** | Requiere el dispatcher de envío Web Push del **Bloque 10** (`send-push-notification`), secretos VAPID configurados en Supabase (`iepeqmvzjguwlhnecsdq`), migración aplicada en remoto y prueba manual en dispositivos físicos Android (Chrome) e iOS 16.4+ (PWA instalada en pantalla de inicio). |
| **Responsividad y accesibilidad UI** | **PASS** | Verificado en Edge headless en `320×844`, `375×844`, `390×844`, `768×844` y `1280×844` px más zoom de texto al `200%` (`320px` y `1280px`) sin desborde horizontal, con áreas táctiles $\ge 48\text{ px}$ y capturas en [`screenshots/`](screenshots/). |
| **Build / Lint / Regresión local** | **PASS** | `npm run build` PASS, `npm run lint` PASS (0 errores, 0 warnings en archivos de B9), `npm run check:amanecer` PASS, regresión SQL de bandeja interna (`get_notifications`, `get_notification_changes`, `mark_notification_read`) PASS en `scripts/check-r7-push-subscriptions.mjs`. |

---

## 3. Seguimiento de migraciones de Base de Datos

| Migración | Creada | SQL local (39 migraciones desde cero) | Aplicada en remoto (`planit-v2`) | Verificada en remoto |
|---|---|---|---|---|
| `20261016142017_r7_push_subscriptions.sql` | Sí | **PASS** (`scripts/check-r7-push-subscriptions.mjs`) | **No** (requiere autorización explícita) | **NOT RUN** |
