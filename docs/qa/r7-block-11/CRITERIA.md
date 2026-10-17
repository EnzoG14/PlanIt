# R7 B11 — Evaluación de 29 criterios

17/10/2026. PASS técnico acotado a las capas expresadas; BLOCKED conserva pruebas parciales ejecutadas. Aceptación humana pendiente. No se modificó ningún CA oficial.

## RF-R7-01.CA-01 — BLOCKED

El organizador o un asistente confirmado puede enviar como máximo una imagen de formato admitido por mensaje en un chat de evento vigente; los chats privados no admiten imágenes.

**Ejecutado:** SQL chat v2: una imagen, texto/imagen, DM texto-only y locks; UI de chat B3 heredada.

**Límite/gate:** HTTP/JWT y Storage positivos/negativos A–G integrados no ejecutados.

## RF-R7-01.CA-02 — BLOCKED

La imagen enviada queda asociada al mensaje, al remitente y al evento, y puede visualizarse al reabrir la conversación.

**Ejecutado:** Asociación, cursor, idempotencia y lectura SQL PASS; responsable confirmó imagen real en B3 (histórica).

**Límite/gate:** No se repitió reapertura real autenticada con la composición B11.

## RF-R7-01.CA-03 — BLOCKED

Los archivos con formato no permitido o las cargas fallidas se rechazan con un mensaje claro sin crear enlaces inválidos o mensajes aparentemente exitosos.

**Ejecutado:** Decoder WASM real, cliente y handler rechazan MIME, bytes truncados, tamaño y errores; SQL rollback PASS.

**Límite/gate:** Upload/validación/commit/fallo HTTP integrado pendiente.

## RF-R7-01.CA-04 — BLOCKED

Las imágenes del chat sólo pueden ser consultadas por personas autorizadas a acceder a la conversación correspondiente.

**Ejecutado:** SET ROLE y operación Storage simulada niegan C/D/E/F/anon y remoción; handler revalida JWT/target mediante stubs.

**Límite/gate:** GET/JWT reales de terceros y revocación no ejecutados en B11.

## RF-R7-02.CA-01 — BLOCKED

El organizador o un asistente confirmado puede publicar una historia de una sola imagen válida antes de que el evento termine, se cancele o se archive.

**Ejecutado:** Publicación SQL de organizer/confirmed, fin/cancelación/archivo, locks e idempotencia; publisher UI aislado.

**Límite/gate:** Publicación integrada HTTP/Storage con JWT reales pendiente.

## RF-R7-02.CA-02 — BLOCKED

Al publicar, la historia conserva su autor, evento y fecha/hora de publicación y queda disponible en la sección correspondiente.

**Ejecutado:** SQL conserva autor/evento/tiempos servidor/archivo exclusivo; lista y UI aislada de B5.

**Límite/gate:** Lectura después de publicación real con JWT no ejecutada.

## RF-R7-02.CA-03 — BLOCKED

Si el archivo no es admitido o la publicación falla, el sistema informa el error y no presenta una historia inexistente como publicada.

**Ejecutado:** Cliente/decoder/handler/rollback y publisher con error o respuesta incierta.

**Límite/gate:** Rechazo completo del upload real y comprobación persistida pendiente.

## RF-R7-02.CA-04 — BLOCKED

Un usuario no autorizado para participar en el evento no puede publicar historias en él.

**Ejecutado:** SQL niega pending/removed/link-only/tercero/anon; detalle integrado oculta entry de link-only.

**Límite/gate:** Negativos HTTP/JWT y Storage real pendientes.

## RF-R7-03.CA-01 — BLOCKED

El organizador y los asistentes confirmados pueden abrir desde la ficha del evento la sección de historias vigentes compartidas por usuarios autorizados.

**Ejecutado:** Detalle real App/router monta sección para confirmed/owner; link-only no la monta.

**Límite/gate:** Autorización HTTP/JWT real de las dos identidades pendiente.

## RF-R7-03.CA-02 — BLOCKED

Las historias mostradas corresponden únicamente al evento consultado y presentan las imágenes publicadas correctamente.

**Ejecutado:** RPC SQL impide cross-event; detalle abre Blob de historia sintética y el handler comprueba target.

**Límite/gate:** Imagen real autenticada por evento y negativos remotos pendientes.

## RF-R7-03.CA-03 — PASS

El usuario puede abrir una historia disponible y regresar a la sección del evento sin perder la navegación.

**Ejecutado:** Edge headless en 320/375/390/768/1280 abre StoryViewer desde el detalle, Escape cierra y conserva URL del detalle.

**Límite/gate:** PASS local de navegación con Auth/RPC/imagen sintéticos; gestos/lector reales no ejecutados.

## RF-R7-03.CA-04 — BLOCKED

Cuando no hay historias vigentes, se muestra un estado vacío; un usuario no autorizado no accede a historias restringidas.

**Ejecutado:** Estado vacío integrado; retirar participación y denegar detalle retira acciones; SQL niega lectura a ajenos.

**Límite/gate:** RLS/Storage por transporte real pendiente.

## RF-R7-04.CA-01 — BLOCKED

Una historia permanece disponible durante las primeras 24 horas posteriores a su fecha y hora de publicación, siempre que el usuario tenga permiso de acceso.

**Ejecutado:** SQL prueba disponibilidad y predicado estricto de expiración; fin normal conserva lectura; handler revalida tras I/O.

**Límite/gate:** Frontera temporal por HTTP/Storage real pendiente.

## RF-R7-04.CA-02 — BLOCKED

Tras cumplirse 24 horas, la historia deja de estar accesible incluso por enlace directo; posteriormente se elimina su imagen de Storage sin afectar otras imágenes del evento ni mensajes.

**Ejecutado:** SQL/handler prueban lease, ACK perdido, concurrencia, retry y conservación de galería/avatar/DM/mensajes.

**Límite/gate:** r7-media-cleanup no desplegada y cron inactivo según B6; no eliminación física Storage real.

## RF-R7-04.CA-03 — BLOCKED

Una historia vencida tampoco puede recuperarse como contenido vigente mediante enlaces o consultas directas no autorizadas.

**Ejecutado:** SQL niega RPC/files/objeto al autor y confirmed vencidos; sin firmas R7 ni bypass uploader.

**Límite/gate:** GET/sign/list/HEAD reales a T+24h no ejecutados.

## RF-R7-04.CA-04 — BLOCKED

El cálculo del vencimiento se basa en el instante persistido de publicación y no depende de modificar el reloj local del dispositivo.

**Ejecutado:** created_at/expires_at servidor, zonas extremas y cálculo monotónico UI; reloj local no renueva TTL.

**Límite/gate:** Cambio de reloj de dispositivo y descarga real en frontera no ejecutados.

## RF-R7-05.CA-01 — PASS

Desde el detalle de un evento, el usuario puede iniciar la acción de agregarlo al calendario personal.

**Ejecutado:** Detalle real ofrece las dos acciones y descarga .ics en cinco viewports.

**Límite/gate:** PASS local UI; no afirma escritura en calendario externo.

## RF-R7-05.CA-02 — PASS

La invitación o entrada generada contiene como mínimo título, fecha, hora y ubicación del evento, cuando esta última está disponible.

**Ejecutado:** Parser independiente ical.js 2.2.1: título/horario/ubicación, UTC Argentina, Unicode, escaping/folding e inyección.

**Límite/gate:** PASS sobre archivo compatible generado; cinco TZ de proceso y navegador Asia/Tokyo.

## RF-R7-05.CA-03 — PASS

La aplicación solicita los permisos necesarios cuando corresponda y respeta una denegación sin afirmar que el evento fue agregado.

**Ejecutado:** ICS no requiere permiso; evento oculto confirma exportación; UI sólo informa archivo ofrecido/Google solicitado.

**Límite/gate:** PASS del flujo sin permisos innecesarios; sin OAuth ni promesa de guardado externo.

## RF-R7-05.CA-04 — BLOCKED

Al completar correctamente la operación, el calendario o archivo compatible refleja los datos del evento; no se exige sincronización bidireccional.

**Ejecutado:** Archivo descargado y parser reflejan datos; URL Google codificada probada localmente.

**Límite/gate:** Importación en cliente calendario final/guardado Google real no ejecutados.

## RF-R7-06.CA-01 — BLOCKED

Desde el detalle de un evento, el usuario puede iniciar la opción Compartir y abrir el selector de aplicaciones compatibles disponible en su dispositivo.

**Ejecutado:** Detalle llama navigator.share por gesto y fallback probado en componente con APIs simuladas.

**Límite/gate:** Selector nativo de aplicaciones en dispositivo compatible no ejecutado.

## RF-R7-06.CA-02 — BLOCKED

El contenido compartido incluye información suficiente para identificar el evento, como título, fecha y un enlace o referencia accesible cuando esté disponible.

**Ejecutado:** Payload allowlist real probado: título/fecha/enlace canónico, oculto sólo token emitido en diálogo owner.

**Límite/gate:** Verificar referencia/canje final en apps y despliegue público, no sólo origen sintético.

## RF-R7-06.CA-03 — BLOCKED

Si el usuario cancela el diálogo de compartir, la aplicación vuelve a la vista anterior sin indicar que el envío se completó.

**Ejecutado:** AbortError simulado en detalle devuelve sin aviso de envío; fallback/error probados aisladamente.

**Límite/gate:** Cancelación en selector nativo de dispositivo no ejecutada.

## RF-R7-06.CA-04 — BLOCKED

No se incluyen datos privados del evento o de sus asistentes que el usuario no tenga permiso para compartir.

**Ejecutado:** Sin asistentes/descripción/estadísticas; token oculto sólo owner/en memoria; sin rotación automática; R4 SQL negativo.

**Límite/gate:** JWT/rotación/canje reales y revisión final de aplicaciones destino pendientes.

## RF-R7-07.CA-01 — BLOCKED

Un usuario puede activar las notificaciones Web Push cuando utiliza un navegador compatible y concede el permiso correspondiente.

**Ejecutado:** SQL y UI opt-in/permiso/sincronización; recepción real confirmada por responsable en B10, evidencia heredada.

**Límite/gate:** No se repitió alta/recepción física con build B11 ni Android/iOS.

## RF-R7-07.CA-02 — BLOCKED

Los avisos Push se generan a partir de los mismos eventos que la bandeja interna, sin duplicar el aviso en ella; se incluyen mensajes privados y no se envía un aviso por cada mensaje de chat grupal.

**Ejecutado:** SQL cola/notificación única, DM preview habilitada/oculta y ausencia grupo; Edge9 tests; SW sintético.

**Límite/gate:** No se repitió DM real, no Push grupal y dos dispositivos en entorno acordado.

## RF-R7-07.CA-03 — BLOCKED

Si el usuario rechaza el permiso o el dispositivo no es compatible, la bandeja interna de notificaciones continúa disponible.

**Ejecutado:** UI denied/unsupported por fixtures; SQL/inbox independientes; PushSettings existente único en Perfil.

**Límite/gate:** Permiso denegado real con bandeja/Realtime funcional en dispositivo no ejecutado.

## RF-R7-07.CA-04 — BLOCKED

Si el envío Push falla o la suscripción deja de ser válida, el aviso permanece en la bandeja interna y no se informa una entrega inexistente.

**Ejecutado:** SQL/handler inyectan 404/410/429/5xx/timeout/ACK perdido; aviso intacto y sin éxito falso.

**Límite/gate:** Fallas de proveedor/suscripción y bandeja reales integradas pendientes.

## RF-R7-07.CA-05 — BLOCKED

Un usuario puede desactivar sus suscripciones Push sin afectar el historial de avisos dentro de PlanIt.

**Ejecutado:** SQL dos endpoints, baja idempotente sin perder inbox; UI unsubscribe y cambio de identidad con fixtures.

**Límite/gate:** Baja/cierre de sesión reales con dos dispositivos y mensajes en vuelo pendientes.
