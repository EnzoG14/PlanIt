# Prompt — PlanIt R6 · Bloque 8: Comparación agregada de eventos propios

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-06.CA-01..04.  
**Dependencias para iniciar:** B1/B2 integrados y D09/D10 definidos; no usar datos sociales.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Crear comparación de **al menos dos eventos propios** con la MISMA fórmula de ocupación de B1, mediante consulta batch estrictamente autorizada e interfaz responsive/table-first. No comparar eventos de otros organizadores ni mostrar porcentajes inválidos.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`supabase/migrations/<nueva>_r6_compare_events.sql` si hace falta, `src/pages/CompareEventsPage.tsx`, CSS scoped, `src/pages/MyEventsPage.tsx`, `src/App.tsx`, `src/features/analytics/api.ts`, `scripts/check-r6-compare*.mjs`, `docs/qa/r6-block-8/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Investigar listado de eventos organizados R3 y estados oculto/cancelado/archivado; lista habilitada debe incluir exclusivamente eventos propios y ofrecer filtros sin perder el estado de selección.
2. Implementar RPC batch `uuid[]` con normalización, UNIQUE, cardinalidad 2..N según D10; validar que **TODOS** los IDs tienen organizer_id=auth.uid() ANTES de devolver resultados. Con mezcla propio/ajeno se rechaza todo, no devolver parcial.
3. Calcular count confirmed/capacity/available/percent con la misma CTE/expresión de B1. Manejar capacidad inválida legado con null/«N/D», nunca división por cero; confirmar que los datos del panel individual y comparación no difieren por filtros.
4. Añadir ruta `/my-events/compare` bajo auth y acceso secundario desde Mis eventos sin nuevo dock; selector multi y vista tabular/barras accesible en móvil, con título, estado y corte por evento.
5. Evitar race al cambiar 2/3/10 IDs, mezclar sesiones, reorden y resultados antiguos; usar request key y limpieza de contexto; estados loading, empty (<2 propios), invalid, error, retry y retorno.
6. Probar 2..10 (o aprobado) y duplicados/reorden de selección; SQL/HTTP JWT IDOR, XSS título, rendimiento set-based vs N+1, capturas responsive y regresiones Mis eventos.

## Escenarios mínimos de verificación reproducibles

- Eventos A cap10 con 4 confirmed y B cap20 con 15 confirmed -> 40%/75%, iguales panel.
- Selección de 1 o 0: bloqueo accesible; 2 funciona, más del máximo se rechaza.
- Mezcla A-propio y D-ajeno: RPC rechaza todo sin revelar título/existencia de D.
- Cambio de selección rápido no mezcla eventos; eventos archived muestran estado, cap0 legacy -> N/D.

## Entregable y puerta de revisión

RPC batch, pantalla comparativa, QA permisos/responsive y 4 CA, sin introducir predicción ni exportación comparativa no autorizada.

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
