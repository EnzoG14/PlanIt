# PlanIt — Referencias de diseño y refresh R1–R3

La dirección visual aprobada es **B · Amanecer** (12/10/2026): modo claro, tinta marina, mancha difusa, cristal suave y Bricolage Grotesque. El sistema describe el objetivo; la PWA todavía no está migrada (el código y el piloto Mis eventos conservan el marino oscuro v2.0). No redefine requisitos ni el modelo de datos.

## Referencias vigentes

1. [PRODUCT.md](../../PRODUCT.md): contexto y principios de producto, cuando exista.
2. [DESIGN.md](../../DESIGN.md): tokens y patrones aprobados.
3. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): aplicación y criterios de aceptación.
4. [Decisión de dirección Amanecer](proposals/amanecer-direction.md): por qué B, qué cambió respecto de v2.0 y qué elementos del lab requieren decisión funcional.
5. Componentes y patrones aprobados; el prototipo [design-lab](../../design-lab/README.md) (`/b`) muestra composición y estados con datos ficticios.
6. [Shape R1–R3](proposals/r1-r3-visual-evolution.md) (jerarquía por pantalla; su apariencia marina está reemplazada) y [mockups e inventario](SCREENS.md): contexto histórico, sin obligación pixel-perfect.

[AGENTS.md](AGENTS.md) y [src/AGENTS.md](../../src/AGENTS.md) gobiernan el trabajo. RF/CA, especificación técnica, decisiones de negocio y contratos de datos determinan la funcionalidad y autorizaciones.

## Evidencia y seguimiento

- [Consolidación de auditorías](audits/UI_REFRESH_R1_R3.md), con alcance y límites de evidencia.
- [Critique original](audits/2026-10-12-impeccable-critique.md) y [audit técnico original](audits/2026-10-12-interface.md), conservados como evidencia histórica.
- [Plan visual](../implementation/UI_REFRESH_R1_R3_PLAN.md) y [estado visual](../implementation/UI_REFRESH_R1_R3_STATUS.md), independientes de las releases funcionales.
- [Capturas del audit](verification/interface-audit-2026-10-12/) y [QA posterior de R3](verification/r3-block-7/README.md).
- [Brechas mockup–contrato](DESIGN_GAPS.md): restricciones funcionales que siguen aplicando.

## Uso

Consultar el sistema y shape antes de modificar UI. Usar Impeccable cuando esté disponible, sin regenerar documentos ni cambiar decisiones aprobadas. Reutilizar componentes, conservar comportamiento y verificar con capturas reales de móvil/escritorio. Los casos no probados deben quedar explícitos.

Los prompts anteriores bajo prompts/ y los collages R1–R7 son históricos: cualquier instrucción de reproducir degradados, brillos, fondo oscuro o apariencia original queda subordinada a DESIGN.md. Las auditorías y verificaciones anteriores son evidencia del estado previo; no se reescriben. No regenerar DESIGN.md ni su sidecar sin pedido del usuario. No agregar funciones por su presencia en un collage ni extraer sus fotografías como contenido real.

La siguiente etapa propuesta es la **Fundación Amanecer** (tokens globales, fuente, componentes compartidos y realineación del piloto Mis eventos); requiere un pedido de implementación. Actualizar estos documentos no migra ninguna pantalla.
