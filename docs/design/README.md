# PlanIt — Contrato de diseño para agentes

Esta carpeta contiene referencias **visuales** del diseño original de PlanIt y prompts para guiar a Codex durante la implementación de la nueva PWA. **No** redefine los requisitos ni el modelo de datos aprobados.

## Contenido

- `mockups/release-1.png` ... `release-7.png`: siete collages suministrados por el proyecto, con cinco pantallas cada uno.
- `AGENTS.md`: reglas obligatorias para agentes que diseñan/implementan UI.
- `DESIGN_SYSTEM.md`: identidad visual, tokens aproximados, componentes y navegación.
- `SCREENS.md`: 35 pantallas visuales y su relación con releases/RF.
- `DESIGN_GAPS.md`: contradicciones mockup–RF/BD para evitar inventar funcionalidades.
- `prompts/01_AUDITORIA_VISUAL.md`: auditoría sin modificar código.
- `prompts/02_ADAPTAR_FOUNDATION.md`: recuperar la estética original en bloque 0.
- `prompts/03_AUTH_R1.md`: implementar formularios reales R1 con fidelidad visual.
- `prompts/04_CREAR_EVENTO_R1.md`: crear evento con diseño original y datos completos.
- `prompts/05_MAPA_DETALLE_R1.md`: mapa real y detalle mínimo R1.
- `prompts/06_QA_VISUAL.md`: comparar screenshots y documentar hallazgos.

## Cómo usar con Codex

1. Ubicá este directorio exactamente en `docs/design/` del repositorio PlanIt.
2. Abrí las skills de UI/web/React en tu instalación de Codex; si están en `.agents/skills/` versionalas cuando corresponda.
3. Añadí esta instrucción a `src/AGENTS.md` (y opcionalmente al `AGENTS.md` raíz):

   > En cada cambio de UI, leer `docs/design/AGENTS.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/SCREENS.md`, `docs/design/DESIGN_GAPS.md` y **abrir visualmente** los mockups relevantes. Los RF/CA determinan el comportamiento; los mockups determinan el diseño. No agregar features sólo por verse en una captura.

4. Entregale a Codex el contenido de `prompts/01_AUDITORIA_VISUAL.md` y revisá su auditoría.
5. Una vez aceptado, usar `prompts/02_ADAPTAR_FOUNDATION.md` para reemplazar el estilo provisional del bloque 0.
6. Después seguir prompts específicos junto con el plan técnico R1 previamente aprobado. No aplicar SQL remoto desde una tarea de diseño.

## Notas de fidelidad

Las capturas adjuntas son diapositivas que incluyen decoración **fuera** de los teléfonos; sólo la UI *dentro* de cada teléfono es referencia de producto. Los colores de `DESIGN_SYSTEM.md` son aproximados y deben afinarse contrastando una página real.

No copiar fotos incrustadas en las diapositivas como assets de eventos reales; son referencias ilustrativas. No tratar el mockup como modelo funcional: `DESIGN_GAPS.md` explica las diferencias.
