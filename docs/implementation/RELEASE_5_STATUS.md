# PlanIt — R5 seguimiento de ejecución

**Corte B3:** 14/10/2026. **D01–D05 aprobadas**; B0–B2 integrados por PR #50/#51/#52. B3 autorizado expresamente e **Implementado; QA pendiente**, base `4ef0b34a789082352f8b1ca831f75761fb6e6b17`, rama `codex/r5-block-3`. C02 conserva permisos R4; C03 firmas sociales hasta60s. Ningún CA integral aprobado. Bloques **0–10**,33 CA. **No continuar B4 sin aprobación expresa.**

| Bloque | Alcance | Estado | PR | CA | Evidencia | SQL local | Migración remota | Riesgos/pendientes |
|---|---|---|---|---|---|---|---|---|
| 0 | Auditoría contratos | Implementado; QA pendiente | `codex/r5-block-0`; [PR #50](https://github.com/EnzoG14/PlanIt/pull/50) integrada | 33/33 NOT RUN | [Decisiones](RELEASE_5_BLOCK_0_DECISIONS.md), [evidencia](../qa/r5-block-0/README.md) | Replay de 25 migraciones existentes PASS catálogo; sin SQL R5 en B0 | Ninguna R5 creada/aplicada en B0; catálogo existente read-only | Contratos materializados en B1 autorizado; JWT A/B/C/D, Storage/Realtime/UI NOT RUN |
| 1 | Modelo social y RLS | Implementado; QA pendiente | `codex/r5-block-1`; [PR #51](https://github.com/EnzoG14/PlanIt/pull/51) integrada | 33/33 NOT RUN integral; seguridad SQL parcial PASS | [Contrato](RELEASE_5_BLOCK_1_CONTRACT.md), [evidencia](../qa/r5-block-1/README.md) | 28 migraciones, 72 audiencias, 13 carreras y 13 regresiones PASS; gateway unit5 PASS | 3 creadas/probadas local y aplicadas/verificadas en planit-v2 con autorización posterior; [acta](../qa/r5-block-1/REMOTE_MIGRATION.md) | PostgreSQL18 vs17; HTTP/JWT, Storage/CDN, Realtime, Edge Deno/deploy NOT RUN; D04 Google Docs pendiente; UI por bloques consumidores |
| 2 | Participantes sociales | Implementado; QA pendiente | `codex/r5-block-2`; [PR #52](https://github.com/EnzoG14/PlanIt/pull/52) integrada | R5-01.CA01..04 PASS parcial SQL/UI; NOT RUN integral | [Entrega y evidencia](../qa/r5-block-2/README.md) | 28 migraciones; casos B2 + suite B1 y 13 regresiones PASS; UI66+14 sociales/72 administración; HTTP anon4 PASS | Ninguna nueva: creadas0/probadas nuevas0/aplicadas0/verificadas nuevas0; catálogo existente READ ONLY coincide79 funciones | JWT autenticado/Storage/Edge real/dispositivos/aceptación pendientes; fallback de avatar; B3 autorizado |
| 3 | Perfiles públicos | Implementado; QA pendiente | `codex/r5-block-3`; [PR #53](https://github.com/EnzoG14/PlanIt/pull/53) en borrador | R5-02.CA01..04 PASS parcial SQL/UI/HTTP anon; NOT RUN integral | [Entrega y evidencia](../qa/r5-block-3/README.md) | Replay28,72 audiencias/13 carreras B1 y nuevos casos B3;13 regresiones PASS | Nuevas creadas0/probadas0/aplicadas0/verificadas0; catálogo existente READ ONLY | JWT autenticado/avatar real/dispositivos/aceptación pendientes; revisión PR; B4 sin autorización |
| 4 | Perfil propio/privacidad | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 5 | Perfiles privados | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 6 | Follows y listas | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 7 | Solicitudes | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 8 | Mensajes privados | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 9 | Bloqueos | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 10 | QA/cierre | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |

Cada PR debe actualizar esta matriz con SHA base, ruta de evidencia, cambios, migraciones, pruebas, resultados y limitaciones. Estados admitidos: Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado (sólo aceptación expresa). Diferenciar migración creada/probada local/aplicada/verificada remota. Nunca equiparar PR abierto con integrado a `main`.

**Gates:** B1 define bloqueo bilateral y transición privada→pública atómica; B4 integra el cambio y aviso; B5 verifica proyección mínima/ampliada; B6–B7 verifican autoaceptación y carreras; B8–B9 preservan DM histórico y bloqueo; B10 incorpora la matriz adicional D01–D05. Resultados nuevos de B1 abajo; entrega técnica no implica aceptación humana.

## Entrega B1 — 14/10/2026

Nota de corte: esta entrega histórica fue integrada por PR #51; las referencias siguientes a B2 pendiente describen el cierre original de B1, superado por la entrega B2 al final.

Rama nueva desde origin/main actualizado; env local copiado de checkout main e ignorado. Tres migraciones incrementales, RLS/ACL/RPC, extensión canónica de conversations/messages, bucket privado y gateway server-only con TTL fijo60, cacheControl sin caché larga y revalidación. C01 protege nombres administrativos sin perder facultades. C02/C03 aprobados durante ejecución; D06/D07 materializados técnicamente sin UI.

Pruebas nuevas: catálogo remoto read-only25/55 coincidente; SQL local PostgreSQL18.4 con SET ROLE/scaffold Auth/Storage PASS; 13 suites existentes y unit gateway PASS; npm ci/build/lint/typecheck handler PASS (avisos previos). [Comandos/resultados/límites](../qa/r5-block-1/README.md). No equiparar SQL ni fetch simulado con JWT/Storage/Realtime/Edge real. Mockup/src/styles intactos; diseño/accesibilidad NOT RUN por ausencia de UI.

Creada/probada local: `20261014133225`, `20261014133547`, `20261014133847`. Aplicadas/verificadas remotamente las tres el 14/10/2026 por pedido expreso posterior del responsable; 28 versiones/16 tablas RLS/79 funciones coincidentes, dry-run al día. [Acta](../qa/r5-block-1/REMOTE_MIGRATION.md). Sin cuentas remotas, secrets, deploy, merge ni edición Google Docs. Perfil propio R2 integra nuevo avatar en B4, previa aprobación. Detenerse para revisión humana de PR; B2 pendiente.

## Entrega B2 — 14/10/2026

Base `1bcef5af3397b54bae8cc18e6336092639c2b964`, rama nueva/worktree aislado; `.env.local` copiado del checkout main e ignorado. Lista social paginada para dueño/confirmed independiente de administración R3, entrada desde detalle y administración, ruta mínima `/users/:id` con retorno validado/self→me. D01 bilateral y privacidad por RPC B1; allowlist cliente; gateway avatar con fallback. Sin bio/eventos/follows/DM ni B3 habilitado.

Revalidación visible30s/foco/retorno/online; abort/timeout10s; limpiar al ocultar/cambiar sesión/token/ruta/fallar; al paginar reconsultar anteriores. Mockup intacto, estilos scoped Amanecer. [Tabla de amenazas, archivos, comandos, capturas y limitaciones](../qa/r5-block-2/README.md).

PASS: SQL local B2+B1, 13 regresiones SQL, 66 grupos UI sociales en seis tamaños, build/lint, catálogo remoto READ ONLY28/16RLS/79 funciones y HTTP anon4. RLS local usa SET ROLE con Auth/Storage scaffold; UI usa fixtures; no JWT autenticado real ni Storage/CDN/Edge/Realtime/dispositivos/aceptación. Migraciones nuevas0 en los cuatro estados; no DDL remoto/deploy/merge. **Implementado; QA pendiente. Detenerse antes de B3.**

## Entrega B3 — 14/10/2026

[PR #53 en borrador](https://github.com/EnzoG14/PlanIt/pull/53), código/evidencias `56c2b4df0e9a7e4465b4f2ec1366a5adcfeab717`. Sin merge; commit posterior únicamente de seguimiento.

Base `4ef0b34a789082352f8b1ca831f75761fb6e6b17`, rama nueva `codex/r5-block-3`, B0–B2 integrados por #50–#52 y B3 autorizado expresamente. `.env.local` copiado del checkout temporal de origin/main, comparado byte a byte e ignorado; sin claves versionadas. Perfil existente ampliado con bio autorizada y eventos públicos vigentes paginados30+cursor inicio/UUID. Reutiliza RPC B1, avatar con fallback y revalidación30s/timeout10s; regreso validado participantes→perfil→evento→perfil→participantes. Sin acciones de futuros bloques.

PASS: SQL local PostgreSQL17.5 con28 migraciones,72 audiencias y13 carreras B1 más escenarios B3;13 regresiones SQL R1–R4;54 grupos UI B3,66 de participantes B2 y72 administrativos; HTTP anónimo real3 B3+4 regresión; catálogo remoto READ ONLY28/16RLS y dos RPC/gates/ACL inspeccionadas; build/lint con avisos previos. [Entrega, amenazas, comandos, capturas y límites](../qa/r5-block-3/README.md). UI con fixtures no demuestra JWT/RLS remoto. CA R5-02.CA01..04 PASS parcial; NOT RUN integral hasta JWT autenticado/avatar real/dispositivos/aceptación.

Migraciones B3 creadas0/probadas nuevas0/aplicadas0/verificadas nuevas0. SQL histórico/tokens/mockup originales intactos. Sin DDL remoto/deploy/secrets/merge/edición Google Docs. **Implementado; QA pendiente. Detenerse en revisión de PR; B4 pendiente de autorización.**
