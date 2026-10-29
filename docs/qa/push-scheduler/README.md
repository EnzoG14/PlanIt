# Push sin envío automático — 29/10/2026

**Frecuencia vigente: cada 10 segundos.** Ajustada el 29/10/2026 a pedido del
responsable después de confirmar recepción en el S23. Se conserva jobid 1 y el
nombre histórico `planit-push-every-minute`; no se crea otro cron. Hasta 8.640
invocaciones Edge/día (seis veces la frecuencia inicial), incluso con cola vacía.
El intervalo reduce la espera de planificación; la entrega del proveedor y del
dispositivo puede añadir demora. Las secciones siguientes conservan el acta
de activación inicial a un minuto.

Diagnóstico remoto de sólo lectura en `planit-v2` (`iepeqmvzjguwlhnecsdq`):

- `r7-push` ACTIVE, versión 2; ninguna invocación en los logs de las últimas 24 horas.
- Cinco suscripciones activas.
- 34 jobs `pending`, todos vencidos, cero intentos; fechas del 19 al 28 de octubre.
- Un job `sent` de la prueba manual del 16/10, con dos intentos.
- `pg_cron` y `pg_net` ausentes; Vault instalado, sin secretos de Push.

El responsable reproduce con build + preview por HTTPS/ngrok, PWA instalada en
Samsung Galaxy S23 y DM dirigido a la cuenta suscrita. La cola sin consumidor
explicaba que activar Push no produjera entregas automáticas. La recepción física
posterior al arreglo está confirmada al final de este documento.

## Configuración aplicada con autorización — 29/10/2026

El responsable autorizó habilitar pg_cron/pg_net, guardar el token existente en
Vault y ejecutar el envío cada minuto. Aplicado exclusivamente en planit-v2:

- Vault: `planit_push_worker_url` y `planit_push_worker_token`, sin rotar VAPID.
  Se aprovisionaron mediante una RPC temporal sólo service_role con parámetros
  JSON por HTTPS. Se eliminó la RPC después; no quedó una API administrativa.
- pg_cron 1.6.4 y pg_net 0.20.4 instalados.
- Job 1 `planit-push-every-minute`, propietario postgres, activo, `* * * * *`.
- Primera ejecución automática: 29/10/2026 00:20 Argentina, cron succeeded,
  HTTP 200, `push_batch_complete`, `infrastructure_errors=0`.
- Los 34 pendientes vencidos pasaron a discarded; el job sent histórico se purgó
  por la retención existente. No se reenvió contenido vencido.
- Asesores de seguridad antes/después: mismas categorías y cantidades
  (9 INFO RLS sin policies en tablas de RPC, 63 WARN RPC definer y 1 WARN protección
  de contraseñas). No se cambiaron esos contratos.
- Historial: 49 migraciones sincronizadas y `20261028234334_event_change_notifications`
  pendiente según migration list y db push --dry-run --skip-vault. Esa migración
  de negocio NO se aplicó. La configuración de cron es operativa, fuera del historial.

### Revisión de permisos de pg_net

La revisión automática rechazó inicialmente el REVOKE de todo el esquema net por
su posible impacto en otros consumidores. Se verificó que net aún no existía y
no había consumidores de aplicación; sólo el trigger estándar de extensiones.
La alternativa con REVOKE sólo de la cola fue admitida, pero resultó ineficaz:
la tabla pertenece a supabase_admin y postgres no tiene grant option. Se pausó
temporalmente el job durante la verificación y luego se reactivó.

El SQL final no promete una restricción que postgres no puede imponer. Se verificó
por HTTP que `Accept-Profile: net` devuelve 406/PGRST106 `Invalid schema: net`:
la cola no está expuesta por la API pública. Los logins SQL directos conservan
la posibilidad de leer el token mientras espera en la cola, comportamiento
documentado de pg_net. Mantener restringido el acceso directo a PostgreSQL y
no exponer net en la API. El token es dedicado al worker, no service_role.

### Procedimiento reproducible

[SQL operativo](../../../supabase/operations/enable-push-scheduler.sql), separado de
las migraciones de esquema. Requiere aprobación antes de modificar infraestructura
remota, según `supabase/AGENTS.md`.

1. Aprovisionar de forma segura en Vault `planit_push_worker_url` (URL fija de
   `r7-push` en planit-v2) y `planit_push_worker_token` (token existente del archivo
   privado indicado en el acta B10). Usar parámetros enlazados por una conexión
   segura o la UI de Vault; nunca interpolar secretos en SQL registrado, chat o Git.
   No regenerar VAPID ni renovar suscripciones por este cambio.
2. Revisar extensiones, otros consumidores de `net` y sus permisos; ejecutar el SQL
   como `postgres`. Verificar que net no esté expuesto en la Data API. Instala las
   extensiones y registra un único job `planit-push-every-minute` cada 10 segundos.
   El job valida URL/token en cada ejecución y lee el token desde Vault.
3. Verificar una única fila activa en `cron.job` para ese nombre y propietario;
   comprobar ejecución en `cron.job_run_details` y respuesta HTTP 200 en logs de
   `r7-push`. Un cron exitoso sólo acredita encolado HTTP; verificar también la
   respuesta y `infrastructure_errors = 0`.
4. Generar un DM nuevo entre cuentas de prueba con consentimiento, esperar el
   siguiente ciclo de 10 segundos y comprobar job `sent` / aceptación del proveedor. Confirmar
   aparte la recepción física en el S23. Los 34 jobs vencidos no se reenvían:
   conservan su TTL de 15 minutos y el worker los descarta normalmente.
5. Revisar asesores y exposición de `net` y Vault sin consultar ni registrar
   cabeceras, endpoints ni claves de suscripción.

Hasta 8.640 invocaciones Edge/día, incluso con cola vacía, y hasta 100 intentos por
invocación. No se cambian worker, frontend, RLS del dominio ni migraciones previas.
Para detener el envío: `select cron.unschedule('planit-push-every-minute');` con
autorización operativa. Conserva avisos, suscripciones e historial.

Referencia: [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).
El worker existente usa su token dedicado en Authorization; no usa una API key
pública para autenticarse.

## Verificación local

`node scripts/check-push-scheduler.mjs`: PASS en PostgreSQL 17.5 efímero.
Prueba secretos ausentes/inválidos, URL fija, actualización del mismo job,
lectura del token vigente y rechazo de URL alterada. Vault, cron y HTTP son dobles SQL:
no acredita instalación de extensiones, ejecución periódica real ni entrega física.
La primera ejecución quedó limitada por EACCES de red local del sandbox; la
ejecución con permiso de conexión local pasó. La prueba local no escribe en remoto;
la activación remota autorizada se describe arriba.

## Recepción física confirmada

El 29/10/2026 el responsable envió un DM nuevo a la cuenta del Samsung Galaxy S23
y confirmó: «Si me llegó la notificacion en el s23». Queda acreditada la recepción
en ese dispositivo con PWA instalada, build + preview por HTTPS/ngrok y cron
activo. No acredita otros dispositivos ni toda la matriz de permisos/estados.
