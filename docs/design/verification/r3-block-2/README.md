# R3 Bloque 2 — Editar evento propio

**Corte:** 11/10/2026, Argentina. **Estado:** Implementado; QA pendiente. La aceptación humana y las pruebas HTTP/JWT reales no se reemplazan por fixtures o identidades SQL simuladas.

## Contrato y decisión

RF-R3-01.CA-01..04, prompt del Bloque 2, plan/estado R3 y especificación técnica vigente de Planificación. El usuario confirmó **editar sólo antes del inicio original**, sin cancelación ni archivo. Eventos en curso/finalizados tampoco pueden reprogramarse para reabrirlos. Esta política se comprueba dentro del lock en BD y se refleja en UI.

`/events/:id/edit` autentica, precarga y vuelve al detalle del mismo ID, conservando Inicio/Mapa o sección/filtro de Mis eventos autorizados. Formulario compartido con creación; publicación y actualización siguen siendo operaciones separadas. No hay borradores persistentes ni nuevas dependencias de producción. Cambio previo de `vite.config.ts` preservado y excluido.

`update_event` recibe ID, título, descripción, inicio/fin, categoría, capacidad, dirección, coordenadas y nombre del lugar. Devuelve el ID existente. SECURITY DEFINER permite contar confirmed ajenos y bloquear eventos sin abrir UPDATE directo; identidad desde auth.uid(), search_path vacío, EXECUTE sólo authenticated. READ COMMITTED obligatorio, lock de evento antes del conteo, reloj Argentina después de esperar el lock. CHECK/FK/NOT NULL existentes y validaciones de fecha/categoría/cupo garantizan rollback. No modifica identidad, cierre, visibilidad, participantes, historial, chat ni media.

Ante respuesta perdida se compara el contenido enviado contra una lectura del evento. Si no se confirma, formulario bloqueado y «Comprobar guardado» sólo reconsulta: no reenvía automáticamente. Una lectura discrepante conserva valores y permite revisar/reintentar. Un refresh de token no descarta cambios; cambiar evento/cuenta desmonta el formulario y descarta respuestas tardías.

## Evidencia por CA

| CA | Casos ejecutados | Evidencia / límite |
| --- | --- | --- |
| CA-01 | Precarga de todos los campos, edición válida sobre mismo ID, retry, medianoche Argentina, datos originales asociados conservados | [PostgreSQL local](postgres-results.json), [UI fixtures](ui-results.json) |
| CA-02 | Fecha pasada/fin anterior/infinito/categoría inactiva/cupo inválido, cupo igual a confirmed, reducción insuficiente, rollback y dos órdenes de carrera; mínimos nativos con rollover de medianoche | PostgreSQL local y UI; conteo mostrado orientativo, validación definitiva en RPC |
| CA-03 | Reconsulta de detalle, listado con filtro, Inicio y resultados del mapa; cancelación vuelve a mismo evento; feedback sólo tras confirmación | UI fixtures; listado/lectura del evento comprobados también en SQL local |
| CA-04 | B/anon/sin identidad/recurso ausente, UPDATE/DELETE directo, aislamiento congelado y estados cerrados denegados | SQL local con roles; ruta B bloqueada en fixture UI; HTTP/JWT real pendiente |

No se declara ninguno de los CA «Validado» por aceptación humana.

## Pruebas y reproducción

- `npm run build` y `npm run lint`: PASS. Persiste el aviso existente de tamaño del chunk Mapbox.
- `npm run check:edit-event`: PASS; PostgreSQL 17.5 aislado con replay de todas las migraciones y scaffolding Auth/Storage. Ambas carreras observan pg_blocking_pids antes de liberar la transacción; no dependen de asumir tiempos.
- `PLANIT_UI_ORIGIN=http://127.0.0.1:4188 npm run check:edit-event:ui`: Edge headless con Auth/REST/Storage interceptados y navegador Asia/Tokyo. Viewports 360×800, 375×812, 390×844, 768×1024 y 1280×900; evidencia en ui-results.json. El servidor usado es `npm run preview -- --host 127.0.0.1 --port 4188` después del build.
- `node scripts/check-events.mjs --postgres`: PASS; validación, publicación, RLS, Storage, rollback e idempotencia con PostgreSQL embebido PGlite.
- Regresión [Mis eventos SQL](regression/check-my-events/postgres-results.json), [participación SQL](regression/check-participations/postgres-results.json), [Mis eventos UI](regression/check-my-events-ui/ui-results.json) y [creación UI](regression/check-events-ui/measurements.json): PASS. Participación incluye diez carreras reales de última plaza. Los scripts originales se ejecutaron mediante copias temporales ignoradas, cambiando sólo la carpeta de salida para preservar evidencia anterior. El nombre histórico «detail only» en el resultado de regresión no certifica ausencia de edición; el nuevo menú se verifica en check:edit-event:ui.
- `git diff --check`: PASS.

Los checks usan herramientas locales ya existentes: pg/embedded-postgres en `.participation-test-tools.local`, PGlite en `.event-test-tools.local`, y Playwright del runtime de Codex o `PLANIT_PLAYWRIGHT_PATH`. No agregan dependencias al producto. En Windows el sandbox requirió ejecución autorizada fuera del aislamiento para conexiones localhost y Edge. Una corrida inicial de UI fue interrumpida por cambios/HMR; la evidencia final procede del build estable.

## Comparación visual

Abiertos el PNG `02-editar-evento.png` y collage original `release-3.png`. Capturas `edit-*` y `error-*` en los cinco viewports. Se conservan fondo marino, acentos azul/violeta, portada, formulario vertical, pares de fecha/hora, iconos y CTA ancho. No se copian fotografías ni marcos del mockup: portada geométrica propia de fixture.

Adaptaciones: shell/header/navegación vigentes; labels y legends accesibles; dirección, nombre y coordenadas exigidos por el contrato amplían el formulario; portada de lectura sin botón inerte de galería; confirmados como ayuda operacional, sin dashboard. Cancelar edición vuelve al detalle. Sin overflow horizontal y CTA de al menos 44 px; safe-area usa el shell existente. Dispositivo físico y evaluación humana pendientes.

## Migración y entorno remoto

`20261012001058_edit_own_event.sql` creada con CLI, probada localmente; **no aplicada remotamente**. Antes de implementar se consultaron sólo metadatos de planit-v2: doce versiones conocidas, update_event ausente, firmas/cuerpos de inscripción y Organizo, columnas/constraints/políticas, RLS y ausencia de UPDATE general para authenticated. Coinciden con el contrato versionado. Sin consultas a perfiles privados ni cambios en Supabase antiguo. La UI comunica RPC ausente hasta aplicar la migración con autorización.

Pendientes: autorización de aplicación remota, prueba real con JWT de A/B/REST, dispositivo físico, aceptación humana y despliegue. Sin merge ni SQL remoto de escritura.
