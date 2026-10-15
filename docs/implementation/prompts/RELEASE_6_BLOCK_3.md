# Prompt — PlanIt R6 · Bloque 3: Agregaciones demográficas protegidas y visualización

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-02.CA-01, 03 y 04 (preparación CA-02).  
**Dependencias para iniciar:** B0 D04 y D08 aprobadas, B1+B2 integrados; permiso sobre demografía explícito.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Implementar sólo agregaciones de participantes confirmados para **edad agrupada y sexo declarado**, sin exponer fecha de nacimiento/sexo individual y sin habilitar inferencia de grupos pequeños. Añadir paneles accesibles con estados de datos insuficientes.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`supabase/migrations/<nueva>_r6_demographic_aggregates.sql`, `src/features/analytics/api.ts`, `src/components/analytics/DemographicsPanel.tsx`, `scripts/check-r6-demographics*.mjs`, `docs/qa/r6-block-3/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Validar firma, modelo `profiles.birth_date`, `sex=female|male|other|NULL`, cobertura de confirmed y privacidad R5. Definir fecha de cálculo (consulta/evento) según D08 aprobada. Edad derivada por cumpleaños real (`age` con fecha local).
2. Crear RPC owner-only: `auth.uid()` y propiedad antes de consultar datos; respuesta **agregada solamente** por buckets fijos y tipos reales, con categoría sin informar. No retornar user_id, UUID de participación, edad exacta ni atributos individuales, tampoco en logs/errors.
3. Implementar supresión anti-reidentificación a nivel servidor según D04. Probar cohortes <k, grupos complementarios, unknown, queries repetidas, diferencia entre buckets y totales, exportaciones y cambios de población; si no se puede garantizar protección, no devolver desglose.
4. Usar `SECURITY DEFINER` sólo si RLS actual exige leer profiles/participations privados, con `search_path` vacío, nombres calificados, EXECUTE mínimo, no hacer GRANT SELECT público sobre profiles. No usar proyección social como sustituto.
5. Crear gráficos muy legibles (barras CSS/SVG semántico o tabla), etiquetas explícitas y versión textual/tabular; nunca usar la ausencia de gráfico como «0%». Diferenciar «no declarado», «sin datos» y «dato oculto por privacidad».
6. Probar perfiles NULL, sexo `other`, cumpleaños hoy y 29/02, 0/1/4/5/10 participantes; probar acceso directo REST/JWT y performance con agregados 1.000; documentar DDL remoto pendiente sin aplicar.

## Escenarios mínimos de verificación reproducibles

- cohorte pequeña no expone grupo por JSON ni UI, ni por complementos `total - otros`.
- Propietario autorizado ve buckets coherentes; D ajeno/anon/participante B/oculto link C recibe denegación segura.
- No se expone `birth_date`, `sex`, email ni identificadores personales en RPC, Realtime, DOM, logs y snapshots.
- Cambio de sesión/refresh nunca conserva gráfico privado anterior y opciones `female/male/other/NULL` están mapeadas correctamente.

## Entregable y puerta de revisión

RPC agregada y UI segura, reglas de supresión y batería de privacidad con evidencias; no marcar CA-02 completa antes de B4.

**Gate de privacidad:** si D04/D05/D06 no están aprobadas o los desgloses permiten reidentificar individuos, el bloque está BLOQUEADO y NO debe publicar respuestas inseguras.

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
