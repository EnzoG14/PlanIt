# Prompt — PlanIt R7 · Bloque 3: Interfaz de imágenes en chat de evento

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-01.CA-01..04 (UI+integración).  
**Precondición:** B2 integrado y su contrato aprobado.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Agregar selector/preview/render de una imagen a chat existente sin degradar texto, paginación, reconexión ni accesibilidad.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `src/pages/EventChatPage.tsx`, `src/pages/chat.css`
- `src/features/events/chat.ts`, utilidades multimedia B1
- `src/lib/reconciliation.ts`, `src/lib/realtime.ts`
- `scripts/check-r7-chat-ui.mjs`, `docs/qa/r7-block-3/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Reutilizar chat actual y tokens Amanecer si pantalla ya migrada; no rediseñar flujo de navegación ni introducir un store global innecesario.
2. Agregar input `accept` para JPEG/PNG/WebP, una sola foto, preview, reemplazar/remover, texto opcional, contador 2000, estados subiendo/enviando, botón bloqueado en event_state != open.
3. Descargar imagen de Storage mediante GET con JWT vigente; crear Blob URL en memoria, revoke al desmontar, cambiar sesión, timeout/expiración, falla de permiso o paginación que elimina elemento.
4. Diferenciar errores MIME/size, offline, permiso, subida, RPC y estado incierto; conservar UUID/path estable en retry, no enviar dos veces por doble click ni mostrar éxito por subida sin commit.
5. Añadir render de mensaje solo foto y texto+foto con nombres sociales seguros, accesibilidad de botones y estados, no cargar todo un historial de imágenes en memoria simultáneamente.
6. Preservar los marcadores/reconciliación, scroll anchor, selector de mensajes anteriores, focus/visibility reconnect y `chat_read_only`; no agregar adjunto a DM.

## Casos mínimos de verificación reproducible

- **R7-B3-TC-01:** Flujo real: seleccionar→preview→enviar→reabrir→render, image-only y text+image.
- **R7-B3-TC-02:** Dos archivos/archivo inválido/offline/reintento con UUID estable; UI error claro y sin mensaje fantasma.
- **R7-B3-TC-03:** 320/375/390/768/1280 px, 200% zoom, teclado/foco/alt/role-alert, caso mobile teclado abierto.
- **R7-B3-TC-04:** Regresión R2 chat texto y R5 DM texto; HR HTTP GET autorizado/denegado separado de snapshots.

## Entregable, gate de revisión y prohibiciones

Snapshots y pruebas funcionales, `build/lint`, PR draft. **B4, B5, B6, B7, B8, B9, B10 pueden avanzar en otras ramas** si sus dependencias están listas. No alterar `EventDetailPage.tsx` ni `src/App.tsx`.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-3/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-3` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**