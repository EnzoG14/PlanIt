# R2 — Bloque 4: centro de notificaciones

Implementado; QA y aceptación humana pendientes. Fecha: 11/10/2026, Argentina.

## Alcance y permisos

`/notifications` está protegida por Auth y accesible desde la campana de la cabecera. Consulta persistida paginada por `created_at DESC,id DESC`: 30 filas visibles y una de lookahead. Actualizar y volver al foco reinician la lista; el cursor evita desplazamientos por nuevos avisos. Cambio de cuenta y respuestas tardías descartan datos anteriores. No hay filtros, contadores parciales, avisos generados, recordatorios, Push ni datos de ejemplo en la app.

Migración **local, pendiente de autorización/aplicación remota**: `20261011163653_notifications_inbox.sql`. Reproduce el diseño mínimo de notifications con FK RESTRICT, timestamps Argentina, validaciones e índices. RLS restringe SELECT y UPDATE al destinatario. No otorga INSERT/DELETE a clientes; UPDATE sólo sobre `read_at`. Un trigger fija la primera lectura con reloj servidor y conserva ese valor ante reintentos, fechas arbitrarias o intentos de volver a no leído. RPCs SECURITY INVOKER con search_path vacío y EXECUTE sólo authenticated; ninguna recibe recipient_id/actor_id.

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

No se ejecutó SQL remoto, desplegó ni fusionó. Antes de activar en planit-v2: autorización del usuario, comparar historial/dry-run y revisar asesores. Después: prueba REST/JWT con dos cuentas reales, marcado/reintento, vacío y recursos inaccesibles; revisión humana responsive/safe areas y smoke real R1. Los fixtures no demuestran comportamiento HTTP/JWT de Supabase. El bloque 5 permanece pendiente.
