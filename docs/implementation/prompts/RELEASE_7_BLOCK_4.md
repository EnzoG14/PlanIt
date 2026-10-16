# Prompt — PlanIt R7 · Bloque 4: Publicación y consulta segura de historias

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-02.CA-01..04 + RF-R7-03.CA-01/02/04.  
**Precondición:** B1 integrado, D03/D04/D10 aprobadas; verificar coexistencia B2.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Crear historias de una foto del evento con autor/tiempos de servidor, permiso server-side y lectura solo mientras vigentes.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `supabase/migrations/<timestamp>_r7_stories.sql`
- `src/features/events/storiesApi.ts` (API sin UI) | `src/features/events/gallery.ts` (patrones)
- `scripts/check-r7-stories*.mjs`, `docs/qa/r7-block-4/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Crear `stories` con `event_id`, `author_id`, `file_id UNIQUE`, `created_at`, `expires_at`, FK RESTRICT, `CHECK` temporal e índice de consulta; tiempo original `clock_timestamp() at time zone Argentina` en transacción.
2. Implementar `publish_event_story(event_id,story_id,path)` con lock evento/participación, actor auth.uid, upsert prohibido, exclusivo file_id y mismo UUID+payload idempotente. Unlisted link-only no publica.
3. Implementar `list_event_stories` acotado por fecha servidor, evento/rol, paginado determinista, campos sociales seguros; permitir lectura al organizador y confirmed sólo si vigencia; no exponer otro evento.
4. No incluir URL firmada ni public URL; path puede devolverse a miembro autenticado para `download()` con policy `storage.objects` exacta. Verificar que autor no pueda leer tras vencer.
5. Registrar comportamiento al cerrar evento (D03) y retirar usuario; no fijarlo por la pantalla. Idempotencia y errores tipados sin mensajes que revelen existencia de evento ajeno.
6. Auditar privilegios RPC/RLS/grants y callbacks Storage; evitar dependencia funcional de GC para el filtro TTL.

## Casos mínimos de verificación reproducible

- **R7-B4-TC-01:** A/B crean historia; C/D/E/F/anon NO; event ended/cancelled/archived NO publicación.
- **R7-B4-TC-02:** READ correcto vs otro evento; usuario removido tras publicar ya no lee; link-only no lee.
- **R7-B4-TC-03:** created_at/expires_at diferencia 24 horas según server, reloj cliente manipulado no altera.
- **R7-B4-TC-04:** Duplicado mismo story id, path alternativo, otro author, mismo file_id en galería/adjunto = rechazado.

## Entregable, gate de revisión y prohibiciones

Migraciones, RPC y suite SQL/HTTP autorizadas para revisión humana B5/B6.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-4/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-4` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Gate de paralelismo explícito

B4 **puede ejecutarse a la vez que B2/B3/B7/B8/B9/B10** tras B1 integrado. Después de integrar B4, **B5 (visor/UI)** y **B6 (expiración física)** arrancan **simultáneamente** en worktrees diferentes. B4 no edita `EventDetailPage.tsx` ni `src/App.tsx`; no filtrará historias ya publicadas por fin normal del evento antes de 24h.