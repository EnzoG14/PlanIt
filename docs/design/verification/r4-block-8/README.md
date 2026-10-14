# R4 · Bloque 8: accesos, revocación y restitución

13/10/2026 (Argentina). Base `origin/main` **818e892b172deacb8504245abf308aa9801de117**, PR #46/B7 integrada tras fetch. Rama `codex/r4-block-8`; estado **Implementado; QA pendiente**, sin aceptación humana. `.env.local` de main copiado/preservado en archivos ignorados, nunca versionado ni mostrado.

## Contrato e implementación

- Migración nueva `20261014120006_event_access_management.sql`, generada con Supabase CLI y ordenada después de B7. **Creada y probada localmente; no aplicada remotamente.** No cambian tablas/RLS ni migraciones aplicadas.
- `get_event_access_grants(uuid,text,uuid,integer) returns jsonb`: dueño desde `auth.uid()`, sólo evento oculto; status active/revoked, cursor por grant ID, límite 30 por defecto y máximo 50. Devuelve `{title,event_state,grants,next_cursor}`. Filas `{id,user_id,username,display_name,avatar_url,status,is_confirmed}`; avatar `null` e iniciales, sin nueva lectura social de Storage/profiles. Ningún email, nacimiento, sexo, hash o token.
- `revoke_event_access(uuid,uuid) returns void`: único lock evento→participación→grant. Si confirmed, UPDATE a removed y trigger R3 escribe una transición `organizer_removal` con actor dueño, antes de revocar. Falla cualquier paso → rollback total. Cupo derivado, sin DELETE ni historial manual.
- `restore_event_access(uuid,uuid) returns void`: sólo grant existente; pone active, limpia revoked_at y fija restored_at/updated_at. No inscribe, ocupa cupo, restaura chat, aprueba solicitudes ni modifica cooldown. Retries de ambas acciones conservan timestamps e historial.
- Tres DEFINER justificados por lectura mínima de perfiles/grants y operaciones sin UPDATE general. `search_path=''`, objetos calificados, EXECUTE sólo authenticated, autorización explícita y sin SQL dinámico. Datos sociales/privados siguen separados.
- Decisión confirmada en planificación: ocultos finalizados/cancelados/archivados son consultables en el panel, sin mutaciones. Público rechaza administración individual: A05 permite detalle aun con grant revocado; A04 bloquea reocultar con confirmed+revoked. Rotar links conserva grants; recanjear nunca restituye.
- Fuente original Planificación leída por Google Drive **read-only**: ficha RF-R4-09 consistente con RF/CA locales. No se modificó el documento. A01–A07 no se reabren.

## Trazabilidad y pruebas

| CA | Resultado | Evidencia |
| --- | --- | --- |
| R4-09.CA-01 | PASS local SQL + fixture UI | Proyección/permisos, filtros, cursor y límites; activos/revocados separados de confirmed |
| R4-09.CA-02 | PASS local SQL + fixture UI | Revocado no lee events/Storage/chat; detalle y medios se limpian tras revalidación |
| R4-09.CA-03 | PASS local SQL + fixture UI | Historial único, actor/razón, cupo derivado, rollback y confirmación de remoción |
| R4-09.CA-04 | PASS local SQL | Enlace original y regenerado rechazados por revocado; regresión B7 |
| R4-09.CA-05 | PASS local SQL + fixture UI | Sólo dueño restituye; estado/tiempos idempotentes, sin reinscripción; rotación mantiene activos |

[Resultados SQL](postgres-results.json): ocho grupos en PostgreSQL efímero 17.5, roles A/B/C/D/anon y authenticated sin identidad. Auth/Storage son scaffolding SQL local, **no HTTP/JWT real**. Replay completo, invariantes y siete carreras con **espera real de lock**: revocar/registrar ambos órdenes, revocar/chat, revocar/reingreso ambos órdenes, doble revocar y doble restituir. Cero deadlocks. Fallo inyectado del historial revierte grant/participación; cupos y grants de otro evento intactos.

[Resultados UI](ui/results.json), [geometría](ui/geometry.json): Edge sobre build de producción, Auth/REST/Storage interceptados y WebSocket bloqueado. 21 grupos, 320/375/390/768/1280 px. Diálogos con cancelación, Escape, ciclo/retorno de foco; doble clic; pérdida de respuesta antes/después del commit simulado; permiso denegado/grant ausente, error/reintento, vacíos, cursor y respuestas tardías. Ruta anon protegida. Detalle y chat visibles pierden datos privados tras 30 s; URL de media solicita 60 s y no se renueva tras denegación. Texto ampliado y altura 300 px simulados.

Regresiones locales: `check:hidden-access` (96 combinaciones), `check:event-links`, `check:invite`, `check:attendees`, `check:participations` (10 carreras de última plaza), `check:rejoin` (11 carreras), `check:attendees:ui`, `check:invite:ui`. Sus salidas nuevas están en `regressions/`, sin sobrescribir QA anterior. `npm run build`, `npm run lint`, `check:amanecer` (83 tokens) y `check:auth` PASS. Build conserva aviso de chunks grandes; lint conserva avisos previos fuera del cambio. Detector Impeccable sobre los archivos UI cambiados: `[]` (sin hallazgos deterministas).

Reproducción desde raíz: `npm run build`, `npm run check:event-access`, `npm run check:event-access:ui`. SQL requiere herramientas ignoradas `pg`/`@embedded-postgres/windows-x64`; UI usa Playwright externo y Edge. El runner UI B8 sirve `dist` en un puerto efímero; el runner heredado de asistentes requiere preview en 4186. Configurar `PLANIT_UI_OUTPUT` por suite. El runner de participaciones ignora esa variable y escribe en su ubicación histórica: se copió su resultado nuevo a B8 y se restauraron los bytes históricos de HEAD inmediatamente, sin diff final. El sandbox bloqueó inicialmente localhost; las suites pasaron al ejecutarlas con permiso de procesos/conexión local. Primer intento de asistentes UI sin preview falló por conexión rechazada; se inició preview y reejecutó.

## Composición, foco y revisión visual

- Scope `.amanecer-shell.event-management-shell` para `/events/:id/access`. Reutiliza composición/CSS de asistentes y gestión; una mancha `aria-hidden`, fuente autoalojada, tokens normativos intactos, cuatro destinos del dock y reserva de safe area existente.
- Header/retorno conservan origen de Mis eventos y filtros saneados de Inicio/Mapa. Lista sin tarjetas anidadas, identidad mínima, estado del grant y texto de participación separados. Confirmación roja sólida para revocar; restitución en tinta. Cancelación recibe foco inicial; al desaparecer una fila el foco vuelve a Actualizar accesos. Sin cambios al sistema de diseño.
- [Base inmutable](baseline/results.json): build de main `818e892` guardado antes de modificar frontend, capturado con los mismos fixtures a 375/1280 para detalle y asistentes. Base y nuevas capturas se conservan aquí. El panel no existía en main; no se afirma igualdad de píxeles entre pantallas distintas.
- Inspección visual de móvil/escritorio y diálogo: jerarquía, texto/envuelto, colores/estados, control rojo y espaciado coherentes con DESIGN y asistentes. Geometría: sin overflow, controles ≥44 px, wash único, dock de cuatro destinos y Bricolage. Preferencia reduced-motion emulada. Impeccable reportó sidecar anterior a DESIGN; no se regeneró, según prohibición del proyecto. El primer context usó una ruta web como target de filesystem; se leyó contexto aprobado directamente.

## Límites y pendientes

**NOT RUN:** HTTP/JWT A/B/C/D reales, Storage/Realtime remotos, asesores/drift remotos B8, despliegue, dispositivos físicos/PWA, lector de pantalla, teclado móvil/safe areas físicas y aceptación humana. La prueba de chat verifica limpieza de mensajes/composer con fixtures, no transporte Realtime real. Los avatares son iniciales; no se abrió acceso social R5.

Una URL ya firmada puede seguir sirviendo hasta su TTL de 60 s aunque RLS niegue nuevas firmas. La revalidación visible de detalle/chat es cada 30 s y al volver; no puede borrar archivos descargados ni garantiza notificación instantánea. No se añadieron grants a Realtime ni cachés privados al Service Worker. El caso de poca altura usa emulación, no teclado móvil real; el incremento de texto es CSS, no zoom nativo. `prefers-reduced-transparency` y lectores de pantalla no se acreditan por la captura.

Sin cambios al proyecto histórico, aplicación SQL remota, merge ni deploy. Detenerse en PR B8; B9 sigue pendiente.
