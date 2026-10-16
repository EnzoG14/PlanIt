# PlanIt — Release 7 · Seguimiento

**Fecha de preparación documental:** 15/10/2026. **Última actualización:** 16/10/2026. **Estado global:** B0 AUDITADO / ENTREGADO PARA REVISIÓN HUMANA / CONTRATOS TÉCNICOS PROPUESTOS v1. **QA funcional R7:** NOT RUN.
**Baseline de alcance:** R6 se supone funcionalmente completa, por instrucción de planificación; no se corrigen tareas residuales de R6.

| Bloque | Estado | Rama/PR | Migración creada | SQL local | Remoto aplicado | Remoto verificado | HTTP/JWT | UI | Evidencia | Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| B0 | Auditoría entregada; firma humana pendiente | `codex/r7-block-0` / PR draft por registrar | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | [Acta](RELEASE_7_BLOCK_0_DECISIONS.md), [37/37 checks documentales](../qa/r7-block-0/audit.json) | NO-GO siguiente bloque |
| B1 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B2 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B3 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B4 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B5 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B6 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B7 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B8 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B9 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B10 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |
| B11 | Pendiente | — | 0 | NOT RUN | 0 | 0 | NOT RUN | NOT RUN | — | NO-GO |

## RF/CA

| RF | CA oficiales | PASS | FAIL | NOT RUN/BLOCKED | Estado |
|---|---:|---:|---:|---:|---|
| RF-R7-01 | 4 | 0 | 0 | 4 | NO VALIDADO |
| RF-R7-02 | 4 | 0 | 0 | 4 | NO VALIDADO |
| RF-R7-03 | 4 | 0 | 0 | 4 | NO VALIDADO |
| RF-R7-04 | 4 | 0 | 0 | 4 | NO VALIDADO |
| RF-R7-05 | 4 | 0 | 0 | 4 | NO VALIDADO |
| RF-R7-06 | 4 | 0 | 0 | 4 | NO VALIDADO |
| RF-R7-07 | 5 | 0 | 0 | 5 | NO VALIDADO |

## Cambios de estado

### 16/10/2026 — B0, auditoría documental

Base `origin/main` **f8dd53c136fb30fbef5f3b2d9fa7cf0359923974** tras fetch; #73 planificación y #72 cierre R6 integradas. Worktree nuevo `r7-block-0-worktree`, rama `codex/r7-block-0`; `.env.local` copiado desde main e ignorado, sin versiones ni contenido en evidencia. Checkout inicial y sus cambios ajenos preservados.

Entregados [acta](RELEASE_7_BLOCK_0_DECISIONS.md), [contratos v1](RELEASE_7_BLOCK_0_CONTRACTS.md), [amenazas/matriz de permisos](RELEASE_7_BLOCK_0_THREAT_MODEL.md), [catálogo fresco](../qa/r7-block-0/catalog.json), [trazabilidad/hash de 29 CA](../qa/r7-block-0/traceability.json) y [reproducción](../qa/r7-block-0/README.md). Google Doc vigente: 7 descripciones y29 CA coinciden literalmente. Catálogo READ ONLY:37 migraciones sincronizadas,16 tablas públicas RLS,88 funciones,2 buckets privados,publicación sólo messages/notifications. Edge sólo social-avatar; sin cron/pg_net instalados. Helpers Storage por operación instalados; bloqueo real de firma/GET exige prueba B1.

`node docs/qa/r7-block-0/verify.mjs`: **37/37 PASS documentales**. Diff sólo docs; build/lint NOT RUN por no cambiar frontend. SQL propuesta/local, JWT, Storage GET/sign, UI en320/375/390/768/1280, SW/PWA, Push físico, concurrencia, fallos y regresiones R1–R6 **NOT RUN** en este bloque. No se convierten en PASS por inspección. Migraciones R7: **0 creadas / SQL local NOT RUN /0 aplicadas /0 verificadas**. Sin DDL, deploy, secretos, cron, merge ni edición de Google Doc.

D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 siguen confirmadas por responsable15/10. D04/D10–D14/D16/D17 y parámetros técnicos presentados para ratificación; lectura historias en cancelación/archivo explícitamente pendiente antes B4. D10 impide firmar R7 y exige negar uploader despuésTTL; D13 reserva/idempotencia/exclusividad/GC; D17 ownership y versiones. Dos expectativas QA Push contradictorias con D08 corregidas, sin cambiar CA oficiales. Mockup R7 inspeccionado y conservado; B0 no cambia UI.

**R7-B0-TC-01/02/03:** PASS documental (baseline, matriz y diseño frente a CHECK/Storage OR/generateSW). **R7-B0-TC-04:** BLOCKED por firma humana; acta NO-GO preparada. No representa defecto funcional ejecutado ni rechazo del responsable. Se detiene B0 a la espera de revisión/autorización; ningún bloque posterior iniciado.

## Estado de paralelización

| Frente | Bloques | Responsable asignado | Rama/worktree | Prerequisito integrado | Estado | Próximo merge/revisión |
|---|---|---|---|---|---|---|
| Auditoría B0 | B0 | Codex + auditor `audit_contracts` (sólo lectura) | `codex/r7-block-0` / `r7-block-0-worktree`; main `mapbox-worktree` sólo referencia | #73 integrado | ENTREGADA / REVISIÓN HUMANA PENDIENTE | Contratos/gates, sin features |
| Plataforma multimedia | B1 | — | — | B0 | PENDIENTE | — |
| Chat | B2, B3 | — | — | B1 | BLOQUEADO POR CONTRATO | — |
| Historias | B4, B5, B6 | — | — | B1 para B4 | BLOQUEADO POR CONTRATO | — |
| Calendario | B7 | — | — | B0, aprobar contratos (D06 confirmada) | PENDIENTE | — |
| Compartir | B8 | — | — | B0 | PENDIENTE | — |
| Push | B9, B10 | — | — | B0/B9 | PENDIENTE | — |
| Integración + QA | B11 | — | — | PRs productores | BLOQUEADO | — |

No se concede PASS de RF/CA por el simple cierre de un bloque paralelo. La tabla de ownership y DAG están en `RELEASE_7_PARALLEL_WORK.md`.
