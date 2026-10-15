# PlanIt — R6 seguimiento de ejecución

**Estado global:** **B1 Implementado; QA pendiente** (15/10/2026). Bloques con entrega: **2 (B0–B1)**. RF completos: **0/6**. CA aceptados integralmente: **0/24**. RPC y contrato de ocupación implementados localmente; sin migración remota, deploy ni avance a B2. [Contratos B0](RELEASE_6_BLOCK_0_DECISIONS.md), [evidencia B1](../qa/r6-block-1/README.md).

**Baseline comprobado:** `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026). **Dependencia R5:** `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` registran **GO por aceptación humana, estado Validado**. Pruebas automáticas/JWT/Realtime que no se ejecutaron siguen documentadas como tal; B0 revalida integración de PR #60 y entorno. **Acuerdos A01–A07 aprobados; bloques R6 aún no ejecutados.**

| Bloque | Objetivo | Estado | Rama/PR | SHA base | Migración (creada/local/remota/verificada) | Pruebas y CA | Aprobación para siguiente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría, contratos, decisiones | Implementado; QA/firma humana pendientes | codex/r6-block-0; [PR #63 draft](https://github.com/EnzoG14/PlanIt/pull/63) | ad9327fff5aca65e6b676a56f1e1e93737102f32 | 0/0/0/0 | 18 checks baseline; build/lint PASS; 24 CA NOT RUN | NO |
| 1 | RPC ocupación owner-only | Implementado; QA pendiente | codex/r6-block-1; [PR #64 draft](https://github.com/EnzoG14/PlanIt/pull/64) | 1ee60e3a1636c0ec181782343100d44b5f08be1e | 1/1/0/0 | RF-R6-01 CA01–04 parcial SQL; contrato/build/lint PASS; JWT/UI NOT RUN | NO |
| 2 | Panel KPI | NO INICIADO | — | — | 0/0/0/0 | RF-R6-01 | NO |
| 3 | Demográficos privados | NO INICIADO | — | — | 0/0/0/0 | RF-R6-02 | NO |
| 4 | Períodos y series | NO INICIADO | — | — | 0/0/0/0 | RF-R6-03 + R6-02 | NO |
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
