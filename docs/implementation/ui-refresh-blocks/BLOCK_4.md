# Bloque 4 — Inicio, Mapa y Detalle · Amanecer v3.0

12/10/2026. Rama `design/amanecer-block-4-discovery`; base `origin/main` **123962f63cf7048495652031081f2d143d027685** (incluye PR #28 fundación y #29 autenticación). Worktree separado bajo el home, con índice CodeGraph propio. Se conservó el cambio local ajeno de `D:/planit/vite.config.ts`. No se encontró PR previa del bloque al iniciar.

## Implementación

- Scope `amanecer-shell discovery-shell` sólo en `/home`, `/map` y `/events/:id`, excluyendo `/events/new`. Se reutilizan patrones y fuente autoalojada de la fundación; tokens y CSS Amanecer globales sin cambios.
- Inicio conserva consultas, categoría y paginación. Tarjetas con una apertura amplia, foto lateral natural cuando está disponible, fallback compacto ante ausencia/error. Fecha/hora, categoría y ubicación existentes. El contrato de discovery no devuelve cupo: no se inventa disponibilidad ni se agrega consulta por tarjeta.
- Mapa conserva proveedor Mapbox Standard, bounds, geolocalización, controles, debounce, consultas y marcadores. Preset `day` reemplaza `night`. Marcadores azul/violeta con anillo de tinta, selección también por forma/aria-pressed, foco violeta, atribución legible y controles ≥44px. Fallo compacta canvas a 180px y mantiene aviso/lista.
- El seleccionado se muestra una vez en vista previa y vuelve a la lista al cerrarla. Selección desde lista transfiere foco al enlace de vista previa; cierre devuelve foco a su botón. Selección desde marcador conserva ese origen para el cierre. `returnTo=/map` explícito mantiene navegación contextual.
- Detalle conserva datos, acceso, galería, organizador, inicio/fin y horarios Argentina. Portada 300px (220px móvil estrecho) o mensaje compacto sin foto. Descripción legible con saltos de línea. Acción de participación fija a 98px + safe area sobre el dock existente, con reserva inferior de 220px y scroll-padding para foco. Feedback, acceso a chat y gestión permanecen en flujo.
- **EventParticipation y EventManagement no modificados**. CompactEventCard/Mis eventos no modificados; contratos, backend, Supabase, migraciones y reglas de negocio sin cambios.

## Diferencias deliberadas frente al lab

Sin buscador, filtros, favoritos, tira semanal ni tarjetas rápidas. Se conserva agrupación vigente en Inicio y la navegación global existente. Mapa en flujo, con lista responsive y preview separada, para mantener atribución y recuperación alcanzables; no se copia el mapa dibujado ni sus fixtures. Detalle conserva dock más botón persistente, en lugar de eliminar navegación global. En detalle ninguna pestaña del dock está activa: el retorno contextual identifica el origen. No se introducen métricas de cupo en listados ni contenido ilustrativo al runtime.

## Verificación

Evidencia y reproducción: [README del bloque](../../design/verification/ui-refresh/block-4-discovery/README.md). Capturas antes/después: seis anchos 320/360/375/390/768/1280; 120 baseline y 126 final. Edge/Playwright con Auth/REST/Storage interceptados. Matriz: Inicio con datos/vacío/error/carga; mapa con marcador/selección/fallo; detalle sin imagen, imagen clara/oscura/fallida, completo, confirmado, removido, organizador, finalizado/cancelado/archivado, descripción extensa y altura360. Sin overflow horizontal en las capturas finales. Fuente/layout esperados antes de capturar. Texto ampliado es stress CSS, no zoom nativo.

PASS: `npm run build`, `npm run lint`, `npm run check:amanecer`, `npm run check:home-events`, `npm run check:home:ui`, `npm run check:discovery`, `npm run check:discovery:ui`, `npm run check:mapbox`, `npm run check:participations:ui`, `npm run check:my-events:ui`, `npm run check:event-actions:ui`. SQL de los checks únicamente en bases locales efímeras; ninguna migración remota. Runners existentes conservados, ajustando sólo enlace único/preview y salida separada de participación. La nueva regresión de discovery comprueba foco de selección/cierre además del canvas estable, pan/zoom, geolocalización, límites, recuperación y desmontaje.

Impeccable: crítica independiente con dos subagentes autorizados; detector 0 findings; polish/harden corrigieron foco, mapa fallido, portada móvil y atribución. [Informe](../../design/verification/ui-refresh/block-4-discovery/IMPECCABLE.md).

## Mapbox y pendientes

Servicio Mapbox real consultado en un montaje aislado del mismo EventMap, sin Auth ni consultas Supabase: calles/etiquetas claras en 390/1280, marcador normal/seleccionado distinguible, controles y atribución presentes, 0 respuestas HTTP fallidas observadas. Capturas en `real-mapbox/`. No equivale a E2E con datos reales ni perfilado físico.

Build: módulo Mapbox 518,63kB gzip; precache 2619,10KiB; advertencia de chunk grande conservada. No se cambian proveedor, clustering o carga por motivos decorativos. Falta medir rendimiento/red limitada, WebGL físico y gestos en teléfonos.

Pendientes antes de aceptación: teclado iOS/Android real, safe areas y gestos físicos, lector de pantalla, zoom nativo/fallback de fuente, y fotografías naturales autorizadas claras/oscuras (los fixtures de medios son bloques geométricos, nunca fotos de eventos reales). Reduced motion/transparency reutiliza fundación; se verifican por separado en QA suplementaria. La emulación y detector no certifican WCAG ni aceptación humana.

## Integración

No se actualiza STATUS compartido. CSS nuevo queda bajo discovery-shell; consumidores compartidos mantienen interfaces. Bloque 7 puede migrar gestión/reincorporaciones sin depender de este bloque. Mantener espacio de la acción inferior al integrar cambios de navegación; contrastar AppLayout/EventCard y CSS con main actualizado y repetir regresiones antes del merge. PR draft; no fusionar.

## Pedido adicional: header y movimiento compartidos

El usuario solicitó compartir la entrada del piloto y el header entre pantallas; confirmó conservar los encabezados especiales de Auth y Chat. Se centralizan los estilos del header principal y la animación por bloques, con protección de acciones fijas, diálogos y reduced motion. Mis eventos reutiliza la misma definición; Cuenta reemplaza Mi perfil/Salir en los otros headers. [Evidencia y reproducción](../../design/verification/ui-refresh/block-4-discovery/header-motion/README.md).
