# PlanIt — Release 1: seguimiento de implementación

**Fuente funcional:** `Planificación` (Google Docs), pestaña `Plan técnico Release 1 — Codex (Markdown)`.
**Contrato:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/design/*`, `docs/database.md`.
**Proyecto remoto permitido:** `planit-v2` (`iepeqmvzjguwlhnecsdq`). La base antigua es exclusivamente de consulta.

> Este archivo se versiona en Git y se actualiza en cada PR. `Implementado` significa que existe código; **no** que estén aprobados los criterios de aceptación. Sólo una revisión humana y evidencia de las pruebas reales permiten marcar `Validado`.

| Bloque | Alcance | Estado | Evidencia existente | Pendientes |
|---|---|---|---|---|
| 0 | PWA, foundation, seguridad | Implementado; QA pendiente | `docs/block-0-verification.md` | Instalación PWA en dispositivo físico |
| 1 | Registro, login y sesión | Implementado; QA pendiente | `docs/design/verification/auth-r1/README.md` | Validación final integrada |
| 2 | Categorías, creación y fotos | Implementado; QA pendiente | `docs/design/verification/create-event-r1/README.md` | Flujo real navegador + Storage |
| 3 | Mapa, descubrimiento y detalle | Implementado; QA pendiente | `docs/design/verification/map-detail-r1/README.md` | Sesión real, tiles OSM y dispositivo |
| 4 | Inscripciones, retiro y cupos | Pendiente | — | Migración, RPC, UI y pruebas concurrentes |
| 5 | Mis eventos | Pendiente | — | Consultas, pantalla real, actualización |
| 6 | QA integral y cierre R1 | Pendiente | — | Evidencia para los 28 CA, PWA, RLS |

## Protocolo de actualización por bloque

1. Codex lee el plan completo y el estado existente **antes** de editar código.
2. Implementa únicamente el bloque autorizado en una rama específica.
3. Actualiza la fila de ese bloque a `Implementado; QA pendiente` cuando tenga código, y enlaza evidencias (tests, capturas, migraciones y resultados).
4. Registra pruebas **realmente** ejecutadas y sus límites; distingue fixture/mock, PostgreSQL local y Supabase real.
5. Documenta dependencias, incidencias y criterios sin verificar.
6. No cambia estado a `Validado` sin confirmación explícita del usuario; no hace merge ni aplica SQL remoto automáticamente.

## Actas por bloque

### Bloque 4
- Estado: Pendiente.
- PR:
- Migraciones (archivo / aplicada remotamente):
- Pruebas ejecutadas:
- Criterios confirmados:
- Riesgos/pendientes:

### Bloque 5
- Estado: Pendiente.
- PR:
- Pruebas ejecutadas:
- Criterios confirmados:
- Riesgos/pendientes:

### Bloque 6
- Estado: Pendiente.
- PR:
- Matriz de 28 criterios de aceptación: ruta.
- PWA en dispositivo: evidencia.
- RLS/Storage/concurrencia: evidencia.
- Riesgos/pendientes:
