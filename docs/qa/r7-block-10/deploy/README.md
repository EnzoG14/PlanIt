# B10 — Configuración VAPID, deploy y prueba desde Perfil

16/10/2026, Argentina. Autorización posterior del responsable: ejecutar los pasos explicados de generación/respaldo, secrets, deploy y preparación de UI. Se mantiene el alcance de esta ampliación: ajustes Push y comprobación manual; no constituye B11 completo ni autoriza cron o merge.

## Claves guardadas

- Archivo de entorno servidor persistente fuera del repositorio/worktree: `C:/Users/enzog/.planit-secrets/planit-v2/web-push.env.local`.
- Respaldo cifrado DPAPI: `web-push.env.dpapi`, en la misma carpeta. Se verificó descifrado y comparación exacta sin imprimir valores. El cifrado está ligado al usuario de Windows; para recuperación en otra computadora, conservar una copia externa segura del archivo servidor.
- Carpeta sin herencia ACL, accesible sólo al usuario actual `ENZO/enzog` y SYSTEM. Las claves no se versionan ni se guardan en los artefactos de QA.
- Par VAPID P-256 y token aleatorio de 32 bytes, guardados una sola vez. Clave pública configurada en `.env.local` ignorados de main y del worktree B10. La privada y el token no están en `VITE_*` ni en el bundle.
- Subject: `https://iepeqmvzjguwlhnecsdq.supabase.co`, URL HTTPS real del emisor; no se inventó un correo de contacto.

No regenerar el par en cada deploy. La rotación de VAPID obliga a renovar las suscripciones del navegador; rotar el token de invocación exige actualizar las herramientas servidor que lo usan.

## Operación ejecutada

`supabase secrets set --project-ref iepeqmvzjguwlhnecsdq --env-file <archivo-servidor>` configuró exactamente cuatro secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_WORKER_TOKEN`. Supabase suministra URL y service key en runtime.

`supabase functions deploy r7-push --project-ref iepeqmvzjguwlhnecsdq --no-verify-jwt --use-api` desplegó únicamente este worker, estado ACTIVE, autenticación dedicada en handler. Versión inicial 1; versión final **2**, bundle `4de4d54040644e1327ca335bebc14a5205a60efdf28d217c1dd78a599e86437e`.

[HTTP real](http-results.json): GET→405; POST anónimo→401; token incorrecto→401; token dedicado correcto→200, sin errores de infraestructura. El batch inicial reclamó y aceptó **cero** trabajos. Esto acredita configuración/invocación real de Edge y acceso backend, no aceptación por un proveedor ni recepción en el SO.

Sin cron, sin cambios de Vault, sin publicar frontend en hosting y sin merge. La migración sigue aplicada/verificada según el acta remota anterior.

## UI y prueba manual

Se conectó el componente `PushSettings` existente al final de `/me` con un margen de los tokens actuales, sin modificar su lógica, el SW ni el diseño. Esta integración estaba originalmente reservada a B11 y se adelantó únicamente por el pedido explícito de ejecutar el circuito explicado. El resto de B11 permanece pendiente.

Build con la clave pública: PASS. Lint sin errores, advertencias previas fuera del cambio; lint dirigido limpio. [Cinco tamaños de Perfil](ui/results.json), 320/375/390/768/1280: sin overflow, preferencias editables, cero pedidos automáticos de permiso y rechazo de permiso tras gesto explícito. Auth/RPC/permiso de estas pruebas son fixtures. Capturas antes/después incluidas, con movimiento reducido en la confirmación final. [SW posterior al nuevo build](sw/sw-results.json): cuatro casos PASS de registro, caché, offline y push/clic sintéticos.

Servidor local de preview: `http://127.0.0.1:4187/me`, iniciado desde el worktree B10. Para reiniciarlo:

```powershell
cd C:/Users/enzog/planit-worktrees/r7-block-10
npm run preview -- --host 127.0.0.1 --port 4187 --strictPort
```

1. Iniciar sesión y abrir **Mi perfil → Notificaciones Web Push**.
2. Activar Push mediante el botón y conceder el permiso del navegador. En móvil usar HTTPS; iOS requiere instalación compatible. La dirección HTTP local sólo sirve como contexto seguro en la misma computadora.
3. Generar un DM nuevo hacia esa cuenta desde otra cuenta de prueba; el emisor no recibe el Push del destinatario. La suscripción debe existir antes del aviso. La prueba posterior envió únicamente un DM desde una cuenta técnica a la cuenta suscrita confirmada por el responsable.
4. Invocar manualmente el worker desde el worktree:

```powershell
node --env-file=C:/Users/enzog/.planit-secrets/planit-v2/web-push.env.local scripts/run-r7-push.mjs
```

5. Separar `accepted > 0` del proveedor y notificación efectivamente mostrada. Probar también preview oculta, baja individual y clic seguro. Sin cron, repetir la invocación para avisos nuevos o retries vencidos; los jobs expiran a los 15 minutos.

## Recepción real confirmada

El responsable activó Push y confirmó la suscripción en esta conversación. Se verificó una sola cuenta suscrita. Se creó por Auth Admin una cuenta técnica **PlanIt - prueba Push**, con correo sintético confirmado sin enviar correo. Sus credenciales aleatorias quedan en `push-test-account.json` en la carpeta privada con ACL restringida. Service_role se usó sólo en memoria; no se guardó en código, frontend ni evidencia.

Se invocaron las RPC reales de conversación/DM con el JWT de esa cuenta técnica. Primer intento: rechazo seguro `invalid_delivery` para `jmt17.google.com`. El [código oficial de Chromium](https://chromium.googlesource.com/chromium/src/+/refs/tags/148.0.7734.4/components/push_messaging/push_messaging_constants.cc) identifica `https://jmt17.google.com/fcm/send/` como endpoint de staging. La revisión automática bloqueó inicialmente el redeploy por ampliar la frontera de red. El responsable autorizó expresamente **«Autorizar ese endpoint y redesplegar»**.

La versión 2 admite sólo ese host y prefijo de ruta adicionales; tests negativos rechazan otros paths y hosts parecidos. No hay wildcard de Google ni redirects. Se reencoló sólo el job técnico fallido, condicionado por ID, estado, código, intentos, TTL y suscripción activa; no se modificaron migraciones aplicadas ni se creó otro aviso.

Resultado: **un DM, una fila interna, un job sent, dos intentos totales y un envío aceptado por el proveedor**. El responsable confirmó **«Sí, apareció»** ante la pregunta de recepción real. [Evidencia final](live-dm-results.json) y [fallo inicial preservado](live-dm-initial-results.json). Esto acredita mostrado en el navegador/dispositivo de esta prueba, no leído en la app ni todos los escenarios Android/iOS. La inspección visual automatizada usó Edge headless aislado; la recepción real se acredita por confirmación humana.
