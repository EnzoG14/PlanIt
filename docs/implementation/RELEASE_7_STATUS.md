# PlanIt — Release 7 · Seguimiento

**Fecha de preparación documental:** 15/10/2026. **Corte B11:** 17/10/2026. **Estado global:** B0–B10 integrados; B11 composición implementada y QA local ejecutada, [PR draft #86](https://github.com/EnzoG14/PlanIt/pull/86). **Aceptación integral:** NO-GO recomendado; firma humana pendiente. 29 CA evaluados: 4 PASS locales / 25 BLOCKED / 0 FAIL.
**Baseline de alcance:** R6 se supone funcionalmente completa, por instrucción de planificación; no se corrigen tareas residuales de R6.

| Bloque | Estado | Rama/PR | Migración creada | SQL local | Remoto aplicado | Remoto verificado | HTTP/JWT | UI | Evidencia | Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| B0 | Auditoría integrada | `codex/r7-block-0` / [PR #74 integrada](https://github.com/EnzoG14/PlanIt/pull/74) | 0 | Documental PASS | 0 | 0 | Lectura histórica | Sin cambios | [B0](../qa/r7-block-0/README.md) | Integrado; no firma global |
| B1 | Integrado; permisos reales pendientes | `codex/r7-block-1` / [PR #75 integrada](https://github.com/EnzoG14/PlanIt/pull/75) | 1 | PASS47 B11 | 1/1 histórico | Catálogo histórico | BLOCKED integral | Cliente/Edge local | [B1](../qa/r7-block-1/STATUS.md) | NO-GO integral |
| B2 | Integrado | `codex/r7-block-2` / [PR #78 integrada](https://github.com/EnzoG14/PlanIt/pull/78) | 1 | PASS47 B11 | 1/1 histórico | Catálogo histórico | BLOCKED integral | Chat B3 | [B2](../qa/r7-block-2/STATUS.md) | NO-GO integral |
| B3 | Integrado + correctiva #82 | `codex/r7-chat-upload-fix` / [PR #79 integrada](https://github.com/EnzoG14/PlanIt/pull/79) | 4 correctivas | PASS47 B11 | 4/4 histórico | Catálogo histórico | Imagen real confirmada en B3; matriz A–G pendiente | Fixtures B3 PASS histórico | [B3](../qa/r7-block-3/STATUS.md) | NO-GO integral |
| B4 | Integrado | `codex/r7-block-4` / [PR #83 integrada](https://github.com/EnzoG14/PlanIt/pull/83) | 1 | PASS47 B11 | 1/1 histórico | Catálogo histórico | BLOCKED integral | B5 + detalle B11 | [B4](../qa/r7-block-4/STATUS.md) | NO-GO integral |
| B5 | Integrado; visor conectado B11 | `codex/r7-block-5` / [PR #84 integrada](https://github.com/EnzoG14/PlanIt/pull/84) | 0 | B4 | 0 | 0 | BLOCKED integral | Fixtures B11 PASS | [B5](../qa/r7-block-5/STATUS.md) | NO-GO integral |
| B6 | Integrado; worker/cron sin deploy | `codex/r7-block-6` / [PR #85 integrada](https://github.com/EnzoG14/PlanIt/pull/85) | 1 | PASS47 B11 | 1/1 histórico | Catálogo histórico | GC/TTL transporte NOT RUN | Sin cambios propios | [B6](../qa/r7-block-6/STATUS.md) | NO-GO integral |
| B7 | Integrado; conectado B11 | `codex/r7-block-7` / [PR #76 integrada](https://github.com/EnzoG14/PlanIt/pull/76) | 0 | No aplica | 0 | 0 | Sin OAuth | Parser + UI B11 PASS | [B7](../qa/r7-block-7/STATUS.md) | Cliente calendario pendiente |
| B8 | Integrado; conectado B11 | `codex/r7-block-8` / [PR #77 integrada](https://github.com/EnzoG14/PlanIt/pull/77) | 0 | R4 PASS B11 | 0 | 0 | R4 transporte pendiente | Payload/fallback/cancelación fixtures PASS | [B8](../qa/r7-block-8/STATUS.md) | Share nativo pendiente |
| B9 | Integrado; Perfil ya montado por B10 | `codex/r7-block-9` / [PR #80 integrada](https://github.com/EnzoG14/PlanIt/pull/80) | 1 | PASS47 B11 | Historial B10/B6 | Historial47; no recert B11 | Opt-in real B10 histórico | Fixtures + SW B11 PASS | [B9](../qa/r7-block-9/STATUS.md) | Dispositivos pendientes |
| B10 | Integrado; deploy v2 histórico | `codex/r7-block-10` / [PR #81 integrada](https://github.com/EnzoG14/PlanIt/pull/81) | 1 | PASS47 B11 | 1/1 histórico | Catálogo histórico | DM recibido confirmado en B10; sin cron | Fixtures B11 PASS | [B10](../qa/r7-block-10/STATUS.md) | Dos dispositivos pendientes |
| B11 | Implementado; revisión humana pendiente | `codex/r7-block-11` / [PR draft #86](https://github.com/EnzoG14/PlanIt/pull/86) | 0 nuevas | PASS47 + regresiones | 0 nuevas | No ejecutado en B11 | NOT RUN A–G real | 25 grupos integrados +4 suites PASS | [B11](../qa/r7-block-11/README.md) | NO-GO recomendado |

## RF/CA

| RF | CA oficiales | PASS | FAIL | NOT RUN/BLOCKED | Estado |
|---|---:|---:|---:|---:|---|
| RF-R7-01 | 4 | 0 | 0 | 4 BLOCKED | EVALUADO; aceptación pendiente |
| RF-R7-02 | 4 | 0 | 0 | 4 BLOCKED | EVALUADO; aceptación pendiente |
| RF-R7-03 | 4 | 1 | 0 | 3 BLOCKED | EVALUADO; aceptación pendiente |
| RF-R7-04 | 4 | 0 | 0 | 4 BLOCKED | EVALUADO; aceptación pendiente |
| RF-R7-05 | 4 | 3 | 0 | 1 BLOCKED | EVALUADO; aceptación pendiente |
| RF-R7-06 | 4 | 0 | 0 | 4 BLOCKED | EVALUADO; aceptación pendiente |
| RF-R7-07 | 5 | 0 | 0 | 5 BLOCKED | EVALUADO; aceptación pendiente |

[29 criterios y capas](../qa/r7-block-11/CRITERIA.md), [informe integral](../qa/RELEASE_7_TEST_REPORT.md). PASS de navegación/calendario local no es GO humano.

## Cambios de estado

### 17/10/2026 — B11: composición, replay y acta

Entrega técnica `1f1c8d8372f5964ce5a4787bfcf6e6e013c74358`, [PR draft #86](https://github.com/EnzoG14/PlanIt/pull/86). Base `279af15d09988f43a4e79dd397611c645b0b2808` tras fetch; 12 PRs productoras/correctiva MERGED y ancestry comprobadas. Rama nueva `codex/r7-block-11`, worktree independiente. `.env.local` copiado desde main, igual e ignorado, sin versionar. Cambios ajenos del checkout inicial preservados.

Detalle conecta Stories/Calendar/Share; token oculto sólo en diálogo de generación y memoria. Callback de resumen existente evita RPC duplicada. Push ya estaba montado en Perfil por ampliación autorizada B10; no se duplica. Stories modal inline, sin nueva ruta. Sin SQL/API/SW nuevos ni cambios de mockup/identidad Amanecer.

47 migraciones replay local; chat/DM/TTL/GC/cola/subscriptions/validación/handlers, R4 enlaces/accesos, R5 social y R6 compare/event_full PASS por capas. App/router/detalle: 25 grupos en cinco tamaños, capturas antes/después y texto200%. Cuatro suites UI de componentes PASS. Calendario parser independiente, SW offline/no caché privada/eventos sintéticos, build/lint y31 checks documentales PASS. Fallo inicial de expectativa multimedia conservado y corregido verificando dos barreras, sin cambiar SQL. [Comandos/resultados/limitaciones](../qa/r7-block-11/README.md).

25 CA bloqueados por ensayos integrados reales o dispositivo: HTTP/JWT A–G, Storage y frontera TTL, GC físico/cron, selector nativo, cliente calendario, dos dispositivos Push/preview/logout y plataformas. B6 sólo migración aplicada; cleanup sin deploy/cron. B10 recepción de un DM es evidencia histórica, no repetición B11. No SQL remoto/deploy/secretos/cron/merge ni edición Google Doc en esta entrega. NO-GO recomendado, firma humana pendiente; detenerse en B11.


### 16/10/2026 — B0, auditoría documental

Base `origin/main` **f8dd53c136fb30fbef5f3b2d9fa7cf0359923974** tras fetch; #73 planificación y #72 cierre R6 integradas. Worktree nuevo `r7-block-0-worktree`, rama `codex/r7-block-0`; `.env.local` copiado desde main e ignorado, sin versiones ni contenido en evidencia. Checkout inicial y sus cambios ajenos preservados.

Entrega técnica `82b1a68d45a3f7c8b99d4672c081c862ef2468ff`, [PR draft #74](https://github.com/EnzoG14/PlanIt/pull/74). La creación de PR no firma el acta ni autoriza el siguiente bloque.

Entregados [acta](RELEASE_7_BLOCK_0_DECISIONS.md), [contratos v1](RELEASE_7_BLOCK_0_CONTRACTS.md), [amenazas/matriz de permisos](RELEASE_7_BLOCK_0_THREAT_MODEL.md), [catálogo fresco](../qa/r7-block-0/catalog.json), [trazabilidad/hash de 29 CA](../qa/r7-block-0/traceability.json) y [reproducción](../qa/r7-block-0/README.md). Google Doc vigente: 7 descripciones y29 CA coinciden literalmente. Catálogo READ ONLY:37 migraciones sincronizadas,16 tablas públicas RLS,88 funciones,2 buckets privados,publicación sólo messages/notifications. Edge sólo social-avatar; sin cron/pg_net instalados. Helpers Storage por operación instalados; bloqueo real de firma/GET exige prueba B1.

`node docs/qa/r7-block-0/verify.mjs`: **37/37 PASS documentales**. Diff sólo docs; build/lint NOT RUN por no cambiar frontend. SQL propuesta/local, JWT, Storage GET/sign, UI en320/375/390/768/1280, SW/PWA, Push físico, concurrencia, fallos y regresiones R1–R6 **NOT RUN** en este bloque. No se convierten en PASS por inspección. Migraciones R7: **0 creadas / SQL local NOT RUN /0 aplicadas /0 verificadas**. Sin DDL, deploy, secretos, cron, merge ni edición de Google Doc.

D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 siguen confirmadas por responsable15/10. D04/D10–D14/D16/D17 y parámetros técnicos presentados para ratificación; lectura historias en cancelación/archivo explícitamente pendiente antes B4. D10 impide firmar R7 y exige negar uploader despuésTTL; D13 reserva/idempotencia/exclusividad/GC; D17 ownership y versiones. Dos expectativas QA Push contradictorias con D08 corregidas, sin cambiar CA oficiales. Mockup R7 inspeccionado y conservado; B0 no cambia UI.

**R7-B0-TC-01/02/03:** PASS documental (baseline, matriz y diseño frente a CHECK/Storage OR/generateSW). **R7-B0-TC-04:** BLOCKED por firma humana; acta NO-GO preparada. No representa defecto funcional ejecutado ni rechazo del responsable. Se detiene B0 a la espera de revisión/autorización; ningún bloque posterior iniciado.

## Estado de paralelización — corte B11

Todos los productores B0–B10 y correctiva B3 están integrados. No hay agentes o frentes paralelos activos de este pedido. B11 compone y presenta revisión; pruebas remotas/operativas y aceptación humana pendientes. El [DAG/ownership](RELEASE_7_PARALLEL_WORK.md) conserva su contrato. No se concede PASS por cierre/merge de un productor.
