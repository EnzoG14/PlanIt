# PlanIt — Discrepancias mockups vs. requisitos y modelo aprobado

**Política:** Los mockups son contrato **visual**, NO contrato de funcionalidades nuevas. RF/criterios de aceptación y decisiones de BD tienen prioridad para comportamiento. Esta lista se mantiene viva; cuando un detalle sea ambiguo, Codex debe informarlo y no inventar columnas, operaciones o pantallas funcionales.

| Release / captura | Elemento visible | Estado funcional / decisión para Codex |
| --- | --- | --- |
| R1 registro | Campo «Fecha de nacimiento» | `birth_date` es opcional; RF-R1-01 sólo exige email, contraseña y nombre visible. Se puede diferir u ofrecer opcional, nunca exigirlo al alta. |
| R1 registro | Checkbox aceptar términos | Términos y políticas deben existir para exigir aceptación; no inventar consentimiento persistido sin requisito aprobado. |
| R1 crear evento | Una sola fecha y hora visibles | El esquema requiere `starts_at` **y** `ends_at`; implementar ambos manteniendo estilo del form. |
| R1 mapa / detalle | Chips de categorías, tags múltiples, corazón de favoritos | Categoría por evento = una. Multi-filtros y favoritos pertenecen a fases futuras/no aprobadas; no implementar prematuramente. |
| R1 evento | Datos ficticios 48/80 e imágenes | Son ejemplos de presentación. Mostrar sólo datos reales o mocks expresamente identificados en pruebas. |
| R2 inicio / perfil | Guardados, seguimiento, «Mis entradas» | Guardados/entradas no tienen tablas o RF específicos aprobados; seguimiento llega R5. |
| R2 notificaciones | «Recordatorio» programado | `notifications` soporta avisos, pero no hay programación de recordatorios definida. |
| R3 Mis eventos | Chip «Borradores» / estado Borrador | **No hay borradores persistidos en PostgreSQL**. Crear/duplicar es formulario local hasta publicar. No mostrar lista real de drafts. |
| R3 asistentes | Chip «Pendientes» como estado de participación | La participación básica no incluye pending; sí hay pending para solicitudes de reingreso (`event_rejoin_requests`), conceptos diferentes. |
| R3 acciones | «Eliminar evento» | Actualizado el 24/10/2026: archivar conserva historia y cancela primero si sigue vigente. El organizador también puede **eliminar definitivamente** eventos cancelados o finalizados, con sus datos asociados y confirmación explícita. Desarchivar requiere reprogramación y nueva inscripción de asistentes. |
| R4 filtros | «Solo eventos gratuitos», entradas disponibles | No existe sistema de precios/pagos/tickets. No implementar como filtros operativos. |
| R4 explorar | Favoritos con corazón | No hay tabla de eventos guardados; usar sólo si se aprueba el requerimiento adicional. |
| R5 editar perfil | `Mostrar mis eventos`, `Permitir mensajes` | No existen como atributos/decisiones aprobadas. La política de perfil privado y bloqueos sí. |
| R5 DM | Micrófono, doble check leído | DMs de texto, no audio ni recibos de lectura por mensaje. Historial permanece tras bloqueo. |
| R6 métricas | Calificación 4.8 y tasa de asistencia | No hay entidad reviews ni check-in; no derivar métricas falsas ni pedir columnas nuevas sin discusión. |
| R6 reportes | Lista de entradas / ticketing | No hay compra ni tickets. Exportar asistentes/participaciones por CSV si RF lo requiere. |
| R7 publicar historia | Música, stickers, herramientas y texto superpuesto | Una imagen por historia, expira 24 horas; contenido enriquecido requiere extensión de RF/esquema. |
| R7 chat con imagen | Corazones/reacciones, música/audio | Una imagen por mensaje grupal; no reacciones ni audio aprobados. |
| R7 historias | Responder historia | No existe modelo de respuestas de historias; no implementar. |

## Cambios por accesibilidad y plataforma — permitidos sin rediseño

### Mapa/detalle PROMPT 05 (10/10/2026)

Mapa Leaflet real con OSM claro, controles oscuros y tarjetas propias según teléfonos 4/5 R1. Sin búsqueda, favoritos ni filtros inertes. Detalle con portada/placeholder, categoría, datos y cupo real; confirmados/barra/CTA pendientes de tabla/RPC de participación. [Capturas y criterios](verification/map-detail-r1/README.md). Nueva migración de descubrimiento aplicada en planit-v2 el 10/10/2026 con autorización del usuario; consulta y permisos verificados remotamente.

### Adaptación visual del BLOQUE 0 (10/10/2026)

- Login/registro conservan composición centrada e icono circular de R1, pero muestran el estado de preparación en lugar de formularios inertes. El CTA sólo navega al mapa; no inicia sesión ni publica.
- Navegación inferior reducida a Mapa, Mis eventos y Crear, que son rutas existentes. Inicio y Perfil de R2 se difieren hasta su implementación; esta reducción es una adaptación, no una copia literal de R1.
- No se dibujan mapa, tarjetas con eventos ficticios, filtros ni contadores. Tampoco se muestra progreso sin un flujo por pasos.
- Tokens estimados: el extremo violeta del CTA se oscurece a `#7651DF` para mantener contraste de texto blanco normal. El acento violeta general conserva `#8D66FA`.
- Logo/favicon mantienen la geometría provisional y cambian sólo la paleta a marino/lila. El póster no define un icono de aplicación exacto.
- Formularios, fotos y datos reales se incorporarán en sus bloques funcionales, incluyendo `ends_at` y sin exigir `birth_date` al registrarse.

- Ampliar zonas táctiles, proveer estados de foco, error y loading, asegurar contraste legible.
- Adaptar ancho y scroll para móviles reales y desktop PWA; respetar `safe-area-inset-bottom`.
- Mostrar controles obligatorios adicionales omitidos del mockup (por ejemplo fecha/hora de fin del evento).
- Ajustar el layout al teclado virtual y a la geolocalización real (Leaflet) en lugar de mapa ficticio de fondo.
- Utilizar fotos de prueba con autorización o placeholders estilísticamente similares, no extraer imágenes de las diapositivas.

## Qué revisar antes del merge de cada bloque

### Crear evento Release 1 (10/10/2026)

- El tercer teléfono R1 se implementa con encabezado centrado, calendario circular, inputs verticales oscuros y CTA gradiente. Se agregan labels y fin del evento en pareja fecha/hora, requeridos por accesibilidad y modelo.
- Ubicación manual con dirección/coordenadas y opción de usar ubicación actual, alternativa admitida por BLOQUE 2. El mapa real sigue pendiente del bloque de descubrimiento.
- Fotos opcionales al crear incluidas por elección explícita del usuario (máximo 10); no se adelanta la administración de galería publicada de R3.
- Detalle mínimo recupera el evento después de publicar; mapa y Mis eventos aún no consultan eventos. No se declara completo el flujo de descubrimiento R1.
- [Pruebas y comparación de capturas](verification/create-event-r1/README.md). Migración aplicada en planit-v2 el 10/10/2026 con autorización del usuario; creación y permisos verificados por SQL remoto con ROLLBACK. Flujo completo de navegador/Storage HTTP pendiente de prueba real.

### Auth Release 1 (10/10/2026)

- Login y registro ahora usan Supabase Auth real. El estado provisional del bloque 0 para estas dos rutas queda reemplazado por formularios, carga, errores y confirmación de correo.
- Registro exige nombre visible (2–60 caracteres), email y contraseña. Se difieren DOB y términos; tampoco hay recuperación de contraseña hasta implementar un flujo real.
- Labels visibles y texto de inputs de 16 px complementan los iconos de R1 para accesibilidad y teclado móvil. Inputs/CTA miden 52 px; toggle y acciones secundarias tienen área mínima de 44×44 px.
- No se incluye progreso ni puntos ilustrativos porque no hay un flujo por pasos. El fondo, círculo, jerarquía centrada y gradiente mantienen el contrato R1.
- `/me` es una consulta mínima del perfil propio exigida por el plan técnico del bloque 1. No implementa perfil social, edición, contadores ni intereses de R2/R5. Perfil se agrega a la navegación inferior sólo con sesión.
- El correo duplicado puede producir un usuario sin identidades en Supabase. Se muestra rechazo genérico; no se anuncia un alta nueva ni se consulta la existencia de perfiles desde una sesión anónima.
- Verificación y matriz CA: [Auth R1](verification/auth-r1/README.md). La altura reducida es una simulación de espacio disponible; falta comprobar teclado y safe-area en un teléfono físico.

1. Ningún campo obligatorio del esquema fue omitido por seguir demasiado literalmente el mockup.
2. Ninguna función ilustrativa fue implementada creando datos no diseñados.
3. Screenshots móviles reales preservan la identidad azul/violeta y el patrón de navegación.
4. Las diferencias con la imagen tienen explicación y son aceptadas expresamente cuando alteran la experiencia prevista.

## Dirección B · Amanecer: elementos del design-lab sin contrato (12/10/2026)

El prototipo [design-lab](../../design-lab/README.md) dibuja elementos que no tienen requisito en R1–R3. Son composición visual; no se implementan sin decisión funcional (detalle en la [decisión de dirección](proposals/amanecer-direction.md#4-elementos-del-lab-que-requieren-decisión-funcional)).

| Elemento del lab | Estado funcional / decisión |
| --- | --- |
| Tira de 7 días con conteo en Inicio | Es un filtro/navegación por fecha (R4). Hasta decidir, Inicio conserva su agrupación actual con estilo Amanecer |
| Tarjeta rápida «próximo evento» | Requiere definir la fuente (participaciones u organizados); no inventar datos |
| Contadores Organizás / Participás / Próximos en el perfil | El perfil propio no define contadores; no implementar |
| Buscador y chips de categoría en Inicio/Mapa | Composición del mock; la búsqueda y los filtros de exploración son R4 |
| Eventos, personas y cupos del lab | Ficticios; las fotos son ilustraciones SVG de reemplazo |
