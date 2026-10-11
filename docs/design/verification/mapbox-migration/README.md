# Evidencia de migración Mapbox

11/10/2026, Edge headless y fixtures, sin token real. Implementado; QA humana pendiente. No representa integración remota ni calles reales.

| Suite | Resultado | Evidencia |
|---|---|---|
| Motor Mapbox GL JS/WebGL real + estilo local | PASS, 375×812 / 768×1024 / 1280×900 | [results.json](results.json), map/detail en este directorio, [401](mapbox-error-375x812.png) |
| Sin token | PASS, mismas tres resoluciones | [resultados](missing-token/results.json), capturas en missing-token |
| Contexto WebGL no disponible (simulado) | PASS, mismas tres resoluciones | [resultados](webgl-unavailable/results.json), capturas en webgl-unavailable |
| SQL discovery | PASS, PGlite con migraciones versionadas existentes | `npm run check:discovery` |
| Límites/token/build de secretos | PASS | `npm run check:mapbox` |
| Build/lint | PASS, warning de tamaño del chunk diferido Mapbox | `npm run build`, `npm run lint` |

Motor: inicialización, centro Buenos Aires (parámetros RPC contienen coordenadas iniciales), carga de estilo fixture, pan con flechas/zoom con consulta por área, canvas estable tras selección/pan/zoom, una consulta por pan, marcador teclado/click y estado violeta, sincronización tarjeta y detalle, permiso denegado/concedido, 100 resultados/aviso de truncamiento, vacío/error/reintento, estilo 401/tarjetas disponibles, ID inválido, desmontaje y cero errores de página/overflow. Las pruebas corren con Strict Mode de main.tsx.

Sin token y WebGL simulado: tarjetas/preview/detalle, consulta/actualización y geolocalización funcionan; no acreditan marcadores/zoom. El campo missingToken en JSON indica la rama de prueba sin motor (incluye WebGL); el campo mode distingue ambos casos. Los servicios Supabase están interceptados, y el estilo local sólo contiene fondo/GeoJSON vacío con atribución rotulada fixture. La exclusión de eventos no públicos se demuestra con SQL local, no devolviendo datos ficticios ya filtrados en la UI.

Las capturas fueron contrastadas visualmente con el teléfono del mapa de release-1: conservan fondos marino, pines azules/violetas y tarjetas/navegación existentes. El fondo plano reemplaza calles únicamente en pruebas. No se afirma fidelidad de cartografía Standard nocturna hasta configurar token real. El enlace de salto visible en algunas capturas corresponde al estado de foco de teclado existente.

## Reproducir

Desde el checkout de la rama, `npm ci`. Si falta PGlite, instalarlo sólo para pruebas: `npm install --prefix .event-test-tools.local --no-save --package-lock=false @electric-sql/pglite`.

Ejecutar build, lint, check:discovery y check:mapbox. Para UI instalar/usar Playwright del runtime desktop, indicar `PLANIT_PLAYWRIGHT_PATH` si la ruta por defecto no corresponde, y disponer de Edge.

Servidor de fixtures (PowerShell; estos valores son ficticios y no sirven para servicios reales):

```powershell
$env:VITE_SUPABASE_URL='https://iepeqmvzjguwlhnecsdq.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_fixture'
$env:VITE_MAPBOX_ACCESS_TOKEN='pk.fixture'
npm run dev -- --host 127.0.0.1 --port 4182
```

En otra terminal: `npm run check:discovery:ui`. Para WebGL simulado: `$env:PLANIT_MAP_MODE='webgl'`, `$env:PLANIT_UI_OUTPUT='docs/design/verification/mapbox-migration/webgl-unavailable'`, ejecutar el mismo comando. Para modo sin token, iniciar otro servidor 4183 con variable Mapbox ausente y configurar `PLANIT_UI_ORIGIN=http://127.0.0.1:4183`, `PLANIT_MAP_MODE=missing`, `PLANIT_UI_OUTPUT=docs/design/verification/mapbox-migration/missing-token`.

La suite intercepta red: pk.fixture no prueba autenticación Mapbox. Pendiente cargar Standard desde Mapbox con pk. real restringido, probar hosting, sesiones Supabase reales, teléfono físico/gestos, recuperación de red/WebGL real y aprobación humana de los cuatro CA. Ver [matriz](../../../qa/MAPBOX_MIGRATION_ACCEPTANCE.md) e [informe](../../../implementation/MAPBOX_MIGRATION.md).
