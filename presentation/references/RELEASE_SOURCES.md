# Trazabilidad de releases y enunciados oficiales

Fecha de consulta: 27/10/2026. Fuente principal: Planificación Oficial, pestaña `t.q5vok7qr5sti` del Google Doc de PlanIt. La revisión consultada está registrada en `release-stories.source.json`, junto a la transcripción literal de las 53 historias. No se almacena el documento completo ni sus imágenes.

## Fuentes de cada bloque

| Release | Portada y objetivo | Historias | Revisión | Retrospectiva |
| --- | --- | --- | --- | --- |
| R1 | §3.1 y capítulo 5 | §5.1, siete historias en un sprint | §5.3 | §5.4 |
| R2 | §3.1 y capítulo 6 | §6.1 / §6.2, tres y cuatro | §6.4 | §6.5 |
| R3 | §3.1 y capítulo 7 | §7.1 / §7.2, cuatro y cinco | §7.4 | §7.5 |
| R4 | §3.1 y capítulo 8 | §8.1 / §8.2, cuatro y cinco | §8.4 | §8.5 |
| R5 | §3.1 y capítulo 9 | §9.1 / §9.2, cuatro y cuatro | §9.4 | §9.5 |
| R6 | §3.1 y capítulo 10 | §10.1 / §10.2, tres y tres | §10.4 | §10.5 |
| R7 | §3.1 y capítulo 11 | Sprint 1 / §11.2, tres y cuatro | §11.4 | §11.5 |

Las portadas conservan los nombres y períodos ya verificados del calendario general. Sólo R1 explicita fechas de sprint en la transcripción consultada (08/09/2025–23/09/2025). No se estimaron fechas individuales para R2–R7.

## Reglas de transcripción

- `data/release-stories.mjs` conserva ID, release, sprint, título y enunciado completo. `references/release-stories.source.json` es la transcripción de comparación, vinculada a una revisión concreta del documento.
- El componente sólo segmenta el enunciado para destacar la acción en negrita. La comprobación DOM compara el texto completo y permite normalizar únicamente espacios y saltos de línea.
- Los 53 IDs se muestran una sola vez, en orden y en el sprint oficial. Las dos páginas de R1 se identifican como una continuación del mismo sprint.
- Las historias son texto HTML/CSS, no imágenes. PDFium verifica también el texto completo seleccionable del PDF. La extracción con pypdf puede introducir separaciones incorrectas en palabras rotadas; no se utiliza ese resultado para cambiar la transcripción ni relajar la comparación.

## Aspectos destacados

Los cierres son síntesis editoriales, no citas literales. Cada uno conserva tres categorías: incremento desarrollado, dificultad observada y acuerdo de mejora. Los acuerdos se presentan como tales, sin afirmar que ya se ejecutaron o que produjeron resultados medidos.

Se priorizan los aprendizajes documentados: R1 continuidad/documentación, R2 carga del sprint, R3 estimación/integración, R4 revisiones distribuidas, R5 acuerdos/reportes reproducibles, R6 validación de valores y R7 condiciones del entorno. En R6 las métricas son inscripciones, no asistencia física; R7 no certifica entrega Push ni limpieza programada por mostrarse en la presentación.

La estructura adapta las páginas 22–49 del PDF Equipo 6: separador, portadas, historias por sprint y cierre. No se reutilizan historias, fechas, logos, fotos ni paleta del proyecto ADE Toolkit. No se añadieron gráficos burn-up sin datos de base ni contenidos posteriores a R7.
