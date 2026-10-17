# PlanIt — Release 7 · Matriz de aceptación (29 CA oficiales)

**Corte B11 (17/10/2026):** composición implementada; 29 CA evaluados, 4 PASS técnicos locales / 25 BLOCKED / 0 FAIL. NO-GO para aceptación integral. **Regla:** el texto oficial de cada CA se reproduce literalmente y el resultado/evidencia es independiente. `NOT RUN` no significa aprobado.
**Estados:** PASS / FAIL / NOT RUN / BLOCKED. Si un CA requiere pruebas de permisos, UI y Storage, registrar **todas** las capas antes de PASS.

| Criterio oficial | Texto normativo exacto | Bloque | Nivel mínimo de prueba | Resultado | Evidencia |
|---|---|---|---|---|---|
| RF-R7-01.CA-01 | El organizador o un asistente confirmado puede enviar como máximo una imagen de formato admitido por mensaje en un chat de evento vigente; los chats privados no admiten imágenes. | B2/B3 | SQL + HTTP/JWT + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-01ca-01--blocked) |
| RF-R7-01.CA-02 | La imagen enviada queda asociada al mensaje, al remitente y al evento, y puede visualizarse al reabrir la conversación. | B2/B3 | SQL + Storage GET + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-01ca-02--blocked) |
| RF-R7-01.CA-03 | Los archivos con formato no permitido o las cargas fallidas se rechazan con un mensaje claro sin crear enlaces inválidos o mensajes aparentemente exitosos. | B2/B3 | Storage/upload negativo + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-01ca-03--blocked) |
| RF-R7-01.CA-04 | Las imágenes del chat sólo pueden ser consultadas por personas autorizadas a acceder a la conversación correspondiente. | B2/B3 | RLS + Storage GET negativo | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-01ca-04--blocked) |
| RF-R7-02.CA-01 | El organizador o un asistente confirmado puede publicar una historia de una sola imagen válida antes de que el evento termine, se cancele o se archive. | B4/B5 | SQL concurrencia + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-02ca-01--blocked) |
| RF-R7-02.CA-02 | Al publicar, la historia conserva su autor, evento y fecha/hora de publicación y queda disponible en la sección correspondiente. | B4/B5 | BD + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-02ca-02--blocked) |
| RF-R7-02.CA-03 | Si el archivo no es admitido o la publicación falla, el sistema informa el error y no presenta una historia inexistente como publicada. | B4/B5 | storage error + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-02ca-03--blocked) |
| RF-R7-02.CA-04 | Un usuario no autorizado para participar en el evento no puede publicar historias en él. | B4/B5 | RLS anon/terceros | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-02ca-04--blocked) |
| RF-R7-03.CA-01 | El organizador y los asistentes confirmados pueden abrir desde la ficha del evento la sección de historias vigentes compartidas por usuarios autorizados. | B4/B5 | HTTP/JWT + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-03ca-01--blocked) |
| RF-R7-03.CA-02 | Las historias mostradas corresponden únicamente al evento consultado y presentan las imágenes publicadas correctamente. | B4/B5 | RLS + UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-03ca-02--blocked) |
| RF-R7-03.CA-03 | El usuario puede abrir una historia disponible y regresar a la sección del evento sin perder la navegación. | B4/B5 | UI/nav móvil/desktop | PASS | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-03ca-03--pass) |
| RF-R7-03.CA-04 | Cuando no hay historias vigentes, se muestra un estado vacío; un usuario no autorizado no accede a historias restringidas. | B4/B5 | RLS + vacío/ERROR UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-03ca-04--blocked) |
| RF-R7-04.CA-01 | Una historia permanece disponible durante las primeras 24 horas posteriores a su fecha y hora de publicación, siempre que el usuario tenga permiso de acceso. | B6 | reloj servidor + API | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-04ca-01--blocked) |
| RF-R7-04.CA-02 | Tras cumplirse 24 horas, la historia deja de estar accesible incluso por enlace directo; posteriormente se elimina su imagen de Storage sin afectar otras imágenes del evento ni mensajes. | B6 | GET Storage a T+24h + cleanup | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-04ca-02--blocked) |
| RF-R7-04.CA-03 | Una historia vencida tampoco puede recuperarse como contenido vigente mediante enlaces o consultas directas no autorizadas. | B6 | GET Storage negativo | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-04ca-03--blocked) |
| RF-R7-04.CA-04 | El cálculo del vencimiento se basa en el instante persistido de publicación y no depende de modificar el reloj local del dispositivo. | B6 | clock skew + DB | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-04ca-04--blocked) |
| RF-R7-05.CA-01 | Desde el detalle de un evento, el usuario puede iniciar la acción de agregarlo al calendario personal. | B7 | UI accion | PASS | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-05ca-01--pass) |
| RF-R7-05.CA-02 | La invitación o entrada generada contiene como mínimo título, fecha, hora y ubicación del evento, cuando esta última está disponible. | B7 | ICS parser + TZ | PASS | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-05ca-02--pass) |
| RF-R7-05.CA-03 | La aplicación solicita los permisos necesarios cuando corresponda y respeta una denegación sin afirmar que el evento fue agregado. | B7 | permiso/cancelación | PASS | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-05ca-03--pass) |
| RF-R7-05.CA-04 | Al completar correctamente la operación, el calendario o archivo compatible refleja los datos del evento; no se exige sincronización bidireccional. | B7 | ICS import cliente final | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-05ca-04--blocked) |
| RF-R7-06.CA-01 | Desde el detalle de un evento, el usuario puede iniciar la opción Compartir y abrir el selector de aplicaciones compatibles disponible en su dispositivo. | B8 | Web Share UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-06ca-01--blocked) |
| RF-R7-06.CA-02 | El contenido compartido incluye información suficiente para identificar el evento, como título, fecha y un enlace o referencia accesible cuando esté disponible. | B8 | payload público/oculto | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-06ca-02--blocked) |
| RF-R7-06.CA-03 | Si el usuario cancela el diálogo de compartir, la aplicación vuelve a la vista anterior sin indicar que el envío se completó. | B8 | AbortError UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-06ca-03--blocked) |
| RF-R7-06.CA-04 | No se incluyen datos privados del evento o de sus asistentes que el usuario no tenga permiso para compartir. | B8 | privacidad y R4 link negativo | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-06ca-04--blocked) |
| RF-R7-07.CA-01 | Un usuario puede activar las notificaciones Web Push cuando utiliza un navegador compatible y concede el permiso correspondiente. | B9/B10 | dispositivo real | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-07ca-01--blocked) |
| RF-R7-07.CA-02 | Los avisos Push se generan a partir de los mismos eventos que la bandeja interna, sin duplicar el aviso en ella; se incluyen mensajes privados y no se envía un aviso por cada mensaje de chat grupal. | B9/B10 | notificaciones + push + DM/group | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-07ca-02--blocked) |
| RF-R7-07.CA-03 | Si el usuario rechaza el permiso o el dispositivo no es compatible, la bandeja interna de notificaciones continúa disponible. | B9/B10 | denied/unsupported UI | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-07ca-03--blocked) |
| RF-R7-07.CA-04 | Si el envío Push falla o la suscripción deja de ser válida, el aviso permanece en la bandeja interna y no se informa una entrega inexistente. | B9/B10 | Edge retry + bandeja | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-07ca-04--blocked) |
| RF-R7-07.CA-05 | Un usuario puede desactivar sus suscripciones Push sin afectar el historial de avisos dentro de PlanIt. | B9/B10 | unsubscribe multi-device + DB | BLOCKED | [Capas y pendientes](r7-block-11/CRITERIA.md#rf-r7-07ca-05--blocked) |

## Definición de validación

Para cada CA completar fecha, comando/test, cuenta/rol, fixture, entorno local/remoto, expected/actual, evidencia (log/screenshot), SHA/PR y quién aceptó. **No actualizar el texto del CA** para que un test pase. Un CHECK de SQL estático no demuestra RLS en HTTP. Un screenshot sin consulta real no demuestra expiración de Storage.

## Gate

- **GO** sólo cuando 29/29 CA PASS en entorno acordado, sin hallazgos de seguridad críticos, regresiones R1–R6 PASS y aceptación humana. Si algún test de dispositivos/navegadores relevante permanece `NOT RUN`, documentar explícitamente y decidir NO-GO o excepción formal.
- **NO-GO** si acceso a imágenes por ajenos, después de 24h por nuevas URLs autenticadas, DM con adjunto, notificación interna duplicada, secreto expuesto, o inconsistencia de estado que simula éxito.

## Anexo de decisiones R7 (no modifica los 29 criterios oficiales)

- **R7-01:** test obligatorio de mensaje sólo imagen JPEG/PNG/WebP <=5MiB; ningún DM tiene adjuntos.
- **R7-02/03:** probar **visor tipo Instagram**, autoplay/progreso, pausa, touch/teclado y accesibilidad; sin límite máximo por usuario/evento.
- **R7-04:** historia persiste hasta 24h **aunque finalice evento normalmente** y se deniega exactamente al vencer, incluso GET directo; remover membresía revoca acceso.
- **R7-05:** probar enlace de Google Calendar precargado además de `.ics` (sin afirmaciones falsas de agregado).
- **R7-06:** sólo organizador comparte invitación de oculto.
- **R7-07:** DM Push contiene preview cuando habilitada; al ocultar previews es genérico; bandeja única y sin Push por chat grupal.
- **Integración:** `RELEASE_7_PARALLEL_WORK.md` define DAG, PRs, owner por archivo y gate de B11; ejecutar `QA-PARALLEL-*` del plan.