# PlanIt — Contrato funcional Release 4

**Fuente:** documento [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), pestañas «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7», según reorganización octubre 2026. **9 RF y 39 criterios de aceptación (CA)**. La antigua R4 (Comunidad) pasó a R5.

Esta copia conserva literalmente la descripción del requisito y sus criterios tal como fueron extraídos de las pestañas vigentes. Los acuerdos de implementación **propuestos** viven en `RELEASE_4_PLAN.md` y no modifican estos textos.

## Catálogo oficial

| RF | Funcionalidad | Prioridad | Actor | CA |
| --- | --- | --- | --- | ---: |
| RF-R4-01 | Buscar eventos por nombre o descripción | Alta | Usuarios autenticados | 4 |
| RF-R4-02 | Filtrar eventos por categoría | Alta | Usuarios autenticados | 4 |
| RF-R4-03 | Filtrar eventos por fecha | Alta | Usuarios autenticados | 4 |
| RF-R4-04 | Modificar el radio de búsqueda | Alta | Usuarios autenticados | 4 |
| RF-R4-05 | Seleccionar categorías de interés | Alta | Usuarios autenticados | 4 |
| RF-R4-06 | Consultar eventos sugeridos | Alta | Usuarios autenticados | 4 |
| RF-R4-07 | Configurar visibilidad y administrar enlace de un evento oculto | Alta | Organizadores de eventos | 5 |
| RF-R4-08 | Acceder a un evento oculto mediante enlace | Alta | Usuarios autenticados | 5 |
| RF-R4-09 | Revocar y restituir accesos a eventos ocultos | Media | Organizadores de eventos | 5 |

## Requisitos y criterios de aceptación oficiales

### RF-R4-01 — Buscar eventos por nombre o descripción

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá buscar eventos mediante texto ingresado por el usuario y mostrar los resultados que coincidan con el nombre o la descripción del evento.

- **RF-R4-01.CA-01:** Cuando el usuario ingresa un término de búsqueda, el sistema muestra eventos disponibles cuyo nombre o descripción contiene el término consultado.
- **RF-R4-01.CA-02:** La búsqueda no distingue entre mayúsculas y minúsculas y puede repetirse al cambiar el texto.
- **RF-R4-01.CA-03:** Los eventos que no coinciden con la búsqueda no se muestran como resultados.
- **RF-R4-01.CA-04:** Si no existen coincidencias, se muestra un estado sin resultados; si falla la consulta, se presenta un mensaje de error diferenciado.

### RF-R4-02 — Filtrar eventos por categoría

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario seleccionar una o más categorías y mostrar únicamente eventos de esas categorías, con posibilidad de combinar este criterio con los demás filtros.

- **RF-R4-02.CA-01:** El usuario puede seleccionar una o más categorías y ver eventos disponibles que pertenezcan a cualquiera de las categorías seleccionadas.
- **RF-R4-02.CA-02:** Al combinar categorías con los filtros de fecha, distancia o texto, sólo aparecen eventos que cumplen todos los grupos de filtros activos.
- **RF-R4-02.CA-03:** Al quitar una categoría seleccionada, los resultados se actualizan sin mantener la restricción anterior.
- **RF-R4-02.CA-04:** Si no hay coincidencias, se muestra un estado sin resultados y quedan visibles los criterios aplicados.

### RF-R4-03 — Filtrar eventos por fecha

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario seleccionar una fecha o rango de fechas y consultar los eventos programados dentro de ese período.

- **RF-R4-03.CA-01:** El usuario puede indicar una fecha o rango válido para limitar los eventos mostrados a ese período.
- **RF-R4-03.CA-02:** Los eventos cuya fecha programada queda fuera del período no aparecen en los resultados.
- **RF-R4-03.CA-03:** El sistema impide aplicar un rango cuyo inicio sea posterior a su final, informando el problema.
- **RF-R4-03.CA-04:** Al limpiar el filtro, vuelven a considerarse eventos de otras fechas según los demás criterios activos.

### RF-R4-04 — Modificar el radio de búsqueda

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario seleccionar una distancia máxima respecto de su ubicación para limitar los eventos que se muestran en las vistas de descubrimiento.

- **RF-R4-04.CA-01:** El usuario puede elegir un radio de búsqueda válido con respecto a su ubicación de referencia.
- **RF-R4-04.CA-02:** Al aplicar un radio menor o mayor, la lista y/o el mapa se actualizan para incluir únicamente eventos dentro de esa distancia.
- **RF-R4-04.CA-03:** Los cambios de radio se combinan con los filtros de categoría, fecha o texto que permanezcan activos.
- **RF-R4-04.CA-04:** Si no puede determinarse la ubicación de referencia, el sistema informa la limitación y no presenta resultados como si la distancia hubiera sido calculada correctamente.

### RF-R4-05 — Seleccionar categorías de interés

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario seleccionar, guardar y modificar las categorías de eventos de su interés para personalizar el contenido que se le presenta.

- **RF-R4-05.CA-01:** El usuario autenticado puede visualizar las categorías disponibles y seleccionar o deseleccionar sus intereses.
- **RF-R4-05.CA-02:** Al guardar, las preferencias quedan asociadas a la cuenta y se recuperan al volver a abrir la sección.
- **RF-R4-05.CA-03:** Modificar los intereses reemplaza o actualiza la selección persistida sin afectar las preferencias de otras personas.
- **RF-R4-05.CA-04:** Si el guardado falla, se informa el error y no se presenta como confirmada una preferencia que no quedó persistida.

### RF-R4-06 — Consultar eventos sugeridos

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario visualizar eventos sugeridos de acuerdo con sus intereses, cercanía geográfica y disponibilidad temporal, utilizando criterios determinísticos sin requerir aprendizaje automático.

- **RF-R4-06.CA-01:** La aplicación presenta una sección de eventos sugeridos para el usuario autenticado.
- **RF-R4-06.CA-02:** Las sugerencias se obtienen mediante criterios explícitos relacionados con las categorías de interés, la distancia o la fecha de los eventos.
- **RF-R4-06.CA-03:** No se sugieren eventos que el usuario no tenga autorización para ver o que ya no estén disponibles.
- **RF-R4-06.CA-04:** Al seleccionar una sugerencia se abre su detalle; si no existen coincidencias relevantes, se muestra un estado informativo en lugar de elementos arbitrarios.

### RF-R4-07 — Configurar visibilidad y administrar enlace de un evento oculto

**Prioridad:** Alta. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador establecer un evento como público u oculto, generar un enlace para compartir eventos ocultos e invalidarlo y reemplazarlo. Existirá como máximo un enlace activo por evento, sin vencimiento automático por plazo.

- **RF-R4-07.CA-01:** El organizador puede elegir entre visibilidad pública u oculta al crear o editar un evento propio.
- **RF-R4-07.CA-02:** Un evento oculto no aparece en búsquedas, mapas, listados públicos ni recomendaciones generales.
- **RF-R4-07.CA-03:** El organizador puede generar y compartir un enlace de acceso a su evento oculto; sólo puede existir un enlace activo a la vez.
- **RF-R4-07.CA-04:** Puede invalidar ese enlace y generar otro; el enlace anterior deja de conceder nuevos accesos, sin anular permisos individuales ya otorgados.
- **RF-R4-07.CA-05:** El enlace no vence por una cantidad de días, pero no admite nuevos canjes cuando el evento terminó, fue cancelado o archivado.

### RF-R4-08 — Acceder a un evento oculto mediante enlace

**Prioridad:** Alta. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá a un usuario autenticado abrir un enlace válido de un evento oculto y obtener autorización persistente para consultar su detalle, sin inscribirse automáticamente. El acceso concedido no habilitará por sí solo el chat ni la lista de asistentes.

- **RF-R4-08.CA-01:** Un usuario autenticado que abre un enlace válido de un evento oculto puede consultar su detalle sin quedar inscripto automáticamente.
- **RF-R4-08.CA-02:** Después del primer acceso conserva la autorización y puede volver a consultar el evento sin utilizar otra vez el enlace, mientras su permiso siga activo.
- **RF-R4-08.CA-03:** Un usuario sin autorización no puede consultar un evento oculto por búsqueda ni por URL directa sin un canje válido.
- **RF-R4-08.CA-04:** Conocer el enlace o tener autorización para ver el evento no habilita a consultar asistentes, participar en el chat o ver historias hasta estar confirmado.
- **RF-R4-08.CA-05:** No se concede acceso usando un enlace invalidado ni se otorgan nuevos accesos mediante enlaces de eventos finalizados, cancelados o archivados.

### RF-R4-09 — Revocar y restituir accesos a eventos ocultos

**Prioridad:** Media. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador consultar usuarios autorizados en un evento oculto, revocar permisos individuales y restituirlos expresamente. Un usuario revocado no recuperará su acceso utilizando enlaces vigentes o regenerados.

- **RF-R4-09.CA-01:** El organizador puede consultar los usuarios con autorización persistente en uno de sus eventos ocultos y distinguir permisos activos de revocados.
- **RF-R4-09.CA-02:** El organizador puede revocar un acceso individual y la persona deja de consultar el evento oculto, aunque conserve el enlace.
- **RF-R4-09.CA-03:** Si esa persona está confirmada como asistente, primero se registra su remoción y luego se revoca el acceso, conservando el historial.
- **RF-R4-09.CA-04:** El usuario revocado no puede recuperar el permiso utilizando ningún enlace, incluso uno regenerado.
- **RF-R4-09.CA-05:** Sólo el organizador puede restituir expresamente un acceso revocado; invalidar un enlace compartido no anula por sí solo accesos individuales vigentes.

