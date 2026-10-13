# Header y entrada compartidos — seguimiento del pedido

Pedido adicional del usuario (2026-10-12, Argentina): usar la entrada y el header de Mis eventos en las pantallas. El usuario eligió conservar los encabezados especiales de Login/Registro y Chat.

- Header principal compartido: logo, campana con conteo real y menú Cuenta (perfil/cierre de sesión), ancho máximo 600px y mismos controles/tipografía. Adaptación a 320px sin partir logo ni Cuenta. El menú se cierra al cambiar de ruta; foco, Escape y estados de cierre conservados.
- Entrada del piloto centralizada: ascenso 12px, 600ms, easing Amanecer y escalonado 70ms con demora máxima 280ms. Se aplica al contenido de las rutas, sin animar ancestros de acciones fijas ni diálogos. En chat sólo entra su encabezado; mensajes y compositor conservan geometría. Con reduced motion no se ejecuta.
- Las rutas pendientes conservan su composición y tema; sólo su header usa el patrón compartido. No se activa Amanecer en rutas nuevas por este pedido.

Capturas locales con fixtures interceptados, sin escrituras remotas: baseline suplementario en before/; matriz de diez rutas a 320/375/390/768/1280 en after/. Las fotos/Mapbox son fixtures de geometría. Regresiones en auth/, chat/, home/, discovery/ y my-events/. El stress físico de teclado/lector de pantalla sigue pendiente.

Reproducción: node scripts/check-screen-shell-ui.mjs (Vite local en 4194; PLANIT_UI_ORIGIN/PLANIT_UI_OUTPUT opcionales).

Integración: origin/main 31c1ac2 (Bloque 3 de formularios) reconciliado conservando event-form-shell y discovery-shell. Se retira su override local de header para usar el patrón compartido.

Verificación completada: build, lint, check:amanecer, check:home:ui, check:discovery:ui, check:my-events:ui, check:amanecer:auth:ui, check:chat:layout; después de integrar main, creación (check-events-ui), edición (check:edit-event:ui) y matriz compartida. Comprobación adicional: header sin sesión en ruta no encontrada (las rutas de producto están protegidas por RequireAuth), sin overflow a 320px; reduced motion en seis rutas.
