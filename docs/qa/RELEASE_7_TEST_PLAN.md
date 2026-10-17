# PlanIt — R7 · Plan integral de pruebas

**Corte de ejecución B11,17/10/2026:** [reporte](RELEASE_7_TEST_REPORT.md), [reproducción y evidencia](r7-block-11/README.md), [29 CA por capa](r7-block-11/CRITERIA.md). Los casos siguientes conservan el alcance aprobado. Replay47 y suites locales/UI/SW ejecutados; transporte real A–G/Storage/TTL/GC y matriz física siguen pendientes. No interpretar pruebas locales como autorización remota o aceptación humana.

**Cobertura:** 29 CA, 7 RF, regresión R1–R6, 12 bloques. **Preparación:** generar fixtures en DB LOCAL aislada; remoto sólo con autorización. Separar comprobación de SQL, REST/JWT, Storage autenticado, UI, SW y Push dispositivo real. No incluir credenciales/endpoint de usuarios en reportes.

## 1. Entornos y técnica de evidencia

- Fijar SHA de `main`, npm lockfile, versión CLI, migraciones base, source revision Google Doc, navegador/OS, clock de servidor, ambiente/local vs remoto y role/JWT usado.
- Usuarios sintéticos A organizer, B confirmed, C pending, D removed, E link-only de unlisted, F tercero sin relación, G anónimo; evento público vigente, oculto, terminado, cancelado, archivado, y DM A↔B.
- Usar fixtures de blobs JPEG/PNG/WebP válidos + encabezado falso/archivo truncado/sobretamaño/archivo vacío. Nombres Unicode y emoji en eventos para ICS y share. Mock clock sólo en pruebas unit/SQL locales; no manipular reloj productivo.
- Instrumentar auditoría/logging sin secretos: `event_id`, `message_id`, `story_id` sintéticos y request identifier sí; endpoint VAPID, auth tokens, p256dh y auth subscription **nunca**.
- Cada migración: 4 columnas independientes `CREADA`, `SQL LOCAL`, `REMOTA APLICADA CON PERMISO`, `REMOTA VERIFICADA`; no escribir PASS remoto por replay local.

## 2. SQL/Storage: relaciones, restricciones y permisos

**R7-TC-SQL-01**: `message_attachments` UNIQUE(message_id) → segunda imagen rechazada, sin filas parciales. `files` y `message_attachments` con FK/owner/consistency; DM con imagen y mensaje totalmente vacío fallan sin bypass.

**R7-TC-SQL-02**: comparativa de RPC históricas get/send chat (texto) antes/después; timelocks `READ COMMITTED`; reintentar mismo UUID+payload devuelve una fila; mismo UUID+payload distinto produce conflicto; simular desconexión después de commit.

**R7-TC-SQL-03**: A/B sí leen adjunto chat; C/D/E/F/anon no pueden listar mensaje, metadatos ni descargar Storage R7/chat. B pierde acceso al revocarse; unlisted link-only sin confirmed = no acceso.

**R7-TC-SQL-04**: objeto registrado como `event_images`, avatar u otro mensaje no puede ser ligado como historia/adjunto nuevo, según regla exclusiva aprobada; galería original puede seguir leyendo/ordenando/removiendo sin regresión.

**R7-TC-SQL-05**: publicar historia A/B antes del cierre, C/D/E/F/anon denegado. Carrera entre subida→close/removed→RPC: no historia registrada. `created_at/expires_at` generados server-side, diferencia exacta 24 h.

**R7-TC-SQL-06**: lectura lista historias por evento y permiso: sin fuga cross-event; paginación determinista por `(created_at,id)` si se implementa; consulta vacía ≠ error.

**R7-TC-SQL-07**: reloj servidor congelado y recorrido a 23:59:59, 24:00:00 y >24 h; query y GET Storage autenticado deben denegar desde T+24; creador original también pierde GET. Accesos directos antiguos no se validan sólo por el frontend.

**R7-TC-SQL-08**: GC borra solo objeto exclusivo expirado, preserva galería, chat, avatar, historias activas; fallos Storage/BD dejan trabajo reintentable, nunca borran otras referencias. Dos workers concurrentes no causan doble eliminación dañina.

**R7-TC-SQL-09**: probar todas las policies `storage.objects` de namespace original y R7 antes/después; SELECT de uploader original no concede acceso a historias vencidas; ninguna policy adicional OR reabre un acceso prohibido. Validar operación GET vs LIST.

**R7-TC-SQL-10**: `push_subscriptions` RLS owner; no upsert de endpoint perteneciente a otro user, no impersonation por `user_id`, endpoints invalidables, no fuga de keys. Cuenta A con 2 browsers; baja en 1 preserva otro.

**R7-TC-SQL-11**: `notifications` contiene 1 fila por evento de negocio preexistente; encolado por (notification,subscription) sin duplicados; DM sí, group chat no; ACL de jobs permite sólo worker autorizado, nunca JWT normal.

## 3. UI móvil/desktop

**R7-TC-UI-01** Chat: imagen sola y texto+imagen, remove/replace preview, seleccionar más de una, error MIME/tamaño/corrupción, cancelación, submit doble, offline/intermitencia, retry del mismo UUID, descarga authorized, imagen indisponible y sin permisos; texto-only intacto.

**R7-TC-UI-02** Historias: publicar, vista miniaturas/visor, volver a detalle, cerrar modal con escape, evento sin historias, error/upload incierto, usuario expulsado, otra cuenta, historial de historias expirado y desmontaje de URL blob.

**R7-TC-UI-03** Rutas/funciones: `EventDetailPage` permite Calendar/Share/Stories solo bajo permiso correcto, preserva rutas de home/map/my-events y contenido actual.

**R7-TC-UI-04** `.ics`: validación RFC 5545; timezone browser Argentina vs UTC/Europa; cambio de día/mes/año; nombre con `;`, `,`, `\`, CRLF y emojis UTF-8; archivo compatible con cliente calendario real; no falso aviso de creación exitosa.

**R7-TC-UI-05** Share: `navigator.share` disponible, falta de soporte, fallback de copiar, `AbortError`, fallo permiso, links event public/unlisted (sólo organizer) y links rotados; sin datos personales ni tokens de R4 indebidos.

**R7-TC-UI-06** Push: `default/denied/granted/unsupported`, registro múltiple/baja, ventana privada, identidad cambia, app abierta/cerrada, offline/reconexión, click y RLS. Según D08 confirmada, preview real autorizada (incluido fragmento DM) tras explicar exposición en pantalla bloqueada; opción de ocultar previews y fallback genérico sin afectar la bandeja. No datos demográficos, contactos, claves ni endpoints en payload/logs.

**R7-TC-UI-07** Accesibilidad responsive: 320/375/390/768/1280 px, zoom 200 %, 44px target, foco, tab/ESC, aria-live, reduced-motion, contraste Amanecer, screen reader si disponible, safe area/keyboard real.

## 4. Edge/SW y dispositivos

**R7-TC-PUSH-01** PWA instala y actualiza precache tras integrar SW Push: `vite-plugin-pwa` sin regresión en auto-update, offline app shell, error sin internet, no cache de Supabase/private media.

**R7-TC-PUSH-02** Web Push válido en browser real por gesto voluntario, worker llega al endpoint autorizado con VAPID, notificación al SO, `notificationclick` abre app y destino seguro. Guardar navegador/versión, evidencia pública no sensible.

**R7-TC-PUSH-03** Denegado/no compatible: sólo bandeja interna, sin inscripción ficticia. Browser iOS: probar instalado vs tab Safari; soporte variable => `NOT RUN` si no se dispuso de dispositivo.

**R7-TC-PUSH-04** HTTPS/origin/env correcto; VAPID public front, private secrets Edge; rotación de clave o endpoint inválido, 404/410, 429, 500, timeout, retry jitter/backoff y job exhausto. No duplicar la fila notifications al reintentar.

**R7-TC-PUSH-05** Dos suscripciones mismo usuario y otra cuenta, aislamiento entre destinatarios; preview de DM sólo para destinatario autorizado con consentimiento, genérica si la oculta o pierde autorización; sin datos ocultos no autorizados ni secretos. Click revalida sesión, destinatario, RLS y recursos revocados. Probar cambio de cuenta, baja de endpoint y notificaciones ya en vuelo; no afirmar revocación de contenido ya entregado.

**R7-TC-PUSH-06** Cron de cleanup/worker: autenticación server-to-server real, invocador no autorizado rechazo, locks de concurrencia, cuotas, detección stuck jobs, rotación de secretos y guardrails de costo.

## 5. Regresiones y aceptación

- R1 creación/inscripción/cupo; R2 chat texto y bandeja; R3 editar/galería/cierre/remoción; R4 ocultos y enlace rotado; R5 privacidad/perfiles/DM/bloqueo; R6 estadísticas/CSV/`event_full`. No redefinir ni corregir R6 como tarea R7.
- `npm run build && npm run lint`; ejecutar scripts propios R7, los scripts de regresión existentes aplicables, replay SQL local y checks de permisos antes/después.
- Guardar `docs/qa/r7-block-N/README.md` + evidencia de salida de comandos/SQL/JWT/UI real. Marcar lacunas de dispositivos como NOT RUN, no PASS ficticio.
- Matriz oficial `RELEASE_7_ACCEPTANCE.md` (29 filas) debe aprobarse manualmente antes de `GO`.

## 6. Formato de reporte de bloque

`Fecha / HEAD / Rama / PR / RF-CA / Dxx aprobado / Cambios / Migración 4 marcas / SQL local / JWT real / Storage GET real / UI / SW / Push dispositivo / Build / Lint / R1–R6 / Evidencia / Hallazgos / Dudas / Gate`: todos con resultado explícito y comandos reproducibles. Bloque B11 no fusiona ni despliega automáticamente.
