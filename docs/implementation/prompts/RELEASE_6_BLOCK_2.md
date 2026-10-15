# Prompt — PlanIt R6 · Bloque 2: Panel de ocupación y navegación del organizador

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-01.CA-01..04 (UI).  
**Dependencias para iniciar:** B1 integrado y contratos de datos autorizados.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Implementar interfaz de ocupación en `/events/:id/analytics` y enlace desde gestión de un evento propio, conservando navegación y diseño **B · Amanecer**. No crear un nuevo acceso de participante ni una pestaña de navegación primaria.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`src/App.tsx`, `src/components/EventManagement.tsx`, `src/pages/EventAnalyticsPage.tsx`, `src/pages/event-analytics.css`, `src/features/analytics/*`, `scripts/check-r6-occupancy-ui.mjs`, `docs/qa/r6-block-2/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Examinar el patrón de `AppLayout`/`RequireAuth`, `EventManagement`, `ScreenHeader`, `EventDetailPage`, hooks de sesión y CSS. Dibujar transiciones loading, empty, error, forbidden, data, stale y vuelta a detalle/lista; diseñar sin tocar `DESIGN.md`.
2. Agregar ruta lazy protegida; solo mostrar navegación Estadísticas desde gestión de eventos propios, pero **no confiar** en ocultarla para autorización. Para acceso directo sin permiso, mostrar error neutro/estado seguro; no mostrar título ajeno cargado previamente.
3. Mostrar cuatro KPI con valor y unidad, barra de ocupación con etiqueta semántica, fecha de actualización y estado del evento; `capacity=0` inválido como N/D, no NaN. Usar «inscriptos confirmados» por ausencia de check-in.
4. Añadir capa TS de llamada a RPC con `AbortSignal` o patrón de cancelación, request-key `(userId,eventId)`; limpiar estado al navegar otro evento y tras cambio de sesión; deshabilitar resultados obsoletos y reintentar de forma explícita.
5. Reusar tokens Amanecer `--pi-*` sin tarjetas anidadas, sin gradientes en controles, sin estilos legacy nuevos; contrastes y foco visible, tabla textual equivalente del indicador.
6. Comprobar mobile 320, 360, 375, 390, 768, 1280; zoom 200%, altura corta, accesibilidad de barra/heading y formatos es-AR. Evidencias screenshots de UI ejecutada, no de Figma/mock.

## Escenarios mínimos de verificación reproducibles

- KPI con cupo 10 confirmado 4 muestra 6 vacantes, 40%; después de retiro/manual refresh muestra 7, 30%.
- Ruta de ajeno, sin login, link-only oculto, usuario de R5 que sigue al organizador: sin panel/no leakage.
- Timeout, error RPC, reconexión y cambio de sesión no exhiben datos cacheados de la cuenta anterior.
- Cancelado, archivado y 0 confirmados: valores y rótulos explícitos sin confundir con presencia física.

## Entregable y puerta de revisión

Ruta, acceso contextual, cuatro KPI y comportamiento responsive/seguro; capturas reales y verificación RF-R6-01, sin R6-02 aún.

## Instrucciones obligatorias y fuentes de verdad (aplican a ESTE bloque)

1. Antes de intervenir, leer `AGENTS.md` y `src/AGENTS.md`, `supabase/AGENTS.md` y `docs/design/AGENTS.md` si afecta esos ámbitos; `PRODUCT.md`, `DESIGN.md` (B · Amanecer), `docs/architecture.md`, `docs/database.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/UI_WORKFLOW.md`, `docs/implementation/RELEASE_6_PLAN.md`, `RELEASE_6_DECISIONS_PROPOSED.md`, `RELEASE_6_STATUS.md`, `docs/requirements/RELEASE_6_REQUIREMENTS.md` (RF/CA **literales**), `docs/qa/RELEASE_6_ACCEPTANCE.md`, `RELEASE_6_TEST_PLAN.md`, además de planes/estado/QA R5. Las fuentes funcionales prevalecen sobre el código no aceptado, el mockup histórico y los prompts.
2. `main` verificado para documentación en `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026): **fotografía, NO SHA reutilizable**. Revalidar `git status`, `fetch`, HEAD y PR/depencias al iniciar. `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` ahora acreditan **R5 Validado, GO por aceptación humana**; no transformar QA JWT/Realtime no ejecutada en PASS ni suponer PR integrada sin comprobar.
3. Stack obligatorio: React 19, TypeScript, Vite 8, React Router, Supabase Auth/Postgres/RLS/Storage/Realtime; no Next/Expo, nuevo backend, ORM ni librería pesada de gráficos sin caso aprobado. Convención fechas `timestamp without time zone` como hora de Argentina; no añadir `events.timezone`; no guardar contadores redundantes. Reutilizar `src/features`, `src/pages` y `src/components` reales y tokens Amanecer `--pi-*`.
4. Trabajar en rama `codex/r6-block-N` (N = este bloque) **desde base integrada y limpia**, un PR draft por bloque; **no merge, no DDL remoto, no `supabase db push`, no deploy, no secrets ni actualización de Google Doc sin permiso expreso**. Proyecto Supabase modificable sólo previa aprobación: `planit-v2`; proyecto anterior read-only. No editar migraciones históricas ya aplicadas. Evitar operaciones destructivas sin autorización.
5. Autorización **en servidor**: `auth.uid()` y ownership de evento; RLS + GRANTS seguros, `SECURITY DEFINER` sólo justificado con `set search_path=''` y nombres SQL calificados, EXECUTE únicamente `authenticated`, no permitir SELECT indiscriminado a `profiles`, `participation_history` ni avisos. Acceso por enlace `unlisted`, follow o chat NO autoriza estadísticas. Los atributos `birth_date`/`sex` individuales y correo no se muestran ni exportan.
6. Probar lo cambiado con aserciones ejecutables reales, incluidos negativos por acceso directo; declarar por separado SQL local, HTTP/JWT de usuario real, UI navegador, Realtime y dispositivos (`PASS/FAIL/NOT RUN/BLOCKED`). `npm run build`, `npm run lint`, regresiones y suite específica. Mocks/UI visual no certifican permisos RLS remotos ni una entrega Realtime real. Cada migración tiene cuatro marcas distintas: **creada**, **probada local**, **aplicada remota autorizada**, **verificada remota**.
7. Diseño: mobile-first, tabla/alternativa textual para gráficos, loading/empty/error/retry y estado sin datos, foco/teclado, zoom200%, contraste, reduced-motion, 320/360/375/390/768/1280, screenshots de la app **ejecutada**, no imágenes simuladas; no modificar el DESIGN.md aprobado. Un bloque NO implementa otro por adelantado.

## Reporte de cierre obligatorio (sin autovalidarse)

Registrar SHA base y HEAD final, rama/PR draft, dependencias y acuerdos, inventario diff, firma RPC/ACL/triggers/migraciones y amenazas, comandos y resultados por capas, cobertura de CA, capturas de la aplicación real si hay UI, benchmarks si hay SQL, evidencias `docs/qa/r6-block-N/`, riesgos, inconsistencias, estado `Implementado; QA pendiente` cuando corresponda, y permiso humano para próximo bloque. **Detenerse al terminar este bloque.**
