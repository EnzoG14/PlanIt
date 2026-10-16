# R7 · B10 — Cola y envío Web Push

Implementación complementaria a la bandeja. Sólo se consumen los tres tipos con productores en la base B9:

| Tipo | Productor histórico, conservado | Enriquecimiento al enviar |
|---|---|---|
| `direct_message` | `notify_direct_message`, aviso con `id = message.id` | Nombre visible y fragmento del mensaje del destinatario; genérico ante bloqueo, mensaje ausente, membresía inválida o previews desactivadas |
| `follow_request` | `notify_follow_request`, `id = request_version` | Texto fijo y destino de solicitudes propias |
| `event_full` | `notify_event_full`, episodio real de último cupo | Título actual del evento sólo para organizador y evento no archivado |

Los tipos desconocidos y los mensajes de chat grupal quedan fuera del encolado y backfill. No se modifica ningún productor ni aviso interno. No hay inserción de jobs por registro del dispositivo: sólo por avisos nuevos o recuperación de avisos posteriores a la suscripción dentro de 15 minutos.

## Contrato del worker

La tabla está en `planit_private`, fuera de los schemas de Data API; RLS activa y ningún permiso directo para clientes ni `service_role`. Las cinco RPC públicas nuevas sólo permiten EXECUTE a `service_role`; todas usan `search_path = ''`. Sus argumentos/retornos siguen B0 §7:

- `enqueue_missing_push_jobs(p_limit = 100) → integer` recupera pares faltantes y purga hasta 100 jobs terminales de más de siete días.
- `claim_push_jobs(p_limit = 100) → setof jsonb` entrega identificadores y token de lease. Barre hasta 100 candidatos inválidos sin impedir que otros jobs vigentes sean reclamados.
- `get_push_job_delivery(notification, subscription, lease) → jsonb | null` revalida estado, destinatario y preferencias; devuelve endpoint, claves, TTL restante y payload efímero sólo al worker.
- `complete_push_job(...) → void` confirma aceptación únicamente con lease vigente y datos de entrega obtenidos.
- `fail_push_job(..., p_error_code) → void` admite sólo códigos predefinidos; programa retry o estado terminal. Un 404/410 sólo deshabilita la misma revisión de suscripción utilizada en el envío. Los demás jobs del endpoint se descartan al reclamar/revalidar.

`PushWireV1` conserva `{version:1, notification_id, recipient_id, title, body, target}` del SW B9. Los textos se limpian y truncan a 80/120 caracteres Unicode antes de cifrar. No se persisten título, texto, endpoint ni claves en jobs. Datos operativos: IDs, estado, intentos, fechas, token de lease, revisión temporal de suscripción y código de error.

La función acepta exclusivamente POST con `Authorization: Bearer <PUSH_WORKER_TOKEN>`, secreto dedicado aleatorio de 32 bytes codificados base64url. No acepta JWT de usuarios, publishable key ni la propia service key como credencial de invocación. La service key se usa dentro de Edge para llamar las RPC. El gateway debe desplegarse con `--no-verify-jwt`: la verificación del secreto se realiza siempre en el handler con comparación de hashes en tiempo constante. Sin configuración válida responde 503 y no reclama trabajo.

El transporte usa `web-push@3.6.7` fijado en `deno.json`/`deno.lock`, sólo en Edge, para cifrado `aes128gcm` y firma VAPID. Se usa `generateRequestDetails` y fetch con timeout absoluto de ocho segundos y `redirect: 'error'`. No se leen cuerpos de respuesta del proveedor. Se admiten exclusivamente FCM, Mozilla Push, Apple Web Push y subdominios de Windows Notify enumerados por `safeEndpoint`; otros proveedores fallan de forma segura y requieren revisión antes de ampliar la lista. La validación general B9 no basta para impedir DNS rebinding; esta restricción no cambia permisos de recursos.

D12 aprobada por el responsable en esta conversación: lease 60 s, hasta cinco intentos, backoff 30/60/120/240 s + jitter uniforme 0..10 s, TTL 15 min, lote máximo 100 y retención terminal siete días. Edge reclama grupos de cinco inmediatamente antes de enviarlos, con concurrencia cinco y presupuesto de inicio de grupos de 40 s; REST tiene timeout cinco segundos. No reserva 100 leases antes de atenderlos.

2xx significa **aceptado por proveedor**. No acredita mostrado ni leído. 404/410 invalidan endpoint; 429, 5xx, timeout y red reintentan; otros estados son permanentes. Si el proveedor aceptó y se perdió ACK, el lease habilita retry: hay posibilidad de entrega repetida; `tag = notification_id` reduce duplicados visibles, sin garantía exactly-once.

La respuesta sólo contiene código y contadores: `enqueued`, `claimed`, `accepted`, `retry`, `failed`, `discarded`, `infrastructure_errors`. `retry` cuenta solicitudes de tratamiento transitorio; SQL puede haber agotado el job en ese intento. No expone IDs ni texto privado. El trigger sólo emite `push_enqueue_failed` sin SQLERRM; una falla de cola conserva la transacción del aviso y backfill la recupera.

## Reproducción local

Desde la raíz del worktree, con Node, Deno y el toolkit PostgreSQL usado por las suites existentes:

```powershell
npm ci
$env:PLANIT_TEST_TOOLS_DIR = '<ruta>/node_modules' # pg y @embedded-postgres/windows-x64
node scripts/check-r7-push-delivery.mjs
$env:PLANIT_DENO_PATH = '<ruta>/deno.exe' # omitir si deno está en PATH
node scripts/check-r7-push-delivery-edge.mjs
npm run build
npm run lint
$env:PLANIT_SW_OUTPUT = 'docs/qa/r7-block-10/sw'
node scripts/check-r7-push-subscriptions-sw.mjs
$env:PLANIT_SQL_OUTPUT = 'docs/qa/r7-block-10/subscriptions'
node scripts/check-r7-push-subscriptions.mjs
```

SQL usa PostgreSQL real local con Auth/Storage SQL simulados y `SET ROLE`; no acredita HTTP/JWT ni Supabase remoto. Deno prueba criptografía real con RPC y transporte de red simulados. SW se ejecuta en Edge headless con eventos sintéticos; no acredita recepción Push del SO. El suite heredado B9 conserva un rótulo histórico «39 migraciones»; consultar el inventario JSON para la cantidad realmente reproducida.

## Procedimiento remoto propuesto — NO ejecutado

Requiere aprobación independiente para cada operación y exclusivamente proyecto `iepeqmvzjguwlhnecsdq`. El proyecto histórico no participa.

1. Revisar migraciones pendientes, asesores, `migration list` y dry-run. Aplicar primero B9 si falta y luego B10 con autorización; verificar ACL, RLS, funciones e inventario remoto.
2. Configurar en secrets Edge `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `PUSH_WORKER_TOKEN`, mediante un canal seguro. El par VAPID debe coincidir entre sí y con `VITE_VAPID_PUBLIC_KEY` del frontend. No imprimir los valores ni pasarlos a documentación, PR o historial del shell. Supabase suministra URL y service key al runtime.
3. Desplegar `r7-push` al proyecto indicado con `--no-verify-jwt`. Probar 401 sin secreto y con JWT de usuario, 503 ante configuración rota y una invocación manual autenticada con cuentas de prueba y datos no sensibles.
4. Guardar URL fija del worker y su token dedicado en Vault; instalar/habilitar `pg_cron`/`pg_net` sólo con aprobación. Preparar un job cada minuto que obtenga esos dos secrets por nombre, llame por POST a la URL fija y envíe el token en cabecera Authorization. Nunca usar un webhook público o transportar el secreto en URL. No se incluye cron activo en la migración.
5. Limitar a un cron registrado y no crear duplicados al reintentar configuración. Consultar resultados HTTP sin volcar cabeceras; alertar por 401/503, `push_enqueue_failed`, infraestructura fallida y jobs expirados/reintentos agotados. Comparar aceptación y backlog con métricas agregadas, sin inspeccionar previews ni endpoints en logs.
6. Validar gesto opt-in, dos dispositivos, baja individual, permiso denied, offline, preferencias, cuenta cambiada y revocación. Probar escritorio, Android Chrome e iOS instalado cuando haya hardware/HTTPS. Registrar proveedor aceptó / navegador mostró / usuario leyó por separado.

Con un cron por minuto: hasta **1.440 invocaciones Edge/día** y techo de **144.000 intentos Push/día**, con 100 jobs por invocación; con cola vacía se realizan dos RPC por invocación. El límite es técnico por invocación, no una cuota de producto ni un límite global frente a invocadores autorizados concurrentes. Revisar uso real y tarifas del plan antes de activar; no se presume costo monetario ni SLA. El lease coordina concurrencia y las llamadas duran menos de un minuto en condiciones de timeout previstas.

Rollback operativo: detener el cron y retirar el acceso del invocador; conservar jobs y avisos. No deshacer migraciones aplicadas ni borrar historial para desactivar Push. Rotar token dedicado en Edge y Vault de forma coordinada; rotar VAPID exige renovar suscripciones del navegador con la nueva clave pública.

El SW B9 dirige clics a la bandeja del mismo origen, que valida sesión y RLS; B11 es dueño del wiring central y del ajuste Push visible en la aplicación. No se añade integración de rutas en B10. Previews ya entregadas a un dispositivo y la ventana entre comprobación de permisos y red no son revocables retroactivamente.

Fuentes técnicas consultadas: [web-push](https://github.com/web-push-libs/web-push#api-reference) y [autenticación de Edge Functions](https://supabase.com/docs/guides/functions/auth). El mecanismo de token dedicado se valida en el handler, independiente de JWT de usuario.
