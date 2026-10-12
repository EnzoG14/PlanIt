# PlanIt — Referencias de diseño y refresh R1–R3

El sistema aprobado describe el objetivo visual; la PWA todavía no está migrada. La Foundation conserva las decisiones de Impeccable y prepara instrucciones y seguimiento independiente. No redefine requisitos ni el modelo de datos.

## Referencias vigentes

1. [PRODUCT.md](../../PRODUCT.md): contexto y principios de producto, cuando exista.
2. [DESIGN.md](../../DESIGN.md): tokens y patrones aprobados.
3. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): aplicación y criterios de aceptación.
4. Componentes y patrones aprobados; el [shape R1–R3](proposals/r1-r3-visual-evolution.md) detalla la composición.
5. [Mockups e inventario](SCREENS.md): contexto histórico, sin obligación pixel-perfect.

[AGENTS.md](AGENTS.md) y [src/AGENTS.md](../../src/AGENTS.md) gobiernan el trabajo. RF/CA, especificación técnica, decisiones de negocio y contratos de datos determinan la funcionalidad y autorizaciones.

## Evidencia y seguimiento

- [Consolidación de auditorías](audits/UI_REFRESH_R1_R3.md), con alcance y límites de evidencia.
- [Critique original](audits/2026-10-12-impeccable-critique.md) y [audit técnico original](audits/2026-10-12-interface.md), conservados como evidencia histórica.
- [Plan visual](../implementation/UI_REFRESH_R1_R3_PLAN.md) y [estado visual](../implementation/UI_REFRESH_R1_R3_STATUS.md), independientes de las releases funcionales.
- [Capturas del audit](verification/interface-audit-2026-10-12/) y [QA posterior de R3](verification/r3-block-7/README.md).
- [Brechas mockup–contrato](DESIGN_GAPS.md): restricciones funcionales que siguen aplicando.

## Uso

Consultar el sistema y shape antes de modificar UI. Usar Impeccable cuando esté disponible, sin regenerar documentos ni cambiar decisiones aprobadas. Reutilizar componentes, conservar comportamiento y verificar con capturas reales de móvil/escritorio. Los casos no probados deben quedar explícitos.

Los prompts anteriores bajo prompts/ y los collages R1–R7 son históricos: cualquier instrucción de reproducir degradados, brillos o apariencia original queda subordinada a DESIGN.md. No repetir init/document/critique/audit/shape de Foundation. No agregar funciones por su presencia en un collage ni extraer sus fotografías como contenido real.

La siguiente etapa propuesta es Mis eventos; sigue pendiente y requiere un pedido de implementación. Esta tarea finaliza con la PR documental Foundation.
