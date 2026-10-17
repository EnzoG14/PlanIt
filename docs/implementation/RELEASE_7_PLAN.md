# PlanIt — Plan técnico de implementación Release 7 · Contenido social e integraciones

**Versión:** Propuesta 2.0 · 15/10/2026 · **Estado:** planificación actualizada con decisiones del responsable, NO ejecución. **Estrategia:** 2+ personas en paralelo según `RELEASE_7_PARALLEL_WORK.md`.  
**Repositorio leído:** [https://github.com/EnzoG14/PlanIt](https://github.com/EnzoG14/PlanIt), rama por defecto `main`, y documentación R1–R6, particularmente plan, acta B0, prompts B0–B9, QA R6. Los nombres nuevos y firmas a continuación son **contratos candidatos** y deben verificarse/congelarse en B0.  
**Contrato funcional:** `../requirements/RELEASE_7_REQUIREMENTS.md` con **7 RF / 29 CA literales** de [https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit).  
**Regla de entrada especial:** por instrucción del responsable, **suponer R6 completa y correcta** para el diseño y no programar correcciones pendientes de R6.

## A. Objetivo, valor y límites de producto

R7 enriquece comunicación **dentro de eventos** (adjuntos visuales, historias efímeras) e interoperabilidad **desde la PWA** (calendario, share, notificaciones opcionales). No agrega una red social generalista, adjuntos en DM, contenido audiovisual, pagos, APIs de calendario con OAuth, reacciones a historias ni canales Push por mensaje grupal. Para RF-R7-05 se recomiendan `.ics` **más enlace directo para precargar Google Calendar** sin OAuth; la API OAuth no queda incluida sin decisión posterior.

| RF | Comportamiento | Prioridad | Sprint | Bloques | Dependencias existentes |
|---|---|---|---|---|---|
| RF-R7-01 | Imagen opcional al mensaje de evento | Alta | 1 | B1–B3 | R2 chat + R3 Storage |
| RF-R7-02 | Crear historia de una imagen | Alta | 1 | B1, B4, B5 | Auth, estado y confirmed |
| RF-R7-03 | Leer historias del evento autorizado | Alta | 1 | B4–B5 | R4 ocultos, R3 gestión |
| RF-R7-04 | Inaccesible a las 24 h y limpieza diferida | Alta | 2 | B1, B4, B6 | RLS Storage, clock server |
| RF-R7-05 | Archivo `.ics` + enlace Google Calendar precargado **confirmados** (sin OAuth) | Media | 2 | B7 | R2 detalle, fechas AR |
| RF-R7-06 | Web Share + fallback seguro | Media | 2 | B8 | R4 enlaces ocultos |
| RF-R7-07 | Opt-in Web Push complementaria | Media | 2 | B9–B10 | R2 bandeja, R5 DM, R6 avisos |

### Invariantes de producto

1. **Identidad siempre servidor**: `auth.uid()` de JWT; no confiar en `sender_id`, `author_id`, `recipient_id` o rol del cliente.
2. Usuario con **enlace oculto** puede ver detalle sin inscribirse, pero NO chat/historias.
3. Chat e imágenes pueden conservarse en historial si termina evento; envío sólo en evento vigente y por miembro actual. Un **DM permanece texto-only** incluso tras cambios en `messages`.
4. La caducidad de historias se decide con hora del servidor; a T+24h la **lectura del objeto** falla, aun antes de borrarlo físicamente.
5. App/Storage/API deben devolver las mismas decisiones de acceso (no confiar en ocultar botones).
6. Bandeja `notifications` ya es fuente de verdad. Un push es intento de entrega asociado a una fila existente, no segunda notificación de negocio.
7. Sin `service_role`/VAPID privados en `VITE_*`, navegador, service worker ni repositorio; datos demográficos y contactos no aparecen en payloads.
8. Convención de fecha propia: `timestamp without time zone` horario `America/Argentina/Buenos_Aires`; Auth/Storage y push del proveedor conservan sus convenciones originales.

## B. Estado real del código inspeccionado (fotografía, no especificación nueva)

- `src/features/events/chat.ts`: `ChatMessage` con texto obligatorio y RPC `get_event_chat_messages` / `send_event_chat_message`. `src/pages/EventChatPage.tsx`: composer texto, idempotencia por UUID y reconciliación/Realtime en mensajes. **Extender sin romper cursores, scroll, retries ni permisos.**
- Migración `20261010214526_event_chat.sql`: `messages.body text NOT NULL CHECK (1..2000 y no espacios)`, función de envío con bloqueo de evento y participación y chat sólo lectura, `conversations.kind` diseñado originalmente para eventos; R5 sumó DM. No permitir que cambiar el CHECK convierta DM en image-only.
- `src/features/events/gallery.ts` y migraciones de galería: bucket privado **`event_media`** con JPEG/PNG/WebP hasta **5 MiB**, `files` y asociación `event_images`; URLs firmadas de **60 segundos** para galería, subida inmutable y limpieza de huérfanos. Reutilizar concepto de validación, no confundir entidades/propiedad de adjuntos con galería.
- Migración `20261010042701_create_events_and_event_media.sql`: Storage SELECT actual permite al uploader y a archivos registrados; **R7 no puede agregar otra policy permisiva sin revisar OR/ownership/TTL**, pues rompería el requisito de 24h. Necesita auditoría específica de `storage.objects` e interacciones con avatar/galería.
- `src/features/notifications/api.ts`, `NotificationsProvider.tsx`, migración `20261011163653_notifications_inbox.sql`, productor `direct_message` (R5) y `event_full` (R6): avisos internos, destinatario y Realtime existentes; no reconstruirlos ni duplicar avisos.
- `vite.config.ts` usa `VitePWA({registerType:'autoUpdate', workbox:{runtimeCaching:[]}})`; ya hay SW generado para precache. Web Push requerirá elegir integración SW compatible (probablemente `injectManifest`) y demostrar que **no rompe** offline/update/install ni cachea respuestas privadas.
- `src/pages/EventDetailPage.tsx` ofrece metadata inicio/fin/lugar y acciones; se agregarían Calendar/Share/Stories sin reestructurar navegación de R2/R3/R4.
- Documentación `docs/database.md` prevé **`message_attachments`, `stories`, `push_subscriptions`**, pero el acta R6 B0 confirma que **no existían aún** en catálogo R6. Debe revalidarse catálogo en B0; no inferir ejecución SQL de diagramas.

**Advertencia de estado:** consultar de nuevo HEAD, migraciones, PRs, índices, objetos Storage, policies, función del día y catálogo remoto de sólo lectura en B0. No confundir el árbol actual del repo con implementación R7.

## C. Arquitectura objetivo y límites de confianza

```text
PWA React/Vite                                      Supabase
├─ EventChatPage ─┐                                  ├─ Auth/JWT
│  chat media     ├─ RPCs (cliente publishable) ─────├─ Postgres/RLS
├─ EventDetailPage├─ Storage upload / GET auth ─────├─ event_media (PRIVADO)
│  ├─ Stories ────┤                                  │   ├─ galería (actual)
│  ├─ .ics ───────┤ (sólo datos ya autorizados)       │   ├─ chat/ (R7)
│  └─ Share API ──┤                                  │   └─ stories/ (R7)
├─ Push settings ─┼─ alta/baja suscripción ──────────├─ push_subscriptions (RLS)
└─ Service Worker ◄── Web Push ◄── Edge Function ◄───└─ notifications → jobs privados
                                       ▲
                              cron / scheduler autorizado
```

**Decisión fuerte:** Storage es un sistema externo a la transacción de Postgres. La carga y el commit del mensaje/historia no son atómicos como conjunto; la política será **upload inmutable → RPC transaccional de asociación → compensación/GC idempotente**. Nunca simular atomicidad cross-service.

### C1. Esquema de datos propuesto y invariantes (B1/B2/B4/B9)

| Entidad | Campos/constraints principales (candidatos) | Acceso e integridad |
|---|---|---|
| `public.messages` | `body text NULL` con máximo 2000; CHECK texto válido o adjunto; mantener `id` UUID suministrado como idempotency key | CHECK simple no puede comprobar adjunto de otra tabla antes de INSERT: usar RPC/finalización controlada y trigger diferido o restricción de operación; DM siempre texto obligatorio. |
| `public.message_attachments` | `id uuid PK`; `message_id uuid NOT NULL UNIQUE REFERENCES messages`; `file_id uuid NOT NULL UNIQUE? REFERENCES files`; `created_at timestamp`; CHECK/trigger para `conversations.kind='event'` | máximo 1 por mensaje; archivo exclusivo de adjunto; no INSERT/UPDATE client indiscriminado; leer según membresía actual del chat. |
| `public.stories` | `id uuid PK`; `event_id`, `author_id`, `file_id NOT NULL UNIQUE`, `created_at`, `expires_at`; índices `(event_id,expires_at DESC,created_at DESC,id DESC)` | autor derivado del JWT; expires_at generado por servidor; sólo evento abierto para publicación; lectura miembro vigente y `expires_at > clock servidor`. |
| `public.files` | reuso de `bucket_name`, `storage_path`, `mime_type`, `size_bytes`, `uploaded_by`; path único | no conceder lectura pública ni enlazar el mismo objeto como historia+galería+adjunto; restricción de ownership y asociación exclusiva comprobada en RPC/trigger. |
| `public.push_subscriptions` | `id`, `user_id`, `endpoint UNIQUE`, `p256dh`, `auth`, `created_at`, `updated_at`, `disabled_at` y campo estado; índices por user / endpoint | secretos endpoint/keys visibles al propietario o sólo a RPC controlada; **no permitir que usuario cambie propietario**; soporte múltiples browsers. |
| `planit_private.push_jobs` **(propuesta)** | `(notification_id,subscription_id) UNIQUE`, estado/attempts/next_attempt_at; FK con RESTRICT/retención | cola interna sin Data API ni lecturas cliente; reclamo con `FOR UPDATE SKIP LOCKED`, reintento y desacople del INSERT del aviso. Requiere D09. |

**Lógica de mensaje imagen-only:** `messages.body` puede ser NULL sólo si hay adjunto válido; no hacer `INSERT` de mensaje vacío visible aunque una subida parcial falle. En B1 se debe elegir y probar una **función RPC atómica que inserte message + attachment en una transacción** con trigger/restricción final, y prohibir escrituras directas. Para mensajes texto-only conservar `send_event_chat_message` y su firma si es posible; si el CHECK se amplía, la RPC vigente sigue validando texto.

**Firmas candidatas (NO asumir existencia):**

```text
send_event_chat_media_message(p_event_id uuid, p_message_id uuid, p_body text, p_storage_path text) -> uuid
get_event_chat_messages(p_event_id uuid, p_before_at timestamp, p_before_id uuid) -> ... + attachment_id?,storage_path? (preservar paginado)
publish_event_story(p_event_id uuid, p_story_id uuid, p_storage_path text) -> uuid
list_event_stories(p_event_id uuid, p_before_at timestamp?, p_before_id uuid?) -> lista segura
register_push_subscription(endpoint, p256dh, auth,...) -> identidad propia, nunca user_id del cliente
unregister_push_subscription(subscription_id) -> owner-only
```

No editar la firma de RPC histórica sin mirar overloads, consumidores, `GRANT EXECUTE` por firma, vistas y tests de regresión. Las migraciones se hacen incrementalmente; para tipos retorno de PostgreSQL puede requerirse nueva firma versionada en lugar de `CREATE OR REPLACE` que altere `RETURNS TABLE`.

### C2. Storage privado, subida, autorización por objeto y separación de dominios

- Mantener bucket `event_media` **privado**, `allowed_mime_types=image/jpeg,image/png,image/webp`, límite compatible; paths **inmutables** `{auth.uid()}/r7/chat/{message_uuid}/{random_uuid}.ext` y `{auth.uid()}/r7/stories/{story_uuid}/{random_uuid}.ext` (validar formato exacto en B0).
- Subida sólo si sesión y path propietario; MIME real, firma del archivo/decodificación, bytes, límite y `contentType`; `upsert:false`; no confiar en extensión ni nombre original ni MIME declarado por cliente.
- Verificar autor y miembro event en la **RPC de asociación** al instante del commit con `events FOR UPDATE` y participación bloqueada si procede; revalidar también al descargar.
- **Reemplazar cuidadosamente** la policy permisiva de SELECT para aislar namespace R7: en rutas `r7/stories` requerir historia asociada, no vencida y audiencia autorizada, incluso para uploader; en `r7/chat` requerir mensaje de evento enlazado y pertenencia de chat, incluso para uploader; conservar reglas vigentes para galería/avatar. Un policy SELECT adicional permisivo es inseguro por composición OR.
- `download()` / endpoint de objeto privado **autenticado** por GET con JWT actual, RLS en cada acceso para historias y adjuntos; no usar URL pública ni signed URL con TTL residual para historias. Guardar Blob sólo en memoria; `URL.revokeObjectURL` al salir, al vencer TTL, cambio de usuario y desmontar. Prohibir cachear assets privados en SW/Cache Storage.
- Para un archivo previamente emitido como `blob:` no es posible impedir que un navegador/usuario que **ya descargó los bytes** conserve una copia. El CA de expiración se verifica contra nuevas descargas/URLs servidor y eliminación/ocultación en la UI, no borrado remoto de copias ya guardadas.
- Reintento mantiene UUID y path cuando el resultado es incierto; comprobar asociación y payload antes de retransmitir; error inequívoco. Huérfanos de subida se limpian sin tocar archivos registrados, con ventana de gracia y reporte.

### C3. Mensajería (B2/B3)

1. Seleccionar una imagen o texto+imagen desde el chat **de evento** vigente; elegir/preview/reemplazar/remover sin persistir mensaje.
2. Validar localmente, subir objeto único a Storage y ejecutar RPC idempotente con UUID estable.
3. RPC valida JWT, propiedad path/objeto, tipo, tamaño, `event_id`, tipo `conversations.kind='event'`, membresía confirmada/organizador y evento aún abierto, con locks compatibles R1–R5. Crear archivo+mensaje+attachment en la misma transacción de BD.
4. Refetch autorizado reproduce texto e imagen con cursores `(created_at,id)`, nombre social no sensible y descarga on demand.
5. Regresiones obligatorias: texto-only idéntico, eventos read-only, DM texto-only, no auto-envíos, scroll intacto, reconnect Realtime sin mensajes duplicados, idempotencia sobre POST/timeout/replay.

**Amenaza crítica:** cambiar NULLability de `messages.body` puede afectar R5 `get_direct_messages`, `send_direct_message` y el trigger de notificación DM. Agregar condición server-side para **rechazar** DM sin texto incluso si alguien llama Data API/RPC fuera de la UI.

### C4. Historias: publicación, consulta y caducidad (B4/B5/B6)

- `publish_event_story`: 1 imagen exclusiva, autor JWT, evento no terminado/cancelado/archivado, creador organizer o confirmed, `created_at` y `expires_at` calculados con reloj **servidor** en AR. No aceptar horas ni autor desde cliente. Reintento por `story_id` idempotente si payload idéntico, conflicto seguro si difiere.
- Lectura: solo organizer/confirmed, solo `event_id` solicitado, `expires_at > (clock_timestamp() AT TIME ZONE 'America/Argentina/Buenos_Aires')`; **nunca** vincular a permiso de URL oculta ni a relación social.
- En frontend listado/preview/visor accesible; a T+24h actualizar estado en UI además de servidor, sin depender del reloj del cliente como autoridad.
- Limpieza: cron + Edge Function/autorización server-to-server; lotes acotados, paginación, lock de trabajo o claim, retries idempotentes, borrar primero objeto exclusivo y luego filas asociadas con recuperación ante fallos. No borrar un `file_id` referenciado por chat, avatar o `event_images`; auditar FK `RESTRICT`. Si Storage falla, conservar referencia vencida inaccesible y reintentar, **no** declarar purgada. El scheduler no determina vigencia; sólo recupera cuota.
- Pruebas cronométricas T+23:59:59, T+24:00:00, tiempos iguales, cambio reloj dispositivo, reuso path, remoción de asistente, evento oculto, rollback, simultaneidad de publicación/GC y URL directo.

### C5. Calendario: `.ics` + «Agregar a Google Calendar» por enlace (B7)

- Acción en `EventDetailPage`: usar únicamente datos que el usuario ya puede consultar. `SUMMARY`, `DTSTART`, `DTEND`, `LOCATION` si disponible, `UID`, `DTSTAMP`, descripción pública segura si corresponde; `text/calendar;charset=utf-8`.
- Convertir timestamps locales AR a UTC o producir `TZID` + definición `VTIMEZONE` estándar. **No** usar `new Date('YYYY-MM-DDTHH:mm:ss')` interpretado en timezone del equipo. Validar apertura en clientes destino, límites fin>inicio, caracteres `, ; \`/saltos de línea, escape contra inyección ICS y plegado de línea por octetos RFC 5545.
- Además del ICS, producir enlace oficial a `https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE&...` con parámetros `dates`, `stz`, `etz`, `text`, `details` y `location` codificados; no usar OAuth ni `events.insert` para un enlace precargado. El usuario confirma el guardado en Google; cambios posteriores del evento PlanIt no sincronizan. Recurso oficial: https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events .
- Descarga de ICS o apertura del enlace sólo informa **archivo generado/ofrecido** o **Google Calendar abierto**, no afirma que calendario externo quedó actualizado. Respetar rechazo/cancelación cuando una API solicite permisos; fallback descarga sin permisos.

### C6. Compartir evento con Web Share (B8)

- Web Share API `navigator.share({title,text,url})` con un gesto del usuario; `AbortError` (cancelación) es neutral; errores otros informativos. Desktop sin Web Share: **Copiar enlace** con fallback seguro (y no reportar envío).
- Público: URL canónica `${location.origin}/events/:id` (base URL real del despliegue; localhost no debe filtrarse al compartir). Oculto: jamás construir un token o grant desde IDs; sólo el enlace rotativo autorizado del **organizador** según R4. Si no puede recuperarlo/emitirlo sin regenerarlo, mostrar acción explícita separada o compartir sólo resumen no sensible según D07.
- Al revocar o rotar enlace, el anterior debe fallar según R4. No compartir lista de asistentes, conversación, estadísticas, detalles restringidos, claves Supabase ni rutas internas de recuperación de cuenta.

### C7. Push complementaria y resiliente (B9/B10)

- Primero crear y validar **Service Worker con listener `push` y `notificationclick`**, sin perder precache/auto-update ni cachear Supabase. Revalidar opción `injectManifest` vs estrategia existente y registrar prueba PWA antes de migrar.
- Opt-in desde preferencias y **gesto explícito**: verificar `isSecureContext`, `serviceWorker`, `PushManager`, `Notification.permission`, navegador instalado cuando aplica; pedir permiso sólo luego de click; claves VAPID públicas en frontend, privadas en Edge.
- `push_subscriptions` vinculada al usuario autenticado, múltiples endpoints (un navegador = una subscription), keys cifradas/protegidas y endpoint tratado como credencial sensible. Alta idempotente, baja del dispositivo y limpieza endpoints 404/410; no un usuario reasignar suscripciones ajenas.
- `notifications` creada por R2/R5/R6 produce trabajo Push aparte (cola privada de D09) con `notification_id,subscription_id`; trabajador lee DB con privilegios de servidor **sólo lo necesario**, no hace parte del commit del aviso. Su fallo no revierte ni elimina la bandeja.
- Dedupe a nivel jobs por pareja, `SKIP LOCKED`/lease para concurrencia, tiempo de entrega/TTL, retries acotados con backoff y descarte de suscripciones inválidas. **El protocolo Web Push no garantiza exactamente una notificación en el dispositivo**: la cola intenta no duplicar y el SW usa `tag`/id para colapsar cuando sea posible.
- **Decisión D08 confirmada: vista previa concreta**. Para DM incluir nombre visible del remitente y fragmento de texto autorizado en el Push (longitud acotada, texto plano saneado, sin HTML ni URL arbitraria); para otros tipos, datos útiles sólo si aún autorizado. En configuración explicar exposición potencial en pantalla bloqueada y permitir **ocultar vistas previas** sin desactivar Push; fallback genérico ante borrado, revocación o dato inaccesible. Jobs guardan sólo IDs/reintentos, los logs nunca incluyen texto, claves ni endpoints. Navegación exclusivamente por ruta interna validada; click revalida permisos. No enviar Push por mensaje grupal.
- Casos: múltiples dispositivos, usuario cerrado/cambiado, scope de SW, permiso denegado, Safari/iOS instalado, offline → reintento, 404/410, throttling, claves VAPID, entrega de `direct_message`, ausencia por grupo y ausencia de segunda fila `notifications`.

## D. Riesgos, controles y decisiones obligatorias

| Riesgo | Síntoma de fallo | Control/gate |
|---|---|---|
| Policy `storage.objects` permisiva | historia expiró pero uploader / link puede descargar | sustituir policy con separación de namespace, GET autenticado negativo |
| Signed URLs largas o cache | archivo accesible luego de T+24h | sin signed URL de historias, no SW cache, URL Blob revocada |
| Mensaje sin body y sin attachment | filas vacías o DM con imagen | contrato transaccional diferido/RPC + negativos directos |
| Reutilización de archivo entre dominios | GC borra galería/chat | unicidad, ownership y FK restrict, GC con comprobación de referencias |
| Carrera al terminar/revocar evento | se publica tras cierre | locks evento/participación, comparables a send_chat R2 |
| Reintento de upload / RPC | imagen duplicada/huérfana | UUID/path estables, digest/validación de objeto, cleanup |
| PWA SW reemplazado incorrectamente | deja de instalarse o servir precache | fixture offline, update controlado, SW listener prueba |
| Push duplicado o pierde aviso | nueva fila, múltiples alertas, retorno falso | cola privada idempotente, tag y resultado delivery separado |
| Push revela información en pantalla | vista previa DM visible a terceros con acceso físico | consentimiento explícito, explicación + ajuste ocultar preview, truncado/limpieza y navegación revalida permisos; logs sin contenido |
| `.ics` cambia horas al viajar | calendario 3 horas distinto | conversión AR→UTC test TZ browser distinto |
| Share oculta token sin permiso | se difunde evento oculto | backend R4, sin compartir grant personal |
| Ruptura R6/older | changelog/DDL toca funciones existentes | snapshots y regresiones R1–R6 por bloque |

## E. Secuencia de ejecución por bloques — gates separados

| Bloque | Alcance | Entregable verificable | Gate para siguiente |
|---|---|---|---|
| B0 | auditoría integral, elecciones D01–D15, modelo de amenazas y contratos | acta y traceability 29 CA, SQL diseño, matriz permisos | aprobación humana B1 |
| B1 | migraciones multimedia, storage namespace, RLS | esquema/ACL/RLS, pruebas storage negativas y regresión galería/DM | revisión y autorización migración por separado |
| B2 | RPC de chat con adjunto | insertar/leer/idempotencia/locks + tests DDL/HTTP | autorización de código B3 |
| B3 | UI chat | composer/preview/progreso/retry/render imágenes, snapshots | revisión de accesibilidad |
| B4 | publicar/listar historias servidor, TTL desde el inicio | migración/RPC, exclusividad de archivo, RLS y prueba permiso | autorización B5 |
| B5 | UI historias (componente/route aislado) | **visor tipo Instagram** (secuencia, progreso, autoplay, gestos, pausa, accesibilidad) y publicación | revisión UX |
| B6 | caducidad efectiva, cleanup/cron | pruebas frontera + Edge scheduled job/GC y fallas; **puede ir en paralelo con B5 una vez integrado B4** | autorización scheduler remoto separada |
| B7 | .ics y enlace Google Calendar sin OAuth | helper puro de TZ/escaping + componente `EventCalendarAction` independiente | revisión UX |
| B8 | Web Share + hidden links | acción, fallback, privacidad, cancelación | revisión R4 |
| B9 | subscriptions + PWA SW | opt-in/out, sin secretos, SW offline y compatibilidad | decisión keys/VAPID y autorización de deploy |
| B10 | encolado/worker envío Push | Edge con retries, cleanup invalid, sin duplicar notifications | revisión cron/secrets/deploy independiente |
| B11 | aceptación integral | 29 CA y evidencia; cierre GO/NO-GO humano | **no** autovalidarse |

**Dependencias reales:** B3→B2→B1; B5→B4→B1; **B6→B4** (no depende de B5); B7/B8/B9 independientes de B1 tras B0; B10→B9; B11 integra B3/B5/B6/B7/B8/B10. **Se desarrolla en paralelo** en worktrees/ramas y PRs por bloque con integración serializada. Véase `RELEASE_7_PARALLEL_WORK.md` para DAG, asignación de 2–4 personas, owners exclusivos, contratos y conflictos de migraciones.

## F. Inventario de cambios de código previsto (no creado)

| Archivo/módulo | Cambio esperado |
|---|---|
| `supabase/migrations/<timestamp>_r7_media_contract.sql` | message_attachments, cambios al CHECK message, restricciones/acl y Storage RLS |
| `supabase/migrations/<timestamp>_r7_chat_attachments.sql` | RPC get/send image, idempotencia, triggers y grants |
| `supabase/migrations/<timestamp>_r7_stories.sql` | stories, asociación exclusiva, RLS, RPC publish/list y expiry |
| `supabase/migrations/<timestamp>_r7_push_subscriptions.sql` | tabla owner-only y operaciones subscription |
| `supabase/migrations/<timestamp>_r7_push_jobs.sql` | cola privada, triggers/funciones worker, índices/retención si D09 |
| `src/features/events/chat.ts` + `src/pages/EventChatPage.tsx` + CSS | media composer, lectura Blob, errores/reintentos y cursor |
| `src/features/events/stories.ts` + `src/pages/EventStoriesPage.tsx` o componente aprobado | publicar/leer/visor, estados y limpieza de Blob |
| `src/pages/EventDetailPage.tsx` | entrada a historias, Calendar y Share |
| `src/features/events/calendar.ts` + `EventCalendarAction.tsx` | `.ics` puro, enlace plantilla de Google Calendar, saneamiento, sin editar directamente EventDetailPage en B7 |
| `src/features/events/share.ts` + `EventShareAction.tsx` | Web Share/fallback y privacidad R4, sin editar directamente EventDetailPage en B8 |
| `src/features/notifications/push.ts`, `src/pages/ProfilePage.tsx` o settings | preferencias Push, permisos/subscription status |
| `src/sw.ts` y `vite.config.ts` | custom SW + configuración manteniendo PWA previa |
| `supabase/functions/r7-media-cleanup/` | job cleanup protegido, idempotente |
| `supabase/functions/r7-push/` | entrega VAPID, retries, errores sin alterar inbox |
| `scripts/check-r7-*.mjs` y `docs/qa/r7-block-*/` | suites unit/contract/SQL/HTTP/UI/Storage/SW y evidencia |

Los paths son sugeridos. B0 debe elegir nombres reales tras auditoría; no duplicar utilidades existentes ni incluir configuración/secretos reales.

## G. Diseño visual y accesibilidad

- Normativa visual **B · Amanecer**: `PRODUCT.md`, `DESIGN.md`, `docs/design/DESIGN_SYSTEM.md`, `UI_WORKFLOW.md`, `docs/design/AGENTS.md`, `src/styles/tokens.css`, `--pi-*`. Los mockups R7 son guía funcional, NO override de identidad.
- Chat: selector con nombre accesible, archivo seleccionado legible, preview no invasiva, quitar/reemplazar, error `role=alert`, foco después de envío, controles 44×44, esc de visor, scroll/reconexión; no insertar múltiples tarjetas.
- Historias: estado vacío, skeleton, visor **tipo Instagram** a pantalla completa con barras de progreso, avance automático y toque siguiente/anterior, salida/retorno al origen, pausa en interacción o pestaña inactiva, teclado/esc, soporte reduced-motion, caducidad, `alt` generativo prudente (no inventar descripción semántica), controles respetan reduced motion.
- Calendario y share: no confundir «descargado» con «agregado» ni «selector abierto» con «compartido». Botones accesibles, estado dispositivo no soportado.
- Push: explicar permiso antes de solicitarlo, diferenciar `default`, `denied`, `granted`, sin soporte, suscripción activa y error, permitir desactivar.
- QA visual: viewports **320, 375, 390, 768 y 1280 px**, zoom 200 %, teclado/foco, safe areas; evidencias reales y limitaciones de emulación.

## H. QA, trazabilidad y definición de terminado

- Fuente: `../qa/RELEASE_7_TEST_PLAN.md`; matriz 29 criterios: `../qa/RELEASE_7_ACCEPTANCE.md`; reporte final: `../qa/RELEASE_7_TEST_REPORT_TEMPLATE.md`.
- Suites mínimas: `npm run build`, `npm run lint`, replay SQL local completo, invariantes PK/FK/CHECK/grants/RLS, HTTP/JWT usuario real y anon, Storage subida/descarga GET, concurrencia/event state, UI browser, PWA offline/updates, Push dispositivos y fallos, regresión R1–R6.
- Etiquetar por separado **PASS/FAIL/NOT RUN/BLOCKED**, y para cada migración **(1) creada, (2) probada SQL local, (3) aplicada remotamente con permiso, (4) verificada remotamente**. Nunca sustituir JWT/Storage reales por fixtures de UI.
- RF/CA sólo se considera cerrado con evidencia reproducible, permisos negativos y prueba positiva en entorno representativo. R7 GO requiere aceptación humana. El estado de ejecución no modifica contratos oficiales.

## I. Reglas obligatorias para Codex y política de entrega

1. Antes de cada bloque leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/design/AGENTS.md` según área, `PRODUCT.md`, `DESIGN.md`, `docs/architecture.md`, `docs/database.md`, fuentes oficiales R7, este plan, decisiones, estado y QA; revisar estado Git y últimas integraciones en `main`.
2. Rama/worktree exclusivo por bloque `codex/r7-block-N`, desde `origin/main` o rama de integración que contiene **solamente sus prerequisitos**; **múltiples bloques sin dependencia pueden trabajarse simultáneamente**. **Un PR draft por bloque**, diff acotado y ownership de `RELEASE_7_PARALLEL_WORK.md`. NO modificar `main`, NO merge, NO deploy, NO `supabase db push`, NO DDL remoto, NO cambios de secretos ni Google Doc sin autorización explícita.
3. Supabase destino exclusivo modificable mediante permiso: `planit-v2`, proyecto histórico de sólo lectura. SQL local no implica autorización remota. No editar migraciones ya aplicadas.
4. No instalar backend/ORM/framework paralelo. Stack React 19 + TypeScript + Vite 8 + React Router + Supabase Auth/Postgres/RLS/Storage/Realtime; Edge sólo para secretos/scheduler necesarios.
5. Respetar `search_path=''`, nombres SQL calificados, grants mínimos, `SECURITY INVOKER` por defecto y `DEFINER` únicamente con justificación/ACL/`auth.uid()`; RLS en toda tabla pública; verificar `POST`/Storage/SQL directos con usuarios ajenos.
6. Tras implementar producir reporte de bloque: HEAD/base, archivos, nuevas migraciones 4 marcas, DB impacto, threat model, pruebas exactas PASS/FAIL/NOT RUN, screenshots UI, riesgos pendientes, PR draft, **gate humano**. Detenerse en su propio bloque; **otros desarrolladores pueden ejecutar simultáneamente bloques sin dependencia** y se desbloquean sucesores tras integrar su requisito, no tras terminar la release completa.

## J. Decisiones por aprobar y recomendaciones

Las decisiones **de producto confirmadas** D01, D02, D03, D05, D06, D07, D08, D09, D15 y P01, junto con pendientes técnicos, están en `RELEASE_7_DECISIONS_PROPOSED.md`; B0 sólo ratifica interfaces y cuestiones restantes. Recomendación arquitectónica: **separar la persistencia de archivos de su asociación de DB, revisar en profundidad RLS de Storage actual y no usar signed URLs de historias**, ya que el CA de caducidad es más estricto que una limpieza periódica. Confirmar infraestructura Edge/cron antes de B6/B10. Todos los valores numéricos no definidos en los RF (TTL de cleanup, límites de envío, reintentos) son propuestas, no fuentes normativas.

## K. Ejecución paralela efectiva y ownership

**OBLIGATORIO:** consultar `RELEASE_7_PARALLEL_WORK.md`. Tras B0, B1/B7/B8/B9 pueden abrir PRs simultáneamente. Tras integrar B1, B2 y B4 se desarrollan en paralelo. Tras B4, B5 y B6 son independientes. B10 parte de B9 y puede coexistir con las otras líneas. **B11 es el único punto de composición de `EventDetailPage.tsx` y `src/App.tsx`**, cuyos cambios directos se prohíben a B5/B7/B8; cada frente exporta componente/DTO aislado. Los merges de migraciones y despliegues remotos requieren orden, replay y revisión humana; el paralelismo NO autoriza escritura concurrente a un mismo esquema remoto.

En B0 congelar DTO de evento seguro para Calendar/Share/Stories, firma de mensajes con imagen opcional, API Stories y contrato de preview Push. Ejecutar mínimo dos worktrees y reportar qué tareas están en progreso/bloqueadas, no una única fila de secuencia.

## Corte de ejecución B11 — 17/10/2026

Base `279af15d09988f43a4e79dd397611c645b0b2808`, productores B0–B10 integrados según [inventario Git/GitHub](../qa/r7-block-11/prerequisites.json). B11 conecta componentes aislados en detalle. `EventParticipation` comunica su resumen existente; `EventManagement`/`EventLinkPanel` admiten un render prop opcional para compartir el token sólo dentro de su diálogo. Son ajustes de integración sin cambio de API/SQL de dominio. `PushSettings` ya se montó por ampliación humana B10, por lo que no se repite; visor inline Stories no necesita nueva ruta en App.

QA por capas y limitaciones en [reporte final](../qa/RELEASE_7_TEST_REPORT.md) y [seguimiento vigente](RELEASE_7_STATUS.md). 29 CA evaluados: 4 PASS técnicos locales,25 BLOCKED, aceptación humana pendiente; NO-GO recomendado. Esta actualización no redefine el plan normativo ni autoriza operaciones remotas/merge/siguiente bloque.
