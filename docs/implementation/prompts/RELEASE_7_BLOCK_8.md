# Prompt — PlanIt R7 · Bloque 8: Web Share y enlace de evento seguro

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-06.CA-01..04.  
**Precondición:** B0 aprobado, D07 resuelta, integración de R4 verificada.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Permitir compartir eventos sin prometer entrega externa y sin diseminar grants de unlisted.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `src/features/events/share.ts`, `src/pages/EventDetailPage.tsx` (**sólo lectura; B11 conecta componente**)
- `src/features/events/links.ts`, `src/components/EventLinkPanel.tsx`
- `scripts/check-r7-share*.mjs`, `docs/qa/r7-block-8/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Leer APIs R4 reales: enlace token hash, rotate/active, quién puede emitirlo, diferencias con URL simple y URL de grant; no crear tokens desde el frontend.
2. Diseñar `shareEvent` con `navigator.share` y texto mínimo autorizado: título, fecha y URL canónica para público. `AbortError` retorna estado cancelado, sin toast de éxito.
3. Ocultos: **D07 aprobó organizer-only**. Reutilizar el enlace activo de invitación sólo cuando el organizador **dispone del token válido**. El backend solo guarda hash; nunca fingir lectura de token desde DB. Rotar **requiere acción explícita** porque invalida enlaces anteriores.
4. Para miembro no organizer, no usar un grant como link; mostrar motivo y compartir sólo descripción segura sin enlace o desactivar según decisión aprobada.
5. Fallback copiar enlace en desktop/no Web Share, `navigator.clipboard` sólo con permisos/secure context; otro fallback de texto visible seleccionable si clipboard falla.
6. Revisar origin/BASE_URL real, despliegue HTTPS: no compartir URLs localhost ni links a login de localhost. Datos sensibles jamás en payload externo.

## Casos mínimos de verificación reproducible

- **R7-B8-TC-01:** Mock navigator.share supported/not supported/AbortError/errors y clipboard failure.
- **R7-B8-TC-02:** Public url abre evento; unlisted link invalidado/revocado no concede acceso nuevo y quien posee solo grant no comparte token.
- **R7-B8-TC-03:** No exponer asistentes/chats/estadísticas/secrets; payload mínimo en snapshot y test manual.
- **R7-B8-TC-04:** Mobile/desktop, route back y cancelación sin marcar enviado.

## Entregable, gate de revisión y prohibiciones

PR draft + evidencia Web Share real y fallback; componente `EventShareAction` aislado. B9 puede ejecutarse en paralelo; B11 conecta en detalle.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-8/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-8` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Paralelización / contrato de Share

Entregar `EventShareAction` aislado. **B8 no toca `EventDetailPage.tsx` ni `src/App.tsx`**, que pertenece al integrador B11. Puede trabajarse en paralelo a B1/B7/B9. Para ocultos, sólo el organizador obtiene/comparte invitación; tener acceso por otra vía no implica permiso de redistribución. El componente recibe un DTO autorizado y no inventa token a partir de IDs.