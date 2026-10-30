# Validación de la presentación

## Entrega vigente: 54 diapositivas, alcance separado y esfuerzo relativo

Corrección editorial posterior: se retiraron las tallas visibles y sus etiquetas accesibles de la leyenda de estimación, conservando los seis puntos y sus colores. También se retiró la frase de esfuerzo de los pies de los 14 tableros y su CSS; la procedencia permanece en estimación y notas. Las comprobaciones de navegador y PDF verifican expresamente estas ausencias.

29/10/2026. Alcance y Limitaciones ocupan páginas independientes. Las 53 historias incorporan estimaciones propuestas expresamente autorizadas por el usuario, con puntos, tallas y colores centralizados; no son estimaciones históricas ni horas. Referencia: [EFFORT_ESTIMATES.md](EFFORT_ESTIMATES.md).

| Verificación ejecutada | Resultado |
| --- | --- |
| npm run check | PASS: 54 identidades y notas, 53 historias literales, 53 asignaciones válidas, seis colores únicos con contraste ≥4,5:1 |
| npm run build | PASS: compilación independiente Slidev, 674 módulos |
| npm run check:visual | PASS: 108 capturas, las 54 páginas a 1280×720 y 1920×1080; sin desbordes ni colisiones con el pie |
| Círculos de historias | PASS: 53 por resolución, valor/talla/color consistentes, diámetro 36 px, número 22 px, accesibles y dentro del encabezado sin cubrir texto |
| Historias y arquitectura | PASS: enunciados completos, cuerpo ≥24 px, identificadores ≥20 px, composiciones de tres/cuatro/cinco; teclado y movimiento reducido |
| npm run export | PASS: exports/planit-completa.pdf, 54 páginas; versión de 53 preservada como planit-completa-53.pdf |
| scripts/check-pdf.py | PASS: 54 páginas 16:9, 53 historias completas y 53 números de esfuerzo seleccionables en sus círculos; colores comprobados sobre el render PDF |
| Roadmap y fondos | PASS: fechas intactas, cero recursos /Shading y diferencia de fondo PDF/navegador 0/255 |
| Regresión visual | PASS: las 37 páginas ajenas al cambio son idénticas píxel a píxel a la versión de 53 páginas en ambas resoluciones, 74 comparaciones |
| Regresión de contenido | PASS: sin cambios de texto oficial; sólo se añaden notas de esfuerzo en tableros y se modifican alcance/estimación según lo autorizado |
| Inspección directa | 54 páginas de navegador y PDF en planchas; Alcance, Limitaciones, leyenda y tableros a tamaño completo; tablero de cinco historias a 1080p |

El exportador conserva el diagnóstico no bloqueante conocido de Twoslash/FloatingVue y finaliza con exit 0. Capturas y reportes permanecen en `.validation/`, sin versionar. No se agregan dependencias ni se modifica la PWA. No se ejecutaron pruebas físicas de proyector ni pruebas funcionales remotas de la aplicación.

## Entrega histórica: 53 diapositivas con apertura reorganizada

29/10/2026. Se elimina Escenario, se titulan Problema y Solución y se añaden dos oportunidades de mejora por tipo de usuario y Alcance y limitaciones. Fuentes y decisiones: [NARRATIVE_ADJUSTMENTS.md](NARRATIVE_ADJUSTMENTS.md). Las páginas de funcionalidades y beneficios se mantienen idénticas.

| Verificación ejecutada | Resultado |
| --- | --- |
| npm run check | PASS: 53 identidades y notas, orden inicial, 53 historias literales únicas y 13 sprints funcionales |
| npm run build | PASS: build independiente de Slidev, 667 módulos |
| npm run check:visual | PASS: 106 capturas, 53 páginas a 1280×720 y 1920×1080; sin desbordes ni colisiones con pies |
| Arquitectura | PASS: dos pasos por teclado y movimiento reducido; localización por identidad |
| npm run export | PASS: exports/planit-completa.pdf, 53 páginas |
| scripts/check-pdf.py | PASS: 53 páginas 16:9, 53 historias completas seleccionables, fechas exactas de roadmap y cero recursos /Shading |
| Color PDF/navegador | PASS: seis muestras por página, diferencia máxima 0/255; fondos RGB opacos |
| Regresión de contenido | Funcionalidades, Beneficios y todas las páginas desde Requisitos hasta Agradecimientos conservan contenido y notas respecto a main |
| Regresión visual | Funcionalidades y Beneficios idénticos píxel a píxel a sus capturas originales, tanto a 720p como a 1080p |
| Inspección visual | 53 páginas de navegador y PDF en planchas; nuevas páginas y títulos modificados del PDF a tamaño completo; muestra nueva a 1080p |
| Aislamiento | Cambios limitados a presentation; dependencias y lockfile intactos; cambio local preexistente de supabase/.temp/cli-latest excluido del commit |

La exportación emitió el diagnóstico conocido de Twoslash/FloatingVue y finalizó con exit 0; el PDF pasó la revisión. Los resultados y capturas locales están en `.validation/`, sin versionar. No se ejecutó una prueba física de proyector ni se certifica aceptación funcional remota de la PWA. No se aplicaron migraciones ni se ejecutaron pruebas de la PWA, que no cambia en esta tarea.

## Entrega histórica: 51 diapositivas con cierre completo

27/10/2026. Pedido posterior: agregar las páginas que siguen a las releases en el PDF del Equipo 6. Se añadieron 48 Demo, 49 Evolución del producto, 50 Conclusiones y 51 Agradecimiento; la agenda anuncia el cierre. Fuentes: CLOSING_SOURCES.md y notas del presentador.

| Verificación ejecutada | Resultado |
| --- | --- |
| npm run check | PASS: 51 identidades y notas, 53 historias únicas y literales, 13 sprints funcionales |
| npm run build | PASS: 659 módulos; proyecto Slidev independiente |
| npm run check:visual | PASS: 102 capturas, las 51 páginas a 1280×720 y 1920×1080; límites del canvas, pies, historias, fuentes y fondos |
| Teclado y movimiento reducido | PASS: las dos revelaciones de arquitectura siguen funcionando |
| npm run export -- --wait 700 | PASS: exports/planit-completa.pdf, 51 páginas |
| scripts/check-pdf.py | PASS: 51 páginas 16:9, 53 historias completas seleccionables, fechas exactas del roadmap, cero recursos /Shading |
| Color PDF/navegador | PASS: seis muestras por página, diferencia máxima 0/255; fondos RGB opacos |
| Regresión PDF de las primeras 47 páginas | Comparación píxel a píxel: únicamente difiere la agenda, página 3. Las otras 46 páginas son idénticas a la entrega histórica |
| Inspección directa | Agenda y cuatro páginas nuevas en canvas; las cuatro páginas nuevas del PDF a tamaño completo. El resto se conserva idéntico al PDF revisado de 47 páginas |
| Revisión independiente | disposition ship, sin correcciones materiales; agenda 3 y cierre 48–51 en canvas, cuatro originales 1080p y cuatro páginas PDF; REVIEW_51_SLIDES.md |
| npm run lint raíz | Exit 0; advertencias preexistentes en QA y DiscoveryFilters |
| Git y aislamiento | PWA, SQL, dependencias y despliegue intactos; PDF histórico de 47 páginas conservado, con copia planit-con-releases-47.pdf |

La primera pasada visual encontró texto de conclusiones en la banda del pie. Se corrigieron los márgenes heredados de listas y el espaciado local, manteniendo cuerpo de 24 px. La repetición completa pasó. Chromium requirió reutilizar su instalación local mediante PLAYWRIGHT_BROWSERS_PATH y ejecutar las pruebas con acceso al servidor local fuera de la restricción de red del sandbox.

La demo es un separador para la exposición en vivo; no se afirma que se haya ejecutado una sesión de demostración. Las seis posibilidades de evolución proceden de ERS §2.6 y permanecen fuera de los requisitos comprometidos. Las conclusiones son síntesis editoriales de revisiones y retrospectivas. La exportación conserva el diagnóstico no bloqueante de Twoslash/FloatingVue ya descrito en el historial. No se realizaron pruebas físicas de proyector ni aceptación técnica integral de releases.

Revisión independiente y consistencia documental de este cierre: REVIEW_51_SLIDES.md y DESIGN_CHECK_51_SLIDES.md, con sus alcances de inspección respectivos. Los registros siguientes son entregas históricas.

## Entrega histórica: 47 diapositivas con releases R1–R7

27/10/2026. Se conservaron las primeras 18 páginas, actualizando la agenda, y se añadieron el separador de releases y cuatro páginas por release. La entrega finaliza en los aspectos destacados de R7.

| Verificación ejecutada | Resultado |
| --- | --- |
| npm run check | PASS: 47 identidades, 53 historias completas y únicas, comparación literal con la transcripción oficial normalizando sólo espacios, distribución en 13 sprints funcionales |
| npm run check:visual | PASS: 94 capturas, todas las páginas a 1280×720 y 1920×1080 |
| Post-its | PASS: texto de 24 px e identificadores de 20 px; papeles inclinados dentro del canvas, texto dentro del papel, sin colisiones con el pie |
| Recursos, teclado y movimiento reducido | PASS: fuentes y fondos locales; arquitectura conserva sus dos pasos y reduced-motion |
| npm run build | PASS: build independiente Slidev |
| npm run export -- --wait 700 | PASS: exports/planit-con-releases.pdf, 47 páginas |
| scripts/check-pdf.py | PASS: 47 páginas 16:9, 53 historias completas seleccionables, fechas exactas del roadmap, sin recursos /Shading |
| Color del PDF | PASS: seis muestras por página comparadas con el navegador; diferencia máxima 0/255; fondos RGB opacos |
| Inspección PDF | Todas las páginas renderizadas; las 29 nuevas revisadas en cinco planchas. Las 17 páginas anteriores sin cambio visible son idénticas píxel a píxel al PDF histórico; sólo cambia la agenda entre las primeras 18 |
| Revisión independiente | disposition ship, sin hallazgos materiales; REVIEW_47_SLIDES.md, con inspección de las 29 nuevas páginas y originales 1080p de 30, 34 y 46 |
| Consistencia del diseño | DESIGN_CHECK_47_SLIDES.md verifica componentes, tokens y documentación del alcance |
| npm run lint en raíz | Exit 0; advertencias preexistentes en sondas QA y DiscoveryFilters |
| Aislamiento | PWA, base de datos, dependencias y despliegue sin cambios; PDF histórico de 18 páginas conservado |

Fuentes y secciones: RELEASE_SOURCES.md, SLIDE_SOURCES.md y notas del presentador. Las historias se contrastan con references/release-stories.source.json. R1 tiene dos páginas del mismo sprint; no se inventaron fechas para los otros sprints. Los acuerdos de mejora se presentan como acuerdos y no como correcciones ya aplicadas.

La exportación conserva el diagnóstico no bloqueante de Twoslash/FloatingVue descrito en el registro histórico: finaliza con exit 0 y el PDF pasa sus comprobaciones. No se realizó una prueba física de proyector ni se certifica aceptación técnica integral de las releases.

## Entrega histórica: 18 diapositivas hasta el roadmap

La secuencia implementada coincide con el plan aprobado: portada, equipo, agenda, escenario, situación disparadora, solución, funcionalidades, beneficios, requisitos, agrupación funcional, usuarios, stack, arquitectura, enfoque, priorización/estimación, herramientas, planificación general y roadmap. No se añadieron releases detalladas, demo ni conclusiones.

| Verificación ejecutada | Resultado de la entrega de 18 diapositivas |
| --- | --- |
| npm run check | PASS: 18 identidades en orden, notas con fuentes oficiales, 53 RF/218 CA/13 sprints funcionales más R0 |
| npm run check:visual | PASS: 36 capturas, 1280×720 y 1920×1080 |
| Títulos y pies | PASS: 52 px en slides 2–18, 142 px en portada; sin texto fuera del canvas ni colisión con el pie |
| Fuente, recursos y fondos | PASS: fuente local, assets cargados, fondo PNG opaco y ausencia de franja izquierda |
| Arquitectura | PASS: localizada por identidad, dos pasos de teclado y reduced-motion |
| npm run build | PASS: build independiente Slidev |
| npm run export | PASS: exports/planit-hasta-roadmap.pdf, 18 páginas |
| scripts/check-pdf.py | PASS: 16:9, texto seleccionable, fechas R0–R7 exactas, cero recursos /Shading |
| Color del PDF | PASS: seis muestras por página frente al navegador, diferencia máxima 0/255 en cada canal; fondos RGB sin alfa |
| Inspección PDF | Las 18 páginas renderizadas revisadas en tres planchas; originales 2, 10, 14 y 18 inspeccionados además a tamaño completo |
| Revisión independiente | disposition ship; escala de títulos y colisión del roadmap resueltas; ver REVIEW_18_SLIDES.md |
| Consistencia del sistema | Documentación scoped verificada en DESIGN_CHECK_18_SLIDES.md; sistema raíz intacto |
| npm run lint en raíz | Exit 0; advertencias preexistentes en QA y DiscoveryFilters, ninguna corrección ajena al alcance |
| Git | Sólo presentation/ y el registro de skill de la tarea anterior; PWA, SQL, dependencias y despliegue sin modificaciones |

La primera pasada detectó una nota del roadmap fuera del canvas y luego una superposición con el pie. Se consolidaron las aclaraciones en un único pie. La revisión también detectó que el tema reducía el tamaño de títulos por especificidad CSS; se restauraron los 52 px y se añadió una comprobación de escala y colisión para evitar regresiones. Las 36 capturas posteriores pasaron.

La fuente principal es Planificación Oficial; ERS Oficial complementa el contexto con autorización. Trazabilidad por página: SLIDE_SOURCES.md y notas del presentador. No se consultaron ni modificaron datos de producción en esta ampliación. La comprobación del PDF no sustituye una prueba física de proyector ni aceptación funcional remota de las releases.

Persiste el diagnóstico no bloqueante de Twoslash/FloatingVue al exportar, ya registrado abajo; el proceso finaliza con exit 0 y el PDF se valida. Los registros siguientes corresponden a iteraciones históricas del prototipo.

## Corrección de franja y color del PDF

26/10/2026: se retiró la franja vertical izquierda. Ante la captura aportada por el usuario con gradientes rosados en su visor, los fondos pasaron a PNG RGB opacos sRGB de 2560×1440; navegador y PDF comparten esos mismos recursos. Su fuente editable queda en styles/background-source.css. No se atribuye una causa definitiva al visor del usuario, que no se controló en esta sesión.

Se ejecutaron backgrounds, check, check:visual, build y export con resultado PASS. El PDF final tiene tres páginas; se renderizaron e inspeccionaron las tres con PDFium, sin fondo rosado ni franja. pypdf confirmó ausencia de recursos /Shading en las tres páginas y PIL confirmó RGB sin canal alfa en los tres fondos. El texto y los diagramas permanecen separados del fondo. Persiste el diagnóstico no bloqueante de FloatingVue ya documentado.

## Revisión de fondos solicitada por el usuario

26/10/2026: se añadió un fondo compartido con tres variantes de luz, franja lateral y contornos SVG en los márgenes, inspirado en la vista previa de Software Development App Pitch Deck. Se preservaron contenido, tipografía, paleta y alcance de tres diapositivas. Se repitieron check, check:visual (720p/1080p, teclado y reduced-motion), build y export con resultado PASS. La inspección visual corrigió los contornos para que queden fuera del área de texto. La revisión independiente inferior corresponde a la versión inicial; esta iteración recibió revisión visual directa.

26/10/2026. Alcance: tres diapositivas. La aceptación estética final corresponde al equipo.

| Verificación ejecutada | Resultado |
| --- | --- |
| Node / npm | 24.19.0 / 11.17.0, compatibles |
| Generador oficial Slidev | presentation/ directo, sin subproyecto anidado |
| npm run dev | Servidor local en http://localhost:3030 |
| npm run check | PASS: tres diapositivas, 16:9, notas y assets locales |
| npm run check:visual | PASS: 1280×720 y 1920×1080, las tres diapositivas |
| Límites de canvas, imágenes y fuente | PASS, sin elementos comprobados fuera del canvas |
| Teclado y dos revelaciones de arquitectura | PASS |
| prefers-reduced-motion | PASS, transiciones anuladas |
| Errores JavaScript no capturados en prueba visual | Ninguno, con Wake Lock desactivado por preferencia en headless |
| Inspección visual de seis capturas | Realizada; corregidos separación del pie y ajuste del nodo PWA |
| Revisión independiente Impeccable | Corrección de conectores SVG puntuada resuelta; disposition ship al alcance de esa corrección |
| Detector Impeccable sobre presentation | [] sin hallazgos deterministas |
| Procedencia PNG | Tres capturas con metadatos, scan 0 faltantes |
| npm run build en presentation | PASS |
| npm run export | PASS, exports/planit-prototipo.pdf |
| PDF renderizado con PDFium e inspeccionado | Tres páginas completas, diagramas visibles, texto seleccionable, sin recortes observados |
| npm audit en presentation | 0 vulnerabilidades tras correcciones |
| npm run build de la PWA | PASS, advertencia existente de tamaño de chunks |
| npm run lint de la PWA | Exit 0, advertencias preexistentes en QA y DiscoveryFilters |
| Aislamiento Git | Sólo presentation/ y alta de Slidev en skills-lock.json; código/configuración de la aplicación sin cambios |
| Ignorados | node_modules, dist, exports y .validation comprobados con git check-ignore |

La verificación visual aplica comprobaciones geométricas y revisión humana asistida sobre capturas. No es una certificación WCAG completa ni una prueba física de proyector. Los roles de color siguen el sistema de contraste aprobado Amanecer. Se conservan textos breves, captions grandes y evidencia de producto en capturas, cuya letra pequeña no es texto de exposición.

## Diagnósticos y límites

Slidev 53/Twoslash/FloatingVue registra `Failed to patch FloatingVue` al inicializar su plugin de información de tipos. El exportador completa con exit 0 y las tres páginas se renderizan. El prototipo no usa Twoslash; no se parcheó node_modules ni se ocultó el diagnóstico. Mantenerlo como observación de herramienta hasta una actualización compatible.

Chromium headless rechaza Wake Lock sin pantalla física. `check-visual.mjs` desactiva esa opción usando la preferencia de usuario `slidev-wake-lock=false` antes de abrir el deck. No se falsificó la API ni se otorgaron permisos al navegador.

Las primeras capturas fallaron porque el servidor de desarrollo de la app no respondía durante optimización. Se resolvió sirviendo el build real de la PWA en 4182; no se alteró su código. El primer intento de verificación detectó assets aún ausentes y luego una colisión con el pie; ambos corregidos antes de la revisión final.

No se probó en un proyector físico, lector de pantalla ni dispositivos móviles reales. No se ejecutó QA funcional de backend ni se certificaron releases. El documento oficial fue accesible; institución, equipo y ciclo tienen respaldo. No faltan datos obligatorios para estas tres diapositivas.

Las skills quedan instaladas localmente en carpetas ya ignoradas por el repositorio. Para otros clones se debe usar la reinstalación indicada en README. La presentación completa, orden de oradores, tiempo definitivo y demo permanecen fuera del alcance de este prototipo.
