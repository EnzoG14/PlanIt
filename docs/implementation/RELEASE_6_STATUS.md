# PlanIt — R6 seguimiento de ejecución

**Estado global:** **B8 Implementado; QA pendiente** (15/10/2026), derivado de main sin B7 (PR #70 sin integrar; su fila y bitácora llegan con ese PR). Bloques con entrega propia en main/PR: B0–B6 y B8. [Evidencia B8](../qa/r6-block-8/README.md). Estado previo: **B6 Implementado; QA pendiente**. Bloques con entrega: **7 (B0–B6)**. RF completos: **0/6**. CA aceptados integralmente: **0/24**. B0–B5 integrados en main; B6 añade productor transaccional privado `event_full`, sin UI nueva. Migración B6 **1/1/1/1**, aplicada y verificada remotamente por autorización posterior. [Evidencia B6](../qa/r6-block-6/README.md). B7 no iniciado; sin merge ni deploy en B6. Cortes anteriores históricos.

**Baseline comprobado B6:** `main` SHA `9ba2f687cfad0ad0997d8d5a9c7f8eca83659dc1` (15/10/2026), fetch y PR #68 MERGED comprobados. La fotografía B0 era `66e24d85f32123ecd70f457f8381c68ae5af1603`. **Dependencia R5:** `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` registran **GO por aceptación humana, estado Validado**. Pruebas automáticas/JWT/Realtime que no se ejecutaron siguen documentadas como tal. **Acuerdos A01–A07 aprobados; B0–B6 entregados, sin aceptación integral R6.**

| Bloque | Objetivo | Estado | Rama/PR | SHA base | Migración (creada/local/remota/verificada) | Pruebas y CA | Aprobación para siguiente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría, contratos, decisiones | Implementado; QA/firma humana pendientes | codex/r6-block-0; [PR #63 draft](https://github.com/EnzoG14/PlanIt/pull/63) | ad9327fff5aca65e6b676a56f1e1e93737102f32 | 0/0/0/0 | 18 checks baseline; build/lint PASS; 24 CA NOT RUN | NO |
| 1 | RPC ocupación owner-only | Implementado; QA pendiente | codex/r6-block-1; [PR #64 draft](https://github.com/EnzoG14/PlanIt/pull/64) | 1ee60e3a1636c0ec181782343100d44b5f08be1e | 1/1/1/1 | RF-R6-01 CA01–04 parcial SQL; contrato/build/lint PASS; JWT/UI NOT RUN | NO |
| 2 | Panel KPI | Implementado; QA pendiente | codex/r6-block-2; [PR #65 draft](https://github.com/EnzoG14/PlanIt/pull/65) | 7933aa9 | 0/0/0/0 | RF-R6-01 CA01–04 UI fixtures; JWT real pendiente | NO |
| 3 | Demográficos privados | Implementado; QA pendiente | codex/r6-block-3; [PR #66 draft](https://github.com/EnzoG14/PlanIt/pull/66) | e6a25a1 | 1/1/1/1 | RF-R6-02 CA01/03/04 parcial SQL/UI fixtures; CA02 B4; JWT real NOT RUN | NO |
| 4 | Períodos y series | Implementado; QA pendiente | codex/r6-block-4; [PR #67 draft](https://github.com/EnzoG14/PlanIt/pull/67) | 25685f0 | 1/1/1/1 | RF-R6-03 CA01–04 + R6-02 CA02 parcial SQL/UI; JWT real NOT RUN | NO |
| 5 | CSV seguros | Implementado; QA pendiente | codex/r6-block-5; [PR #68 draft](https://github.com/EnzoG14/PlanIt/pull/68) | edaa0c5 | 1/1/1/1 | RF-R6-04 CA01–04 parcial SQL/contrato/UI fixtures; HTTP/Excel/dispositivos NOT RUN | NO |
| 6 | Trigger aviso lleno | Implementado; QA pendiente | codex/r6-block-6; [PR #69 draft](https://github.com/EnzoG14/PlanIt/pull/69) | 9ba2f68 | 1/1/1/1 | RF-R6-05 CA01/03/04 parcial SQL local; HTTP/Realtime NOT RUN | NO |
| 7 | Bandeja aviso | NO INICIADO | — | — | 0/0/0/0 | RF-R6-05 | NO |
| 8 | Comparación | Implementado; QA pendiente | codex/r6-block-8; PR draft (ver bitácora) | 9311c01 | 1/1/0/0 | RF-R6-06 CA01–04 parcial SQL local/UI fixtures; HTTP JWT real NOT RUN | NO |
| 9 | QA integral | NO INICIADO | — | — | 0/0/0/0 | 24 CA y regresión | NO |

## Plantilla de bitácora por bloque

### B1 — 15/10/2026, Codex

- Base integrada `1ee60e3a1636c0ec181782343100d44b5f08be1e` tras fetch: PR #63 fusionada. La instrucción humana de este chat autoriza B1; no se atribuye firma integral a B0. R5 GO humano conservado; A01–A07 sin cambios, D01 representada según contrato B0. D04 no interviene en ocupación.
- Worktree y rama nuevos, cambios ajenos preservados; `.env.local` copiado de main local e ignorado. Migración `20261015130739`: creada1 / replay local1 / remota0 / verificada remota0.
- RPC `get_my_event_occupancy(uuid) → jsonb`, STABLE DEFINER, ownership servidor, `search_path=''`, EXECUTE sólo authenticated. Sin nuevas tablas, triggers, políticas, índices ni grants de lectura. Contrato/parser/adaptador y formato en `src/features/analytics`.
- PostgreSQL18.4 local, 31 migraciones desde cero, permisos A/B/C/D/anon, 72 audiencias sociales/13 carreras heredadas y pruebas nuevas de fórmulas, estados, acceso y última plaza. EXPLAIN/20 muestras por tamaño0/1/10/100/1000. Auth/Storage scaffold; HTTP JWT real/Realtime/dispositivos NOT RUN. UI no modificada: mockups y DESIGN intactos.
- [Evidencia, matriz CA, comandos y límites](../qa/r6-block-1/README.md). B2 requiere aprobación humana independiente; sin merge ni ejecución remota.

### B0 — 15/10/2026, Codex

- Base integrada PR #62; merges #50–#60 y #61 comprobados en Git; R5 GO humano conservado. Checkout original con cambios ajenos intacto; worktree nuevo y env copiado desde main, ignorado.
- Catálogo remoto READ ONLY: 30 versiones sincronizadas, PostgreSQL17.11, 16 tablas públicas con RLS, 82 funciones; funciones/ACL/triggers y esquema coinciden con snapshot B10. Dry-run skip-vault sin pendientes; 0 aplicaciones.
- Fuente original releída: 24 CA coinciden literalmente; traza a contratos futuros y fixtures sintéticos, sin CA aceptados. [Resultados por capa](../qa/r6-block-0/README.md).
- A01–A07 conservados. D03/D05/D06/D08/D11 precisados como propuesta para firma. D04 sigue bloqueante B3/B5: k y supresión complementaria no resuelven inferencia temporal/multievento. D12 dependencia superada; permiso B1 pendiente.
- Sin cambios de UI/mockup, SQL de producto o migraciones; no se implementó B1 ni se editaron fuentes normativas/Google Doc.

### Formato para próximos bloques

- Fecha/actor, fuente SHA y `git status`, dependencias y decisión aprobada.
- Cambios precisos, inventario de archivos, firmas RPC y RLS/ACL, migraciones.
- Migraciones **creadas** / **validadas en local** / **aplicadas remotas con permiso** / **verificadas remotas**, con sus versiones y pruebas.
- Casos CA y resultados por capa SQL local, HTTP JWT real, UI, Realtime, PWA, accesibilidad: `PASS/FAIL/NOT RUN/BLOCKED`.
- Evidencias en `docs/qa/r6-block-N/`, capturas y SHA de fixtures sin tokens ni PII real.
- Riesgos abiertos, autorización humana para avanzar, estado del PR y decisión GO/NO-GO.

**No cambiar «Implementado; QA pendiente» a «Validado» sin pruebas completas y aprobación humana expresa.**

### B8 — 15/10/2026, Codex

- Base limpia `9311c0142e4c945656e8aa0fe9c89c1a37b4135b` (`origin/main`, tras fetch; PR #69 MERGED). Rama nueva `codex/r6-block-8` desde main; B7 (#70) no integrada y no requerida. `.env.local` de main conservado e ignorado. Pedido humano autoriza sólo B8; D09/D10 y A01–A07 conservados.
- RPC `get_my_events_occupancy(uuid[])→jsonb`, STABLE DEFINER, `search_path=''`, EXECUTE authenticated; 2–10 IDs únicos, ownership de todos antes de agregar (mezcla rechaza todo con un único error), misma fórmula/estado que B1, capacidad inválida → N/D. Sin tablas/triggers/políticas/índices/grants de lectura.
- Ruta `/my-events/compare` bajo auth con acceso secundario desde Mis eventos (sin dock nuevo): selector con filtros que conservan la selección, tabla/tarjetas accesibles, anti-carrera por clave de selección + abort + timeout, estados loading/empty/invalid/error/retry. DESIGN.md intacto.
- Migración `20261015210000`: **1 creada / 1 probada local / 0 aplicada remota / 0 verificada remota**. SQL PostgreSQL17.5, contrato y UI (seis anchos) PASS; HTTP JWT real/Realtime/dispositivos NOT RUN. Dos fallos de regresión preexistentes documentados. [Evidencia](../qa/r6-block-8/README.md). Sin DDL remoto, merge, deploy ni B9.

### B6 — 15/10/2026, Codex

- Base integrada `9ba2f687cfad0ad0997d8d5a9c7f8eca83659dc1`; fetch y PR #68 MERGED comprobados. Rama nueva `codex/r6-block-6`; checkout inicialmente limpio, `.env.local` de main local conservado e ignorado en el mismo directorio. La instrucción humana autoriza sólo B6; R5 GO y A01–A07/D07 conservados.
- `planit_private.notify_event_full()→trigger`, INVOKER, search_path vacío, sin EXECUTE de clientes; `participations_notify_event_full` AFTER INSERT/UPDATE status. Reutiliza RPC autorizadas y lock evento→participación, sin nuevas RPC/tablas/contadores/índices/políticas ni grants de lectura. Historial y firmas existentes intactos. Aviso owner-only genérico, event_id real, actor/conversation NULL.
- Dedupe por transición real confirmed y serialización: reintento no cambia estado; cada lleno→libre→lleno por inscripción/aprobación permite nuevo aviso. Edición de capacidad y eventos cerrados no notifican. Cualquier fallo de INSERT revierte confirmación/historial/resolución.
- Migración `20261015185020`: **creada1 / probada local1 / aplicada remota0 / verificada remota0**. PostgreSQL17.5 replay35; 41 grupos SQL con ocho carreras B6 observadas, rollback inyectado, roles A/B/C/D/anon/sin UID, catálogo ACL/RLS e índices existentes y benchmark20 muestras×5 tamaños. Build/lint PASS con advertencias previas. [Evidencia, regresiones y límites](../qa/r6-block-6/README.md).
- RF-R6-05 CA01/03/04 parcial SQL local; CA02/bandeja/Realtime quedan B7. HTTP JWT real, UI/Realtime/PWA/dispositivos y aceptación integral NOT RUN. Sin cambio visual, DDL remoto, merge, deploy o Google Docs. Estado **Implementado; QA pendiente**; B7 requiere autorización humana independiente.
- Cierre B6: commit funcional `3932449`; [PR #69 draft](https://github.com/EnzoG14/PlanIt/pull/69). El commit documental posterior enlaza la entrega; HEAD final consultable en Git/PR. 11 suites SQL R5 + 16 regresiones R1–R5 + cuatro aisladas PASS; se conservan las marcas de intentos previos por catálogos/scaffold. `.env.local` sigue ignorado y no versionado.

### B6 — Aplicación remota autorizada posterior, 15/10/2026

- Por solicitud humana «aplica la migracion remota por favor» se aplicó únicamente `20261015185020_r6_event_full_notifications.sql` en planit-v2 (`iepeqmvzjguwlhnecsdq`). Dry-run previo: una pendiente; posterior: ninguna; historial35/35 sincronizado. Sin seeds/roles/Vault, merge, deploy ni B7.
- Marcas **1 creada / 1 probada local / 1 aplicada remota autorizada / 1 verificada remota**. PostgreSQL17.11: cuerpo SQL igual al versionado normalizando CRLF; trigger activo e historial preservado, INVOKER/search_path/ACL y RLS recipient-only verificados. Llamada directa authenticated denegada42501 en READ ONLY/ROLLBACK; no se escribieron fixtures ni avisos de prueba.
- Asesores: sin nuevos hallazgos, se mantienen50 WARN y1 INFO previos. [Acta y evidencia](../qa/r6-block-6/remote/summary.json). HTTP/JWT real, entrega Realtime y aceptación integral siguen NOT RUN; estado Implementado; QA pendiente. Los cortes locales anteriores conservan su fotografía de entrega.

### B4 — 15/10/2026, Codex

- Base integrada `25685f04c03c5ac308fc563f2a8e565e6987f39e`, fetch y merge #66 comprobados; R5 GO humano conservado. Rama/worktree nuevos, env de main local copiado e ignorado, cambios ajenos preservados.
- Responsable aprueba [D03 propuesta B0](RELEASE_6_BLOCK_4_DECISIONS.md) en este chat; D02 mantiene altas/reincorporaciones/bajas, sin stock/check-in. No se modifican RF/CA ni mockups/DESIGN.
- Commit funcional `93ecd66ae5a179973bf435395b792a92108a7c09`; [PR #67 draft](https://github.com/EnzoG14/PlanIt/pull/67). Commit posterior de documentación vincula el cierre; HEAD final en Git/PR.
- `get_my_event_participation_series(uuid,timestamp,timestamp,text)→jsonb`, STABLE DEFINER, UID/ownership antes de agregar, search_path vacío y EXECUTE authenticated. Sin grants de tablas, PII, tablas/triggers/índices nuevos. Migración `20261015162953`: **creada1 / probada local1 / aplicada remota0 / verificada remota0**.
- Selector inicial30, presets7/30/90 y personalizado≤366, días/semanas lunes/parciales AR; gráfico tres flujos y tabla accesible, estados y validación, remount por clave/abort/guardia contra respuestas tardías. KPI/demografía continúan actuales.
- Build/lint/contratos y replay33 PostgreSQL local PASS; UI compilada Edge con fixtures en seis anchos, texto200%, timeout/offline/retorno/logout; [evidencia, regresiones y límites](../qa/r6-block-4/README.md). HTTP JWT real, Realtime/dispositivos/lector y aceptación integral NOT RUN. B5 requiere aprobación independiente; no DDL remoto, merge, deploy ni Google Docs.

### B1 — Aplicación remota autorizada posterior, 15/10/2026

Por instrucción humana se aplicó la única pendiente 20261015130739 en planit-v2. Marcas actualizadas a **1/1/1/1**; 31 versiones sincronizadas, dry-run vacío, cuerpo SQL coincidente, ACL/STABLE/search_path y RLS verificados READ ONLY. Rechazo sin UID comprobado. [Evidencia remota y asesores](../qa/r6-block-1/README.md#aplicación-remota-autorizada--15102026). JWT funcional real sigue NOT RUN; no implica aceptación integral ni permiso B2. Las entradas anteriores conservan la fotografía de entrega local.

### B2 — 15/10/2026, Codex

- Base `7933aa9`, merge PR #64 comprobado tras fetch. Pedido humano autoriza sólo B2; B3 sigue pendiente. Rama nueva `codex/r6-block-2`, env de main copiado e ignorado.
- Ruta lazy protegida, acceso contextual owner, cuatro KPI, barra accesible con equivalente textual, estado/hora Argentina, refresh/retry. Remount usuario/token/evento, abort/timeout10s, limpieza offline/pestaña oculta/error/logout; sin cache privada ni títulos ajenos.
- RPC B1 y ACL sin cambios, cero migraciones B2 (0/0/0/0). Amanecer y mockup original revisados, DESIGN intacto. Sin R6-02 ni siguientes bloques.
- Build/lint y contrato PASS; UI compilada con fixtures y regresiones SQL en [evidencia B2](../qa/r6-block-2/README.md). JWT real/Realtime/dispositivos/aceptación integral NOT RUN; no extrapolar permisos remotos desde mocks. Estado Implementado; QA pendiente.

### B3 — 15/10/2026, Codex

- Base integrada `e6a25a1f81a6c25ab4694fc4c16cf695e8ab6dfa` tras fetch; merge #65 y dependencia #64 comprobados. Rama/worktree nuevos `codex/r6-block-3`; env copiado desde main local e ignorado. Cambios ajenos preservados.
- [Adenda aprobada](RELEASE_6_BLOCK_3_DECISIONS.md): responsable elige estadísticas exactas/actualizadas aceptando riesgo residual de inferencia temporal/multievento; D08 ratificada. La garantía absoluta previa D04 queda reemplazada expresamente. Umbral técnico k5, supresión completa por dimensión si alguna celda positiva<5, incluido unknown. No exportaciones ni cambios de alcance B5.
- RPC `get_my_event_demographics(uuid)→jsonb`, STABLE DEFINER, ownership antes de lectura privada, search_path vacío, EXECUTE authenticated; sin grants nuevos de lectura/tablas/triggers/índices. Migración `20261015160324`: **1 creada / 1 probada local / 0 aplicada remota / 0 verificada remota**.
- Tablas y barras accesibles Amanecer, edad al día AR, sexo declarado y faltantes; empty/suppressed/error diferenciados, refresh y limpieza privada reutilizados de B2. Mockups/ DESIGN intactos. Sin B4/CSV/Realtime nuevos.
- Build/lint y DTO PASS; replay PostgreSQL18.4, regresión R5 social y pruebas específicas SQL PASS; UI Edge con fixtures seis anchos, texto200%, altura corta, timeout/logout/offline PASS. Riesgo temporal/multievento reproducido como límite aceptado, no prueba de anonimato. [Evidencias, rendimiento y límites](../qa/r6-block-3/README.md). HTTP/JWT real, dispositivos, lector real y aceptación integral NOT RUN. B4 requiere permiso humano independiente; no merge/deploy/DDL remoto.

- Cierre B3: commit funcional `ae9a0fea8a33bd3897188355108bd6b92dc096b5`; [PR #66 draft](https://github.com/EnzoG14/PlanIt/pull/66). El commit documental posterior sólo vincula PR/SHA; HEAD final disponible en Git/PR. Worktree limpio al cerrar; env continúa ignorado.

### B3 — Aplicación remota autorizada posterior, 15/10/2026

- Por solicitud humana se aplicó únicamente `20261015160324_r6_demographic_aggregates.sql` en planit-v2 (`iepeqmvzjguwlhnecsdq`). Dry-run previo: una pendiente; posterior: sin pendientes, 32/32 versiones sincronizadas. Sin seeds/roles/Vault, merge, deploy o B4.
- Marcas **1 creada / 1 probada local / 1 aplicada remota autorizada / 1 verificada remota**. PostgreSQL17.11: cuerpo remoto igual al SQL versionado; STABLE/DEFINER/search_path/ACL, RLS público y rechazo sin UID/evento NULL PASS en transacción READ ONLY. HTTP JWT real y aceptación integral siguen NOT RUN.
- Asesores: 47→48 WARN; nuevo aviso por RPC DEFINER ejecutable por authenticated (intencional y protegida por ownership). Persiste aviso previo de contraseñas filtradas. [Evidencia remota](../qa/r6-block-3/remote/summary.json). Cortes locales anteriores conservados como historia.

### B4 — Aplicación remota autorizada posterior, 15/10/2026

- Pedido humano: «hace las migraciones a la base remota». Aplicada únicamente `20261015162953_r6_participation_series.sql` en planit-v2 (`iepeqmvzjguwlhnecsdq`); dry-run previo una pendiente, posterior ninguna; 33/33 versiones sincronizadas. Sin seeds/roles/Vault, merge, deploy o B5.
- Marcas **1 creada / 1 probada local / 1 aplicada remota autorizada / 1 verificada remota**. Cuerpo remoto igual al versionado; STABLE/DEFINER/search_path/ACL, RLS público, rechazo sin UID/evento NULL PASS en READ ONLY/ROLLBACK. HTTP JWT real e integral NOT RUN.
- Asesores seguridad48→49 WARN: nuevo aviso por RPC DEFINER authenticated, intencional y protegida por ownership. [Acta y evidencia](../qa/r6-block-4/remote/summary.json). Cortes locales anteriores conservados como historia.


### B5 — 15/10/2026, Codex

- Base integrada `edaa0c5bc8785dad371736be8e16d693966fb4cf`, fetch y merges #63–#67 comprobados; R5 GO humano conservado. Pedido humano autoriza sólo B5. Rama nueva `codex/r6-block-5` desde origin/main, checkout inicialmente limpio; `.env.local` de main conservado intacto e ignorado al usar el mismo directorio.
- [Adenda aprobada D05/D06](RELEASE_6_BLOCK_5_DECISIONS.md): snapshot único sobre paginación, 5.000filas/10MiB/15s; asistentes confirmed actuales con máscara R5 y primera inscripción, estadísticas desde la misma respuesta B4 mostrada. Sin demografía, IDs técnicos en archivos ni nuevas dependencias. D04 y DESIGN intactos.
- `get_my_event_export_rows(uuid)→jsonb`, STABLE DEFINER, UID/ownership antes de lectura, search_path vacío y EXECUTE authenticated; sin nuevos grants de tablas/políticas/triggers/índices. Migración `20261015173426`: **creada1 / probada local1 / aplicada remota0 / verificada remota0**.
- Serializador UTF8 BOM/;/CRLF/quoted, neutralización reversible de fórmulas; límites JSON/CSV, validación de contexto y sesión, cancelación/timeout/limpieza, sin archivo ante vacío/error. Dos CTA Amanecer y cancelación; no rediseño.
- Build/lint PASS (advertencias previas); PostgreSQL17.5 local replay34 y 29 checks con regresión R5; parser Python independiente y 5 grupos de contrato; Edge production 14 checks en seis anchos, descargas reales con fixtures, texto200%, foco, reduced-motion, límites y cancelaciones. [Evidencias, CA, benchmarks y límites](../qa/r6-block-5/README.md).
- HTTP/JWT real, Excel, PWA instalada/dispositivos, zoom real/lector y aceptación integral NOT RUN; no certificarlos desde fixtures. Estado Implementado; QA pendiente. PR/commit funcional enlazados al cierre; HEAD final en Git/PR. B6 requiere autorización independiente; sin DDL remoto/merge/deploy/Google Docs.

- Cierre B5: commit funcional `c574440b133c24e52fff98df225eb4c892146f42`; [PR #68 draft](https://github.com/EnzoG14/PlanIt/pull/68). El commit documental posterior vincula la entrega; HEAD final disponible en Git/PR. `.env.local` no versionado; migración remota sigue0.


### B5 — Aplicación remota autorizada posterior, 15/10/2026

- Por solicitud humana se aplicó únicamente `20261015173426_r6_export_projection.sql` en planit-v2 (`iepeqmvzjguwlhnecsdq`). Dry-run previo una pendiente; posterior ninguna; historial34/34 sincronizado. Sin seeds/roles/Vault, merge, deploy ni B6.
- Marcas **1 creada / 1 probada local / 1 aplicada remota autorizada / 1 verificada remota**. PostgreSQL17.11: cuerpo remoto coincide con el SQL versionado normalizando CRLF; STABLE/DEFINER/search_path/ACL y RLS público verificados. Rechazo sin UID y evento NULL como authenticated comprobado en transacción READ ONLY/ROLLBACK. No se exportaron datos de negocio.
- Asesores seguridad49→50 WARN: nuevo aviso de RPC DEFINER ejecutable por authenticated, intencional y protegida por ownership; sin cambios adicionales de permisos. [Acta y evidencia](../qa/r6-block-5/remote/summary.json). HTTP/JWT real y aceptación integral siguen NOT RUN. Las marcas locales en entradas anteriores conservan la fotografía de entrega.
