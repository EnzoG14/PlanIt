# Prompt — PlanIt R6 · Bloque 5: Exportaciones CSV de asistentes y estadísticas

**EJECUTAR SÓLO ESTE BLOQUE. NO continuar automáticamente al siguiente.**  
**Alcance oficial:** RF-R6-04.CA-01..04.  
**Dependencias para iniciar:** B0 D05/D06 aprobadas, B1..B4 integrados; esquema y límites cerrados.

**Acuerdos R6 vigentes (14/10/2026):** confirmed (no check-in); series separadas **altas/reincorporaciones/bajas**; demografía agrupada y supresión de cohortes pequeñas; **CSV de asistentes + CSV de estadísticas**; aviso nuevo por episodio lleno→libre→lleno; comparación 2–10 de todos los estados de eventos propios. **R5: GO humano/Validado en main**, con auditoría de dependencias al iniciar. Consultar D01–D12 para precisiones técnicas todavía abiertas; **no volver a preguntar A01–A07**.

## Objetivo

Exportar **datos autorizados** de asistentes y estadísticas filtradas en CSV, sin exponer demográficos individuales ni ceder autorización al navegador. Proteger contra inyección de fórmulas CSV y archivos parciales. Respetar delimitador, BOM y límites aprobados.

## Archivos a inspeccionar y/o intervenir (según auditoría del estado real)

`supabase/migrations/<nueva>_r6_export_projection.sql` (si hace falta), `src/features/analytics/{api,csv}.ts`, componente de descarga en `EventAnalyticsPage.tsx`, `scripts/check-r6-csv*.mjs`, `docs/qa/r6-block-5/*`

La enumeración es una **propuesta de ubicaciones**, no una orden de crear ficheros duplicados ni prueba de que tales APIs existan. Reutilizar código y contratos existentes siempre que superen seguridad.

## Plan de implementación detallado

1. Congelar columnas CSV de asistentes y CSV estadístico de D05/D06. Verificar campos realmente autorizados por RF, gestión R3 y seguridad R5, sin incorporar email, DOB, sexo individual, tokens de invitación, bio, mensajes ni IDs técnicos.
2. Crear RPC de exportación **owner-only**, con paginación estable y validación de cursor/límite en servidor. Si los datos R3 ya son accesibles solo al organizador, reutilizar proyección sin duplicar lógica; no habilitar `SELECT public.profiles` a terceros.
3. Usar serie ya autorizada de B4 para CSV agregado, mantener la misma definición/buckets/rango y supresión de B3; no construir un dataset que permita reconstruir grupos pequeños por diferencia.
4. Implementar serializador `csv.ts` probado: delimitador elegido (`;`/`,`), `"` escapadas doble, saltos de línea, unicode/acentos, BOM UTF-8 si acordado, convención numérica/documentación. Neutralizar fórmula `= + - @` también tras espacios/control con medida reversible documentada.
5. Descargar únicamente tras terminar todas las páginas y comprobar mismo evento/usuario/rango/versión; ante fallo, aborto, timeout, sesión cambiada o límite, descartar buffer/blob sin informar éxito.
6. Crear interfaz de selección y CTA diferenciados; si cero filas, aviso de ausencia o CSV sólo cabeceras **según decisión**, nunca success engañoso. Probar parser externo, grandes lotes y cancelación/retorno; comprobar en web y móvil PWA.

## Escenarios mínimos de verificación reproducibles

- `=HYPERLINK(...)`, `+1+2`, `-cmd`, `@SUM`, tab + `=SUM` y comillas/comas/salto: inertes en Excel y parser válido.
- Evento público/oculto ajeno y usuario con URL o follow: HTTP RPC export bloqueada.
- 1001+ filas paginadas y fallo en página N: no archivo incompleto ni mezcla entre filtros.
- CSV estadístico y chart con mismo rango tienen cantidades idénticas; no PII cruda ni desgloses suprimidos.

## Entregable y puerta de revisión

Exportaciones definidas, serializador y pruebas de seguridad, integridad, privacidad y formatos; matriz de 4 CA.

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
