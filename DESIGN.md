---
name: PlanIt
description: Fotografía expresiva, superficies marinas y claridad al operar.
colors:
  bg: "#060b27"
  bg-elevated: "#0d1638"
  field: "#151d3e"
  border: "#303d70"
  control-border: "#65749e"
  text: "#f8f8ff"
  text-muted: "#adb7d8"
  primary: "#0753ff"
  purple: "#8d66fa"
  focus: "#c5b5ff"
  nav-bg: "#090f2b"
  chip-bg: "#172454"
  chip-text: "#c5d5ff"
  error-text: "#ffb9c7"
  error-border: "#78405b"
  success: "#13cb92"
  danger: "#ff526c"
  danger-action: "#ce103d"
typography:
  headline:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.5px"
  title:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  input:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  action:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 650
  caption:
    fontFamily: "'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  small: "8px"
  thumbnail: "10px"
  control: "12px"
  card: "16px"
  desktop-nav: "20px"
  pill: "999px"
spacing:
  micro: "4px"
  tight: "8px"
  compact: "12px"
  base: "16px"
  form-gap: "18px"
  page-inline: "20px"
  section: "24px"
  heading-gap: "28px"
  page-top: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "white"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
    height: "52px"
    width: "100%"
  button-danger:
    backgroundColor: "{colors.danger-action}"
    textColor: "white"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
    height: "52px"
  button-primary-disabled:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.small}"
    padding: "8px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    typography: "{typography.input}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  category-chip:
    backgroundColor: "{colors.chip-bg}"
    textColor: "{colors.chip-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  event-card:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
  compact-event-card:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "12px"
  navigation:
    backgroundColor: "{colors.nav-bg}"
    textColor: "{colors.text-muted}"
  dialog:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
---

# Design System: PlanIt

## Overview

**Creative North Star: "Fotografía expresiva, interfaz marina y sobria"**

PlanIt conserva su identidad dark-first y sus acentos azul/violeta. El contenido del evento aporta energía y contexto; la interfaz organiza la información y permite actuar. La fotografía es protagonista al descubrir y consultar eventos. Formularios, conversación y gestión priorizan la tarea, con encabezados compactos y jerarquías legibles.

Las superficies son planas en reposo. Espacio, contraste tonal y divisores separan secciones; menús y diálogos tienen elevación funcional. El escritorio amplía la composición sin convertirse en otra identidad.

**Key Characteristics:**

- Marino uniforme, azul para acciones y selección, violeta como acento puntual.
- Fotografías de color natural; información debajo de la imagen por defecto.
- Botones sólidos, controles distinguibles y foco visible, sin halos ornamentales.
- Una unidad visual por evento; filas y divisores para gestión, sin tarjetas anidadas.
- Usabilidad móvil, feedback accesible y recuperación de errores como parte del diseño.

**Estado y autoridad — 12/10/2026.** Sistema objetivo aprobado por el usuario a partir del [shape R1–R3](docs/design/proposals/r1-r3-visual-evolution.md). Este documento consolida la dirección acordada; no afirma que esté aplicada en la PWA. El frontmatter es la fuente normativa de tokens y asignaciones de componentes. [DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) desarrolla su aplicación y aceptación sin mantener otra paleta. Requisitos y arquitectura determinan el comportamiento; los mockups originales siguen siendo referencia de identidad salvo los cambios visuales aquí aprobados.

La implementación aún contiene CTA y burbujas degradadas, fondos radiales, halos y variantes locales. La [auditoría](docs/design/audits/2026-10-12-interface.md) y sus capturas conservan esa evidencia. No confundir el objetivo con el código existente. El alcance son pantallas implementadas de R1–R3 y componentes compartidos; no nuevas funciones R4–R7, cambios de navegación o backend.

## Colors

Los valores normativos están únicamente en el frontmatter. Las rampas del sidecar son interpolaciones de referencia, no tokens adicionales aprobados ni colores ya implementados.

### Primary

- **Azul eléctrico** (primary): relleno sólido de la acción principal, selección y marcadores. Texto blanco sobre este relleno; comprobar variantes y estados antes de aplicarlos.

### Secondary

- **Violeta luminoso** (purple): identidad y énfasis secundario puntual. No es un relleno universal para texto blanco pequeño ni un borde obligatorio de toda tarjeta o diálogo.
- **Lavanda de foco** (focus): indicador visible de teclado; se adapta al contraste del mapa o fotografía sin convertirse en glow.

### Neutral

- **Marino medianoche** (bg): fondo uniforme.
- **Marino elevado** (bg-elevated): unidad de evento cuando requiere superficie, menú y diálogo.
- **Marino de campo** (field): entradas y acciones secundarias.
- **Borde azul lavanda** (border): divisores y bordes decorativos; no identifica por sí solo campos editables.
- **Borde de control** (control-border): delimitación perceptible de inputs y controles que necesitan contorno.
- **Blanco lavanda** (text) y **Lavanda suave** (text-muted): contenido principal y secundario.
- **Marino de navegación** (nav-bg): barra inferior.
- **Azul de etiqueta** (chip-bg) y **Lavanda de etiqueta** (chip-text): categoría pasiva o énfasis discreto de selección.

### Semantic states

Error usa error-text y error-border, acompañado de explicación. Success y danger identifican estados con texto o icono, nunca sólo por color. Danger-action es el relleno sólido para confirmar una acción destructiva con texto blanco; danger se reserva para texto/iconos sobre fondo oscuro.

Control-border es un token objetivo nuevo, pendiente de llevar a CSS: su contraste calculado es 3,56:1 contra field y 4,19:1 contra bg. Danger-action reutiliza el extremo oscuro del rojo ya presente en el código; como relleno sólido da 5,58:1 con blanco. Estas mediciones de pares no certifican el conjunto de la interfaz.

**The Purposeful Color Rule.** Color para acción, selección, identidad o estado. No usar gradientes en botones, mensajes, chips, barras de cupo, navegación ni bloques informativos. Un overlay fotográfico discreto sólo se admite si aporta legibilidad.

## Typography

Una familia de sistema: Segoe UI, system-ui, sans-serif. No incorporar una fuente externa ni atribuir a los mockups una familia exacta desconocida.

Los roles nominales del frontmatter conservan la base existente: headline para pantalla, title para evento/sección, body para lectura, input para campos, label para etiquetas, action para acciones y caption para metadatos breves. La jerarquía depende de tamaño, peso y espacio, sin tracking decorativo ni mayúsculas obligatorias.

Inputs conservan texto de 16 px. No relegar fecha, lugar, disponibilidad o errores a caption para hacerlos caber. Caption no debe convertirse en la tipografía general de la app. Títulos y textos largos pueden envolver; el truncamiento requiere una forma accesible de consultar el contenido completo. No fijar alturas que recorten texto ampliado.

## Layout

Una columna legible en móvil. En descubrimiento, foto, título y metadatos forman una unidad; en gestión, filas compactas permiten comparar. El detalle aproxima fecha, ubicación, disponibilidad y acción de participación; descripción y organización tienen una jerarquía posterior sin omitir datos.

Inicio mantiene las agrupaciones por categoría actuales. Mapa conserva la exploración geográfica y usa una columna legible de resultados en móvil. No añadir búsqueda, filtros o un toggle Mapa/Lista de releases posteriores ni cambiar la ruta inicial. Las decisiones por pantalla viven en el shape aprobado, no en nuevos requisitos globales.

Los radios y espacios del frontmatter son medidas nominales heredadas, no una rejilla rígida. Mantener límites de lectura de los formularios y aprovechar grid en escritorio cuando haya ancho suficiente. No convertir los breakpoints actuales en una obligación universal: la composición debe responder al contenido.

**The Clear Path Rule.** Reservar espacio para navegación inferior, safe areas, foco y teclado. Una acción persistente no tapa contenido ni feedback. Fecha/hora se apilan cuando el control nativo no puede mostrar todo el valor. Chat adapta encabezado, historial y composer a la altura disponible y mantiene errores alcanzables.

## Elevation & Depth

Superficies planas en reposo. Diferenciar con espacio, un divisor o contraste tonal; usar una superficie elevada sólo cuando representa una unidad o una capa real. No envolver cada sección de detalle o cada fila dentro de una tarjeta independiente.

La sombra discreta de menú existente puede separar contenido superpuesto. El backdrop de diálogo delimita la modalidad sin glassmorphism. Retirar fondos radiales, halos de selección, aros luminosos y sombras que sólo decoran. Selección y foco se distinguen con contorno, color y semántica.

**The Single Surface Rule.** Una unidad visual por evento o bloque interactivo. Dentro, jerarquizar con espacio y texto antes de añadir otro contenedor.

Los estados deben dar feedback inmediato; no inventar tiempos de animación normativos sin necesidad. Si se introduce movimiento, respetar prefers-reduced-motion con una alternativa que preserve los cambios de estado y la comprensión.

## Shapes

Conservar controles suavemente redondeados, fotos/tarjetas con radio mayor y pills sólo donde ayudan a reconocer categorías o filtros existentes. Los radios se definen en el frontmatter. Avatares circulares y marcadores de mapa mantienen su función; reducir emblemas grandes y aros decorativos.

Fotos con recorte consistente, sin deformación ni tinte azul/violeta obligatorio. La geometría de chat distingue autoría sin necesitar degradados. No mezclar varios niveles de bordes redondeados alrededor de un mismo contenido.

## Components

Los componentes del frontmatter describen el objetivo. Los snippets de .impeccable/design.json son ejemplos documentales del sistema aprobado, no código desplegado ni evidencia de migración.

### Buttons

Principal: azul sólido, texto blanco, radio de control y altura nominal mínima de 52 px. Ancho completo en formularios cuando facilita la tarea; no exigirlo a toda acción. Secundario: superficie field y contorno perceptible. Texto: fondo transparente con área táctil mínima de 44×44 px. Peligro: danger-action sólido, sin degradado rojo ni reutilizar el azul primario.

Hover y pressed dan feedback por contraste o contorno, sin brillo ni desplazamiento ornamental. Foco lavanda visible. Disabled y loading son estados distintos: espera implica feedback textual; indisponibilidad no implica cursor de espera. Mantener bloqueo de doble envío, confirmaciones y comprobación de resultado incierto.

### Inputs / Fields

Label visible, texto de 16 px, superficie field, borde control-border y altura mínima nominal de 52 px. Icono sólo cuando ayuda y no roba espacio al valor; la fecha nativa debe caber. Errores asociados mediante aria-describedby y aria-invalid, con mensaje cercano y foco en el primer campo inválido. No eliminar campos obligatorios del contrato.

### Chips

Categorías pasivas son metadatos, no botones. Evitar repetirlas cuando el encabezado de sección ya comunica la misma categoría. Filtros existentes tienen área táctil mínima de 44 px y selección sólida, acompañada de su estado semántico; no agregar filtros por dibujarlos.

### Cards / Containers

Descubrimiento: fotografía natural, título, fecha y lugar con una zona amplia y clara de apertura, sin enlaces anidados o paradas duplicadas de teclado innecesarias. Texto debajo de la foto por defecto. Gestión: miniatura compacta, información y acciones separadas en una fila; divisores o una superficie continua antes que tarjetas anidadas.

Sin foto o ante error, alternativa compacta con icono y mensaje; un placeholder no ocupa el protagonismo de una imagen real. No imponer una altura hero fija a ese estado ni presentar fiestas ficticias como eventos disponibles.

### Navigation

Conservar Inicio, Mapa, Mis eventos y Perfil según sesión y rutas existentes. Icono lineal y etiqueta, estado activo mediante color/superficie sólida y aria-current. Sin degradado ni halo. Mantener zonas activables de 44 px como mínimo; la base actual usa enlaces de 56 px de altura. Header compacto y autenticación con topbar propia.

### Dialogs and feedback

Diálogo nativo con superficie elevada, foco inicial, retorno al disparador y controles alcanzables con poca altura. El borde de control es neutral; violeta no es un contorno obligatorio. No usar emblemas grandes para llenar el diálogo.

Carga, vacío, error y éxito se distinguen por mensaje y acción. Errores locales permanecen junto a la tarea; error de pantalla incluye recuperación real. Éxito es breve y anunciado. Conservar datos locales ante fallo de guardado y las comprobaciones existentes ante resultado incierto. Una tarjeta decorativa no sustituye estos comportamientos.

### Event imagery, map and chat

Fotografía protagonista en Inicio y Detalle, acotada para no desplazar toda la decisión de participación. Representar eventos de distintas categorías, nocturnos y diurnos, con fotos autorizadas; nunca recortar fotografías de los collages como contenido real. Galería conserva el límite vigente de hasta diez imágenes.

Mapa real con controles distinguibles, atribuciones y marcadores azul/violeta sin halos ornamentales. La lista continúa siendo útil durante carga o error del mapa. No reemplazar el proveedor desde una tarea documental.

Chat: entrantes marinos y salientes sólidos con contraste suficiente. Mantener autoría y hora legibles sin dar igual peso a todos los metadatos. Composer, contador y errores alcanzables; anunciar novedades sin releer toda la carga inicial. No añadir herramientas, adjuntos o estados no implementados.

## Do's and Don'ts

### Do:

- **Do** conservar marino, azul y violeta, reservando el color para roles claros.
- **Do** dar protagonismo a fotografía autorizada en descubrimiento y a la tarea en gestión.
- **Do** separar secciones con espacio/divisores y usar una sola superficie por unidad.
- **Do** comprobar contraste, foco, tacto, texto ampliado, safe areas y altura reducida.
- **Do** conservar funciones, privacidad, validaciones y datos del contrato vigente.
- **Do** distinguir este objetivo aprobado de las capturas y CSS todavía sin migrar.

### Don't:

- **Don't** usar gradientes decorativos, halos o tarjetas anidadas para expresar identidad.
- **Don't** limitar la fotografía y el contenido a fiestas nocturnas.
- **Don't** agrandar placeholders hasta que dominen la pantalla.
- **Don't** convertir chips pasivos en acciones ni dibujar funciones de futuras releases.
- **Don't** copiar fotografías, círculos, numeración o títulos exteriores de los collages.
- **Don't** cambiar branding, rutas, backend o reglas de negocio al aplicar este sistema.
