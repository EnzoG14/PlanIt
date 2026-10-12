# PlanIt — Sistema visual aprobado (v3.0 · Amanecer)

**Aprobación:** 12/10/2026, dirección **B · Amanecer**. **Actualización tras PR #27:** Mis eventos está implementada y fusionada en `main` (cb5a249). El bloque 0.5 extrae la fundación compartida sin rediseñarla; las demás pantallas siguen pendientes. Las capturas marinas se conservan como historia; `my-events/after/` representa Amanecer. Ver [workflow](UI_WORKFLOW.md) y [evidencia de fundación](verification/ui-refresh/amanecer-foundation/README.md).

## 1. Autoridad y relación entre documentos

[DESIGN.md](../../DESIGN.md) es la fuente normativa de tokens, roles visuales y componentes. Este documento explica su aplicación en PlanIt y sus criterios de aceptación; no define una segunda paleta ni recetas CSS. La [decisión de dirección](proposals/amanecer-direction.md) registra por qué se eligió B, qué cambia respecto de v2.0 y qué elementos del lab requieren decisión funcional. El [shape R1–R3](proposals/r1-r3-visual-evolution.md) conserva los objetivos de jerarquía por pantalla; sus decisiones visuales marinas quedan reemplazadas.

El [design-lab](../../design-lab/README.md) (`/b`) es el prototipo ejecutable: sirve para ver composición, estados y movimiento, pero no es código de producción ni fuente de tokens. Sus datos son ficticios y sus fotos, ilustraciones SVG.

Los RF/CA, arquitectura y modelo de datos determinan qué hace la aplicación. Los [mockups R1–R7](SCREENS.md) quedan como referencia histórica de contenido y funciones, no de apariencia. El alcance actual es R1–R3 ya implementado, incluidas reincorporaciones y componentes compartidos; no autoriza SQL, cambios de rutas ni nuevas funciones. R4–R7 requerirán su propio alcance funcional.

## 2. Identidad y dirección

**La agenda con luz difusa.** Claro, aireado y tipográfico: la información manda y el color es luz, no relleno. El marino es la tinta de la acción y la navegación; azul y violeta conservan su familia con roles nuevos.

- **Luz:** una mancha difusa violeta→azul detrás del encabezado de la pantalla; sólo fondo.
- **Tinta:** botones principales, dock, burbujas propias, segmentos y día seleccionados. Texto blanco encima.
- **Azul:** filtro de estado seleccionado, barras de cupo, envío de chat.
- **Superficies:** blanco y blanco translúcido (cristal) con sombras lavanda suaves; una superficie por unidad.
- **Forma:** píldoras para lo accionable; radios de 26–36 px en tarjetas, hojas y portadas.
- **Fotografía:** color natural, sin tinte, de cualquier categoría y hora del día.
- Se conservan el nombre, el logo, los iconos lineales y las cuatro pestañas. Sin tema oscuro en esta etapa.

## 3. Tokens y accesibilidad

Valores y asignaciones exactos: [frontmatter de DESIGN.md](../../DESIGN.md). Implementación central en `src/styles/tokens.css`, namespace `--pi-*`; no copiar una paleta normativa paralela. Los nombres del lab no son API de producción. `src/styles/amanecer.css` activa los patrones bajo `.amanecer-shell`; los adaptadores `--color-*`/`--gradient-primary` permanecen acotados hasta migrar sus consumidores. No sustituir las variables heredadas globales antes de completar las pantallas pendientes.

| Rol | Token | Aplicación |
|---|---|---|
| Fondo | bg | Lavanda casi blanca |
| Superficies | surface / surface-card / surface-glass / surface-soft | Campos y diálogos / tarjetas y filas / paneles flotantes / vista previa seleccionada |
| Tinta | ink / ink-hover | Acción principal, dock, burbuja propia, selección de modo |
| Selección de filtro | primary | Azul sólido |
| Luz y acento | violet / violet-deep / lavender | Mancha, pip, acento de texto, foco |
| Texto | text / text-muted / text-on-wash | Principal / secundario / secundario sobre la mancha |
| Contorno de control | control-border | Inputs y controles con borde |
| Divisor | divider | Separación decorativa |
| Categoría | chip-bg / chip-text | Metadatos pasivos |
| Navegación | ink / dock-text / surface | Dock, iconos inactivos, píldora activa |
| Estados | success-* / info-* / warn-* / danger-* | Avisos pastel con icono y texto |
| Acción destructiva | danger-action | Relleno rojo con texto blanco |
| Deshabilitado | disabled-bg / disabled-text | Sustituye a la opacidad |

**Contraste calculado de pares clave** (no acredita el conjunto de la interfaz): ink/bg 17,9:1 · text-muted/bg 5,7:1 · text-on-wash/bg 10,6:1 · blanco/primary 5,69:1 · violet-deep/blanco 7,2:1 · blanco/danger-action 5,58:1 · success-text/blanco 5,33:1 · chip-text/chip-bg 7,3:1 · dock-text/ink 9,7:1 · control-border/blanco 3,76:1 y /bg 3,47:1 (≥ 3:1 para delimitar controles). Avisos pastel ≥ 7,7:1. **Violeta sólo con texto tinta (4,99:1)**: blanco sobre violeta da 3,88:1.

Texto normal ≥ 4,5:1; elementos necesarios para reconocer controles ≥ 3:1. Comprobar estados, cristal sobre el violeta de la mancha y texto sobre fotografías; ningún par aislado acredita cumplimiento global.

## 4. Tipografía, formas y densidad

**Bricolage Grotesque** con fallback Segoe UI y system-ui. Es una fuente externa aprobada con la dirección: se autoaloja (variable, subconjunto latino, `font-display: swap`, incluida en el precache de la PWA) y no se carga desde un CDN. Roles: display 40, headline 32, title-lg 24, title 19, body 16, meta 13,5, label 14, action 15, input 16 y caption 12,5 (insignias y horas). Cifras tabulares para horas y conteos.

Fecha, lugar y disponibilidad no bajan de 13,5 px. Campos a 16 px con label visible y errores cercanos. Títulos largos envuelven; el contenido completo debe seguir consultable. Radios, espacios y alturas del frontmatter son medidas nominales, no una cuadrícula rígida; no fijar alturas que recorten texto ampliado.

## 5. Aplicación por pantalla implementada

| Pantalla | Jerarquía objetivo en Amanecer |
|---|---|
| Inicio | Marca y campana, saludo con el nombre visible, titular grande y lista de tarjetas con foto lateral (hora, categoría, título, lugar y lugares libres). La tira por día y las tarjetas rápidas del lab requieren decisión funcional ([§4 de la decisión](proposals/amanecer-direction.md)); mientras tanto se conserva la agrupación actual |
| Mapa | Mapa real a pantalla completa con tema claro; tarjeta de título de cristal; hoja inferior con una vista previa seleccionada y pocas filas; ubicación como botón circular de tinta |
| Detalle | Portada de ~300 px con volver, contador de fotos y categoría en insignias blancas; titular; datos de fecha, lugar y cupo agrupados con barra azul; descripción, organizador, galería y gestión después. Acción de participación fija abajo con estados: unirme, inscripto, cupo completo, removido, en revisión, finalizado y organizador |
| Ingresar / Crear cuenta | Topbar propia, encabezado compacto, campos blancos con label y borde de control, píldora de tinta de ancho completo. Validación y confirmación de correo preservadas |
| Crear / Editar | Subpantalla sin dock: formulario con títulos de sección, campos de 52 px, errores asociados, fecha/hora apilables y portada compacta; publicar como acción fija. Un aviso de publicación por confirmar |
| Mis eventos | Titular y botón de crear; segmento Organizo/Participo (tinta); filtros de estado (azul seleccionado); línea de tiempo con hora a la izquierda y filas con barra por estado, miniatura, menú y pie con estado en texto y cupo; vacío específico |
| Galería | Fotografías como superficie principal, portada identificable, ordenar/quitar con áreas de 44 px; carga compacta |
| Asistentes / Reincorporaciones | Segmento Confirmados/Removidos, búsqueda y filas con avatar, identidad y menú; solicitudes con tarjeta por solicitud y aprobar/rechazar con confirmación; participación y solicitud diferenciadas |
| Chat | Cabecera de cristal con volver, entrantes blancas con autor en violeta, salientes de tinta, composer de cristal con contador y envío azul; modo lectura con aviso |
| Mi perfil | Avatar, nombre y usuario primero; biografía como contenido; cuenta (correo, Mis eventos, Notificaciones, Cerrar sesión) como lista. Sin contadores ni accesos inventados |
| Notificaciones | Lista agrupada por día; fila con icono, tipo, título, texto, hora y estado leído/no leído en palabras; acciones con 44 px |

La lista fotográfica en Inicio y la portada en Detalle son la experiencia visual principal; Mapa conserva su destino y tarea. No cambiar la ruta inicial ni añadir búsqueda, filtros o el toggle Mapa/Lista de R4.

## 6. Componentes, estados y reutilización

Reutilizar AppLayout, ScreenHeader, FormField, StatusMessage, EventCard/CompactEventCard, AccountMenu y diálogos cuando su responsabilidad coincida. `GradientButton` conserva nombre y API: tinta sólida bajo `.amanecer-shell`, degradado heredado fuera de ella hasta la migración de cada pantalla. No crear una biblioteca extensa ni incorporar un UI kit. Los campos y ScreenHeader tienen estilos opt-in preparados; su composición debe revisarse en el bloque correspondiente.

- **Acciones:** principal de tinta; secundaria con borde de tinta; peligro rojo sólido; texto/icono con área de 44 px. Diferenciar disabled de loading y mantener el bloqueo de doble envío.
- **Selección:** tinta para modo o lugar en la agenda (segmentos, día); azul para filtros (`aria-pressed`). Chips de categoría son metadato pasivo.
- **Campos:** label visible, borde de control, foco violeta de 3 px y errores asociados; iconos sólo si ayudan y sin recortar valores nativos.
- **Tarjetas y filas:** una unidad de evento; apertura amplia con un solo enlace; acciones como menú aparte. Sin tarjetas anidadas.
- **Navegación:** dock flotante de tinta. Activo = píldora blanca con etiqueta; inactivos = iconos con nombre accesible. Reservar ≈ 98 px + safe area.
- **Diálogos y hojas:** modalidad nativa o equivalente accesible, foco inicial y retorno, Escape, scroll y controles alcanzables con poca altura; scrim con velo marino.
- **Feedback:** avisos pastel con icono y texto; carga breve y estable; vacío específico; error contextual con recuperación real; éxito breve y anunciado.
- **Movimiento:** entrada escalonada breve y transiciones de 200–250 ms; con `prefers-reduced-motion` se eliminan desplazamientos y se conserva el cambio de estado.
- **Cristal:** con fallback opaco cuando no hay `backdrop-filter` o se pide menos transparencia; limitar su uso en listas largas por rendimiento móvil.

Los errores de carga de pantalla también necesitan una recuperación efectiva; una mejora estética de StatusMessage no resuelve una descarga fallida de una ruta diferida.

## 7. Fotografía, mapa y contenido

Fotografía de color natural, recorte consistente y sin deformación. Texto sobre foto sólo en insignias blancas casi opacas (hora, categoría, contador) y botones sobre portada con overlay discreto; verificar con fotos claras, oscuras y cargadas. Hasta diez imágenes por evento. Sin foto o ante error: alternativa compacta e informativa, no un hero ficticio. No usar imágenes de collages ni las ilustraciones SVG del lab como contenido real.

La PWA usa Mapbox: mantener mapa geográfico real con estilo claro compatible con la paleta, atribuciones, controles distinguibles y lista útil si el mapa carga o falla. Marcadores azul/violeta con anillo de tinta. El dibujo del lab no sustituye datos ni autoriza cambiar de proveedor.

Fixtures y capturas de prueba permanecen identificados como tales.

## 8. Mobile-first y aceptación futura

- Una columna móvil; grid o columna central en escritorio sólo cuando el contenido cabe.
- Áreas activables ≥ 44×44 px; foco visible; orden de teclado; etiquetas accesibles, incluidos los iconos del dock.
- Safe areas y reserva para el dock; ni CTA persistentes ni menús tapan contenido, foco o mensajes. La barra de acción fija usa un desvanecimiento para no cortar texto.
- Fecha/hora apiladas cuando el valor nativo no cabe. Chat adaptado al teclado y poca altura con contador y errores alcanzables.
- Probar títulos largos/sin espacios, textos extensos, fotos/avatares ausentes, galerías de 0/1/10 imágenes y listas de distinta longitud.
- Comprobar 320, 375, 390, 768 y 1280 px, texto aumentado y altura reducida; overflow del documento y recortes internos.
- Verificar la fuente autoalojada (carga, fallback, FOIT/FOUT), `prefers-reduced-motion`, `prefers-reduced-transparency` y contraste del cristal sobre la mancha.
- Probar teclado, lector de pantalla y dispositivos reales (gestos del mapa, teclado móvil, safe areas, rendimiento del desenfoque). La emulación no los acredita.

Contrastar la implementación con la dirección y el lab sólo en los rasgos aprobados. No exigir fidelidad pixel-perfect al lab ni a los collages; el póster externo (círculos, numeración, títulos R1/R2/R3) nunca forma parte de la app. Los pendientes de la [auditoría](audits/2026-10-12-interface.md) siguen abiertos hasta corregirlos y verificarlos. No declarar la UI migrada, probada o aceptada por actualizar documentos.

## 9. Registro y mantenimiento

- **v1.0:** referencia original de mockups y tokens aproximados; CTA degradados y superficies iluminadas.
- **v2.0 — 12/10/2026:** evolución marina R1–R3: fotografía protagonista, botones azules sólidos, superficies planas. Reemplazada.
- **v3.0 — 12/10/2026:** dirección **B · Amanecer** aprobada tras comparar A, B y C en el design-lab: modo claro, tinta marina, mancha difusa, cristal suave, píldoras y Bricolage Grotesque. Tokens consolidados en DESIGN.md; aplicación pendiente.

Mantener [.impeccable/design.json](../../.impeccable/design.json) alineado con DESIGN.md; sus snippets son ejemplos del objetivo, no CSS desplegado. Antes de implementar, consultar este documento, DESIGN.md, la decisión de dirección, SCREENS.md (sólo funciones), DESIGN_GAPS.md y los requisitos aplicables; ante conflicto visual, Amanecer reemplaza las reglas marinas anteriores que contradice.
