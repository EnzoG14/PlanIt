# Prompt — PlanIt R7 · Bloque 2: API transaccional de adjuntos en chat

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-01.CA-01..04 (backend).  
**Precondición:** B1 integrado/autorizado según su acta.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Persistir mensaje sólo foto (**confirmado**) o texto+foto cuando proceda en evento actual, lectura autorizada e idempotente, y mantener invariantes de DM.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `supabase/migrations/<timestamp>_r7_chat_attachments.sql`
- `src/features/events/chat.ts`, `src/features/social/messages.ts` (**auditar, no modificar salvo contrato aprobado**; la adaptación de UI es de B3)
- `supabase/migrations/20261010214526_event_chat.sql`
- `scripts/check-r7-chat*.mjs`, `docs/qa/r7-block-2/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Diseñar `send_event_chat_media_message` con UUID cliente, body opcional y storage path validado por DB. Implementar `events FOR UPDATE` y membresía, mismo lock order que `send_event_chat_message`; admitir solo kind event, abierto y JWT propietario del objeto.
2. Insertar `files`, `messages`, `message_attachments` **en una única transacción PostgreSQL**; probar fallo de última inserción y rollback de las anteriores. No afirmar atomicidad con Storage.
3. Mantener semántica idempotente: mismo ID+autor+evento+body+path ⇒ devuelve mismo mensaje; distinto payload ⇒ error `message_id_conflict` sin sobrescribir; compensación de upload incierto.
4. Extender lectura de chat con proyección attachment segura y paginación `(created_at,id)`; si cambiar RETURNS TABLE no es posible, versionar RPC (no romper `get_event_chat_messages`). No exponer `files` generales.
5. Evitar inserción de attachment por usuario no autorizado mediante Data API o función interna; asegurar RLS/ACL. No permitir ningún nuevo endpoint de imágenes para conversaciones directas.
6. Preservar notificaciones DM solo texto y reconciliación Realtime actual por message ID. Mantener errores neutros para atacante.

## Casos mínimos de verificación reproducible

- **R7-B2-TC-01:** A/B event vigente: texto, imagen sola, ambos y reconstrucción del historial; C/D/E/F/anon negados en RPC y REST.
- **R7-B2-TC-02:** DM intento de foto/NULL body rechazado; envío texto DM y texto chat R2 siguen PASS.
- **R7-B2-TC-03:** Idempotencia doble POST, timeout tras commit, misma UUID con diferente path, concurrencia cierre/remoción.
- **R7-B2-TC-04:** Nada parcial en DB ante fallo de FK/Storage metadata/permisos, con huérfano limpiable.

## Entregable, gate de revisión y prohibiciones

PR draft con RPC/versiones, grants exactos, fixtures/negativos y evidencia; B3 requiere revisión. **B4 se desarrolla en paralelo tras B1**, sin esperar B2. No editar `EventChatPage.tsx`, `EventDetailPage.tsx` ni `src/App.tsx`.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-2/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-2` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**