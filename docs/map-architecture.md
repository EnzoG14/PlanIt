# Arquitectura del mapa — Mapbox GL JS

Migración completa en una iteración, 11/10/2026. Requisito RF-R1-04; contratos originales y aceptación histórica de R1 intactos.

| Archivo | Responsabilidad |
|---|---|
| `EventMap.tsx` | Motor oficial Mapbox GL JS, instancia por montaje, controles, listeners, resize, marcadores DOM y selección |
| `provider.ts` | Standard nocturno, zoom, validación pk., límites normalizados y área aproximada de respaldo |
| `map.css` | Superficies marino, pines azules/violetas, controles táctiles y foco |
| `MapPage.tsx` | Centro, selección, resultados, debounce 300 ms, actualización manual e ignorar respuestas antiguas |
| `discovery.ts` | RPC `discover_public_events`, hasta 100 resultados, firmas de fotos por lote |
| `geolocation.ts` | Coordenadas y límites propios, Buenos Aires y permiso opcional |
| `EventCard.tsx` | Selección y navegación al detalle independientes del motor |

El componente y motor se cargan con React.lazy. React Strict Mode crea, limpia y vuelve a montar sin conservar listeners/instancias anteriores. Eventos, selección y centro no reconstruyen el mapa; botones nativos ofrecen Enter/Espacio y click/touch. No se interpolan títulos como HTML. ResizeObserver se desconecta y Map.remove libera controles, canvas y recursos al desmontar. Los callbacks se actualizan mediante ref, sin registrar nuevos listeners por render.

Mapbox emite moveend después de pan/zoom; sus límites se normalizan a [-180,180), preservando west > east cuando cruzan el antimeridiano. Un viewport de 360 grados o más utiliza [-180,180]. La RPC existente sigue aplicando visibilidad, vigencia y RLS en servidor. No se modifica SQL, Auth ni Storage.

Las tarjetas comienzan con una zona aproximada (±0,025° latitud y ±0,04° longitud) del centro inicial. El viewport real la reemplaza antes del debounce cuando Mapbox está disponible. Sin token o con fallo de creación, cambiar el centro consulta esa zona aproximada; un error remoto de estilo conserva el viewport consultado y las tarjetas. Errores de estilo/red/WebGL se muestran aparte de errores de consulta. Un error de carga no bloquea navegación ni actualización. Sin fallback a otro proveedor.

Standard usa `config.basemap.lightPreset = night`, proyección Mercator y zoom 3–19 (inicial 13). Zoom por controles/pinch/teclado; rueda desactivada para conservar scroll de página. Atribución Mapbox completa y logo visibles, no ocultados por CSS. No se cachean recursos remotos en el Service Worker.

Configurar `.env.local` con `VITE_MAPBOX_ACCESS_TOKEN=pk.…`, reiniciar Vite y reconstruir producción. El frontend valida prefijo/formato; Vite rechaza tokens secretos antes del bundle. Esto no verifica vigencia, scopes ni restricciones. Crear token público propio en Mapbox con permisos mínimos de lectura requeridos por GL JS, restringir a URLs de desarrollo y hosting reales (incluidos esquema/puerto); no usar sk. ni versionar valores reales. Véase [tokens](https://docs.mapbox.com/help/dive-deeper/access-tokens/) y [Standard](https://docs.mapbox.com/mapbox-gl-js/example/set-config-property/).

El motor Leaflet y los tiles OSM anteriores permanecen descritos en los informes históricos de R1, no como proveedor vigente. Pruebas nuevas y pendientes: [matriz](qa/MAPBOX_MIGRATION_ACCEPTANCE.md). No se implementan geocoding, rutas, filtros, clustering ni selección de ubicación de creación.
