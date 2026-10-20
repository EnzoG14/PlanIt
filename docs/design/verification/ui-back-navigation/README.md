# Regreso y publicación de historias · 20/10/2026

Rama `codex/ui-back-navigation`, basada en `main` (`c2e5473`). Dirección Amanecer conservada. Sin cambios de esquema, permisos, RPC, dependencias ni despliegues. El cambio local previo en `supabase/.temp/cli-latest` se conserva.

## Cambios

- Flecha compartida de 44 × 44 px y nombre accesible «Volver». El layout ofrece un regreso durante carga/error; la flecha específica de cada pantalla lo sustituye al montarse, incluidos los chats.
- Contexto en memoria que registra las entradas internas y su posición. El regreso utiliza el historial conocido, mantiene query/hash y evita retroceder a entradas externas desconocidas; una recarga reinicia el registro y usa los destinos de respaldo. Las pistas de foco se entregan al destino sin reemplazar sus entradas de historial.
- Intereses accesibles desde Mi perfil; se retiró el acceso de Para vos. Se conservan los bloqueadores de cambios sin guardar.
- Comparación con encabezado continuo sobre una sola mancha Amanecer y regreso sin etiqueta. Separación de 16 px bajo «En esta zona». Se retiró el aviso técnico de HTTPS del detalle sin alterar las validaciones de compartir.
- Historias con selector propio, vista previa, «Elegir imagen» y «Tomar foto». Sin la descripción de formatos/tamaño/duración ni el control nativo visible. Se conserva la validación JPEG/PNG/WebP de hasta 5 MiB y el reintento con los mismos identificadores.
- «Tomar foto» abre un input de imagen con `capture="user"`: solicita captura frontal en navegadores móviles compatibles; en escritorio el navegador ofrece su selector habitual. No se solicita acceso persistente a la cámara ni se inicia un stream. El compositor local se conserva cuando el selector nativo oculta temporalmente el documento; el visor de historias publicadas sigue limpiándose.

## Verificación

- `npm run build`: PASS, con advertencias existentes de tamaño del bundle de Mapbox y `inlineDynamicImports`.
- `npm run lint`: PASS; advertencias previas en pruebas históricas y `DiscoveryFilters`, sin errores.
- `node scripts/check-back-navigation-ui.mjs`: PASS. Capturas y geometría en 320/375/390/768/1280 px; notificaciones, bandeja, intereses, comparación, detalle y mapa. Cobertura adicional de formularios, gestión de eventos, perfiles, chats, invitación, 404, carga/error, enlaces directos/recarga, recorrido atrás/adelante y conservación de query/hash. Verifica confirmación de descarte/cancelación en intereses, foco de regreso, una sola flecha y ausencia del dock en secundarias.
- `node scripts/check-r7-stories-ui.mjs`: PASS en 320/375/390/768/1280 px. Componentes reales aislados, archivo sintético, apertura de selector de cámara y atributo de captura, selección/preview, transición de visibilidad, validación, errores y reintento idempotente, foco, teclado, TTL y revocación de Blob URLs.
- `node scripts/check-r6-compare-ui.mjs`: PASS en 320/360/375/390/768/1280 px sobre el build real; selección, filtros, cupos, respuestas tardías, errores, texto al 200 %, teclado y acceso anónimo.
- `node scripts/check-r5-messages-ui.mjs`: PASS en 320/360/375/390/768/1280 px sobre el build real; entrada desde perfil y bandeja, restauración de foco al regresar, paginación, envío/reintento, tiempo real, bloqueo, recuperación de conexión, texto ampliado y limpieza de historial al ocultarse.

Las pruebas UI usan Edge headless con Auth/REST/Storage/Mapbox interceptados; no escriben en servicios remotos. Se actualizaron las expectativas de los controles afectados y los disparadores de recuperación de historias/mensajes para utilizar la revalidación vigente al recuperar conexión/foco.

Para reproducir las suites antiguas de comparación/mensajes, configurar `PLANIT_PLAYWRIGHT_PATH` con la ruta de `playwright/index.mjs` del runtime instalado. Navegación usa `PLANIT_UI_ORIGIN` (en esta ejecución `http://127.0.0.1:4196`); comparación y mensajes sirven el build local desde el mismo proceso. Se usó `PLANIT_UI_OUTPUT=docs/design/verification/ui-back-navigation/messages` para conservar la evidencia histórica de mensajes.

La suite histórica completa de intereses se intentó, pero no terminó por timeout de carga; además conserva escenarios anteriores que esperan «Actualizar categorías», ausente en `main`. El descarte, cancelación y foco afectados por esta tarea se verificaron con la nueva suite de navegación. La suite de sugerencias recibió la actualización de expectativas del enlace retirado, pero no se ejecutó completa.

## Evidencia y límites

Las capturas aportadas por el usuario son la referencia visual previa; no se generó un nuevo baseline automatizado anterior a la implementación. `navigation/` contiene capturas de la app; `stories/` contiene las del fixture aislado, cuyo exterior no representa una pantalla de producto. `compare/` y `messages/` contienen las regresiones del build.

Revisión visual: encabezados de comparación/notificaciones, espaciado del mapa y diálogo de historias vacío/con imagen; corrección y confirmación del tamaño de iconos. La imagen de prueba está rotulada como sintética.

Pendientes: cámara física iOS/Android, selección/cancelación real del sistema, teclado/safe areas reales, lector de pantalla, publicación real en Supabase y aceptación humana. El atributo de captura y una selección simulada no prueban el hardware de cámara.

## Base remota · comprobación previa al PR

El 20/10/2026 se verificó el proyecto enlazado `planit-v2` (`iepeqmvzjguwlhnecsdq`) con `supabase migration list --linked`: las 48 versiones locales coinciden con el historial remoto, hasta `20261020120000_notifications_clear_inbox.sql`. `supabase db push --linked --dry-run --skip-vault` devolvió `upToDate: true` y `migrations: []`. No se aplicó ninguna migración en esta tarea porque no hay pendientes ni SQL nuevo; tampoco se actualizaron secretos.
