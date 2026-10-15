# Prompt — PlanIt R6 · Bloque 4: Períodos, evolución histórica y tendencias

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-03.CA-01..04 y RF-R6-02.CA-02.  
**Dependencias para iniciar:** B0 D02/D03 aprobadas; B1, B3 integrados.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Incorporar selector de intervalos y serie histórica que represente fielmente altas, reincorporaciones y bajas de `participation_history` en horario argentino. Evitar etiquetar conteos de movimientos como si fueran ocupación o asistencia física.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`supabase/migrations/<nueva>_r6_participation_series.sql`, `src/components/analytics/{PeriodSelector,TrendPanel}.tsx`, `src/features/analytics/*`, `scripts/check-r6-periods*.mjs`, `docs/qa/r6-block-4/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Auditar trigger final `record_participation_history`, valores `previous_status`, `new_status`, `reason`, `created_at` y latencia/concurrencia de todas las transiciones. Proponer definición SQL exacta conforme D02 aprobada y fixtures que la hagan verificable.
2. Crear RPC owner-only `p_event_id,p_from,p_to,p_bucket` con límites y rangos `[from,to)`, día/semana local Argentina sin TZ; validar `from<to`, máximo de período, buckets, parametrización e identidad antes de agregación.
3. Distinguir nuevas `NULL→confirmed` de retorno `cancelled/removed→confirmed` y salidas `confirmed→cancelled/removed`; separar métricas según producto aprobado. Para stock histórico aplicar reconstrucción por último estado al corte, no suma ingenua de registros.
4. Agregar presets 7/30/90 días y personalizado sólo si aprobados; aclarar si semana empieza lunes, si se incluye día corriente y cómo se rotula «nuevas inscripciones». Etiquetar zona horaria en selector donde haga falta.
5. Usar `AbortController` y secuencia/request key para cancelar resultados tardíos, sin mostrar serie del período anterior bajo nuevo filtro. Estados sin datos, error de validación, latencia, reintento y navegación entre eventos.
6. Probar límites medianoche, día 29 febrero, cambio de mes/año y fecha faltante; no mezclar timestamps UTC de tablas de Auth con timestamp local propio. Verificar referencia de fuente, índices y EXPLAIN.

## Escenarios mínimos de verificación reproducibles

- alta lunes, baja martes, reingreso jueves: gráfico de movimientos correctos y stock si se aprobó sin doble conteo.
- 2 períodos disjuntos y cambio veloz de 90→7→30 días: solo resultado de último rango.
- `p_from>=p_to`, 366+ días o bucket desconocido: error genérico de parámetros, no consulta ilimitada.
- Evento ajeno/anon/oculto link-only no devuelve series ni totales; gráfico sin datos no simula tendencia.

## Entregable y puerta de revisión

RPC histórica, selector, serie accesible, fixture temporal con SQL/HTTP/UI y matriz RF-R6-03 y CA-02 R6-02.

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
