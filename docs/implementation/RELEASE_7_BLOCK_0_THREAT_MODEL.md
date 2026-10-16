# R7 B0 — Modelo de amenazas y matriz de autorización propuesta v1

16/10/2026. Complementa el [acta](RELEASE_7_BLOCK_0_DECISIONS.md) y el [contrato](RELEASE_7_BLOCK_0_CONTRACTS.md). **Diseño para ratificar, no prueba de permisos R7 instalados.** Hora de decisión: servidor, `clock_timestamp() AT TIME ZONE 'America/Argentina/Buenos_Aires'`. Cliente sólo presenta; JWT/`auth.uid()` autoriza.

## Roles, estados y acciones

A organizador; B participación confirmed; C solicitante pending de reincorporación o usuario sin confirmed; D removed; E sólo enlace/grant de detalle; F tercero autenticado; G anon. `pending` no es un valor de `event_participations.status`: está en solicitudes; no agregar ese estado a la participación. `cancelled` propia se equipara a no miembro para medios R7. Poseer enlace bruto no da acceso hasta canjearlo ni habilita chat/historias.

| Evento vigente; acción | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| Ver detalle público | Sí | Sí | Sí | Sí | Sí | Sí | No |
| Ver detalle oculto | Sí | Sólo grant activo | Sólo grant activo | Sólo grant activo | Grant activo | No | No |
| Enviar texto/imagen chat | Sí | Sí + permiso detalle | No | No | No | No | No |
| Leer chat/adjunto asociado | Sí | Sí + permiso detalle | No | No | No | No | No |
| Reservar/subir/publicar historia | Sí | Sí + permiso detalle | No | No | No | No | No |
| Listar/GET historia antes T+24h | Sí | Sí + permiso detalle | No | No | No | No | No |
| GET historia desde T+24h | No | No | No | No | No | No | No |
| GET upload todavía no publicado | No; preview local | No; preview local | No | No | No | No | No |
| Borrar upload propio no asociado | Sí + reserva vigente | Sí + reserva vigente | Sólo limpieza segura de intento propio | Igual | Igual | No | No |
| Alterar/remover medio ya publicado | No API en R7 | No API en R7 | No | No | No | No | No |
| Calendar con detalle autorizado | Sí | Sí | Según detalle | Según detalle | Según detalle | Sólo público | No |
| Share URL pública + resumen público | Sí | Sí | Sí | Sí | Sí | Sí | No |
| Obtener/compartir invitación oculta | Token memoria o generar explícito | No | No | No | No | No | No |
| Alta/baja Push propia | Sí | Sí | Sí | Sí | Sí | Sí | No |
| Alta/baja Push de otro usuario | No | No | No | No | No | No | No |
| Leer queue / keys ajenas / ejecutar worker | No | No | No | No | No | No | No |

Evento público cerrado puede restringir detalle a owner/participación histórica según `can_view_event`; no usar la primera fila de la tabla para ignorar estado cerrado. Restituir grant no convierte removed en confirmed. El rol social (follow/privacidad/bloqueo) no amplía permisos del evento. Bloqueo R5 sigue impidiendo nuevos DM y permite historial de sus miembros; no modifica permisos grupales por iniciativa de R7.

| Estado/evento/tiempo | Lectura chat/adjuntos A/B | Publicar chat/historia | Leer historia A/B | C/D/E/F/G medios R7 |
|---|---|---|---|---|
| Abierto, antes de fin, T<expires_at | Según can_read_event_chat | Sí si miembro vigente | Sí si miembro vigente | No |
| T=ends_at o posterior, fin normal | Historial según helper | No | Hasta expires_at; D03 confirmada | No |
| Cancelado, T<expires_at | Historial según helper | No | Default: conservar si helper autoriza; **ratificación pendiente** | No |
| Archivado, T<expires_at | Historial según helper | No | Default: conservar si helper autoriza; **ratificación pendiente** | No |
| Revocación/remoción/retirada antes TTL | Siguiente request denegado si pierde helper | No | Siguiente request denegado | No |
| T=created_at+24h exacto | Chat no expira | Historia nueva según evento | No, uploader tampoco | No |
| GC pendiente o fallido tras TTL | Chat y galería intactos | Según evento | No, archivo físico no implica autorización | No |

Worker de servicio tiene facultades excepcionales acotadas, no se clasifica como usuario A: claim/finalizar trabajos mediante API privada y credencial server-only; no usar JWT de usuario para saltar reglas. Lectura administrativa para diagnóstico no equivale a permiso de producto.

## Límites de confianza, amenaza y controles

| Activo / ataque | Control propuesto y escenario adversarial | Bloques / evidencia exigida |
|---|---|---|
| UUID/path elegido por navegador; suplantar author/uploader/event | Auth server-side; reserva deriva propietario; path UUID canónico; verificar owner_id, MIME, bytes y event; sin parámetros sender/author | B1/B2/B4: JWT ajeno, anon, path de otro evento, UUID malformado |
| Owner Storage descarga historia vencida por policy legacy | Reservar `r7/...` como prefijo raíz; SELECT legacy excluye todo r7; rama R7 depende exclusivamente de asociación autorizada+TTL; revisar todas las policies OR | B1/B4/B6: GET/LIST/HEAD/firmar, uploader y otros roles, antes/después TTL |
| Obtener signed URL con TTL arbitrario antes de caducar | **No basta que la UI no firme**: política de R7 debe admitir sólo operación autenticada de descarga y rechazar firma, info/list transform/download alternos que emitan bearer URL. Verificar helper/operación disponible del Storage real; si no puede distinguir sign, gate D10 queda BLOCKED y hace falta gateway server-only que streamee con JWT+TTL, sin SELECT directo cliente | B1 spike de Storage real; B4 no GO por RLS estática |
| Cache/CDN/SW sigue sirviendo historia | metadata `no-store`, GET fetch con cache no-store, sin runtime route privada ni cache API SW; Blob revocado al vencer/ocultar/cambiar cuenta; evitar URLs persistentes | B4/B5/B9: cabeceras reales, red offline y request repetido a T+24h |
| Bytes ya descargados/capturas | Revocar Blob y cerrar visor reduce exposición en app; ningún servidor recupera una copia hecha legítimamente antes. No prometer borrado remoto de bytes/capturas del usuario | Limitación explícita, no excepción a denegación de nueva descarga |
| Reutilizar archivo de galería/avatar/chat como historia y GC lo borra | Namespace y reserva por propósito; global claim file_id UNIQUE para R7; guardas en todos los lados de referencia, incluyendo event_images y profiles.avatar_file_id; FK RESTRICT; legacy compartido no se migra a exclusivo | B1/B4/B6: cross-domain inserts/updates y GC concurrente |
| Firma/event_images legacy blanquea namespace | files INSERT R7 sólo RPC; trigger files exige reserva válida; trigger event_images exige path legacy; avatar sólo bucket avatars; create_event/add_event_image no aceptan r7 paths aunque su contexto sea DEFINER | B1: SQL directo y RPC legacy no crean enlace ni file visible |
| RPC timeout tras commit provoca compensación destructiva | UUID estable y reconciliación; misma entrada devuelve id, payload diferente409/conflict; cliente no elimina objeto por un resultado incierto; GC reconsulta referencias bajo lock | B2/B4/B6: pérdida respuesta, doble submit, expiración de reserva y retry |
| Publish contra fin/remoción/revocación | READ COMMITTED; orden evento→participación→reserva/path→file; comprobar estado/miembro/objeto **bajo** locks y hora real tras espera | B2/B4: dos conexiones y T=fin tras lock; no autoridad por snapshot UI |
| Imagen falsa/corrupta/sobretamaño | Archivo1..5242880bytes JPEG/PNG/WebP; metadata validada, decodificación cliente para UX; B1 debe definir verificación de bytes confiable si metadata admite spoofing. No declarar contenido verificado sólo por MIME del cliente | B1/B3/B5: truncados/magic falso/0byte/5MiB+1 |
| Mensaje vacío o DM image-only al relajar CHECK | constraint trigger diferido valida estado final de message+attachment y kind; máximo1; DML cliente revocado; cuerpo DM obligatorio también en trigger | B1/B2: INSERT/UPDATE/DELETE directo como rol, TX rollback y retry |
| Realtime revela medios/privacidad | Mantener sólo messages/notifications; nullable body dispara reconciliación por RPCv2 para attachment; no publicar keys/reservas/queue/profiles | B2/B3/B9: canal ajeno, sesión cambiada y recuperación |
| Endpoint Push robado/SSR F del worker | Endpoint tratado como credencial; alta válida HTTPS proveedor permitido, sin localhost/IP privada/redirecciones; límites de bytes/keys/base64url; hash endpoint en índice si se decide; error genérico ante endpoint ajeno | B9/B10: JWT otro owner, endpoint manipulado, DNS/redirect/429/404/410 |
| Cambio de cuenta en mismo navegador | No reatribuir endpoint con upsert user_id; baja owner bajo sesión previa, unsubscribe local, nueva subscription verificada; si falla baja backend no habilitar reutilización silenciosa. logout SW borra notificaciones locales de esa cuenta; push en vuelo conserva riesgo residual explicado | B9/B10: A→logout→B, offline/logout, dos dispositivos |
| Preview DM expone contenido por bloqueo o dato revocado | Worker revalida destinatario y permiso al enviar; preview limitada/saneada; consentimiento sobre lock-screen y opt-out; fallback genérico; payload/log nunca contiene keys/endpoints ni datos demográficos | B10: preview on/off, bloqueo, recurso ausente, no payload persistido |
| Falla Push borra bandeja o error de encolado aborta aviso | No duplicar productor; outbox durable+backfill idempotente, fallo de enqueue aislado sin revertir notifications; jobs guardan IDs; reintento no crea otra notificación | B10: trigger falla, cola inaccesible, worker caído, reanudación |
| Dos workers envían mismo job | UNIQUE(notification,subscription), SKIP LOCKED y lease token, ACK sólo del claim vigente; proveedor puede duplicar si ACK se pierde, tag=id colapsa cuando admite navegador | B10: lease expirado y ACK tardío; no garantía exactly-once |
| Push click redirige fuera de app o muestra otra cuenta | Payload versión+notification_id+recipient_id, ruta interna allowlist y mismo origin; SW no confía en URL externa; pantalla consulta target con sesión activa y recipient antes de navegar | B9/B10/B11: payload malicioso y cuenta cambiada |
| ICS injection / hora dispositivo altera evento | DTO allowlist autorizado; TZ Argentina explícita→UTC, CRLF escapado y folding por octetos; sin fields de asistentes; resultado ofrecido ≠ guardado | B7: parser, Unicode, TZ distinta/import cliente real |
| Share filtra grant o rota link sin saberlo | Público canónico de origin deployment confiable; oculto sólo token owner en memoria; confirmación separada para rotación; AbortError neutral; no datos de perfiles/asistentes | B8: usuario confirmado oculto, cancelación, token viejo/revocado |

## Casos de frontera y evidencia requerida

1. Fixture local T0; publicar; medir servidor a T0+23:59:59.999999 (permite), T0+24:00:00 (niega), T0+24h+1µs (niega). Repetir RPC, REST, GET auténtico, intento firmar, uploader/confirmed/anon y link antiguo con caché deshabilitada/habilitada. Cambiar reloj cliente ±48h no altera decisión servidor.
2. Subida antes de fin, RPC bloqueada hasta después de fin: rechazo sin mensaje/historia; reserva huérfana limpiable. Remover/retirar/revocar en carrera con publish y download: operaciones serializadas; siguiente lectura ya no concede acceso.
3. Fin normal T0+1h: historia sigue hasta T0+24h, no se puede publicar otra. Cancelación/archivo: dos ramas de expectativa pendientes hasta firma; no marcar PASS con una elección inventada.
4. Confirmado ajeno no es organizador, pending/revoked/link-only tampoco confirmed. Repetir tablas/RPC/Storage para cada rol de la matriz y ambos eventos público/oculto.
5. Dos workers GC contra dos publicaciones/reservas: ningún objeto reclamado para borrar puede finalizar asociación; referencia cruzada o lease vencido impide borrado. DELETE físico fallido conserva tombstone reintentable.
6. Dispositivos reales: Chrome/Edge escritorio, Chrome Android, iOS PWA instalada y pestaña Safari; Push visible, permiso denied, click y entrega durante logout. Emulación/mock no demuestra recepción ni compatibilidad física. Estado actual de todos estos tests: **NOT RUN**.

Fuentes técnicas consultadas: [Storage RLS y operaciones](https://supabase.com/docs/guides/storage/security/access-control), [helpers de Storage](https://supabase.com/docs/guides/storage/schema/helper-functions), [custom SW injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest). Existencia de un helper en docs actuales no demuestra disponibilidad en proyecto; se verifica en B1. El [cambio TLS anunciado](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) afecta clientes HTTP antiguos a partir de noviembre; no exige DDL de R7 ni acredita compatibilidad de un dispositivo no probado.
