# Release 4 · Bloque 9

14/10/2026. Base `090fbab`, rama `codex/r4-block-9`; [PR #48](https://github.com/EnzoG14/PlanIt/pull/48) en borrador. **52/52 comandos/suites finales PASS; 39/39 CA y 47/47 escenarios D/P/H con evidencia local/fixture. NO-GO para cierre global:** JWT funcional real, Storage/Realtime remotos, dispositivos y aceptación humana pendientes. Ningún Validado.

- [Informe de cierre](../RELEASE_4_TEST_REPORT.md), [matriz legible](TRACEABILITY.md), [39 textos y escenarios](traceability.json).
- [Comandos y todos los intentos](commands.json), [primer corte con cinco fallos](commands-initial.json), [artefactos SHA256](artifacts.json), [archivo local de capturas adicionales](local-capture-archive.json).
- [Baseline main y assets inmutables](baseline.json), [revisión Amanecer](IMPECCABLE.md), [UI final](check-r4-ui/results.json), [caché PWA](check-r4-ui/pwa-cache.json).
- [Rendimiento/EXPLAIN](check-r4-performance/results.json), [metadata remota](remote/catalog.json), [55 hashes/ACL/config iguales](remote/comparison.json), [dry-run](remote/db-push-dry-run.txt).
- [Instalación y límite EPERM](installation.json), [lockfile/binario idénticos](dependency-recovery.json), [fuente técnica original](source.json).

## Reproducir

Desde Windows x64, Node compatible con Vite8, Edge, dependencias del lockfile y herramientas locales del [workflow](../../design/UI_WORKFLOW.md). Configuración pública autorizada en `.env.local`, sin secretos. Variables de prueba:

```powershell
$env:PLANIT_PLAYWRIGHT_PATH = '<ruta absoluta a playwright/index.mjs>'
$env:PLANIT_TEST_TOOLS_DIR = '<ruta a node_modules de pg y @embedded-postgres/windows-x64>'
$env:PLANIT_R4_OUTPUT = 'docs/qa/r4-block-9/recheck'
$env:PLANIT_UI_BASELINE = 'http://127.0.0.1:4195'
npm ci
npm run check:r4
```

El runner inicia y detiene su preview de producción en4199, ejecuta secuencialmente y conserva resultados e intentos sin pisar otros bloques. Para repetir sólo fallos: `npm run check:r4 -- check:interests:ui check:profile:ui`. Build primero si cambia frontend. Los checks event-links UI requieren además servir un build base fijado a main en4195; no usar un build distinto sin registrar SHA y hashes. En otra terminal: `node node_modules/vite/bin/vite.js preview --outDir <directorio-dist-inmutable> --host 127.0.0.1 --port 4195 --strictPort`. No se intercambian fuentes de una app en ejecución. Las herramientas pg/PGlite/Playwright son externas y no se agregaron como dependencias de producto.

El fallo inicial de npm ci por binario bloqueado se recuperó mediante instalación aislada del mismo lockfile y copia de paquetes faltantes, preservando el binario idéntico. No es prueba de npm ci limpio en el checkout original. [Acta](installation.json).

`node scripts/report-release-4.mjs` regenera la trazabilidad y hashes del corte B9 y comprueba que los 39 textos siguen idénticos a la base. No acepta pruebas de fixtures como JWT real. Para una corrida recheck, conservar sus resultados por separado: este generador describe el corte B9 versionado, no una carpeta configurable.

## Lectura de evidencia

`check-*` contiene command.txt, JSON y PNG representativas de cada suite; se versionan 162 capturas, incluida toda la matriz suplementaria final. Las capturas adicionales/repetidas permanecen en `.r4-b9-captures.local` (ignorado) y se inventarían con hashes en local-capture-archive.json; no son adjuntos descargables de la PR. Algunos runners retienen etiquetas de su bloque de origen; base de ejecución en commands/baseline, replay con 25 migraciones. Los cinco fallos iniciales fueron: foco al volver desde intereses (producto), altura subpíxel, import dev-only de sugerencias, polling del fixture de notificaciones y color literal minificado de Auth (runners). Un intento intermedio de lint/SQL falló por nombre local duplicado en el nuevo test E; corregido y retesteado.

Las carpetas supplemental-ui, check-r4-ui-stress y primeras capturas check-r4-ui conservan intentos previos del mismo bloque; el JSON final identifica las aserciones exitosas. Las capturas full-page pueden no pintar contenido fuera del viewport por content-visibility:auto; map-result-visible verifica ese contenido tras scroll. No se sobrescribió QA histórica.

PostgreSQL17.5 local con Auth/Storage SQL sintéticos y roles; PGlite en suites históricas acotadas. Edge con Auth/REST/Storage interceptados, Mapbox engine local/fallo inyectado y Realtime simulado/bloqueado. SW real local de producción, Auth fixture. Emulación de tamaños/texto/medias no equivale a pruebas físicas ni a aceptación humana. Remoto: sólo historial, catálogo, asesores y dry-run; ninguna mutación de negocio o aplicación SQL.
