# Codex — BLOQUE 4: inscripciones, retiro y cupos (R1-05, R1-06)

## Precondiciones

Trabajás en `EnzoG14/PlanIt` luego de integrar los bloques 0–3 en `main`. Creá una rama exclusiva para este bloque. Antes de escribir, leé `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/database.md`, `docs/design/AGENTS.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/SCREENS.md`, el plan técnico R1 y `docs/implementation/RELEASE_1_STATUS.md` (si este último no existe, indicarlo). Inspeccioná las migraciones y consultas realmente implementadas. Referencia visual: `docs/design/mockups/release-1.png`, teléfono 5.

Proyecto remoto único: `planit-v2` (`iepeqmvzjguwlhnecsdq`). **Jamás modificar** el proyecto histórico. No aplicar migraciones remotas ni hacer merge sin mi autorización.

## Objetivo

Implementar participación confirmada, retiro voluntario y reinscripción segura, sin duplicados ni sobrecupo, manteniendo historial transaccional y conectando botones/ocupación del detalle del evento.

## Backend y migración

1. Crear una migración incremental para `public.event_participations` (`id`, `event_id`, `user_id`, `status`, `created_at`, `updated_at`; UNIQUE(`event_id`,`user_id`); estados `confirmed`, `cancelled`, `removed`) y `public.participation_history` (`id`, `participation_id`, `previous_status`, `new_status`, `changed_by`, `reason`, `created_at`). Tipos y FK según diseño aprobado. Habilitar RLS desde creación; grants restrictivos. No tocar migraciones ya aplicadas.
2. Crear operaciones atómicas `register_for_event` y `leave_event` (o nombres existentes si hubiese contratos previos; documentar). Derivar identidad con `auth.uid()` y validar autorización en PostgreSQL. **No confiar en IDs de usuario que envíe la PWA**.
3. Serializar inscripciones sobre la fila `events` (lock en transacción) para impedir sobrecupo concurrente. Contar sólo filas `confirmed`; el organizador NO consume cupo y NO puede inscribirse.
4. Permitir `cancelled → confirmed` directamente si hay cupo; impedir `removed → confirmed` sin aprobación posterior de R3. No permitir inscribir si el evento terminó, está cancelado/archivado o no es público accesible.
5. Al crear o cambiar una participación, agregar exactamente una entrada de historial en la **misma transacción**. Repeticiones/doble submit no deben fabricar historial falso.
6. Exponer a autenticados un resumen **mínimo y autorizado** para detalle: confirmados, capacidad, cupos disponibles y estado propio. No filtrar lista ni IDs de asistentes a terceros.
7. Si el bloqueo seguro exige RPC `SECURITY DEFINER`, justificarlo, fijar `search_path`, revocar `EXECUTE` innecesario, limitar roles, validar ownership, evitar SQL dinámico y probar acceso no autorizado. NO otorgar UPDATE/INSERT directos que permitan eludir las RPC.
8. Agregar índices para consultas reales (FK, evento/estado, usuario/estado) sin duplicar índices únicos existentes.

## Frontend y diseño

1. Integrar resumen y estado real en `/events/:id`, conservando hero, tipografía, chips, colores y CTA azul-violeta del mockup R1.
2. Mostrar `confirmados / capacidad` y barra proporcional; para el organizador, explicar que no se inscribe ni ocupa cupo.
3. Estados reales: `Unirme`, `Retirarme`, `Evento completo`, `Evento finalizado`, `Evento cancelado`, `Ya participás`, `Reingreso sujeto a aprobación` para removidos (sin implementar solicitudes R3).
4. Controlar pending/loading y reintentos, impedir doble envío y actualizar UI tras éxito o error. No inventar éxito ni mantener cupos cacheados que contradigan al servidor.
5. Evitar acoplar negocio a Leaflet o al mapa. Mantener contratos propios de eventos y tipos compartidos donde corresponda.

## Pruebas obligatorias

- Migración reproducible localmente, constraints, RLS y RPC no invocables de forma indebida por anónimos.
- Dos usuarios: inscripción, retiro, reinscripción; usuario ajeno no puede retirarte; organizador no se inscribe.
- Intentos simultáneos REALES en conexiones independientes contra PostgreSQL con cupo 1: sólo uno confirma; no hay sobrereserva ni duplicados. PGlite o fixtures no sustituyen la prueba concurrente multiconexión.
- Doble click, respuesta perdida/reintento, evento pasado, cancelado/archivado, capacidad agotada, `removed` y historial.
- Verificación de datos privados: el resumen no expone identidad de participantes.
- `npm run build`, `npm run lint` y tests relevantes; capturas móvil 375×812 y escritorio, comparación visual con R1.

## Entrega

PR exclusiva del bloque; indicar nuevas migraciones **pendientes versus aplicadas**, código modificado, validaciones con evidencias, limitaciones y resultado de cada criterio RF-R1-05.CA-01..04 y RF-R1-06.CA-01..04. Actualizar `docs/implementation/RELEASE_1_STATUS.md` a `Implementado; QA pendiente` sólo si se implementó, sin marcar `Validado` sin mi aprobación. No continuar automáticamente al bloque 5.
