# PlanIt — Modelo de datos y migraciones

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
