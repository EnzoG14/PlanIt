# Evidencia — UI Refresh bloque 7

13/10/2026. Base **bdba68af06e1462f8250dc6200b8a2009b682cc6**, rama `design/amanecer-block-7-actions`. B · Amanecer v3.0; [informe exclusivo](../../../../implementation/ui-refresh-blocks/BLOCK_7.md) y [crítica/auditoría](IMPECCABLE.md).

## Entorno y alcance

Windows, Node 24.19.0, Vite 8.3.4, Edge headless/Playwright externo. Dependencias y configuración pública ignoradas reutilizadas localmente; sin cambios de package/lock ni dependencias de producto. Worktrees bajo home, cada uno con `.codegraph` inicializada. Base inmutable en 4196, implementación en 4197, lab en 5180.

Auth/REST/Storage y WebSocket interceptados. Fechas del fixture en Argentina, navegador en Asia/Tokyo. PostgreSQL real efímero con scaffold Auth/Storage y replay de migraciones existentes. No escrituras remotas, migraciones aplicadas a Supabase ni E2E JWT real.

## Capturas y resultados

| Carpeta | Contenido |
|---|---|
| `before/actions` | Gestión/confirmaciones base, 390 y 1280 |
| `before/rejoin` | Bandeja/diálogos/estados base, seis anchos contra servidor inmutable |
| `after/actions` | Escenarios funcionales de acciones en seis anchos |
| `after/rejoin` | Escenarios funcionales de reincorporación en seis anchos |
| `visual` | Capturas asentadas: gestión, solicitudes, falta de cupo, cerrado, vacío, error, texto 200 %, baja altura, estados propios y tres diálogos del piloto antes/después |
| `media` | Fuente autoalojada y fallback; transparencia/movimiento reducido emulados |
| `postgres` | Checks específicos de acciones y reincorporación |
| `regressions` | Checks explícitos de participaciones y Mis eventos |
| `r3` | Regresión general, resultados/stdout/stderr de cada check; se omiten PNG duplicadas de pantallas fuera del bloque |
| `lab` | `/b/event` en removido/pendiente/finalizado/organizador y `/b/requests` lista/vacío/cerrado. Referencias ficticias, no contenido de producción |

Viewports: 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900. Texto de identidad sin espacios al 200 %; diálogos a 240 px con scroll interno y acciones alcanzables. El runner simula texto, no zoom nativo. Foco inicial seguro, Tab/Shift+Tab, Escape/retorno, doble clic, bloqueo de controles y resultado incierto están verificados mediante fixtures.

`visual/results.json` registra igualdad de geometría/estilos y comparación de píxeles de los tres diálogos de Mis eventos en cada tamaño. Se exige contenido idéntico; sólo admite y registra variaciones de raster de hasta una unidad en hasta 50 píxeles de la franja exterior de dos píxeles. No tolera diferencias de texto, controles o layout. El primer pase final completo produjo 18/18 PNG idénticos; otro pase observó 13 píxeles con delta 1 en el borde superior de Duplicar a 375 px, sin cambio de geometría. La comparación más reciente es la fuente de resultados definitivos.

## Checks

Resultado final: **todos los comandos solicitados PASS; 28/28 checks R3 PASS; 18/18 diálogos del piloto idénticos en píxeles**. [Resumen verificable](SUMMARY.json). La corrida inicial con dos errores de ruta está en `r3/initial-results.json`; la repetición acotada cerró ambos en PASS sin cambiar esas pantallas. El build conserva el aviso de tamaño del bundle del mapa preexistente.

Build, lint, `check:amanecer`, `check:event-actions`, `check:event-actions:ui`, `check:rejoin`, `check:rejoin:ui`, `check:participations:ui`, `check:my-events:ui`; `check:r3` completo incluye asistentes, galería y chat. Consultar `r3/results.json` para resultados definitivos y reejecuciones acotadas; no inferir que un proceso iniciado ya terminó.

Incidencias resueltas/documentadas: Vite cold-start produjo timeout inicial; el runner de reincorporación tenía output fijo y se añadió `PLANIT_UI_OUTPUT` para preservar histórico; el selector «Salir» se actualizó al menú Cuenta → Cerrar sesión. El check de contraste exigía gradientes ya retirados por bloque 5: ahora comprueba el token sólido vigente y conserva la comprobación de stops heredados. La ruta de Playwright de Galería y chat de otro usuario requiere `PLANIT_PLAYWRIGHT_PATH` explícita. Un timeout transitorio de permiso a 375 se reejecutó tras detener modificaciones; los handlers de autorización no cambiaron. Los archivos históricos regenerados durante la primera corrida se repusieron a sus bytes de base y no forman parte del diff.

## Reproducir

Preparar dependencias y Playwright externo según [UI_WORKFLOW](../../../UI_WORKFLOW.md). Para la comparación del piloto, arrancar un segundo checkout de la base indicada; cada checkout requiere su propio índice. Ejemplo PowerShell:

```powershell
$env:PLANIT_UI_ORIGIN = 'http://127.0.0.1:4197'
$env:PLANIT_BASE_ORIGIN = 'http://127.0.0.1:4196'
$env:PLANIT_PLAYWRIGHT_PATH = '<ruta absoluta a playwright/index.mjs>'
$env:PLANIT_PYTHON_PATH = '<ruta absoluta a python con Pillow>'
$env:PLANIT_UI_OUTPUT = 'docs/design/verification/ui-refresh/otra-verificacion'
node scripts/check-actions-refresh-ui.mjs
npm run check:event-actions:ui
npm run check:rejoin:ui
$env:PLANIT_BASE_SHA = 'bdba68af06e1462f8250dc6200b8a2009b682cc6'
npm run check:r3
```

Cambiar `PLANIT_UI_OUTPUT` por cada runner y no sobrescribir esta evidencia ni las históricas. `--media-only` del runner visual ejecuta sólo fuente/preferencias. Los temporales de R3 se borran por el runner; no versionar deps, env, índices, binarios ni worktrees base.

## Pendientes

Aceptación humana, NVDA/VoiceOver, zoom nativo, dispositivo/PWA/teclado móvil, safe areas y rendimiento de blur/scroll real. El layout y la proximidad del CTA a la barra persistente corresponden a integración de Detalle; no se rediseñó esa página. El posible foco perdido por refresh periódico es previo y se documenta aparte. El STATUS central, tokens normativos, servicios, SQL y permisos no cambiaron.
