# Trazabilidad de releases y enunciados oficiales

Fecha de consulta: 27/10/2026. Fuente principal: Planificación Oficial, pestaña `t.q5vok7qr5sti` del Google Doc de PlanIt. La revisión consultada está registrada en `release-stories.source.json`, junto a la transcripción literal de las 53 historias. No se almacena el documento completo ni sus imágenes.

## Fuentes de cada bloque

| Release | Portada y objetivo | Historias | Revisión | Retrospectiva |
| --- | --- | --- | --- | --- |
| R1 | §3.1 y capítulo 5 | §5.1, siete historias en un sprint | §5.3 | §5.4 |
| R2 | §3.1 y capítulo 6 | §6.1 / §6.2, tres y cuatro | §6.4 | §6.5 |
| R3 | §3.1 y capítulo 7 | §7.1 / §7.2, cuatro y cinco | §7.4 | §7.5 |
| R4 | §3.1 y capítulo 8 | §8.1 / §8.2, cuatro y cinco | §8.4 | §8.5 |
| R5 | §3.1 y capítulo 9 | §9.1 / §9.2, cuatro y cuatro | §8.4 (actual) | §8.5 (actual) |
| R6 | §3.1 y capítulo 10 | §10.1 / §10.2, tres y tres | §9.4 (actual) | §9.5 (actual) |
| R7 | §3.1 y capítulo 11 | Sprint 1 / §11.2, tres y cuatro | §10.4 (actual) | §10.5 (actual) |

Las portadas conservan los nombres y períodos ya verificados del calendario general. Sólo R1 explicita fechas de sprint en la transcripción consultada (08/09/2025–23/09/2025). No se estimaron fechas individuales para R2–R7.

## Reglas de transcripción

- `data/release-stories.mjs` conserva ID, release, sprint, título y enunciado completo. `references/release-stories.source.json` es la transcripción de comparación, vinculada a una revisión concreta del documento.
- El componente sólo segmenta el enunciado para destacar la acción en negrita. La comprobación DOM compara el texto completo y permite normalizar únicamente espacios y saltos de línea.
- Los 53 IDs se muestran una sola vez, en orden y en el sprint oficial. Las dos páginas de R1 se identifican como una continuación del mismo sprint.
- Las historias son texto HTML/CSS, no imágenes. PDFium verifica también el texto completo seleccionable del PDF. La extracción con pypdf puede introducir separaciones incorrectas en palabras rotadas; no se utiliza ese resultado para cambiar la transcripción ni relajar la comparación.

## Aspectos destacados

Los cierres son síntesis editoriales, no citas literales. Cada uno conserva tres categorías: incremento desarrollado, dificultad observada y acuerdo de mejora. Los acuerdos se presentan como tales, sin afirmar que ya se ejecutaron o que produjeron resultados medidos.

Se priorizan los aprendizajes documentados: R1 continuidad/documentación, R2 carga del sprint, R3 estimación/integración, R4 revisiones distribuidas, R5 decisiones registradas, R6 interrupciones por ajustes menores y R7 puesta en común de aprendizajes. Estos tres cierres se reescribieron con referencias a la revisión actual; la transcripción de historias conserva su revisión histórica. En R6 las métricas son inscripciones, no asistencia física; R7 no certifica entrega Push ni limpieza programada por mostrarse en la presentación.

La estructura adapta las páginas 22–49 del PDF Equipo 6: separador, portadas, historias por sprint y cierre. No se reutilizan historias, fechas, logos, fotos ni paleta del proyecto ADE Toolkit. No se añadieron gráficos burn-up sin datos de base ni contenidos posteriores a R7.

## Reescritura de dificultades y acuerdos de R5–R7

Se volvió a consultar Planificación Oficial, pestaña `t.q5vok7qr5sti`, revisión `AHj4eMRcFw5i-e8E_GgYXTHlkj5taPTAECRFl9DV0sXOcH4fGePlQZqsf2mgMrYNzdNO78WP2SoXWALn9-QQW4J9h2c2Qxyoi1R-Zf6Zw1k`. La numeración del documento cambió desde la transcripción inicial: los cierres actuales de R5, R6 y R7 son §§8.4–8.5, 9.4–9.5 y 10.4–10.5. Las columnas de portadas e historias conservan las referencias del snapshot histórico; las de revisión y retrospectiva de R5–R7 están actualizadas a la revisión consultada para esta reescritura.

| Release | Dificultad elegida | Acuerdo y respaldo actual |
| --- | --- | --- |
| R5 | Repetir conversaciones sin una decisión registrada en la tarea | Registrar decisión, motivo y próximo paso. §8.5, filas Hacer menos y Dejar de hacer |
| R6 | Cambiar de tarea por ajustes menores y perder contexto | Agrupar ajustes y reservar momentos para resolverlos. §9.5, fila Hacer menos |
| R7 | Aprendizajes repartidos entre integrantes al cierre | Reunión de cierre y resumen de decisiones útiles, dificultades y recomendaciones. §10.5, fila Comenzar a hacer |

No fue necesario modificar el Google Doc: las alternativas ya están respaldadas por sus retrospectivas. Sólo cambian las seis frases de la presentación y su trazabilidad. No se presentan los acuerdos como acciones ya ejecutadas ni se agregan problemas históricos no documentados. Los incrementos, historias, fechas y demás diapositivas se conservan.
