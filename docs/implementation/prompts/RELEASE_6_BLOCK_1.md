# Prompt — PlanIt R6 · Bloque 1: RPC de ocupación de evento, RLS y contrato seguro

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-01.CA-01..04, soporte RF-R6-06.  
**Dependencias para iniciar:** Bloque 0 revisado y decisiones de ocupación/autorización definidas; dependencia R5 habilitada.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Crear una **consulta de ocupación exclusiva del organizador**, reusando `events` y `event_participations`; no persistir métricas derivadas ni ampliar RLS del detalle público ni exponer perfil privado. Diseñar API basada en la BD vigente (firma propuesta `get_my_event_occupancy(uuid)`).

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`supabase/migrations/<nueva>_r6_organizer_occupancy.sql`, `src/features/analytics/{api,types,format}.ts` si se necesita contrato tipado, `scripts/check-r6-occupancy.mjs`, `docs/qa/r6-block-1/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Inventariar `events`, `event_participations`, `get_event_participation_summary`, políticas y funciones previas. Decidir SECURITY INVOKER vs DEFINER justificando. Para DEFINER usar `search_path=''`, objetos calificados, autorización `e.organizer_id=auth.uid()` incluso para 0 filas, `REVOKE` PUBLIC/anon, `GRANT EXECUTE` mínimo.
2. Consulta SQL: cargar un solo evento propio sin inferir existencia de ajenos; agregar sólo filas status=`confirmed` con LEFT JOIN y COUNT, no contar al organizador. `available_spots=max(capacity-confirmed,0)`; ratio usando conversión numeric y protección de denominador inválido.
3. Definir respuesta tipada: id, título, estado open/ended/cancelled/archived, capacity, confirmed, available, percent o null, corte temporal. El rounding solo presentación, con función de formato y no en SQL salvo acuerdo.
4. Probar con evento sin inscriptos, cupo lleno, cancelled/removed, reincorporación, cambio de cupo y archivado; comparar con cálculo manual y resumen R1.
5. Ejecutar replay SQL local sobre esquema migrado desde cero, pruebas de funciones/ACL y HTTP real autenticado únicamente con permiso. Una llamada owner sobre evento ajeno, inexistente y oculto debe ser indistinguible a nivel acceso.
6. Medir EXPLAIN con fixtures y revisar índice existente `(event_id,status)`; crear índice sólo si hay evidencia. Documentar migración creada/local/remote aplicada/verificada en columnas independientes.

## Escenarios mínimos de verificación reproducibles

- capacidad 10; 4 confirmed + 2 cancelled + 1 removed → 4, 6 y 40%.
- capacidad 1; dos confirmaciones simultáneas -> nunca >100% ni segundo confirmed.
- Evento de D que A conoce por URL o link oculto: RPC owner-only no entrega fila ni diferencia sensible.
- B/C confirmed, follow approved, anon: ningún dato del panel, por REST y función directa; propietario sí incluso archived.

## Entregable y puerta de revisión

Migración nueva local, tests SQL reproducibles, tipado RPC y evidencia QA con matriz seguridad y fórmulas; **NO** ejecución remota sin permiso.

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
