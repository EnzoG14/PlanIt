# QA: horarios, desarchivado y eliminación definitiva

Implementación del 24/10/2026, rama `codex/event-lifecycle-adjustments`, base `a877444` de origin/main. La migración se aplicó en planit-v2 el 24/10/2026 con autorización posterior explícita. No se desplegaron Edge Functions ni se eliminaron eventos reales.

## Decisiones implementadas

- Horarios: entrada numérica HH:mm de 24 horas; formato automático y validación, compartida por crear, editar, duplicar y reactivar. Fechas propias continúan en horario de Argentina, sin columna timezone.
- Desarchivar: requiere reprogramación explícita, conserva ID y contenido; confirmed pasa a cancelled y exige reinscripción. removed, revocaciones y solicitudes pendientes se conservan. Un UUID de operación evita cancelar inscripciones nuevas al repetir un intento.
- Eliminar definitivamente: sólo el organizador de eventos cancelados/finalizados, también archivados. Elimina dependencias del evento en una transacción, conserva perfiles, suscripciones Push y archivos con referencias ajenas. Confirmación explícita con nombre y consecuencias.
- Storage: outbox privada, sin FK al evento, leases, revalidación del objeto y referencias, reintentos; el trabajador usa Storage API. El borrado en base puede terminar antes que la limpieza de archivos. Cargas simultáneas se serializan; los IDs eliminados y sus rutas no pueden reutilizarse.

## Verificación

- `npm run build`: PASS; advertencias existentes sobre tamaño de chunks y opción de rolldown del service worker.
- `npm run lint`: PASS, sin errores; advertencias preexistentes en probes históricos y DiscoveryFilters.
- `npm run check:events`: PASS.
- `npm run check:event-lifecycle:unit`: PASS, formato parcial/pegado/borrado y trabajador con éxito, fallo de Storage, ACK perdido, destino cambiado y lease vencido.
- `npm run check:event-lifecycle`: PASS, PostgreSQL 18.4 aislado, replay completo de migraciones, identidades autenticadas/anónimas, RLS/permisos, validación y rollback, reinscripción, expulsiones, solicitudes pendientes y revocaciones, borrado con medios publicados/reservados/compartidos, Push, idempotencia y concurrencia real. Resultado: [sql-results.json](sql-results.json).
- `npm run check:event-actions`, `npm run check:edit-event`, `npm run check:my-events`: PASS. Se agregó el stub local storage.allow_only_operation que las migraciones R7 necesitan al ejecutar estos harness antiguos.
- `node scripts/check-r7-expiration.mjs`: PASS, limpieza existente de historias, leases/concurrencia y protección de otros recursos. [Resultado](story-gc-regression/sql-results.json). El harness conserva etiquetas históricas de base/rama; la lista de migraciones incluye esta migración nueva y el resultado corresponde a esta ejecución local.
- `npm run check:event-lifecycle:ui`: PASS, Edge headless, fixtures Auth/REST, zona del dispositivo Asia/Tokyo, anchos 320/375/390/768/1280. Abandono sin cambios, entrada numérica, fechas inválidas y medianoche, capacidad reiniciada, ACK perdido sin segunda escritura, navegación, foco/Tab/Escape y confirmación de borrado. [Resultado](ui/results.json); capturas `ui/reactivate-*.png` y `ui/delete-*.png`.
- `node scripts/check-event-actions-ui.mjs 390`: PASS, regresión de cancelación/archivo/duplicación y chat histórico, incluido ACK perdido, validación y aislamiento. Se actualizaron fixtures antiguos al contrato vigente de historias/chat y al enlace de retorno actual. [Resultado](regressions/ui-results.json).
- Inspección visual de capturas móvil y escritorio: composición/formularios/diálogos compatibles con Amanecer, sin desbordamiento horizontal en los anchos comprobados.

Los fixtures SQL no representan HTTP/JWT/Storage reales. Los fixtures de navegador no prueban permisos del servidor; éstos se ejercitan por separado con SET ROLE en PostgreSQL. Pendiente: teléfono físico Android/iOS para comprobar teclado numérico, lector de pantalla, texto ampliado y funcionamiento después de desplegar. No se declara probada la limpieza física remota, el cron ni el envío Push real.

## Ejecución local

Reutiliza las herramientas PostgreSQL de los harness existentes en `.participation-test-tools.local/node_modules`; no agrega dependencias de producción. Node 24 permite ejecutar los imports TypeScript de la prueba unitaria. La prueba UI requiere Playwright y Edge, Vite local y las variables públicas habituales; puede recibir `PLANIT_PLAYWRIGHT_PATH` y `PLANIT_UI_ORIGIN`. Los fixtures interceptan el proyecto v2; no acceden a eventos reales. En Windows restringido, PostgreSQL y Edge requieren permiso para conexiones localhost.

## Estado remoto y despliegue pendiente

1. **Completado el 24/10/2026:** migración `20261024221340_event_lifecycle_adjustments.sql` aplicada exclusivamente en planit-v2 (`iepeqmvzjguwlhnecsdq`). Historial sincronizado, dry-run posterior sin pendientes, diez cuerpos de funciones idénticos a Git y RLS/permisos comprobados. Prueba remota con dos identidades SET ROLE, evento temporal, reactivación/reinscripción/idempotencia/borrado y ROLLBACK aprobada. No se modificaron eventos reales. [Resumen remoto](remote/summary.json), [prueba](remote/functional-results.json), [catálogo](remote/catalog-results.json).
2. Desplegar la versión actualizada de `r7-media-cleanup` después de la migración. Reutiliza SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y STORY_GC_WORKER_TOKEN sólo del servidor, con autenticación de trabajador existente; no introducir VITE_* ni secretos en Git. Mantener desactivada la verificación JWT del gateway sólo para este trabajador, conforme al procedimiento ya documentado para R7.
3. Verificar o configurar una invocación periódica server-to-server del trabajador mediante POST y su token dedicado. Este PR no instala ni activa cron. El trabajador reparte cada lote entre historias expiradas y eventos eliminados, con un máximo de 100 objetos y presupuesto de 40 segundos por lote.
4. Comprobar reintentos/leases pendientes y errores de Storage. La UI confirma el borrado en base; las rutas permanecerán en la cola hasta confirmar su ausencia física. Los objetos reemplazados o con referencias inesperadas se conservan para revisión, nunca se borran a ciegas.
5. Desplegar frontend y comprobar con dos cuentas reales registro, reactivación, permisos y limpieza de archivos en datos de prueba autorizados. No fusionar ni desplegar como parte de esta entrega.

Asesores remotos antes/después: 60 → 63 avisos de RPC SECURITY DEFINER ejecutables por authenticated. Los tres nuevos corresponden únicamente a reactivate_event/delete_event/get_event_operation, intencionales y con autorización de propietario/recibo comprobada, search_path vacío y EXECUTE anónimo denegado. El aviso previo de protección de contraseñas filtradas de Auth permanece sin cambios. [Antes](remote/advisors-before.json), [después](remote/advisors-after.json).
