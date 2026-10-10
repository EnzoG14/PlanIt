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
- `20261010011204_create_profiles_and_categories.sql` está vacía y **ya registrada como aplicada**. No editar.
- `20261010013449_create_profiles_and_categories.sql`: primera migración real, con `profiles`, `categories`, RLS y trigger de creación de perfil. **Aplicada en planit-v2**, confirmado mediante MCP e historial de CLI el 09/10/2026 (Argentina).
- `20261010023448_restrict_rls_auto_enable_execute.sql`: **pendiente, sólo en Git**. Revoca EXECUTE de PUBLIC, anon y authenticated sobre la función interna `public.rls_auto_enable()`. Conserva función, propietario y event trigger `ensure_rls`; no cambia las tablas ni políticas. El dry-run identifica únicamente esta migración pendiente. Los avisos de asesores seguirán presentes hasta su aplicación autorizada.
- Futuras: eventos/intereses → participaciones → relaciones → mensajería → multimedia/Storage → notificaciones → accesos → funciones transaccionales → auditoría RLS/semillas.
- La FK `profiles.avatar_file_id -> files.id` se agrega después de crear `files`.
- No usar claves `service_role` en PWA, ni `SECURITY DEFINER` sin autorización/validación explícita.
- Habilitar RLS desde cada `CREATE TABLE`; los permisos públicos no deben exponer datos sensibles.

## Pruebas previas a despliegue
- Registro Auth con `display_name` produce exactamente un perfil.
- Dos usuarios no pueden leer campos privados de otros ni editar perfiles ajenos.
- Catálogo visible a autenticados pero no editable por ellos.
- Fallos de alta y de validaciones no crean registros parciales.
- Migraciones reproducibles y sin errores de advisors.

Consultar ../AGENTS.md y ../supabase/AGENTS.md antes de cambiar esquema.
