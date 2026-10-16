# Prompt — PlanIt R7 · Bloque 1: Modelo multimedia, Storage y aislamiento de acceso

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-01.CA-03/04; RF-R7-02.CA-03/04; base de RF-R7-04.  
**Precondición:** B0 revisado y D01–D03, D10, D13, D15 decididas.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Crear base mínima para adjuntos e historias sin abrir agujeros en Storage ni cambiar permisos de chat/DM/galería existentes.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `supabase/migrations/<timestamp>_r7_media_contract.sql`
- `src/features/events/gallery.ts`, `src/features/events/validation.ts` (reuso)
- `supabase/migrations/20261010042701_create_events_and_event_media.sql`
- `supabase/migrations/20261012013634_manage_event_gallery.sql`, migraciones de perfil social/avatar

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Crear migración incremental: `message_attachments` con PK/FK/UNIQUE 1:1; no crear la tabla de dominio `stories` de B4 salvo parte explícitamente congelada en B0; B4 tiene su propia migración; documentar convención names/path R7 sin tocar paths de R1–R5.
2. Planear cambio `messages.body` null y CHECK; impedir mensajes vacíos mediante sólo RPC autorizada/trigger diferido que observe attachment en commit. Analizar explícitamente por qué un CHECK simple entre tablas no funciona y cómo bloquear DML directo. DM debe mantener cuerpo obligatorio.
3. Revisar y reemplazar policy Storage SELECT actual en lugar de sumar política permisiva. Diferenciar `event_media` legacy, `r7/chat` y `r7/stories`; pertenencia y expiración son necesarias para el GET autenticado incluso del uploader.
4. Preparar función de validación de archivos según metadata real `storage.objects`, MIME 3 tipos permitidos, bytes reales, path prefijado por `auth.uid`, hash/idempotencia de intento. Nunca confiar solo en bytes del cliente.
5. Prohibir asociación cruzada del mismo `file_id` entre galería, avatar, adjunto e historia; `RESTRICT` y pruebas adversariales para evitar GC destructivo.
6. Implementar utilidad central de validación de imagen y upload inmutable, sin crear frontend visible ni alterar `gallery.ts` salvo extracción segura con regresiones.
7. Configurar índices, RLS desde creación, grants mínimos y funciones `DEFINER` auditadas; explicar orden de locks y ausencia de secretos. No aplicar en remoto.

## Casos mínimos de verificación reproducible

- **R7-B1-TC-01:** Replay de todas las migraciones desde cero con constraints/índices/ACL verificados.
- **R7-B1-TC-02:** JWT A/B/C/D/E/F/anon GET Storage path antiguo y R7; caducidad simulada: uploader también denegado al vencer.
- **R7-B1-TC-03:** Galería y avatar existentes siguen accesibles; ninguna segunda policy OR abre acceso.
- **R7-B1-TC-04:** Upload fallido/retry/gc no borra archivo asociado, path duplicado no reasignable.

## Entregable, gate de revisión y prohibiciones

Migración creada y probada localmente, **remota 0/0** salvo autorización posterior. Evidencia SQL/RLS/Storage y diff seguridad revisable; B2 y B4 pueden empezar **en paralelo entre sí** tan pronto B1 haya sido revisado e integrado; B7/B8/B9 ya pueden estar ejecutándose. No tocar sus archivos.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-1/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-1` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**