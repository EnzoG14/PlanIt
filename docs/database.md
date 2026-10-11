# PlanIt — Modelo de datos y migraciones

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

- 20261011193316_r2_realtime_chat_notifications.sql: **preparada, no aplicada remotamente**. Publicación idempotente de messages/notifications; get_notification_changes(uuid[]) invoker con RLS propia y destinos autorizados, máximo 100 IDs, EXECUTE sólo authenticated; índice parcial recipient_id WHERE read_at IS NULL. Sin cambios de políticas, grants de tabla ni RPCs existentes. [Verificación](design/verification/realtime/README.md).

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
