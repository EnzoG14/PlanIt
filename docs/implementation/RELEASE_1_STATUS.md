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
| 5 | Mis eventos | Implementado; QA pendiente | `docs/design/verification/my-events-r1/README.md` | RPC aplicada/verificada; Auth/REST real y revisión humana pendientes |
| 6 | QA integral y cierre R1 | Validado por aceptación manual del usuario (10/10/2026) | [Matriz de 28 CA](../qa/RELEASE_1_ACCEPTANCE.md); [informe QA](../qa/RELEASE_1_TEST_REPORT.md) | Pendiente: tratamiento de WARN de seguridad y reproducibilidad por caso |

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
- Estado: Implementado; QA pendiente.
- PR: [#4](https://github.com/EnzoG14/PlanIt/pull/4), draft; rama exclusiva `codex/block-5-my-events`, basada en `main` con Bloque 4 integrado (`696348c`).
- Migración: `20261010154930_my_events_read.sql`, **aplicada por el usuario en planit-v2 y verificada el 10/10/2026**. Siete migraciones sincronizadas, dry-run sin pendientes. RPC de lectura SECURITY INVOKER, auth.uid(), paginación y proyección mínima; sin cambios en tablas/RLS.
- Pruebas ejecutadas: build/lint; replay PostgreSQL 17.5 local con tres identidades SQL, historial/media/RLS/paginación; Edge con dos cuentas fixture a 375×812 y 1280×900. Regresiones SQL/UI de participaciones y discovery, incluidas diez carreras reales de último cupo. [Evidencia, capturas y matriz CA](../design/verification/my-events-r1/README.md).
- Criterios confirmados: cobertura local de RF-R1-07.CA-01..04 según plan versionado; **ninguno marcado Validado**. Separación, detalle, actualización y vacíos/privacidad cubiertos por SQL y fixtures.
- Verificación remota: cuerpo de RPC coincide con SQL versionado; grants/search_path/RLS comprobados. Transacción READ ONLY con dos identidades SQL pasó Organizo/Participo contra consultas propias, parámetros inválidos y rechazo de anon/sin identidad, sin crear datos. [Resultados](../design/verification/my-events-r1/remote-results.json). Advisors de seguridad conservan tres avisos intencionales de RPC SECURITY DEFINER del Bloque 4 y aviso previo de protección de contraseñas filtradas desactivada; sin aviso de get_my_events.
- Riesgos/pendientes: dos sesiones Auth/REST reales, Storage HTTP real, QA humana y teléfono físico. Roles SQL/fixtures no equivalen a sesiones reales; no se añadieron casos históricos remotos de prueba. Bloque 6 sin iniciar.

### Bloque 6
- Estado: **Validado** por confirmación explícita del usuario el 10/10/2026: “Probé todo a mano y funciona, está todo validado”. La matriz registra los 28 CA como `Aprobado` por esta aceptación manual. No se adjuntaron pasos ni artefactos individuales por criterio; Codex no presenta sus pruebas fixture/locales como un E2E remoto observado.
- PR: [#5 — QA integral y trazabilidad de Release 1](https://github.com/EnzoG14/PlanIt/pull/5), draft abierto hacia `main`; esta rama no se fusionó.
- Matriz de 28 criterios, con textos literales de `Planificación`: [docs/qa/RELEASE_1_ACCEPTANCE.md](../qa/RELEASE_1_ACCEPTANCE.md). Los resultados automatizados locales/fixture siguen distinguidos de la aceptación manual del usuario.
- Informe de comandos, Advisors, seguridad, PWA, visual y estado GO/NO-GO: [docs/qa/RELEASE_1_TEST_REPORT.md](../qa/RELEASE_1_TEST_REPORT.md). Capturas sin PII: [docs/qa/screenshots/](../qa/screenshots/).
- Reconciliación: rama basada en `origin/main` `9f54deb`; siete migraciones versionadas coinciden con la lista read-only de `planit-v2` (`iepeqmvzjguwlhnecsdq`). Sin SQL remoto ni cambios de Auth. `vite.config.ts` preexistente se preservó y queda fuera del cambio.
- Pendiente para decisión global de release: tratamiento explícito de WARN de RPC `SECURITY DEFINER`, policies permisivas y leaked-password protection; se solicitó aceptación del usuario o resolución y no se cambió configuración ni SQL. El informe precisa qué pruebas remotas no fueron observadas independientemente por Codex.
- Recomendación de release: **pendiente** de respuesta sobre WARN; ver [decisión y criterios](../qa/RELEASE_1_TEST_REPORT.md#decisión-de-release). `Validado` refleja la aceptación manual explícita del Bloque 6, no el cierre automático de los riesgos de seguridad.


## Ubicación sugerida — 17/10/2026

Entrega: [PR draft #87](https://github.com/EnzoG14/PlanIt/pull/87), sin fusionar.

Implementado; aceptación humana pendiente. Rama `codex/event-location-autocomplete` desde main `f8dd53c`. En creación: Dirección con sugerencias Geoapify, coordenadas internas sin campos visibles, invalidación al cambiar dirección y alternativa GPS. Se conserva Amanecer; sin cambios de esquema/RPC ni migraciones. `.env.local` copiado desde el worktree de main y luego configurado con la clave entregada por el usuario, siempre ignorado y fuera del commit.

PASS build/lint (advertencias previas), validaciones de eventos, contrato del buscador, UI crear/editar y matriz de autocompletado/duplicación, incluyendo texto ampliado, poca altura, carreras de búsqueda/GPS y clave ausente. Consulta Geoapify real PASS con guardado en backend fixture; sin escrituras remotas Supabase. [Capturas, resultados, reproducción y límites](../design/verification/location-autocomplete/README.md). No cambia los estados históricos de aceptación de la release. Pendientes: revisión humana, dispositivos físicos/lector de pantalla y confirmar restricciones de origen/cuota para producción.
