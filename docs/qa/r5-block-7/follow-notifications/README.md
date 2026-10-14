# Ampliación B7 — Notificación de solicitud de seguimiento

14/10/2026. Pedido posterior del responsable: notificación Realtime al solicitar seguimiento. Amplía expresamente la exclusión original de productores de B7, sin cambiar los33 CA oficiales ni agregar avisos de aceptación/rechazo, follows públicos o Web Push. Rama y [PR #57](https://github.com/EnzoG14/PlanIt/pull/57) existentes. Base de la ampliación `169b904e4e951f6d77d05d83dabdebaaf261d66a`.

## Contrato y autorización

- Trigger privado notify_follow_request, SECURITY INVOKER, search_path vacío, sin EXECUTE cliente. Ejecuta dentro de follow_user autorizado; sin nuevos grants ni endpoints de escritura.
- Nueva generación pending inserta exactamente un aviso: id=request_version, recipient_id=followed_id. Reintentar pending no duplica. Nuevo pedido tras rechazo/cancelación crea nueva generación y aviso. Accepted/public, resolución y conversión D04 no emiten avisos adicionales.
- Aviso y solicitud confirman o revierten juntos. Fallo de inserción de notificación revierte follow. No hay backfill de solicitudes previas.
- Título/cuerpo genéricos, sin nombre, avatar ni actor_id. Bloqueo posterior no deja identidad privada en el historial. Destino fijo `/me/follow-requests`, calculado sólo para destinatario; no concede acceso a perfiles ajenos.
- notifications mantiene RLS recipient-only, INSERT/DELETE cliente denegados y publicación supabase_realtime existente. No se publican user_follows/profiles ni se cambian permisos de eventos/chat/DM.
- Proveedor existente actualiza campana/bandeja por INSERT, deduplica y recupera al reconectar. UI añade categoría Seguimiento, icono usuario y Ver solicitudes; CSS/tokens/dock intactos.

## Migración y pruebas

`supabase/migrations/20261014212935_follow_request_notifications.sql`, creada con CLI2.120.0. Trigger nuevo y extensión mínima de get_notification_target conservando event/direct y RLS. [Preflight remoto READ ONLY](remote-preflight.json):28 migraciones/publicación existente; sin aplicación.

| Creada | Probada local | Aplicada remota | Verificada remota |
|---|---|---|---|
| Sí,1 | Sí,replay29 | No,0; requiere permiso | No,0 |

| Prueba | Resultado y límite |
|---|---|
| Replay29,72 audiencias/13 carreras B1;pending/public/retry/resolve,renovación,RLS,destino,lectura,bloqueo | PASS [SQL](sql/sql-results.json), PostgreSQL17.5 con scaffolds Auth/Storage, sin JWT |
| Rollback e inserción fallida revierten follow;dos conexiones repiten pedido con espera Lock real y sólo un aviso | PASS [Harness](sql/harness.json); carrera adicional a las13 B1 |
| Dos sesiones:solicitar→INSERT WebSocket→campana sin recarga;bandeja/dedup/Ver solicitudes/lectura/reconexión | PASS390/1280 [UI](ui/results.json); build real/SDK con HTTP/Phoenix simulados, no transporte remoto |
| Regresiones R1–R4,13 suites sobre29 migraciones | PASS [resultados](regressions.json) |
| Build/lint | PASS,avisos previos; sin dependencias nuevas |
| JWT autenticado,Realtime Supabase real,dispositivos/lector,aceptación humana | NOT RUN;migración remota pendiente |

Capturas reales con fixtures: [móvil](ui/notification-390.png), [escritorio](ui/notification-1280.png) y destino requests390/1280. Inspección conjunta sin nuevos defectos de composición. Primer intento SQL falló por sustitución $$ en generador del fixture; callback de reemplazo corregido y suite repetida PASS. No fue fallo de migración.

Comandos: npm run build; npm run lint; npm run check:r5:request-notifications; npm run check:r5:request-notifications:ui. Regresiones: PLANIT_SQL_OUTPUT=docs/qa/r5-block-7/follow-notifications node scripts/check-r5-regressions.mjs. Evidencia anterior B7 se conserva como corte28; resultados nuevos corresponden a29.

**Implementado; QA pendiente. Para activar en planit-v2 hace falta autorizar la aplicación de esta migración**, según AGENTS raíz y supabase/AGENTS.md. Sin DDL remoto, deploy, merge o edición de Google Docs.
