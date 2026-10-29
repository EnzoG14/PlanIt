---
name: PlanIt — presentación Amanecer
description: Extensión para proyección de la identidad Amanecer; tipografía amplia, evidencia real y diagramas claros.
colors:
  bg: "#f6f5fd"
  surface: "#ffffff"
  ink: "#060b27"
  muted: "#565f8a"
  primary: "#0753ff"
  violet-deep: "#5b34d6"
  selection: "#c5b5ff"
  control-border: "#7a82a8"
  divider: "#060b2728"
  paper-lavender: "#f1eeff"
  paper-blue: "#e7edff"
  paper-tape: "#c5b5ffb3"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "142px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  purpose:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "46px"
    fontWeight: 500
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  caption:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.35
  detail:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "19px"
    fontWeight: 400
  footnote:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "17px"
    fontWeight: 400
  story-body:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "24px"
    lineHeight: 1.24
  story-id:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
rounded:
  node: "20px"
  phone: "30px"
  phone-image: "25px"
  paper: "2px 2px 18px 2px"
spacing:
  page-inline: "64px"
  page-block: "52px"
  footer-bottom: "24px"
  section: "32px"
  diagram-row: "24px"
  gallery-gap: "56px"
components:
  slide:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    padding: "52px 64px"
    width: "1280px"
    height: "720px"
  client-node:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.node}"
    padding: "27px 28px"
  backend-node:
    textColor: "{colors.ink}"
    rounded: "{rounded.node}"
    padding: "25px 26px"
  phone-frame:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.phone}"
    padding: "5px"
    width: "222px"
    height: "434px"
---

# Design System: PlanIt — presentación

## Overview

**Creative North Star: "La agenda con luz difusa"**

Sistema reutilizable para las 54 diapositivas académicas de PlanIt, hasta el agradecimiento. La apertura reorganizada incorpora dos páginas de oportunidades, una por usuario, y alcance; se conservan las releases y el cierre de demo, evolución, conclusiones y agradecimiento. Extiende B · Amanecer de [DESIGN.md](../DESIGN.md): nombre, logo, familia local, fondo claro, tinta marina y luz violeta-azul. No reemplaza el sistema de la aplicación.

La escala cambia para proyección: títulos grandes, texto breve y espacio para la explicación oral. Las capturas prueban recorridos; el diagrama explica relaciones. El propósito del producto sigue definido en [PRODUCT.md](../PRODUCT.md), sin métricas ni ventajas comerciales inventadas. La composición de las 54 diapositivas vive en [DIRECTION.md](references/DIRECTION.md).

**Key Characteristics:**

- Una idea dominante por diapositiva y fondo claro continuo.
- Tipografía local con tracking negativo en títulos.
- Capturas de interfaz real con datos de prueba identificados.
- Diagrama con conectores SVG y revelado controlado por el presentador.

## Colors

Los valores normativos para esta superficie están en el frontmatter, extraídos de [styles/index.css](styles/index.css) y [styles/releases.css](styles/releases.css). El token CSS `--pi-soft` sigue declarado sin referencias; su valor coincide con la superficie lavanda que los post-its aplican directamente.

### Primary

- **Tinta marina:** titulares, lectura principal y marco de los teléfonos.
- **Azul eléctrico:** conexiones de transporte del diagrama.

### Secondary

- **Violeta profundo:** segunda parte de la marca, nota de arquitectura, énfasis y foco.
- **Lavanda de selección:** selección de texto con tinta encima.

### Neutral

- **Lavanda casi blanca:** lienzo continuo.
- **Blanco:** nodo del cliente, distinguido por superficie sin sombra.
- **Lavanda apagada:** detalles, pies y explicaciones secundarias.
- **Borde de control:** contorno del backend y divisor interno de Realtime.
- **Divisor translúcido:** separación académica y servicios de apoyo.

**The Light-Not-Fill Rule.** Las 54 diapositivas llevan fondos con luz azul-lavanda suave. Sin franja lateral. Los degradados se rasterizan en PNG opacos sRGB para estabilizar su aspecto en PDF; no se aplican a texto, nodos ni conectores. Los post-its usan superficies planas blancas, lavanda y azul claro.

## Typography

Una sola familia, Bricolage Grotesque, servida mediante `@font-face` desde `public/assets/fonts/bricolage-grotesque-latin-wght-normal.woff2`: variable normal de pesos 200–800, `font-display: swap`, fallback `sans-serif`. Slidev usa `provider: none`; no requiere un proveedor de fuentes externo.

El frontmatter fija marca, título, propósito, rótulo de captura, cuerpo, detalle y pie. No trasladar los tamaños móviles de la app directamente al proyector. Los rótulos de captura acompañan imágenes pequeñas; la comprensión del recorrido depende de esos rótulos y la voz del equipo, no de leer cada control de la captura desde el fondo del aula.

Variantes observadas del diagrama: título de cliente (44 px), backend (36 px), servicios (25 px, peso 650, tracking −0,025 em), conexiones (20 px, peso 650), apoyo (24 px, negrita). El estilo base de h2 es 34 px/700/1,12 y h3 es 26 px/650/1,15; los componentes aplican las variantes indicadas. En el diagrama, el texto secundario varía entre 18 y 22 px según su función. Estas variantes no sustituyen la jerarquía principal.

Las composiciones de `styles/extended.css` amplían la escala según la densidad: bajada de 25 px; equipo de 28 px/650 para nombres y 24 px para responsabilidades; áreas funcionales de 26 px y detalle de 20 px; cuerpo editorial de 23–28 px. Los conteos de planificación son de 100 px y los de requisitos de 104 px, con tracking −0,04 em. En el roadmap, año de 34 px, identificador de 25 px, nombre de 23 px/650/1,15 y fechas de 20 px con cifras tabulares. Son roles de exposición y datos documentales, no una nueva escala móvil.

En `styles/closing.css`, demo y agradecimiento recuperan la marca a 118 px/1 con tracking −0,04 em y logo de 104 px. La frase de demo usa 43 px y el propósito final 35 px. Evolución emplea introducción de 25 px, títulos de 29 px y cuerpo de 24 px. Conclusiones usa encabezados de 37 px/1,14 y cuerpo de 24 px/1,3, con énfasis violeta de peso 650. Recorrido e invitación a preguntas usan 29 px/600. Son variantes locales de cierre sobre la misma familia y paleta; no agregan tokens de identidad.

**The Projection Rule.** Para agregar contenido, dividir o resumir antes de reducir títulos, rótulos y cuerpo. Los 17 px corresponden a créditos o notas, no al argumento principal.

## Layout

Lienzo lógico de 1280 × 720, proporción 16:9, escalado como unidad por Slidev. Los márgenes del frontmatter dejan un área de contenido de 1152 × 616. No hay composición móvil independiente: la presentación conserva su proporción en pantalla y exportación.

- **Portada:** logo de 116 × 116, separado 28 px de la marca; grupo de marca a 82 px del encabezado. Propósito a 32 px, ancho máximo 950 px. Bloque académico anclado a 46 px del borde inferior, columnas `340px 1fr`, separación 55 px y línea superior con 23 px de padding.
- **Galería:** tres columnas iguales, margen `18px 40px 0`, separación del frontmatter; títulos centrados y detalle separado 3 px. Cada figura deja 15 px entre rótulo y teléfono.
- **Diagrama:** margen superior 32 px; columnas `325px 180px 1fr`, filas `345px 90px`, separación vertical 24 px. El transporte ocupa la columna central. Los servicios internos usan columnas `1fr 1.65fr 1fr`, gap 18 px. La banda de apoyo ocupa todo el ancho con columnas `1fr 1.2fr`, gap 60 px y padding superior 22 px.
- **Pie:** alineado a los márgenes laterales, posición inferior del frontmatter, nota a la izquierda y marca a la derecha.

**The Shared Edge Rule.** Alinear título, banda de apoyo y pie con los márgenes del lienzo. Reservar el pie antes de sumar contenido.

## Elevation & Depth

Predomina la profundidad tonal: blanco sobre lavanda y backend delimitado con borde. Los teléfonos llevan sombra suave (`0 16px 32px #24186e15`) y los post-its una sombra de papel (`0 9px 20px #24186e14`), ambas eliminadas al imprimir. No hay cristal ni desenfoque de paneles en el deck.

El layout compartido incorpora `deck-background`, una capa estática decorativa con `aria-hidden` y sin interacción. No hay franja lateral. Los fondos de 2560 × 1440 se generan con `scripts/render-backgrounds.mjs` desde `styles/background-source.css`, aplanados sobre #f6f5fd y con perfil sRGB. Se usan los mismos PNG en navegador e impresión; el texto permanece separado y seleccionable. Dos contornos SVG redondeados de 1,5 px quedan recortados en el margen superior derecho; un trazo complementario se asoma por abajo a la izquierda. No se copiaron recursos de Slidesgo.

La luz cambia con la composición: portada con lavanda arriba a la derecha, producto con un campo lavanda inferior que sostiene los teléfonos y arquitectura con luz azul superior y lavanda inferior. Los centros de lectura quedan claros. El nodo Supabase usa blanco al 93% para conservar su contraste. La referencia aporta el tratamiento de bordes y acentos; la paleta y la tipografía siguen siendo PlanIt.

## Shapes

Nodos de esquinas suaves, contorno del backend de 1 px y divisores finos. El teléfono usa radio exterior e interior coordinados por sus 5 px de padding. No se añaden botones o campos de formulario a la gramática de la presentación; los controles visibles pertenecen a las capturas de la app.

## Components

### Releases y post-its

`ReleaseCover`, `StoryBoard` y `ReleaseHighlights` consumen los datos de release y la transcripción oficial. `styles/releases.css` limita sus reglas a clases nuevas, conservando la cascada y los 52 px de los títulos iniciales.

Las portadas mantienen h1 de 52 px, nombre de release de 64 px, objetivo de 30 px y período de 23 px. Los cierres usan tres filas (incremento, dificultad, acuerdo), rótulos de 29 px y texto de 27 px. Ningún acuerdo de retrospectiva se rotula como solución ya aplicada.

Los tableros tienen 520 px de altura y composiciones distintas para tres, cuatro o cinco historias. Los papeles se inclinan entre −2° y +1,4°, con separación que protege el texto. Las superficies, cinta, radios y roles de texto están en el frontmatter; la sombra se describe en Elevation & Depth. Cada papel usa padding de 22 px, o 18 px en el tablero de cinco. La cinta mide 112 × 18 px y se asoma 9 px por encima del papel. La acción se destaca en peso 700 sin abreviar ni sustituir palabras. Los papeles son código CSS, no imágenes de texto.

Todas las historias están visibles por defecto, sin clics ni movimiento continuo. No reducir su cuerpo para hacer entrar otra historia; conservar las agrupaciones aprobadas. R1 usa dos páginas del mismo sprint. La impresión retira la sombra y mantiene texto seleccionable, inclinación y fondos.

### Composiciones académicas

`styles/extended.css` amplía el sistema, sin reemplazarlo: equipo con cinco filas de 28/24 px, agenda de seis temas en dos columnas, contextos y beneficios editoriales, áreas funcionales en dos columnas y procesos de cuatro etapas. Los conteos de 53 RF/218 CA y 7 releases/13 sprints/53 historias tienen función informativa explícita; no se usan como métricas comerciales.

`TeamRoster`, `FunctionalGroups` y `ReleaseRoadmap` reutilizan `data/deck.mjs`, fuente única de identidades, equipo y períodos. `SlideFooter` mantiene alineación y escala de los pies. La arquitectura se identifica por `architecture`, aunque cambie su posición en la secuencia.

El roadmap tiene dos filas cronológicas (2025, R0–R3; 2026, R4–R7), hitos SVG y nombres/fechas en texto HTML. El espaciado es secuencial y no representa duración proporcional. Mantener legibles las fechas completas y la aclaración de períodos de referencia. No copiar la carretera ni las versiones del PDF de referencia.

Su geometría reserva una columna de 100 px al año y 24 px de separación hasta la línea; cada fila distribuye cuatro períodos en columnas iguales con gap de 24 px. La línea SVG ocupa una banda de 24 px, con etiquetas debajo mediante padding superior de 35 px. El aviso de escala y aceptación se integra en un único `SlideFooter` para preservar una banda inferior independiente.

### Cierre académico

Las páginas 51–54 usan `styles/closing.css`, limitado a las clases del cierre y la nota de agenda. Demo y agradecimiento combinan el logo existente con marca grande y texto abierto. El recorrido de demo separa tres acciones mediante flechas SVG decorativas; la página es un separador para exposición en vivo.

Evolución organiza seis posibilidades en una grilla de dos columnas, con separación horizontal de 72 px y vertical de 25 px, divisores finos y 16 px de espacio antes de cada título. La introducción y el pie conservan su condición de propuestas futuras fuera de R1–R7. Conclusiones separa dos perspectivas con gap de 82 px y tres ideas por columna; las listas sin viñetas usan divisores, 20 px entre filas y 16 px de espacio superior. Se reserva la banda del pie. No hay nuevos papeles, paneles, imágenes ni animaciones.

### Marco de diapositiva

`layouts/planit.vue` contiene un `main` y aplica el lienzo común. Cada diapositiva conserva título y estructura semántica. El foco visible usa contorno violeta de 3 px con offset de 5 px.

### Captura de producto

`PhoneCapture.vue` recibe `src`, `alt`, `label` y `detail`. Una figura asocia leyenda e imagen. La imagen se muestra a 212 × 424 con `object-fit: cover` y posición superior; el archivo conserva proporción 390 × 780. Mantener el recorte consistente y el color natural. Los archivos en `public/assets/screenshots/` muestran la app local con fixtures; conservar esta aclaración en el pie y en las notas. El logo en `public/assets/logos/planit.svg` procede de la marca original, no de una recreación tipográfica.

### Diagrama y conectores

`ArchitectureDiagram.vue` agrupa cliente, transporte y backend; el contenedor aporta descripción accesible mediante `role="img"` y `aria-label`. `FlowConnector.vue` crea SVG decorativo (`aria-hidden`, sin foco), vista `0 0 120 24`, trazo de 2 unidades y punta de 6 × 6. El transporte ocupa 100 × 30 px; los conectores en texto, 34 × 16 px. HTTPS y apoyos son bidireccionales; Realtime apunta al cliente. Mantener dirección y etiquetas como parte del significado.

El diagrama tiene dos pasos de `v-click`: primero Realtime/WebSocket y luego servicios de apoyo. El deck usa transición `fade`; los pasos usan opacidad y desenfoque de 4 px durante 260 ms con `cubic-bezier(.16,1,.3,1)`. Con movimiento reducido se eliminan animaciones, transiciones y desenfoque, conservando el avance manual. Al imprimir, todos los pasos se hacen visibles y sin filtro. No ocultar contenido permanentemente ni añadir animación continua.

## Do's and Don'ts

### Do:

- **Do** reutilizar estos tokens y los componentes existentes para nuevas diapositivas de la misma familia.
- **Do** mantener etiquetas, fuente de evidencia y dirección de conexiones explícitas.
- **Do** verificar el lienzo completo y todos los pasos del diagrama antes de exportar.
- **Do** conservar notas del orador para detalle técnico y procedencia.

### Don't:

- **Don't** convertir esta adaptación de proyección en un cambio de tokens de la aplicación.
- **Don't** añadir otra familia, fondos oscuros o gradientes en texto y contenedores.
- **Don't** sustituir flechas SVG por glifos Unicode dependientes de la fuente.
- **Don't** presentar fixtures, capturas locales o existencia de código como aceptación remota o despliegue verificado.

## Ajuste inicial del 29/10/2026 (histórico: 53 páginas)

La apertura inicial de 53 páginas conserva Funcionalidades y Beneficios, elimina Escenario y añade dos oportunidades y alcance. Oportunidades: composición editorial de 330 px para el usuario y una columna de tres necesidades, con subtítulo de 38 px y textos de 26 px. Alcance: cuatro bloques abiertos en dos columnas, títulos de 30 px y cuerpo de 26 px. Las clases específicas de `styles/extended.css` mantienen la escala y los fondos existentes sin modificar las páginas conservadas.

## Alcance, limitaciones y esfuerzo relativo

Entrega de 54 páginas: Alcance y Limitaciones se separan, con dos bloques por página, títulos de bloque de 34 px y cuerpo de 28 px. Cada historia incorpora encabezado flexible con ID de 20 px y círculo de 36 px con cifra de 22 px, sin reducir el texto de 24 px. La leyenda usa el mismo componente que los post-its. `data/story-effort.mjs` reutiliza lavanda claro, selección lavanda, azul grisáceo, azul principal, violeta y marino; texto marino en los dos fondos claros y blanco en los cuatro oscuros. Colores con contraste ≥4,5:1. La talla es una equivalencia propuesta y los valores no son históricos ni horas.
