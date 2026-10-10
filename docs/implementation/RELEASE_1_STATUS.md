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
| 4 | Inscripciones, retiro y cupos | Implementado; QA pendiente | `docs/design/verification/participations-r1/README.md` | Auth/REST real y QA humana; migración aplicada |
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
- Estado: Implementado; QA pendiente.
- PR: [#3](https://github.com/EnzoG14/PlanIt/pull/3), draft; rama exclusiva `codex/block-4-participations`, destino `main`.
- Migraciones: `20261010150232_event_participations.sql` **aplicada en planit-v2 el 10/10/2026 con autorización expresa**. Las seis migraciones están sincronizadas; dry-run posterior sin pendientes. Replay previo en PostgreSQL 17.5 local.
- Pruebas ejecutadas: build/lint, regresión SQL discovery; PostgreSQL real con diez carreras multiconexión de cupo 1, constraints/RLS/RPC/historial/retries; UI fixture móvil 375×812 y escritorio 1280×900. [Evidencia y matriz de ocho CA](../design/verification/participations-r1/README.md).
- Criterios confirmados: resultados locales PASS de RF-R1-05.CA-01..04 y RF-R1-06.CA-01..04; **ninguno marcado Validado**.
- Verificación remota: SQL con dos identidades authenticated y ROLLBACK pasó registro/retry/retiro/reinscripción/historial, organizador rechazado, retiro ajeno/direct UPDATE/anon denegados. RLS/grants/search_path comprobados. Advisors: tres avisos intencionales SECURITY DEFINER autenticado y aviso previo de protección de contraseñas filtradas desactivada.
- Riesgos/pendientes: dos sesiones reales Auth/REST, revisión humana y teléfono físico. Prueba SQL remota no equivale a login real. Bloque 5 permanece pendiente.

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
