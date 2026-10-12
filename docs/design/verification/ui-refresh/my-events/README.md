# Mis eventos — piloto UI Refresh (realineado a Amanecer)

> **Actualización posterior a la entrega — 12/10/2026:** PR #27 fusionada en `main` (cb5a249). El registro siguiente conserva los resultados y límites de aquella revisión. El bloque 0.5 centraliza su fundación sin rediseñar el piloto; [nueva evidencia](../amanecer-foundation/README.md). La fusión no acredita pruebas humanas no realizadas.

12/10/2026. Rama `design/ui-refresh-my-events` ([PR draft #27](https://github.com/EnzoG14/PlanIt/pull/27)). Implementación lista para revisión; la aceptación visual y funcional humana sigue pendiente. No cambia las releases funcionales ni el backend.

El piloto se había implementado en marino v2.0 y la dirección vigente pasó a **B · Amanecer** ([DESIGN.md](../../../../../DESIGN.md), [decisión](../../../proposals/amanecer-direction.md)). Esta versión realinea la capa visual de la pantalla. Se conservan tres juegos de capturas:

| Carpeta | Contenido |
| --- | --- |
| [`before/`](before/) | Diseño original, antes del refresh (evidencia histórica) |
| [`v2-marino/`](v2-marino/) | Primer piloto marino v2.0, reemplazado (evidencia histórica, antes `after/`) |
| [`after/`](after/) | **Piloto Amanecer** (vigente) |

## Comparación (organizando, primera fila de evento)

| Vista | Antes | Marino v2.0 | Amanecer | Primera fila (px) |
| --- | --- | --- | --- | --- |
| 320 × 800 | [captura](before/organizing-320x800.png) | [captura](v2-marino/organizing-320x800.png) | [captura](after/organizing-320x800.png) | 478 → 379 → 425 |
| 360 × 800 | [captura](before/organizing-360x800.png) | [captura](v2-marino/organizing-360x800.png) | [captura](after/organizing-360x800.png) | 478 → 379 → 427 |
| 375 × 812 | [captura](before/organizing-375x812.png) | [captura](v2-marino/organizing-375x812.png) | [captura](after/organizing-375x812.png) | 478 → 379 → 429 |
| 390 × 844 | [captura](before/organizing-390x844.png) | [captura](v2-marino/organizing-390x844.png) | [captura](after/organizing-390x844.png) | 478 → 379 → 430 |
| 768 × 1024 | [captura](before/organizing-768x1024.png) | [captura](v2-marino/organizing-768x1024.png) | [captura](after/organizing-768x1024.png) | 429 → 343 → 399 |
| 1280 × 900 | [captura](before/organizing-1280x900.png) | [captura](v2-marino/organizing-1280x900.png) | [captura](after/organizing-1280x900.png) | 429 → 343 → 399 |

Las posiciones salen de los `measurements.json`. **Amanecer baja la primera fila ~50 px respecto de v2.0** (titular de 38 px, selector de vidrio de 58 px, día en la línea de tiempo); sigue ~50 px por encima del diseño original. Es consecuencia del diseño aprobado (aireado y tipográfico), no un ajuste de accesibilidad. Las capturas son de la app real en Edge Chromium headless con Auth/REST/Storage interceptados; identidades, eventos y la portada geométrica son fixtures, no fotografías reales. Zona del navegador Asia/Tokyo para detectar dependencia accidental del horario del equipo. No hay escrituras remotas.

## Qué cambió

**Diseño aprobado (DESIGN.md):**
- Modo claro `#f6f5fd`, tinta marina para la acción (Crear, segmento activo, dock), azul sólo en el filtro seleccionado, violeta-deep para horas y foco. Una mancha difusa superior (pseudo-elemento, fuera del árbol de accesibilidad, sin animación). Sin gradientes en botones, chips ni tarjetas.
- Bricolage Grotesque **autoalojada** (`src/assets/fonts/`, subconjunto latino variable, licencia OFL incluida; no se agregó paquete npm; se añadió `woff2` al precache de la PWA).
- Titular de 38 px con tracking negativo; segmento Organizo/Participo de vidrio con selección de tinta; filtros en píldoras de vidrio de 44 px.
- Línea de tiempo: encabezado de día («Hoy · …», «Mañana · …»), hora a la izquierda, fila-tarjeta de 26 px con barra de estado de 4 px, miniatura de 52 px, menú de 44 px y pie con estado en texto + categoría pasiva. Se eliminó la línea de fecha duplicada y la píldora de categoría sobre el título.
- Dock flotante de tinta: sólo la pestaña activa muestra etiqueta; las demás conservan nombre accesible y `aria-current`.
- Menú Cuenta, menú de acciones y diálogo de confirmación en blanco sobre velo marino; el destructivo usa rojo sólido sin degradado.
- Cristal con respaldo opaco (`prefers-reduced-transparency` y sin `backdrop-filter`); entrada escalonada de 600 ms desactivada con `prefers-reduced-motion`.

**Ajustes por accesibilidad / plataforma (no son parte del lab):**
- Filtros sin seleccionar llevan borde `control-border` `#7a82a8` (≥ 3:1) para delimitar el control; el lab usa sólo un borde blanco.
- Crear pasa a botón redondo de sólo icono por debajo de 400 px (nombre accesible «Crear evento») para no partir el titular; los filtros se envuelven en filas en lugar de scroll horizontal oculto.
- Hora, menú y estado se mantienen ≥ 13,5 px; la columna de hora crece con el texto ampliado.
- Texto largo: título 3 líneas y lugar 2 con contenido íntegro en el DOM y en el detalle (sin cambios).

**Omitido deliberadamente:** contadores por rol y «cupo» del lab (no existen en el contrato de `get_my_events`/`get_my_organized_events`; no se inventan métricas).

## Alcance y archivos

Estilos acotados a `.my-events-shell` / `.my-events-page`, que remapean los tokens `--color-*` heredados sólo en esta ruta; otras pantallas (incluido el detalle, visible en las capturas de acciones) conservan su apariencia. Archivos: `src/pages/MyEventsPage.tsx`, `src/pages/my-events.css`, `src/components/EventCard.tsx` (`CompactEventCard`), `src/features/events/my-events.ts` (sólo formato por día), `vite.config.ts` (precache de `woff2`), `src/assets/fonts/`, y el runner `scripts/check-my-events-refresh-ui.mjs` (añade diálogo y foco de retorno). Sin dependencias nuevas, SQL, RPC, RLS ni migraciones.

## Pruebas

| Comando | Resultado y alcance |
| --- | --- |
| `npm run build` | PASS; conserva el aviso del chunk de Mapbox, fuera del bloque |
| `npm run lint` | Exit 0; los warnings provienen de binarios locales de Impeccable bajo `.agents`/`.claude`, ajenos a la entrega |
| `npx oxlint src scripts` | PASS sin diagnósticos |
| `npm run check:my-events` | PASS, seis grupos sobre PostgreSQL efímero local; replay de migraciones sólo en esa BD |
| `PLANIT_UI_OUTPUT=… npm run check:my-events:ui` | PASS a 375 × 812 y 1280 × 900; [resultados](regression-list/ui-results.json) |
| `PLANIT_UI_ORIGIN=… PLANIT_UI_OUTPUT=… npm run check:event-actions:ui` | PASS a 360/375/390/768/1280 px; [resultados](regression-actions/ui-results.json) |
| `node scripts/check-my-events-refresh-ui.mjs after` | PASS; 48 capturas, sin overflow horizontal, targets ≥ 44 px, menú sin recorte (incluso a 360 px de alto), diálogo dentro del viewport y foco devuelto al disparador, Cuenta/logout con respuesta rechazada y exitosa |

Las regresiones comprueban filtros previos a la paginación, precedencia de estados, historia archivada, regreso contextual, respuestas tardías, carga adicional/reintento, Storage y permisos. Los recorridos de UI interceptan las escrituras: no son E2E remotos. Las capturas `fullPage` muestran el dock fijo en su posición visible, a mitad de página.

## Impeccable y límites

- Se leyeron DESIGN.md, DESIGN_SYSTEM, la decisión Amanecer, el lab (`/b`) y la auditoría. **No se ejecutaron `critique`, `polish`, `harden` ni `audit` de Impeccable ni Live Mode sobre esta versión**: la revisión fue manual sobre capturas reales y mediciones. El [critique](critique.md) y el [audit](audit.md) existentes evalúan la versión marino v2.0 y se conservan como historia.
- Contraste calculado, no medido con herramienta: texto apagado sobre vidrio en el peor caso de la mancha ≈ 5,0:1; el resto usa los pares del DESIGN.md.
- No probado: lector de pantalla (incluido el dock con iconos inactivos), zoom nativo, teclado móvil y safe areas en dispositivos físicos, rendimiento del desenfoque en móviles de gama baja, fotografías reales claras/oscuras, carga de la fuente en red lenta (FOUT con `swap`) y E2E remoto. El texto ampliado es una duplicación de tamaños computados, no zoom nativo.

## Decisiones que requieren aprobación

1. El dock y el header de Amanecer sólo existen en esta ruta; al navegar a otra pantalla vuelve el marino v2.0 hasta la Fundación (bloque 0.5). Es la consecuencia de no cambiar otras pantallas sin aprobación.
2. `<meta name="theme-color">` y el manifest siguen en `#060b27` (global).
3. Borde de control en filtros sin seleccionar y Crear redondo bajo 400 px (ver arriba).
4. Primera fila ~50 px más baja que en v2.0 (ver comparación).
