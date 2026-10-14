# Aplicación remota autorizada — B7 notificaciones

14/10/2026, Argentina. El responsable respondió «sí» a la pregunta de aplicar `20261014212935_follow_request_notifications.sql` en **planit-v2**, ref `iepeqmvzjguwlhnecsdq`. Código autorizado en commit `c0d4cdee1a71d88f00244e752d441a0f11448a23`; PR #57. No se modificó el proyecto legado.

## Ejecución

1. Git limpio en codex/r5-block-7. Preflight remoto28 migraciones, sin trigger/notifier y notifications ya publicado con RLS: [before.json](before.json).
2. `npx supabase db push --project-ref iepeqmvzjguwlhnecsdq --skip-vault --dry-run`: única pendiente20261014212935; sin seeds/roles. [Salida](dry-run-before.txt).
3. Mismo comando sin dry-run, con --yes conforme a la aprobación: aplica sólo20261014212935. [Salida](apply.txt).
4. Dry-run posterior upToDate=true, migrations=[]: [salida](dry-run-after.txt).
5. [Verificación READ ONLY](verification.json): ledger29 con versión exacta; fuentes de ambas funciones iguales al archivo local; ambas invoker/search_path vacío; notifier sin EXECUTE de anon/authenticated; get_notification_target sólo authenticated; trigger activo AFTER INSERT/UPDATE status/version; SELECT/UPDATE read_at de notificaciones propios, sin INSERT/DELETE/update body; publicación de notifications preservada y sin publicar follows/profiles; UUID ausente no devuelve destino. PASS.

**Migración creada1/probada local1/aplicada remota1/verificada remota1.** Verificación de catálogo y permisos, no E2E. No se crearon cuentas ni solicitudes/avisos remotos, no hubo backfill, seeds, roles, secretos Vault, deploy, merge ni edición Google Docs. La entrega JWT/Realtime real sigue NOT RUN; UI Ver solicitudes requiere frontend de PR #57 actualizado.

## Asesores de seguridad

[Respuesta completa](security-advisors.json). Sin ERROR. El nuevo notifier y get_notification_target son invoker y no aparecen entre avisos. Hallazgos sobre objetos/configuración que esta migración no cambia:45 RPC DEFINER autenticadas previstas por el diseño, tabla event_access_links con RLS sin políticas (acceso sólo mediante RPC) y protección de contraseñas filtradas desactivada. No se alteraron privilegios de esas RPC ni configuración Auth como efecto lateral.

Referencias de revisión: [RPC DEFINER ejecutables](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Este registro no cierra esas observaciones previas ni acredita aceptación humana.
