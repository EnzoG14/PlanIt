# PROMPT 05 — Verificación mapa/detalle

Fecha: 10/10/2026, Argentina. Referencias: teléfonos 4/5 de `docs/design/mockups/release-1.png` y tarjetas/navegación R2. [Arquitectura, límites y despliegue](../../../map-architecture.md).

## Evidencia

- `map-375x812.png`, `detail-375x812.png`: móvil.
- `map-768x1024.png`, `detail-768x1024.png`: tablet.
- `map-1280x900.png`, `detail-1280x900.png`: desktop.
- `empty-375x812.png`, `error-375x812.png`: resultados vacíos y fallo de consulta.
- `results.json`: dimensiones, ausencia de overflow horizontal y errores de JS.

**Fixtures explícitos** de Auth/eventos y tiles neutros interceptados. Leaflet real; tiles de prueba no son cartografía real ni assets de producción. No se descargan tiles OSM automáticamente. Fotografías de eventos reales no se inventan; captura muestra placeholder propio.

## Matriz RF-R1-04

| Criterio | Resultado local | Pendiente remoto |
| --- | --- | --- |
| CA-01 públicos activos geolocalizados en área | PostgreSQL local filtra área/fin con reloj servidor; UI dibuja marcador | RPC aplicada y consulta SQL remota verificada; navegador real pendiente |
| CA-02 selección, preview y detalle | Marcador por Enter, tarjeta/enlaces y navegación verificados; instancia de mapa conservada | Evento real en navegador |
| CA-03 ocultos/cancelados/no disponibles excluidos | PostgreSQL local prueba oculto, cancelado, archivado y pasado; incluye exclusión del propietario | RPC desplegada; resultados remotos sin filas excluibles |
| CA-04 vacío y ubicación denegada explícitos | UI prueba vacío, permiso denegado, fallback, error/reintento | Permisos en teléfono físico |

Pruebas adicionales: anónimo sin EXECUTE, límites inválidos y antimeridiano en SQL; ID inválido/inaccesible, horario Argentina con navegador Asia/Tokyo, responsive y sin CTA simulados en UI.

## Comparación visual

Conservados: marino profundo, acento azul/violeta, controles redondeados, portada/overlay, categoría y navegación inferior. Mapa raster claro requerido por PROMPT 05; no se invierten tiles. Búsqueda/filtros/favoritos del collage omitidos por alcance. Cupo real disponible; barra/confirmados/Unirme/Retirarme pendientes de RPC de participación. No se interpreta ausencia de tabla como cero confirmados. Etiquetas de campos, mayor área táctil y scroll son adaptaciones de accesibilidad.

Capturas full-page muestran navegación fija a la altura del viewport original; contenido mantiene padding inferior para poder desplazarse sin quedar oculto. Escritorio amplía mapa y usa grid; no imita marco de teléfono.

## Reproducción

`npm run build`, `npm run lint`, `node scripts/check-discovery.mjs`.

Para UI: iniciar Vite, fijar `PLANIT_UI_ORIGIN` al puerto activo y ejecutar `node scripts/check-discovery-ui.mjs`. Usa Playwright del runtime desktop; puede configurarse `PLANIT_PLAYWRIGHT_PATH`. SQL local requiere PGlite de `.event-test-tools.local`, dependencia de prueba existente que no se añade al bundle.

## Despliegue remoto autorizado

Migración `20261010052653_public_event_discovery.sql` aplicada en `planit-v2` (`iepeqmvzjguwlhnecsdq`) el 10/10/2026. Previo: prueba SQL local aprobada, ref confirmada, historial y dry-run identificaron sólo esta migración. Posterior: historial sincronizado y dry-run sin pendientes.

Verificación SQL remota con dos identidades existentes bajo rol authenticated y ROLLBACK: un evento público vigente visible por identidad, cero resultados ocultos/cancelados/archivados/finalizados; límites inválidos devuelven cero. Privilegios revisados: SECURITY INVOKER, search_path vacío, authenticated con EXECUTE, anon sin EXECUTE. No se crearon eventos de prueba remotos.

Asesores de seguridad antes/después: sin avisos nuevos; conserva aviso previo de [protección contra contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se cambió Auth.

Las capturas siguen siendo fixtures; falta prueba de navegador con sesión real y permisos en teléfono físico. Mis eventos aún es la ruta de preparación del siguiente bloque.
