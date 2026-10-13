# UI Refresh · Bloque 5 · Evidencia

12/10/2026 · Amanecer v3.0 · base `da90d985865d9c9f681bbda0e011fa484d39040e`.

Informe y límites: [BLOCK_5.md](../../../../implementation/ui-refresh-blocks/BLOCK_5.md). Toda captura usa datos/ilustraciones ficticios y Edge headless; no acredita backend remoto ni aceptación humana.

## Lectura

- `before/gallery` y `before/attendees`: SHA base en checkout independiente, seis tamaños.
- `after/gallery` y `after/attendees`: implementación final, mismos datos, tamaños y navegador.
- `geometry-<width>.json`: controles, fuente, foco, texto duplicado, media preferences y alcanzabilidad fuera del dock.
- `ui-results.json`: checks funcionales interceptados de cada runner.
- `checks/gallery/postgres-results.json` y `checks/attendees/postgres-results.json`: PostgreSQL efímero local.
- `checks/my-events`: regresión de la pantalla piloto.
- `checks/*.txt`: comandos/frontend y salidas de runners finales.
- `impeccable-results.json`: síntesis de evaluaciones independientes y detector CLI.

| Superficie | Móvil | Escritorio | Estados |
| --- | --- | --- | --- |
| Galería | [320](after/gallery/gallery-320.png) | [1280](after/gallery/gallery-1280.png) | [vacío](after/gallery/empty-320.png), [una](after/gallery/one-320.png), [diez](after/gallery/ten-320.png), [archivo inválido](after/gallery/invalid-320.png), [fallo](after/gallery/upload-failure-390.png), [confirmación](after/gallery/confirm-320.png), [acceso a carga](after/gallery/upload-shortcut-320.png) |
| Asistentes | [320](after/attendees/confirmed-320.png) | [1280](after/attendees/confirmed-1280.png) | [removidos](after/attendees/removed-320.png), [vacío](after/attendees/empty-320.png), [sin resultados](after/attendees/search-empty-320.png), [identidad extensa](after/attendees/long-identity-320.png), [sin permiso](after/attendees/denied-320.png), [confirmación](after/attendees/dialog-320.png) |

Todos esos escenarios tienen variantes a 320/360/375/390/768/1280 px. Las capturas de `text-200` amplían texto en DOM, no zoom nativo. `dialog-short` muestra los botones después de desplazarse dentro del diálogo. La posición del dock en capturas completas no demuestra un control bloqueado; el audit prueba el hit-test de los controles después de desplazarlos.

## Reproducción

Seguir UI_WORKFLOW.md para Node/npm/Edge y Playwright externos. Los runners conservan sus salidas históricas por defecto; definir siempre una carpeta nueva para evitar sobrescribir evidencia aprobada.

```powershell
$env:PLANIT_PLAYWRIGHT_PATH = 'ruta/absoluta/playwright/index.mjs'
$env:PLANIT_UI_ORIGIN = 'http://127.0.0.1:4187'
$env:PLANIT_UI_NO_PROXY = '1' # sólo si el proxy local impide Edge/localhost
$env:PLANIT_MANAGEMENT_AUDIT = '1' # sólo para la implementación Amanecer
$env:PLANIT_UI_OUTPUT = 'docs/design/verification/ui-refresh/nueva-ejecucion/gallery'
npm run check:gallery:ui
$env:PLANIT_UI_OUTPUT = 'docs/design/verification/ui-refresh/nueva-ejecucion/attendees'
npm run check:attendees:ui
```

Para una base heredada omitir `PLANIT_MANAGEMENT_AUDIT`. Las configuraciones locales de esta ejecución sólo contienen valores ficticios; las peticiones REST/Auth/Storage se interceptan y Realtime se bloquea. El watcher de CodeGraph usa índices propios en cada checkout.
