# Release 2 — Bloque 1: evidencia local

La UI se comprobó en 375×812 y 1280×900 con Playwright. Las respuestas de Auth, PostgREST y Storage son fixtures; estas capturas no representan llamadas HTTP reales a Supabase.

## Capturas

- Inicio: [375×812](home-mobile.png), [1280×900](home-desktop.png).
- Detalle sin fotos: [375×812](detail-mobile.png), [organizador en móvil](detail-organizer-mobile.png), [organizador en escritorio](detail-organizer-desktop.png).
- Detalle con dos fotos firmadas de fixture: [375×812](detail-gallery-mobile.png).
- Regresión de mapa R1 con navegador y respuestas fixture: [capturas y resultados](r1-map-regression/).

## Checks

- `postgres-results.json`: migraciones reproducidas en PostgreSQL local; paginación/orden, categorías, fecha de inicio, cancelación/archivo, portadas, dos identidades autenticadas, proyección social, acceso de tercero y rechazo anónimo. Auth y Storage son scaffolding SQL; no es una prueba REST real.
- `ui-results.json`: tarjeta agrupada abre el evento correcto, retorno a Inicio, galería, placeholder sin fotos, estado vacío, error/reintento y paginación entre categorías. Todo usa fixtures locales.
- La suite de descubrimiento R1 valida mapa y detalle, también con navegador y fixtures.

Los criterios se consideran cubiertos por estas verificaciones automatizadas locales, no validados por el usuario. La comprobación remota Auth/REST/Storage y la aceptación visual humana siguen pendientes.
