# Realtime R2 — implementación y verificación

Fecha: 11/10/2026, Argentina. Rama codex/r2-realtime-chat-notifications, base origin/main en 5a3aed5. [PR #14](https://github.com/EnzoG14/PlanIt/pull/14), Draft hacia main, sin merge. Commit de implementación efe80f0. Worktree independiente en C:/Users/enzog/planit-worktrees/r2-realtime. Cambio local previo de vite.config.ts en D:/planit preservado. No se modificó ninguna configuración ni se ejecutó SQL remoto.

## Solución y archivos

| Área | Archivos | Comportamiento |
| --- | --- | --- |
| Transporte | src/lib/realtime.ts | Filtros específicos, SUBSCRIBED/ERROR/TIMED_OUT/CLOSED, SDK rejoin y recreación CLOSED, cleanup, foco/visibilidad/online/refresh JWT |
| Reconciliación | src/lib/reconciliation.ts | Debounce, exclusión de lecturas simultáneas, invalidación retenida en vuelo, UUID, microsegundos/orden, recuperación keyset multipágina |
| Chat | src/pages/EventChatPage.tsx | Canal por cuenta/conversación autorizada; RPC existente; historial anterior y scroll anclado; no se vacía textarea; envío idempotente existente |
| Avisos | src/features/notifications/NotificationsProvider.tsx, realtime-context.ts, api.ts; src/pages/NotificationsPage.tsx | Un canal por cuenta en layout; lotes de IDs y revalidación de páginas cargadas; lecturas confirmadas/destinos frente a respuestas antiguas |
| Campana | src/components/AppLayout.tsx, src/App.css | COUNT HEAD exacto con RLS; badge 1–99/99+, aria-label con total real, no badge al cero/desconocido |
| SQL | supabase/migrations/20261011193316_r2_realtime_chat_notifications.sql | Publicación idempotente, RPC invoker de lotes de hasta 100 IDs, índice parcial de no leídas; **pendiente remoto** |
| Tests | scripts/check-realtime.mjs, check-realtime-ui.mjs, check-chat.mjs, check-chat-ui.mjs, check-notifications.mjs, check-notifications-ui.mjs; package.json | Unidades/lifecycle simulados, React/SDK con fixtures HTTP/WS, SQL local y regresiones |
| Docs/evidencia | docs/architecture.md, docs/database.md, docs/implementation/RELEASE_2_STATUS.md; verification/event-chat, notifications y realtime | Decisiones, matrices, resultados y capturas actualizados |

No se modifica send_event_chat_message/get_event_chat_messages/get_notifications/mark_notification_read/get_notification_target ni se amplían políticas/grants de tablas. PostgreSQL continúa siendo la fuente de verdad. Los IDs/fechas del payload sirven como señales/pistas; nombres, contenido social, estado y destinos se recuperan autorizadamente.

## Seguridad

messages SELECT existente depende de conversations SELECT y can_read_event_chat: organizador o confirmed actual. Conocer el conversation_id no concede SELECT. Las pruebas PostgreSQL verifican A/B/stranger/anon/cancelled/removed, mutaciones directas rechazadas y cierre transaccional. notifications SELECT/UPDATE exige recipient_id=auth.uid(); INSERT/DELETE y actualización de contenido/identidad siguen denegados. get_notification_changes es invoker, search_path vacío, destinatario derivado de Auth, EXECUTE sólo authenticated y proyección sin actor/perfiles privados. Un aviso nunca concede autorización adicional a su destino.

Según [Postgres Changes oficial](https://supabase.com/docs/guides/realtime/postgres-changes), Supabase autoriza los cambios contra RLS por suscriptor. La migración conserva exactamente esas políticas y grants probados localmente. Esto verifica el contrato de acceso que utilizará Realtime, **no prueba que el servicio remoto esté entregando o denegando eventos**. No se ejecutó SQL remoto para consultar pg_publication_tables porque el pedido lo reserva para autorización expresa. El Dashboard/publicación remota deben comprobarse antes de activar. No se usa service_role ni nuevas credenciales o dependencias de producción.

No hace falta REPLICA IDENTITY FULL: sólo se usan INSERT/UPDATE y la nueva fila, sin eventos DELETE ni old. No se modifica el esquema interno realtime, respetando [el cambio oficial que lo bloquea](https://supabase.com/changelog/realtime-schema-locked-down-against-modification). La sesión Supabase actualiza el JWT del transporte; refresh provoca una lectura fuera del lock de Auth. La identidad remonta layout/páginas y cada efecto descarta callbacks/respuestas de generaciones previas.

## Pruebas ejecutadas

| Comando | Resultado | Alcance |
| --- | --- | --- |
| npm ci | PASS, 0 vulnerabilidades | Dependencias versionadas existentes |
| npm run build / npm run lint / git diff --check | PASS | TypeScript, bundle/PWA, lint y whitespace |
| npm run check:realtime | PASS | Simulado: ráfagas, consulta pendiente, recuperación después de error, disposal, orden microsegundos/UUID, más de seis páginas, todos los estados/callbacks obsoletos/JWT/foco/online |
| npm run check:realtime:ui | PASS | React StrictMode + SDK real con HTTP/WebSocket Phoenix interceptados: dos usuarios, eco, ráfagas, consulta pendiente, 120 mensajes perdidos, paginación/scroll/textarea, canales únicos, cambio evento/cuenta, lectura entre pestañas, badge fuera de bandeja y logout |
| node scripts/check-chat.mjs | PASS | PostgreSQL 17 local, todas las migraciones, RLS A/B/outsider/anon/removido, UUID idempotente/concurrencia, cierre y publicación idempotente |
| node scripts/check-notifications.mjs | PASS | PostgreSQL 17 local, RLS propia, lotes cruzados negados, anon/101 IDs denegados, COUNT 35 superior a página 30, lectura/reintentos, destinos y migración reaplicada |
| node scripts/check-chat-ui.mjs / node scripts/check-notifications-ui.mjs | PASS | Edge, fixtures HTTP, móvil 375×812 y escritorio 1280×900, reintentos, teclado, ausencia/error, paginación y respuesta A pendiente al cambiar a B |
| npm run check:auth / check:events / check:foundation | PASS | Validación Auth/evento/config/PWA local, sin --live/--signup |
| npm run check:participations / check:my-events / check:home-events | PASS | PostgreSQL local; R1 cupos con 10 carreras reales y R2 consultas autorizadas |
| npm run check:discovery | PASS | PGlite local, filtros y RLS |

Resultados React/WS: [ui-results.json](ui-results.json). SQL y regresiones UI: [chat](../event-chat/README.md), [avisos](../notifications/README.md). Capturas: [chat móvil](chat-mobile.png), [chat escritorio](chat-desktop.png), [avisos móvil](notifications-mobile.png), [avisos escritorio](notifications-desktop.png). Se revisaron contra los teléfonos 3/5 de release-2.png: marino/azul/violeta, composer y filas existentes preservados; badge discreto, teclado/aria, sin overflow en los dos viewports. Teclado físico/safe areas requieren validación humana.

Los primeros intentos de algunas regresiones carecían de herramientas ignoradas en el worktree; se copiaron desde el checkout original y se ejecutaron con éxito. Se ajustaron esperas de fixtures al debounce y su proyección/headers CORS para el COUNT. No hubo creación de cuentas, fixtures permanentes ni pruebas de SQL/Auth/WS remoto.

Reproducción local: npm ci; herramientas SQL ignoradas pg + embedded-postgres según scripts existentes; PLANIT_PLAYWRIGHT_PATH al runtime disponible; Vite en 4191 con URL planit-v2 y **clave ficticia** sb_publishable_fixture. PLANIT_UI_ORIGIN=http://127.0.0.1:4191. Los scripts de navegador interceptan HTTP/WebSocket; no deben confundirse con conexión real.

## Matriz manual pendiente — requiere autorización de despliegue

1. Revisar publicación actual en planit-v2 (iepeqmvzjguwlhnecsdq) y grants/RLS; tras permiso explícito aplicar 20261011193316_r2_realtime_chat_notifications.sql, revisar historial/advisors. Nunca utilizar el proyecto histórico. No hay cambios remotos extra obligatorios si la publicación y el servicio Realtime están disponibles.
2. Abrir A (organizador), B (confirmed) y C (no miembro) con JWT reales; anónimo en otro contexto. Suscribir C/anon directamente al conversation_id conocido y comprobar ausencia de payloads. A/B envían texto; ambas sesiones reciben por RPC sin refresco, eco una sola vez, texto/UUID persistidos y orden estable.
3. Paginar historial y scrollear arriba/abajo; enviar ráfagas mientras se lee, comprobar ancla y scroll al final. Navegar a otro evento y confirmar eliminación del canal anterior. Cambiar cuenta mientras hay una lectura pendiente; no deben sobrevivir mensajes ni texto anterior.
4. Cortar la conexión, persistir más de 50 mensajes desde otra sesión, restaurar y comprobar todos. Repetir con cambios de lectura offline, pestaña oculta, focus/online, token renovado/expirado y CLOSED/TIMED_OUT. No hay replay: las RPC deben recuperar el hueco.
5. Remover a B mediante una operación autorizada de prueba; verificar que RLS detiene SELECT/envío y futuras entregas. Al revalidar se limpian datos/canal. Probar ended/cancelled/archived y confirmar sólo lectura. La revocación sin una nueva señal no vacía instantáneamente una pantalla quieta: se detecta en la próxima revalidación.
6. Notificaciones: usar datos persistidos existentes o un entorno aislado con fixture temporal expresamente autorizado. R2 no produce avisos, y no se deben insertar fixtures permanentes en producción. Un INSERT propio aparece en dos pestañas; C/B no reciben avisos de A. READ desde una pestaña se refleja en la otra y disminuye COUNT, aun desde /me o /map. Probar más de 30 no leídas, cero, 99+ y estados de error.
7. Verificar ninguna escritura fraudulenta, destinos revalidados y recursos revocados, paginación durante ráfagas y cambio de cuenta. Smoke humano R1: registro/login, creación con foto, mapa, inscripción/retiro/cupo y Mis eventos. Confirmar visual móvil/escritorio, navegación teclado y dispositivo físico.

## Límites y decisiones

- **No se afirma funcionamiento remoto** ni aceptación final: publicación/migración pendiente, sesiones/JWT/WS reales sin verificar.
- Una revocación quieta y el cierre por reloj se detectan al revalidar; la autorización PostgreSQL de lecturas/envíos/entregas permanece vigente. No se añaden publicaciones de membresía, polling ni reglas nuevas.
- La recuperación revalida todas las páginas hasta el límite cargado; su costo crece con el historial abierto. Señales ordinarias de avisos usan lotes de IDs; COUNT es exacto e indexado. No hay store global de contenido, servidor WS ni sistema offline.
- Actualizar permanece como recuperación secundaria. El indicador oculta un total desconocido al fallar la consulta y vuelve a consultar con señales/foco/reconexión.
- Sólo sincronización de datos ya persistidos: sin R5/R6/R7, Push, emails, recordatorios, adjuntos, DM ni productores automáticos.

## Inventario completo de entrega

- docs/architecture.md
- docs/database.md
- docs/design/verification/event-chat/README.md
- docs/design/verification/event-chat/chat-desktop.png
- docs/design/verification/event-chat/chat-mobile.png
- docs/design/verification/event-chat/chat-read-only-desktop.png
- docs/design/verification/event-chat/chat-read-only-mobile.png
- docs/design/verification/event-chat/postgres-results.json
- docs/design/verification/notifications/README.md
- docs/design/verification/notifications/desktop-empty.png
- docs/design/verification/notifications/desktop-error.png
- docs/design/verification/notifications/desktop-inbox.png
- docs/design/verification/notifications/mobile-empty.png
- docs/design/verification/notifications/mobile-error.png
- docs/design/verification/notifications/mobile-inbox.png
- docs/design/verification/notifications/postgres-results.json
- docs/design/verification/realtime/README.md
- docs/design/verification/realtime/chat-desktop.png
- docs/design/verification/realtime/chat-mobile.png
- docs/design/verification/realtime/notifications-desktop.png
- docs/design/verification/realtime/notifications-mobile.png
- docs/design/verification/realtime/ui-results.json
- docs/implementation/RELEASE_2_STATUS.md
- package.json
- scripts/check-chat-ui.mjs
- scripts/check-chat.mjs
- scripts/check-notifications-ui.mjs
- scripts/check-notifications.mjs
- scripts/check-realtime-ui.mjs
- scripts/check-realtime.mjs
- src/App.css
- src/components/AppLayout.tsx
- src/features/notifications/NotificationsProvider.tsx
- src/features/notifications/api.ts
- src/features/notifications/realtime-context.ts
- src/lib/realtime.ts
- src/lib/reconciliation.ts
- src/pages/EventChatPage.tsx
- src/pages/NotificationsPage.tsx
- supabase/migrations/20261011193316_r2_realtime_chat_notifications.sql
