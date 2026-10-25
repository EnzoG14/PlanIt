# Tarjetas sin ubicación e imágenes completas

Verificación del 25/10/2026 sobre la dirección Amanecer. Fixtures locales identificados; no se consultaron ni modificaron datos remotos.

- Inicio, resultados y vista previa del mapa, Organizo y Participo: se elimina la ubicación de las tarjetas. El detalle conserva la ubicación.
- Miniaturas cuadradas con ancho existente: 80/100 px en descubrimiento y 52/60 px en Mis eventos según breakpoint; imagen completa centrada con `object-fit: contain`. Por ajuste solicitado, el fondo de las imágenes es transparente: los espacios libres muestran la superficie de la tarjeta. Los iconos de ausencia/error de Mis eventos conservan su fondo.
- Se conservan los estados sin imagen/error y la navegación. No cambia EventImage ni los contratos de datos.

## Comprobaciones

`node scripts/check-event-cards-ui.mjs` pasó en 320, 375, 390, 768 y 1280 px: Inicio, Mapa, Organizo y Participo (20 combinaciones), con imagen vertical, cuadrada, panorámica, ausente y rota. Comprueba marco cuadrado, imagen ajustada al marco, proporción natural disponible, centrado, ausencia de ubicación, destino de enlaces y ausencia de overflow horizontal. También abre el detalle desde Inicio y comprueba la ubicación; abre y cierra la vista previa desde la lista del mapa.

Las 60 mediciones de imágenes cargadas están en [measurements.json](measurements.json). Capturas de móvil y escritorio incluidas para las cuatro vistas y la vista previa del mapa; se inspeccionaron visualmente Inicio móvil/escritorio, Organizo móvil y vista previa móvil.

- `npm run build`: PASS; advertencias existentes sobre tamaño del bundle de Mapbox y `inlineDynamicImports`.
- `npm run lint`: PASS con advertencias preexistentes en probes históricos y DiscoveryFilters.
- `git diff --check`: PASS.

Reproducir con `npm run dev -- --host 127.0.0.1 --port 4187 --strictPort`, configuración pública de planit-v2 y el comando de verificación. El script intercepta Auth, REST, Storage y Realtime con fixtures; se puede configurar `PLANIT_UI_ORIGIN`, `PLANIT_UI_OUTPUT` y `PLANIT_PLAYWRIGHT_PATH`.

Límites: Edge headless y viewports emulados; no acredita dispositivos físicos, lector de pantalla, cartografía remota ni aceptación humana. No se modifican el mapa geográfico ni la galería/portada del detalle.
