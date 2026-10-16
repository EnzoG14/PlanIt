# Prompt — PlanIt R7 · Bloque 6: Caducidad de 24 horas y limpieza física

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-04.CA-01..04.  
**Precondición:** B4 integrado; **B5 no es prerequisito**. Worker/cron independiente de UI.
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Cumplir inaccesibilidad estricta a T+24h independiente de la limpieza diferida y recuperar Storage sin dañar archivos de otros dominios.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `supabase/functions/r7-media-cleanup/{index,handler}.ts`
- `supabase/migrations/<timestamp>_r7_story_gc.sql` (si requiere jobs/locks)
- `src/features/events/stories.ts` (**sólo lectura**: TTL UI pertenece a B5, no editar en B6)
- `scripts/check-r7-expiration*.mjs`, `docs/qa/r7-block-6/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Comprobar primero lectura por RPC y RLS de Storage con reloj del servidor: GET a expires_at exacto falla, incluso uploader; no firmar URL temporal persistente que sobreviva al vencimiento.
2. Diseñar scheduler protegido (pg_cron/pg_net o mecanismo aprobado) que invoque Edge Function de limpieza, secretos exclusivamente servidor/Vault; no registrar endpoint/certificado en repositorio.
3. Seleccionar expiradas en lotes con claim/lease y lock donde corresponda, verificar file_id **exclusivo** y inexistencia de referencias a event_images/avatar/messages. Borrar objetos Storage idempotentemente.
4. Conservar trabajo reintentable si Storage responde timeout/5xx; tras borrado físico confirmado, eliminar referencias BD con FK segura y conservar métricas operativas mínimas no personales si aprobadas.
5. Evitar carrera con inserción simultánea y múltiples workers; no borrar paths sin presencia de un registro de historia vencida/autoridad. Probar rollback parcial y orphan cleanup separado.
6. Registrar cron/frecuencia/cuota, procedimiento de deploy con aprobación humana y política de recuperación manual de job atascado.

## Casos mínimos de verificación reproducible

- **R7-B6-TC-01:** T+23h59m59 GET exitoso y T+24h exacto GET falla; url nueva y enlace directo probados.
- **R7-B6-TC-02:** Dispositivo con reloj atrasado/adelantado no recupera nada vencido.
- **R7-B6-TC-03:** GC conserva galería, avatar, chat, activos; concurrencia worker doble; fallo de Storage reintenta.
- **R7-B6-TC-04:** Bandeja/DM y textos chat intactos; cron sin permiso produce 401/403 y no borra.

## Entregable, gate de revisión y prohibiciones

No activar cron remoto sin permiso específico; documentar la brecha local/remota y evidencia sobre acceso a objeto, no sólo UI.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-6/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-6` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Paralelización

B6 se puede desarrollar **simultáneamente con B5**. Sólo modifica su nueva migración de mantenimiento y `supabase/functions/r7-media-cleanup/**` más pruebas, no modifica migraciones de B4 ni la pantalla de historias. La condición de expiración proviene del servidor y debe ser efectiva **antes** del cron de borrado físico. Mantener lectura hasta completar exactamente 24h aunque evento termine normalmente.