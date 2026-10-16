# Prompt — PlanIt R7 · Bloque 5: UX de publicación, listado y visor de historias

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-02.CA-01..04 + RF-R7-03.CA-01..04.  
**Precondición:** B4 integrado; RLS/GET seguro disponible.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Entregar **componente/route de historias tipo Instagram** que B11 conectará a ficha del evento, sin exponer contenido a unlisted link-only, con visor accesible y navegación consistente.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `src/pages/EventDetailPage.tsx` (**SÓLO LECTURA; integración/wiring en B11**)
- `src/pages/EventStoriesPage.tsx` o componente exportado `EventStoriesEntry`, `src/App.tsx` (**SÓLO LECTURA: wiring B11**)
- `src/features/events/stories.ts`, `src/styles/tokens.css`
- `src/pages/<stories>.css`, `docs/qa/r7-block-5/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Exportar un `EventStoriesEntry` apto para insertar en detalle **por B11** sólo para organizer/confirmed; el acceso real siempre lo impone SQL/RLS, no la UI.
2. Agregar publicador una imagen con preview, feedback estado subiendo/publicando, retry seguro, ausencia de permisos, archivo rechazado, evento cerrado. Nunca mensaje de éxito antes de RPC.
3. Presentar **carrusel de autores/historias** desde el punto de entrada, ordenado, estado vacío/error/reintentar. El elemento principal de consulta es un **visor a pantalla completa tipo Instagram**, no galería de miniaturas.
4. Crear visor **tipo Instagram confirmado D05**: secuencia por historias, anillos/segmentos de progreso, **avance automático** (duración de diseño configurable, propuesta 5 s), controles anterior/siguiente al tocar extremos de pantalla, tecla izquierda/derecha, ESC/cierre y retorno a evento, arrastre/touch sólo si robusto. **Pausar** con imagen no cargada, gesto mantener presionado, pestaña oculta, modal/foco fuera; respetar `prefers-reduced-motion` (sin avance no solicitado o con control claro). Mantener un botón explícito Pausar/Reanudar accesible, foco restaurado y anuncio accesible «historia N de M». Sin reacciones/likes fuera de alcance.
5. Descargar Blob on-demand, revocar al desmontar/sesión cambia/Story TTL, abortar fetch obsoletos al cambiar evento, respetar caducidad servidor, sin cache SW.
6. Seguir dirección B Amanecer y reglas `docs/design/AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, no copiar diseño mockup R7 como fuente normativa visual.

## Casos mínimos de verificación reproducible

- **R7-B5-TC-01:** A/B publicar/leer; C/D/E/F/anon acceso directo a route y GET denegado.
- **R7-B5-TC-02:** Empty/error/expired, unlisted, canceled, refreshed, autor removido, cambio de cuenta.
- **R7-B5-TC-03:** Navegación volver, foco y scroll a ficha, 320..1280, zoom/reduced-motion/teclado.
- **R7-B5-TC-04:** UI no declara publicación exitosa si Storage subió pero RPC falló.

## Entregable, gate de revisión y prohibiciones

PR draft, pruebas UI y seguridad real separadas, B6 **puede ejecutarse en paralelo** con B5 tras B4; su cron NO espera UI. Gate de composición B11 independiente; no editar `EventDetailPage.tsx`/`src/App.tsx`.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-5/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-5` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Pruebas adicionales del visor Instagram

- TC-S1: secuencia con >=3 historias y autores alternados, avance automático, progreso sincronizado, llegada a la última, controles anterior/siguiente y cierre.
- TC-S2: `prefers-reduced-motion`, lector de pantalla, teclado, focus-trap, pausa manual/mantener pulsado, pestaña en segundo plano, imagen lenta/error y retorno de foco.
- TC-S3: se cierra el evento durante la secuencia: la historia continúa visible hasta 24h; se revoca permiso y queda inaccesible inmediatamente; expira a T+24h aun si el visor estaba abierto y una nueva solicitud GET queda denegada.