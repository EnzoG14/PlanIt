# PlanIt — Contrato funcional Release 7 · Contenido social e integraciones

**Fuente normativa:** [https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), pestañas «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7», consultadas el 15/10/2026.  
**Alcance:** **7 RF y 29 CA oficiales**. Sprint 1: RF-R7-01 a RF-R7-03. Sprint 2: RF-R7-04 a RF-R7-07. **Estado:** especificado, NO implementado ni validado en QA.  
**Regla de transcripción:** las descripciones y los 29 CA siguientes reproducen literalmente la fuente oficial; ninguna elección de arquitectura ni decisión sugerida modifica esos textos.

## Catálogo oficial

| RF | Funcionalidad | Prioridad | Actor | CA | Sprint |
|---|---|---|---|---:|---:|
| RF-R7-01 | Enviar imágenes en el chat del evento | Alta | Participantes y organizadores de eventos | 4 | 1 |
| RF-R7-02 | Publicar historias con imágenes del evento | Alta | Participantes de eventos | 4 | 1 |
| RF-R7-03 | Visualizar historias publicadas en el evento | Alta | Participantes de eventos | 4 | 1 |
| RF-R7-04 | Expirar las historias después de 24 horas | Alta | Participantes de eventos | 4 | 2 |
| RF-R7-05 | Agregar un evento al calendario del dispositivo | Media | Usuarios autenticados | 4 | 2 |
| RF-R7-06 | Compartir un evento mediante aplicaciones externas | Media | Usuarios autenticados | 4 | 2 |
| RF-R7-07 | Habilitar y recibir notificaciones Web Push | Media | Usuarios autenticados | 5 | 2 |

## Requisitos y criterios oficiales

### RF-R7-01 — Enviar imágenes en el chat del evento

**Prioridad:** Alta. **Actor:** Participantes y organizadores de eventos.

**Descripción:** El sistema permitirá al organizador y a los asistentes confirmados adjuntar como máximo una imagen por mensaje en el chat de un evento vigente, y consultar las imágenes conservadas en su historial autorizado.

- **RF-R7-01.CA-01:** El organizador o un asistente confirmado puede enviar como máximo una imagen de formato admitido por mensaje en un chat de evento vigente; los chats privados no admiten imágenes.
- **RF-R7-01.CA-02:** La imagen enviada queda asociada al mensaje, al remitente y al evento, y puede visualizarse al reabrir la conversación.
- **RF-R7-01.CA-03:** Los archivos con formato no permitido o las cargas fallidas se rechazan con un mensaje claro sin crear enlaces inválidos o mensajes aparentemente exitosos.
- **RF-R7-01.CA-04:** Las imágenes del chat sólo pueden ser consultadas por personas autorizadas a acceder a la conversación correspondiente.

### RF-R7-02 — Publicar historias con imágenes del evento

**Prioridad:** Alta. **Actor:** Participantes de eventos.

**Descripción:** El sistema permitirá al organizador y a los asistentes confirmados publicar historias con exactamente una imagen vinculada a un evento no finalizado, cancelado ni archivado, para compartir momentos con otros asistentes.

- **RF-R7-02.CA-01:** El organizador o un asistente confirmado puede publicar una historia de una sola imagen válida antes de que el evento termine, se cancele o se archive.
- **RF-R7-02.CA-02:** Al publicar, la historia conserva su autor, evento y fecha/hora de publicación y queda disponible en la sección correspondiente.
- **RF-R7-02.CA-03:** Si el archivo no es admitido o la publicación falla, el sistema informa el error y no presenta una historia inexistente como publicada.
- **RF-R7-02.CA-04:** Un usuario no autorizado para participar en el evento no puede publicar historias en él.

### RF-R7-03 — Visualizar historias publicadas en el evento

**Prioridad:** Alta. **Actor:** Participantes de eventos.

**Descripción:** El sistema permitirá al organizador y a los asistentes confirmados visualizar desde la ficha del evento las historias vigentes publicadas por sus participantes autorizados.

- **RF-R7-03.CA-01:** El organizador y los asistentes confirmados pueden abrir desde la ficha del evento la sección de historias vigentes compartidas por usuarios autorizados.
- **RF-R7-03.CA-02:** Las historias mostradas corresponden únicamente al evento consultado y presentan las imágenes publicadas correctamente.
- **RF-R7-03.CA-03:** El usuario puede abrir una historia disponible y regresar a la sección del evento sin perder la navegación.
- **RF-R7-03.CA-04:** Cuando no hay historias vigentes, se muestra un estado vacío; un usuario no autorizado no accede a historias restringidas.

### RF-R7-04 — Expirar las historias después de 24 horas

**Prioridad:** Alta. **Actor:** Participantes de eventos.

**Descripción:** El sistema dejará de mostrar y servir historias después de 24 horas de su publicación, calculadas con la fecha registrada por el servidor; posteriormente eliminará sus imágenes almacenadas, sin borrar mensajes ni galerías normales de eventos.

- **RF-R7-04.CA-01:** Una historia permanece disponible durante las primeras 24 horas posteriores a su fecha y hora de publicación, siempre que el usuario tenga permiso de acceso.
- **RF-R7-04.CA-02:** Tras cumplirse 24 horas, la historia deja de estar accesible incluso por enlace directo; posteriormente se elimina su imagen de Storage sin afectar otras imágenes del evento ni mensajes.
- **RF-R7-04.CA-03:** Una historia vencida tampoco puede recuperarse como contenido vigente mediante enlaces o consultas directas no autorizadas.
- **RF-R7-04.CA-04:** El cálculo del vencimiento se basa en el instante persistido de publicación y no depende de modificar el reloj local del dispositivo.

### RF-R7-05 — Agregar un evento al calendario del dispositivo

**Prioridad:** Media. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario agregar un evento a su calendario personal utilizando las capacidades del dispositivo o un archivo compatible, con fecha, hora, título y ubicación.

- **RF-R7-05.CA-01:** Desde el detalle de un evento, el usuario puede iniciar la acción de agregarlo al calendario personal.
- **RF-R7-05.CA-02:** La invitación o entrada generada contiene como mínimo título, fecha, hora y ubicación del evento, cuando esta última está disponible.
- **RF-R7-05.CA-03:** La aplicación solicita los permisos necesarios cuando corresponda y respeta una denegación sin afirmar que el evento fue agregado.
- **RF-R7-05.CA-04:** Al completar correctamente la operación, el calendario o archivo compatible refleja los datos del evento; no se exige sincronización bidireccional.

### RF-R7-06 — Compartir un evento mediante aplicaciones externas

**Prioridad:** Media. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario compartir información relevante de un evento mediante las aplicaciones externas de mensajería o redes disponibles en el dispositivo.

- **RF-R7-06.CA-01:** Desde el detalle de un evento, el usuario puede iniciar la opción Compartir y abrir el selector de aplicaciones compatibles disponible en su dispositivo.
- **RF-R7-06.CA-02:** El contenido compartido incluye información suficiente para identificar el evento, como título, fecha y un enlace o referencia accesible cuando esté disponible.
- **RF-R7-06.CA-03:** Si el usuario cancela el diálogo de compartir, la aplicación vuelve a la vista anterior sin indicar que el envío se completó.
- **RF-R7-06.CA-04:** No se incluyen datos privados del evento o de sus asistentes que el usuario no tenga permiso para compartir.

### RF-R7-07 — Habilitar y recibir notificaciones Web Push

**Prioridad:** Media. **Actor:** Usuarios autenticados.

**Descripción:** El sistema permitirá al usuario habilitar voluntariamente notificaciones Web Push en navegadores compatibles para recibir avisos ya registrados en la bandeja interna. El funcionamiento de las notificaciones internas no dependerá del permiso ni del éxito del envío Push.

- **RF-R7-07.CA-01:** Un usuario puede activar las notificaciones Web Push cuando utiliza un navegador compatible y concede el permiso correspondiente.
- **RF-R7-07.CA-02:** Los avisos Push se generan a partir de los mismos eventos que la bandeja interna, sin duplicar el aviso en ella; se incluyen mensajes privados y no se envía un aviso por cada mensaje de chat grupal.
- **RF-R7-07.CA-03:** Si el usuario rechaza el permiso o el dispositivo no es compatible, la bandeja interna de notificaciones continúa disponible.
- **RF-R7-07.CA-04:** Si el envío Push falla o la suscripción deja de ser válida, el aviso permanece en la bandeja interna y no se informa una entrega inexistente.
- **RF-R7-07.CA-05:** Un usuario puede desactivar sus suscripciones Push sin afectar el historial de avisos dentro de PlanIt.

## Trazabilidad documental y fronteras

- El nombre de RF y la descripción proceden de «Nueva planificación»; los CA de «Criterios de aceptación». «Especificación técnica» guía la implementación, pero **no autoriza cambiar texto oficial**.
- RF-R7-01 sólo habilita imagen en **chat de evento**, nunca en DM.
- RF-R7-02 y 03 requieren organizador/confirmado; poseer enlace de evento oculto no basta.
- RF-R7-04 exige imposibilidad de descargar un objeto vencido **aunque la limpieza física sea posterior**.
- RF-R7-05 no promete escritura confirmada en calendario tercero ni sincronización.
- RF-R7-06 no promete entrega efectiva a otra aplicación y no emite grants privados.
- RF-R7-07 complementa `notifications` preexistentes: no introduce mensajes Push grupales ni duplica filas internas.
- Decisiones técnicas abiertas: `../implementation/RELEASE_7_DECISIONS_PROPOSED.md`. Pruebas: `../qa/RELEASE_7_ACCEPTANCE.md`.