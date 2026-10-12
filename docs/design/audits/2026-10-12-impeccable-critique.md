---
target: Inicio, Mapa, Mis eventos, detalle de evento y chat
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\planit\\src\\pages"
timestamp: 2026-10-12T18-17-14Z
slug: src-pages
---
Method: dual-agent (A: /root/design_review · B: /root/detector_evidence)

**PlanIt tiene identidad cromática, pero poca identidad compositiva.** El marino, azul y violeta son coherentes con “Un punto de encuentro nocturno”. Lo genérico aparece en la distribución: cajas redondeadas, chips y placeholders reciben pesos similares, aunque las tareas sean diferentes.

Evaluación basada en código actual y capturas de fixtures de móvil/escritorio. No hubo revisión en vivo de las cinco pantallas autenticadas; las prioridades son conclusiones de diseño, no defectos funcionales reproducidos.

**Las cinco pantallas**

| Pantalla | Problema principal | Consecuencia |
|---|---|---|
| Inicio | Portadas sin foto demasiado grandes; categoría repetida como sección y chip | El contenedor domina sobre el evento; con pocos resultados se siente vacío |
| Mapa | Dos columnas estrechas en móvil y evento repetido en preview y lista | Leer título, fecha y lugar requiere más esfuerzo y scroll |
| Mis eventos | Título, subtítulo, pestañas, cinco filtros, explicación y Actualizar preceden la lista | La gestión empieza demasiado abajo |
| Detalle | Hero y bloques informativos desplazan cupos y Unirme | Cuesta responder rápidamente cuándo, dónde y si puedo asistir |
| Chat | Nombre, username y fecha completa por mensaje | Metadatos repetidos interrumpen la conversación al crecer el historial |

**Lo que funciona**

- Paleta nocturna, iconografía y CTA comparten una identidad clara.
- La tarjeta fotográfica para descubrir y la fila compacta para gestionar distinguen bien dos tareas.
- El chat tiene foco: conversación, autoría diferenciada, composer inferior y estado explícito de sólo lectura.

**Prioridades**

1. **P1 — Detalle: acercar la decisión de participar.** El hero sin foto mide 220 px en móvil y 300 px en escritorio. Después aparecen fechas, lugar, descripción y organizador antes de cupos y CTA. Esto separa la información esencial de la decisión. Reducir el peso del placeholder, agrupar fecha/hora y ubicación y acercar disponibilidad y acción, conservando todos los datos y estados. Evidencia: [detalle móvil](D:/planit/docs/design/verification/r3-block-6/regression-participations-ui/detail-375x812.png) y [estilos del hero](D:/planit/src/pages/discovery.css:34). Comando sugerido: `$impeccable layout detalle de evento`.

2. **P1 — Mapa: hacer los resultados móviles escaneables.** A 375 px, dos columnas dejan tarjetas de aproximadamente 163 px: los títulos se parten y la ficha se alarga. El mismo evento ya aparece en un preview ancho encima. Ajustar las columnas móviles y dar funciones visuales distintas al seleccionado y al listado; evitar repetir su ficha completa sin aportar contexto. Evidencia: [mapa móvil](D:/planit/docs/design/verification/r3-block-5/regression-discovery-ui/map-375x812.png) y [grid](D:/planit/src/pages/discovery.css:10). Comando: `$impeccable adapt Mapa`.

3. **P2 — Mis eventos: reducir el preámbulo.** En la captura móvil, la primera fila comienza cerca de los 480 px. Hay dos decisiones superpuestas: Organizo/Participo y cinco filtros, además de explicación permanente y actualización. Conservar todas las opciones, distinguir mejor tiempo y estado y bajar el peso de la ayuda y de Actualizar. El “+” tiene nombre accesible, pero su propósito depende de reconocer el símbolo. Evidencia: [Mis eventos móvil](D:/planit/docs/design/verification/r3-block-5/regression-my-events-ui/organizing-375x812.png) y [controles](D:/planit/src/pages/MyEventsPage.tsx:18). Comando: `$impeccable distill Mis eventos`.

4. **P2 — Inicio: dar protagonismo al plan cuando falta fotografía.** El calendario genérico ocupa unos 190 px, mientras título, fecha y lugar quedan debajo con menor peso. Música se repite como encabezado y chip. En escritorio, una sola tarjeta hace muy visible el vacío del grid. Diseñar la ausencia de foto y la baja cantidad de resultados con mayor jerarquía de contenido; no llenar con eventos ficticios. Evidencia: [Inicio móvil](D:/planit/docs/design/verification/r3-block-5/regression-home-ui/home-mobile.png), [Inicio escritorio](D:/planit/docs/design/verification/r3-block-5/regression-home-ui/home-desktop.png) y [composición](D:/planit/src/pages/HomePage.tsx:97). Comando: `$impeccable layout Inicio`.

5. **P2 — Navegación y chat: eliminar competencia y repetición informativa.** Perfil aparece arriba y abajo; las acciones de cuenta compiten con el contexto de cada pantalla. En chat, repetir identidad y fecha completa para cada mensaje resta continuidad. Priorizar un acceso principal y una lectura más ligera de metadatos, preservando destinos, autoría y datos disponibles. Comandos: `$impeccable distill navegación` y `$impeccable typeset chat`.

La oportunidad para reducir lo genérico está en proporciones, jerarquía y estados sin foto. Más degradados, sombras o decoración reforzarían la repetición existente.

**Puntuación heurística: 27/40 — aceptable, con mejoras relevantes pendientes.**

| Heurística | /4 | Observación |
|---|---:|---|
| Visibilidad del estado | 3 | Estados claros; actualización manual demasiado presente |
| Lenguaje del mundo real | 3 | Organizo/Participo son claros; Publicado es más administrativo |
| Control y libertad | 3 | Regreso contextual y confirmaciones en código |
| Consistencia | 3 | Identidad coherente; superficies con pesos poco diferenciados |
| Prevención de errores | 3 | Cupos, permisos y confirmaciones contemplados |
| Reconocimiento | 3 | Navegación etiquetada; “+” y menús requieren familiaridad |
| Eficiencia | 2 | Demasiado scroll entre información y acción |
| Estética y minimalismo | 2 | Vacíos, duplicación y controles compiten con el contenido |
| Recuperación de errores | 3 | Explicaciones y reintentos existentes |
| Ayuda contextual | 2 | Orientación parcial del recorrido de participación y gestión |
| **Total** | **27/40** | Evaluación orientativa; no certifica usabilidad ni accesibilidad |

**Carga cognitiva y personas**

Carga moderada por tres factores: jerarquía, fragmentación y opciones. Los cinco filtros de Mis eventos merecen agrupación; superar cuatro opciones no demuestra por sí solo un problema. La navegación principal tiene cuatro destinos y el menú organizador ya contiene acciones mediante divulgación progresiva.

- Participante nuevo o apurado: necesita ver pronto cuándo, dónde y disponibilidad; el detalle retrasa esa respuesta.
- Organizador frecuente: debe encontrar el evento antes de procesar ayuda y filtros secundarios.
- Persona con baja visión o móvil pequeño: tarjetas estrechas y metadatos de 11–12 px aumentan esfuerzo; requiere validación específica antes de afirmar un fallo de accesibilidad.

El recorrido comienza con una atmósfera coherente, pierde fuerza ante placeholders dominantes y lectura repetida, y recupera confianza al mostrar cupos reales y una acción clara. El chat mantiene mejor el foco. No se evaluó satisfacción tras una inscripción real.

**Detector y límites de evidencia**

El detector devolvió **0 hallazgos en los cinco TSX** revisados. No escaneó CSS ni componentes compartidos; no mide la composición renderizada. Por eso no contradice los problemas visuales anteriores. No hubo falsos positivos.

Una revisión de navegador recibió conexión rechazada; la otra mostró sólo login, posiblemente con intervención de caché/PWA. No se accedió a las pantallas autenticadas. El API disponible no permitió inyectar el detector: **no hay overlay visible**. Los mapas de fixtures y su ausencia de calles no se contabilizaron como fallos de producción, ni “Conectando…” como conexión atascada.

**Preguntas de diseño para una próxima revisión:** ¿Qué decisión debe resolver cada pantalla en sus primeros segundos? ¿Qué información merece el espacio de una portada cuando el evento no tiene foto?
