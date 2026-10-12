# PlanIt — Sistema visual aprobado (v2.0)

**Aprobación:** 12/10/2026, evolución visual de pantallas implementadas R1–R3. **Implementación:** pendiente. Esta actualización es documental; la PWA y las capturas existentes todavía representan el sistema anterior.

## 1. Autoridad y relación entre documentos

[DESIGN.md](../../DESIGN.md) es la fuente normativa de tokens, roles visuales y componentes. Este documento explica su aplicación en PlanIt y sus criterios de aceptación; no define una segunda paleta o receta CSS. El [shape aprobado](proposals/r1-r3-visual-evolution.md) conserva las decisiones de composición por pantalla.

Los RF/CA, arquitectura y modelo de datos determinan qué hace la aplicación. Los [mockups R1–R7](SCREENS.md) siguen siendo referencias de identidad, pero la evolución aprobada reemplaza la obligación visual anterior de usar CTA degradados, brillos y superficies anidadas. Los collages no son especificaciones de funcionalidades ni medidas exactas.

El alcance actual es R1–R3 ya implementado, incluidas reincorporaciones y componentes compartidos. No autoriza UI, SQL, cambios de rutas o nuevas funciones. R4–R7 requerirán su propio alcance funcional; su presencia en un mockup no lo aprueba.

## 2. Identidad y dirección

**Fotografía expresiva, interfaz marina y sobria.** Dark-first con marino uniforme, azul para acciones y selección, violeta como acento puntual. El contenido aporta energía; la interfaz permite leer, comparar y actuar.

- Botones, chips seleccionados, navegación, mensajes y barras de cupo usan colores sólidos.
- No usar iluminaciones radiales, halos ni brillos ornamentales. Un overlay fotográfico discreto se admite sólo cuando hace falta para legibilidad.
- Separar secciones con espacio y, si es necesario, un divisor. Reservar contenedores elevados para una unidad interactiva o una capa real.
- Fotografía de color natural, sin tinte azul/violeta obligatorio. La identidad oscura admite también deporte, arte, comunidad y eventos diurnos.
- Conservar el nombre, logo, iconos lineales y navegación existente. No introducir glassmorphism, fondos crema/verde ni un branding alternativo.

## 3. Tokens y accesibilidad

Valores y asignaciones exactos: [frontmatter de DESIGN.md](../../DESIGN.md). No copiar una paleta normativa paralela ni mantener ejemplos CSS que vuelvan a imponer degradados.

| Rol | Token normativo | Aplicación |
|---|---|---|
| Fondo | bg | Marino uniforme |
| Superficie elevada | bg-elevated | Menú, diálogo o unidad de evento que requiere superficie |
| Campo | field | Entradas y acciones secundarias |
| Divisor | border | Separación decorativa; insuficiente para delimitar por sí solo un campo |
| Borde de control | control-border | Contorno perceptible de inputs y controles; token objetivo aún no aplicado |
| Acción / selección | primary | Azul sólido |
| Acento de identidad | purple | Énfasis puntual, sin borde violeta universal |
| Foco | focus | Indicador de teclado visible |
| Texto | text / text-muted | Jerarquía principal / secundaria |
| Categoría | chip-bg / chip-text | Metadatos pasivos y énfasis discreto |
| Navegación | nav-bg | Fondo de barra inferior |
| Error | error-text / error-border | Mensaje e indicador asociados |
| Estados | success / danger | Texto/icono y explicación; nunca sólo color |
| Acción destructiva | danger-action | Relleno rojo sólido con texto blanco |

Control-border diferencia controles de divisores: contraste calculado de 3,56:1 contra field y 4,19:1 contra bg. Danger-action toma el rojo oscuro ya presente en la implementación y da 5,58:1 con blanco. Su incorporación al documento no equivale a añadir variables CSS. El extremo violeta del CTA antiguo deja de ser un rol normativo del sistema objetivo.

Mantener texto normal con contraste de al menos 4,5:1 y elementos visuales necesarios para reconocer controles con al menos 3:1. Comprobar estados, superficies y fotos; estos pares aislados no acreditan cumplimiento global. No asumir que purple puede llevar texto blanco pequeño sin verificarlo.

## 4. Tipografía, formas y densidad

Conservar Segoe UI con fallback de sistema y sans-serif; no se conoce la familia exacta de los mockups. Usar los roles de DESIGN.md, sin fuentes externas ni estilos display nuevos. Campos a 16 px, labels visibles y errores cercanos. Fecha, lugar y disponibilidad no se reducen a texto diminuto para hacerlos caber.

Radios y espaciados del frontmatter conservan medidas nominales de la base existente. No son alturas rígidas ni una cuadrícula universal. Mantener redondeo suave de controles y fotos; no rodear el contenido con varias cajas sucesivas. Avatares circulares conservan su función; emblemas y aros decorativos se reducen.

## 5. Aplicación por pantalla implementada

| Pantalla | Jerarquía objetivo |
|---|---|
| Inicio | Categorías actuales y lista fotográfica en una columna móvil. Foto, título, fecha y lugar juntos; evitar categoría repetida como badge |
| Mapa | Exploración geográfica actual, controles claros y resultados en una columna móvil. Una vista previa seleccionada sin duplicar contenedores completos |
| Detalle | Foto acotada, título, fecha/lugar, disponibilidad y participación cercanos. Descripción, organizador, galería y gestión siguen sin omitir información |
| Ingresar / Crear cuenta | Encabezado y emblema compactos, primer campo accesible pronto, validación y confirmación de correo preservadas |
| Crear / Editar | Un formulario con títulos de sección, sin tarjetas por bloque. Campos completos, fin de evento y portada de edición compacta |
| Mis eventos | Organizo/Participo, filtros y estados existentes. Filas con miniatura y acciones separadas; priorizar la primera fila |
| Galería | Fotografías como superficie principal. Carga compacta, portada identificable y acciones táctiles de ordenar/quitar |
| Asistentes / Reincorporaciones | Filas y divisores con identidad, estado y acciones estables; distinguir participación y solicitud |
| Chat | Entrantes marinos, salientes sólidos, autor/hora legibles y composer alcanzable con poca altura |
| Mi perfil | Avatar, nombre y biografía primero; datos de cuenta secundarios, sin contadores o accesos inventados |
| Notificaciones | Lista continua, novedades por peso y señal discreta, texto leído/no leído y acciones de recuperación |

La lista fotográfica en Inicio es la experiencia visual principal para descubrir. Mapa conserva su destino y tarea actuales. No cambiar la ruta inicial ni añadir el toggle Mapa/Lista, búsqueda o filtros de R4.

## 6. Componentes, estados y reutilización

Reutilizar AppLayout, ScreenHeader, FormField, StatusMessage, EventCard/CompactEventCard y diálogos cuando su responsabilidad coincida. El nombre actual GradientButton no obliga a conservar un degradado; cualquier renombre o ajuste de API se decidirá al implementar. No crear una biblioteca propia extensa ni incorporar un UI kit.

- **Acciones:** principal azul sólido; secundaria con superficie y borde; peligro rojo sólido; texto con área activable amplia. Diferenciar disabled de loading.
- **Campos:** labels, borde perceptible, foco y errores asociados. Iconos sólo si ayudan y no recortan valores nativos de fecha/hora.
- **Tarjetas:** una unidad de evento con fotografía e información; apertura amplia sin enlaces anidados ni tabulación redundante. Filas compactas para gestión.
- **Chips:** metadatos pasivos o filtros existentes con semántica de selección. No convertir una categoría en acción nueva.
- **Navegación:** Inicio, Mapa, Mis eventos y Perfil según sesión; icono + texto y estado activo sólido. Destinos y permisos se conservan.
- **Diálogos:** modalidad nativa, foco inicial y restauración, scroll y controles alcanzables. Confirmar acciones irreversibles y conservar comprobaciones inciertas.
- **Feedback:** carga breve y estable; vacío específico; error contextual con recuperación real; éxito breve y anunciado. Conservar los datos del formulario ante fallo de guardado.

Los errores de carga de pantalla también necesitan una recuperación efectiva. No confundir una mejora estética de StatusMessage con resolver la descarga fallida de una ruta diferida.

## 7. Fotografía, mapa y contenido

Fotografía protagonista sólo donde ayuda a elegir o reconocer un evento. Preferir texto debajo de la foto; superponerlo requiere verificar fotos claras, oscuras y cargadas. Recorte consistente sin deformación. Mantener hasta diez imágenes por evento conforme al contrato vigente.

Sin foto o ante error, usar una alternativa compacta y explícita que conserve la información. Un placeholder no se convierte en un hero grande por defecto. No usar imágenes del collage como contenido real ni presentar imágenes generadas como documentación de eventos existentes.

La PWA actual usa Mapbox; mantener mapa geográfico real, atribuciones, controles distinguibles y tarjetas útiles mientras carga o falla. El dibujo del mockup no sustituye datos ni autoriza un cambio de proveedor.

Fixtures y capturas de prueba permanecen identificados como tales. La fotografía de fiestas de los collages ilustra composición; no restringe el catálogo a vida nocturna.

## 8. Mobile-first y aceptación futura

- Una columna móvil para resultados legibles; grid en escritorio sólo cuando el contenido cabe. No fijar un breakpoint universal para todas las pantallas.
- Zonas activables de al menos 44×44 CSS px como objetivo ergonómico; conservar foco visible, orden de teclado y etiquetas accesibles.
- Safe areas y reserva para navegación inferior; ni CTA persistentes ni menús deben tapar contenido, foco o mensajes.
- Fecha/hora se apilan cuando el valor nativo no cabe. Chat adapta encabezado, historial y composer al teclado y a poca altura, manteniendo contador y errores alcanzables.
- Probar títulos largos/sin espacios, textos extensos, fotos/avatars ausentes, galerías de 0/1/10 imágenes y listas de distinta longitud.
- Comprobar 320, 375, 390, 768 y 1280 px, texto aumentado y altura reducida; revisar overflow del documento y recortes internos.
- Probar teclado, lector de pantalla, movimiento reducido y dispositivos reales, incluidos gestos del mapa, teclado móvil y safe areas. La emulación no acredita por sí sola estos casos.

Contrastar la futura implementación con esta dirección y con los mockups para los rasgos que se conservan. No exigir fidelidad al brillo o degradado que el usuario decidió retirar. El póster externo —círculos, numeración y títulos R1/R2/R3— nunca forma parte de la app.

Los pendientes de la [auditoría](audits/2026-10-12-interface.md) siguen abiertos hasta corregirlos y verificarlos. No declarar la UI migrada, probada o aceptada por actualizar documentos.

## 9. Registro y mantenimiento

- **v1.0:** referencia original de mockups y tokens aproximados; CTA degradados y superficies iluminadas.
- **v2.0 — 12/10/2026:** evolución R1–R3 confirmada por el usuario: fotografía protagonista, botones sólidos, superficies planas y usabilidad móvil. Tokens y patrones consolidados en DESIGN.md; aplicación en la PWA pendiente.

Mantener .impeccable/design.json alineado con DESIGN.md. Sus snippets son ejemplos documentales del objetivo aprobado; las rampas y breakpoints no son prueba de cambios en CSS. Antes de implementar, consultar este documento, DESIGN.md, SCREENS.md, DESIGN_GAPS.md y requisitos aplicables; ante conflicto visual, la dirección aprobada aquí reemplaza sólo las reglas anteriores que contradice.
