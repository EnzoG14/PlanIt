# Chat de evento — pantalla dedicada

11/10/2026. Rama `codex/event-chat-layout`, desde `main` actualizado (`b1bf39a`). Referencia visual: tercer teléfono de `docs/design/mockups/release-2.png`.

## Cambio

Sólo `/events/:id/chat` oculta el header global y la navegación inferior. El encabezado contiene regreso y título del evento; los títulos largos se truncan visualmente y conservan el nombre completo en el DOM. Se preservan los tokens azul oscuro/violeta, las burbujas entrantes marino y las salientes con gradiente.

El shell ocupa el viewport visible. El historial es la única zona de desplazamiento vertical del layout; el formulario queda debajo en el flujo flex, sin `sticky` ni superposición. El textarea conserva su scroll interno para textos largos. `VisualViewport` adapta alto y posición al teclado y al desplazamiento del navegador móvil, con fallback a `innerHeight`/`100dvh`. El encabezado y formulario respetan safe areas. Al salir se liberan el bloqueo del documento y los listeners.

Realtime, reconciliación, envío, permisos y paginación conservan su implementación. Se mantiene la restauración del ancla al cargar historial y el seguimiento de mensajes sólo cerca del final. Un `ResizeObserver` mantiene visible el último mensaje al cambiar el espacio disponible si el usuario estaba al final, sin llevar al final a quien lee mensajes anteriores. Se desactiva el anclaje automático del navegador para que no compita con la restauración existente.

## Comparación visual

Capturas tomadas con los mismos 65 mensajes ficticios y respuestas Auth/RPC/WebSocket interceptadas en Edge. Se inspeccionaron visualmente las cuatro capturas posteriores, la comparación móvil y el formulario con altura reducida.

| Viewport | Antes | Después | Alto del documento antes → después |
| --- | --- | --- | --- |
| 360×800 | [Antes](before-360x800.png) | [Después](after-360x800.png) | 1029 → 800 |
| 375×812 | [Antes](before-375x812.png) | [Después](after-375x812.png) | 1035 → 812 |
| 390×844 | [Antes](before-390x844.png) | [Después](after-390x844.png) | 1031 → 844 |
| 1280×900 | [Antes](before-1280x900.png) | [Después](after-1280x900.png) | 1084 → 900 |

Antes, el formulario se superponía al historial en los cuatro tamaños. Después, el último mensaje completo y su timestamp quedan por encima del formulario. Se conservan el estado de conexión, la actualización manual y la carga de mensajes anteriores como controles funcionales; no se agregan adjuntos, audio, miembros ni acciones ilustrativas del mockup.

## Verificación

- `npm run build`: PASS (advertencia existente de tamaño del chunk de Mapbox).
- `npm run lint`: PASS.
- `npm run check:chat:layout`: PASS en los cuatro tamaños. Verifica alto del documento, wheel dentro/fuera del historial, formulario sin superposición, último mensaje visible, envío, ancla tras paginación, mensaje entrante por Phoenix WebSocket sin salto al leer historial, alturas 420/500, `VisualViewport` de 400 px con offset de 32 px, safe-area simulada, sólo lectura y limpieza al salir.
- `node scripts/check-chat-ui.mjs`: PASS, 6 escenarios existentes de historial, envío, retry idempotente, validación, errores, acceso denegado y paginación.
- `node scripts/check-realtime-ui.mjs`: PASS, 8 escenarios existentes, incluyendo dos sesiones, ráfagas, recuperación de 120 mensajes, deduplicación, cambio de evento/cuenta y limpieza de canales.
- `node scripts/check-chat.mjs`: PASS, 9 escenarios en PostgreSQL efímero local. Sin cambios en Supabase remoto, migraciones, autorización ni lógica de negocio.

Resultados: [layout](after-results.json), [chat UI](regressions/chat/ui-results.json), [Realtime](regressions/realtime/ui-results.json), [PostgreSQL local](regressions/postgres-results.json). Para ejecutar los scripts UI existentes con estos destinos, usar `PLANIT_CHAT_UI_OUTPUT` y `PLANIT_REALTIME_UI_OUTPUT`. `PLANIT_UI_ORIGIN` selecciona el servidor local y `PLANIT_PLAYWRIGHT_PATH` la instalación disponible de Playwright.

## Limitaciones

Las pruebas de navegador usan fixtures, no prueban entrega remota de Supabase. La reducción de altura, el offset de VisualViewport y los insets son simulaciones; falta comprobar teclado nativo y notch en Safari iOS/Chrome Android sobre teléfonos físicos. No se modificaron dependencias ni el cambio local previo de `vite.config.ts`; ese cambio queda fuera de la PR.
