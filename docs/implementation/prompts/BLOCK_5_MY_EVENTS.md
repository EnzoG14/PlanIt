# Codex — BLOQUE 5: Mis eventos y navegación integral (R1-07)

## Precondiciones

Trabajá desde `main` actualizado con el BLOQUE 4 aprobado e integrado. Creá rama específica. Leé `AGENTS.md`, `src/AGENTS.md`, `docs/database.md`, `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`, mockups R1 (detalle/mapa) y R3 (pantalla «Mis eventos», SOLO como referencia visual), plan R1 y `docs/implementation/RELEASE_1_STATUS.md`. Inspeccioná el código y políticas existentes antes de tocarlo. No modificar Supabase remoto ni fusionar sin autorización.

## Objetivo

Sustituir el placeholder `/my-events` por una pantalla funcional que distinga eventos **organizados** de eventos **participados**, y que refleje creación, inscripción, retiro y reinscripción correctamente.

## Backend y datos

1. Reutilizar tablas existentes: `events` y `event_participations` (y multimedia/categorías según necesidad). No crear tablas ni un backend nuevo por defecto.
2. Consultar «Organizo» por `events.organizer_id = auth.uid()` y «Participo» por `event_participations.user_id = auth.uid()`; **no incluir eventos propios como participación**, porque el organizador no se inscribe.
3. Respetar RLS. No confiar en un `userId` pasado por parámetros del navegador; preferir `auth.uid()` y filtros aplicados en la BD. Si la política de lectura de eventos históricos no permite mostrar lo autorizado, proponer una migración incremental/restricción controlada, nunca abrir un SELECT global de cancelados/archivados.
4. Consultas eficientes sin N+1; campos necesarios, orden por fecha y relaciones mínimas. No exponer perfiles ni listados de asistentes ajenos.
5. Para `Participo`, mostrar estado `confirmed` o `cancelled` cuando corresponda y conservar la fila histórica; `removed` se gestiona con cuidado para no filtrar información privada ni simular funcionalidad R3.

## Frontend y UX

1. Implementar `/my-events` usando componentes de tarjetas/listas reutilizables. Inspirarse en el primer teléfono de R3: miniatura, título, fecha, lugar y estado; colores azules/violetas y fondo marino.
2. Separar visualmente **Organizo** y **Participo**, mediante secciones/tabs claramente accesibles. Filtrar únicamente por datos reales; no mostrar pestaña funcional «Borradores» (no hay drafts persistidos).
3. Card enlaza a `/events/:id`; acción de crear navega a `/events/new`. La gestión avanzada (editar, archivar, duplicar, administrar asistentes) corresponde a R3 y no se implementa aquí.
4. Actualizar información al navegar después de crear, inscribirse o retirarse y al volver a la pantalla. Gestionar carga, listas vacías y error con botón reintentar.
5. Conservar navegación móvil inferior, safe-area, targets táctiles ≥44px, foco teclado y responsive desktop. Evitar un diseño diferente al mockup.

## Pruebas obligatorias

- Dos cuentas: un usuario organiza un evento y el otro participa, sale y reingresa; las listas se actualizan sin duplicados.
- No se cruzan secciones ni aparecen eventos de otras cuentas como propios.
- Evento pasado/cancelado/archivado: mostrar estado histórico según autorización; comprobar las políticas correspondientes.
- Usuario nuevo sin eventos, sesión inválida, denegación por RLS, error de red/reintento, navegación directa y vuelta del detalle.
- `npm run build`, `npm run lint` y pruebas de integración. Comparativa visual a 375×812 y desktop; no overflow horizontal.

## Entrega

PR exclusiva, archivos modificados, riesgos, pruebas, evidencia de RF-R1-07.CA-01..04 y enlace a capturas. Actualizar estado y evidencias del Bloque 5 en `docs/implementation/RELEASE_1_STATUS.md`, sin marcarlo `Validado` hasta mi revisión. Detenerse antes del Bloque 6.
