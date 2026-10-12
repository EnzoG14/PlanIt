# R3 Bloque 6 — Solicitudes de reincorporación

Implementado; QA y aceptación humana pendientes. [PR #24](https://github.com/EnzoG14/PlanIt/pull/24) en borrador. Rama `codex/r3-block-6`, base `origin/main` `dd4bb07` (PR #23 integrada). Evidencia del 12/10/2026, Argentina. Migración **aplicada y verificada en planit-v2 con autorización explícita posterior del usuario**. Cambio previo de `vite.config.ts` preservado y excluido de la PR.

## Contratos y decisiones

- `event_rejoin_requests` tiene ID, FK RESTRICT a participación, estado `pending/approved/rejected`, fecha solicitada/resuelta y revisor. UNIQUE parcial de una pendiente, CHECK de resolución/revisor y cronología. Sin columnas de motivo, mensaje ni datos personales redundantes. Fechas `timestamp without time zone`, Argentina.
- `get_my_rejoin_status(uuid) → jsonb`: solicitud más reciente, fechas, próximo momento elegible y `can_request` derivados del servidor; sólo estado de quien llama y con acceso efectivo al evento. Una participación histórica conserva acceso al detalle incluso unlisted; no se inventan accesos por enlace de R4.
- `get_event_rejoin_requests(uuid,integer) → jsonb`: dueño obligatorio, título/estado/cupo/confirmados/pendientes y páginas de 30 solicitudes, orden solicitado descendente/UUID descendente. Proyección `request_id/participation_id/status/requested_at/display_name/username`, sin emails, perfiles completos ni avatares privados.
- `request_rejoin(uuid) → uuid`: sólo removed, sin esperar desde remoción, una pendiente, cooldown tras último rechazo hasta `resolved_at + 7 days`. No necesita cupo para pedir; eventos cerrados no aceptan pedidos. Rechaza duplicados y no convierte participación en pending.
- `resolve_rejoin(uuid,uuid,text) → void`: decisión approved/rejected, dueño desde auth.uid(), pertenencia de solicitud al evento validada. READ COMMITTED, locks evento → participación → solicitud y reloj de Argentina después de esperar. Confirmados se cuentan tras el lock compartido con inscripción/edición/remoción/cierre. Sin cupo, error `event_full` y solicitud intacta; no reserva ni autoaprueba.
- Aprobar actualiza la misma participación y el trigger escribe exactamente un historial `removed → confirmed`, razón `rejoin_approval` y actor dueño. Rechazar conserva removed; la decisión, fecha y revisor quedan en la solicitud histórica sin fabricar un cambio de participación. Cualquier fallo revierte todo.
- **Excepción aprobada por el usuario:** rechazar sigue permitido después de finalizar/cancelar/archivar. La especificación técnica de Planificación dice «No resolver tras finalizar/cancelar/archivar»; esta decisión explícita permite cerrar pendientes, mientras pedidos y aprobaciones siguen bloqueados. No cambia requisitos locales ni el modelo remoto.
- `get_event_rejoin_resolution(uuid,uuid) → text` es una lectura adicional del dueño para reconciliar una respuesta perdida por ID exacto. No se infiere aprobación por ausencia en una página. Si la comprobación falla, se ofrece sólo Comprobar estado; cerrar y reabrir el diálogo conserva la obligación de comprobar antes de otra escritura.
- RLS propia y SELECT únicamente en solicitudes; sin INSERT/UPDATE/DELETE cliente. RPC SECURITY DEFINER deliberadas, nombres calificados/search_path vacío, auth.uid y EXECUTE authenticated sin PUBLIC/anon. El trigger y la consulta existente de asistentes mantienen permisos; ésta agrega `pending_count` sin cambiar su firma.
- Ruta `/events/:id/rejoin-requests`, desde Solicitudes en Asistentes; regreso conserva origen/filtros. Confirmaciones accesibles, envío único, estados carga/vacío/error/denegación y foco/online/visibilidad como revalidación. Cuenta/evento nuevos descartan respuestas previas. La participación mantiene su reconciliación/polling de 30 s existente y añade online.
- El usuario consulta pendiente/rechazo/fecha Argentina/aprobado desde detalle; al aprobar se recuperan las reglas existentes de chat. No se agregan notificaciones automáticas, Realtime de solicitudes ni promesas «te avisaremos».

## Matriz de criterios

| CA | Evidencia local ejecutada | Límite |
| --- | --- | --- |
| R3-08.CA-01 | Removed solicita; acceso histórico unlisted permitido, extraño denegado; UI detalle y evento lleno | Auth/REST reales pendientes |
| R3-08.CA-02 | Primera inmediata, sin plazo desde remoción; solicitud pendiente, sin cambiar participación | Aceptación humana pendiente |
| R3-08.CA-03 | Duplicate pendiente SQL/UNIQUE/concurrencia; confirmed/cancelled/nunca removido denegados; doble clic UI | Sesiones SQL con identidad simulada |
| R3-08.CA-04 | Antes de siete días denegado, al cumplirse permitido; ended/cancelled/archived denegados; próxima fecha UI en navegador Tokyo | Dispositivo físico pendiente |
| R3-09.CA-01 | Proyección sólo dueño; paginación 30+4; nombres/username sin datos privados; carga/retry/acceso directo UI | No proyección HTTP con JWT real |
| R3-09.CA-02 | Una reconfirmación, mismo ID, actor/razón/historial, chat recuperado y rollback probado | Chat remoto real pendiente |
| R3-09.CA-03 | Sin plaza queda pending; liberar plaza no autoaprueba; aprobaciones/inscripciones compiten por última plaza | Concurrencia real en PostgreSQL aislado |
| R3-09.CA-04 | Rechazo persiste fecha/revisor, mantiene removed e historia; UI comunica resultado y siete días | No notificación automática |
| R3-09.CA-05 | Dueño ajeno/participante/tercero/anon/sin identidad denegados; solicitudes ajenas denegadas; cierre gana carrera y bloquea aprobación | Metadatos remotos no prueban HTTP/JWT |

## Pruebas y reproducción

- `npm run build` y `npm run lint`: PASS; aviso de tamaño del chunk Mapbox preexistente.
- `npm run check:rejoin`: PostgreSQL real aislado con replay completo, scaffolding Auth/Storage y conexiones distintas por actor. [Resultados SQL](postgres-results.json). Incluye RLS/grants, CHECK/UNIQUE, aislamiento, cooldown, privacidad, rollback y once carreras bloqueadas reales; no conecta a Supabase remoto.
- `npm run check:rejoin:ui`: Edge/Playwright con respuestas Supabase interceptadas, cinco tamaños y zona Asia/Tokyo. [Resultados UI](ui-results.json). Incluye paginación/retry, cancel/Escape/foco, cupo lleno, doble clic, respuesta perdida/comprobación fallida/cierre y reapertura del diálogo, rechazo en cerrado, estados del usuario, vacío/migración ausente, renovación de sesión y cambio de cuenta con lectura tardía.
- `npm run check:r3-block-6:regressions`: creación, edición/cupo, participación, asistentes, acciones y chat SQL, más participación/asistentes/acciones/chat UI. [Resultados por check](regression-results.json). Copias temporales redirigen evidencia a este bloque y se eliminan al terminar; evidencia histórica intacta.
- SQL requiere las dependencias locales ignoradas existentes `.participation-test-tools.local/node_modules/pg` y `@embedded-postgres/windows-x64`; crea una base nueva, escucha sólo 127.0.0.1 y la detiene en finally. No borra datos reales.
- UI requiere Edge y Playwright del runtime; admite `PLANIT_PLAYWRIGHT_PATH`. Levantar `npm run dev -- --host 127.0.0.1 --port 4188`; admite `PLANIT_UI_ORIGIN`. No usar credenciales reales: los fixtures interceptan Auth/REST y cierran WebSocket.

## Comparación visual

Abiertos los originales 04 Asistentes, 05 Solicitudes, 07 Estados/diálogos y collage R3 antes de implementar. Capturas reales del navegador con contenido ficticio; no son mockups generados ni fotos recortadas del original.

| Ancho | Bandeja | Aprobar | Rechazar | Removido | Pendiente | Rechazado |
| --- | --- | --- | --- | --- | --- | --- |
| 360 | [captura](requests-360.png) | [captura](approve-dialog-360.png) | [captura](reject-dialog-360.png) | [captura](removed-360.png) | [captura](pending-360.png) | [captura](rejected-360.png) |
| 375 | [captura](requests-375.png) | [captura](approve-dialog-375.png) | [captura](reject-dialog-375.png) | [captura](removed-375.png) | [captura](pending-375.png) | [captura](rejected-375.png) |
| 390 | [captura](requests-390.png) | [captura](approve-dialog-390.png) | [captura](reject-dialog-390.png) | [captura](removed-390.png) | [captura](pending-390.png) | [captura](rejected-390.png) |
| 768 | [captura](requests-768.png) | [captura](approve-dialog-768.png) | [captura](reject-dialog-768.png) | [captura](removed-768.png) | [captura](pending-768.png) | [captura](rejected-768.png) |
| 1280 | [captura](requests-1280.png) | [captura](approve-dialog-1280.png) | [captura](reject-dialog-1280.png) | [captura](removed-1280.png) | [captura](pending-1280.png) | [captura](rejected-1280.png) |

Identidad marino/azul/violeta, cards, badge amarillo, acciones azul-violeta/rojo conservados. Adaptaciones: shell actual de PWA, título/cupo operativo/contexto de evento, iniciales en lugar de fotos privadas, username en lugar de email, omisión de motivos; badge debajo del nombre en móvil para evitar overflow, mensajes de consecuencias y fecha exacta del cooldown. Sin marco de teléfono ni decoración del póster. Dispositivo físico/safe-area y aceptación humana pendientes.

## Estado de base y pendientes

Plan, STATUS, requisitos locales, decisiones del bloque 0, guías de diseño, arquitectura/modelo y especificación técnica R3-08/09 de Planificación consultados. Metadatos de tablas de `planit-v2` inspeccionados: participación mantiene confirmed/cancelled/removed, timestamps sin zona, relaciones y RLS; solicitudes ausentes. Definiciones de RPC/trigger se inspeccionaron en migraciones versionadas, no se afirma auditoría remota exhaustiva de sus cuerpos.

Migración `20261012155501_event_rejoin_requests.sql` creada por CLI y replay local probado; aplicada el 12/10/2026 tras autorización explícita del usuario. Preflight detectó sólo esta pendiente; push con --skip-vault sin seeds/roles, diecisiete versiones sincronizadas y dry-run posterior sin pendientes. Siete cuerpos RPC/trigger idénticos al SQL versionado; search_path vacío, EXECUTE authenticated sin PUBLIC/anon, RLS propia, grants SELECT y restricciones/índices verificados. Smoke remoto READ ONLY/ROLLBACK rechazó identidad ausente en las cinco RPC nuevas sin escribir datos de negocio. [Resumen y metadatos](remote-migration-summary.json).

Advisors: dieciséis → veintiún [avisos SECURITY DEFINER autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), correspondientes a cinco RPC deliberadas con autorización explícita; [protección de contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) preexistente, sin cambios. HTTP/Auth/JWT/REST/Realtime reales A/B, dispositivo físico y aceptación humana pendientes. Sin cambios en Vault, Supabase antiguo, merge, despliegue ni estado «Validado».
