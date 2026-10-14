# PlanIt — R5 seguimiento de ejecución

**Corte:** 14/10/2026. **D01–D05 aprobadas por el responsable**; D06–D08 auditadas técnicamente, revisión humana pendiente. **B0 Implementado; QA pendiente** como entrega documental; ninguna funcionalidad R5 habilitada ni CA aprobado. Base `1b77b377e0a335f70bb7458be74122e1de70b43f`. Los bloques son **0–10**, 33 criterios de aceptación. No continuar B1 sin aprobación expresa.

| Bloque | Alcance | Estado | PR | CA | Evidencia | SQL local | Migración remota | Riesgos/pendientes |
|---|---|---|---|---|---|---|---|---|
| 0 | Auditoría contratos | Implementado; QA pendiente | `codex/r5-block-0`; [PR #50](https://github.com/EnzoG14/PlanIt/pull/50) en borrador | 33/33 NOT RUN | [Decisiones](RELEASE_5_BLOCK_0_DECISIONS.md), [evidencia](../qa/r5-block-0/README.md) | Replay de 25 migraciones existentes PASS catálogo; sin SQL R5 | Ninguna R5 creada/aplicada; catálogo existente read-only | C01–C03, revisión de contratos y aprobación B1; JWT A/B/C/D, Storage/Realtime/UI NOT RUN |
| 1 | Modelo social y RLS | Pendiente | — | NOT RUN | — | No ejecutado | No autorizada | — |
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

**Gates nuevos:** B1 define bloqueo bilateral y transición privada→pública atómica; B4 implementa/integra el cambio y aviso; B5 verifica proyección mínima/ampliada; B6–B7 verifican autoaceptación y carreras; B8–B9 preservan DM histórico y bloqueo; B10 incorpora la matriz adicional D01–D05. Ninguna prueba se declara ejecutada por esta revisión documental.
