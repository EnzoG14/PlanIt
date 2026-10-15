# Prompt — PlanIt R6 · Bloque 7: Notificación in-app, navegación y Realtime

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-05.CA-02..04 (cliente/bandeja).  
**Dependencias para iniciar:** B6 implementado, probado e integrado; migración aplicada remotamente sólo si aprobada.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Integrar `event_full` en el centro y campana de notificaciones existente, asegurando destino seguro al evento y actualización Realtime/recuperación sin duplicar entradas. Mantener compatibilidad con avisos DM/seguimiento existentes.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`src/pages/NotificationsPage.tsx`, `src/features/notifications/{api,NotificationsProvider}.ts*`, posible nueva migración incremental para `get_notification_target`, `scripts/check-r6-event-full-ui.mjs`, `docs/qa/r6-block-7/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Auditar los últimos reemplazos SQL de `get_notification_target`, `get_notifications`, canales `notifications`, acceso a event cuando cancelled/archived/unlisted y las rutas actuales antes de tocar nada; garantizar que event_full no rompe targets direct_message y follow_request.
2. Agregar etiqueta amigable «Cupo completo», contenido del título/evento sin datos de participantes, icono/estado leído y navegación. Obtener destino **del RPC autenticado**, nunca interpolar IDs desde body ni permitir URL externa.
3. Revalidar ownership/destino al pulsar. Si el evento ya no es accesible o cuenta ha cambiado, mostrar error neutro; una notificación no concede acceso por sí misma.
4. Reutilizar infraestructura de Realtime y reconciliación/consultas que ya existe, con suscripciones asociadas al usuario y teardown al cerrar sesión. Probar repetición de mensaje de Realtime, reconexión y doble inicialización; actualizar campana sin usar eventos para inflar un contador local acumulativo.
5. Evaluar estados disabled/archived, notificación vieja, ausencia de canal Realtime y refresco manual. Accesibilidad y responsive en el centro, focus/teclado, PWA sin cachear datos privados.
6. Regresión de los tipos preexistentes event_update/chat/follow_request/direct_message y `read_at`; pruebas HTTP JWT a recipient B y C/anon; no confundir la existencia del canal con entrega real.

## Escenarios mínimos de verificación reproducibles

- Cupo lleno en evento de A: A ve una entrada legible, campana incrementa, al abrir se resuelve a `/events/:id` y lectura funciona.
- B y D no ven ni reciben aviso, aunque conozcan eventId/notificación UUID; bloquear REST/RPC/Reatime.
- Retransmisión Realtime o recarga no duplica elemento; desmontaje/sesión evita mezcla de bandejas.
- Avisos antiguos de DM/follows siguen navegando; event_full con evento archivado/sin permiso muestra error seguro.

## Entregable y puerta de revisión

Soporte `event_full` en campana/bandeja y navegación con QA UI/Realtime y regresión R2/R5; no afirmar Web Push.

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
