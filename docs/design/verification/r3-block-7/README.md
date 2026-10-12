# R3 Bloque 7 — Evidencia de QA integral

12/10/2026 (Argentina), `codex/r3-block-7`, base `d9c0a69`. [37 CA literales](../../../qa/RELEASE_3_ACCEPTANCE.md), [informe NO-GO y pendientes](../../../qa/RELEASE_3_TEST_REPORT.md). [PR #25](https://github.com/EnzoG14/PlanIt/pull/25) en borrador. No Validado, no aceptación humana ni E2E remoto implícito.

## Ejecutado y reproducible

1. `npm ci`, `npm run build`, `npm run lint`.
2. Herramientas SQL ignoradas: `.participation-test-tools.local/node_modules/pg` y `@embedded-postgres/windows-x64`, más `.event-test-tools.local/node_modules/@electric-sql/pglite`. Esta pasada reutilizó las herramientas existentes de `mapbox-worktree`; PostgreSQL 18.4. No son dependencias de producción; los scripts crean y detienen bases nuevas en loopback, sin borrar datos reales.
3. Playwright del runtime local y Edge. Configurar `PLANIT_PLAYWRIGHT_PATH` al `index.mjs` existente; `PLANIT_UI_ORIGIN=http://127.0.0.1:4189`. Vite necesita `VITE_SUPABASE_URL=https://iepeqmvzjguwlhnecsdq.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture_only` y `VITE_MAPBOX_ACCESS_TOKEN=pk.fixture`, **valores ficticios**; las suites interceptan servicios. Levantar `npm run dev -- --host 127.0.0.1 --port 4189 --strictPort` con esas variables.
4. `npm run check:r3`. No ejecutar dos instancias simultáneas. Para repetir sólo las suites afectadas: `node scripts/check-release-3.mjs my-events-ui attendees-ui event-actions-ui discovery-ui`. Se conserva la salida del resto y se reemplazan las suites solicitadas. Las copias temporales viven en scripts para mantener imports relativos, se redirigen a esta carpeta y se retiran en finally. Mis eventos se amplía aquí de dos a cinco tamaños, sin alterar su suite histórica.
5. `node scripts/check-r3-contrast.mjs`: [contraste](contrast-results.json). El ejecutor también lo invoca al inicio.
6. Auditoría remota **sólo de lectura**: `supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r3-metadata.sql --output json` y `supabase db advisors --linked --project-ref iepeqmvzjguwlhnecsdq --type security --output json`; guardar los resultados completos en `.r3-remote-metadata.local` y `.r3-remote-advisors.local`, ambos ignorados. La PR incluye únicamente el [resumen agregado](remote-summary.json), sin políticas/grants/configuración ni definiciones remotas. Requieren acceso autorizado a planit-v2. No ejecutar push/reset/seeds/mutaciones como parte de QA.
7. `npm run check:r3:metadata`: [comparación agregada](metadata-comparison.json) de historia y definiciones públicas contra replay local. Normaliza únicamente CR; excluye el event-trigger scaffold `rls_auto_enable`. No requiere conectarse a remoto: lee `.r3-remote-metadata.local`, que se debe generar con la lectura anterior en una máquina nueva. El snapshot de esta ejecución permanece local; no acredita estado remoto futuro.

[Resultados consolidados](results.json) guardan PASS/FAIL, comandos/suites, tiempos, stdout y stderr. JSON SQL contiene versión/entorno/casos; las suites que sólo imprimen resultados se conservan en stdout. Auth no usa flags --live/--signup. No se dispuso de dos cuentas `.auth-test.local`; HTTP/Auth/REST/Storage/Realtime reales permanecen pendientes. El servidor fixture y las bases son herramientas de esta revisión, no un despliegue.

## Originales, antes y después

Se abrieron el [collage original](../../mockups/release-3.png) y los [siete PNG individuales](../../mockups/r3/README.md). Se preservan los bytes originales. Las imágenes nuevas son capturas Edge con datos ficticios y placeholders; no se recortan fotos del diseño para usarlas como datos.

El único cambio visual de producto de esta PR es oscurecer un extremo del gradiente rojo de cancelar/remover. Para cancelación se ejecutó la suite antes del cambio en `before-event-actions/` (cinco tamaños); después se repitió `event-actions-ui/`. Para remoción se conserva como referencia anterior la evidencia del bloque 4, con el mismo CSS rojo previo, y se ejecuta de nuevo `attendees-ui/` tras el ajuste. Las pantallas sin cambios usan como «antes» las capturas históricas originales de sus bloques; no se presentan como una nueva ejecución del bloque 7.

| PNG / superficie | Antes (histórico salvo donde se indica) | Después, nueva ejecución | Diferencias justificadas por contrato |
| --- | --- | --- | --- |
| 01 Mis eventos | [Bloque 1](../r3-block-1/README.md) | [375](my-events-ui/organizing-375x812.png), [1280](my-events-ui/organizing-1280x900.png) | Organizo/Participo, cinco filtros, sin drafts; shell vigente y categoría/fecha completa |
| 02 Editar | [Bloque 2](../r3-block-2/README.md) | [360](edit-event-ui/edit-360x800.png), [1280](edit-event-ui/edit-1280x900.png) | Inicio/fin, dirección/coordenadas exigidas, portada de lectura y gestión separada |
| 03 Galería | [Bloque 3](../r3-block-3/README.md) | [390](gallery-ui/gallery-390.png), [1280](gallery-ui/gallery-1280.png) | Selector/drop, controles Antes/Después, WebP/5 MiB reales y recuperación de subidas |
| 04 Asistentes | [Bloque 4](../r3-block-4/README.md) | [375](attendees-ui/confirmed-375.png), [1280](attendees-ui/confirmed-1280.png) | Username/iniciales, sin correo privado, estados confirmed/removed y enlace solicitudes |
| 05 Solicitudes | [Bloque 6](../r3-block-6/README.md) | [360](rejoin-ui/requests-360.png), [1280](rejoin-ui/requests-1280.png) | Sin motivos/emails; estado pending de solicitud, cupo operativo y rechazo tras cierre permitido |
| 06 Acciones | [antes 360, ejecución de esta PR](before-event-actions/actions-360.png) | [360](event-actions-ui/actions-360.png), [768](event-actions-ui/actions-768.png) | Una categoría, sin favoritos/compartir, archivo en lugar de DELETE, fechas completas |
| 07 Diálogos / estados | [cancelar 360, antes de ajuste](before-event-actions/cancel-dialog-360.png), [remover anterior](../r3-block-4/dialog-360.png) | [cancelar](event-actions-ui/cancel-dialog-360.png), [remover](attendees-ui/dialog-360.png), [aprobar](rejoin-ui/approve-dialog-360.png), [rechazar](rejoin-ui/reject-dialog-360.png), [rechazado](rejoin-ui/rejected-360.png) | Rojo conserva intención visual con contraste ≥4,5:1; consecuencias/historial, fecha elegible, sin promesa de notificaciones automáticas |

## Responsive, foco y límites

R3 se ejecuta en **360×800, 375×812, 390×844, 768×1024 y 1280×900**, zona Asia/Tokyo para detectar dependencia accidental de la zona del navegador. Cada carpeta UI tiene capturas por tamaño y resultados de carga/errores/confirmaciones. Los nombres con `360`, etc. de galería/asistentes/acciones/solicitudes corresponden a los cinco pares indicados; edición y Mis eventos incluyen ancho×alto.

Las suites comprueban overflow horizontal, navegación/orígenes, filtros/paginación, teclado/foco/Escape/cancelación, doble envío, errores y respuestas tardías. Se revisaron visualmente muestras de móvil, tablet y escritorio contra los originales; esa revisión no es aprobación de todas las capturas por el usuario. La barra fija en capturas full-page puede aparecer a la altura del viewport original; no se considera una pantalla de teléfono estática sin scroll. El CSS conserva padding y scroll-padding para navegación/safe-area, pero no se verificó notch ni teclado virtual real.

Se aplicaron las guías locales de diseño/frontend y [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) en la revisión de semántica, etiquetas, foco y scroll. La medición de contraste cubre los dos botones modificados, no certifica accesibilidad integral ni reemplaza lector de pantalla/dispositivo físico. No se rediseña la identidad marino/azul/violeta ni se añaden capacidades ilustrativas fuera de los RF.
