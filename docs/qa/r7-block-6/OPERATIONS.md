# B6 — Despliegue y recuperación de limpieza

Implementación preparada; **no desplegada ni activada**. Destino exclusivo: planit-v2. El pedido de implementar B6 no autoriza aplicación SQL, deploy, secretos ni cron remoto. Cada paso requiere aprobación expresa. No ejecutar contra el proyecto histórico.

## Contrato

La expiración usa B4: `expires_at > clock_timestamp() AT TIME ZONE 'America/Argentina/Buenos_Aires'`. GC no define la vigencia, no modifica fechas y no utiliza el reloj del dispositivo. La lectura permanece autorizada hasta completar 24 horas incluso tras fin normal; cancelación/archivo mantiene el contrato aprobado en B4. La autorización se revalida también después de descargar bytes en `r7-story-image`.

RPCs nuevas, todas exclusivas de `service_role`:

| RPC | Entrada | Resultado |
|---|---|---|
| `claim_r7_story_gc` | ninguna | `null` o `{upload_id,story_id,storage_path,lease_token}` |
| `get_r7_story_gc_target` | `p_upload_id,p_lease_token` | `null` o target sin token |
| `complete_r7_story_gc` | mismo par | boolean; sólo elimina referencias si no existe metadata Storage |
| `fail_r7_story_gc` | mismo par y `p_error_code` | boolean; sólo admite `storage_error/backend_error` |

`POST r7-media-cleanup` requiere un bearer dedicado `STORY_GC_WORKER_TOKEN`, distinto de JWT usuario/API key/service key. No toma targets, límites, horas ni identidades del request. El entrypoint sólo usa URL y service key del entorno servidor. No hay CORS de navegador, payloads personales ni logs de paths/errores de proveedor. Responde métricas agregadas `claimed/deleted/retry/stale/errors`, sin persistir una nueva serie de métricas personales.

Orden: claim con `SKIP LOCKED` y commit → revalidar lease/autoridad → Storage API DELETE del path exacto → transacción final stories → claim → files → estado `deleted` en reserva → quitar job. Upload permanece `published` durante I/O; los invariantes diferidos de B1/B4 se conservan. GC no necesita adquirir locks de eventos ni participantes; usa upload antes de job, y no bloquea un evento para hacer red.

La reserva existente queda como tombstone privado de idempotencia: impide reutilizar UUID/path tras purga. No se agrega una retención nueva de contenido o métricas; la eventual minimización de reservas preexistentes requiere diseño aparte que conserve la prohibición de reuso. No se elimina ningún evento, perfil, mensaje, galería, notificación o fila de participación.

## Procedimiento tras autorización

1. Confirmar base integrada, historial real y destino planit-v2. Revisar asesores, backup y dry-run; aplicar **sólo** la migración B6 tras permiso específico. Comparar catálogo/ACL/RLS y cuatro marcas de migración en STATUS.
2. Autorizar por separado y desplegar `r7-media-cleanup` con verificación JWT del gateway desactivada; el handler comprueba su propio secreto antes de cualquier I/O. `r7-story-image` y su validación HTTP son prerequisito de aceptación, aunque su despliegue pertenece al contrato B4/B5.
3. Provisionar fuera del repositorio un secreto aleatorio criptográfico de al menos 32 bytes, codificado base64url, como `STORY_GC_WORKER_TOKEN` en Edge y `planit_story_gc_token` en Vault. Mantener `SUPABASE_SERVICE_ROLE_KEY` sólo en Edge. Guardar la URL del proyecto aprobado en Vault como `planit_project_url`. No imprimir valores ni pegarlos en PR, CLI histórico, capturas o logs.
4. Verificar 401/403 con token ausente, public key y JWT usuario; deben producir cero cambios. Probar un lote autorizado con fixtures dedicados, incluyendo objeto ya ausente, 5xx/timeout, ACK perdido y doble worker. Registrar prueba de desaparición física mediante Storage API, además de metadata SQL.
5. Sólo con **permiso específico para activar cron**, habilitar/verificar pg_cron y pg_net y revisar [schedule.sql](../../../supabase/functions/r7-media-cleanup/schedule.sql). Ejecutar esa plantilla manual; no es migración. Lee Vault durante cada llamada, sin valores privados en el comando del job. Comprobar nombre único `planit-r7-story-gc`, estado activo y respuestas de pg_net sin copiar headers secretos. La migración B6 no instala extensiones ni programa jobs.

La plantilla sigue el patrón documentado por Supabase: [cron + pg_net + Vault](https://supabase.com/docs/guides/functions/schedule-functions). Se borra por [Storage API](https://supabase.com/docs/guides/storage/management/delete-objects), nunca mediante SQL sobre `storage.objects` en producción.

## Frecuencia, límites y reintentos

Propuesta técnica para revisión: cron cada 15 minutos, máximo 100 claims individuales por invocación y presupuesto de inicio de trabajo 40 segundos. Cada RPC/DELETE tiene timeout 5s; una operación ya iniciada puede superar ese presupuesto. Lease 120s, superior al I/O de un objeto; no se reservan 100 objetos antes de procesarlos. El timeout pg_net no equivale a cancelar el worker ni a confirmar su resultado.

Techo nominal por cron: 96 invocaciones/día y hasta 9.600 objetos/día, aproximadamente 38.496 requests RPC/Storage contando el claim vacío final; no es capacidad medida ni cuota por usuario/evento. El límite de tiempo y las latencias pueden reducirlo. Observar backlog y costo antes de aumentar frecuencia/concurrencia. La purga no descarga imágenes; sólo DELETE y metadata. La expiración sigue siendo estricta si hay backlog o cron apagado.

Un fallo deja las referencias vencidas inaccesibles y reintenta con backoff exponencial de 60s a 1h. No descarta permanentemente un trabajo tras cinco fallos: se revisa operativamente a partir de cinco intentos. Un crash recupera automáticamente el lease a los 120s. Sólo el token vigente puede confirmar/fallar; respuestas tardías no pisan el lease nuevo. Un DELETE tardío es seguro porque UUID/path no puede volver a publicarse ni sobrescribirse.

## Observación y recuperación manual

Consultas sólo desde una sesión administrativa autorizada; no exponer la cola vía Data API:

```sql
select count(*) as expired_backlog, min(expires_at) as oldest_expired
from public.stories
where expires_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires');

select count(*) as jobs, max(attempts) as max_attempts,
       count(*) filter (where attempts >= 5) as repeated_failures
from planit_private.story_gc_jobs;
```

Si un job no avanza: verificar primero worker, Vault, HTTP y Storage, y esperar vencimiento de lease. Reinvocar el worker tras corregir infraestructura; no hace falta borrar filas ni romper locks. Un objeto ausente permite completar en la siguiente ejecución. Si falla SQL tras DELETE, la transacción revierte las referencias y el siguiente intento confirma ausencia y finaliza. Una identidad/eTag diferente o referencias incompatibles se ponen de hecho en cuarentena: el selector no las toca. Revisar esa inconsistencia con autorización y evidencia; nunca forzar DELETE de un path ni quitar un FK para destrabarla.

Para pausar, un administrador autorizado puede desactivar/desprogramar **sólo** `planit-r7-story-gc` mediante Cron. Las historias siguen expirando. Rotar el secreto coordinando Edge/Vault y comprobar rechazos sin exponer valores. No imprimir `cron.job.command` de otros jobs ni contenido de `vault.decrypted_secrets`.

## Huérfanos: proceso separado

B6 **no borra uploads sin historia vencida**. Un prefijo, una antigüedad o un `file_id` suministrado no son autoridad suficiente. Los fixtures comprueban que una reserva sin publicar conserva su objeto. Auditoría separada, sólo lectura, de candidatos mayores de 24h:

```sql
select count(*) as unregistered_candidates
from planit_private.media_uploads u
where u.state='reserved'
  and u.created_at < (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')-interval '24 hours'
  and not exists (select 1 from public.files f where f.id=u.id)
  and not exists (select 1 from planit_private.media_claims c where c.upload_id=u.id);
```

Una futura limpieza de esos candidatos necesita claim propio, impedir publicación/subida simultánea, revalidar referencias e identidad y aprobación de su alcance; no se mezcla con el worker de historias vencidas. No se elimina ningún huérfano remoto en esta entrega.
