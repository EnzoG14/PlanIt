# PlanIt — R6 seguimiento de ejecución

**Estado global:** **B4 Implementado; QA pendiente** (15/10/2026). Bloques con entrega: **5 (B0–B4)**. RF completos: **0/6**. CA aceptados integralmente: **0/24**. B0–B3 integrados; B4 base `25685f0` añade RPC owner-only de movimientos, selector y gráfico/tabla accesibles. Migración B4 sólo creada/probada local (1/1/0/0). [Evidencia B4](../qa/r6-block-4/README.md), [D03 aprobada](RELEASE_6_BLOCK_4_DECISIONS.md). Sin deploy ni avance a B5; cortes anteriores históricos.

**Baseline comprobado:** `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026). **Dependencia R5:** `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` registran **GO por aceptación humana, estado Validado**. Pruebas automáticas/JWT/Realtime que no se ejecutaron siguen documentadas como tal; B0 revalida integración de PR #60 y entorno. **Acuerdos A01–A07 aprobados; B0–B2 entregados, sin aceptación integral.**

| Bloque | Objetivo | Estado | Rama/PR | SHA base | Migración (creada/local/remota/verificada) | Pruebas y CA | Aprobación para siguiente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría, contratos, decisiones | Implementado; QA/firma humana pendientes | codex/r6-block-0; [PR #63 draft](https://github.com/EnzoG14/PlanIt/pull/63) | ad9327fff5aca65e6b676a56f1e1e93737102f32 | 0/0/0/0 | 18 checks baseline; build/lint PASS; 24 CA NOT RUN | NO |
| 1 | RPC ocupación owner-only | Implementado; QA pendiente | codex/r6-block-1; [PR #64 draft](https://github.com/EnzoG14/PlanIt/pull/64) | 1ee60e3a1636c0ec181782343100d44b5f08be1e | 1/1/1/1 | RF-R6-01 CA01–04 parcial SQL; contrato/build/lint PASS; JWT/UI NOT RUN | NO |
| 2 | Panel KPI | Implementado; QA pendiente | codex/r6-block-2; [PR #65 draft](https://github.com/EnzoG14/PlanIt/pull/65) | 7933aa9 | 0/0/0/0 | RF-R6-01 CA01–04 UI fixtures; JWT real pendiente | NO |
| 3 | Demográficos privados | Implementado; QA pendiente | codex/r6-block-3; [PR #66 draft](https://github.com/EnzoG14/PlanIt/pull/66) | e6a25a1 | 1/1/1/1 | RF-R6-02 CA01/03/04 parcial SQL/UI fixtures; CA02 B4; JWT real NOT RUN | NO |
| 4 | Períodos y series | Implementado; QA pendiente | codex/r6-block-4; PR draft por vincular | 25685f0 | 1/1/0/0 | RF-R6-03 CA01–04 + R6-02 CA02 parcial SQL/UI; JWT real NOT RUN | NO |
| 5 | CSV seguros | NO INICIADO | — | — | 0/0/0/0 | RF-R6-04 | NO |
| 6 | Trigger aviso lleno | NO INICIADO | — | — | 0/0/0/0 | RF-R6-05 parcial | NO |
| 7 | Bandeja aviso | NO INICIADO | — | — | 0/0/0/0 | RF-R6-05 | NO |
| 8 | Comparación | NO INICIADO | — | — | 0/0/0/0 | RF-R6-06 | NO |
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

### B4 — 15/10/2026, Codex

- Base integrada `25685f04c03c5ac308fc563f2a8e565e6987f39e`, fetch y merge #66 comprobados; R5 GO humano conservado. Rama/worktree nuevos, env de main local copiado e ignorado, cambios ajenos preservados.
- Responsable aprueba [D03 propuesta B0](RELEASE_6_BLOCK_4_DECISIONS.md) en este chat; D02 mantiene altas/reincorporaciones/bajas, sin stock/check-in. No se modifican RF/CA ni mockups/DESIGN.
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
