# PlanIt — Release 3: seguimiento de implementación

**Plan:** [RELEASE_3_PLAN.md](RELEASE_3_PLAN.md). **Contrato:** [RELEASE_3_REQUIREMENTS.md](../requirements/RELEASE_3_REQUIREMENTS.md) (9 RF, 37 CA). **Diseño:** [R3 original](../design/mockups/release-3.png) y [propuesta visual](../design/r3-proposal/README.md).

**Corte documental:** 11/10/2026 (Argentina). **No se implementó R3 con esta PR**: es exclusivamente planificación, especificación local y material de referencia visual.

**Estados posibles:** Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado. «Validado» requiere aceptación humana respaldada por evidencia; no equivale a PR abierta.

| Bloque | Alcance | RF | Estado | PR/evidencia | Pendientes |
| --- | --- | --- | --- | --- | --- |
| 0 | Preparación, rutas y diseño | Transversal | Pendiente | — | Auditoría de contratos/rutas |
| 1 | Mis eventos organizados | R3-04 | Pendiente | — | Estados y autorización |
| 2 | Editar evento | R3-01 | Pendiente | — | Formulario, cupo transaccional |
| 3 | Galería | R3-03 | Pendiente | — | Storage/orden/permisos |
| 4 | Asistentes y remoción | R3-05/06 | Pendiente | — | RLS, historial, chat |
| 5 | Cancelar/archivar/duplicar | R3-02/07 | Pendiente | — | Transacciones y precarga |
| 6 | Reincorporaciones | R3-08/09 | Pendiente | — | RPC, cupo, cooldown |
| 7 | QA integral | R3-01..09 | Pendiente | — | Matriz 37 CA y regresiones |

## Estado de partida

- Revisados archivos visibles en `main`: `MyEventsPage`, `CreateEventPage`, `EventDetailPage`, `EventChatPage`; servicios actuales de eventos y participación. No hay entregas R3 acreditadas en este corte.
- La planificación funcional vigente separa R3 (operaciones) de R6 (analítica). La versión histórica de Planificación tiene otro alcance y otra numeración: no mezclar.
- Las capturas R3 son ilustraciones y contienen elementos desalineados con los requisitos; consultar `docs/design/r3-proposal/README.md` antes de implementar.
- **Estado de Supabase remoto:** no auditado para R3 al crear estos documentos. Consultar esquema y migraciones antes de cualquier SQL; no asumir ausencia/presencia de tablas o RPC.
- **CI/build/lint:** no ejecutados contra una rama local del código por tratarse de documentación. PR requiere revisión editorial y de exactitud antes de iniciar bloque 0.

## Procedimiento de actualización por bloque

1. Inspeccionar `main`, esquema/versiones y contratos; abrir una rama nueva.
2. Anotar decisiones, migraciones creadas **vs. aplicadas** y el entorno utilizado.
3. Registrar CA cubiertos, pruebas reproducibles, capturas responsive, problemas detectados y evidencia. Diferenciar SQL local, fixture UI, remoto HTTP/REST con JWT y revisión manual.
4. Cambiar a «Implementado; QA pendiente» cuando el código/probanzas lo justifiquen; no marcar «Validado» sin revisión del usuario.
5. PR exclusiva de cada bloque; detenerse hasta autorización de merge y cualquier migración remota.

## Actas de ejecución

### Bloque 0 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 1 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 2 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 3 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 4 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 5 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 6 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 7 — Pendiente
Sin código, pruebas ni migraciones.
