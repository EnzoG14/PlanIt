# Fundación Amanecer — auditoría previa a la extracción

12/10/2026. Base: `origin/main` cb5a249, merge de PR #27. Inspección de código real y CodeGraph antes de modificar CSS. El cambio local de `vite.config.ts` (allowedHosts de desarrollo) se conserva fuera de la entrega.

| Origen | Responsabilidad | Decisión |
| --- | --- | --- |
| `my-events.css`: `--am-*` | Colores, cristal, elevación y easing aprobados | Sustituir consumidores por `--pi-*` centrales; no mantener otra paleta |
| `my-events.css`: adaptadores `--color-*`, `--gradient-primary`, radios | Compatibilidad de componentes existentes dentro del piloto | Conservar bajo `.amanecer-shell`, derivados de `--pi-*` |
| `index.css` | Base oscura, campos, foco y tokens heredados | Conservar; importar tokens sin aplicar nuevo tema global |
| `App.css` | Layout, ScreenHeader, FormField, GradientButton, StatusMessage y dock heredados | Conservar; sobrescrituras explícitas Amanecer en archivo compartido |
| `account-menu.css`, `event-actions.css` | Comportamiento y base visual de menú/dialog | Conservar; mover overrides del piloto al patrón compartido |
| `my-events.css`: Cuenta, botones, dock, feedback, diálogo | Patrones con consumidores existentes y próximos bloques | Extraer sin cambiar valores, especificidad ni interfaces React |
| `my-events.css`: ancho de header/main, mancha, heading, timeline, tabs, filtros, CompactEventCard, menú de evento, breakpoints | Composición específica aprobada del piloto | Mantener local; cambiar sólo referencias de tokens |

`EventCard` de descubrimiento sigue siendo heredado; `CompactEventCard` usa el estilo de gestión del piloto. ScreenHeader y FormField no aparecen en el cuerpo del piloto: preparar estilos opt-in para el siguiente bloque, sin activar en Auth ni formularios. GradientButton conserva API/nombre y degradado en pantallas pendientes; la variante de tinta se activa por shell.

Riesgos: cambiar `:root --color-*` afectaría todas las rutas; mover selectores sin scope afectaría Auth, mapa y chat; sustituir `--color-field` por blanco en el adaptador cambiaría hover heredado del piloto. Se conserva su valor suave y los campos Amanecer reciben blanco mediante regla explícita. Dock necesita revisión de layout por cada ruta futura. Los tamaños particulares del piloto no se normalizan a la escala nominal.

Fuente existente: variable latina normal 200–800, 41.344 bytes, licencia OFL, fallback Segoe UI/system-ui, `swap`; misma URL relativa al mover `@font-face` a `src/styles/`. `woff2` ya está incluido en Workbox. Sin nueva descarga, dependencia ni modificación de manifest.

La base reproducible usa el runner aprobado en salida nueva `baseline/`, fase `after`, seis viewports y los estados existentes. Las capturas históricas de Mis eventos no se sobrescriben. Ninguna extracción permite alterar geometría visible.
