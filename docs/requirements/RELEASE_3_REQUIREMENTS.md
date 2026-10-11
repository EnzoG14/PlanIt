# PlanIt — Contrato funcional Release 3

**Fuente de verdad:** documento «Planificación», pestañas **Nueva planificación funcional de PlanIt — Releases 1 a 7**, **Criterios de aceptación** y **Especificación técnica**, secciones de R3. Esta es una transcripción operativa versionada; los mockups no sustituyen RF/CA. **9 RF, 37 CA.**

## RF oficiales

| RF | Nombre | Prioridad | Actor |
| --- | --- | --- | --- |
| RF-R3-01 | Editar un evento propio | Alta | Organizador |
| RF-R3-02 | Cancelar o archivar un evento propio | Alta | Organizador |
| RF-R3-03 | Administrar imágenes de un evento | Media | Organizador |
| RF-R3-04 | Consultar eventos organizados | Alta | Organizador |
| RF-R3-05 | Consultar la lista de asistentes | Alta | Organizador |
| RF-R3-06 | Remover un asistente de un evento | Alta | Organizador |
| RF-R3-07 | Duplicar un evento existente | Alta | Organizador |
| RF-R3-08 | Solicitar reincorporación a un evento | Media | Usuario removido |
| RF-R3-09 | Gestionar solicitudes de reincorporación | Alta | Organizador |

**Sprint 1:** R3-01 a R3-04. **Sprint 2:** R3-05 a R3-09. Sin estadísticas, reportes o alertas de ocupación (R6). No crear borradores persistentes; «Eliminar» significa archivar, conservando historial.

## Criterios de aceptación oficiales

### RF-R3-01 — Editar un evento propio
- **CA-01.** El organizador puede modificar los campos editables de un evento que creó y guardar los cambios.
- **CA-02.** El selector de fecha y hora impide elegir momentos anteriores al actual; además, el sistema rechaza guardados con fechas inválidas o con un nuevo cupo inferior al número de inscriptos vigentes, mostrando el motivo.
- **CA-03.** Los cambios guardados se reflejan al volver al detalle y a los listados o mapa donde el evento aparezca.
- **CA-04.** Un usuario distinto del organizador no puede modificar el evento, incluso mediante acceso directo a la operación de datos.

### RF-R3-02 — Cancelar o archivar un evento propio
- **CA-01.** Sólo el organizador puede iniciar la cancelación o el archivado de un evento de su autoría.
- **CA-02.** Antes de ejecutar la operación, el sistema solicita confirmación explícita y permite desistir sin realizar cambios.
- **CA-03.** Cancelar impide nuevas participaciones y conserva inscripciones e historial; archivar oculta el evento de listados activos sin borrarlo y, si aún no ha finalizado, primero lo cancela.
- **CA-04.** Si la cancelación o el archivado falla, no se informa éxito; en ningún caso la acción ordinaria borra físicamente el evento, sus imágenes, mensajes o historial.

### RF-R3-03 — Administrar imágenes de un evento
- **CA-01.** El organizador puede agregar imágenes válidas a un evento propio hasta un máximo de diez y visualizarlas posteriormente en su detalle.
- **CA-02.** El organizador puede quitar una imagen de su evento, y ésta deja de aparecer en las vistas del evento.
- **CA-03.** Los archivos no permitidos o las cargas fallidas se rechazan con un mensaje claro, sin crear una imagen aparentemente guardada.
- **CA-04.** Los registros de imágenes y los archivos almacenados permanecen coherentes después de agregar o quitar contenido, y usuarios no autorizados no pueden modificarlo.

### RF-R3-04 — Consultar eventos organizados
- **CA-01.** El organizador puede abrir un listado que incluye los eventos creados por su propia cuenta.
- **CA-02.** Cada evento del listado permite acceder a su detalle y a las acciones de gestión que correspondan.
- **CA-03.** Los eventos de otros organizadores no se incluyen en el listado de eventos propios.
- **CA-04.** Las modificaciones o cancelaciones realizadas se reflejan al actualizar el listado.

### RF-R3-05 — Consultar la lista de asistentes
- **CA-01.** El organizador puede acceder desde uno de sus eventos al listado de usuarios con inscripción vigente.
- **CA-02.** La lista incluye únicamente asistentes del evento seleccionado e información de identidad necesaria y autorizada.
- **CA-03.** Una nueva inscripción o una baja se refleja en el listado al actualizar los datos.
- **CA-04.** Un usuario que no es organizador del evento no puede consultar el listado de administración mediante acceso directo.

### RF-R3-06 — Remover un asistente de un evento
- **CA-01.** El organizador puede seleccionar a un asistente de su evento y solicitar la remoción de su inscripción.
- **CA-02.** Antes de realizar la baja, el sistema muestra una confirmación; cancelarla deja la inscripción sin cambios.
- **CA-03.** Al confirmar, la participación queda en estado removido y se registra el movimiento en el historial; la persona deja de figurar como asistente confirmado, pero no se elimina la fila histórica.
- **CA-04.** Un usuario no autorizado no puede remover asistentes de un evento ajeno, incluso invocando directamente la operación.

### RF-R3-07 — Duplicar un evento existente
- **CA-01.** El organizador puede seleccionar un evento de su autoría y abrir «Duplicar», que precarga un formulario editable con título, descripción, categoría, ubicación y cupo, sin crear aún un registro en la base de datos.
- **CA-02.** Antes de guardar, el organizador puede revisar y modificar los datos del duplicado; el sistema exige una fecha y hora futuras y valida los campos obligatorios.
- **CA-03.** Al confirmar la creación, se guarda un evento con identificador propio y el mismo organizador; aparece entre sus eventos, mientras que el evento original conserva sus datos.
- **CA-04.** La duplicación no copia asistentes, inscripciones, conversaciones ni estadísticas del evento original. Un usuario distinto del organizador no puede duplicar el evento ajeno mediante esta función.

### RF-R3-08 — Solicitar reincorporación a un evento
- **CA-01.** Un usuario cuya participación figura como removida puede solicitar su reincorporación a un evento que todavía admite inscripciones y al que tiene permiso de acceso.
- **CA-02.** La primera solicitud se registra como pendiente sin exigir un período de espera desde la remoción.
- **CA-03.** No se permite más de una solicitud pendiente para la misma participación ni solicitudes de usuarios que nunca fueron removidos.
- **CA-04.** Cuando se rechaza una solicitud, el usuario debe esperar siete días desde la resolución antes de enviar otra; no puede solicitar reincorporación a eventos finalizados, cancelados o archivados.

### RF-R3-09 — Gestionar solicitudes de reincorporación
- **CA-01.** El organizador puede consultar las solicitudes pendientes de reincorporación correspondientes a sus eventos.
- **CA-02.** Al aprobar una solicitud con cupo disponible, la participación vuelve a confirmada y el sistema conserva un registro del cambio.
- **CA-03.** Si no hay cupo, la solicitud permanece pendiente, no reserva plaza y no se aprueba automáticamente cuando se libera una.
- **CA-04.** Al rechazar una solicitud, se registra la decisión y comienza el plazo de siete días para un nuevo pedido.
- **CA-05.** Sólo el organizador puede resolver solicitudes y no se pueden aprobar una vez finalizado, cancelado o archivado el evento.

## Notas sobre fuentes
La planificación contiene versiones históricas de R3 con numeraciones diferentes. **No mezclar** RF históricos, agrupados en estadísticas/notificaciones, con esta reorganización de octubre de 2026. Los números anteriores no reemplazan estos 9 RF.
