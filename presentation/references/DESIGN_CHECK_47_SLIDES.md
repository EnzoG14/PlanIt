# Verificación del sistema — 47 diapositivas

Fecha: 27/10/2026. Alcance: extensión aprobada de 18 a 47 diapositivas hasta los aspectos destacados de R7. Los registros de tres y 18 diapositivas permanecen históricos; no se reinterpretan como validación del alcance actual.

## Fuentes y coherencia del sistema

Se contrastaron `presentation/DESIGN.md`, `references/DIRECTION.md`, `references/RELEASE_SOURCES.md` y `references/REVIEW_47_SLIDES.md` con `styles/releases.css`, `ReleaseCover.vue`, `StoryBoard.vue`, `ReleaseHighlights.vue`, `data/release-content.mjs` y los metadatos de `references/release-stories.source.json`.

La fuente congelada identifica Planificación Oficial, pestaña `t.q5vok7qr5sti`, revisión concreta y consulta del 27/10/2026. La trazabilidad remite a capítulos 5–11 para objetivos, historias, revisión y retrospectiva. Esta pasada verificó el registro local; no volvió a consultar el documento remoto ni repitió la comparación literal exhaustiva.

- Se mantiene el sistema Amanecer: lienzo 1280 × 720, Bricolage local, fondos opacos azul-lavanda, tinta marina y ausencia de franja lateral. Las reglas de releases se limitan a sus clases nuevas.
- La extensión contiene un separador y cuatro páginas por release: portada, dos tableros y aspectos destacados. Finaliza en R7, sin demo o conclusiones. R0 no recibe sección de detalle.
- Los tableros de tres, cuatro y cinco papeles usan altura de 520 px, leves inclinaciones, fondos blanco/lavanda/azul claro y cinta plana. Cuerpo de historia: 24 px/1,24; identificador: 20 px/700/1,2. La segmentación del componente destaca la acción sin alterar palabras. No hay revelaciones obligatorias en los tableros.
- La transcripción contiene 53 historias oficiales en 13 sprints funcionales. Las dos páginas de R1 conservan el mismo sprint; la continuación no agrega un sprint. Sólo R1 muestra un período individual explícito en las fuentes consultadas.
- Los cierres separan incremento, dificultad observada y acuerdo de mejora. El pie evita convertir los acuerdos en soluciones ya aplicadas.

## Evidencia visual

Se confirmó la presencia de 47 archivos canvas y 47 archivos projector en `.validation/`. Se abrieron directamente `canvas-slide-21.png`, `22`, `30`, `34`, `46` y `47`:

- 21/22: composición de cuatro y tres papeles; continuación explícita del sprint de R1.
- 30/34: tableros densos de cinco papeles; texto contenido dentro de sus superficies, cinta sobre el margen superior y pie independiente.
- 46: cuatro historias de R7, incluidas integraciones y Web Push, sin recortes visibles.
- 47: tres filas de retrospectiva con separación clara entre hechos observados y acuerdos.

Las seis capturas muestran identidades correctas, bordes completos, contenido visible y coherencia de tipografía y color. Esta pasada no inspeccionó manualmente las 94 capturas.

## Revisión y verificaciones suministradas

`REVIEW_47_SLIDES.md` registra **disposition: ship**, tras inspección independiente de las 29 nuevas capturas canvas, projector 30/34/46 y muestras de regresión. Su alcance excluye la inspección final de PDF y no equivale a revisión manual de todas las capturas de proyector.

El constructor informa PASS en las 94 capturas para literalidad, cuerpo mínimo de 24 px, IDs de 20 px, límites de papel, texto no cubierto y separación del pie. También informa PDF de 47 páginas, las 53 historias completas y seleccionables comprobadas con PDFium, ausencia de `/Shading`, diferencia cero en las muestras de color y comparación exacta de las 17 páginas iniciales distintas de la agenda. Se registran como evidencia suministrada; esta pasada documental no repitió esos comandos ni la inspección de las 47 páginas del PDF.

## Documentación y límites

Se actualizó `presentation/DESIGN.md` únicamente para corregir hechos: alcance de 47 páginas, excepción autorizada de agenda, sombra adicional de papeles y valores realmente usados por los post-its. Se incorporaron al frontmatter sus colores, radio y dos roles tipográficos observados. Se creó este registro.

Se preservaron el sistema y sidecar raíz, `PRODUCT.md`, los registros históricos, la implementación visual, la aplicación y el backend. La deriva preexistente del sidecar raíz sigue informada sin reparación; no se creó un mundo visual nuevo ni un sidecar local. Esta pasada no ejecutó una nueva auditoría, prueba física de proyector o aceptación funcional de releases.
