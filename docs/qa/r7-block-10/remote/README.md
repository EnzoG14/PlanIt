# B10 — Aplicación remota autorizada

16/10/2026, Argentina. Proyecto único `planit-v2` (`iepeqmvzjguwlhnecsdq`), PostgreSQL 17.11. Autorización expresa posterior del responsable en esta conversación: «Hace la migracion remota,por favor».

Se aplicó **únicamente `20261016154257_r7_push_jobs.sql`** desde `codex/r7-block-10`, revisión previa `99a6e57`, PR draft [#81](https://github.com/EnzoG14/PlanIt/pull/81). B9 ya constaba aplicada; no fue necesario aplicar otras dependencias. Archivo SQL sin modificaciones respecto de la implementación local probada.

```powershell
npx supabase migration list --project-ref iepeqmvzjguwlhnecsdq
npx supabase db push --project-ref iepeqmvzjguwlhnecsdq --skip-vault --dry-run
npx supabase db push --project-ref iepeqmvzjguwlhnecsdq --skip-vault --yes
npx supabase db push --project-ref iepeqmvzjguwlhnecsdq --skip-vault --dry-run
```

Preflight: 40 versiones remotas, sólo B10 pendiente, proyecto activo/saludable, B9 presente y `push_jobs` ausente. Dry-run sin seeds ni roles. Ejecución CLI exitosa conserva versión y nombre de la migración. Postflight: **41 versiones**, `20261016154257 / r7_push_jobs`; dry-run final `upToDate: true`, sin pendientes.

## Verificación

[Evidencia estructurada](verification.json) y [smoke reproducible](smoke.sql).

- Seis cuerpos de función remotos coinciden con el SQL local, normalizando fin de línea y espacios exteriores.
- `planit_private.push_jobs`: RLS activa; sin SELECT/INSERT/UPDATE/DELETE directos para anon, authenticated ni service_role. PK compuesta, FK RESTRICT, checks e índices verificados.
- Cinco RPC públicas: sólo service_role tiene EXECUTE; anon/authenticated denegados. Trigger privado sin EXECUTE cliente; seis funciones DEFINER con search_path vacío.
- `notifications_enqueue_push`: AFTER INSERT activo y asociado al helper previsto. Hashes de los tres productores históricos idénticos antes/después.
- Negativos reales con SQL SET ROLE: anon/authenticated no pueden consultar la cola ni ejecutar ninguna de las cinco RPC. Service_role no accede directamente a la tabla; sí ejecuta la validación de límite y el lookup inexistente, que devuelve null. Transacción con ROLLBACK, sin fixtures ni cambios persistidos.
- Los 17 avisos existentes permanecen; cero suscripciones en el preflight y cero jobs tras aplicar. No se ejecutó backfill ni se enviaron notificaciones.

El primer intento de smoke usó READ ONLY y PostgreSQL rechazó el SELECT FOR UPDATE del lookup con `25006`. Se corrigió el contenedor de prueba a BEGIN/ROLLBACK y pasó; no se modificó SQL de producto ni se repitió la migración. SET ROLE no sustituye pruebas HTTP/JWT de Supabase.

Advisors antes/después: permanecen 58 hallazgos de funciones DEFINER autenticadas y el aviso previo de protección de contraseñas filtradas. No aparecieron nuevas categorías WARN/ERROR. RLS sin policies pasa de cinco a seis INFO por `push_jobs`: esperado para una cola privada sin DML cliente, accesible sólo mediante RPC service-only. No se crean policies permisivas para silenciarlo. Referencias: [RLS sin policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funciones DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Cuatro marcas y límites

**Creada: Sí · Probada local: PASS · Aplicada remota con aprobación: Sí · Verificada remota: PASS.**

La autorización cubrió la migración y su comprobación. Sin cambios de secrets/Vault (`--skip-vault`), deploy Edge, cron, Google Doc, main, merge o proyecto histórico. Recepción Web Push, proveedor real y HTTP/JWT permanecen NOT RUN. Build/lint no se repitieron: este cierre sólo añade evidencia y documentación sobre la migración ya probada.
