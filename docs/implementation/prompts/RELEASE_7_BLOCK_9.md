# Prompt — PlanIt R7 · Bloque 9: Alta/baja de Web Push y service worker

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-07.CA-01/03/05.  
**Precondición:** B0 aprobado, D08–D11/D14 resueltas.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Instalar opt-in voluntario por dispositivo, registrar suscripción con dueño JWT, y habilitar SW Push sin romper PWA.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `vite.config.ts`, `src/sw.ts`/registro PWA real
- `src/features/notifications/push.ts`, componente `PushSettings` independiente (preferencias: previews visibles/ocultas); wiring de ajustes central queda para B11
- `supabase/migrations/<timestamp>_r7_push_subscriptions.sql`
- `scripts/check-r7-push-subscriptions*.mjs`, `docs/qa/r7-block-9/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Auditar VitePWA actual (`generateSW` implícito) y elegir con prueba `injectManifest`/service worker custom para `push` + `notificationclick`; preservar precache y autoUpdate, no runtime caching de APIs/Storage.
2. Diseñar tabla de subscription con endpoint único, owner UUID derivado de JWT, p256dh/auth protegidos, timestamps y disabled_at. No meter endpoint/keys en `notifications` ni logs. RLS con SELECT/UPDATE/DELETE own o RPCs seguras.
3. UI opt-in en acción explícita, verificar HTTPS/feature detect (`isSecureContext`, SW, PushManager, Notifications API), política permission, Safari/iOS instalación cuando corresponda y VAPID public key.
4. Después de conceder permiso, usar PushManager.subscribe con service worker listo y persistir idempotentemente. Si DB falla, marcar estado incierto y permitir corregir/desuscribir; no prometer Push activos.
5. Desactivar sólo subscription de navegador actual y mantener inbox intacta. Manejar cambio de usuario en browser compartido, logout y endpoint asociado a otra cuenta; sin takeover por endpoint conflict.
6. SW push con **texto de vista previa autorizado**, `tag`/id, `notificationclick` a route interna segura o `/notifications` con origen/scope validado; click siempre revalida Auth/RLS.
7. No desplegar secrets VAPID ni Edge en este bloque; publicar instrucciones de configuración secret pero sin valores.

## Casos mínimos de verificación reproducible

- **R7-B9-TC-01:** Default/granted/denied/unsupported, dos navegadores/una cuenta, cambios de sesión, unsub y recuperación; no inventar suscripción si no hay soporte.
- **R7-B9-TC-02:** A no lee/edita subscription de B por HTTP/JWT, anon rechazado, RLS/GRANT.
- **R7-B9-TC-03:** PWA build/offline/auto-update/cache privado/regresión instalación, SW push listener probado con fixture.
- **R7-B9-TC-04:** iOS/Safari instalado y Android/desktop sólo PASS con evidencia real, emulación es NOT RUN.

## Entregable, gate de revisión y prohibiciones

PR draft, migración 4 marcas, pruebas SW/permiso; no insertar VAPID secreto ni enviar Push sin autorización B10.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-9/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-9` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Preview confirmada D08 y paralelismo

- Mostrar durante opt-in aviso comprensible: «Las notificaciones pueden mostrar el remitente y parte de tus mensajes privados incluso con la pantalla bloqueada». Checkbox/toggle «Mostrar vistas previas» persistida **por usuario** o por dispositivo con contrato B0; por defecto activo al activar Push (decisión de mostrar información concreta). Si apaga preview: mostrar genérico; el inbox permanece igual.
- SW recibe `title/body` saneados desde B10, nunca los guarda en cache ni analytics, identifica destinatario/contexto sin permitir URLs abiertas, y usa `tag`/id. Un Push puede llegar aun con la sesión web cerrada: no filtrar secretos ni IDs que otorguen acceso.
- **B9 se inicia tras B0, en paralelo con B1/B7/B8**. Sólo B9 es dueño de `src/sw.ts` y `vite.config.ts`. B10 consume el contrato tras integrar B9; no editar SW mientras B10 desarrolla Edge.