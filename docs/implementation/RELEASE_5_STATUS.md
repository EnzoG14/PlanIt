# PlanIt — R5 seguimiento de ejecución

**Corte:** 14/10/2026. **D01–D05 aprobadas**; B0 integrado por PR #50 y B1 autorizado expresamente en este chat. C02 conserva permisos R4 y C03 admite firmas sociales hasta60s, aprobados por el responsable durante B1. **B1 Implementado; QA pendiente**, infraestructura local sin pantallas habilitadas ni CA integral aprobado. Base B1 `da4379f58ba60ddfa4c3d03970103b381856996b`. Bloques **0–10**, 33 CA. **No continuar B2 sin aprobación expresa.**

| Bloque | Alcance | Estado | PR | CA | Evidencia | SQL local | Migración remota | Riesgos/pendientes |
|---|---|---|---|---|---|---|---|---|
| 0 | Auditoría contratos | Implementado; QA pendiente | `codex/r5-block-0`; [PR #50](https://github.com/EnzoG14/PlanIt/pull/50) integrada | 33/33 NOT RUN | [Decisiones](RELEASE_5_BLOCK_0_DECISIONS.md), [evidencia](../qa/r5-block-0/README.md) | Replay de 25 migraciones existentes PASS catálogo; sin SQL R5 en B0 | Ninguna R5 creada/aplicada en B0; catálogo existente read-only | Contratos materializados en B1 autorizado; JWT A/B/C/D, Storage/Realtime/UI NOT RUN |
| 1 | Modelo social y RLS | Implementado; QA pendiente | `codex/r5-block-1`; PR por vincular | 33/33 NOT RUN integral; seguridad SQL parcial PASS | [Contrato](RELEASE_5_BLOCK_1_CONTRACT.md), [evidencia](../qa/r5-block-1/README.md) | 28 migraciones, 72 audiencias, 13 carreras y 13 regresiones PASS; gateway unit5 PASS | 3 creadas/probadas local, 0 aplicadas/verificadas; no autorizada | PostgreSQL18 vs17; HTTP/JWT, Storage/CDN, Realtime, Edge Deno/deploy/UI NOT RUN; legacy avatar preflight; D04 Google Docs pendiente; revisión PR y aprobación B2 |
| 2 | Participantes sociales | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
| 3 | Perfiles públicos | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
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

Rama nueva desde origin/main actualizado; env local copiado de checkout main e ignorado. Tres migraciones incrementales, RLS/ACL/RPC, extensión canónica de conversations/messages, bucket privado y gateway server-only con TTL fijo60, cacheControl sin caché larga y revalidación. C01 protege nombres administrativos sin perder facultades. C02/C03 aprobados durante ejecución; D06/D07 materializados técnicamente sin UI.

Pruebas nuevas: catálogo remoto read-only25/55 coincidente; SQL local PostgreSQL18.4 con SET ROLE/scaffold Auth/Storage PASS; 13 suites existentes y unit gateway PASS; npm ci/build/lint/typecheck handler PASS (avisos previos). [Comandos/resultados/límites](../qa/r5-block-1/README.md). No equiparar SQL ni fetch simulado con JWT/Storage/Realtime/Edge real. Mockup/src/styles intactos; diseño/accesibilidad NOT RUN por ausencia de UI.

Creada/probada local: `20261014133225`, `20261014133547`, `20261014133847`. Aplicada/verificada remota: ninguna. Sin cuentas remotas, secrets, deploy, merge ni edición Google Docs. Perfil propio R2 integra nuevo avatar en B4, previa aprobación. Detenerse para revisión humana de PR; B2 pendiente.
