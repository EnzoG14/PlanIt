# Prompt — PlanIt R7 · Bloque 10: Envío Web Push desde avisos existentes

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-07.CA-02/04 (y verificación CA-01/05).  
**Precondición:** B9 integrado; D08/D09/D12 aprobadas; productores DM/event_full inventariados.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Consumir `notifications` existentes y distribuir Web Push resiliente mediante backend seguro sin duplicar la bandeja.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `supabase/functions/r7-push/{index,handler}.ts`
- `supabase/migrations/<timestamp>_r7_push_jobs.sql` si D09
- `supabase/migrations/*direct_message_notifications*, *r6_event_full_notifications*`
- `src/features/notifications/api.ts`, `NotificationsProvider.tsx`
- `scripts/check-r7-push-delivery*.mjs`, `docs/qa/r7-block-10/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Congelar catálogo de tipos de `notifications` y producer triggers R5/R6; escoger sólo tipos elegibles y **no** hacer producer Push en `messages` de chat grupal.
2. Crear worker/cola interna propuesta en `planit_private` (NO Data API), trigger de encolado sin mutar fila notifications, `UNIQUE(notification_id,subscription_id)` y status/lease/attempts; proteger contra job duplicado sin atribuir exactly-once al proveedor.
3. Edge Function firma Web Push con VAPID private en secrets servidor; buscar subscriptions válidas en DB protegida y emitir **payload con preview real** (p. ej. remitente + fragmento de texto de DM) sólo para el destinatario autorizado y cuando su preferencia lo permite; nunca texto sensible en logs, jobs o URL; endpoint respuesta auditable sin filtrar keys.
4. Clasificar 2xx entrega aceptada por push service (NO necesariamente vista en dispositivo), 404/410 invalidación de subscription, 429/5xx/timeout retry con backoff/jitter y techo de intentos; registrar métricas sin datos privados.
5. Separar errores: fallo de encolado/Edge no revierte transacción de aviso interno; no borrar ni duplicar `notifications`; `event_full` conserva idempotencia existente.
6. Implementar `notificationclick` que use solo route validada y revalidación de permisos en frontend/DB; usuario con evento revocado solo ve estado autorizado.
7. Crear procedimiento de cron/deploy/Vault con autorización independiente, rate limits y costos; no usar webhooks públicos sin autenticación ni exponer secretos.

## Casos mínimos de verificación reproducible

- **R7-B10-TC-01:** DM nuevo → 1 fila interna y jobs por dispositivos, push recibido en browser real; mensaje chat grupal → ningún job.
- **R7-B10-TC-02:** Dos devices, race dos workers, retry mismo job, 404/410 remueve deshabilita solo endpoint, 429/5xx reintenta sin duplicar aviso.
- **R7-B10-TC-03:** Permiso denied/offline no daña bandeja; payload DM con nombre/fragmento de mensaje autorizado cuando previews habilitadas, texto genérico con previews deshabilitadas/revocación; ningún link ajeno ni información en logs.
- **R7-B10-TC-04:** Service key VAPID ausente/malformado/config rota ⇒ FAIL seguro y reporte; no mezclar tests mocks con producción real.

## Entregable, gate de revisión y prohibiciones

PR draft, pruebas de Edge/job/push/dispositivos, propuestas de cron y secrets sin deploy no autorizado; B11 requiere revisión y aprobación.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-10/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-10` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Requisito de preview y desacople

- Payload de Direct Message **NO genérico por defecto**: consultar con privilegios server-side el evento notificado y su remitente/recipiente para construir texto **propio del destinatario**. Extraer sólo texto válido, truncar longitud, tratar contenido como texto plano; no ponerlo como atributo URL, SQL dinámico, métrica, log o error. Respetar opción «Mostrar vistas previas». Si recurso borrado, destinatario sin permiso, dato no confiable o preview desactivada: genérico. Sin Push por mensaje del chat del evento.
- Leer `notifications` existentes y enriquecer sólo el envío; no alterar el registro de bandeja. Queue `notification_id, subscription_id`, dedupe y lease; jamás persistir texto privado en payload en tabla operativa.
- **B10 puede ejecutarse al mismo tiempo que B2/B4/B5/B6/B7/B8/B3**, siempre que B9 haya sido integrado. No editar `src/sw.ts`, `vite.config.ts`, `NotificationsProvider.tsx` ni migraciones B9.