# R2 — Bloque 4: centro de notificaciones

Implementado; QA y aceptación humana pendientes. Fecha: 11/10/2026, Argentina.

## Alcance y permisos

`/notifications` está protegida por Auth y accesible desde la campana de la cabecera. Consulta persistida paginada por `created_at DESC,id DESC`: 30 filas visibles y una de lookahead. Actualizar y volver al foco reinician la lista; el cursor evita desplazamientos por nuevos avisos. Cambio de cuenta y respuestas tardías descartan datos anteriores. No hay filtros, contadores parciales, avisos generados, recordatorios, Push ni datos de ejemplo en la app.

Migración **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**: `20261011163653_notifications_inbox.sql`. Reproduce el diseño mínimo de notifications con FK RESTRICT, timestamps Argentina, validaciones e índices. RLS restringe SELECT y UPDATE al destinatario. No otorga INSERT/DELETE a clientes; UPDATE sólo sobre `read_at`. Un trigger fija la primera lectura con reloj servidor y conserva ese valor ante reintentos, fechas arbitrarias o intentos de volver a no leído. RPCs SECURITY INVOKER con search_path vacío y EXECUTE sólo authenticated; ninguna recibe recipient_id/actor_id.

Inspección remota de metadatos con `list_migrations`/`list_tables` (sin execute_sql): planit-v2 conserva nueve migraciones hasta event_chat y nueve tablas públicas con RLS; notifications aún no existe. No se ejecutó DDL ni SQL remoto.

`get_notifications` devuelve la proyección de presentación, sin perfiles ni campos privados. `get_notification_target` usa joins sujetos a RLS existente de events/conversations. Nunca otorga acceso por recibir un aviso. Se reconsulta al abrir y el destino vuelve a autorizar en su pantalla. Si hay conversation_id inaccesible, no se deriva un enlace alternativo al evento. Identificadores opcionales pueden faltar; los textos se renderizan como texto React, sin HTML ni enlaces extraídos del cuerpo. Tipos conocidos tienen etiquetas; tipos futuros usan «Aviso» sin imponer un catálogo nuevo.

## CA y evidencia ejecutada

| CA oficial | Verificación | Resultado y límites |
| --- | --- | --- |
| RF-R2-07.CA-01 | Apertura desde cabecera y URL; consulta paginada propia | PASS SQL local y UI fixture móvil/escritorio |
| RF-R2-07.CA-02 | Título/cuerpo persistidos, opcionales ausentes, fecha completa Argentina, leído/no leído | PASS SQL local/UI fixture; navegador configurado en Asia/Tokyo |
| RF-R2-07.CA-03 | SELECT por ID y sin filtro A/B; marcado ajeno, anon, identidad ausente y mutaciones falsificadas | PASS PostgreSQL local; UI cambia de cuenta e ignora respuesta tardía A |
| RF-R2-07.CA-04 | Cero filas al reproducir migraciones; vacío sin productores | PASS SQL local/UI fixture |

Comandos ejecutados:

- `node scripts/check-notifications.mjs`: PostgreSQL 17.5 real local, scaffold Auth/Storage, todas las migraciones reproducidas. Incluye cursor con fechas iguales/inserción entre páginas, timestamps servidor, reintentos y acceso a evento/chat antes y después de retirar participación.
- `node scripts/check-notifications-ui.mjs`: Playwright/Edge con Auth/REST interceptados. 375×812 y 1280×900, navegación, carga/error/vacío, migración ausente, paginación, marcado fallido/exitoso con teclado, refresco y cambio de cuenta, recurso revocado y acceso autorizado. Sin errores de página ni overflow horizontal.
- `npm run build`, `npm run lint`, `npm run check:auth`, `npm run check:events`, `npm run check:participations`, `npm run check:my-events` y `git diff --check`: PASS. La regresión de cupos incluye carreras simultáneas reales en PostgreSQL local.

Resultados: [PostgreSQL](postgres-results.json), [UI](ui-results.json). Capturas: [móvil lista](mobile-inbox.png), [móvil vacío](mobile-empty.png), [móvil error](mobile-error.png), [escritorio lista](desktop-inbox.png), [escritorio vacío](desktop-empty.png), [escritorio error](desktop-error.png).

Los scripts usan herramientas locales existentes en `.participation-test-tools.local/node_modules` (pg y embedded-postgres). UI permite `PLANIT_PLAYWRIGHT_PATH` y `PLANIT_UI_ORIGIN`. No se añadieron dependencias de producción. Los fixtures SQL viven sólo en una instancia temporal detenida al finalizar; UI intercepta datos ficticios y no persiste avisos remotos.

## Contraste visual y pendientes

Revisión contra pantalla 5 de `docs/design/mockups/release-2.png`: fondo marino, filas redondeadas, iconos circulares violeta, jerarquía título/cuerpo/tiempo y nav inferior vigente. Las filas son más altas por fecha completa, estado textual y acciones táctiles de 44 px. No se copian filtros ni avisos/entradas/recordatorios de ejemplo. Agrupaciones relativas Hoy/Ayer se reemplazan por fecha completa para evitar ambigüedad temporal y mantener el listado simple.

No se fusionó ni avanzó al bloque 5. Pendiente: prueba REST/JWT con dos cuentas reales, marcado/reintento, vacío y recursos inaccesibles; revisión humana responsive/safe areas y smoke real R1. Los fixtures no demuestran comportamiento HTTP/JWT de Supabase. El bloque 5 permanece pendiente.


## Aplicación remota autorizada — 11/10/2026

El usuario autorizó aplicar las migraciones remotas. migration list y db push --dry-run --skip-vault confirmaron una sola pendiente: 20261011163653_notifications_inbox.sql. Se aplicó con db push --project-ref iepeqmvzjguwlhnecsdq --skip-vault --yes, sin seeds, roles ni configuración Vault. Historial posterior: diez versiones locales/remotas coincidentes; dry-run sin pendientes.

Catálogo remoto: RLS activa, dos políticas por destinatario, trigger notifications_stamp_read y UPDATE sólo read_at; INSERT/DELETE authenticated y SELECT anon denegados. Tres RPC SECURITY INVOKER con search_path vacío, EXECUTE authenticated y no anon. Consulta READ ONLY con dos identidades SQL existentes: bandejas vacías, destino inexistente null y ejecución anon denegada. Cero avisos; no se crearon fixtures remotos. El marcado real REST/JWT sigue pendiente. Un intento de probar la RPC de marcado dentro de READ ONLY fue rechazado por PostgreSQL (25006); se corrigió la prueba para mantenerla sólo de lectura, sin cambios persistidos.

Asesores antes/después: sin errores ni nuevos avisos. Persisten las [siete funciones SECURITY DEFINER autenticadas heredadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y [leaked-password protection desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), ya documentados para R1/R2. No se modificó Auth.

## Ampliación Realtime — 11/10/2026

El transporte de refresco manual descrito arriba es la evidencia histórica del bloque original. La ampliación R2 agrega Postgres Changes y mantiene autorización, paginación y contratos de escritura. Los scripts SQL/UI fueron ampliados y ejecutados nuevamente; las capturas y JSON de esta carpeta reflejan la regresión local. [Implementación, pruebas de suscripción/reconexión, matriz manual y límites](../realtime/README.md). La migración nueva sigue sin aplicarse en Supabase remoto.

Actualización de despliegue (11/10/2026): la migración Realtime nueva fue aplicada con autorización expresa en planit-v2; 11 versiones sincronizadas y publicación/RLS/grants verificados. La validación WS con JWT reales sigue pendiente. Ver sección de despliegue del [informe Realtime](../realtime/README.md).
