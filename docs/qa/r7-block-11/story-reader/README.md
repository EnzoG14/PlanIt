# Incidente: historia recién publicada no se puede visualizar

17/10/2026. El responsable reportó publicación exitosa seguida del mensaje de historia vencida/no disponible/sin acceso.

Diagnóstico confirmado: `downloadStoryImage` llama a `/functions/v1/r7-story-image`, pero esa función **no está desplegada** en planit-v2. El catálogo sólo contiene social-avatar, r7-media-validate, r7-chat-image y r7-push. Tanto OPTIONS como GET del lector devuelven404 `NOT_FOUND`. El frontend traduce cualquier respuesta no exitosa al mismo mensaje genérico; ese mensaje no prueba que la historia haya vencido.

La función existente de B4 ya verifica JWT mediante Auth.getUser, consulta un target service-only que impone permisos/TTL, comprueba bytes/digest y revalida autorización después de descargar. Tres grupos locales PASS y Deno check PASS; no se modificó SQL ni se relajaron permisos. [Diagnóstico](diagnosis.json), [tests](local-tests.json).

Corrección preparada: desplegar **únicamente** la función existente, conservando JWT del gateway y el handler:

```powershell
node_modules/.bin/supabase functions deploy r7-story-image --project-ref iepeqmvzjguwlhnecsdq --use-api
```

Sin `--no-verify-jwt`, sin deploy global, migraciones, secretos ni cron. Después: verificar ACTIVE/verify_jwt, OPTIONS204, GET sin sesión401 y pedir reintento de una historia vigente en la sesión real. No hay credenciales del usuario en este reporte; no se crea otra historia ni se accede a sus bytes por service_role para simular aceptación.

Deploy pendiente de autorización expresa según supabase/AGENTS.md. Este diagnóstico no acredita que no pueda aparecer otro fallo autenticado después del deploy.


## Despliegue autorizado

El responsable autorizó «desplega». Se ejecutó exactamente el comando anterior: r7-story-image quedó ACTIVE, versión1, verify_jwt=true. OPTIONS204 con CORS/no-store y GET sin sesión401 PASS; [evidencia](deployment.json). Sin SQL, secretos, cron ni otras funciones modificadas. La visualización autenticada de la historia del responsable queda pendiente de su reintento; no se afirma PASS funcional sólo por el deploy.
