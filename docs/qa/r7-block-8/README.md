# B8 · Reproducción y contrato de integración

## API para B11

`EventShareAction({ event, canManageInvite, inviteUrl? })`, exportado desde `src/features/events/EventShareAction.tsx`.

`event: EventShareEvent` coincide con el DTO de integración B0: id, title, starts_at, ends_at, location_name, address, visibility y state. B11 lo construye por allowlist desde detalle autorizado. No pasar el EventRecord completo ni estructuras de asistentes/chat. De esos campos, el payload externo sólo usa título/fecha/URL.

`canManageInvite` se deriva de la identidad autenticada del organizador; no es autorización servidor. `inviteUrl` es una prop opcional efímera entregada una sola vez por el diálogo R4. No se consulta/recupera desde DB. B11 debe situar la acción dentro del ciclo de vida de ese diálogo o hacer un traspaso en memoria que se limpie al cerrar, regenerar, cambiar cuenta o evento. El componente actual R4 no tiene callback de entrega: ese wiring pertenece a B11, no está implementado por B8.

Montar bajo el shell Amanecer existente y remontar por sesión, igual que el detalle. Los cambios de id/título/fecha/visibilidad/estado/permiso/invitación reinician estado local. No se agregan rutas productivas.

`buildEventSharePayload(event, { origin, baseUrl, canManageInvite, inviteUrl? })` es síncrono y no hace I/O. Acepta origin HTTPS público y BASE_URL como ruta absoluta terminada en slash (segmentos alfanuméricos, guion o guion bajo). Rechaza localhost, IP locales/inseguras, credenciales, query/hash y rutas internas en el origin. Para ocultos exige state=open y URL del mismo origin/ruta invite con fragmento R4 de 64 hex; el servidor comprueba actividad al canjear.

`shareEvent(payload, platform)` devuelve shared/cancelled/copied/manual/error. `copyEventLink` ofrece copia explícita tras error de Share. Shared sólo significa que la API resolvió, nunca que otro destinatario recibió el evento. AbortError es neutral. Fallo/ausencia de clipboard muestra input readOnly seleccionado; no usa execCommand ni solicitudes de permisos anticipadas.

## Comandos

Requiere Node 24 con soporte TypeScript nativo, dependencias del lockfile y Edge. Desde el worktree:

```powershell
npm ci --ignore-scripts
node scripts/check-r7-share.mjs
node scripts/check-r7-share-ui.mjs
npm run build
npm run lint
```

El script UI usa Playwright del runtime Codex. En otro equipo definir PLANIT_PLAYWRIGHT_PATH al archivo index.mjs de una instalación existente. No es dependencia nueva de la aplicación. Levanta y cierra Vite/Edge propios, sirve únicamente el fixture scripts/fixtures/r7-share.html y no necesita sesiones/BD. El hostname planit.example.org es sintético e interceptado a Vite local; no es un dominio productivo.

Regresiones existentes, con herramientas PostgreSQL locales ya disponibles:

```powershell
$env:PLANIT_TEST_TOOLS_DIR='D:/planit/.participation-test-tools.local/node_modules'
$env:PLANIT_UI_OUTPUT='docs/qa/r7-block-8/r4-links'
node scripts/check-event-links.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r7-block-8/r4-access'
node scripts/check-event-access.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r7-block-8/r4-invite'
node scripts/check-invite.mjs
```

Son bases efímeras propias, no el Supabase local compartido ni remoto. Las etiquetas históricas base/redemption del runner links se conservan tal como las genera; la base de esta ejecución está en STATUS.md y la evidencia de canje actual está en r4-invite. Ningún mock acredita HTTP/JWT real.

## Prueba manual pendiente

En un despliegue HTTPS real, con público visible y oculto del organizador:

1. Abrir selector desde gesto, cancelar y comprobar que conserva vista/retorno sin éxito.
2. Abrir una app externa y revisar sólo título, fecha y URL; no afirmar recepción.
3. Desktop sin Share: copiar y abrir el enlace público en otra sesión; denegar clipboard y copiar campo manual.
4. Owner con invitación en memoria: compartir; al cerrar perderla y exigir generación explícita. Tercero con grant/confirmed no puede compartir token.
5. Rotar enlace y verificar que la URL anterior no concede acceso nuevo; revocado no recupera acceso al recibir otro token.
6. Probar móvil físico, escritorio, teclado, lector de pantalla y zoom real.

Registrar ambiente y resultados sin tokens reales, cuerpos RPC ni credenciales. [Estado y límites](STATUS.md).
