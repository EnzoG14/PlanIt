# Migración completa a Mapbox GL JS

Fecha: 11/10/2026 (Argentina). Rama `codex/mapbox-migration`, basada en `origin/main` `5a3aed5`. Una única implementación y un único PR hacia main; sin merge ni SQL remoto.

## Objetivo y alcance

Sustituir Leaflet/React Leaflet y tiles OSM por Mapbox GL JS manteniendo RF-R1-04.CA-01..04, los contratos públicos de componentes, la RPC `discover_public_events`, Auth, geolocalización opcional, tarjetas y rutas. No se agregan geocoding, rutas, clustering, filtros ni selección de ubicación para creación.

## Situación anterior y solución

El mapa raster Leaflet estaba encapsulado en `EventMap`. Se reemplazó su implementación interna por Mapbox GL JS oficial 3.32.0, con tipos incluidos, Standard nocturno y proyección Mercator. La página continúa administrando estado y consultas; el motor sólo recibe coordenadas/eventos y devuelve selección/límites. El diseño conserva estructura, tipografía y tokens de `DESIGN_SYSTEM`, `SCREENS`, `DESIGN_GAPS` y el cuarto teléfono de `release-1.png`.

## Decisiones y arquitectura resultante

- Un `Map` por montaje, refs de instancia/callbacks y limpieza explícita. React Strict Mode realiza montaje/limpieza/remontaje sin retener instancias. Los cambios de centro usan `jumpTo`; eventos y selección actualizan un conjunto incremental de marcadores.
- Botones DOM de 44×48 px con títulos como texto, Enter/Espacio/click/touch, aria-pressed y foco visible. Normal azul #0753FF; seleccionado violeta #8D66FA. Controles 44×44 px, etiquetas españolas; atribución completa y logo del SDK visibles.
- `moveend` y ResizeObserver; límites normalizados, mundo completo y antimeridiano. Debounce existente de 300 ms e ignorar respuestas antiguas se conservan. Selección sobrevive a actualización si el evento sigue presente, y se elimina cuando desaparece o falla la consulta.
- Zona aproximada inicial alrededor de Buenos Aires, reemplazada por viewport real. Sin token/WebGL se mantiene esa consulta y cambiar centro actualiza el área aproximada. Errores remotos conservan las tarjetas del área consultada. Se distingue error de mapa, error de RPC, vacío y permiso de ubicación.
- Carga diferida del componente y motor. PWA precachea recursos locales del build, sin runtime caching de Mapbox/Supabase. Mapbox incrementa el chunk diferido (~1,86 MB minificado/~518 KB gzip); Vite informa warning de tamaño. No se oculta el aviso ni se introduce otro framework.
- RPC/RLS/Storage/esquema/auth no modificados. Los filtros públicos siguen en servidor. Historial documental R1 y textos originales RF/CA intactos. El plan R1 histórico menciona bloques; para esta tarea prevalece el pedido explícito de una iteración única.

## Archivos modificados

`.env.example`, `package.json`, `package-lock.json`, `vite.config.ts`, `src/vite-env.d.ts`, `src/components/maps/EventMap.tsx`, `provider.ts`, `map.css`, `src/pages/MapPage.tsx`, `scripts/check-discovery-ui.mjs`, nuevo `scripts/check-mapbox.mjs`, `docs/architecture.md`, `docs/map-architecture.md`, este informe, `docs/qa/MAPBOX_MIGRATION_ACCEPTANCE.md` y evidencia en `docs/design/verification/mapbox-migration/`.

Se agrega `mapbox-gl` ^3.32.0 (tipos propios). Se eliminan `leaflet`, `react-leaflet`, `@types/leaflet` y transitivas exclusivas. Se agrega `npm run check:mapbox`; la prueba SQL original permanece intacta. PGlite instalado únicamente en `.event-test-tools.local` ignorada; no es dependencia de producción.

Los cambios locales preexistentes del checkout original (Vite y eliminación de `.env.example`) se preservaron. El checkout de esta tarea está en `mapbox-worktree/`, independiente de la rama previa.

## Configuración

Copiar `.env.example` a `.env.local` y configurar `VITE_MAPBOX_ACCESS_TOKEN=pk.…` con un token público propio. Reiniciar Vite/reconstruir producción. El SDK lo recibe desde import.meta.env y por instancia; no hay token global. `.env.local` está ignorado. No versionar tokens reales ni usar `sk.`; Vite rechaza valores secretos/formatos inválidos antes de generar bundle. Ausencia/placeholder permite build y muestra aviso informativo en el mapa; la comprobación local de formato no demuestra vigencia.

En Mapbox crear un token público con permisos mínimos de lectura requeridos por GL JS y restricciones de URL para los orígenes autorizados de desarrollo y hosting (esquema/host/puerto correspondientes). Incluir explícitamente las URLs de pruebas locales que realmente se utilicen; comprobar el despliegue con el token restringido. No usar un token sin restricciones para producción. Revisar scopes, tarifas y restricciones en [documentación oficial](https://docs.mapbox.com/help/dive-deeper/access-tokens/). Standard nocturno sigue [configuración oficial](https://docs.mapbox.com/mapbox-gl-js/example/set-config-property/).

## Pruebas y evidencia

- `npm ci`: instalación reproducible; audit informó cero vulnerabilidades.
- `npm run build`: TypeScript, Vite y Service Worker correctos; warning de chunk grande descrito arriba.
- `npm run lint`: sin avisos.
- `npm run check:discovery`: PGlite local con SQL versionado; público/vigente/área, ocultos/cancelados/archivados/finalizados, exclusiones del organizador, anónimo, límites inválidos, vacío y antimeridiano. Sin ejecutar SQL remoto.
- `npm run check:mapbox`: normalización, antimeridiano, mundo completo/polos, token ausente/público/secreto y rechazo de secretos por configuración de build. La salida de Vite “failed to load config” es esperada en ese caso negativo.
- `npm run check:discovery:ui`: Edge headless, React Strict Mode y Mapbox GL JS/WebGL reales; estilo geográfico reemplazado por fondo local y atribución expresamente fixture, Auth/RPC interceptados. Tres resoluciones: 375×812, 768×1024, 1280×900. Selección por teclado y tarjetas, canvas estable, pan/zoom con consulta de área, un callback de consulta por pan, detalle, fechas argentinas en zona Tokyo, permiso denegado/concedido, límite de 100, vacío, error/reintento, estilo 401, desmontaje, detalle ausente/ID inválido y ausencia de overflow/pageerrors.
- La misma suite se ejecuta con `PLANIT_MAP_MODE=missing` contra servidor sin token y con `PLANIT_MAP_MODE=webgl` simulando contexto WebGL no disponible. Verifica tarjetas, selección/preview, detalle y consultas sin mapa. En esos modos no se afirma probar marcadores/zoom.

[Resultados y reproducción](../design/verification/mapbox-migration/README.md), [matriz por criterio](../qa/MAPBOX_MIGRATION_ACCEPTANCE.md). Las capturas fixture muestran marcadores y composición, no cartografía de calles Standard real.

## Resultado, riesgos y pendientes

Implementado, con QA humana pendiente. No existe token real de Mapbox configurado en el entorno: no se validaron carga de Standard nocturno desde Mapbox, tiles/etiquetas, scopes, restricciones de URL, vigencia, facturación ni integración remota Auth/REST/Storage. Se necesita token público restringido y prueba manual en hosting/teléfono físico, incluyendo gestos táctiles, safe-area y recuperación de conexión/contexto real. Las pruebas interceptadas no sustituyen esta aceptación. Ningún CA de la migración se marca Validado sin aprobación humana. Sin migraciones ni cambios de servicios remotos.
