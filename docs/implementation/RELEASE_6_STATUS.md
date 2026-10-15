# PlanIt — R6 seguimiento de ejecución

**Estado global:** **Sólo planificado** (14/10/2026). Bloques ejecutados: **0**. RF completos: **0/6**. CA aceptados integralmente: **0/24**. Sin código de R6, migraciones R6, deploy ni PR generados por este paquete. La fuente de verdad para avances futuros son evidencias reales, no checklists tildadas sin correr pruebas.

**Baseline comprobado:** `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026). **Dependencia R5:** `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` registran **GO por aceptación humana, estado Validado**. Pruebas automáticas/JWT/Realtime que no se ejecutaron siguen documentadas como tal; B0 revalida integración de PR #60 y entorno. **Acuerdos A01–A07 aprobados; bloques R6 aún no ejecutados.**

| Bloque | Objetivo | Estado | Rama/PR | SHA base | Migración (creada/local/remota/verificada) | Pruebas y CA | Aprobación para siguiente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría, contratos, decisiones | NO INICIADO | — | — | 0/0/0/0 | Auditoría pendiente | NO |
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

- Fecha/actor, fuente SHA y `git status`, dependencias y decisión aprobada.
- Cambios precisos, inventario de archivos, firmas RPC y RLS/ACL, migraciones.
- Migraciones **creadas** / **validadas en local** / **aplicadas remotas con permiso** / **verificadas remotas**, con sus versiones y pruebas.
- Casos CA y resultados por capa SQL local, HTTP JWT real, UI, Realtime, PWA, accesibilidad: `PASS/FAIL/NOT RUN/BLOCKED`.
- Evidencias en `docs/qa/r6-block-N/`, capturas y SHA de fixtures sin tokens ni PII real.
- Riesgos abiertos, autorización humana para avanzar, estado del PR y decisión GO/NO-GO.

**No cambiar «Implementado; QA pendiente» a «Validado» sin pruebas completas y aprobación humana expresa.**
