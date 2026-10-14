# Prompt — PlanIt R5 · Bloque 4: Editar perfil y privacidad

**Ejecutar sólo este bloque.** Alcance oficial: RF-R5-03.CA-01 a 04.

## Objetivo

Implementar RF-R5-03: formulario reutilizando perfil propio R2, nombre/username lowercase 3–24 único, bio, public/private, validaciones; Storage avatar paths ligados a propietario, MIME/tamaño, reemplazo y rollback/reconciliación si falla. Nunca actualizar ID ajeno. Conservar accepted al cambiar a private; verificar persistencia entre sesiones.

## Plan de implementación detallado

1. Comprobar estado y permisos: `git status`, SHA `main`, PR anteriores integradas y migraciones reales; validar el contrato contra la documentación R5 literal. Enumerar archivos a intervenir y cambios mínimos; no actuar sobre migraciones históricas aplicadas.
2. Antes de SQL, definir tabla de amenazas y autorización para dueño, participante confirmado, tercero, bloqueado y anónimo. Para cada consulta indicar columnas devueltas, actor y estado de relaciones; comprobar RLS y funciones privilegiadas, incluyendo consulta directa HTTP, no sólo UI.
3. Implementar de forma incremental separando persistencia, API TypeScript, vistas/componentes, estilos scoped Amanecer y casos de prueba. Verificar idempotencia, timeouts, errores y cambios de sesión; no duplicar servicios existentes.
4. Hacer tests positivos y negativos, comportamiento en concurrencia donde exista escritura; documentar exactitud de fixtures, SQL local y HTTP JWT real. El uso de mocks nunca prueba RLS real. Verificar compatibilidad con R3/R4 y la lectura de `unlisted`.
5. En UI exigir loading/empty/error/retry, foco visible, teclado móvil, long text, responsive 320/360/375/390/768/1280, accesibilidad y navegación con ruta de regreso; capturas únicamente de aplicaciones ejecutadas.
6. Documentar migración **creada**, **probada local**, **aplicada remota con permiso**, **verificada remota** como cuatro estados distintos; no usar el último sin registro. Abrir PR para revisión, no fusionar.

## Escenarios mínimos de prueba

- Usuario sin permiso intenta la misma operación por UI y acceso directo; respuesta segura y sin datos sensibles.
- Repetir acción, recargar, cancelar y forzar fallo de red; no duplicar efectos ni informar éxito incierto.
- Revalidar permisos cuando cambia estado `confirmed`/`accepted`/`blocked`/`visibility`; evitar caché que enseñe datos retirados.
- Validar que R4 unlisted sólo concede las facultades del grant específico; no autoriza relaciones sociales ni lista de asistentes.
- Comprobar que email, `birth_date`, `sex` o identificadores internos innecesarios no aparezcan en la respuesta social, logs, DOM, Realtime o screenshots.

## Instrucciones obligatorias de ejecución

Leé `AGENTS.md` + `src/AGENTS.md`/`supabase/AGENTS.md` según alcance, `PRODUCT.md`, `DESIGN.md` Amanecer, `docs/architecture.md`, `docs/database.md`, los requisitos/33 CA **literales** de R5 en Google Docs, R4 plan/status/QA, y todos los documentos `RELEASE_5_*` de este paquete. Inspeccioná rama/HEAD, migraciones SQL y objetos PostgreSQL existentes ANTES de escribir. No asumir que tablas/RPC propuestas ya existen. Trabajá en `codex/r5-block-N` desde `main` actualizado y con dependencias integradas. Un PR por bloque; **no merge**, **no DDL remoto**, **no deploy**, **no secrets** sin permiso. La base modificable sólo con permiso es `planit-v2`; el proyecto anterior es read-only. Mantener React 19/TS/Vite 8, Supabase y diseño Amanecer, sin reimplementar R1–R4 ni modificar sus CA históricos. Aplicar `auth.uid()`, RLS/ACL mínimas y no exponer columnas privadas. Tests rigurosos (unit, SQL local, HTTP JWT real sólo si autorizado, UI, Realtime/Storage según toque), build/lint, regressions. Evidencias nuevas con SHA, comandos y resultados reales; no declarar pruebas que no se corrieron; estado `Implementado; QA pendiente` hasta aceptación. Detenerse para revisión humana de PR.

## Cierre que tenés que informar

1. SHA base, rama, PR propuesto, dependencias verificadas. 2. Contrato de datos y autorización; lista precisa de archivos y nuevas migraciones. 3. Decisiones tomadas vs pendientes y compatibilidad R1–R4. 4. Casos/CA cubiertos con PASS/FAIL/NOT RUN/BLOCKED, tipo de prueba y enlaces de evidencia. 5. Evidencia de diseño y accesibilidad. 6. Riesgos, instrucciones de revisión y siguiente bloque. Actualizar STATUS y matriz de aceptación sin falsear resultados.


## Contrato R5 v1.1 obligatorio — decisiones expresas del responsable (14/10/2026)

- **D01:** bloqueo en cualquier sentido → perfil de la contraparte **«Perfil no disponible»**, sin retornar proyección social, contadores, avatar ni eventos por UI o API directa. Permitir al bloqueador gestionar desbloqueo sin filtrar perfil. **Excepción:** historial de DM existente legible; chat grupal de eventos sin cambios.
- **D02:** perfil privado no seguido aprobado → exclusivamente nombre visible, username y avatar; seguidor `accepted` → además **bio y eventos públicos** solamente, nunca eventos `unlisted` ni demográficos.
- **D03:** cualquier autenticado distinto de sí mismo inicia DM de texto sin follow, salvo bloqueo bilateral; una conversación canónica por pareja.
- **D04:** al actualizar `private → public`, aprobar `pending` existentes (`pending → accepted`) **en la misma transacción**; no aceptar rejected ni recrear relaciones borradas por bloqueo. Serializar cambios con `follow_user`/`block_user`; avisar en UI antes de confirmar, idempotencia y rollback total. Esta decisión posterior debe documentarse en Google Docs mediante autorización separada, no fingir que el criterio original la contempla.
- **D05:** bandeja de DM desde perfil y otros accesos contextuales; **no** crear nuevo tab primario.
- D06–D08 requieren auditoría técnica de bloque 0. Ningún bloque puede contradecir D01–D05 por apoyarse en la propuesta conservadora anterior. Mantener los 33 CA oficiales y las pruebas adicionales del archivo de aceptación.

### Verificación específica del bloque 4

Agregar confirmación explícita del efecto de hacer público el perfil: todas las pendientes no bloqueadas quedarán aceptadas. Invocar una sola operación transaccional, refrescar seguidos/solicitudes, manejar rollback y resultado incierto. Distinguir private→public de public→private, que conserva accepted.
