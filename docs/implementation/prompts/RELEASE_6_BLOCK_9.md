# Prompt — PlanIt R6 · Bloque 9: QA integral, amenazas y decisión de entrega

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** Todos los 24 CA de R6 + regresiones R1–R5.  
**Dependencias para iniciar:** B0–B8 integrados y aceptados por bloque; estado R5 decidido; permisos para pruebas remotas/dispositivos gestionados.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Auditar toda R6 **sin implementar funcionalidad nueva por defecto**. Ejecutar pruebas reproducibles por RF/CA y superficie, generar informe `RELEASE_6_TEST_REPORT.md` con evidencias por capas y decisión GO/NO-GO; nunca convertir pruebas simuladas en aceptación funcional ni hacer merge/deploy sin permiso.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`docs/qa/RELEASE_6_ACCEPTANCE.md`, `docs/qa/RELEASE_6_TEST_PLAN.md`, `docs/qa/RELEASE_6_TEST_REPORT.md`, `docs/qa/r6-block-9/*`, `docs/implementation/RELEASE_6_STATUS.md`, `scripts/check-r6-release*.mjs`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Fijar base SHA, PR B0–B8 realmente integradas, decisiones D01–D12, catálogo real vs migrations en Git/local/remoto, DDL aplicado con permiso y si R5 mantiene bloqueos. Auditar objetos/RLS/ACL incluso funciones SECURITY DEFINER.
2. Mapear 24 CA oficiales exactos, mínimo 1 caso positivo y 1 adversarial donde aplique, con dataset y actor conocidos; registrar estado SQL-local, HTTP-JWT, UI, Realtime y aceptación integral por separado, prueba y fuente exacta.
3. Probar seguridad A/B/C/D/anon, oculto link-only, eventos cancelados/archivados, follows y block R5; demostrar que SELECT directo, RPC, CSV, cache/DOM, Realtime, error y logs no filtran demographics ni otro evento.
4. Verificar series de registration/cancelled/removed/rejoin, buckets límites y paridad CSV; ocupación panel vs compare; aviso último cupo con concurrencia, timeout, rollback y múltiples episodios; test rearmado exacto D07.
5. Ejecutar suites unit/integration/regression existentes R1–R5 y nuevas check:r6:*; build/lint, migraciones replay y security advisors cuando posible; rendimiento SQL/EXPLAIN y límites de export. No confundir PASS local con produccion.
6. Ejecutar QA UI de app real móvil/web con capturas a 320/360/375/390/768/1280 y zoom 200%, keyboard/focus/contrast, conexiones lentas, PWA manifest/offline; dispositivo físico y Realtime entre usuarios si hay autorización.
7. Entregar acta con defectos P0/P1/P2, discrepancias documentos/decisiones, pruebas bloqueadas y NO-GO por falta de QA human/JWT. Concluir con GO sólo si todo está probado y responsable lo aprueba expresamente; dejar estado honesto.

## Escenarios mínimos de verificación reproducibles

- 24 filas CA revisadas con evidencia/version/actor; ninguna marcada PASS si solo fuente/copias.
- RLS/ACL y desviaciones prueban no acceso a demográficos y export de evento ajeno por REST/JWT verdadero.
- Evento lleno: doble inscripción, reintento, reingreso, capacity change, rollback, full→free→full con aviso correcto.
- Gráficos/CSV coinciden; formula injection neutralizada; contraste y UX con capturas; regresión R1–R5 y R5 gate.

## Entregable y puerta de revisión

`RELEASE_6_TEST_REPORT.md` verificable con GO/NO-GO y pendientes, matriz de 24 CA, índice de evidencias y decisión de responsable pendiente si no consta.

**Clasificación del resultado:** «local PASS», «HTTP con JWT real PASS», «Realtime real PASS» y «humano aprobado» deben permanecer independientes. PR abierto, SQL aplicado y 24 filas marcadas no significan automáticamente GO.

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
