# Prompt — PlanIt R7 · Bloque 7: Exportación ICS y calendario del dispositivo

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente ni fusionar la PR.**  
**Alcance normativo:** RF-R7-05.CA-01..04.  
**Precondición:** B0 aprobado; sin depender de B1–B6 salvo merge ordenado.  
**Tipo de tarea:** implementación (excepto B0: auditoría y acta; B11: QA y acta). **Producto D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 confirmado; sólo D06 y detalles técnicos pendientes de B0.**

## Objetivo y contrato de salida

Ofrecer calendario del dispositivo con `.ics` y, enlace oficial «Agregar a Google Calendar» con formulario precargado, sin OAuth; precisión de huso horario AR y mensajes de estado.

## Archivos a auditar o intervenir (ubicaciones propuestas)

- `src/features/events/calendar.ts`, `src/pages/EventDetailPage.tsx` (**sólo lectura; B11 realiza la integración**)
- `src/features/events/validation.ts` (fechas), `src/features/events/api.ts`
- `scripts/check-r7-calendar*.mjs`, `docs/qa/r7-block-7/*`

**Atención:** los paths sugeridos no son una orden de duplicar código ni prueba de existencia de una API. Antes de escribir, confirmar nombres/firmas reales y contratos R1–R6.

## Plan detallado de implementación

1. Crear generador **puro** sin red de archivo RFC 5545: VCALENDAR/VEVENT, SUMMARY, DTSTART/DTEND, UID, DTSTAMP, LOCATION opcional. Escape caracteres reservados y CRLF para evitar inyección y fold por bytes UTF-8.
2. Convertir `timestamp without time zone` representando Argentina a UTC de modo determinista; no `Date.parse` dependiente de timezone del navegador; testear browser timezone distinta.
3. Descargar con MIME correcto/filename seguro y limpiar blob URL; si soporte nativo disponible usar fallback compatible sin exigir permisos imposibles en web.
4. Exportar `EventCalendarAction` para que **B11 lo añada** al detalle sin requerir inscripción cuando el detalle es visible; para ocultos no exportar link ni campos restringidos del evento a calendario de tercero sin aprobación explícita.
5. Textos UX: "Descargar invitación" / "Abrir archivo de calendario" en lugar de "Agregado" sin confirmación; cancelar no comunica éxito.
6. No agregar APIs de Google/Apple Calendar ni sincronización bidireccional por iniciativa.

## Casos mínimos de verificación reproducible

- **R7-B7-TC-01:** Fechas +03 sin offset implícito; fin>inicio, cruce medianoche/mes/año.
- **R7-B7-TC-02:** Título Unicode, saltos de línea, coma, punto y coma, backslash, emojis, validación parser RFC y cliente calendario.
- **R7-B7-TC-03:** Descarga y abrir .ics en navegador móvil/desktop; no permisos falsos ni éxito tras cancelar.
- **R7-B7-TC-04:** Sin fuga de datos restringidos en contenido del archivo.

## Entregable, gate de revisión y prohibiciones

Entregar helper probado, **componente aislado**, evidencia ICS/Google prefill real cuando aprobado, build/lint y PR draft. B8 puede ejecutarse en paralelo; el wiring del detalle pertenece exclusivamente a B11.

Entregar un **reporte de estado del bloque en su PR** (p. ej. `docs/qa/r7-block-7/STATUS.md`) con evidencia, estados por criterio/capa y pendientes; **B11 consolida `RELEASE_7_STATUS.md`** para evitar conflictos entre ramas paralelas. Si aparece una contradicción entre fuente normativa y arquitectura propuesta, **detener la decisión cuestionada y elevarla**, no redefinir el RF por cuenta propia.

## Instrucciones obligatorias y fuentes de verdad para ESTE bloque

1. **Leer antes de tocar código:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` según archivos afectados, `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/requirements/RELEASE_7_REQUIREMENTS.md` (**7 RF/29 CA literales**), `docs/implementation/RELEASE_7_PLAN.md`, `RELEASE_7_DECISIONS_PROPOSED.md`, `RELEASE_7_PARALLEL_WORK.md` y acta B0 aprobada, `RELEASE_7_STATUS.md`, `docs/qa/RELEASE_7_ACCEPTANCE.md` y `RELEASE_7_TEST_PLAN.md`. Revisar docs de R6 como **baseline presumida estable**, sin abrir arreglos pendientes de R6.
2. **Validar Git al iniciar**: `git status`, HEAD, rama base, PRs integradas y migraciones reales; cualquier SHA de esta planificación es fotografía, **no** base reutilizable. Usar worktree independiente `codex/r7-block-7` donde N = número de este bloque, **1 PR draft por bloque**, desde base limpia que incluya **sus prerequisitos integrados**. Otras tareas independientes pueden ejecutarse en paralelo. Respetar **ownership exclusivo de rutas** de `RELEASE_7_PARALLEL_WORK.md`. Nunca auto-merge.
3. **Stack/invariantes**: React 19, TypeScript, Vite 8, React Router, VitePWA, Supabase Auth/Postgres/RLS/Storage/Realtime/Edge sólo si necesario. Convención `timestamp without time zone` para datos propios en horario Argentina; jamás añadir `events.timezone`, no Next/Expo, no ORM/backend adicional ni librería pesada sin caso validado. Respetar mobile-first y tokens `--pi-*` de Amanecer, sin inventar una nueva identidad visual.
4. **Privilegios/seguridad**: solo `auth.uid()` server-side; RLS desde CREATE, grants mínimos, Storage policy debe contemplar OR con policies existentes; `SECURITY DEFINER` excepcional con `search_path=''`, nombres calificados, validación JWT y `REVOKE EXECUTE FROM PUBLIC, anon`, `GRANT` sólo a roles necesarios. No secretos/`service_role`/VAPID privados en `VITE_*`, cliente, logs o PR.
5. **Ejecución restringida:** proyecto modificable sólo con permiso separado `planit-v2`; proyecto histórico read-only. **No DDL remoto, `supabase db push`, cron activo, Edge deploy, secrets, merge, `main`, ni edición Google Doc sin permiso expreso**. Nunca editar migraciones históricas aplicadas. No reemplazar documentación normativa por propuesta de código.
6. **Pruebas honestas**: `npm run build`, `npm run lint` para código frontend; tests SQL/fixture, accesos negativos HTTP/JWT, Storage GET, UI browser, SW/offline, Push físico si aplica; usar PASS/FAIL/NOT RUN/BLOCKED por capa. Mostrar 4 marcas migración **creada / probada local / aplicada remotamente con aprobación / verificada remota**. Un mock no acredita permisos reales, una llamada Push 2xx no acredita que el usuario vio notificación.
7. **Reporte de cierre obligatorio:** base SHA, rama, PR draft, archivos alterados, RF/CA cubiertos, decisiones Dxx usadas, DB/API/Storage/SW compatibilidad, evidencia reproducible y comandos, cuatro marcas por migración, tests positivos/negativos/concurrencia/errores, UI 320/375/390/768/1280 si afecta visual, regresiones R1–R6, riesgos/restricciones, decisión humana que habilitaría siguiente bloque. **Detenerse después de entregar ESTE bloque; no bloquear ni ejecutar en su lugar otros bloques independientes.**

## Complemento obligatorio: Google Calendar sin OAuth (D06 CONFIRMADA)

1. Exportar un componente `EventCalendarAction` que reciba **DTO autorizado** y ofrezca **dos acciones**: «Agregar a Google Calendar» (abre un **evento precargado**, no lo guarda automáticamente) y «Descargar archivo .ics».
2. Enlace oficial documentado por Google: `https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE&dates=...&stz=...&etz=...&text=...&details=...&location=...`. Encodar con `URLSearchParams`, UTC/ISO correcto, zona IANA adecuada, texto sólo autorizado y no incluir enlaces secretos/invitaciones a ocultos.
3. Validar inicio/fin, fechas cruzando medianoche y zona horaria argentina con navegador en otras zonas; probar datos con emojis/comas y que el enlace abre pantalla de Google Calendar con datos precargados. **No usar** `calendar.events.insert`, Google OAuth, tokens ni scopes para esta alternativa; la API de inserción sería un proyecto aparte.
4. NO cambiar `EventDetailPage.tsx` ni `src/App.tsx`: exportar el componente para B11. B7 puede desarrollarse a la vez que B1/B8/B9. D06 está aprobada; B0 define únicamente contratos de interfaz y seguridad.