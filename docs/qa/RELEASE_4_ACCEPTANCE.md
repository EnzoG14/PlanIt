# PlanIt — Release 4: matriz de aceptación (plantilla)

**Decisiones aplicables:** A01–A07 aprobadas 12/10/2026. Fecha por inicio; fallback al centro del mapa; filtros en Inicio/Mapa; confirmados preservados al ocultar; público visible para todos; hash secreto no recuperable; R3 integrada y validada. El texto de los 39 CA oficiales se mantiene **literal**. **Estado:** SIN EJECUTAR. Ningún CA figura verificado. Actualizar sólo con evidencia real; «Validado» requiere aceptación humana.

| Criterio | Texto oficial | Prueba mínima sugerida | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| RF-R4-01.CA-01 | Cuando el usuario ingresa un término de búsqueda, el sistema muestra eventos disponibles cuyo nombre o descripción contiene el término consultado. | Título o descripción coincide | Pendiente | — |
| RF-R4-01.CA-02 | La búsqueda no distingue entre mayúsculas y minúsculas y puede repetirse al cambiar el texto. | Búsqueda en mayúsculas/minúsculas | Pendiente | — |
| RF-R4-01.CA-03 | Los eventos que no coinciden con la búsqueda no se muestran como resultados. | Excluir resultado no coincidente | Pendiente | — |
| RF-R4-01.CA-04 | Si no existen coincidencias, se muestra un estado sin resultados; si falla la consulta, se presenta un mensaje de error diferenciado. | Sin coincidencias vs falla de red | Pendiente | — |
| RF-R4-02.CA-01 | El usuario puede seleccionar una o más categorías y ver eventos disponibles que pertenezcan a cualquiera de las categorías seleccionadas. | Multiselección OR | Pendiente | — |
| RF-R4-02.CA-02 | Al combinar categorías con los filtros de fecha, distancia o texto, sólo aparecen eventos que cumplen todos los grupos de filtros activos. | Cruce AND categoría+texto+fecha+radio | Pendiente | — |
| RF-R4-02.CA-03 | Al quitar una categoría seleccionada, los resultados se actualizan sin mantener la restricción anterior. | Quitar chip actualiza | Pendiente | — |
| RF-R4-02.CA-04 | Si no hay coincidencias, se muestra un estado sin resultados y quedan visibles los criterios aplicados. | Vacío conserva chips | Pendiente | — |
| RF-R4-03.CA-01 | El usuario puede indicar una fecha o rango válido para limitar los eventos mostrados a ese período. | Fecha única y rango | Pendiente | — |
| RF-R4-03.CA-02 | Los eventos cuya fecha programada queda fuera del período no aparecen en los resultados. | Evento fuera del rango | Pendiente | — |
| RF-R4-03.CA-03 | El sistema impide aplicar un rango cuyo inicio sea posterior a su final, informando el problema. | Rango invertido inválido | Pendiente | — |
| RF-R4-03.CA-04 | Al limpiar el filtro, vuelven a considerarse eventos de otras fechas según los demás criterios activos. | Limpiar fechas | Pendiente | — |
| RF-R4-04.CA-01 | El usuario puede elegir un radio de búsqueda válido con respecto a su ubicación de referencia. | Radio válido con origen | Pendiente | — |
| RF-R4-04.CA-02 | Al aplicar un radio menor o mayor, la lista y/o el mapa se actualizan para incluir únicamente eventos dentro de esa distancia. | Diferencia radio 5/25 km | Pendiente | — |
| RF-R4-04.CA-03 | Los cambios de radio se combinan con los filtros de categoría, fecha o texto que permanezcan activos. | Radio+otros filtros | Pendiente | — |
| RF-R4-04.CA-04 | Si no puede determinarse la ubicación de referencia, el sistema informa la limitación y no presenta resultados como si la distancia hubiera sido calculada correctamente. | Ubicación denegada | Pendiente | — |
| RF-R4-05.CA-01 | El usuario autenticado puede visualizar las categorías disponibles y seleccionar o deseleccionar sus intereses. | Seleccionar/deseleccionar | Pendiente | — |
| RF-R4-05.CA-02 | Al guardar, las preferencias quedan asociadas a la cuenta y se recuperan al volver a abrir la sección. | Persistir tras reingresar | Pendiente | — |
| RF-R4-05.CA-03 | Modificar los intereses reemplaza o actualiza la selección persistida sin afectar las preferencias de otras personas. | A/B privacidad | Pendiente | — |
| RF-R4-05.CA-04 | Si el guardado falla, se informa el error y no se presenta como confirmada una preferencia que no quedó persistida. | Fallo de guardado | Pendiente | — |
| RF-R4-06.CA-01 | La aplicación presenta una sección de eventos sugeridos para el usuario autenticado. | Sección personal | Pendiente | — |
| RF-R4-06.CA-02 | Las sugerencias se obtienen mediante criterios explícitos relacionados con las categorías de interés, la distancia o la fecha de los eventos. | Ranking categorías+fecha+distancia | Pendiente | — |
| RF-R4-06.CA-03 | No se sugieren eventos que el usuario no tenga autorización para ver o que ya no estén disponibles. | Sin ocultos/cerrados | Pendiente | — |
| RF-R4-06.CA-04 | Al seleccionar una sugerencia se abre su detalle; si no existen coincidencias relevantes, se muestra un estado informativo en lugar de elementos arbitrarios. | Detalle y estado vacío | Pendiente | — |
| RF-R4-07.CA-01 | El organizador puede elegir entre visibilidad pública u oculta al crear o editar un evento propio. | Public/unlisted en crear y editar | Pendiente | — |
| RF-R4-07.CA-02 | Un evento oculto no aparece en búsquedas, mapas, listados públicos ni recomendaciones generales. | Oculto ausente en feeds/mapa | Pendiente | — |
| RF-R4-07.CA-03 | El organizador puede generar y compartir un enlace de acceso a su evento oculto; sólo puede existir un enlace activo a la vez. | Un token activo | Pendiente | — |
| RF-R4-07.CA-04 | Puede invalidar ese enlace y generar otro; el enlace anterior deja de conceder nuevos accesos, sin anular permisos individuales ya otorgados. | Rotación y grants preservados | Pendiente | — |
| RF-R4-07.CA-05 | El enlace no vence por una cantidad de días, pero no admite nuevos canjes cuando el evento terminó, fue cancelado o archivado. | Fin/cierre impide nuevo canje | Pendiente | — |
| RF-R4-08.CA-01 | Un usuario autenticado que abre un enlace válido de un evento oculto puede consultar su detalle sin quedar inscripto automáticamente. | Canje no inscribe | Pendiente | — |
| RF-R4-08.CA-02 | Después del primer acceso conserva la autorización y puede volver a consultar el evento sin utilizar otra vez el enlace, mientras su permiso siga activo. | Grant persistente | Pendiente | — |
| RF-R4-08.CA-03 | Un usuario sin autorización no puede consultar un evento oculto por búsqueda ni por URL directa sin un canje válido. | Acceso directo sin grant denegado | Pendiente | — |
| RF-R4-08.CA-04 | Conocer el enlace o tener autorización para ver el evento no habilita a consultar asistentes, participar en el chat o ver historias hasta estar confirmado. | Chat/asistentes protegidos | Pendiente | — |
| RF-R4-08.CA-05 | No se concede acceso usando un enlace invalidado ni se otorgan nuevos accesos mediante enlaces de eventos finalizados, cancelados o archivados. | Token viejo y evento cerrado denegados | Pendiente | — |
| RF-R4-09.CA-01 | El organizador puede consultar los usuarios con autorización persistente en uno de sus eventos ocultos y distinguir permisos activos de revocados. | Panel activo/revocado | Pendiente | — |
| RF-R4-09.CA-02 | El organizador puede revocar un acceso individual y la persona deja de consultar el evento oculto, aunque conserve el enlace. | Revocación quita detalle | Pendiente | — |
| RF-R4-09.CA-03 | Si esa persona está confirmada como asistente, primero se registra su remoción y luego se revoca el acceso, conservando el historial. | Remoción atómica e historia | Pendiente | — |
| RF-R4-09.CA-04 | El usuario revocado no puede recuperar el permiso utilizando ningún enlace, incluso uno regenerado. | Revocado no recanjea | Pendiente | — |
| RF-R4-09.CA-05 | Sólo el organizador puede restituir expresamente un acceso revocado; invalidar un enlace compartido no anula por sí solo accesos individuales vigentes. | Restitución expresa | Pendiente | — |

## Estados aceptados

Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado. No marcar «Validado» por capturas de mocks, SQL sin JWT, tests falsos o implementación sin aprobación humana.

## QA complementario obligatorio

- Casos adicionales de decisiones de producto: GPS denegado→centro de mapa visible (A01); fecha de inicio no solapamiento (A02); mismo filtro Inicio/Mapa sin `/search` (A03); conversión public→unlisted atómica con confirmados, rechazo de confirmed+revoked (A04); vuelta a público hace detalle legible sin restaurar grant y reocultar lo bloquea otra vez (A05); sólo token_hash/no recuperación (A06); smoke técnico R3 sin exigir nueva aceptación (A07).

- Dos usuarios autenticados A/B, un usuario revocado C, un usuario no invitado D y anon; probar REST y RPC directas, no solamente botones ocultos.
- Contrastar lectura `events`, `event_images`, `files`, `storage.objects` y RPC con grants revocados; revisar funciones `SECURITY DEFINER` que eluden RLS.
- Probar token válido, repetido, regenerado, revocado, manipulado, con sesión caducada, finalización/cancelación/archivo durante canje y dos rotaciones concurrentes.
- Probar creación *unlisted* atómica sin ventana pública; transición public→unlisted con confirmados y lectura cruzada.
- Probar desambiguación de eventos públicos vs ocultos ante búsquedas, recomendaciones, filtros, mapa, Inicio y Mis eventos.
- Probar date boundary, medianoche argentina, origen GPS denegado, 0 resultados, consultas fallidas y paginación con filtros.
- Revalidar inscripción/cupo, remoción/historial, reincorporación, chat, archivos firmados, notificaciones y creación/edición/duplicación R1–R3.
- Responsive 360×800, 375×812, 390×844, 768×1024 y escritorio; teclado, foco, controles táctiles y safe areas.

## Nota de integración visual v1.2 (13/10/2026)

Los **39 CA anteriores permanecen textualmente intactos**. La presentación de UI se verifica contra Amanecer v3.0 (`DESIGN.md`, `DESIGN_SYSTEM.md`, `RELEASE_4_VISUAL_INTEGRATION.md`), nunca contra un collage histórico como pixel-perfect. No existen nuevos resultados de ejecución/aceptación R4 por publicar este paquete.
