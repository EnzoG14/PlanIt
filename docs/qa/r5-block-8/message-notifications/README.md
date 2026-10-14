# Ampliación B8 — Avisos de mensajes privados

**Aplicada/verificada en planit-v2 — 14/10/2026:** autorización posterior «si», ejecución exclusiva de20261014225216 y postflight PASS con30 migraciones. [Acta y evidencia](remote/README.md). Creada1/probada local1/aplicada remota1/verificada remota1; QA JWT/Realtime real y aceptación pendientes, sin deploy/merge. Supera las menciones a permiso pendiente del corte histórico siguiente; el manifiesto de ampliación conserva su snapshot preaplicación.

14/10/2026, Argentina. Pedido expreso del responsable: que los mensajes también aparezcan en el centro de notificaciones. Se incorpora a [PR #58](https://github.com/EnzoG14/PlanIt/pull/58), rama `codex/r5-block-8`, base de ampliación `603ed63f88b77c1946554d3f2ed1b52a98ad7823`. **Implementado; QA pendiente**. Supera la exclusión original de productores de avisos DM de B8, sin modificar ni renumerar los33 CA oficiales.

## Comportamiento y autorización

Cada mensaje privado nuevo produce un aviso dirigido sólo a la contraparte: «Nuevo mensaje privado» y texto genérico, sin nombre/avatar/actor_id ni copia del cuerpo. La campana y el centro reciben el INSERT mediante el proveedor Realtime/RLS de notifications ya existente. «Ver mensaje» marca el aviso leído y reconsulta el destino autorizado `/messages/:conversationId`. No agrega notificaciones push, backfill histórico, recibos de lectura del chat ni cambios de permisos de eventos.

Migración nueva `20261014225216_direct_message_notifications.sql`, generada por CLI. Trigger privado `notify_direct_message`, SECURITY INVOKER, search_path vacío y sin EXECUTE cliente; corre dentro de la inserción autorizada por send_direct_message. Recipient se deriva de la pareja almacenada, nunca del navegador. ID del aviso = UUID del mensaje: un reintento confirmado no inserta otra fila y una carrera del mismo UUID produce un mensaje/un aviso. Si falla insertar el aviso se revierte también el mensaje; no se informa envío parcial.

No nueva tabla/policy/grant/publicación. El trigger ignora chats de eventos. `get_notification_target` conserva follow/event y agrega sólo avisos `direct_message` con conversación `kind=direct`, bajo RLS de destinatario y miembro. Un aviso forjado que apunte a una conversación ajena no concede acceso. Destinos arbitrarios o externos se rechazan también por allowlist cliente.

El bloqueo posterior conserva el aviso genérico y acceso al historial, sin devolver identidad social y con compositor desactivado. Nuevos envíos bloqueados no generan avisos. Un envío que ganó el lock puede confirmarse antes del bloqueo, con su aviso transaccional. Leer el aviso marca únicamente su estado de notificación, sin inferir que el destinatario leyó todos los mensajes del chat.

| Operación | Destinatario miembro | Remitente / tercero | Bloqueado miembro | Anónimo |
|---|---|---|---|---|
| Aviso: id,type,title,body,created_at,read_at,target | Sólo el propio; mensaje sin contenido social | No lee el aviso ajeno | Aviso genérico propio conservado | Denegado |
| Generar aviso | Sólo trigger por mensaje autorizado | Sin INSERT de notificaciones cliente | Nuevos envíos denegados en BD | Denegado |
| Ver mensaje | Reconsulta RLS de conversación | Sin acceso por conocer ID ni por notice forjado | Historial read-only, perfil neutral | Denegado |
| Marcar leído | Sólo aviso propio, reloj servidor | Denegado sobre aviso ajeno | Permitido propio | Denegado |

## Pruebas y límites

- [SQL local](sql/sql-results.json): replay30 migraciones PostgreSQL17.5,72 audiencias y13 carreras B1 más carrera de envío duplicado; aviso sólo al destinatario, sentido inverso, privacidad, retry, bloqueo, target forjado, exclusión de evento y rollback/error inyectado PASS. Auth/Storage scaffold y SET ROLE, no JWT real. [Harness](sql/harness.json).
- [UI de avisos](ui/results.json): dos sesiones fixture en390/1280, envío→INSERT WebSocket→campana/centro sin recargar, deduplicación, genérico sin cuerpo/identidad, marcar leído, navegación al DM bloqueado y URL externa rechazada PASS. [Captura móvil](ui/dm-notice-390.png), [escritorio](ui/dm-notice-1280.png).
- [Regresión de DM](dm-regression/ui-results.json):7 grupos PASS en390, incluidos envío incierto, catch-up66, bloqueo, offline/oculto. [Avisos follow](follow-regression/results.json):2 sesiones390/1280 PASS.
- [Regresiones SQL R1–R4](regressions.json):13/13 PASS con30 migraciones.
- Build/lint PASS con avisos históricos. Revisión visual del centro real con fixtures conserva Amanecer/componentes/CSS existentes; no nuevo diseño ni cambio de tokens.
- JWT/Realtime/entrega remota, dispositivos/lector de pantalla y aceptación humana **NOT RUN**. UI simulada no prueba RLS remoto ni conectividad real. El primer fixture SQL de chat de evento omitía UUID obligatorio; se corrigió y repitió completo.

| Migración | Creada | Probada local | Aplicada remota | Verificada remota |
|---|---|---|---|---|
| 20261014225216 | Sí | PASS | No, requiere autorización aparte | No |

Sin DDL remoto, deploy, merge ni edición de Google Docs. El preflight de catálogo real de sólo lectura encontró29 migraciones, ninguna fuente productora messages y target anterior sin DM. La configuración local se mantiene ignorada, sin secretos en evidencia. Para activar producción se necesita permiso para aplicar **sólo esta migración** a planit-v2; después revisar catálogo/ACL/RLS/publicación y registrar acta separada. No atribuir aplicación o aceptación antes de ejecutarlas.

```powershell
npm run check:r5:message-notifications
npm run build
npm run lint
npm run check:r5:message-notifications:ui
$env:PLANIT_SQL_OUTPUT='docs/qa/r5-block-8/message-notifications'
node scripts/check-r5-regressions.mjs
```

Revisión: trigger transaccional/sin privilegios nuevos, UUID y bloqueo, cuerpo genérico, allowlist y destino bajo RLS. Mantener B9 pendiente de instrucción independiente.
