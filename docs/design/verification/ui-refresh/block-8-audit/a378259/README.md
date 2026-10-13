# Reproducción y límites de la ejecución

SHA auditado: `a378259a60106ddd07b111080a24677ad509bc49`. Fecha: 13/10/2026 (America/Argentina/Buenos_Aires). Rama `test/amanecer-block-8-audit` creada desde origin/main tras fetch. No había auditoría bloque 8 previa para este SHA. No se reutilizó un working tree ajeno como main.

## Entorno

Windows x64, Node v24.19.0, npm 11.17.0, Vite instalado 8.3.4, Edge headless/Playwright del runtime Codex. `npm ci --no-audit --no-fund`: 372 paquetes; warning glob 11.1.0. No se ejecutó auditoría npm de vulnerabilidades en esta instalación. PostgreSQL efímero real y PGlite con scaffolding Auth/Storage de las suites existentes. Herramientas externas ya disponibles: `.participation-test-tools.local/node_modules` y `.event-test-tools.local/node_modules`, junctions al runtime local existente en D:/planit; sólo paquetes, no fuentes ni índices. Cada checkout tiene CodeGraph propio inicializado con gentle-ai; watchers no forzados.

Servidor Vite exclusivo en 127.0.0.1:4198, configuración `VITE_SUPABASE_URL=https://iepeqmvzjguwlhnecsdq.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture`, `VITE_MAPBOX_ACCESS_TOKEN=pk.fixture`. Son valores de fixture sin credenciales reales; Auth/REST/Storage/WS y Mapbox se interceptan en suites. No archivo .env real copiado, no --live/--signup/--connection, no SQL remoto ni migración aplicada a Supabase. El primer inicio carecía de token Mapbox; se reinició antes de suites UI con pk.fixture para que el motor sea probado con estilo interceptado.

## Ejecución

Consultar `commands.json` para comandos externos, tiempos UTC y exit codes; `check-r3/results.json` guarda cada una de las 28 suites con stdout/stderr. La suite R3 existente crea wrappers temporales propios para redirigir salidas/orígenes; se eliminan al finalizar. El wrapper de social redirige sólo su carpeta hardcoded en copia temporal, sin editar el runner versionado. `check:events -- --postgres` añade replay PGlite explícito, separado del check local de validación de creación por defecto.

Desde checkout fijado al SHA, instalar lockfile, preparar herramientas externas según [UI_WORKFLOW](../../../../UI_WORKFLOW.md) y servir el puerto anterior. En PowerShell:

```powershell
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4198'
$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$env:PLANIT_UI_NO_PROXY='1'
$env:PLANIT_BASE_SHA='a378259a60106ddd07b111080a24677ad509bc49'
# Cambiar a carpeta NUEVA al repetir; no sobrescribir esta ejecución histórica.
$env:PLANIT_UI_OUTPUT='docs/design/verification/ui-refresh/nueva-ejecucion/r3'
npm run build
npm run lint
npm run check:amanecer
npm run check:foundation
npm run check:auth
npm run check:r3
npm run check:events -- --postgres
```

Los scripts restantes y variables por suite constan en el manifiesto y en `probes/run.mjs`. Los probes targeted/integration derivan del fixture ya versionado `check-discovery-refresh-ui.mjs`, con abort local de import y cancelación interceptada; **no** son tests nuevos del producto. Ejecutarlos fijando PLANIT_UI_OUTPUT a carpeta nueva. No copiar el índice CodeGraph ni datos remotos.

## Interpretación

Capturas seis viewports: 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900; estados de carga/vacío/error/éxito, sin foto, nombres/títulos largos, listas y poco alto donde cada runner lo implementa. Texto 200% es CSS/DOM simulado y no zoom nativo. No se afirma matriz cartesiana completa de todos los estados por todas las rutas/tamaños; `route-matrix.md` detalla cobertura.

Overflow documental no prueba ausencia de recortes. Se usan geometría, screenshots, hit-testing/scroll de controles en gestión y foco/diálogos según suites. Los PNG full-page ubican elementos fixed en posiciones de captura que no representan por sí solas obstrucción permanente. Medios geométricos/estilo de mapa vacío son fixtures identificados.

Los catálogos remotos, asesores y HTTP real de reportes QA anteriores no se actualizaron. QA R1 registra aceptación funcional humana histórica (no aceptación visual de Amanecer); R2/R3 mantienen sus pendientes originales. E2E HTTP/JWT, Storage/Realtime real, fotos naturales claras/oscuras, hardware, PWA/teclado/safe areas, lector de pantalla, zoom nativo y perfilado de blur/GPU/red lenta no cubiertos por esta ejecución.

## Archivos

- `findings.md`: defectos con severidad y reproducción.
- `route-matrix.md`: rutas, sistema, estados, componentes y límites.
- `IMPECCABLE.md`, `assessment-a.md`, `assessment-b.md`, `detector.json`: evaluación independiente y síntesis.
- `commands.json`, JSON por suite, logs seleccionados: resultados y fallos conservados.
- `contrasts.json`: pares normativos y sonda del vidrio, con límites.
- `screenshots.json`: manifiesto de capturas generadas, hashes y selección; las descartadas se reproducen con las mismas suites.
- `probes/`: arnés de evidencia, sin cambios de páginas/CSS/backend/tests del producto.

La decisión final y el cierre de servidores están registrados en [BLOCK_8_a378259](../../../../../implementation/ui-refresh-blocks/BLOCK_8_a378259.md). No hay aceptación humana de pantallas inferida por detector, suites ni merge.
