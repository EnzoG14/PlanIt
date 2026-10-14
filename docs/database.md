# PlanIt — Modelo de datos y migraciones

**Aplicación remota autorizada R5/B7 — 14/10/2026:**20261014212935_follow_request_notifications.sql aplicada/verificada en planit-v2 tras aprobación expresa posterior. Ledger29, cuerpos/trigger/ACL/RLS/publicación coincidentes y dry-run al día. [Acta](qa/r5-block-7/follow-notifications/remote/README.md). Las referencias siguientes a aplicación pendiente son históricas; JWT/Realtime real sigue pendiente.

**Ampliación R5/B7 — aviso de solicitud:** migración20261014212935_follow_request_notifications.sql creada/probada local,sin aplicación remota autorizada. Trigger privado invoker sobre nuevas generaciones pending inserta notifications para seguido en misma transacción;sin identidad/actor ni nuevos grants/RLS/publicaciones. ID aviso=request_version;pending repetida no genera nuevas filas. get_notification_target conserva permisos y agrega destino propio `/me/follow-requests`. [Contrato/evidencia](qa/r5-block-7/follow-notifications/README.md).

## Release 5 — Bloque 1: esquema social aplicado y verificado remoto

`20261014133225_social_security_model.sql`, `20261014133547_social_projections_and_avatars.sql` y `20261014133847_social_legacy_projections.sql`: **creadas/probadas local y aplicadas/verificadas en planit-v2 el 14/10/2026 con autorización expresa posterior**. [Contrato y privilegios](implementation/RELEASE_5_BLOCK_1_CONTRACT.md), [evidencia](qa/r5-block-1/README.md). Las 25 migraciones históricas permanecen intactas; 28 versiones remotas sincronizadas, 16 tablas RLS y 79 funciones iguales a replay; [acta](qa/r5-block-1/REMOTE_MIGRATION.md).

user_follows PK dirigida/status/generación/cronología y user_blocks PK dirigida, no-self, FK RESTRICT/RLS/SELECT propio sin mutaciones genéricas. Conversations event/direct excluyentes, pareja ordenada UNIQUE, event_id UNIQUE conservado; messages/historial/notifications FK/realtime sin duplicar. Lectura DM sólo miembro aun bloqueado; nuevos DM/follow/envío por RPC auth.uid y lock profiles UUID ascendente antes de relaciones. Privacidad bloquea self y autoacepta pending válidos en misma transacción; PATCH visibility revocado. Perfiles íntegros siguen sólo self; proyección mínima/ampliada y eventos sólo públicos/grants no sociales. Proyecciones administrativas bajo bloqueo sólo identidad neutra, permisos R3/R4 intactos.

Bucket avatars privado e inmutable separado de event_media. files acepta ambas finalidades pero trigger de galería exige event_media y avatar propio exige avatars; sin UPDATE avatar_file_id cliente. Registro de avatar exige metadata cacheControl no-store/no-cache/max-age=0; firmas sociales sólo gateway con TTL fijo60 y RPC de servicio protegida. Guard preflight niega referencias antiguas incompatibles, sin reparación automática. Entrega remota aplicada/verificada con autorización posterior; SQL local PostgreSQL18.4 con scaffold no equivale a HTTP JWT/Storage/CDN/Realtime real. Tipos propios timestamp sin zona Argentina, sin events.timezone ni borradores.

## Release 4 — Bloque 8: administración de grants

`20261014120006_event_access_management.sql` **creada, probada localmente y aplicada/verificada en planit-v2 el 13/10/2026 con autorización expresa posterior**. Agrega `get_event_access_grants(uuid,text,uuid,integer) returns jsonb`, `revoke_event_access(uuid,uuid) returns void` y `restore_event_access(uuid,uuid) returns void`; DEFINER, `search_path=''`, EXECUTE sólo authenticated y dueño derivado de `auth.uid()`. [Acta remota](design/verification/r4-block-8/remote-migration-summary.json): 25 versiones sincronizadas, dry-run sin pendientes, tres cuerpos idénticos a Git, ACL/RLS y guardas sin identidad PASS. HTTP/JWT funcional sigue pendiente.

Listado mínimo de ocultos por estado y cursor UUID, 30 filas por defecto/máximo 50; sin perfiles privados, hashes ni tokens. Avatar `null` hasta lectura social autorizada. Revocación bloquea evento→participación→grant, remueve confirmed mediante trigger R3 y después revoca, con rollback total. Restituir sólo activa un grant existente, sin participación/chat/cupo/reingreso. Retries no cambian historial ni timestamps. Ocultos cerrados: sólo lectura por decisión confirmada; públicos no gestionan grants y conservan A04/A05. [Pruebas y límites B8](design/verification/r4-block-8/README.md).

## R4 Bloque 7 — Canje de enlace (creada, probada localmente y aplicada a planit-v2 con autorización posterior)

`20261014120005_redeem_event_link.sql` agrega `public.redeem_event_link(p_token text) returns uuid`: DEFINER, `search_path=''`, EXECUTE sólo `authenticated`, identidad `auth.uid()`. Compara SHA-256 (`extensions.digest`) del token recibido con `event_access_links.token_hash`; toma el lock del evento (el mismo de rotación, visibilidad, cierre y registro) y relee el link bajo lock. Requiere `visibility='unlisted'`, evento no finalizado/cancelado/archivado y link activo; con `grant revoked` falla siempre (nunca se reactiva); con `active` es idempotente; si no existe, inserta el grant con `source_link_id`. No escribe `event_participations` ni consume cupo. Cualquier fallo devuelve el mismo error `invite_unavailable` (P0001). El organizador no crea grant. Aplicada a planit-v2 el 13/10/2026 con autorización expresa posterior.

## R4 Bloque 6 — Visibilidad/rotación (aplicada)

`20261014120004_event_visibility_links.sql` agrega los parámetros finales `create_event(..., p_visibility text default 'public')` y `update_event(..., p_visibility text default null)` mediante reemplazo de firma sin CASCADE ni dependientes SQL versionados. Hay una única firma por RPC, con defaults que mantienen llamadas R1–R3; la edición antigua conserva la visibilidad actual. INSERT de visibility sólo para auth.uid propietario, con constraints existentes; no se concede UPDATE directo. Edición y transición usan el trigger B5 bajo lock, de modo que confirmed+revoked produce rollback íntegro.

RPC nuevas de dueño: `set_event_visibility(uuid,text)`, `create_or_rotate_event_link(uuid)` y `get_event_link_status(uuid)` (sólo booleano, sin hash/ID/token). Las tres son DEFINER con search_path vacío y EXECUTE sólo authenticated. Rotación usa `extensions.gen_random_bytes(32)` + `extensions.digest(token,'sha256')`, lock de evento, revocación e INSERT atómicos y UNIQUE parcial B5. No expires_at; fin/cancelación/archivo bloquean generación. D12 conserva grants e invalida links al hacer público. No se agrega canje de tokens ni administración de grants en este bloque.

Migración creada con CLI como `20261013223733`, renombrada detrás de B5 para respetar el orden versionado. Replay y concurrencia en PostgreSQL efímero PASS. **Aplicada/verificada en planit-v2 el 13/10/2026 por autorización expresa posterior del usuario**: dependencias ausentes, pgcrypto en extensions, 23 versiones sincronizadas, dry-run al día, 5 cuerpos de función iguales a Git, RLS/ACL/defaults/índice y guardas sin identidad PASS. Asesores sin errores; tres nuevas RPC DEFINER de dueño generan avisos intencionales, edición reemplaza su aviso por la nueva firma. [Acta remota](qa/r4-block-6/remote-migration-summary.json). Sin escrituras de fixtures de negocio ni HTTP/JWT real. [Pruebas y límites](qa/r4-block-6/README.md).

## R4 Bloque 5 — Accesos ocultos (aplicada)

`20261014120003_hidden_event_access.sql` creada/probada por replay local y **aplicada/verificada en planit-v2 el 13/10/2026 con autorización explícita posterior**. 22 versiones sincronizadas, dry-run sin pendientes, 11 cuerpos de funciones idénticos a Git, RLS/ACL/índices/constraints/triggers inspeccionados y asesores sin hallazgos nuevos. Smoke SQL read-only con rol sin identidad e identidad sintética PASS; no equivale a HTTP/JWT real. [Acta remota](qa/r4-block-5/remote-migration-summary.json). Modelo del dominio H de Planificación:

- `event_access_links`: id UUID PK, event_id FK events RESTRICT, created_by FK profiles RESTRICT, token_hash text UNIQUE (SHA-256 hexadecimal), created_at timestamp NOT NULL Argentina, revoked_at timestamp nullable. Sin expires_at. UNIQUE parcial event_id WHERE revoked_at IS NULL. RLS activa y sin SELECT/mutaciones cliente: tampoco el dueño obtiene hashes.
- `event_access_grants`: id UUID PK, event_id/user_id FKs RESTRICT y UNIQUE, source_link_id nullable con FK compuesta al mismo evento, status active/revoked, granted_at y updated_at obligatorios, revoked_at/restored_at opcionales, todos timestamp sin zona Argentina. Checks de estado/cronología, trigger updated_at, índices de FKs. RLS SELECT propio/dueño; sin mutaciones cliente.
- `planit_private.can_view_event(uuid)` centraliza dueño/grant active para ocultos y conserva lectura pública/histórica autorizada. Reemplaza la política permisiva por participación histórica; summary/organizer/rejoin/chat/registro/retiro se endurecen sin cambiar firmas. RLS media/Storage y listas invoker heredan la barrera; propiedad legítima y asociaciones compartidas se conservan.
- Trigger privado de visibilidad impone A04/A05/D12 atómicamente: preserva confirmed con grants faltantes, bloquea confirmed+revoked sin restaurarlo y al hacer público invalida links conservando grants/participación. No habilita RPC/UX de visibilidad, generación/canje ni revocación/restauración (bloques 6–8).

Pruebas locales A/B/C/D/anon, locks/rollback, inventario completo, límites de signed URLs y pendientes HTTP/JWT/Storage real en [auditoría B5](qa/r4-block-5/README.md). TTL solicitado por APIs privadas 60 s; no es un límite impuesto al API de Storage ni invalida URLs anteriores.

## R4 Bloque 4 — Ranking público (aplicado)

`20261014120002_get_suggested_events.sql` agrega RPC invoker `get_suggested_events(double precision,double precision,integer)`, search_path vacío, EXECUTE authenticated. Sin tablas/RLS nuevas; intereses auth.uid(), públicos sin cancelar/archivar y ends_at vigente Argentina. 100 afinidad + hasta30 dentro50km + hasta20 dentro7d; ranking antes de LIMIT (default6, máximo20), empate starts_at/id y fallback general cronológico. Creada/probada por replay local y **aplicada/verificada en planit-v2 el 13/10/2026 con autorización posterior**: versión registrada, dry-run al día, invoker/search_path/EXECUTE y hash del cuerpo idéntico a Git. Guard sin identidad probado con ROLLBACK; JWT real pendiente. [Evidencia](design/verification/r4-block-4/README.md).

## R4 Bloque 3 — Preferencias privadas (aplicada)

`20261014120001_user_category_interests.sql` crea la relación PK user/category, FKs RESTRICT y created_at Argentina sin zona. RLS/grants permiten sólo SELECT propio; la RPC `set_my_category_interests(uuid[])` deriva auth.uid y reemplaza atómicamente bajo locks de perfil/categorías. DEFINER restringido, search_path vacío; conserva inactivas guardadas hasta quitarlas, rechaza nuevas/realtas inactivas. Creada/probada con replay local y **aplicada/verificada en planit-v2 el 13/10/2026 con autorización posterior del usuario**; historial al día, RLS/grants y cuerpo RPC idéntico a Git. HTTP/JWT real pendiente. [Pruebas, contrato y límites](design/verification/r4-block-3/README.md).

## R3 Bloque 5 — Cancelación, archivo y origen de duplicación

`20261012044919_close_and_duplicate_events.sql`: **aplicada y verificada en planit-v2 el 12/10/2026 con autorización explícita posterior del usuario**. `cancel_event(uuid)` y `archive_event(uuid)` devuelven el ID y autorizan dueño desde auth.uid(), bajo READ COMMITTED y lock del evento compartido con inscripción/chat. Cancelar sólo antes/durante; archivo cancela primero si no finalizó, dentro de la misma transacción; reintentos conservan marcas. SECURITY DEFINER para evitar UPDATE genérico, search_path vacío y EXECUTE authenticated sin PUBLIC/anon. `get_event_duplicate_source(uuid)` invoker autoriza propietario y sólo proyecta contenido/categoría/ubicación/cupo. Sin fotos/fechas/relaciones ni borradores; creación normal guarda nuevo UUID/dueño y conversación vacía. No nuevas tablas, políticas ampliadas, timezone ni DELETE. Replay, rollback y doce carreras locales PASS; HTTP/JWT y aceptación humana pendientes. [Ocho CA y evidencia](design/verification/r3-block-5/README.md).

## R3 Bloque 4 — Administración de asistentes

`20261012031717_manage_event_attendees.sql`: **aplicada y verificada en planit-v2 el 12/10/2026 con autorización explícita**. Agrega `get_event_attendees(uuid,text,text,integer)` y `remove_participant(uuid,uuid)` controladas, SECURITY DEFINER justificado, search_path vacío y EXECUTE authenticated. La lista exige autoría desde auth.uid() y sólo proyecta participation_id/user_id/status/display_name/username; confirmed/removed, búsqueda literal por nombre y página 30 + lookahead, sin ampliación de RLS de profiles/participaciones/historial. Remoción exige evento vigente y participación confirmed vinculada, locks evento→participación bajo READ COMMITTED y transición removed con historial del trigger existente (actor auth.uid(), razón organizer_removal); reintento removed vigente es no-op. Cupo derivado de confirmed, sin DELETE ni nuevas tablas/tipos de fecha. RLS de chat existente deniega posteriores lecturas/envíos del removido. Replay y carreras en PostgreSQL local PASS; remoto con historial sincronizado, hashes de ambas RPC coincidentes con Git, permisos/RLS verificados y rechazo de identidad ausente; pruebas HTTP/JWT reales pendientes. [Contrato y evidencia](design/verification/r3-block-4/README.md).

## Proyectos
- Destino nuevo: `planit-v2`, ref `iepeqmvzjguwlhnecsdq`.
- Proyecto antiguo `fmqzokxvpqxfzvcnzvjm`: NUNCA modificar ni migrar datos.
- 19 tablas propias en `public` y `auth.users` administrada por Supabase.

## Inventario de tablas
- Perfil: `profiles`.
- Eventos: `categories`, `events`.
- Participación: `event_participations`, `participation_history`, `event_rejoin_requests`.
- Social: `user_follows`, `user_blocks`.
- Chat: `conversations`, `messages`.
- Multimedia: `files`, `event_images`, `message_attachments`, `stories`.
- Avisos: `notifications`, `push_subscriptions`.
- Acceso oculto: `event_access_links`, `event_access_grants`.
- Preferencias: `user_category_interests`.

## Reglas centrales
- `profiles.id` corresponde a `auth.users.id`; `username` único, minúsculas, 3–24 caracteres. `display_name` 2–60.
- Perfil completo sólo accesible al propietario; una proyección autorizada debe servir los datos visibles a terceros. Nunca entregar `birth_date` y `sex` individuales a usuarios ajenos.
- `events`: sólo eventos completos, no almacenar borradores ni agregar `publication_status`, `published_at`, `timezone`.
- Las fechas-hora propias son `timestamp without time zone`, convención Argentina; las fechas de nacimiento usan `date`.
- No hay borrado físico de eventos. Archivar antes de finalizar también cancela el evento.
- Una participación por usuario y evento; transacción con bloqueo para impedir sobrecupo; el organizador no ocupa plaza.
- El retiro voluntario permite reinscribir; el removido pide aprobación. Tras rechazo debe esperar 7 días; sin cupo sigue pendiente.
- `user_follows`: un registro por pareja dirigida. Bloquear borra seguimientos en ambas direcciones e impide nuevos mensajes directos.
- Un chat por evento; un DM por pareja canónica. El evento vencido o cancelado mantiene historial de sólo lectura.
- Máximo 10 imágenes por evento y 1 adjunto por mensaje de evento; historias 1 imagen, visibles 24 h.
- Un enlace activo por evento oculto, no expira solo, revocación individual sólo la restaura el organizador.
- `user_category_interests` usa clave primaria compuesta.

## Migraciones

- `20261012013634_manage_event_gallery.sql`: **aplicada en planit-v2 el 11/10/2026 con autorización expresa posterior del usuario**. RPC de añadir/quitar/ordenar y consulta de cargas no registradas para organizador desde auth.uid(); locks evento/path, READ COMMITTED, permisos mínimos y search_path vacío. UNIQUE diferible de sort_order conserva máximo diez. Protección contra carrera registro/DELETE de Storage; media registrada retenida al quitar asociación, compatible con archivos compartidos. Catorce versiones sincronizadas, dry-run sin pendientes y ocho cuerpos de funciones idénticos a Git. RLS/grants/políticas comprobados; cuatro avisos definer autenticados nuevos son intencionales. HTTP/JWT real pendiente. [Pruebas/retención y pendientes](design/verification/r3-block-3/README.md).

- `20261012001058_edit_own_event.sql`: **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**. R3 Bloque 2: update_event actualiza contenido del mismo ID sólo por el organizador y antes del inicio original, sin cancelar/archivar. READ COMMITTED, lock de evento y conteo confirmed después del lock protegen cupo frente a inscripción simultánea. Definer con identidad auth.uid(), search_path vacío y EXECUTE sólo authenticated, sin UPDATE directo ni modificaciones de participantes/media/chat. Historial CLI con trece versiones sincronizadas y dry-run sin pendientes. Cuerpo remoto idéntico a Git, RLS/search_path/permisos comprobados; HTTP/JWT real pendiente. [Pruebas, decisión y pendientes](design/verification/r3-block-2/README.md).

- `20261011232326_my_organized_events_read.sql`: **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**. Agrega `get_my_organized_events(text, integer)` SECURITY INVOKER, search_path vacío, EXECUTE sólo authenticated, dueño desde auth.uid(). Cinco filtros antes de páginas de 30+1 y reloj Argentina. Conserva get_my_events para Participo/clientes anteriores y no modifica tablas/RLS. Historial sincronizado, dry-run sin pendientes y consultas SQL remotas de sólo lectura con dos identidades simuladas PASS; HTTP/JWT real pendiente. [Evidencia y límites R3](design/verification/r3-block-1/README.md).

- 20261011193316_r2_realtime_chat_notifications.sql: **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**. Publicación idempotente de messages/notifications; get_notification_changes(uuid[]) invoker con RLS propia y destinos autorizados, máximo 100 IDs, EXECUTE sólo authenticated; índice parcial recipient_id WHERE read_at IS NULL. Sin cambios de políticas, grants de tabla ni RPCs existentes. [Verificación](design/verification/realtime/README.md).

- `20261011163653_notifications_inbox.sql`: **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**. Bandeja R2 sin generadores: notifications con FK RESTRICT e índices, RLS por destinatario y UPDATE únicamente read_at con hora servidor/primera lectura inmutable. RPCs get_notifications/get_notification_target/mark_notification_read SECURITY INVOKER, search_path vacío y EXECUTE sólo authenticated. Destinos sujetos a RLS existente de evento/chat, sin conceder acceso por el aviso. [Pruebas y límites](design/verification/notifications/README.md).

- `20261010214526_event_chat.sql`: **aplicada en planit-v2** (iepeqmvzjguwlhnecsdq) el 10/10/2026 con autorización expresa del usuario, R2 bloque 2. conversations/messages con RLS organizador/confirmed, trigger + backfill único por evento; envío sólo RPC con identidad Auth, lock evento/participación, reloj Argentina, límite 2000 e idempotencia UUID. Sin mutaciones REST directas ni perfiles privados. Eventos cerrados conservan lectura autorizada; cancelled/removed no acceden. Sin cambios Realtime. [Pruebas y límites](design/verification/event-chat/README.md).

- `20261010154930_my_events_read.sql`: **aplicada por el usuario en planit-v2; verificada el 10/10/2026**. Las siete versiones locales/remotas están sincronizadas y el dry-run no tiene pendientes. RPC `get_my_events(p_section text, p_offset integer default 0)` de sólo lectura SECURITY INVOKER, `search_path` vacío y EXECUTE sólo authenticated. Identidad desde auth.uid(); sección organizing/participating, 31 filas por consulta (30 visibles + lookahead), orden starts_at descendente/ID ascendente. Proyección mínima de evento, categoría, estado propio y portada; sin perfiles ni asistentes. Reutiliza RLS histórica y multimedia; no modifica tablas, políticas ni mutaciones. Cuerpo desplegado idéntico al SQL versionado; prueba remota READ ONLY con dos identidades SQL pasó ambas listas, parámetros inválidos y rechazo de anon/sin identidad. Auth/REST real pendiente. [Verificación local y remota](design/verification/my-events-r1/README.md).

- `20261010150232_event_participations.sql`: **aplicada en planit-v2 el 10/10/2026 con autorización expresa del usuario**. Historial CLI sincronizado y dry-run posterior sin pendientes. Participaciones e historial con RLS propio, FK RESTRICT, RPC `register_for_event` / `leave_event` con identidad de sesión y lock de evento; resumen mínimo autorizado sin identidades. Registro exige READ COMMITTED (snapshot congelado se rechaza); reinscripción cancelled reutiliza fila y removed requiere futura aprobación R3. Prueba SQL remota con dos identidades authenticated y ROLLBACK pasó sin conservar datos de prueba. Tres avisos de SECURITY DEFINER autenticado son intencionales y documentados. [Contratos, pruebas y límites](design/verification/participations-r1/README.md).

- `20261010052653_public_event_discovery.sql`: **aplicada en planit-v2 el 10/10/2026 con autorización del usuario**. Agrega RPC SECURITY INVOKER de descubrimiento por viewport, vigencia según reloj Argentina y visibilidad pública. EXECUTE sólo authenticated; sin modificar lectura histórica del propietario. Historial sincronizado, dry-run posterior sin pendientes, consulta remota bajo dos identidades authenticated verificada con ROLLBACK. [Verificación](design/verification/map-detail-r1/README.md).
- `20261010011204_create_profiles_and_categories.sql` está vacía y **ya registrada como aplicada**. No editar.
- `20261010013449_create_profiles_and_categories.sql`: primera migración real, con `profiles`, `categories`, RLS y trigger de creación de perfil. **Aplicada en planit-v2**, confirmado mediante MCP e historial de CLI el 09/10/2026 (Argentina).
- `20261010023448_restrict_rls_auto_enable_execute.sql`: **aplicada en planit-v2 el 10/10/2026 (Argentina), con autorización del usuario**. Revoca EXECUTE de PUBLIC, anon y authenticated sobre `public.rls_auto_enable()`, conservando función, propietario y event trigger. Los dos avisos de ejecución pública de esta función ya no aparecen en advisors.
- `20261010042701_create_events_and_event_media.sql`: **aplicada en planit-v2 el 10/10/2026 (Argentina), con autorización del usuario**. Crea events, seed de cinco categorías, files/event_images, bucket privado event_media, RPC SECURITY INVOKER idempotente y RLS/grants mínimos. Historial CLI sincronizado y dry-run posterior sin migraciones pendientes. Prueba SQL remota con dos identidades existentes y ROLLBACK verificó creación/lectura, validaciones, idempotencia y permisos sin dejar eventos de prueba. Evidencia y limitaciones: [Crear evento R1](design/verification/create-event-r1/README.md).
- `20261010212819_home_and_event_organizer_read.sql`: **aplicada en planit-v2** (ref `iepeqmvzjguwlhnecsdq`) el 10/10/2026. Añade `get_home_events` (paginación estable, eventos públicos futuros y primera portada, SECURITY INVOKER) y `get_event_organizer` (proyección limitada a nombre visible/username con verificación de acceso al evento). La prueba local reejecuta todas las migraciones y verifica roles/RLS. La revisión remota confirmó ambas funciones y que `anon` no puede ejecutarlas.
- Futuras: intereses → participaciones → relaciones → mensajería → ampliación multimedia/Storage → notificaciones → accesos → funciones transaccionales → auditoría RLS/semillas. Eventos y media mínima ya están desplegados.
- La FK `profiles.avatar_file_id -> files.id` ya fue agregada por la migración de eventos/media mínima.
- No usar claves `service_role` en PWA, ni `SECURITY DEFINER` sin autorización/validación explícita.
- Habilitar RLS desde cada `CREATE TABLE`; los permisos públicos no deben exponer datos sensibles.

## Pruebas previas a despliegue
- Registro Auth con `display_name` produce exactamente un perfil.
- Dos usuarios no pueden leer campos privados de otros ni editar perfiles ajenos.
- Catálogo visible a autenticados pero no editable por ellos.
- Fallos de alta y de validaciones no crean registros parciales.
- Migraciones reproducibles y sin errores de advisors.

Consultar ../AGENTS.md y ../supabase/AGENTS.md antes de cambiar esquema.

## R3 Bloque 6 — Migración aplicada y verificada

Aplicada en planit-v2 el 12/10/2026 con autorización explícita posterior del usuario. Diecisiete versiones sincronizadas, dry-run sin pendientes; siete cuerpos de funciones/trigger coinciden con Git, permisos/RLS/índices/CHECK verificados y cinco RPC rechazan identidad ausente. [Registro remoto](design/verification/r3-block-6/remote-migration-summary.json). HTTP/JWT real y aceptación humana pendientes.

`20261012155501_event_rejoin_requests.sql` incorpora solicitudes con FK RESTRICT a participación, estados pending/approved/rejected, requested_at/resolved_at/reviewed_by y UNIQUE parcial de una pending. CHECK exige resolución/revisor coherentes y cronología válida; fechas propias sin zona, hora Argentina. RLS SELECT de solicitud propia y sin permisos de mutación directa; identidad del solicitante se deriva de la participación, sin duplicar datos privados.

RPCs `get_my_rejoin_status`, `get_event_rejoin_requests`, `request_rejoin`, `resolve_rejoin` y `get_event_rejoin_resolution` autorizan desde auth.uid; la bandeja y comprobación son sólo del dueño. READ COMMITTED y locks evento→participación→solicitud protegen contra dobles resoluciones y carreras por cupo. Aprobar exige vigencia y cupo confirmado; sin plaza conserva pending sin reservar/autoaprobar. El trigger existente registra `rejoin_approval` para removed→confirmed. Rechazo conserva participación, fecha/revisor y solicitud histórica; habilita otro pedido después de siete días desde resolución. Por decisión humana, se permite rechazar tras cierre, nunca pedir/aprobar. `get_event_attendees` conserva firma/privacidad y agrega pending_count. [Pruebas y límites](design/verification/r3-block-6/README.md).
