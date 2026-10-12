# Bloque 0.5 — Fundación Amanecer

12/10/2026. Base de comparación `main` cb5a249 (PR #27 fusionada). Sin rediseño de Mis eventos, nuevas pantallas, SQL, Auth ni escrituras remotas. [Auditoría previa](implementation-audit.md), [workflow](../../../UI_WORKFLOW.md), [revisión Impeccable](review.md).

## Implementación

- `src/styles/tokens.css`: 83 propiedades normativas de colores/radios/espacios/tipografía y familia común, más sombras, cristal, foco y movimiento aprobados en DESIGN.md. Los refinamientos existentes del piloto (divisor dashed, sombra de menú, fallback .96/.97) se identifican aparte.
- `src/styles/amanecer.css`: patrones compartidos opt-in `.amanecer-shell`. Scope base `.app-shell.amanecer-shell` conserva prioridad frente al fondo heredado; ningún cambio de tema global. Mis eventos usa `--pi-*` directamente y mantiene geometría/composición local.
- Eliminadas las declaraciones locales `--am-*`, `@font-face` duplicable y overrides compartidos desde `my-events.css`. Adaptadores `--color-*`, `--gradient-primary` y radios conservados en scope, derivados del centro. Estilos oscuros globales continúan hasta migrar consumidores.
- Preparados AppLayout/dock, GradientButton y secundarios, StatusMessage, Cuenta y diálogo; campo blanco/foco/error y ScreenHeader opt-in para bloques 2/3. EventCard de descubrimiento sigue heredado; chips/tabs/filtros tienen valores comunes y composición local, sin nueva abstracción React ni API modificada.

## Capturas y comparación

`baseline/`: misma app/fixtures con los cuatro archivos visuales de main cb5a249. `after/`: extracción final. Ambas usan el runner aprobado, fase after, seis tamaños, Edge Chromium, zona Asia/Tokyo y reduced-motion. Se espera fuente y dos frames antes de medir; los cuatro archivos se restauraron en finally tras capturar base. Las capturas históricas [my-events/after](../my-events/after/) no se sobrescribieron.

72 PNG por pasada: 48 estados medidos más Cuenta, loading, diálogo y salida de sesión. [Comparación](pilot-comparison.json), [mediciones base](baseline/measurements.json) y [finales](after/measurements.json). Viewports: 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900.

| Regresión heredada | Evidencia nueva |
| --- | --- |
| Inicio y Detalle | `baseline-home/`, `regression-home/` |
| Mapa/descubrimiento | `baseline-map/`, `regression-map/` |
| Chat | `baseline-chat/`, `regression-chat/` |
| Login/Registro | `regression-auth/`: sin sesión, solicitudes externas bloqueadas; campos, CTA, foco y fuente heredados |
| Lista y acciones | `regression-list/`, `regression-actions/` |

El fixture temporal de Auth para validar FormField/ScreenHeader/botón añade y retira scope sólo en el DOM del test; las capturas y rutas de producción permanecen heredadas. No es implementación de Login/Registro Amanecer.

## Checks ejecutados

| Check | Resultado |
| --- | --- |
| `npm run build` | PASS; aviso de chunk Mapbox existente; fuente de 41,34 kB incluida en precache |
| `npm run lint` | PASS, exit 0 |
| `npm run check:amanecer` | PASS: 83 valores normativos, familia y todas las referencias `--pi-*` del piloto/patrones |
| `npm run check:my-events` | PASS, seis grupos, PostgreSQL efímero local |
| `npm run check:my-events:ui` | PASS, 375 y 1280 px, filtros/paginación/permisos/reintentos/retorno |
| `npm run check:event-actions:ui` | PASS, 360/375/390/768/1280, foco, resultado incierto, rechazo y confirmación |
| `node scripts/check-my-events-refresh-ui.mjs after` | PASS: seis tamaños, 48 estados medidos y 72 PNG |
| `npm run check:amanecer:auth:ui` | PASS, 320/390/1280; preservación heredada y variantes DOM aisladas de campo/ScreenHeader/botón |
| `npm run check:home:ui` | PASS, Inicio/Detalle y estados/errores/revalidación |
| `npm run check:discovery:ui` | PASS, motor Mapbox simulado, canvas, teclado, pan/zoom, errores y lista |
| `npm run check:chat:layout` | PASS, 360/375/390/1280, composer, scroll, paginación, Realtime interceptado y viewport de teclado emulado |
| `npm run check:auth` | PASS, validación y retornos seguros; sin flags live/signup |
| `npm run check:foundation` | PASS, configuración pública, manifest/iconos/precache |
| `npm run check:home-events` | PASS, PostgreSQL efímero; primer intento sandbox EACCES, repetido fuera del sandbox |
| `npm run check:discovery` | PASS, SQL local y filtros/permisos |

Los runners visuales requirieron ejecución fuera del sandbox para Edge/localhost. Ninguna prueba remota. El runner de Inicio recibió salida configurable para conservar evidencia histórica; el JSON generado en su destino anterior se restauró a los bytes de HEAD y el resultado actual se guardó aquí.

## Diferencias, límites y siguiente bloque

La primera extracción introdujo fondo radial oscuro por cascada; se corrigió antes de la entrega. **Las seis capturas de Organizo coinciden píxel a píxel tanto con main como con las históricas aprobadas** ([comparación histórica](historical-comparison.json)). Los 48 estados medidos coinciden en geometría y en las 13 propiedades de estilo computado de todos los elementos inspeccionados ([estilos](computed-comparison.json), [geometría](geometry-comparison.json): ambos `[]`). `scripts/compare-amanecer-captures.py` verifica esas equivalencias con Python/Pillow, sin dependencia de producto.

De 96 pares PNG (piloto más regresiones heredadas), 83 son idénticos. Los 13 restantes están localizados en estados dinámicos: hover de Cuenta (Participo), hover/foco de filtros y Actualizar (vacío/error/texto aumentado), posicionamiento/scroll interno del menú a poca altura durante screenshot fullPage y una tarjeta del mapa con estado de hover. Se conservaron las capturas distintas, sin sustituirlas por imágenes editadas. Las mediciones tomadas antes del screenshot coinciden; no se presentan todas las capturas dinámicas como idénticas. El fullPage amplía temporalmente la altura capturada y puede reposicionar menús/foco/hover; comparar también mediciones y capturas visibles. No hubo cambio de composición aceptado por extraer patrones.

Se corrigió el runner para esperar fuente, dos frames y networkidle: la revalidación podía remontar nodos después de duplicar tamaños y producir mediciones de texto distintas entre pasadas. Los intentos intermedios fallidos (cascada, readiness y campo mal identificado del fixture Auth) se corrigieron; los resultados de esta carpeta son la ejecución final. El fixture de variantes identifica Email también en Registro; Chromium a DPR 1 redondea el borde declarado de 1,5 px a un píxel físico.

Deudas preexistentes observadas: tabs solapadas y título fragmentado con texto al 200 % a 320 px; dos usos de “Cancelar” en diálogo; descubribilidad de iconos sin etiqueta visible (patrón aprobado). Se mantienen por la restricción de preservación; `overflow:false` no acredita ausencia de solapamientos internos. El logout rechazado lleva a Login porque el SDK elimina sesión local: la captura no representa un aviso de error dentro de Mis eventos.

No ejercitados: lector de pantalla, zoom nativo, teclado móvil físico, safe areas físicas, rendimiento del blur en gama baja, fuente bajo red lenta y uso offline en PWA instalada, fotografías reales y E2E remoto. Transparencia reducida y ausencia de backdrop-filter conservan las reglas existentes; no equivalen a pruebas en todos los navegadores. Theme-color/manifest siguen marinos por migración gradual.

El siguiente bloque autorizado podrá migrar Login/Registro usando esta fundación. Esta entrega se detiene en la PR draft.

Limpieza: Vite de QA detenido, tabs de Assessment B cerradas; scripts temporales de comparación eliminados y fuentes restauradas. El cambio local de `vite.config.ts` permanece fuera del commit. Sin cachés, credenciales ni consentimientos de hooks en la entrega.
