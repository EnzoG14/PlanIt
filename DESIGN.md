---
name: PlanIt
description: La agenda manda y el color es luz, no relleno: superficies claras, tinta marina y una mancha difusa violeta-azul.
colors:
  bg: "#f6f5fd"
  surface: "#ffffff"
  surface-glass: "rgba(255, 255, 255, 0.72)"
  surface-card: "rgba(255, 255, 255, 0.9)"
  surface-soft: "#f1eeff"
  ink: "#060b27"
  ink-hover: "#1b2250"
  text: "#060b27"
  text-muted: "#565f8a"
  text-on-wash: "#2f3664"
  primary: "#0753ff"
  violet: "#8d66fa"
  violet-deep: "#5b34d6"
  lavender: "#c5b5ff"
  focus: "#5b34d6"
  control-border: "#7a82a8"
  divider: "rgba(6, 11, 39, 0.08)"
  chip-bg: "#ece8ff"
  chip-text: "#4a2bc0"
  dock-text: "#adb7d8"
  scrim: "rgba(6, 11, 39, 0.5)"
  success-text: "#0a7a58"
  success-bg: "#d9f5ea"
  success-on-bg: "#064d39"
  info-bg: "#e7e0ff"
  info-on-bg: "#2a1a73"
  warn-bg: "#fff1d6"
  warn-on-bg: "#6b4300"
  danger-text: "#c0153a"
  danger-action: "#ce103d"
  danger-bg: "#ffe1e7"
  danger-on-bg: "#8a1030"
  disabled-bg: "#d9dbe8"
  disabled-text: "#4a527a"
  placeholder: "#6b7399"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title-lg:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 650
  action:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  input:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  caption:
    fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
rounded:
  pill: "999px"
  hero: "36px"
  sheet: "32px"
  card: "28px"
  card-compact: "26px"
  media: "20px"
  field: "16px"
  thumb: "16px"
  notice: "18px"
  bubble: "22px"
spacing:
  micro: "4px"
  tight: "8px"
  compact: "12px"
  base: "16px"
  page-inline: "20px"
  heading-inline: "24px"
  section: "30px"
  dock-clearance: "98px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  button-primary-persistent:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "56px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.danger-action}"
    textColor: "#ffffff"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "48px"
  button-disabled:
    backgroundColor: "{colors.disabled-bg}"
    textColor: "{colors.disabled-text}"
    rounded: "{rounded.pill}"
  filter-chip:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 17px"
    height: "44px"
  filter-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "44px"
  category-chip:
    backgroundColor: "{colors.chip-bg}"
    textColor: "{colors.chip-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "26px"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.input}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "52px"
  event-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "10px"
  event-row:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text}"
    rounded: "{rounded.card-compact}"
    padding: "12px 8px 12px 18px"
  glass-panel:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
  dock:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.dock-text}"
    rounded: "{rounded.pill}"
    height: "64px"
  dock-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "52px"
  bubble-incoming:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.bubble}"
  bubble-outgoing:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.bubble}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sheet}"
    padding: "26px 22px 22px"
---

# Design System: PlanIt

## Overview

**Creative North Star: "La agenda con luz difusa"**

PlanIt es una agenda de planes: la información —qué, cuándo, dónde, cuántos lugares quedan— manda, y el color es luz, no relleno. Una mancha difusa violeta→azul se asoma detrás del encabezado; sobre ella, tarjetas blancas translúcidas y tipografía grande con tracking negativo. El marino profundo ya no es el fondo: es la **tinta**. Dock, botones principales, burbujas propias y segmentos activos se dibujan en tinta, y por eso la acción siempre se reconoce.

La interfaz es clara, aireada y tipográfica. La fotografía de cada evento —de cualquier categoría y hora del día— sigue siendo contenido, con color natural y recorte consistente; la interfaz no la tiñe. Formularios, conversación y gestión priorizan la tarea con superficies blancas, bordes de control perceptibles y mensajes con texto.

**Key Characteristics:**

- Modo claro único: lavanda casi blanca, tarjetas blancas, tinta marina `#060b27` para acción y navegación.
- Azul `#0753ff` para filtros seleccionados, progreso y envío; violeta como luz de fondo y acento puntual (texto en `#5b34d6`).
- Mancha de color difusa sólo como atmósfera superior; nunca relleno de botones, tarjetas ni mensajes.
- Cristal suave (blanco translúcido con desenfoque) y sombras lavanda de baja opacidad para las capas que flotan.
- Píldoras: botones, segmentos, filtros, dock. Radios grandes (26–36 px) en tarjetas, hojas y portadas.
- Títulos de 32–40 px con tracking negativo; datos operativos siempre ≥ 13,5 px.
- Estados con texto, no sólo color; foco violeta visible de 3 px.

**Estado y autoridad — 12/10/2026.** El usuario aprobó la **dirección B · Amanecer** del [design-lab](design-lab/README.md) (comparada con A · Marea nocturna y C · Bento tonal) como sistema objetivo de PlanIt. Este documento la consolida y **reemplaza la dirección marina oscura v2.0** (que seguía al [shape R1–R3](docs/design/proposals/r1-r3-visual-evolution.md)). Ver [la decisión](docs/design/proposals/amanecer-direction.md). El frontmatter es la fuente normativa de tokens y asignaciones de componentes; [DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) desarrolla su aplicación y aceptación sin mantener otra paleta. Requisitos y arquitectura determinan el comportamiento.

**Este documento no afirma que Amanecer esté aplicado en la PWA.** El código vigente (`src/index.css`, el piloto Mis eventos y el resto de pantallas) todavía usa marino oscuro, CTA degradados y variables `--color-*` de la versión anterior. El [design-lab](design-lab/) (`design-lab/src/b/`) es el prototipo ejecutable de referencia: sus valores no son código desplegado, y donde difieren de este frontmatter manda el frontmatter (ver Colors → Desviaciones). El alcance son las pantallas implementadas de R1–R3 y componentes compartidos; no nuevas funciones R4–R7, cambios de rutas o backend.

## Colors

Los valores normativos están únicamente en el frontmatter. Estrategia: neutros lavanda fríos + una tinta marina + dos acentos usados con función clara. El color es luz (fondo) o señal (estado, selección); no decora controles.

### Primary

- **Tinta marina** (ink, `#060b27`): acción principal (botón, CTA persistente), dock, burbuja propia, segmento/día seleccionado, avatar base, insignias de conteo. Texto blanco encima (19,4:1). Hover: tinta elevada (ink-hover).
- **Azul eléctrico** (primary): filtro de estado seleccionado, relleno de barras de cupo, botón de envío del chat, barra de estado "publicado". Texto blanco encima (5,69:1).

### Secondary

- **Violeta luminoso** (violet, `#8d66fa`) y **Lavanda de luz** (lavender, `#c5b5ff`): luz de la mancha de fondo, pip de notificación, avatar de tono, conteo sobre día seleccionado. Violeta **sólo lleva texto tinta** (4,99:1); texto blanco sobre violeta da 3,88:1 y no se usa.
- **Violeta profundo** (violet-deep, `#5b34d6`): énfasis de texto (marca "P.", hora en lista, autor en chat, foco). 7,2:1 sobre blanco.
- **Etiqueta lavanda** (chip-bg + chip-text): categoría pasiva y icono-contenedor discreto (7,3:1).

### Neutral

- **Lavanda casi blanca** (bg): fondo de pantalla.
- **Blanco** (surface), **Cristal** (surface-glass .72) y **Tarjeta** (surface-card .9): inputs, diálogos, burbujas entrantes; paneles flotantes; tarjetas y filas de evento. **Lavanda suave** (surface-soft): vista previa seleccionada en el mapa.
- **Tinta de texto** (text), **Lavanda apagada** (text-muted `#565f8a`, 5,7:1 sobre bg) y **Texto sobre mancha** (text-on-wash `#2f3664`, 10,6:1): secundario en general / secundario sobre la mancha de color.
- **Borde de control** (control-border `#7a82a8`): contorno perceptible de inputs y controles con borde (3,76:1 sobre blanco, 3,47:1 sobre bg). **Placeholder** (`#6b7399`, 4,63:1 sobre blanco): texto de ayuda dentro de campos. **Divisor** (divider): separación decorativa.
- **Velo** (scrim): fondo de diálogos y hojas. **Dock-text** (`#adb7d8`): iconos inactivos del dock (9,7:1 sobre tinta).

### Semantic states

Éxito, información, aviso y error usan fondo pastel + texto oscuro del mismo tono + icono + texto (success-bg/success-on-bg, info-*, warn-*, danger-bg/danger-on-bg; todos ≥ 7,7:1). Texto de estado suelto: success-text sobre blanco 5,33:1, danger-text 6,16:1. Acción destructiva: danger-action sólido con texto blanco (5,58:1). Deshabilitado: disabled-bg/disabled-text (5,5:1) en lugar de reducir opacidad. Un estado nunca se expresa sólo con color o con la barra lateral de la fila.

### Desviaciones deliberadas respecto del lab

- control-border sube de `#8c93b8` (lab; 2,78:1 sobre bg) a `#7a82a8` para cumplir 3:1 contra el fondo y contra el campo.
- El violeta no lleva texto blanco pequeño (ver arriba).
- La barra lateral de estado "finalizado" (`#adb2cf`) es decorativa: el estado se lee por texto.

**The Light-Not-Fill Rule.** Color como luz (fondo difuso) o señal (selección, estado). No usar gradientes en botones, mensajes, chips, barras de cupo, tarjetas ni navegación. Se admiten únicamente: la mancha de fondo, el overlay discreto sobre una fotografía para legibilidad y el degradado de desvanecimiento de una barra de acción fija.

**The Ink Rule.** La acción es tinta. Una pantalla tiene un solo botón de tinta dominante; el azul señala selección de filtro, no acción.

**The Words Beside Color Rule.** Todo estado lleva texto o icono además de color.

## Typography

**Familia:** Bricolage Grotesque (con fallback Segoe UI, system-ui, sans-serif). **Carácter:** grotesca con personalidad, pesada en títulos y limpia en lectura; el contraste de tamaño entre títulos grandes y metadatos compactos hace de agenda.

Bricolage es una **fuente externa aprobada con la dirección B**. Se autoaloja (archivo variable subconjunto latino incluido en el build/PWA; `font-display: swap`); no se carga desde Google Fonts en producción. El fallback Segoe UI evita saltos de layout graves y mantiene legible la app sin la fuente. Agregar el archivo o paquete corresponde al bloque de implementación, no a esta documentación.

### Hierarchy

- **Display** (700, 40 px, 1.02, −0,035 em): saludo/pregunta de Inicio y título de pantalla principal (Mis eventos 38 px).
- **Headline** (700, 32 px, 1.05): título de detalle, nombre en perfil, cabeceras de subpantalla (hasta 34 px en detalle).
- **Title-lg** (700, 24 px): encabezado de sección ("Esta semana").
- **Title** (700, 19 px, 1.12): título de evento en tarjeta; 16,5–17 px en filas y vista previa.
- **Body** (400, 16 px, 1.5): descripción y lectura; máx. ~65 caracteres por línea en escritorio.
- **Meta** (400–600, 13,5 px): fecha, lugar y disponibilidad. Nunca menos de 13,5 px.
- **Label** (650, 14 px): etiquetas de campo, títulos de grupo, filtros 15 px.
- **Action** (700, 15 px; 16 px en CTA persistente).
- **Input** (400, 16 px). **Caption** (600, 12,5 px): insignias y marcas de hora; no para datos operativos.

Horas, conteos y cupos usan cifras tabulares (`font-variant-numeric: tabular-nums`).

**The Meta Floor Rule.** Fecha, lugar, disponibilidad y errores no bajan de 13,5 px para "hacerlos caber". Títulos largos envuelven (hasta 2–3 líneas con recorte accesible); el texto completo permanece consultable. No fijar alturas que recorten texto ampliado.

## Layout

Una columna móvil con 20 px de margen lateral (24 px para titulares). Cada pantalla de producto abre con encabezado compacto sobre la mancha, titular grande y contenido en tarjetas que respiran (12–14 px entre tarjetas, 30 px entre secciones). Navegación de pestañas: dock flotante inferior; subpantallas sin dock llevan botón volver y acción principal fija abajo.

- **Inicio:** marca, campana, saludo, titular grande y lista de eventos. La agenda por día (tira de 7 días con conteo) y las tarjetas rápidas son la composición visual del lab; su carácter de filtro/navegación requiere decisión funcional antes del bloque 4 (ver la decisión de dirección).
- **Mapa:** mapa real a pantalla completa, tarjeta de título flotante y hoja inferior con una vista previa seleccionada y pocas filas.
- **Mis eventos:** línea de tiempo: hora a la izquierda (52 px) y fila-tarjeta con barra de color por estado.
- **Detalle:** portada de ~300 px, titular, datos agrupados (fecha, lugar, cupo), descripción, organizador, galería y gestión; acción de participación fija abajo.
- **Escritorio:** columna central legible (~430–480 px) o grid cuando el contenido cabe; el dock permanece centrado. No es otra identidad. No convertir los breakpoints actuales en obligación universal.

**The Clear Path Rule.** Reservar espacio para el dock (≈ 98 px + safe area), foco y teclado. Una acción persistente no tapa contenido ni feedback. Fecha/hora se apilan cuando el control nativo no muestra todo el valor. El chat adapta encabezado, historial y composer a la altura disponible y mantiene errores alcanzables.

## Elevation & Depth

Sistema híbrido: tonal (blanco sobre lavanda) con cristal y sombras suaves color lavanda. La profundidad comunica jerarquía y capas, no adorno. El **cristal** es blanco translúcido con `backdrop-filter: blur(18px)` y borde blanco de 1 px; cuando el navegador no soporta `backdrop-filter` o el usuario pide menos transparencia (`prefers-reduced-transparency`), el panel pasa a blanco ≥ .94 sin desenfoque.

### Shadow Vocabulary

- **Tarjeta / cristal** (`0 10px 28px rgba(36, 24, 110, .08)`): tarjetas de evento, filas, paneles.
- **Portada** (`0 18px 40px rgba(36, 24, 110, .18)`): foto hero del detalle.
- **Hoja inferior** (`0 -14px 40px rgba(36, 24, 110, .16)`): hoja del mapa.
- **Dock** (`0 16px 36px rgba(6, 11, 39, .38)`): barra flotante de tinta.
- **Diálogo** (`0 30px 70px rgba(6, 11, 39, .35)`) sobre scrim con desenfoque de 3 px.

### La mancha (wash)

Tres manchas circulares desenfocadas (64 px): violeta `#8d66fa` (.58), azul `#0753ff` (.36) y lavanda `#c5b5ff` (.75), dentro de una banda superior de ~520 px enmascarada con degradado a transparente. Es atmósfera: `aria-hidden`, estática, sin animación, detrás del encabezado y de la primera sección. No va detrás de formularios largos ni de texto de lectura; el secundario sobre ella usa text-on-wash.

**The Single Wash Rule.** Una mancha por pantalla, en la parte superior. Nunca sobre el dock, dentro de tarjetas ni como fondo de botones.

**The Opaque Enough Rule.** El cristal se mide contra el peor caso detrás (el violeta intenso de la mancha): el texto debe cumplir 4,5:1 allí, no sobre el fondo ideal.

Movimiento: entrada escalonada breve (≈ 600 ms, ease-out expo `cubic-bezier(.16, 1, .3, 1)`, desplazamiento 12 px), transiciones de color de 200–250 ms y escala .94 al presionar píldoras. Con `prefers-reduced-motion: reduce` se eliminan desplazamientos y animaciones de entrada; los cambios de estado se conservan sin animación.

## Shapes

Forma de píldora para todo lo accionable (botones, segmentos, filtros, dock, insignias) y esquinas muy generosas para superficies: tarjeta 28 px, fila 26 px, vista previa 26 px, hoja y diálogo 32 px, portada 36 px, foto interior 20 px, miniatura 16 px, campo 16 px, aviso 18 px. Avatares y botones de icono circulares. Burbujas de chat 22 px con una esquina de 8 px del lado de autoría. Barra lateral de estado de 4 px con extremos redondeados dentro de la fila. Fotos con recorte consistente, sin deformación ni tinte.

No anidar tres niveles de radio alrededor de un mismo contenido: el radio interior = radio exterior − padding.

## Components

Los componentes del frontmatter describen el objetivo. Los snippets de `.impeccable/design.json` son ejemplos documentales, no código desplegado.

### Buttons

Principal: píldora de tinta con texto blanco, 48 px (46 px dentro de una tarjeta), 56 px de ancho completo para la acción persistente. Secundario: píldora transparente con borde de tinta de 1,5 px. Peligro: danger-action sólido (nunca azul ni tinta). Texto/icono: área mínima 44×44 px. Hover: tinta elevada / fondo blanco en secundario; pressed: escala .94. Foco: contorno violeta-deep de 3 px. Disabled usa disabled-bg/text y es distinto de loading (espera = feedback textual). Mantener bloqueo de doble envío y comprobación de resultado incierto.

### Chips y selección

Categoría pasiva (chip-bg/chip-text, 26 px): metadato, no botón. **Filtro** de estado: píldora de cristal de 44 px; seleccionado = azul sólido, con `aria-pressed`. **Segmento** (Organizo/Participo) y **día** seleccionado = tinta. Regla: *tinta* elige un modo o lugar en la agenda; *azul* aplica un filtro.

### Cards / Containers

Tarjeta de descubrimiento: foto 100×124 a la izquierda (media 20 px) con hora en insignia blanca, categoría, título 19 px, lugar y lugares libres. Una zona de apertura amplia (un solo enlace por tarjeta; las acciones como menú son aparte). Gestión: fila con miniatura 52 px, título, categoría · lugar, menú de 44 px y pie con estado (punto + texto) y cupo. **Una superficie por unidad**: dentro de una tarjeta se jerarquiza con espacio y texto, no con otra tarjeta. Sin foto o ante error: alternativa compacta con icono y mensaje; un placeholder no se agranda como portada.

### Inputs / Fields

Label visible 14 px/650, campo blanco de 52 px con borde control-border de 1,5 px, radio 16, texto de 16 px. Foco: contorno violeta de 3 px (offset 1). Error: borde danger-text de 2 px + mensaje 13,5 px/650 asociado con `aria-describedby`/`aria-invalid` y foco al primer inválido. Sin campos obligatorios eliminados. Fecha nativa completa o apilada.

### Navigation

**Dock flotante** de tinta (64 px, píldora, 18 px sobre el borde inferior, centrado): cuatro destinos —Inicio, Mapa, Mis eventos, Perfil— con icono lineal; el activo se expande a píldora blanca con icono y etiqueta, los inactivos son iconos de 52 px con nombre accesible y `aria-current`. Zonas de ≥ 44 px. Subpantallas: botón volver circular (48 px) y acción principal fija con degradado de desvanecimiento hacia bg para no cortar contenido. Autenticación con topbar propia.

### Dialogs, hojas y feedback

Diálogo y hoja en blanco sobre scrim; el destructivo confirma con danger-action. Foco inicial, retorno al disparador, Escape, controles alcanzables con poca altura. Avisos (ok/info/aviso/error) son bloques pastel con icono y texto. Carga, vacío, error y éxito se distinguen por mensaje y acción; el error de pantalla incluye recuperación real. Conservar datos locales ante fallo y las comprobaciones de resultado incierto.

### Event imagery, map and chat

Fotografía en Inicio y Detalle con color natural; texto sobre la foto sólo en insignias blancas casi opacas (hora, categoría, contador) y overlay discreto superior/inferior para los botones. Eventos de cualquier categoría y hora; galería hasta diez imágenes; contenido autorizado, nunca recortes de collages. Mapa real (Mapbox) con tema claro, controles distinguibles, atribuciones y marcadores azul/violeta con anillo de tinta; la lista sigue útil si el mapa tarda o falla. Chat: entrantes blancas, salientes de tinta, autor en violeta-deep y hora legible, composer de cristal con contador y botón de envío azul.

## Do's and Don'ts

### Do:

- **Do** usar tinta marina para la acción y la navegación; azul para filtros seleccionados y progreso.
- **Do** dejar que el color sea luz: una mancha superior por pantalla y superficies blancas debajo del contenido.
- **Do** jerarquizar con tamaño de título, espacio y divisores finos antes de añadir un contenedor.
- **Do** medir contraste contra el peor caso (cristal sobre violeta, texto sobre foto) y acompañar todo estado con texto o icono.
- **Do** cuidar dock, safe areas, foco violeta de 3 px, targets de 44 px y texto ampliado.
- **Do** conservar funciones, privacidad, validaciones y datos del contrato vigente, y distinguir este objetivo del código aún sin migrar.

### Don't:

- **Don't** usar gradientes en botones, tarjetas, chips, mensajes o barras; el degradado violeta→azul del CTA anterior queda retirado.
- **Don't** poner texto blanco pequeño sobre violeta, ni la mancha detrás de formularios o de lectura larga.
- **Don't** anidar tarjetas ni mostrar el mismo evento en varios contenedores a la vez.
- **Don't** convertir chips de categoría en botones ni dibujar funciones de futuras releases (favoritos, entradas, filtros nuevos, métricas inventadas).
- **Don't** teñir fotografías ni limitar el catálogo visual a eventos nocturnos; no copiar fotos de los collages ni de las ilustraciones SVG del lab.
- **Don't** cargar la fuente desde un CDN en producción ni añadir otra familia.
- **Don't** reintroducir el marino oscuro como fondo de pantalla, ni un tema oscuro, en esta etapa.
- **Don't** cambiar branding, rutas, backend o reglas de negocio al aplicar este sistema.
