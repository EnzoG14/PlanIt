# Prompt — PlanIt R7 · Bloque 0: Auditoría y congelamiento de contratos

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** Transversal: 7 RF y 29 CA.  
**Precondición:** Sin prerequisitos de ejecución; asumir R6 estable únicamente para planificar.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Todas las decisiones no firmadas siguen siendo propuestas.**

## Objetivo y contrato de salida

Reconstruir baseline real del proyecto y convertir las propuestas D01–D15 en decisiones trazables antes de escribir migraciones o UI.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/design/AGENTS.md`
- `docs/architecture.md`, `docs/database.md`, `PRODUCT.md`, `DESIGN.md`
- `src/features/events/chat.ts`, `src/features/events/gallery.ts`, `src/features/social/messages.ts`
- `src/features/notifications/*`, `vite.config.ts`, `src/App.tsx`, `src/pages/EventDetailPage.tsx`
- `supabase/migrations/*` relevante, `supabase/functions/*`, `docs/implementation/RELEASE_6_BLOCK_0_DECISIONS.md`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Confirmar `git status --short`, branch, HEAD, remotos y últimas PR/commits; listar migraciones locales/remotas **sin ejecutar DDL**. Registrar estado sin llamar `main` validada por presunción.
2. Releer los 7 RF y 29 CA literales de Google Doc; extraer hash/texto de cada CA y contrastar `RELEASE_7_REQUIREMENTS.md`; registrar diferencias en vez de editar fuente oficial.
3. Inventariar tablas `messages`, `conversations`, `files`, `event_images`, `notifications`, `profiles`, `event_participations`, eventos unlisted; RLS, policies `storage.objects`, grants, triggers, overloads RPC, Realtime publication y Edge. Identificar inexistencia/existencia real de R7.
4. Inspeccionar `vite-plugin-pwa`, worker generado, estrategia para listener Push `injectManifest`, precache, scope y política de caching. Catalogar flows actuales de permisos, recuperación de error y useAuth.
5. Producción de threat model: propietario de subida, URL firmada, revocación, file shared, pending/revoked/link-only, TTL exacto, DM, push endpoint; tabla por rol/estado/acción.
6. Especificar propuestas SQL completas para todas las migraciones, RPC/versionado, path de Storage y mecanismos de compensación; no crear migraciones todavía.
7. Elevar preguntas D01–D15 al responsable con defaults etiquetados; registrar cada una como aprobada/modificada/pendiente, firma y fecha. Congelar condiciones que habilitan B1, B4 y B9.
8. Preparar casos de prueba y traceability por CA/B1–B11, tiempos frontera y qué requiere dispositivo real, dejando NOT RUN intacto.

## Casos mínimos de verificación reproducible

- **R7-B0-TC-01:** Baseline con evidencia reproducible de HEAD/migraciones/policies/buckets, jamás output secreto.
- **R7-B0-TC-02:** Matriz de permisos completa para A organizer, B confirmed, C pending, D removed, E link-only, F tercero, anon y evento cerrado.
- **R7-B0-TC-03:** Al menos tres discrepancias potenciales resueltas: CHECK text-only, Storage RLS existente, SW generateSW.
- **R7-B0-TC-04:** Acta GO/NO-GO para B1 con decisiones bloqueantes registradas y aprobación humana.

## Entregable, gate de revisión y prohibiciones

Entregar `RELEASE_7_BLOCK_0_DECISIONS.md` completado (usar template), catálogo/referencia, modelo de amenazas y PR draft **sólo documental**. Esperar autorización expresa antes B1.

Actualizar `docs/implementation/RELEASE_7_STATUS.md` con evidencia, estados por criterio/capa y pendientes. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar `codex/r7-block-0` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia/integrada. Nunca auto-merge ni continuar bloque siguiente.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque.**