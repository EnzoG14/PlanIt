# PlanIt — instrucciones para agentes de Supabase

Aplican también las reglas de `../AGENTS.md` y [modelo lógico](../docs/database.md).

## Destino y seguridad
- Proyecto objetivo **único**: `planit-v2` ref `iepeqmvzjguwlhnecsdq`. Proyecto histórico `fmqzokxvpqxfzvcnzvjm`: NUNCA escribir.
- No ejecutar DDL/SQL, no desplegar y no modificar `main` sin aprobación.
- RLS activado en cada tabla del esquema `public` al crearla. Otorgar sólo permisos necesarios, comprobar RLS tanto en SQL como en Storage.
- Proteger datos sensibles de `profiles`: no dar lectura general a datos demográficos; crear proyección segura para perfiles de terceros más adelante.
- Nunca permitir al usuario escribir privilegios, roles, `organizer_id` ajenos o `sender_id` ajenos. Derivar identidades de `auth.uid()` en operaciones controladas.
- Si se usa `SECURITY DEFINER`, fijar `search_path`, auditar autorizaciones y revocar EXECUTE innecesario. Evitar `service_role` en frontend.

## Migraciones
- `supabase/migrations/20261010011204_create_profiles_and_categories.sql` está **vacía y consta como aplicada** en Supabase remoto. No editarla. La primera migración real es posterior.
- Mantener migraciones incrementales y versionadas; no mezclar pasos manuales sin historial con migraciones registradas.
- Una migración no debe depender de cambios que todavía no se hayan aplicado. FK de `profiles.avatar_file_id` se agrega cuando exista `files`.
- No generar borradores persistidos: `events` no incluye `publication_status`, `published_at` ni `timezone`.
- Fechas propias: `timestamp without time zone`, convención hora de Argentina, tiempo de servidor para expiraciones y validación.
- Preferir `NOT NULL`, `CHECK`, `UNIQUE`, FK, índices parciales; usar transacciones/RPC con lock para cupos y aprobaciones.
- No borrar historial, inscripciones, conversaciones ni imágenes al cancelar o archivar eventos.
- Para creación/registro/inscripción, probar concurrencia y operaciones fallidas; no asumir que UPDATE/INSERT frontend garantiza atomicidad.

## Validación antes del despliegue
- Revisar el SQL, comprobar orden de FK y que triggers/funciones estén correctamente delimitados.
- Probar con al menos dos cuentas autenticadas; validar visibilidad y edición cruzada negada.
- Verificar `supabase migration list`, `supabase db push --dry-run` y asesores de seguridad antes de ejecutar.
- Indicar expresamente qué migraciones se han aplicado de verdad y cuáles sólo están en Git.
