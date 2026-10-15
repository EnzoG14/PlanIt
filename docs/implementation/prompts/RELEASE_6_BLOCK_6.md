# Prompt — PlanIt R6 · Bloque 6: Productor transaccional de alerta por cupo completo

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-05.CA-01,03,04 (servidor).  
**Dependencias para iniciar:** B0 (D07 aprobada: aviso por episodio lleno→libre→lleno); B1 y esquema de notifications/cupos auditados.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Crear notificación `event_full` al organizador cuando una inscripción confirmada real completa capacidad. El efecto debe ser transaccional, privado e idempotente, aun con concurrencia, reintento y reingreso; no introducir Web Push.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`supabase/migrations/<nueva>_r6_event_full_notifications.sql`, scripts `check-r6-event-full*.mjs`, `docs/qa/r6-block-6/*`, sin modificar migraciones aplicadas

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Inspeccionar versión **más reciente** de `register_for_event`, `resolve_rejoin`, `leave_event`, `remove_participant`, `update_event`, trigger participation history y `notifications`; verificar orden de locks y triggers existentes, no confiar en migración inicial obsoleta.
2. Especificar caso de evento inicialmente lleno, reintento de confirmed existente, salida y vuelta, reingreso `removed`, reducción de capacidad, evento archivado, dos registrantes peleando última plaza; definir dedupe por episodio conforme D07, no usar un UNIQUE global que pierda transiciones legítimas.
3. Implementar productor server-side acoplado a transición de estado real y comprobación bajo lock del evento; insertar notification en **misma transacción** que confirmación. Si el insert falla debe existir rollback coherente, y no generar notificación al usuario si la inscripción no se confirmó.
4. Mínima tabla de control opcional sólo si realmente necesaria para idempotencia: RLS, grants mínimos, índice único sobre episodio/evento; nunca almacenar duplicado de contador ocupación sin pruebas de consistencia. Trigger privado `planit_private`, REVOKE EXECUTE, buscar permisos/performance.
5. `notifications` actual almacena `recipient_id`, `event_id`, tipo y texto. Usar `event_full`, contenido sin PII de participante, sin `actor_id` innecesario, `event_id` validado, RLS recipient-only. No enviar email/push.
6. Pruebas SQL de serialización/concurrencia con dos sesiones y rollback forzado; HTTP JWT real cuando autorizado, Realtime se prueba en B7; no editar remoto o activar trigger sin permiso expreso.

## Escenarios mínimos de verificación reproducibles

- capacidad=2; primera confirmed no notifica, segunda confirmed inserta **una** notification owner.
- mismo RPC repetido, pérdida de respuesta, doble concurrencia: un aviso por evento/episodio correcto.
- full→free→full se comporta EXACTAMENTE como D07 aprobada; capacity editing no produce aviso salvo acuerdo.
- fracaso de trigger -> rollback de confirmación completo; actor ajeno y anon no leen aviso.

## Entregable y puerta de revisión

SQL de productor y dedupe, pruebas race/rollback con resultados reales y evidencia de 4 estados de migración; NOT RUN remoto hasta autorización.

**Gate transaccional:** no insertar aviso como efecto secundario de frontend, cron/polling o un POST independiente de confirmación que permita divergencia entre inscripción y aviso. Si no se logra una invariante idempotente, detener y elevar riesgo.

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
