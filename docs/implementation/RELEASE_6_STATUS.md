# PlanIt — R6 seguimiento de ejecución

**Estado global:** **B0 Implementado; QA y firma humana pendientes** (15/10/2026). Bloques con entrega: **1 (B0, auditoría)**. RF completos: **0/6**. CA aceptados integralmente: **0/24**. Sin código funcional ni migraciones R6, deploy o avance a B1. [Contratos B0](RELEASE_6_BLOCK_0_DECISIONS.md), [evidencia](../qa/r6-block-0/README.md).

**Baseline comprobado:** `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026). **Dependencia R5:** `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` registran **GO por aceptación humana, estado Validado**. Pruebas automáticas/JWT/Realtime que no se ejecutaron siguen documentadas como tal; B0 revalida integración de PR #60 y entorno. **Acuerdos A01–A07 aprobados; bloques R6 aún no ejecutados.**

| Bloque | Objetivo | Estado | Rama/PR | SHA base | Migración (creada/local/remota/verificada) | Pruebas y CA | Aprobación para siguiente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría, contratos, decisiones | Implementado; QA/firma humana pendientes | codex/r6-block-0; [PR #63 draft](https://github.com/EnzoG14/PlanIt/pull/63) | ad9327fff5aca65e6b676a56f1e1e93737102f32 | 0/0/0/0 | 18 checks baseline; build/lint PASS; 24 CA NOT RUN | NO |
| 1 | RPC ocupación owner-only | NO INICIADO | — | — | 0/0/0/0 | RF-R6-01 parcial | NO |
| 2 | Panel KPI | NO INICIADO | — | — | 0/0/0/0 | RF-R6-01 | NO |
| 3 | Demográficos privados | NO INICIADO | — | — | 0/0/0/0 | RF-R6-02 | NO |
| 4 | Períodos y series | NO INICIADO | — | — | 0/0/0/0 | RF-R6-03 + R6-02 | NO |
| 5 | CSV seguros | NO INICIADO | — | — | 0/0/0/0 | RF-R6-04 | NO |
| 6 | Trigger aviso lleno | NO INICIADO | — | — | 0/0/0/0 | RF-R6-05 parcial | NO |
| 7 | Bandeja aviso | NO INICIADO | — | — | 0/0/0/0 | RF-R6-05 | NO |
| 8 | Comparación | NO INICIADO | — | — | 0/0/0/0 | RF-R6-06 | NO |
| 9 | QA integral | NO INICIADO | — | — | 0/0/0/0 | 24 CA y regresión | NO |

## Plantilla de bitácora por bloque

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
