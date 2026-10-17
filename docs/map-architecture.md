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

El motor Leaflet y los tiles OSM anteriores permanecen descritos en los informes históricos de R1, no como proveedor vigente. Pruebas nuevas y pendientes: [matriz](qa/MAPBOX_MIGRATION_ACCEPTANCE.md). La migración original no incluía geocoding ni selección de ubicación de creación; esa capacidad se incorpora en el apartado siguiente. Rutas y clustering siguen fuera de alcance.


## Ubicación sugerida en formularios

17/10/2026. Crear, duplicar y editar usan Geoapify Address Autocomplete mediante fetch; Mapbox sigue siendo el motor del mapa. Dirección muestra hasta cinco resultados tras tres caracteres y 400 ms sin escribir, con `lang=es` y `bias=countrycode:ar`, sin excluir otros países. Elegir una sugerencia asigna dirección/coordenadas juntas; editar Dirección invalida las coordenadas. Los eventos existentes conservan su ubicación mientras no cambie la dirección. GPS sigue disponible y no necesita Geoapify. Las coordenadas permanecen en los contratos internos y no se muestran como campos.

Configurar `VITE_GEOAPIFY_API_KEY` en `.env.local` con una clave para navegador; restringirla a los orígenes HTTP de desarrollo y HTTPS de producción desde la cuenta del proveedor. Nunca usar secretos de servidor en VITE. Reiniciar Vite o reconstruir al cambiarla. El ejemplo versionado contiene sólo un placeholder. Sin clave o con error, la interfaz explica el estado y ofrece la alternativa GPS; consultas cancelables, timeout 10 s y ninguna caché persistente del buscador. No se usa geocodificación inversa ni se persisten borradores.

[Geoapify Autocomplete](https://www.geoapify.com/address-autocomplete/) permite almacenar los resultados y ofrece plan gratuito de hasta 3.000 créditos diarios sujeto a límites y atribución; no se activaron planes pagos. Se muestran enlaces Powered by Geoapify y OpenStreetMap junto al campo. [Referencia de API y protección de claves](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/). La clave local proporcionada por el usuario permitió verificar una consulta real; confirmar restricciones de origen y cuota antes del despliegue. [Pruebas y límites](design/verification/location-autocomplete/README.md).
