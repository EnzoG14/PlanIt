# Para vos: refresh sin vaciar contenido

Validación con Playwright y respuestas simuladas de Auth/REST/Storage, sin escrituras remotas.

- 375 y 1280 px: regreso desde detalle reutiliza el resultado reciente sin otra RPC.
- Una consulta lenta por foco conserva la tarjeta montada y no muestra el loader inicial.
- Foco + visibilitychange durante una consulta no la abortan ni generan otra RPC.
- Estados vacío, error, fallo de intereses y reintento funcionan independientemente del listado general.
- Sin desbordamiento horizontal; capturas de las tarjetas durante el refresh en ambas carpetas.
- Prueba de caché: vigencia de 30 s, clave por cuenta y referencia geográfica, limpieza explícita y por cierre/cambio de sesión.

Comandos: `npm run build`, `npm run lint`, `node scripts/check-suggestions-cache.mjs` y `node scripts/check-suggestions-ui.mjs` con PLANIT_UI_WIDTH=375/1280 y servidor de fixtures.

Build correcto con avisos existentes de bundle/opción de Vite. Lint correcto con advertencias existentes en otros archivos. No se midió latencia de Supabase real ni se probó un dispositivo físico.

La caché guarda un solo resultado en memoria durante 30 segundos; no escribe datos ni coordenadas en almacenamiento persistente. Se invalida al intentar guardar intereses. Las imágenes reutilizan la caché de enlaces firmados del cambio anterior.
