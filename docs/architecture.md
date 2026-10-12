# PlanIt — Arquitectura

PlanIt es una PWA universitaria para descubrir, organizar y participar en eventos. No se utiliza React Native ni Expo.

## R3 Bloque 5 — Acciones del organizador

Detalle y menú Organizo comparten confirmaciones accesibles para cancelar/archivar/duplicar; cierre usa RPC autorizadas, bloquea doble envío y reconcilia respuestas inciertas por lectura. Después reconsulta detalle, cupos y listas; archivo permanece en el histórico propio. `/events/new?duplicateFrom=:id` reutiliza el formulario de creación con origen autorizado por BD, fechas vacías y sin fotos/relaciones heredadas; no persiste hasta publicar. Renovación de token conserva cambios; cuenta/origen distinto descarta formulario/respuestas anteriores. La creación normal mantiene UUID idempotente nuevo y conversación vacía. Migración aplicada y verificada en planit-v2 el 12/10/2026 con autorización explícita posterior del usuario; sin merge/despliegue. [Contratos, ocho CA, pruebas y capturas](design/verification/r3-block-5/README.md).

## Stack
- React + TypeScript + Vite; React Router; vite-plugin-pwa.
- Supabase Auth, PostgreSQL con RLS, Storage y Realtime.
- Edge Functions sólo para funcionalidades que requieran secretos (por ejemplo, Web Push).
- Un repositorio: frontend en src/ y migraciones en supabase/migrations/.

## Principios funcionales
- Todos los usuarios pueden organizar e inscribirse, pero un organizador no consume cupo de su evento.
- Eventos completos desde su primera persistencia: NO hay drafts en PostgreSQL.
- Una categoría por evento, múltiples intereses por usuario.
- Eventos públicos y ocultos (unlisted); los ocultos requieren autenticación y autorización persistente. Una revocación individual prevalece sobre un enlace válido.
- Cupos, inscripciones y reingresos se resuelven transaccionalmente.
- Los eventos se cancelan o archivan, nunca se eliminan físicamente. Chats de eventos finalizados o cancelados quedan en sólo lectura para la audiencia histórica autorizada.
- DM entre dos personas; bloquear impide mensajes privados y seguimientos, no chat grupal.
- Máximo 10 imágenes por evento, una por mensaje grupal y una por historia. Historias vencen a las 24 horas.
- Bandeja interna de notificaciones; Web Push opcional. Mensajes grupales no generan notificación.
- Fecha-hora propia: timestamp without time zone, interpretado como horario Argentina (America/Argentina/Buenos_Aires). No agregar events.timezone.

## Reglas de ingeniería
- Código legible, simple y orientado a requisitos, sin capas empresariales superfluas.
- RLS en cada tabla pública y acceso restringido a datos de perfil.
- Sin secretos en frontend, repositorio o configuración pública.
- Revisar y probar SQL en una rama; no modificar bases remotas sin permiso.
- Repositorio GitHub: EnzoG14/PlanIt.
- Supabase nuevo: planit-v2 (iepeqmvzjguwlhnecsdq); antiguo PlanIt (fmqzokxvpqxfzvcnzvjm) sólo lectura.

Ver ../AGENTS.md, ../src/AGENTS.md, ../supabase/AGENTS.md y database.md.

## Mis eventos organizados — R3 Bloque 1

Para administración de asistentes R3 Bloque 4, `/events/:id/attendees` se enlaza desde detalle propio/menú Organizo conservando el origen y filtro. RPC `get_event_attendees` verifica auth.uid()/autoría y devuelve confirmed/removed paginados con proyección mínima, sin abrir profiles ni RLS de terceros. Avatares de iniciales hasta contar con lectura social autorizada. `remove_participant` comparte locks evento→participación con inscripción/retiro/chat y reutiliza el trigger de historial; sólo eventos vigentes, sin DELETE ni reinscripción ordinaria de removed. UI confirma/cancela y reconcilia después de operar. Chat revalida acceso visible cada 30 s y vacía historial/canal/composer ante denegación. Migración aplicada y verificada en planit-v2 con autorización explícita el 12/10/2026; pruebas locales/fixtures PASS, HTTP/JWT y aceptación humana pendientes. [Contratos, ocho CA y evidencia](design/verification/r3-block-4/README.md).

`/my-events?section=organizing&filter=…` conserva Organizo/Participo. Organizo consulta filtros completos en get_my_organized_events antes de paginar; Participo conserva get_my_events. MyEventsPage/CompactEventCard reutilizan fotos firmadas, estados y carga adicional, añaden Actualizar y menú Ver detalle. El detalle valida destinos internos y conserva sección/filtro, con fallback Organizo para dueño y orígenes Inicio/Mapa explícitos. Migración **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**, historial sincronizado y verificación SQL remota de sólo lectura PASS. HTTP/JWT y aceptación humana pendientes; sin despliegue frontend. [Contratos, pruebas y capturas](design/verification/r3-block-1/README.md).

## Notificaciones R2 — BLOQUE 4

Ruta protegida `/notifications`, campana en cabecera y consulta paginada por created_at/id. Tabla notifications con RLS propia del destinatario; sólo read_at actualizable con hora servidor y primera lectura inmutable. RPCs SECURITY INVOKER reutilizan RLS existente para destinos de eventos/chat y revalidan al abrir. Estado aislado por cuenta, Postgres Changes INSERT/UPDATE por destinatario y reconciliación mediante RPC; sin avisos generados ni Push. Campana y bandeja comparten un canal por cuenta, con COUNT exacto sujeto a RLS desde cualquier ruta. Migración `20261011163653_notifications_inbox.sql` aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario; historial sincronizado y permisos verificados. [Evidencia y límites](design/verification/notifications/README.md).

## Chat R2 — BLOQUE 2

Ruta protegida `/events/:id/chat` desde detalle para organizador/confirmed. RPC autorizadas entregan header/estado e historial paginado con representación social mínima; envío transaccional con UUID idempotente y bloqueo evento/participación. Tablas con RLS sin mutaciones REST del cliente. Historial de eventos cerrados sólo lectura; retirados/removidos sin acceso. Postgres Changes INSERT por conversation_id, creado después de autorizar el header; mensajes completos desde get_event_chat_messages, deduplicación UUID y orden created_at/id. Migración `20261010214526_event_chat.sql` aplicada en planit-v2 el 10/10/2026 con autorización del usuario; historial sincronizado y RLS/grants verificados. [Evidencia y límites](design/verification/event-chat/README.md).

## Base frontend — BLOQUE 0

- React Router con layout común y rutas `/register`, `/login`, `/map`, `/events/new`, `/my-events`, `/events/:id` y 404; `/` redirige a `/map`.
- El BLOQUE 0 comenzó con páginas de preparación. Auth fue reemplazada por formularios y sesión real; `/events/new` y `/events/:id` ahora implementan creación y consulta mínima. Mapa y Mis eventos conservan su estado de preparación para los bloques siguientes.
- CSS propio responsive, variables compartidas y componentes sencillos. Sin biblioteca adicional de estilos.
- Cliente Supabase único: valida URL exacta de planit-v2 y formato publishable; si falta configuración, no crea cliente y muestra un aviso sin imprimir valores. Una validación local no prueba conectividad ni permisos.
- PWA con iconos propios y precache sólo de recursos estáticos del build. Sin runtime caching de Supabase, Auth, perfiles, imágenes privadas ni tiles. La app no ofrece operaciones de eventos offline.

## Decisión de mapa

Mapbox GL JS 3.32.0 aislado en `src/components/maps`, cargado con el componente diferido. Standard nocturno, controles accesibles, atribución visible y marcadores DOM actualizados sin reconstruir el mapa. Página, dominio, geolocalización y RPC conservan sus responsabilidades. Token exclusivamente público `VITE_MAPBOX_ACCESS_TOKEN`, restringido por URL; errores del motor no bloquean tarjetas ni detalles. Sin cambios de Auth, SQL, RLS o backend.

Si el motor no está disponible, las tarjetas consultan un área aproximada del centro elegido (Buenos Aires inicialmente); el aviso distingue esta zona del viewport real. Mapbox usa red y caché HTTP normal, sin descarga anticipada ni caché offline de servicios. La implementación previa Leaflet/OSM y su aceptación R1 se conservan en documentación histórica. [Arquitectura](map-architecture.md), [implementación](implementation/MAPBOX_MIGRATION.md).

## Galería administrable — Release 3

Galería administrativa R3 en `/events/:id/gallery`, con selección/preview local, cargas individuales, reintentos por path inmutable y operaciones RPC controladas del organizador. Portada por sort_order; los objetos registrados se retienen al quitar asociaciones para conservar archivos compartidos. Recuperación explícita de cargas no registradas mediante Storage API. Migración `20261012013634_manage_event_gallery.sql` **aplicada en planit-v2 el 11/10/2026 con autorización expresa posterior del usuario**; historial, cuerpos y permisos remotos verificados, HTTP/JWT real pendiente. [Contratos, capturas y límites](design/verification/r3-block-3/README.md).

## Creación de eventos — BLOQUE 2

Formulario local en `src/pages/CreateEventPage.tsx`, validación/fechas y llamadas en `src/features/events/`. Campos de inicio y fin se envían como timestamps de Argentina sin conversión desde la zona del dispositivo. Ubicación manual y geolocalización optativa según alternativa admitida por el plan técnico; mapa de descubrimiento pendiente del BLOQUE 3.

La publicación sube fotos opcionales y llama a `create_event` para insertar evento completo y relaciones atómicamente, usando identidad derivada de Auth y RLS. Reintentos inciertos conservan un UUID, datos y archivos sólo en memoria. `/events/:id` consulta el registro y media autorizada para confirmar el resultado. Las rutas de eventos se cargan por separado para conservar el tamaño del bundle inicial. No se agregaron dependencias de producción.

SQL y bucket **aplicados en planit-v2 el 10/10/2026 con autorización del usuario**. Historial de migraciones sincronizado; creación, validaciones y permisos probados por SQL remoto con ROLLBACK, sin dejar eventos de prueba. Storage HTTP y el flujo completo desde el navegador siguen pendientes de prueba real. [Pruebas, capturas, alcance y pendientes](design/verification/create-event-r1/README.md).

## Sincronización Realtime R2 — RF-R2-04/05/07

La migración 20261011193316_r2_realtime_chat_notifications.sql fue **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**. Incorpora messages/notifications a supabase_realtime sin ampliar grants o políticas; añade get_notification_changes(uuid[]) SECURITY INVOKER para lotes de hasta 100 IDs e índice parcial de no leídas. No cambia RPCs anteriores ni perfiles. El payload sólo invalida consultas (chat también utiliza fecha/UUID como pista de recuperación), nunca proporciona datos definitivos de presentación.

Un reconciliador de 40 ms agrupa ráfagas y serializa las lecturas. Conserva una invalidación recibida durante una petición y ejecuta otra lectura después. Cada efecto tiene cierre activo propio: respuestas/callbacks anteriores se descartan al desmontar, cambiar evento/cuenta o cerrar sesión. Auth actualiza el JWT del cliente Realtime; TOKEN_REFRESHED provoca revalidación fuera del callback síncrono de Auth.

SUBSCRIBED siempre reconcilia, incluso en la primera conexión: cubre el intervalo carga/suscripción y no asume replay histórico. CHANNEL_ERROR/TIMED_OUT muestran desconexión y utilizan el rejoin del SDK; CLOSED recrea el canal con backoff 1–30 s. Foco, visibilidad y online son respaldo dirigido por eventos; no hay polling de datos. Un fallo de consulta limpia datos privados; la campana oculta un contador desconocido, sin inventar cero.

Chat conserva páginas anteriores y busca hacia atrás hasta el límite cargado al reconectar; las señales normales recuperan desde el último mensaje o una pista anterior si una transacción llega tarde. Se mantienen microsegundos y desempate por UUID. El scroll sigue al final sólo si el lector ya estaba allí; al paginar conserva el mensaje visible como ancla. Envío idempotente y estados de cierre siguen autorizados por PostgreSQL.

Bandeja utiliza get_notifications para carga/paginación/recuperación del rango cargado y get_notification_changes para señales normales, sin cargar toda la bandeja por cada aviso. Mantiene su cursor, deduplica por UUID y ordena descendente; lecturas locales confirmadas y destinos revalidados no son reemplazados por respuestas previas. COUNT HEAD exacto de notifications/read_at IS NULL usa SELECT propio y filtro recipient_id; la autorización sigue siendo RLS.

La recepción real depende de la publicación activa y RLS evaluada por Supabase. Los tests locales verifican permisos/SELECT del mismo contrato; el navegador intercepta el protocolo WebSocket y no acredita entrega remota. Una revocación silenciosa sin nuevos mensajes se detecta en la siguiente revalidación (foco/reconexión/consulta/envío); no se publican participaciones ni se añade polling para detectar revocaciones instantáneamente. [Evidencia, manual remoto y límites](design/verification/realtime/README.md).

## Reincorporaciones R3 — Bloque 6

Implementadas en Git y probadas localmente; migración remota pendiente. El removido solicita desde detalle mediante `request_rejoin`; el organizador revisa `/events/:id/rejoin-requests`, enlazada desde Asistentes. Lecturas mínimas autorizadas por RPC, RLS propia y ninguna escritura genérica. `pending` corresponde únicamente a solicitud; aprobar reconfirma la participación existente y recupera los permisos de chat ya definidos.

Resolución y cupo son transaccionales con el mismo lock de evento que inscripción/edición/remoción/cierre. Una respuesta perdida se comprueba por solicitud exacta antes de reintentar; cuenta/evento nuevos descartan respuestas anteriores. Refresco explícito/foco/online/visibilidad, sin nueva publicación Realtime ni notificaciones automáticas. Rechazos tras el cierre permitidos por decisión del usuario; pedidos/aprobaciones bloqueados. [Contratos, nueve CA y evidencia](design/verification/r3-block-6/README.md).

Verificación de despliegue (11/10/2026): historial local/remoto con 11 versiones sincronizadas, dry-run sin pendientes, publicación supabase_realtime con messages/notifications, RPC invoker y RLS/grants intactos e índice parcial presente. Worktree configurado con .env.local ignorado (URL y publishable key), build PASS. Entrega WS/JWT con dos sesiones reales sigue pendiente.
