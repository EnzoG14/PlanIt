# Release 7 · Bloque 9 — Web Push Subscriptions & Service Worker (`injectManifest`)

Guía operativa, contrato de integración para B10/B11 y suites de verificación de **R7 Bloque 9**.

---

## 1. Configuración de claves VAPID (sin exponer secretos)

El bloque B9 consume **únicamente** la clave pública VAPID (`VITE_VAPID_PUBLIC_KEY`) en el navegador para invocar `PushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.

> **Regla de seguridad obligatoria:**
> - **Nunca** incluir `VAPID_PRIVATE_KEY` ni `service_role` en `.env.local` con prefijo `VITE_*`, en el repositorio ni en el código cliente.
> - La clave pública debe ser un punto descomprimido NIST P-256 de 65 bytes (`0x04 || X || Y`) codificado en `base64url` sin relleno `=` (87 caracteres).

### Generación local de un par VAPID (Node.js)

Para generar un par de claves efímero o de entorno en la terminal sin instalar dependencias externas:

```powershell
node -e '
const { generateKeyPairSync } = require("node:crypto");
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pubJwk = publicKey.export({ format: "jwk" });
const privJwk = privateKey.export({ format: "jwk" });
const pubBytes = Buffer.concat([Buffer.from([0x04]), Buffer.from(pubJwk.x, "base64url"), Buffer.from(pubJwk.y, "base64url")]);
console.log("VITE_VAPID_PUBLIC_KEY=" + pubBytes.toString("base64url"));
console.log("VAPID_PRIVATE_KEY=" + privJwk.d);
'
```

### Variables de entorno

1. **Cliente PWA (`.env.local`, ignorado por Git):**
   ```dotenv
   VITE_VAPID_PUBLIC_KEY=<clave_publica_base64url_65_bytes>
   ```
2. **Edge Functions / B10 (`supabase secrets`, nunca en el repo):**
   ```powershell
   npx supabase secrets set --project-ref iepeqmvzjguwlhnecsdq `
     VAPID_PUBLIC_KEY="<clave_publica_base64url_65_bytes>" `
     VAPID_PRIVATE_KEY="<clave_privada_base64url_32_bytes>" `
     VAPID_SUBJECT="mailto:soporte@planit.example.com"
   ```

---

## 2. Integración preparada para Bloque 11 (`B11`)

Siguiendo la propiedad exclusiva de archivos de `docs/implementation/RELEASE_7_PARALLEL_WORK.md`, B9 entrega los módulos desacoplados listos para que B11 los conecte en las páginas compartidas:

1. **Componente de ajustes Push (`src/features/notifications/PushSettings.tsx`):**
   ```tsx
   import { PushSettings } from '../features/notifications/PushSettings'

   // Dentro de ProfilePage o NotificationsPage cuando existe sesión autenticada:
   <PushSettings userId={user.id} />
   ```
2. **Limpieza de notificaciones del sistema y navegación al hacer clic (`src/features/notifications/push.ts`):**
   - `clearDeliveredPushNotifications({ recipientId: user.id, notificationIds: [id] })`: envía `PLANIT_CLEAR_NOTIFICATIONS` al Service Worker activo al marcar como leída una notificación o al cerrar sesión.
   - `subscribeToPushNotificationClicks(payload => { ... })`: escucha el mensaje `PLANIT_NOTIFICATION_CLICK` emitido por `src/sw.ts` cuando el usuario toca una notificación con la app abierta.

---

## 3. Ejecución de pruebas automatizadas del Bloque 9

```powershell
# 1. Compilación TypeScript + Vite PWA injectManifest (genera dist/sw.js y dist/registerSW.js)
npm run build
npm run lint

# 2. Replay de las 39 migraciones en PostgreSQL real + pruebas RPC, RLS, P-256, SSRF y concurrencia
node scripts/check-r7-push-subscriptions.mjs

# 3. Verificación en Edge headless del Service Worker (precache, offline, push, notificationclick, clear)
node scripts/check-r7-push-subscriptions-sw.mjs

# 4. Verificación en Edge headless de PushSettings UI (estados, accesibilidad, 320/375/390/768/1280px y zoom 200%)
node scripts/check-r7-push-subscriptions-ui.mjs
```
