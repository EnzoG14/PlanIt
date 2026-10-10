# Mapa y detalle R1 — PROMPT 05

Fuente: pestañas Especificación técnica, Plan técnico Release 1 y Nueva planificación del [documento Planificacion](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit). Sólo BLOQUE 3 / PROMPT 05.

## Responsabilidades

| Archivo | Responsabilidad |
| --- | --- |
| `src/features/events/discovery.ts` | Consulta Supabase y devuelve `EventPreview`, firma portadas en un lote; sin Leaflet |
| `src/components/maps/EventMap.tsx` | Única implementación Leaflet/React Leaflet; props y callbacks con coordenadas propias |
| `src/components/maps/provider.ts` | URL HTTPS, atribución y zoom del proveedor raster |
| `src/components/maps/map.css` | CSS aislado por `.event-map`, sin filtros de tiles |
| `src/features/location/geolocation.ts` | API bajo interacción, errores y tipos propios; compartida con creación |
| `src/pages/MapPage.tsx` | Centro, zona, selección, consulta con debounce y estados; ignora respuestas viejas |
| `src/components/EventCard.tsx` | Tarjeta reutilizable con enlaces React Router, independiente del mapa |
| `src/pages/EventDetailPage.tsx` | Lectura autorizada, portada, categoría, fechas argentinas, lugar, descripción y cupo; sin motor cartográfico |

Mapa y motor cargados de forma diferida. Centro usa `setView`, selección modifica iconos sin reconstruir mapa. Consulta por viewport limitada a 101 filas; muestra 100 y avisa acercar el mapa si hay más. Límites normalizados admiten cruce del antimeridiano.

## Cambio de proveedor

| Migración | Cambiar | Conservar |
| --- | --- | --- |
| CARTO Dark Matter raster | `provider.ts`: URL, atribución y límites según política vigente | Leaflet, páginas, dominio, consultas, tarjetas y rutas |
| Mapbox raster compatible | `provider.ts`, token público restringido si se requiere | Leaflet y el resto de la aplicación |
| Mapbox GL / MapLibre | Implementación interna `EventMap.tsx`, `map.css`, configuración de estilo y dependencias | Props propias, páginas, eventos, tarjetas, geolocalización, Auth, RPC y rutas |

Tiles raster y motor son decisiones distintas. No existen adaptadores ficticios ni fábricas.

## SQL y pendientes

`20261010052653_public_event_discovery.sql`: **aplicada en planit-v2 el 10/10/2026 con autorización del usuario** mediante CLI, conservando su versión local. RPC `discover_public_events`, SECURITY INVOKER y `search_path` vacío; EXECUTE sólo authenticated. Conserva RLS de eventos/media y filtra público, no cancelado/archivado, fin posterior al reloj servidor Argentina y área visible, incluso para el organizador. No devuelve perfiles. Historial sincronizado y dry-run posterior sin pendientes. Consulta remota con dos identidades bajo rol authenticated y ROLLBACK: un evento visible por identidad, cero filas excluibles; límites inválidos devuelven cero. No se modifica la lectura histórica del propietario en el detalle.

Inspección remota de sólo lectura confirmó un evento existente y ausencia de `event_participations` el 10/10/2026. Por eso no se inventan confirmados ni barra de ocupación y no se muestran CTA Unirme/Retirarme. Organizador recibe aviso de que no ocupa cupo. Mis eventos enlaza a ruta existente; su consulta corresponde al bloque siguiente. Sin galería ampliada/social ni filtros R4.

OSM estándar claro con atribución visible; navegador conserva caché HTTP y Referer. Sin proxy, filtros CSS, prefetch ni caché offline personalizada; service worker sin runtime caching. [Política de tiles](https://operations.osmfoundation.org/policies/tiles/).

Fotos firmadas duran cinco minutos: Actualizar eventos renueva previews. Si fallan firmas se conserva tarjeta sin foto. Sin Realtime en este bloque. Ubicación inicial explícita Buenos Aires; permiso opcional y desplazamiento manual como alternativa.

## Verificación

`node scripts/check-discovery.mjs`: PGlite con migraciones previas/nueva. Público/vigente/área, oculto/cancelado/archivado/finalizado, propietario, anónimo, vacío, límites inválidos y antimeridiano. Requiere dependencia de prueba existente `.event-test-tools.local`.

`node scripts/check-discovery-ui.mjs`: Playwright del runtime desktop configurable con `PLANIT_PLAYWRIGHT_PATH`, origen con `PLANIT_UI_ORIGIN`. Datos/Auth/tiles interceptados: no acredita integración remota ni cobertura OSM. [Capturas y criterios](design/verification/map-detail-r1/README.md).
