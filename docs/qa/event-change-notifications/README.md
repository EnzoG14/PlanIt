# Avisos de cambios y cancelación de eventos

28/10/2026 · Rama `codex/event-change-notifications`. Implementación local; migración **no aplicada en planit-v2**. Sin despliegue ni merge.

## Contrato

- Cada guardado con cambios efectivos en nombre, descripción, inicio/fin o lugar (nombre, dirección, latitud, longitud) genera un `event_update` por participante confirmado en ese momento. Un único aviso enumera los grupos modificados.
- Una transición de `cancelled_at` de NULL a una fecha genera `event_cancelled`, con prioridad sobre cambios simultáneos de contenido. Incluye la cancelación previa al archivo de un evento vigente.
- Excluye organizador, participaciones cancelled/removed y solicitudes pendientes. Guardar valores idénticos, editar cupo/categoría/visibilidad/medios, archivar sin nueva cancelación, reactivar y eliminar no generan estos avisos. No hay backfill de cambios históricos.
- El trigger privado INVOKER `notify_event_change` se ejecuta dentro de las RPC autorizadas, que ya toman el lock del evento en READ COMMITTED. El INSERT de todos los destinatarios y la actualización del evento se confirman o revierten juntos. No se amplían permisos de tabla ni se cambian firmas RPC.
- Se conserva RLS propia del destinatario y el destino se revalida mediante `get_notification_target`. Los avisos guardan el nombre y los grupos modificados en ese momento, sin copiar la descripción, dirección ni coordenadas anteriores/nuevas.
- Push extiende el catálogo de encolado y recuperación existente para ambos tipos, conservando TTL de 15 minutos, leases, reintentos y unicidad por aviso/dispositivo. La recuperación sólo repara trabajos de avisos ya existentes, no genera avisos históricos. Las fallas de encolado mantienen la bandeja y se recuperan con el mecanismo existente.
- La entrega usa el destinatario almacenado y las mismas reglas de visibilidad del detalle: evento público vigente o participación histórica para públicos cerrados; acceso activo para ocultos. Acceso revocado produce Push genérico hacia la bandeja. Las vistas previas desactivadas también generan texto genérico. Avisos descartados y suscripciones desactivadas no se entregan.
- La bandeja reutiliza su presentación y acciones; sólo incorpora las etiquetas «Evento actualizado» y «Evento cancelado». Sin cambios de tokens, CSS ni contratos `NotificationItem`.

## Verificación

| Prueba | Resultado y evidencia |
| --- | --- |
| `npm run check:event-notifications` | PASS; [PostgreSQL 17.5 aislado](sql-results.json), replay de todas las migraciones, roles reales locales y locks |
| `npm run check:event-notifications:ui` | PASS; [resultados](ui/after/results.json), app compilada y Auth/REST/Phoenix simulados |
| `node scripts/check-edit-event.mjs` | PASS; [resultados](regressions/edit-event.json) |
| `node scripts/check-event-lifecycle.mjs` | PASS; [resultados](regressions/event-lifecycle.json) |
| `node scripts/check-notifications.mjs` | PASS; [resultados](regressions/inbox/postgres-results.json). Se agregó al scaffold la función Storage que necesitan las migraciones actuales |
| `node scripts/check-r7-push-delivery.mjs` | PASS; [resultados](regressions/push/sql-results.json), 11 grupos de regresión de entrega/cola |
| `npm run build` | PASS; advertencias existentes de tamaño de bundle y opción del compilador PWA |
| `npm run lint` | PASS; advertencias existentes en probes históricos y `DiscoveryFilters.tsx` |

SQL prueba campos individuales, cambios conjuntos, NULL en lugar, ausencia de cambios, destinatarios y exclusiones, cancelación directa/por archivo, prioridad, reintentos, reactivación, rollback de edición/cancelación/archivo, RLS, permisos, destinos, lectura, carreras inscripción/retiro en ambos órdenes del lock, encolado por dispositivo, recuperación de ambos tipos, vistas previas, acceso oculto y revocación, descarte y suscripción desactivada.

UI verifica 320/375/390/768/1280 px, texto al 200% y poca altura sin overflow horizontal; lectura por teclado y contador, navegación autorizada/denegada y recepción de un aviso por Phoenix simulado. [Antes móvil](ui/before/inbox-390.png), [después móvil](ui/after/inbox-390.png), [antes escritorio](ui/before/inbox-1280.png), [después escritorio](ui/after/inbox-1280.png). Revisión visual: etiquetas legibles, texto ajustado y composición existente conservada; ninguna migración visual adicional.

Los primeros intentos de UI con Vite no respondieron; la verificación exitosa usa el servidor estático local del harness existente y la app compilada. Los sockets locales requieren ejecución fuera del sandbox. PostgreSQL permanece aislado, con scaffolds SQL de Auth y Storage: no acredita JWT/PostgREST, Realtime remoto ni recepción real de Push.

## Pendientes de activación

Aplicar la migración `20261028234334_event_change_notifications.sql` sólo con autorización en `planit-v2` (`iepeqmvzjguwlhnecsdq`). Antes de aplicarla: revisar historial remoto, dry-run y asesores de seguridad. Después: validar con dos cuentas y recepción Push real. No se ejecutaron esos pasos ni se desplegó frontend. No se probaron dispositivos físicos, lector de pantalla, gestos o teclado móvil real.
