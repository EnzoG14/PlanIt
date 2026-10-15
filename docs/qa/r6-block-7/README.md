# R6 · Bloque 7 — Bandeja de cupo completo

15/10/2026 · **Implementado; QA pendiente**. Sólo B7; no B8, merge, deploy ni Web Push.

## Base y decisiones

- Base limpia `main`/`origin/main`: `9311c0142e4c945656e8aa0fe9c89c1a37b4135b`, verificada tras fetch. PR #69 **MERGED**, commit coincidente, fecha remota `2026-10-15T20:03:52Z`. Rama nueva `codex/r6-block-7` en el mismo checkout; `.env.local` de main conservado, ignorado y nunca versionado.
- El pedido humano autoriza B7 de **R6**, según el archivo y plan aprobados, pese a la referencia inicial a R5. R5 conserva GO/Validado por aceptación humana; no se elevan sus NOT RUN técnicos.
- A01–A07 y D07 conservados. Decisión explícita B7: **nombre actual autorizado**, sin snapshot del título. B6 integrado; aplicación remota B6 acreditada por [acta previa](../r6-block-6/remote/summary.json), no por una nueva consulta remota B7.
- Migración B7 `20261015201034_r6_event_full_inbox.sql`: **creada 1 / probada local 1 / aplicada remota autorizada 1 / verificada remota 1**. Aplicación posterior autorizada por el responsable; sin fixtures remotos. El corte de implementación inicial era1/1/0/0.

## Contrato y amenazas

`get_notifications(timestamp,uuid)`, `get_notification_changes(uuid[])` y `get_notification_target(uuid)` conservan sus firmas. Las dos listas mantienen campos `id,type,title,body,read_at,created_at,target`, keyset de 31 filas con página cliente de 30 y batch máximo 100 IDs. Para `event_full`, `title` pasa a ser el nombre actual del evento; `type` lleva la etiqueta «Cupo completo» y `body` sigue genérico. No cambian filas históricas ni el productor B6.

Las tres funciones son **STABLE SECURITY INVOKER**, `search_path=''`, nombres calificados y EXECUTE exclusivamente `authenticated`. No hay nuevas tablas, índices, políticas, triggers, publicaciones, contadores ni privilegios de lectura. RLS recipient-only sigue vigente; `mark_notification_read` conserva sello de servidor y lectura idempotente.

| Amenaza/estado | Control y resultado |
| --- | --- |
| Otro usuario conoce UUID del aviso/evento | RLS y filtro recipient; sin filas, lectura ni destino. SQL A/B/C/D/anon/sin UID probado. |
| Aviso forjado hacia evento ajeno visible o conversación | Rama `event_full` antes de chat; ownership actual y ausencia de conversación obligatorios. No revela título ni concede destino. |
| Evento oculto/cancelado/terminado del organizador | Permisos vigentes permiten consulta; no se exige estar abierto para consultar el aviso histórico. |
| Evento archivado, inexistente o propiedad perdida | Título genérico y target NULL; la UI informa indisponibilidad. No se interpola el ID desde texto. |
| Permiso perdido entre lista y clic | RPC autenticada revalida; error neutro, quita acción y nombre. Una conciliación iniciada antes del rechazo no restaura esos datos. |
| URL externa o ruta no admitida | Allowlist cliente existente; pruebas de HTTPS externo, URL relativa a protocolo y query maliciosa. React representa el nombre como texto. |
| Retransmisión, eco o múltiples montajes | UUID merge, conciliación serial y count exacto consultado; no se incrementa contador acumulativo. |
| Logout/cambio de cuenta con consulta pendiente | Remount por usuario, teardown, guardias de actividad y descarte de respuestas/callbacks anteriores. |

## Pruebas y reproducción

Requisitos locales: dependencias npm, Edge/Playwright del runtime y PostgreSQL/pg en `.participation-test-tools.local/node_modules` (overrides existentes `PLANIT_PLAYWRIGHT_PATH` y `PLANIT_TEST_TOOLS_DIR`). Los runners nuevos no conectan a una base remota. Los archivos de regresión conservan etiquetas históricas internas; su ejecución B7 y manifiesto de 36 migraciones constan en las carpetas nuevas.

| Comando / capa | Resultado y evidencia |
| --- | --- |
| `npm run build` | PASS; warning previo de chunks >500 kB. |
| `npm run lint` | PASS; warnings heredados en probes de diseño y DiscoveryFilters; sin errores. |
| `npm run check:r6:event-full:inbox` | PASS, [31 grupos SQL y replay 36](sql/sql-results.json), PostgreSQL 17.5 real con scaffold Auth/Storage. Incluye 72 audiencias y 13 carreras heredadas, ACL/RLS, nombre actual, archivado, destinatarios, falsificación, read_at y paginación. |
| `npm run check:r6:event-full:ui` | PASS, [14 grupos](ui/after/results.json), app compilada + SDK real con transporte de fixtures. |
| `node scripts/check-r6-event-full.mjs` | PASS, [41 grupos B6](regressions/producer-b6/sql-results.json), incluidas ocho carreras B6, rollback y lleno→libre→lleno. |
| `node scripts/check-r5-message-notifications.mjs` | PASS, [28 grupos](regressions/dm-sql/sql-results.json). |
| `node scripts/check-r5-request-notifications.mjs` | PASS, [28 grupos](regressions/follows-sql/sql-results.json). |
| `node scripts/check-notifications.mjs` | PASS, [7 grupos SQL originales](regressions/notifications-sql/postgres-results.json). Este runner usa `PLANIT_UI_OUTPUT` también para SQL. |
| `node scripts/check-r5-message-notifications-ui.mjs` | PASS, [DM390/1280](regressions/dm-ui/results.json). |
| `node scripts/check-r5-request-notifications-ui.mjs` | PASS, [seguimiento390/1280](regressions/follows-ui/results.json). |
| `node scripts/check-notifications-ui.mjs` | PASS, [17 grupos](regressions/notifications-ui/ui-results.json). |
| `node scripts/check-realtime-ui.mjs` | PASS, [8 grupos](regressions/realtime-ui/ui-results.json), transporte simulado explícitamente. |
| `node scripts/check-realtime.mjs` | PASS, [3 grupos de conciliación/canal simulado](regressions/reconciliation-unit/run.json). |

Para reproducir regresiones, usar `PLANIT_SQL_OUTPUT`/`PLANIT_UI_OUTPUT` bajo esta carpeta. Las suites originales `check-notifications-ui` y `check-realtime-ui` requieren servir `dist` y definir `PLANIT_UI_ORIGIN`; esta ejecución utilizó un servidor HTTP local efímero. Realtime UI utiliza `PLANIT_REALTIME_UI_OUTPUT`. [Manifiesto](regressions/ui-summary.json).

Casos UI B7: aviso y badge, lectura con teclado y persistencia, ruta existente, revalidación y rechazo seguro, INSERT/UPDATE repetidos, nombre actualizado, recuperación de 65 filas con títulos únicos, keyset30/60/65, recarga, dos inicializaciones simultáneas de la misma cuenta, cierre de una sesión sin afectar a otra, ausencia de ACK del canal con refresco manual, error/migración ausente/reintento, cambio A→B con respuesta y evento tardíos. La suite original Realtime cubre también logout y callbacks descartados. Cache API sin respuestas Supabase y `runtimeCaching: []` conservado.

### Capturas y diseño

App ejecutada, datos **sintéticos identificados**; no mockups generados. [Antes390](ui/before-event-full/inbox-390.png), [antes1280](ui/before-event-full/inbox-1280.png), [después390](ui/after/inbox-390.png), [después1280](ui/after/inbox-1280.png). También 320/360/375/768 en `ui/after`, [texto duplicado y altura500](ui/after/text-200-short-375.png), [revocación](ui/after/revoked-390.png) y [sin canal](ui/after/no-channel-manual-390.png).

Conserva Amanecer, fuente autoalojada, iconos, cuatro destinos, tokens y composición actuales; cero CSS/tokens nuevos. Foco computado≥3px, control≥44px, navegación Enter, reduced-motion y sin desbordamiento horizontal. Se duplicó realmente el tamaño computado en px de los textos del centro (no sólo el tamaño raíz); esto no equivale a probar zoom nativo del navegador ni lector de pantalla. Revisión visual móvil/escritorio realizada. DESIGN, mockups y sidecar intactos; aviso de sidecar desactualizado preexistente conservado sin regenerarlo.

### Rendimiento y ejecución inicial

[Benchmark y EXPLAIN](sql/benchmark.json): 20 muestras por bandeja de 0/1/10/100/1000 avisos `event_full`, con evento propio autorizado. Medianas aproximadas **0,25/1,25/1,76/2,77/3,43 ms**; máximos locales≤18,06ms. Incluye arranque/catálogo frío y no es SLA de producción. [Catálogo RPC](sql/catalog.json).

Se conservan intentos fallidos de pruebas: [SQL](sql/first-attempt-fixture-failure.json) falló al crear el usuario sintético de benchmark sin `display_name`; corregido el fixture, todos los grupos pasan. UI [intento1](ui/after/first-attempt-results.json) exigía persistencia del título genérico pese a una consulta nueva legítima; [intento2](ui/after/second-attempt-results.json) esperaba filas antes de la respuesta del refresco; ambos corregidos en el runner. No se ocultaron fallos del producto. El primer lanzamiento de Edge y la ayuda del CLI bajo sandbox no iniciaron; la ejecución autorizada fuera del sandbox funcionó.

## Cobertura y límites

| CA | SQL-local | UI-browser | HTTP-JWT real | Realtime real | Integral |
| --- | --- | --- | --- | --- | --- |
| RF-R6-05.CA-01 | PASS regresión B6 | PASS consumidor fixture | NOT RUN | NOT RUN | NOT RUN |
| RF-R6-05.CA-02 | PASS B7 | PASS fixtures B7 | NOT RUN | NOT RUN | NOT RUN |
| RF-R6-05.CA-03 | PASS regresión B6 | No productor cliente | NOT RUN | NOT RUN | NOT RUN |
| RF-R6-05.CA-04 | PASS B6+B7 | PASS dedupe/aislamiento fixtures | NOT RUN | NOT RUN | NOT RUN |

HTTP autenticado y entrega real Realtime requieren usuarios/fixtures autorizados de prueba; no se usaron cuentas reales ni se escribieron datos de producto remotos. Pruebas de dispositivos, lector de pantalla, zoom nativo200%, rendimiento móvil y aceptación humana **NOT RUN**. Las RPC B7 ya están aplicadas remotamente; esto no implica despliegue del frontend ni aceptación integral R6 o Web Push.

## Aplicación remota autorizada · 15/10/2026

Pedido humano: «Aplicá la migración remotapor favor». Proyecto `planit-v2` (`iepeqmvzjguwlhnecsdq`); fuente `05750617d7418011061bdc0b3afa12c40e6dc815`.

- [Dry-run previo](remote/dry-run-before.txt): única pendiente `20261015201034_r6_event_full_inbox.sql`. [Aplicación](remote/apply.txt) por CLI enlazado con `--skip-vault`; sin seeds/roles/Vault ni otras migraciones.
- [Historial posterior](remote/migrations-after.json)36/36 igual al manifiesto local; [dry-run posterior](remote/dry-run-after.txt) vacío.
- [Verificación](remote/verification.json) PostgreSQL17.11 en [READ ONLY/ROLLBACK](remote/verify-readonly.sql): cuerpos de las tres RPC iguales a Git, firmas conservadas, INVOKER/STABLE/search_path vacío, EXECUTE authenticated y no PUBLIC/anon. RLS recipient-only, publicación y productor/triggers B6 e historial preservados; cero tablas públicas sin RLS. Anon no puede ejecutar target; authenticated sin UID no puede listar ni conciliar y obtiene target NULL.
- [Asesores](remote/summary.json): **sin nuevos hallazgos**, mismos50 WARN y1 INFO; 49 corresponden a funciones DEFINER previas, uno a [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) y uno informativo a tabla con RLS sin políticas. Las tres RPC B7 son INVOKER.
- Marcas **1/1/1/1**. No se crearon avisos, usuarios o eventos de prueba remotos; HTTP JWT y entrega Realtime reales siguen NOT RUN. Sin merge, deploy o avance B8; estado **Implementado; QA pendiente**.

[PR #70 draft](https://github.com/EnzoG14/PlanIt/pull/70), commit funcional `f5208d6ce45bde189a9fd1b56be9e3220ef8325f`. El commit posterior sólo registra el enlace y este cierre; HEAD final se consulta en Git/PR. Inventario: un componente, una migración, dos runners, dos scripts npm, seguimiento y evidencia aislada bajo esta carpeta (sin modificaciones de reportes históricos). **Detenerse aquí: B8 requiere autorización humana independiente.**
