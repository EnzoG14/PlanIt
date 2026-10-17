# Ubicación sugerida — evidencia

Fecha: 17/10/2026 (Argentina). Rama `codex/event-location-autocomplete`, desde main `f8dd53c`. Implementado; aceptación humana pendiente.

## Cambio y revisión visual

Crear, duplicar y editar comparten Dirección con Geoapify: mínimo 3 caracteres, debounce 400 ms, hasta 5 sugerencias en español, preferencia Argentina sin filtro excluyente. Selección atómica de dirección/coordenadas; cambios de dirección invalidan coordenadas. El nombre opcional permanece independiente. Sin campos visibles de latitud/longitud. GPS conserva la dirección requerida y funciona sin clave del buscador. Cancelación, revisión de respuestas y timeout de 10 segundos protegen contra datos tardíos.

Amanecer preservado: tipografía autoalojada, superficies claras, tinta marina, foco violeta y composición existente. Mockup R3 de edición consultado como referencia funcional. Comparación visual inspeccionada entre [main móvil](before/baseline-375.png), [sugerencias móvil](behavior/suggestions-375.png), [escritorio](behavior/suggestions-1280.png) y [consulta real](live/real-geoapify-390.png). Los datos de eventos son fixtures. Las capturas baseline corresponden a main servido separadamente, sin editarlo; desactivan animaciones para hacer visible todo el formulario. Las capturas full-page incluyen navegación fija en su posición al capturar.

## Pruebas ejecutadas

- `npm run build`: PASS. Advertencia existente de chunks grandes (Mapbox).
- `npm run lint`: PASS; advertencias preexistentes en probes históricos y `DiscoveryFilters.tsx`; ninguna nueva en los archivos del cambio.
- `npm run check:events`: PASS (validaciones y contratos internos de eventos).
- `npm run check:location`: PASS; fetch simulado, codificación, bias, límite de resultados, coordenadas válidas/cero, respuestas vacías, inválidas, HTTP 429 y clave ausente.
- `npm run check:events:ui`: PASS, seis tamaños 320/360/375/390/768/1280, creación, imágenes, errores, respuesta perdida, bloqueo y Auth. [Capturas y medidas](create/measurements.json).
- `npm run check:edit-event:ui`: PASS, cinco tamaños 360/375/390/768/1280, 40 casos de precarga, permisos, errores, fechas/cupo, bloqueo y reconciliación. [Resultados](edit/ui-results.json).
- `npm run check:location:ui`: PASS, 16 escenarios agrupados en 320/375/390/768/1280: teclado, Escape, toque/click, debounce, cambio de dirección, vacío, error/reintento, búsqueda y GPS tardíos, payloads crear/editar/duplicar y alternativa GPS. Texto 200% y poca altura 360 px en 375/1280, sin desbordamiento horizontal. [Resultados](behavior/results.json), [texto ampliado](behavior/text-200-375.png).
- Modo `missing-key`: PASS sobre compilación sin clave: mensaje explicativo, cero consultas y guardado mediante GPS simulado. [Resultado](missing-key/results.json).
- Modo `live`: PASS con clave proporcionada por el usuario, consulta real a Geoapify de una dirección pública en Buenos Aires, selección y comprobación del payload con coordenadas finitas. Auth, REST y Storage permanecieron simulados; no hubo escrituras remotas Supabase. [Resultado](live/results.json).

## Reproducción

Configurar `.env.local` según [arquitectura de mapas](../../../map-architecture.md#ubicación-sugerida-en-formularios). Ejecutar Vite en localhost y definir `PLANIT_UI_ORIGIN`, `PLANIT_PLAYWRIGHT_PATH` (ruta a `playwright/index.mjs`) y opcionalmente `PLANIT_UI_OUTPUT`. Los runners usan Edge headless; para tests de sugerencias basta una clave ficticia en Vite porque interceptan Geoapify. `PLANIT_LOCATION_MODE=live` permite consultas reales y requiere clave válida; `missing-key` requiere una compilación sin clave; `baseline` captura la versión indicada por el origen. No imprimir claves ni versionar `.env.local`.

## Límites

No se modificaron SQL, RPC, RLS ni migraciones; no se ejecutó la suite PostgreSQL de edición porque el cambio sólo afecta frontend. Sin aceptación humana, lector de pantalla ni dispositivos físicos; emulación y texto CSS ampliado no acreditan teclado móvil/zoom nativo/safe areas reales. Verificar restricciones de origen y cuota en la cuenta Geoapify antes del despliegue. La clave se copió/configuró sólo en el archivo local ignorado. Sin nuevos paquetes.
