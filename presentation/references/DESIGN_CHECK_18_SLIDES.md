# Verificación del sistema — 18 diapositivas

Fecha: 26/10/2026. Alcance actual: presentación académica de 18 diapositivas hasta el roadmap general. Extensión ordinaria del sistema Amanecer aprobado. `DESIGN_CHECK.md` conserva su carácter histórico del prototipo de tres diapositivas.

## Fuentes y consistencia

Se contrastaron `presentation/DESIGN.md`, `references/DIRECTION.md` y `references/SLIDE_SOURCES.md` con `styles/index.css`, `styles/extended.css`, `data/deck.mjs`, títulos de `slides.md` y los componentes `TeamRoster`, `FunctionalGroups`, `ReleaseRoadmap` y `SlideFooter`.

- Se conserva el lienzo 1280 × 720, margen 64 × 52 px, Bricolage Grotesque local, tinta marina, violeta profundo y fondo lavanda. Los títulos del sistema siguen en 52 px y la marca en 142 px.
- Los fondos son PNG opacos compartidos por navegador e impresión, con contornos en los márgenes y sin franja vertical izquierda. No hay sustitución de la identidad de PlanIt.
- Las composiciones nuevas reutilizan filas editoriales, divisores finos y columnas; el documento local registra sus escalas de texto y la geometría del roadmap, sin trasladarlas al sistema móvil.
- `data/deck.mjs` enumera exactamente 18 identidades, desde portada hasta roadmap. Equipo, agrupación funcional y períodos se consumen desde ese archivo.
- Se verificó en los datos la separación de R0 (un sprint técnico) frente a R1–R7: 7 releases funcionales, 53 RF/historias, 218 CA y 13 sprints funcionales. R0–R3 corresponden a 2025 y R4–R7 a 2026.
- El roadmap representa secuencia, no duración proporcional: ocho períodos con fechas de inicio y fin completas, en dos filas de cuatro. El pie único declara tanto la escala como el límite de aceptación.
- La trazabilidad editorial registra Planificación Oficial, pestaña `t.q5vok7qr5sti`, como fuente principal y ERS, pestaña `t.8kvi3flgq86r`, como complemento autorizado. Esta pasada comprobó la consistencia de las fuentes registradas con el artefacto local; no volvió a consultar el documento remoto.

## Evidencia visual y revisión

Se confirmó la presencia de 18 capturas `canvas-slide-{1..18}.png` y 18 capturas `projector-slide-{1..18}.png` en `.validation/`. La inspección propia de esta pasada abrió las capturas canvas 2, 10, 17 y 18: equipo con responsabilidades legibles, siete áreas funcionales en dos columnas, conteos separados de R0 y roadmap final sin colisión con el pie. Los títulos y pies ocupan bandas distintas; fondos y contornos mantienen la identidad.

`references/REVIEW_18_SLIDES.md` ya registra **disposition: ship**. La revisión independiente inspeccionó las 18 capturas canvas finales y las capturas de proyector allí especificadas, y puntuó resueltas la colisión del roadmap y la escala de títulos. Esta documentación no se atribuye la inspección independiente completa ni la ejecución de sus comprobaciones.

El constructor informa PASS en las 36 capturas para límites, títulos, pies e imágenes; el informe independiente distingue esas comprobaciones suministradas de su propia inspección. Esta pasada documental no volvió a ejecutar build, exportación PDF, teclado, movimiento reducido ni detector, y no certifica un proyector físico o aceptación funcional de releases.

## Archivos y límites

Se corrigieron únicamente afirmaciones de alcance y escala en `presentation/DESIGN.md`, añadiendo los roles tipográficos y geometría observados de la extensión. Se creó este registro de verificación.

Se preservaron `D:/planit/DESIGN.md`, `PRODUCT.md` y `.impeccable/design.json`, así como la implementación visual, la aplicación y el backend. La deriva preexistente del sidecar raíz permanece informada y sin reparar: esta extensión no autoriza reparar el sistema global. No se canonizaron defectos; no se creó sidecar local ni se cambió el mundo visual aprobado.
