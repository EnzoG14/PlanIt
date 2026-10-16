# Corrección de carga R7 — Storage preflight

16/10/2026. Rama `codex/r7-chat-upload-fix`, desde `origin/main` `9d917a4` después de integrar #79/B3, #76/B7, #77/B8 y #80/B9. Se conserva el worktree `r7-block-3-worktree` y su `.env.local` ignorado. No se inicia otro bloque de R7.

## Problema confirmado

El responsable reprodujo un POST de una imagen PNG de 1,8 MB a Storage en planit-v2: **403 AccessDenied / new row violates row-level security policy**. No se persiste su ruta ni identificadores en esta evidencia.

La política B1 exige `metadata.size` y `metadata.cacheControl='no-store'` en el INSERT. El [uploader oficial de Storage v1.80.2](https://github.com/supabase/storage/blob/v1.80.2/src/storage/uploader.ts) (versión registrada por CLI) ejecuta primero `testPermission` con `mimetype/contentLength/contentEncoding`; los metadatos finales aún no existen. Por eso la política niega el archivo válido antes de subir bytes. Las pruebas previas B1 insertaban metadatos finales y B3 interceptaba Storage: no cubrían esta frontera real.

## Corrección acotada

Nueva migración `20261016182333_r7_storage_upload_preflight.sql`; no se modifica B1 aplicada. Reemplaza sólo el cuerpo de `can_upload_r7_media(text,text,jsonb)` y conserva firma/ACL/DEFINER/search_path. Es una reparación del contrato compartido B1 detectada durante B3, necesaria para el flujo integrado; no incorpora historias, Push ni un bloque nuevo.

Se admite la comprobación previa con MIME y longitud exacta de la reserva propia, sin compresión ni otras claves inesperadas. Continúan las verificaciones de JWT, owner, reserva, evento/membresía y estado reserved bajo los locks existentes. Si hay metadatos finales, deben satisfacer tamaño exacto y no-store.

Storage v1.80.2 persiste finalmente como superusuario; el probe no acredita los bytes finales. Por eso **no** se relajan `get_event_media_upload_state`, target de validación, attestation de Edge, `validate_event_file` ni el commit transaccional: antes de publicar siguen siendo obligatorios tamaño/MIME/cache finales e identidad/decodificación de los bytes. Un objeto sólo preparado permanece inaccesible y no publicable. GET/sign/list siguen negados antes del commit.

## Verificación

- `node scripts/check-r7-storage-preflight.mjs`: **9 grupos PASS**, PostgreSQL real local 18.4 con Auth/Storage como scaffolds SQL. Replay desde cero; prueba INSERT/ROLLBACK con forma preflight v1.80.2; negativos de longitud, MIME, compresión, cache, owner y reserva; rechazo de lectura/registro de metadatos incompletos; regresiones B1 galería/avatar/DM/chat, exclusividad, ACL, cierre y concurrencia. [Resultados](sql/sql-results.json).
- `node scripts/check-r7-media-edge.mjs`: **2 grupos PASS**, WASM real y handler con dependencias HTTP stub. [Resultados copiados de esta ejecución](edge-results.json). No equivale a Edge desplegada.
- Lint/diff: **PASS** (advertencias heredadas). No se cambian páginas, estilos ni cliente, por lo que no se repiten snapshots ni se atribuye una nueva ejecución UI/build.
- Una primera expectativa del test asumía `uploaded=false` para una fila incompleta; el productor realmente lanza `invalid_image`. Se corrigió la expectativa conservando ese rechazo.

## Estado remoto y gate

La consulta READ ONLY confirmó B1/B2 instaladas y, además, `20261016142017`/B9 y `20261016154257`/B10 ya aplicadas por otras tareas. Para el dry-run se prepara un directorio `.local` ignorado con el historial ya aplicado; la migración B10 se lee de `origin/codex/r7-block-10`, no se incorpora ni ejecuta como cambio de esta rama. Dry-run: **sólo 20261016182333 pendiente**, sin seeds/roles/secrets, usando `--skip-vault`.

| Migración | Creada | SQL local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| 20261016182333 | Sí | PASS | Sí | Sí: cuerpo/versión/ACL/RLS |

Aplicada a `planit-v2` conforme al pedido previo del responsable de realizar las migraciones remotas de este trabajo. CLI confirmó únicamente 20261016182333, sin seeds, roles, vault, Edge ni cron. Dry-run posterior: cero pendientes en el historial completo preparado, incluidas las versiones B9/B10 ya instaladas. [Antes](before.json), [después](after.json), `node docs/qa/r7-block-3/storage-fix/verify.mjs`: cuerpo idéntico al SQL versionado, EXECUTE sólo authenticated (no anon), search_path vacío y RLS de Storage preservados. La verificación por catálogo no equivale a un nuevo upload HTTP con JWT real.

La lista remota de funciones contiene sólo `social-avatar`: **r7-media-validate no está desplegada**. El flujo completo seguirá bloqueado en validación después de reparar el 403 hasta desplegar esa función B1 con permiso separado. No se sortea la validación ni se permiten imágenes sin attestation.

Comando de despliegue preparado (NO ejecutado):

```powershell
npx supabase functions deploy r7-media-validate --project-ref iepeqmvzjguwlhnecsdq --use-api
```

Se conserva la verificación JWT del gateway (default true) y `Auth.getUser` dentro del handler. Usa variables de servicio del runtime, no requiere copiarlas al frontend. Prueba posterior pendiente: PNG válido → upload → validación → commit → GET autorizado y GET de tercero negado. No se declara resuelta la carga completa por sólo probar SQL.
