# Prompt — PlanIt R6 · Bloque 0: Auditoría, baseline y congelación de contratos

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** Transversal; NO certifica criterios de aceptación.  
**Dependencias para iniciar:** HEAD actual y estado R5 B10/PR #60, migraciones remotas y decisiones de negocio.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Realizar una auditoría **READ ONLY** del repositorio y del catálogo remoto, trazar literalmente los 6 RF y 24 CA a contratos reales, y resolver contratos D01–D12 (A01–A07 ya aprobados; sólo cerrar precisiones pendientes) antes de implementar; producir documento firmado de contratos. NINGUNA modificación funcional, DDL, migración, publicación, deploy o avance a B1.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/architecture.md`, `docs/database.md`, `docs/implementation/RELEASE_5_{PLAN,STATUS}.md`, `docs/qa/RELEASE_5_TEST_REPORT.md`, `src/App.tsx`, `src/components/EventManagement.tsx`, `src/features/events/*`, `src/features/notifications/*`, `supabase/migrations/*`, `docs/requirements/RELEASE_6_REQUIREMENTS.md`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Comprobar rama, SHA y estado de trabajo, PR integrados #50–#60 y su verdadero estado; documentar el GO humano registrado y verificar si la PR #60 está integrada realmente. No tomar estado del archivo de seguimiento como prueba de deploy.
2. Inventariar tablas, columnas, FKs, índices, RLS, GRANTS, funciones y triggers en Postgres real; funciones relacionadas con cupos, reincorporación, notificaciones y consulta de perfiles. Separar «definido en Git» de «aplicado remoto».
3. Inspeccionar rutas de escritura `register_for_event`, `leave_event`, `resolve_rejoin`, `remove_participant`, `update_event`, grants de eventos unlisted, `participation_history`, `get_notification_target`; dibujar transiciones y lock order reales.
4. Analizar disponibilidad/calidad de `profiles.birth_date`/`sex` y riesgos legales/privacidad sin extraer PII real; crear fixtures sintéticos de prueba con tamaños pequeños y composiciones adversariales.
5. Definir medición: «confirmado» versus «asistencia física»; flujos vs stock, ventanas, timezone, supresión demográfica, campos CSV/formatos, idempotencia/rearmado de alertas y comparación. Respetar A01–A07 aprobadas y marcar D03/D04/D05/D06/D08/D11 donde sólo quedan detalles técnicos; NO inventar aprobación de defaults no expresos.
6. Proponer firmas RPC, JSON (incluye `suppressed`), matriz de permisos A/B/C/D/anon, riesgos de enumeración, SQL local/HTTP real, checklist de releases previas y estimación de índices y rendimiento.
7. Entregar `RELEASE_6_BLOCK_0_DECISIONS.md` a partir de la plantilla y actualizar STATUS, decisiones y riesgos; detenerse para revisión y aprobación, incluso si todo parece trivial.

## Escenarios mínimos de verificación reproducibles

- Verificar `confirmed`/`cancelled`/`removed`, reingreso y cambios de capacity con historial, identificando caminos que no disparan trigger.
- Auditar la posibilidad de deducir datos demográficos por diferencia de grupos, cambio de filtros o comparación de exportaciones.
- Verificar RLS owner-only pese a link a oculto, follow/DM, perfil bloqueado, actor sin sesión.
- Registrar `supabase migration list`, `db push --dry-run`, Remote ACL/catalog y qué NO pudo ejecutarse; nunca hacer `db push`.

## Entregable y puerta de revisión

Contrato de esquema/firmas/permiso propuesto con notas de conflictos, decisiones D01–D12 abiertas/aprobadas, recomendaciones GO/NO-GO para B1, sin CA marcadas PASS.

**Prohibido en B0:** SQL de escritura/migraciones, edición de código funcional, fixtures persistentes remotas y pruebas de carga remota no autorizadas. Entregar documento de decisiones e inconsistencias; **0/24 CA aceptados**.

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
