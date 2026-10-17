# PlanIt — R7 · Reporte de validación B11

**Fecha:** 17/10/2026, Argentina. **Base:** `279af15d09988f43a4e79dd397611c645b0b2808`. **Rama:** `codex/r7-block-11`. **PR:** [draft #86](https://github.com/EnzoG14/PlanIt/pull/86). **Entrega técnica:** `1f1c8d8372f5964ce5a4787bfcf6e6e013c74358`. **Responsable técnico:** Codex. **Ambiente:** Windows, Node24.21.0, PostgreSQL18.4 aislado, Edge headless (versión en JSON), build Vite de producción y Vite de desarrollo para UI. **Dictamen recomendado:** NO-GO de aceptación integral; revisión humana pendiente.

## 1. Resultado de RF/CA

| RF | CA | PASS | FAIL | NOT RUN | BLOCKED | Observación |
|---|---:|---:|---:|---:|---:|---|
| RF-R7-01 | 4 | 0 | 0 | 0 | 4 | Chat/DM/imagen local probado; falta transporte integrado A–G |
| RF-R7-02 | 4 | 0 | 0 | 0 | 4 | Publicación/errores/locks locales; falta upload/publicación reales |
| RF-R7-03 | 4 | 1 | 0 | 0 | 3 | CA03 navegación local PASS; permisos/imagen real pendientes |
| RF-R7-04 | 4 | 0 | 0 | 0 | 4 | TTL/GC local PASS; transporte/DELETE físico/cron pendientes |
| RF-R7-05 | 4 | 3 | 0 | 0 | 1 | Acciones/archivo/parser/permisos PASS local; cliente final pendiente |
| RF-R7-06 | 4 | 0 | 0 | 0 | 4 | Payload/fallback/cancelación local; selector nativo y permisos reales pendientes |
| RF-R7-07 | 5 | 0 | 0 | 0 | 5 | Cola/worker/SW/opt-in local; matriz física/múltiples dispositivos pendiente |
| **Total** | **29** | **4** | **0** | **0** | **25** | No aceptación global automática |

Los 29 CA se evaluaron; BLOCKED no equivale a «sin pruebas»: cada fila tiene pruebas ejecutadas y una condición faltante concreta en [CRITERIA](r7-block-11/CRITERIA.md) y [JSON](r7-block-11/criteria.json). La [matriz](RELEASE_7_ACCEPTANCE.md) conserva literalmente la normativa. Los PASS se limitan al alcance técnico expresado; no firman la release ni convierten fixtures en permisos reales.

## 2. Matriz técnica

| Capa | Estado | Comando/alcance | Evidencia |
|---|---|---|---|
| SQL local replay + constraints | PASS | Seis suites R7, 47 migraciones desde cero por suite, SET ROLE A/B/pending/removed/link-only/tercero/anon según caso | [Suites y logs](r7-block-11/suites/) |
| HTTP JWT RLS usuarios A–G | NOT RUN B11 | No fixtures reales ni permiso separado para provisionarlos | [Pendiente por CA](r7-block-11/CRITERIA.md) |
| Storage GET activas/expiradas/revocadas | NOT RUN real | SQL scaffold y handlers PASS; sin equivalencia a GET real | [B6 histórico](r7-block-6/STATUS.md) |
| UI browser + responsive | PASS local | App/router/detalle real, 320/375/390/768/1280, 25 grupos; antes390/1280, texto200%320/1280 | [Resultados](r7-block-11/ui/results.json), [antes](r7-block-11/ui/before-results.json) |
| Stories/Calendar/Share/Push UI | PASS fixtures | Suites existentes, salidas reubicadas sin cambiar aserciones | [UI](r7-block-11/regressions/ui.json) |
| SW precache/offline/push-clic | PASS local | Registro, claim/precache, cero Supabase cache, recarga offline y eventos sintéticos | [SW](r7-block-11/sw/sw-results.json) |
| Upgrade entre dos releases | NOT RUN | Build/registro actual no prueba transición de una instalación anterior | — |
| Push físico | NOT RUN B11 | B10 conserva recepción humana de un DM con una bandeja/job; no nueva ejecución física | [B10 heredado](r7-block-10/deploy/README.md) |
| Edge/fallos/concurrencia | PASS por capas locales | WASM, autorización simulada, TTL después de I/O, claims/leases, retry, 404/410/429/5xx/timeout/ACK perdido, 9 tests Deno Push | [Salidas](r7-block-11/suites/) |
| Build / lint | PASS | Dependencias instaladas desde lockfile, sin cambios de dependencias productivas | [Build](r7-block-11/build.txt), [lint](r7-block-11/lint.txt) |
| Regresiones R1–R6 | PASS selección local | Configuración/events/tokens, R4 links/access/invite, R5 social/DM y R6 compare/event_full; no todo E2E | [SQL](r7-block-11/regressions/sql.json), [reproducción](r7-block-11/README.md#reproducción) |
| Normativa/prerrequisitos | PASS documental | 29 hashes literales, 12 PR MERGED/ancestry y composición única | [31 checks](r7-block-11/report-checks.json) |

Pruebas positivas, negativas, concurrencia y errores se detallan en los logs originales y la [bitácora B11](r7-block-11/README.md). Un fallo inicial de fixture multimedia se conserva y su corrección verifica ambas barreras por separado, sin cambiar SQL. El primer agregador se detuvo por su filtro de nombres; se preservaron las salidas y se completó la ejecución con el filtro corregido.

## 3. Cuatro marcas por migración

**B11 crea 0 migraciones.** Se consolidan marcas históricas acreditadas por productores y replay local actual; no se ejecutaron DDL ni verificación remota nuevos en B11. `Catálogo` no significa HTTP/Storage/funcionalidad desplegada. PostgreSQL remoto documentado17.11, local18.4; paridad de versión no probada.

| Migración | Creada | SQL local | Remota aplicada con autorización histórica | Remota verificada | Evidencia |
|---|---|---|---|---|---|
| `20261016131118_r7_media_contract.sql` | Sí | PASS47 | Sí B1 | PASS catálogo | [B1](r7-block-1/remote/summary.json) |
| `20261016141952_r7_chat_attachments.sql` | Sí | PASS47 | Sí B2 | PASS catálogo | [B2](r7-block-2/remote/summary.json) |
| `20261016142017_r7_push_subscriptions.sql` | Sí | PASS47 | Sí, incluida antes B10 | Historial47; no recertificación funcional B11 | [B10 preflight40→41](r7-block-10/remote/verification.json), [B6 inventario47](r7-block-6/remote/summary.json) |
| `20261016154257_r7_push_jobs.sql` | Sí | PASS47 | Sí B10 | PASS catálogo/ACL | [B10](r7-block-10/remote/verification.json) |
| `20261016182333_r7_storage_upload_preflight.sql` | Sí | PASS47 | Sí B3 correctiva | PASS catálogo | [B3](r7-block-3/storage-fix/README.md) |
| `20261016185018_r7_media_authenticated_get_context.sql` | Sí | PASS47 | Sí B3 correctiva | PASS catálogo | [B3](r7-block-3/storage-fix/README.md) |
| `20261016185322_r7_restore_operation_read_guard.sql` | Sí | PASS47 | Sí B3 correctiva | PASS catálogo | [B3](r7-block-3/storage-fix/README.md) |
| `20261016185634_r7_chat_image_delivery.sql` | Sí | PASS47 | Sí B3 correctiva | PASS catálogo | [B3](r7-block-3/download-fix/README.md) |
| `20261016193248_r7_stories.sql` | Sí | PASS47 | Sí B4 | PASS catálogo | [B4](r7-block-4/remote/summary.json) |
| `20261017180932_r7_story_gc.sql` | Sí | PASS47 | Sí B6 | PASS catálogo | [B6](r7-block-6/remote/summary.json) |

## 4. Integración, seguridad y limitaciones

[Prerrequisitos exactos](r7-block-11/prerequisites.json): B0#74, B1#75, B2#78, B3#79/correctiva#82, B4#83, B5#84, B6#85, B7#76, B8#77, B9#80 y B10#81 están MERGED y son ancestros de la base. No se hace merge/replay de ramas ajenas para este PR. B11 integra sus componentes una vez; no duplica `PushSettings` ya adelantado por autorización en B10. Modal inline Stories no requiere nueva ruta.

Archivos productivos alterados: `EventDetailPage.tsx`, `EventParticipation.tsx`, `EventManagement.tsx`, `EventLinkPanel.tsx` y dos reglas de separación en `discovery.css`. Callbacks opcionales conservan consumidores; no APIs/RPC/SQL nuevas, no SW distinto. El ajuste del test multimedia y los nuevos runners/documentos son QA. Mockup y contratos R1–R6 intactos; `.env.local` igual a main, ignorado, sin valores en evidencia. Sin nuevos secretos ni datos privados en logs/PR.

No se descubrió acceso indebido en las capas ejecutadas. Permisos HTTP/JWT y bytes por transporte real quedan sin acreditar. RLS/ACL/search_path, exclusividad, separación de legacy/avatar/galería y DM texto-only se verifican localmente; ningún mock acredita despliegue o autorización productiva.

Inventario de limitaciones:

- Windows + Edge headless sólo. Chrome/Firefox, Edge interactivo, Android Chrome, iOS/Safari tab y PWA instalada, safe areas/teclado/gestos físicos y lector de pantalla real: NOT RUN.
- Selector nativo Web Share, importación ICS en calendario final y guardado Google: NOT RUN. No OAuth ni sincronización; la UI no afirma guardado/envío.
- GET/sign/list/HEAD/transforms con siete JWT reales, remoción real y T+23:59:59/T+24:00:00 por transporte: NOT RUN B11. Bytes ya descargados no son remotamente revocables.
- B6 acredita migración pero no deploy de cleanup, secreto/cron ni DELETE físico. Verificar/desplegar `r7-story-image` con autorización específica para ensayar lectura real; su estado desplegado no fue acreditado en B11.
- Push B10 tiene deploy y una recepción humana histórica. No cron autorizado: no promesa de dispatcher continuo. Dos dispositivos, preview oculta, logout/cambio de cuenta, fallo de proveedor y bandeja en dispositivos reales: NOT RUN B11.
- Backlog/costo, límites/cuota de Storage y recursos huérfanos reales: no medidos. GC tiene límites de trabajo y preservación de referencias probados localmente; no máximo de historias de producto. No SLA nuevo.
- Actualización de SW de una instalación anterior a este build: NOT RUN; se probó registro/offline y eventos sintéticos actuales. Sin caché privada de Supabase.
- Las advertencias heredadas de lint/Mapbox y asesores remotos históricos no se modificaron para silenciarlas. No se reabrieron pendientes R6.

## 5. Acta y GO/NO-GO humano

**Recomendación técnica:** NO-GO para aceptación integral por25 CA con gates pendientes. **Aceptación/firma humana:** PENDIENTE. **Fecha/identidad del responsable:** PENDIENTE. **Excepciones aceptadas:** ninguna atribuida. **Autorización para merge/deploy/SQL/secrets/cron:** NO concedida por esta entrega.

La revisión humana puede aprobar la composición del PR y autorizar ensayos/operación por separado. El cierre R7 requiere evidencia restante o excepciones formales explícitas, más aceptación humana; no se fabrica una firma. Entregado exclusivamente B11. No se continúa con otro bloque.


## Actualización operativa autorizada: lector de historias

17/10/2026: el reporte de historia recién publicada que no abre permitió confirmar r7-story-image ausente (404). El responsable autorizó «desplega»: lector existente desplegado ACTIVE v1 con verify_jwt=true; OPTIONS204 y GET sin sesión401. [Evidencia y límites](r7-block-11/story-reader/README.md). Esta actualización resuelve la ausencia del endpoint; lectura autenticada/confirmación visual pendientes. Las menciones anteriores a lector no acreditado describen el corte inicial. Sin migraciones, secretos, cron, merge ni otros deploys.
