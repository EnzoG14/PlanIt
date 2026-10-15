# R6 · Bloque 8 — Comparación agregada de eventos propios

15/10/2026 (Argentina). **Implementado; QA pendiente.** Base `origin/main` `9311c0142e4c945656e8aa0fe9c89c1a37b4135b` (fetch y PR #69 MERGED comprobados), rama `codex/r6-block-8`. HEAD final consultable en Git/PR. B7 (PR #70) todavía no está integrada: esta rama no depende de ella y su migración usa un timestamp posterior (`20261015210000`) para no desordenar el historial cuando B7 se integre. Sin B9 ni aceptación integral de CA.

## Alcance
RF-R6-06.CA-01..04 con D09 (todos los estados propios) y D10 (2–10 eventos únicos). Sin predicción, sin exportación comparativa, sin datos sociales ni de otros organizadores. A01–A07 sin cambios. `.env.local` de main conservado en el mismo checkout, ignorado y no versionado.

## Inventario
- `supabase/migrations/20261015210000_r6_compare_events.sql`: `public.get_my_events_occupancy(uuid[]) → jsonb`.
- `src/features/analytics/{compare.ts,api.ts}`: parser/normalizador y `loadMyEventsComparison`.
- `src/pages/CompareEventsPage.tsx`, `compare-events.css`; ruta `my-events/compare` en `src/App.tsx`; enlace secundario «Comparar eventos» en `MyEventsPage.tsx` (sin nuevo dock); `AppLayout.tsx` aplica el shell Amanecer de gestión a la ruta.
- `scripts/check-r6-compare{,-contract,-ui}.mjs` y tres scripts npm `check:r6:compare*`.
- Sin cambios de DESIGN.md, mockups, tablas, triggers, políticas, índices ni grants de lectura.

## RPC, ACL y amenazas
- STABLE, SECURITY DEFINER (RLS solo expone filas propias de participación; INVOKER daría conteos incompletos), `search_path=''`, nombres calificados, EXECUTE solo `authenticated`.
- UID nulo → 42501 `authentication_required`. Arreglo NULL, vacío, 1 ó >10 elementos, elementos NULL, duplicados o multidimensional → 22023 `invalid_event_selection`.
- Ownership de **todos** los IDs validado antes de agregar: un ID ajeno, oculto ajeno o inexistente rechaza todo con el mismo 42501 `event_unavailable` (sin título ni existencia, sin parciales).
- Misma expresión que B1: confirmed sin organizador, `greatest(cap-confirmed,0)`, `100*confirmed/nullif(cap,0)`, `capacity_usable = cap>0`, mismo CASE de estado, un solo `as_of`. Orden de entrada conservado. Una sentencia set-based (sin N+1).
- Enlace unlisted, follow o chat no autorizan estadísticas (probado con follow aprobado).
- UI: cada respuesta se descarta si cambió la selección (remount por clave de IDs, `AbortController`, timeout 10 s); el parser exige mismos IDs y orden; offline/pestaña oculta/cierre de sesión borran el resultado; errores neutros sin texto del servidor; títulos como texto React.

## Migración
Marcas: **1 creada / 1 probada local / 0 aplicada remota / 0 verificada remota**. No se ejecutó DDL remoto ni `db push`; aplicar requiere autorización humana expresa.

## Reproducción
```powershell
npm run build
npm run lint
node scripts/check-r6-compare.mjs            # SQL local, PostgreSQL efímero
node scripts/check-r6-compare-contract.mjs
$env:PLANIT_PLAYWRIGHT_PATH='<ruta a playwright/index.mjs>'
node scripts/check-r6-compare-ui.mjs         # requiere npm run build previo
```

## Resultados por capa
| Capa | Resultado |
| --- | --- |
| SQL local (PostgreSQL 17.5, replay completo + harness social heredado) | PASS: A cap10/4 → 40 %, B cap20/15 → 75 %, idéntico a `get_my_event_occupancy`; 2 y 10 eventos; 0/1/11/duplicados/NULL rechazados; mezcla propio+ajeno/oculto ajeno/inexistente rechaza todo; no dueño, follower, anon y sin UID denegados; cap 0 legado → N/D sin división por cero; estados cancelled/archived/open; ACL/STABLE/DEFINER/search_path; `profiles` sigue ilegible |
| Rendimiento | PASS local sintético (no SLA): p95 20 muestras, 10 eventos × 50 inscriptos: lote 0,92 ms vs 3,03 ms para diez RPC individuales. [EXPLAIN](sql/compare-explain.json) |
| Contrato/parser/adaptador | PASS (simulado, no HTTP/JWT): orden, IDs, fórmula, N/D, payloads inválidos/ajenos, límites 2..10, errores neutros. [contract.json](contract.json) |
| UI navegador (build real en Edge headless, fixtures sintéticos) | PASS en 320/360/375/390/768/1280: bloqueo con 0/1, 2 eventos 40 %/75 %, N/D con explicación, filtros conservan selección, archivado visible, tope 10, título XSS inerte, carrera de selección rápida, error/reintento, texto 200 %, ruta anónima → login, entrada desde Mis eventos y cuatro destinos del dock. [Resultados y capturas](ui/results.json) |
| Build / lint | PASS; lint conserva advertencias previas, ninguna en archivos nuevos |
| Regresión UI ocupación B2 (`check-r6-occupancy-ui`) | PASS |
| `check-my-events-ui` | Ejecutado contra `vite preview`: sin FAIL |
| `check-my-events-refresh-ui` | FAIL **preexistente y ajeno**: la aserción «other routes preserve the current header» (menú Cuenta en `/me`) falla también sin estos cambios |
| `check-r6-occupancy-contract` | FAIL **preexistente**: su reemplazo de imports no cubre `./demographics`/`./periods`/`./csv` de `api.ts` desde B3; no modificado en este bloque |
| HTTP/JWT de usuario real, Realtime, dispositivos, lector de pantalla, zoom nativo | **NOT RUN** (los fixtures y `SET ROLE` no certifican RLS/PostgREST remotos) |

## Cobertura de CA (parcial, QA pendiente)
- CA-01 selección de ≥2 eventos propios: SQL local + UI fixtures.
- CA-02 inscriptos y % con el mismo criterio: SQL (paridad con B1) + UI fixtures.
- CA-03 actualización al cambiar selección/filtros: UI fixtures.
- CA-04 sin eventos ajenos ni % inválido, con aviso: SQL local + UI fixtures.
Ninguno se marca aceptado; la matriz de `RELEASE_6_ACCEPTANCE.md` queda en NOT RUN hasta B9.

## Riesgos e inconsistencias
- La selección se limita a 10 en cliente y servidor; el listado reutiliza `get_my_organized_events` (el filtro «Todos» excluye archivados; se eligen desde «Archivados»).
- El lote lee sin locks: refleja inscripciones vigentes al consultar.
- El pedido hablaba de «Release 5»; se siguió el prompt y el seguimiento de R6.

Estado **Implementado; QA pendiente**. B9 requiere autorización humana independiente.
