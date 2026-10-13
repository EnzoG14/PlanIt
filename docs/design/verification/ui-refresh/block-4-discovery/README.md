# Evidencia — Bloque 4 Discovery

12/10/2026. Base main `123962f63cf7048495652031081f2d143d027685`. [Entrega y decisiones](../../../../implementation/ui-refresh-blocks/BLOCK_4.md).

- `before/`: 120 capturas del checkout base antes de editar.
- `after/`: 126 capturas finales y métricas de overflow/posición de acción. Mismos fixtures y anchos. JPG quality75 para acotar peso; no usar para comparación pixel-perfect.
- `regressions/`: salidas de checks existentes Home/Discovery/Participation/MyEvents/EventActions y datos Home locales.
- `real-mapbox/`: Mapbox Standard/day real en montaje aislado del componente; calles reales y marcador fixture, sin Auth/Supabase. Capturas390/1280, respuesta HTTP y atribución registradas.
- `IMPECCABLE.md`: dos assessments independientes, detector y resolución de hallazgos.

Fixtures de Auth/evento ficticios, HTTP interceptado; sin usuarios ni escrituras remotas. Media clara/oscura son SVG geométricos de QA, no fotografías naturales. La palabra photo en nombres de archivo describe la presencia del elemento img, no su procedencia fotográfica. Mapbox fixture usa motor real/WebGL con estilo vacío para pruebas deterministas; no confundir con las capturas de servicio real.

## Reproducción

Node/npm + Edge. Playwright externo mediante PLANIT_PLAYWRIGHT_PATH (ver UI_WORKFLOW). Herramientas PostgreSQL y PGlite externas/ignoradas para checks de datos.

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 4194 --strictPort
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4194'
node scripts/check-discovery-refresh-ui.mjs after
```

Configuración pública en `.env.local` ignorado. Tokens válidos sólo públicos. Runners interceptan Supabase y Mapbox para la matriz; no usar opciones live/signup. Para capturar baseline, usar checkout independiente del SHA base bajo home, con índice propio, y ejecutar el mismo runner en modo `before`; nunca intercambiar source de un servidor en ejecución.

Para cada check UI existente, elegir PLANIT_UI_OUTPUT distinto dentro de esta carpeta. Los checks de datos usan PostgreSQL/PGlite efímeros y no aplican migraciones remotas. `check:mapbox` genera intencionalmente rechazo de config con token secreto fixture: el mensaje failed to load config de ese caso es esperado.

La métrica font de metrics.json es la fuente de body heredada; los títulos/páginas heredan Bricolage de amanecer-shell. No usar ese campo como validación de carga efectiva de la fuente. Stress large-text duplica CSS por elemento (no zoom del navegador). Dispositivos, lectores, gestos y fotos naturales pendientes según BLOCK_4.

QA suplementaria: PLANIT_UI_SUPPLEMENTAL=1 verifica fuente/fallback, transparencia reducida, scope y media de tarjetas. PLANIT_UI_PHOTO permite elegir una fotografía local autorizada para futuras verificaciones; en esta entrega no se proporcionó fotografía natural.
