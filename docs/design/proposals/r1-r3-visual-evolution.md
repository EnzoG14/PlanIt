# PlanIt — Shape de evolución visual R1–R3

**Fecha:** 12/10/2026. **Estado:** dirección confirmada por el usuario el 12/10/2026, sin implementación. **Modo:** Operate: descubrir un evento, decidir si participar y gestionar eventos con claridad desde el teléfono.

Este brief cubre únicamente pantallas ya implementadas de R1, R2 y R3, incluidos sus estados y componentes compartidos. Sustituye el alcance R4 planteado inicialmente. No modifica el contrato funcional. Su dirección fue consolidada, por pedido del usuario, en [DESIGN.md](../../../DESIGN.md) y [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md); su aplicación en la PWA sigue pendiente.

## 1. Objetivo y resultado esperado

Conservar una identidad reconocible de PlanIt —marino profundo, azul, violeta, fotografía de eventos, iconos lineales y navegación inferior— mientras se reduce el peso visual de fondos decorativos, gradientes, brillos y contenedores anidados.

El participante debe reconocer pronto **qué evento es, cuándo ocurre, dónde y cuál es su situación de participación**. El organizador debe encontrar su evento y la acción necesaria sin atravesar bloques de ayuda o decoración. La fotografía aporta contexto; la información y los controles permanecen legibles aunque no haya fotos.

**Dirección propuesta: fotografía expresiva sobre una interfaz marina y sobria.** La energía viene del contenido del evento; la interfaz organiza y responde.

## 2. Lenguaje visual seleccionado

| Elemento | Evolución propuesta |
|---|---|
| Fondo | Marino uniforme; retirar iluminaciones radiales decorativas de las pantallas de producto |
| Superficies | Fondo base, superficie de control y superficie elevada para menú/diálogo. Separar secciones ordinarias con espacio y, cuando haga falta, un divisor |
| Azul | Acciones principales, selección y navegación activa; botones principales con relleno sólido |
| Violeta | Acento de identidad y énfasis secundario puntual, sin aplicarlo como borde a todos los elementos |
| Gradientes | Retirarlos de botones, mensajes, chips y bloques informativos. Admitir un overlay fotográfico discreto sólo cuando sea necesario para leer texto sobre la imagen |
| Brillos y sombras | Eliminar halos ornamentales. Reservar sombras discretas para superficies que realmente flotan, como un menú |
| Tarjetas | Usarlas cuando el evento o la imagen constituye una unidad interactiva. Evitar tarjeta dentro de tarjeta; los metadatos viven directamente en su unidad |
| Tipografía | Conservar la familia de sistema. Jerarquía por tamaño, peso y espacio; texto secundario legible, sin convertir toda la información en etiquetas pequeñas |
| Fotografía | Color natural, recorte consistente y protagonista en descubrimiento y detalle; sin tintar todas las imágenes de azul/violeta |

Se mantienen las familias cromáticas actuales. Esta propuesta cambia la distribución y función del color, no el branding. La reducción de gradientes responde al pedido del usuario y constituye una evolución explícita respecto de los CTA degradados del sistema v1.

## 3. Jerarquía por pantalla

| Pantalla implementada | Composición y momento principal |
|---|---|
| **Inicio** | Encabezado compacto, secciones existentes por categoría y lista fotográfica en una columna en móvil. Foto, título, fecha y lugar forman una unidad. Evitar repetir la categoría como badge si ya la identifica el encabezado de sección |
| **Mapa** | Mantener la exploración geográfica actual. Controles claramente separados del mapa; resultados legibles en una columna en móvil. Seleccionar un marcador presenta una sola vista previa, sin repetir un evento completo en varios contenedores visibles |
| **Detalle** | Foto amplia pero acotada, seguida de título, fecha/lugar y disponibilidad con acción de participación. Descripción, organizador, fotos adicionales y gestión se ordenan después. El evento se reconoce y la decisión se entiende antes de una lectura larga |
| **Ingresar / Crear cuenta** | Formulario directo, encabezado breve y acciones claras. Reducir el emblema circular y el espacio previo al primer campo; preservar labels, mostrar contraseña, validación y confirmación de correo |
| **Crear / Editar evento** | Un formulario sobre el fondo, organizado por títulos: información, horarios, ubicación y cupo. Inputs delimitados y errores cercanos. La portada de edición es una referencia compacta; la gestión de imágenes conserva su recorrido existente |
| **Mis eventos** | Mantener Organizo/Participo, filtros y estados actuales. Lista de filas compactas con miniatura, título, fecha, estado y menú. Dar prioridad a la primera fila; llevar aclaraciones al contexto donde hacen falta |
| **Galería** | La cuadrícula de fotos es la superficie principal. Carga más compacta, portada identificable y acciones de ordenar/quitar visibles. No colocar cada imagen dentro de varias superficies decorativas |
| **Asistentes / Reincorporaciones** | Filas sobre una superficie continua o separadas por divisores. Identidad, estado y acciones conservan posiciones estables. Mantener confirmaciones, autorización y distinción entre participación y solicitud de reingreso |
| **Chat** | Conversación como centro, burbujas entrantes marinas y salientes de un tono sólido con contraste suficiente. Jerarquizar autor y hora sin repetir datos con igual peso. Composer visible y adaptación a poca altura; no sumar fotos o herramientas no implementadas |
| **Mi perfil** | Avatar y nombre como identidad, biografía como contenido y cuenta como información secundaria. Reducir el aro decorativo y los bloques envolventes; conservar sólo datos y accesos disponibles |
| **Notificaciones** | Lista continua con filas, iconos y estado leído/no leído. Destacar novedades con peso tipográfico y una señal discreta; conservar texto de estado, acciones y recuperación de errores |

La lista fotográfica es la experiencia visual principal de descubrimiento en Inicio; el mapa conserva su lugar como alternativa geográfica. **No se propone cambiar la ruta inicial, fusionar destinos ni crear un toggle Mapa/Lista de R4.**

## 4. Fotografía y contenido real

- Conservar el límite vigente de hasta diez imágenes por evento. La portada utiliza un recorte horizontal consistente; la galería permite entender las imágenes sin overlays permanentes.
- Poner títulos, fechas y lugares debajo de la foto por defecto. Cuando haya texto superpuesto, comprobar su lectura con fotos claras, oscuras y muy cargadas.
- No representar cada evento como una fiesta nocturna. La interfaz marina debe funcionar también con deporte, comunidad, arte y actividades diurnas.
- Sin foto o ante un fallo de carga, usar una alternativa compacta con icono y mensaje, conservando título y datos. Un placeholder no debe ocupar el mismo protagonismo que una fotografía real.
- Usar imágenes reales autorizadas o fixtures claramente identificados en pruebas. No extraer fotos de los collages ni generar imágenes que aparenten documentar eventos reales.

## 5. Interacción móvil y estados

Los controles frecuentes deben quedar cómodos para el pulgar, con zonas activables de al menos 44×44 CSS px y foco visible. Las tarjetas de descubrimiento deben ofrecer una zona amplia de apertura sin crear enlaces anidados ni multiplicar paradas de teclado innecesarias. Los menús de gestión siguen siendo acciones separadas.

En anchos estrechos, priorizar una columna y apilar fecha/hora cuando el control nativo no pueda mostrar el valor completo. Las barras inferiores reservan espacio real de contenido, foco y áreas seguras. Un CTA persistente sólo es aceptable si no tapa texto, errores o navegación.

| Estado | Tratamiento propuesto |
|---|---|
| Carga inicial | Feedback breve y espacio estable para reducir saltos; no esqueletos de bloques que no existen |
| Vacío | Mensaje específico y acción disponible en el recorrido actual; diferenciar vacío de error |
| Foto no disponible | Alternativa local que permita seguir consultando el evento |
| Error de lectura | Mensaje contextual y reintento; conservar selecciones o texto local cuando sea seguro |
| Error al guardar | Mantener los datos del formulario y señalar dónde actuar |
| Resultado incierto | Conservar las comprobaciones existentes y distinguir “confirmar estado” de “volver a enviar” |
| Éxito | Confirmación breve y accesible, sin un bloque decorativo permanente |
| Evento sin acceso, cancelado, finalizado o archivado | Estado explícito; mantener las acciones permitidas por el contrato |
| Chat con teclado / poca altura | Composer y feedback alcanzables; comprimir encabezado antes de sacrificar la conversación |

La evolución debe cubrir títulos largos y sin espacios, descripciones extensas, falta de foto/avatar, galerías de 0/1/10 imágenes y listas con pocas o muchas filas. No asumir contenido perfecto para que el diseño funcione.

## 6. Límites y verificación futura

Reutilizar y ajustar componentes existentes cuando su responsabilidad coincida: AppLayout, ScreenHeader, EventCard/CompactEventCard, FormField, StatusMessage y diálogos de gestión. No introducir un UI kit, fuentes externas ni una biblioteca propia sin necesidad demostrada.

El trabajo posterior debe conservar rutas, permisos, validaciones, textos factuales, horarios Argentina y reglas de cupo/participación. Quedan fuera nuevas funciones R4–R7, favoritos, entradas, filtros nuevos, perfiles sociales, borradores persistidos, cambios SQL y rediseño del logo.

La aceptación visual futura comprobará:

- Que PlanIt siga siendo reconocible por paleta, navegación y componentes, sin depender de brillos.
- Que Inicio y Detalle den protagonismo a fotos reales; formularios y gestión den protagonismo a la tarea.
- Que fecha, lugar, disponibilidad y acción se lean juntos, sin desplazar contenido necesario fuera de alcance.
- Que controles y texto mantengan contraste, errores asociados y funcionamiento con teclado/lector de pantalla.
- Que no haya recortes internos ni overflow a 320, 375, 390, 768 y 1280 px, con texto aumentado y poca altura disponible.
- Que el mapa y sus gestos, teclado móvil, safe areas y scroll se prueben en dispositivos reales además de emulación.

La [auditoría técnica](../audits/2026-10-12-interface.md) aporta pendientes de recuperación de módulos, contraste y responsive que deben acompañar la evolución. Sus problemas de robustez no se resuelven sólo con cambios cosméticos.

## 7. Fuentes y dirección confirmada

Referencias revisadas: [sistema visual](../DESIGN_SYSTEM.md), [pantallas](../SCREENS.md), [brechas](../DESIGN_GAPS.md), collages [R1](../mockups/release-1.png), [R2](../mockups/release-2.png) y [R3](../mockups/release-3.png), implementación actual localizada con CodeGraph y capturas base de [Inicio/Detalle](../verification/home-event-detail/README.md) y [auditoría](../verification/interface-audit-2026-10-12/).

Los collages son referencias; las capturas de fixtures no acreditan contenido ni pruebas remotas reales. “Implementado” no implica aceptación humana de todos los casos.

**Confirmado:** el usuario aprobó este brief y solicitó consolidarlo en los documentos del sistema visual. La implementación sigue pendiente de un pedido posterior. El próximo paso, si se solicita, puede mostrar Inicio, Detalle y una pantalla de gestión como muestras representativas. Confirmar el brief no autoriza por sí solo implementar.
