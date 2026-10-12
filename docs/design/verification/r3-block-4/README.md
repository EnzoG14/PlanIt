# R3 Bloque 4 — Asistentes y remoción

Implementado; QA y aceptación humana pendientes. Evidencia del 12/10/2026 (Argentina), rama `codex/r3-block-4`, base `origin/main` `8e1537d` (Bloque 3 integrado). No se aplicó la migración nueva en remoto, no se fusionó ni desplegó frontend.

## Contrato y decisiones

- Ruta autenticada `/events/:id/attendees`, entrada desde detalle propio y menú Organizo. Regreso al detalle conserva origen Inicio/Mapa o sección/filtro de Mis eventos mediante destinos internos validados.
- Confirmados como vista inicial; Removidos separado. Nombre y username, avatar de iniciales. Sin email, demografía, bio, navegación social R5, Solicitudes de bloque 6, CSV o notificaciones nuevas.
- **Decisión confirmada por el usuario:** remoción sólo antes y durante eventos vigentes. Finalizados, cancelados y archivados conservan lista de sólo lectura. La RPC verifica el estado con reloj servidor de Argentina después del lock.
- Nueva migración `20261012031717_manage_event_attendees.sql`, creada con CLI y probada mediante replay completo en PostgreSQL 17.5 local. **Sólo en Git; aplicación remota pendiente de autorización.** Las catorce migraciones previas existen en planit-v2; la auditoría de catálogos confirmó ausencia de las dos RPC del bloque.
- `get_event_attendees(uuid,text,text,integer)` devuelve JSON con `title`, `capacity`, `event_state`, `confirmed_count`, `removed_count`, `has_more` y `attendees`. Cada fila tiene sólo `participation_id`, `user_id`, `status`, `display_name`, `username`. Verifica propietario incluso si no hay filas. Estado confirmed/removed; búsqueda literal por nombre, case-insensitive y sin comodines, máximo 120 caracteres; offset no negativo. Orden lower(display_name)/participation_id, página 30 + lookahead. Metadatos y filas provienen de la misma instantánea SQL; contadores no dependen de búsqueda/página.
- `remove_participant(uuid,uuid)` no acepta identidad de organizador: deriva `auth.uid()`, verifica propiedad/evento/participación y READ COMMITTED; locks evento→participación. Sólo confirmed pasa a removed. Reintento removed en evento vigente es no-op; cancelled/inexistente/otro evento se rechazan. Trigger existente registra una sola transición, actor y `organizer_removal`; fallo de historial revierte toda la operación. Sin DELETE ni contador duplicado.
- SECURITY DEFINER justificado para proyección mínima bajo RLS propia y actualización transaccional sin UPDATE genérico; search_path vacío, referencias calificadas, revocación PUBLIC/anon y EXECUTE authenticated. No se amplían políticas de profiles/participaciones/historial/chat ni permisos directos.
- Cancelar/Escape no invocan mutación. Modal nativo con ciclo de foco explícito, Cancelar inicial, cierre bloqueado durante envío, doble envío bloqueado y foco restaurado al control inicial o Actualizar. Tras éxito/error se reconsulta; respuesta perdida no produce éxito ficticio ni reenvío automático. Carga adicional fallida conserva filas y reintenta mismo offset; cuenta/evento/búsqueda nuevos descartan respuestas anteriores.
- Chat conserva su autorización R2: dueño o confirmed. Remoción revoca posteriores RPC y lecturas directas sujetas a RLS. Envío comparte locks con remoción. Pantalla abierta revalida al actualizar/volver y cada 30 segundos mientras sea visible; denegación vacía historial, detiene canal y elimina composer. No se promete revocación instantánea de información ya recibida.

## Matriz de los ocho CA

| CA | Caso ejecutado | Evidencia | Resultado y límite |
| --- | --- | --- | --- |
| R3-05.CA-01 | Entrada desde detalle/Organizo y lista inicial confirmed | UI: navegación/lista; SQL: proyección autorizada | PASS local/fixture; aceptación pendiente |
| R3-05.CA-02 | Aislamiento por evento y sólo cinco campos sociales/operacionales | SQL: permisos/proyección/búsqueda; UI: identidad | PASS local/fixture; no HTTP/JWT real |
| R3-05.CA-03 | Actualizar refleja alta/baja, contadores y filtro; búsqueda/paginación | UI: external registration/removal; SQL: conteos | PASS local/fixture |
| R3-05.CA-04 | B/tercero/anon/identidad ausente y ruta directa denegados; RLS no expone nómina | SQL: owner-only projection; UI: foreign/direct routes | PASS local/fixture; no HTTP/JWT real |
| R3-06.CA-01 | Menú sólo confirmed en evento vigente, selección ligada al evento | SQL: vinculación/estado; UI: modal | PASS local/fixture |
| R3-06.CA-02 | Cancelar/Escape no cambian datos; teclado y doble clic | UI: cancel/confirm/focus | PASS fixture |
| R3-06.CA-03 | confirmed→removed, historial único, actor/razón, rollback, cupo y chat | SQL: removal/rollback/races; UI: reconcilia/respuesta perdida/chat | PASS PostgreSQL real local/fixture; Realtime remoto pendiente |
| R3-06.CA-04 | RPC ajena y mutación directa sin permiso, participación de otro evento rechazada | SQL: owner/REST-equivalent denied | PASS SQL local; REST/JWT real pendiente |

## Pruebas reproducibles

- `npm run build`: PASS; aviso preexistente de tamaño de chunk Mapbox. `npm run lint`: PASS sin advertencias. `git diff --check`: PASS.
- `npm run check:attendees`: siete grupos PASS. PostgreSQL 17.5 real aislado, roles authenticated/anon y Auth/Storage simulados en SQL; replay de todas las migraciones. Carreras con conexiones independientes y comprobación de espera real: dos remociones, retiro en ambos órdenes, inscripción a la última plaza liberada y envío de chat antes/después de remoción. [Resultados SQL](postgres-results.json).
- `npm run check:attendees:ui`: 60 grupos PASS (12 por viewport), Edge headless en 360×800, 375×812, 390×844, 768×1024, 1280×900; zona Asia/Tokyo. Auth/REST fixtures, WebSocket bloqueado. Incluye paginación fallida/reintento, búsqueda tardía, cancelación, teclado, doble clic, fallo/commit con respuesta perdida, altas/bajas externas, históricos, RPC ausente, rutas ajenas/anon, logout y reloj virtual para revalidar chat a 30 segundos. [Resultados UI](ui-results.json).
- Regresión SQL PASS: participación (doce grupos, diez carreras reales de última plaza), chat (nueve grupos), Mis eventos (seis grupos) y edición (siete grupos). Resultados copiados en este bloque: [participación](regression-participations-postgres.json), [chat](regression-chat-postgres.json), [Mis eventos](regression-my-events-postgres.json), [edición](regression-edit-event-postgres.json).
- Regresión UI PASS: [chat](regression-chat-ui.json), [Mis eventos](regression-my-events-ui.json) y [edición](regression-edit-event-ui.json). `npm run check:realtime` PASS: coalescencia, recuperación, deduplicación y limpieza simuladas. Estas ejecuciones no representan conexiones Realtime reales.
- Para reproducir se requiere el runtime existente `.participation-test-tools.local/node_modules` (pg/embedded-postgres Windows) y Playwright/Edge; `PLANIT_PLAYWRIGHT_PATH` permite indicar su ruta. Servir con `npm run dev -- --host 127.0.0.1 --port 4186`; `PLANIT_UI_ORIGIN` permite otro origen. No se agregaron dependencias de producción.
- [Auditoría remota](remote-metadata.json): sólo SELECT de catálogos e historial de migraciones en `iepeqmvzjguwlhnecsdq`, sin datos privados, mutaciones de negocio ni configuración. No se tocó el proyecto histórico.

## Comparación visual

Se abrieron los originales `04-asistentes.png`, `07-estados-dialogos.png` y el collage `release-3.png`. Capturas nuevas comparadas visualmente: fondos marino, CTA azul/violeta, chips y filas oscuras con bordes, avatares circulares, estados verde/rojo y diálogo de peligro con Cancelar/Remover.

| Tamaño | Confirmados | Diálogo | Removidos | Chat denegado |
| --- | --- | --- | --- | --- |
| 360×800 | [captura](confirmed-360.png) | [captura](dialog-360.png) | [captura](removed-360.png) | [captura](chat-denied-360.png) |
| 375×812 | [captura](confirmed-375.png) | [captura](dialog-375.png) | [captura](removed-375.png) | [captura](chat-denied-375.png) |
| 390×844 | [captura](confirmed-390.png) | [captura](dialog-390.png) | [captura](removed-390.png) | [captura](chat-denied-390.png) |
| 768×1024 | [captura](confirmed-768.png) | [captura](dialog-768.png) | [captura](removed-768.png) | [captura](chat-denied-768.png) |
| 1280×900 | [captura](confirmed-1280.png) | [captura](dialog-1280.png) | [captura](removed-1280.png) | [captura](chat-denied-1280.png) |

Adaptaciones: shell vigente y navegación de cuatro secciones, avatares de iniciales y username por privacidad, título del evento y Actualizar operacionales; badge en segunda línea móvil para mantener controles táctiles de 44 px e identidad legible. Sin marco de teléfono, decoraciones del póster ni Solicitudes futuras. Los nombres/contadores son fixtures, no datos ni fotografías extraídos del mockup. No se observó overflow horizontal.

## Pendientes

Aplicación autorizada de la migración en planit-v2, HTTP/Auth/REST/Realtime con cuentas A/B reales, dispositivo físico/safe-area y aceptación humana. Los ocho CA tienen evidencia local/fixture; ninguno se marca «Validado». Bloques 5/6 y QA integral continúan pendientes.
