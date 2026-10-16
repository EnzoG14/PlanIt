# Prompt — PlanIt R7 · Bloque 11: QA integral, regresiones y cierre humano

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** Todos RF-R7-01..07 (29 CA).  
**Precondición:** B3/B6/B7/B8/B10 integrados y QA de cada bloque disponible.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

**Integrar los componentes aislados de las ramas paralelas** y auditar la release completa con pruebas reproducibles y registrar dictamen GO/NO-GO sin marcar como aprobados casos no ejecutados.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `docs/qa/RELEASE_7_ACCEPTANCE.md`, `RELEASE_7_TEST_PLAN.md`, `RELEASE_7_TEST_REPORT_TEMPLATE.md`
- `docs/implementation/RELEASE_7_STATUS.md`, `RELEASE_7_PLAN.md`, `RELEASE_7_PARALLEL_WORK.md`
- `src/pages/EventDetailPage.tsx`, `src/App.tsx`, punto de montaje de `PushSettings` (**ownership EXCLUSIVO B11**); `scripts/check-r7*.mjs`, checks regresión R1–R6
- `docs/qa/r7-block-11/*`, evidencias B0–B10

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Verificar PRs y merge/replay de B1–B10 según DAG; componer `EventStoriesEntry`, `EventCalendarAction`, `EventShareAction` en `EventDetailPage.tsx`; registrar ruta de Stories en `src/App.tsx` si aplica y montar `PushSettings` en preferencias. Este wiring se hace **una sola vez** y prueba que no existe conflicto de cambios de ramas.
2. Releer el contenido normativo y comparar literalmente los 29 CA; para cada uno asociar tests reales y evidencia reproducible; no modificar alcance oficial para lograr PASS.
2. Ejecutar replay de base desde cero, migraciones/constraints/RLS/storage negative, HTTP/JWT con 7 roles, carga/lectura revocación, frontera TTL y cron limpieza. Probar permisos en proyecto remoto **sólo si ya autorizado**.
3. Probar chats evento/DM, perfil social, hidden links, galería/avatar, **calendario `.ics` y enlace Google precargado**, Web Share soportado/fallback, visor historias estilo Instagram (autoavance, pausa, navegación/accesibilidad), subscriptions y delivery Push con **preview DM real**/error injection/2 devices.
4. Validar PWA SW offline, auto-update y que no cachea Supabase; compatibilidad desktop Chrome/Firefox/Edge, Android y iOS/Safari instalado según infraestructura; registrar NOT RUN y justificación.
5. Correr `npm run build`, `npm run lint`, scripts R7 y regresiones R1–R6 relevantes sin implementar arreglos no solicitados en R6; separar defectos ajenos de R7.
6. Revisar secrets/logs, SQL grants/procedimientos, recursos huérfanos, límites/cuotas, performance y verificación de ausencia de duplicación in-app.
7. Completar `RELEASE_7_TEST_REPORT.md` a partir de template, estado migraciones 4 columnas, matriz CA, screenshots y PRs; emitir recomendación GO/NO-GO humana con riesgos residuales explícitos.
8. No ejecutar merge, deploy, SQL remoto ni cambio de Google Doc por interpretar que test PASS confiere autorización.

## Casos mínimos de verificación reproducible

- **R7-B11-TC-01:** 29/29 criterios evaluados con PASS/FAIL/NOT RUN/BLOCKED real, no sólo tabla.
- **R7-B11-TC-02:** Ningún tercer usuario lee multimedia, ninguna historia nueva descargable a >=24 h; galería/DM/notifications intactos.
- **R7-B11-TC-03:** Push real de DM y no Push grupal, inbox única, cierre de sesión y permisos denegados.
- **R7-B11-TC-04:** Acta de aceptación firmada, decisión GO/NO-GO, inventario exacto de limitaciones de dispositivos/QA.

## Entregable, gate de revisión y prohibiciones

Entregar informe integral y PR draft documental; detenerse para decisión de aceptación humana. **No declarar GO automáticamente**.

Actualizar `docs/implementation/RELEASE_7_STATUS.md` con evidencia, estados por criterio/capa y pendientes. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-11` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Integración final de trabajo paralelo

El objetivo NO es convertir B11 en revisión manual sin código: **éste es el único PR que conecta** los componentes que B5/B7/B8 desarrollaron sin tocar `EventDetailPage.tsx` ni `src/App.tsx`; también registra navegación a ajustes Push. Corregir imports/tipos/conflictos detectados **sin introducir cambios no aprobados** a APIs/SQL de otro frente. Aplicar replay integral y pruebas cruzadas por múltiples usuarios antes de declarar 29 CA PASS. El integrador revisa que después del fin normal de evento las historias sigan vivas hasta el TTL, que no haya cuota máxima de historias, que los Push respeten previews habilitadas/ocultas y que los DM sigan sin adjuntos.