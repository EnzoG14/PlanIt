# Ubicación inicial del mapa · 19/10/2026

Rama `codex/map-current-location`, desde `main` `af61ed4`.

El mapa solicita ubicación al abrirse, una sola vez por sesión en memoria. Con permiso centra el GPS; sin permiso, por timeout o por error conserva Resistencia, Chaco (`-27.4514, -58.9867`). El botón Mi ubicación permite reintentar. Usar Resistencia mantiene la elección manual incluso si llega una respuesta GPS pendiente. Una ubicación obtenida en Inicio se comunica también al montar el mapa. No se guardan coordenadas en URL ni almacenamiento.

Se mantienen la composición, estilos, controles, marcadores y tarjetas existentes. Mockup R1 inspeccionado como referencia; sin rediseño ni cambios de CSS, tokens o DESIGN.md. Las capturas usan un fondo cartográfico simulado, sin calles: acreditan composición y posición consultada, no cartografía remota.

## Verificación

- `npm run build`: PASS; advertencias existentes de tamaño de chunk y opción PWA deprecada.
- `npm run lint`: PASS; advertencias preexistentes, ninguna nueva en los archivos modificados.
- `npm run check:mapbox`: PASS.
- `node scripts/check-map-location-ui.mjs`: diez escenarios (375/1280 px × GPS concedido, denegado, timeout, error y elección manual durante GPS). Ver `results.json` y capturas. También verifica retorno a GPS tras elegir Resistencia, ubicación en memoria al remontar, cantidad de solicitudes, ausencia de overflow y errores de página.
- `.env.local` copiado desde el worktree de main y excluido por Git. Sin secretos versionados ni cambios de dependencias.

Fixtures de Auth/RPC/Mapbox/GPS, sin escrituras remotas. No se ejercitaron permisos reales del sistema, dispositivos físicos ni lector de pantalla; aceptación humana pendiente.
