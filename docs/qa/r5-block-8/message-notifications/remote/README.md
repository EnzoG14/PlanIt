# Aplicación remota autorizada — Avisos DM

14/10/2026, Argentina. El responsable respondió **«si»** a la autorización específica para aplicar `20261014225216` en **planit-v2** (`iepeqmvzjguwlhnecsdq`). Fuente aplicada: commit `565ca523d96159126c3c2bc7c803f364f39e950b`, misma PR #58, rama codex/r5-block-8.

**Creada1 / probada local1 / aplicada remota1 / verificada remota1.** Backend habilitado para avisos de nuevos mensajes; sin backfill, fixtures o mensajes remotos de prueba. No deploy de frontend ni merge. La prueba de catálogo no sustituye JWT/Realtime real o aceptación humana: B8 sigue Implementado; QA pendiente.

Preflight: proyecto enlazado correcto,29 versiones remotas, trigger/función DM inexistentes y única pendiente `20261014225216_direct_message_notifications.sql`. Asesores de seguridad consultados antes de aplicar. Aplicación CLI con **skip-vault**: sólo esa migración, sin seeds/roles/secrets. Postflight:30 versiones locales/remotas coincidentes, dry-run sin pendientes. [Registro](application.json).

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked --skip-vault --yes
npx supabase migration list --linked
npx supabase db push --linked --skip-vault --dry-run
node docs/qa/r5-block-8/message-notifications/remote/verify.mjs
```

[Verificación PASS](verification.json): cuerpos de las dos funciones remotas iguales al SQL versionado; ambas INVOKER/search_path vacío, trigger privado sin EXECUTE authenticated/anon, get_notification_target sólo authenticated. Trigger AFTER INSERT habilitado, RLS/policies de conversations/messages/notifications presentes, publicación messages/notifications intacta.

Asesores sin variación:45 avisos previos de [funciones DEFINER autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),1 aviso previo de [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) y1 informativo de [RLS sin policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) para event_access_links. No se alteraron configuraciones o permisos ajenos al cambio autorizado.

No se consultaron filas de usuarios, ni se enviaron mensajes o crearon cuentas reales. HTTP JWT/Realtime de extremo a extremo y dispositivos siguen NOT RUN. Esta acta supera los pendientes de aplicación remota de los cortes históricos anteriores, no sus límites de QA.
