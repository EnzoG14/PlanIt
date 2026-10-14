# R4 B9 · Auditoría técnica y revisión Amanecer

14/10/2026. Alcance: Inicio/Mapa, Mis intereses, invitación y accesos, con regresiones de Auth/Perfil y gestión. Modo Operate. Referencia normativa DESIGN.md → DESIGN_SYSTEM.md → componentes actuales; collage R4 sólo inventario histórico. No se regeneraron DESIGN, sidecar, tokens ni sistema.

## Evidencia y método

Se ejecutó `impeccable context --target src/pages/HomePage.tsx` (skill 4.5.2), se leyeron audit/harden/polish y se corrió el detector sobre seis superficies R4: [0 findings](impeccable-detect.json). La revisión técnica usa geometría, interacción y capturas de Edge con datos ficticios, no aprobación humana ni certificación WCAG. No se ejecutó critique formal de dos evaluaciones independientes; esta auditoría no se presenta como ese workflow.

La base de UI es el build de `090fbab`, copiado antes de corregir foco en un directorio local inmutable. Las primeras capturas están en `supplemental-ui/`; la confirmación final se identifica por `check-r4-ui/results.json`. Capturas de Inicio móvil/escritorio, Mapa fallido y diálogo en 320×400 se inspeccionaron visualmente. Los siete tamaños son 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900 y 320×400.

## Resultado técnico acotado

| Dimensión | Evaluación | Evidencia / límite |
| --- | --- | --- |
| Accesibilidad | 3/4 | Labels, estados con texto, foco violeta 3px, Escape/retorno, confirmación alcanzable con scroll. Pendientes lector de pantalla y zoom nativo |
| Rendimiento | 3/4 | Dataset local 5000 eventos, EXPLAIN y tiempos; content-visibility en tarjetas. Chunk Mapbox y rendimiento físico pendientes |
| Sistema visual | 4/4 en muestras | Fondo claro, tinta, filtros azules, Bricolage local, tokens y scopes existentes. Sin tema oscuro requerido |
| Responsive | 3/4 | Siete viewports y texto ampliado CSS sin overflow; gestos/safe areas físicas no verificadas |
| Integridad | 3/4 | Detector sin hallazgos; navegación real y estado recuperable. Fixtures no acreditan backend remoto |

**16/20, evaluación limitada a muestras e instrumentos indicados.** El score no permite cerrar R4 ni acredita accesibilidad global.

## Hallazgo y ajuste

**P2 corregido:** volver desde Mis intereses podía dejar el foco en main porque el efecto de AppLayout corría después de ProfilePage. La restitución al enlace se agenda en requestAnimationFrame y se cancela al desmontar. Se conserva apariencia, contenido, scopes, dock y contratos. El caso reproducible está en `check:interests:ui`; también se reejecuta Perfil.

Los ajustes de runners distinguen medición de producto: altura CSS44 con precisión centesimal de Chromium, color computado con cuantización de alpha del minificador, y espera del foco antes de leer estilos. No se modificaron tamaños ni colores para hacer pasar pruebas.

## Composición y estados

- Inicio mantiene Para vos independiente de filtros; texto/categorías antes de fecha/radio. El vacío explica ausencia de coincidencias y el error conserva recuperación.
- Mapa conserva proveedor, centro inicial Buenos Aires rotulado, preview y lista útil ante fallo. `content-visibility:auto` puede dejar tarjetas fuera del viewport sin pintar en una captura full-page; las capturas `map-result-visible-*` comprueban el resultado tras scroll, sin alterar CSS para capturarlo.
- Invitación perdida pide reabrir el original o regenerar según dueño; no promete recuperar tokens. Accesos conserva permiso y participación como estados separados, y avisa remoción antes de revocar.
- El diálogo de poca altura permite scroll hasta Revocar; Cancelar tiene foco inicial, Escape lo cierra y el foco vuelve al disparador.

## Límites

Auth/REST/Storage interceptados y Realtime bloqueado/simulado según suite. PWA usa Service Worker real local, con Auth simulado; no es instalación física. Texto aumentado por CSS no es zoom nativo. Transparencia/movimiento reducidos y fallback de fuente se verifican por emulación y suites Auth, no con preferencias físicas.

`impeccable context` detectó sidecar anterior a DESIGN. Se conserva por el contrato explícito del bloque; su eventual actualización requiere pedido separado. La reducción global heredada de transiciones .01ms se conserva conforme las reglas Amanecer del proyecto. No se añadieron flujos, branding ni controles de futuras releases.
