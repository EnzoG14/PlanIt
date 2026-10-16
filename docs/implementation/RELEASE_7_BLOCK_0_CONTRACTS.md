# R7 B0 — Contratos técnicos v1 para revisión

16/10/2026; base `f8dd53c`. **Propuesta congelada como referencia versionada para revisión, NO aprobada para ejecutar features.** Cambios posteriores requieren revisión de consumidores y versión nueva explícita. Los nombres nuevos de este documento **no existen en catálogo**. [Acta/gates](RELEASE_7_BLOCK_0_DECISIONS.md), [permisos/amenazas](RELEASE_7_BLOCK_0_THREAT_MODEL.md).

## 1. Propiedad y orden de migraciones

| Slot lógico / owner | Dependencia | Objetos/cambios propuestos | Creada | SQL local | Remota aplicada con permiso | Remota verificada |
|---|---|---|---|---|---|---|
| B1 `*_r7_media_contract.sql` / multimedia | B0 firmado | Reservas/claims privados, message_attachments, CHECK diferido, Storage/files/galería guardas | 0 | NOT RUN | 0 | 0 |
| B2 `*_r7_chat_attachments.sql` / chat API | B1 integrado | RPC chat v2, compatibilidad texto/retry/cursor | 0 | NOT RUN | 0 | 0 |
| B4 `*_r7_stories.sql` / historias API | B1 integrado | stories, TTL+RLS+GET, publicar/listar, claim exclusivo | 0 | NOT RUN | 0 | 0 |
| B6 `*_r7_media_gc.sql` / cleanup | B4 integrado | Leases/tombstones/claims GC y Edge cleanup; cron separado | 0 | NOT RUN | 0 | 0 |
| B9 `*_r7_push_subscriptions.sql` / Push plataforma | B0 firmado | Subscriptions/preferences, RPCs propias; SW frontend | 0 | NOT RUN | 0 | 0 |
| B10 `*_r7_push_jobs.sql` / Push worker | B9 integrado | Cola privada, encolado/backfill, claim/ack/fail, Edge | 0 | NOT RUN | 0 | 0 |

Son slots, no timestamps reservados ni SQL aplicado. B2/B4 independientes tras B1; B6 tras B4 sin esperar B5; B9 no depende de media. Integración serial de migraciones, replay de conjunto y permiso remoto separado. Toda tabla pública nueva activa RLS en la misma transacción de creación; privada sin USAGE ni DML para clientes (RLS adicional defensiva). Nada agrega timezone ni borradores. Fechas propias timestamp sin zona AR; intervalos de expiración usan hora servidor **real tras esperar locks**, no `now()` anclado al inicio de una transacción larga.

## 2. Diseño SQL de B1: archivos, reserva, exclusividad y mensajes

SQL de propuesta estructural. **No ejecutar este bloque como migración parcial**: requiere implementar los triggers/helpers transaccionales descritos abajo, grants y pruebas antes del primer commit de esquema. No se presenta como SQL completo ensayado; los cuerpos ejecutables son entregable de los bloques correspondientes.

```sql
create table planit_private.media_uploads (
  id uuid primary key, -- file_id preasignado, no demuestra existencia de files todavía
  attempt_id uuid not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  purpose text not null check (purpose in ('chat','story')),
  bucket_name text not null check (bucket_name = 'event_media'),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  state text not null check (state in ('reserved','published','deleting','deleted')),
  created_at timestamp without time zone not null,
  updated_at timestamp without time zone not null,
  lease_token uuid,
  lease_until timestamp without time zone,
  check ((state = 'deleting') = (lease_token is not null and lease_until is not null))
);
alter table planit_private.media_uploads enable row level security;
create index media_uploads_owner on planit_private.media_uploads(user_id,event_id);
create index media_uploads_gc on planit_private.media_uploads(state,updated_at,id);

create table planit_private.media_claims (
  file_id uuid primary key references public.files(id) on delete restrict,
  upload_id uuid not null unique references planit_private.media_uploads(id) on delete restrict,
  purpose text not null check (purpose in ('chat','story')),
  resource_id uuid not null unique,
  event_id uuid not null references public.events(id) on delete restrict,
  created_at timestamp without time zone not null
);
alter table planit_private.media_claims enable row level security;
create index media_claims_event on planit_private.media_claims(event_id);

create table public.message_attachments (
  id uuid primary key,
  message_id uuid not null unique references public.messages(id) on delete restrict,
  file_id uuid not null unique references public.files(id) on delete restrict,
  created_at timestamp without time zone not null
);
alter table public.message_attachments enable row level security;
revoke all on public.message_attachments from public,anon,authenticated;
grant select on public.message_attachments to authenticated;
-- SELECT policy usa can_read_event_chat(event_id desde conversation); nunca owner del file solo.
```

**Invariante local vs transaccional:** no FK `media_uploads.id→files` porque reservar precede a upload/registro. `media_claims` mantiene vínculo exclusivo; public attachment/story referencia file real. Trigger de claims comprueba `file_id=upload_id`, mismo propósito/evento y resource_id del registro final. FK/UNIQUE protegen identidad local; triggers diferidos comprueban asociación final. `files` legacy puede seguir compartido: no añadir UNIQUE global a event_images(file_id) ni borrar referencias previas.

**Body:** reemplazar CHECK histórico por `(body IS NULL OR (char_length(body) BETWEEN 1 AND 2000 AND body !~ '^\s*$'))` y permitir NULL **únicamente junto** a constraint trigger `DEFERRABLE INITIALLY DEFERRED` sobre messages/attachments. Al commit, lookup de conversación: direct requiere body válido y cero adjuntos; event requiere body válido o exactamente1 adjunto. Trigger también dispara ante DELETE/UPDATE de attachment y cambio de conversación/body. Si la operación interna falla, revierte todo. Antes de habilitar body NULL, lectura histórica v1 debe filtrar filas image-only o envolver sólo texto, no entregar NULL como string obligatorio a clientes previos. La UI R7 usa lectura v2; no modificar la firma de salida histórica.

**Protección de referencias:** triggers comunes en files, event_images, profiles.avatar_file_id, attachments/claims y stories (B4) impiden cualquier referencia cruzada del namespace R7. Los registros directos files legacy siguen funcionando; INSERT R7 sólo bajo reserva propia y procedimiento autorizado, y guardas no se pueden eludir desde create_event/add_event_image DEFINER. `files.uploaded_by` se deriva de Auth; se coteja con owner_id del objeto y path, MIME/tamaño real. Validación metadata no demuestra bytes decodificables: verificación robusta de imagen en frontera confiable debe resolverse/ensayarse en B1 antes de afirmar rechazo de magic falso.

**CHECK existente que debe reemplazarse en B1:** `files_path_valid` exige primer segmento=uploaded_by y hoy rechazaría todos los paths R7. Nueva definición disjunta conserva exactamente legacy fuera del prefijo r7 y valida R7 con bucket event_media, propósito chat/stories, **tercer segmento=uploaded_by**, cuarto=event UUID, quinto=attempt UUID+ext y cinco segmentos exactos. Trigger valida reserva/claim canónicos, sin ampliar permisos legacy. El CHECK de bucket se conserva (`event_media,avatars`); no hay buckets nuevos. Ensayar fixtures legacy/avatar, UID falso, r7 desconocido y segmentos extras además de policies.

### Namespace exacto y Storage

`event_media/r7/chat/<uid>/<event_id>/<attempt_id>.<jpg|png|webp>` y `event_media/r7/stories/<uid>/<event_id>/<attempt_id>.<jpg|png|webp>`. `bucket_name='event_media'`; `storage_path` empieza `r7/...`, no incluye bucket. UUIDs canónicos y extensión corresponde al MIME. Usar prefijo raíz r7 evita que el uploader coincida con la primera parte legacy; aun así se excluye explícitamente todo r7 en las policies/registradores legacy. No paths alternativos ni decode ambiguo/segmentos adicionales.

Reemplazar por nueva migración las policies históricas por expresiones equivalentes para legacy más ramas R7 separadas; **no agregar otra policy SELECT restrictiva esperando que venza el OR**:

```sql
-- Esquema de predicados, helpers privados nuevos implementados en B1/B4:
-- event_media_select_visible:
bucket_id = 'event_media' and (
  (split_part(name,'/',1) <> 'r7' and LEGACY_SELECT_SIN_CAMBIOS)
  or (split_part(name,'/',1) = 'r7'
      and storage.allow_only_operation('object.get_authenticated')
      and planit_private.can_read_r7_media(name))
)
-- INSERT: legacy intacto OR reserva propia r7 en state reserved, vigente,
-- miembro actual/evento abierto, path/mime/size/cacheControl exactos.
-- UPDATE: ninguna policy cliente; upsert:false; objetos inmutables.
-- DELETE: legacy intacto OR reserva propia no publicada,
-- lock y guard de no files/claims/attachment/story/referencia.
-- files SELECT: legacy intacto sólo fuera r7 OR can_read_r7_media(storage_path).
```

`LEGACY_SELECT_SIN_CAMBIOS` representa el predicado exacto capturado en catalog.json; la migración futura lo expande literalmente, no es función ni identificador ejecutable. B1 helper de lectura R7 sólo reconoce chat asociado, inicialmente historias false; B4 agrega historias con `expires_at > server_now`. Auth null, path inválido o propósito desconocido devuelve false. Sin acceso owner a objeto huérfano; preview se hace con File local. `cacheControl:'no-store'`, GET sin cache, ninguna firma de medios R7. Galería/avatar conservan TTL60 ya existente.

**Gate de firma de Storage:** SELECT autoriza tanto sign como GET en muchas versiones. Catálogo B0 confirma `storage.allow_only_operation(text)` y `allow_any_operation(text[])` instalados (infraestructura adjunta), pero eso no prueba qué operación envía la API. B1 debe probar que operación real y helper distinguen `object.get_authenticated` de sign/list/transforms/signed URL, incluso uploader. Si sign elude policy, no habilitar lectura directa: revisión de contrato para gateway autenticado que streamee bytes y deje Storage SELECT R7 denegado para clientes, sin devolver URLs firmadas. No afirmar RF-R7-04 cumplido por ocultar `createSignedUrl` del frontend.

### Reserva/compensación como protocolo

`reserve_event_media_upload(p_event_id uuid,p_attempt_id uuid,p_file_id uuid,p_purpose text,p_mime_type text,p_size_bytes bigint) → jsonb {file_id,attempt_id,bucket_name,storage_path}`. Auth derivado; READ COMMITTED; evento→participación→reserva/path. Igual attempt+payload devuelve misma reserva, distinto payload conflicto; cierre o falta de membresía impide nueva reserva. File_id y attempt_id no autorizan por sí mismos. Reserva no es un borrador de evento ni crea messages/stories.

Cliente sube a path reservado con `upsert:false`; reintento 409 se verifica por servidor, no se toma como éxito ciego. Publicación crea files+claim+message/attachment o story en una TX; metadata se lee bajo lock coherente con Storage DELETE. Resultado incierto: conservar UUID y reconciliar, no borrar. Fallo SQL confirmado: puede solicitar liberar intento propio no publicado; fallback GC≥24h. No cancelar un intento cuya publicación podría haber confirmado sin verificarla.

GC reclama state deleting y lease bajo lock; publish rechaza deleting/deleted incluso si el objeto aún existe. Worker borra vía API Storage, nunca DELETE SQL de storage.objects. Tras 404 o eliminación efectiva, una TX verifica lease/ref exclusivas y elimina en orden story expirada→media_claim exclusivo→files; conserva media_uploads como tombstone deleted (sin FK inicial a files). No elimina references antes de confirmar el borrado físico: ante fallo conserva todo y reintenta, sin volver a published. Reconciliar Storage404 permite terminar tras un ACK perdido. Dos workers verifican token vigente antes ACK. Ningún DELETE de galería/chat/avatar registrado para limpiar historias.

## 3. B2: RPC chat v2 y compatibilidad

```text
send_event_chat_message_v2(p_event_id uuid,p_message_id uuid,p_body text DEFAULT NULL,p_file_id uuid DEFAULT NULL) → uuid
get_event_chat_messages_v2(p_event_id uuid,p_before_at timestamp DEFAULT NULL,p_before_id uuid DEFAULT NULL)
  → TABLE(id uuid,sender_id uuid,body text,created_at timestamp,display_name text,username text,
          attachment_id uuid,file_id uuid,bucket_name text,storage_path text,mime_type text,size_bytes bigint)
```

Retorno body nullable; attachment metadata null en mensaje sólo texto. No URL firmada. Orden/cursor/lookahead51 igual que v1, JOIN uno-a-uno evita duplicados; `get_event_chat` conserva header/state. RPC v1 y DM conservan firmas y texto-only; adaptar lectura v1 para no devolver body NULL. No nuevas overloads ambiguas ni DROP CASCADE.

Algoritmo envío completo: auth no null; READ COMMITTED; lock evento, autorización actual de conversación; buscar UUID existente y cotejar conversación+sender+body normalizado+file_id (idéntico→id aun cierre, otro→conflicto); para nueva fila verificar abierto con hora después del lock; confirmed bajo lock si no owner; body trim o NULL y límite2000; al menos body o file; si file, bloquear reserva/path/files en mismo orden y verificar dueño/evento/chat/objeto, no deleting ni claim ajeno; insertar message + attachment + claim; constraint trigger valida commit; sólo devolver id. Reintento después de pérdida de membresía no revela objeto: negar antes de reconciliar a cliente sin lectura. Idempotencia no permite leer mensajes ajenos usando UUID.

TS consumidor propuesto: `sendChatMessageV2({eventId,messageId,body:string|null,fileId:string|null}):Promise<string>`; `ChatMessageV2` equivale a fila RPC; reconciliación por UUID/Realtime siempre reconsulta v2 para metadata. Publication no añade attachments/keys ni cambia mensaje histórico. B3 conserva scroll/cursor/retry y descarta responses/Blobs al cambiar identidad.

## 4. B4: historias/TTL desde la primera versión

```sql
create table public.stories (
  id uuid primary key,
  event_id uuid not null references public.events(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  file_id uuid not null unique references public.files(id) on delete restrict,
  created_at timestamp without time zone not null,
  expires_at timestamp without time zone not null,
  check (expires_at = created_at + interval '24 hours')
);
alter table public.stories enable row level security;
revoke all on public.stories from public,anon,authenticated;
grant select on public.stories to authenticated;
create index stories_event_cursor on public.stories(event_id,created_at desc,id desc);
create index stories_expiry on public.stories(expires_at,id);
create index stories_author on public.stories(author_id);
```

Trigger servidor fija author=auth.uid(), created/expires desde una sola lectura de clock después locks; no aceptar fechas del cliente. Inmutables; cliente no UPDATE/DELETE. SELECT policy exige `can_read_event_chat(event_id)` y expires_at>hora actual; no fin normal en SELECT. Canceladas/archivadas: default de acta requiere ratificación. Storage aplica mismo predicado+operación GET, uploader sin excepción.

```text
publish_event_story(p_event_id uuid,p_story_id uuid,p_file_id uuid) → uuid
get_event_stories(p_event_id uuid,p_before_at timestamp DEFAULT NULL,p_before_id uuid DEFAULT NULL,p_limit integer DEFAULT 30) → jsonb
  {server_now,items:StoryV1[],next_cursor:{created_at,id}|null}
StoryV1={id,event_id,author_id,display_name,username,file_id,bucket_name,storage_path,mime_type,size_bytes,created_at,expires_at}
```

Publicación igual protocolo/locks de chat, UUID story idempotente y mismo payload, reserva purpose story. TTL no se reinicia por retry. Autoría visible usa proyección social segura vigente (bloqueo neutraliza identidad cuando corresponda) sin DOB/sex/contactos. Lista máximo50 y default30 con lookahead; orden descendente created/id, cursor ambas partes presentes o ambas NULL; B5 puede secuenciar cronológico dentro de página sin reordenar cursores. No máximo total de historias. Autorización ausente→error genérico, no lista vacía que simule ausencia; lista vacía autorizada→items[].

El visor usa server_now para estimar restante; antes de cada nueva descarga servidor decide. Pausa/local clock no extienden TTL; abortar fetch al desmontar, Blob revocado al expirar/ocultar/logout y timer server-offset. App no promete revocar bytes legítimamente descargados por el usuario. Rutas/entrada se cablean sólo B11; B5 exporta `EventStoriesEntry` y viewer sin tocar App/Detail.

## 5. B6: limpieza de historias y huérfanos

Nueva migración `*_r7_media_gc.sql` agrega a `media_uploads` índices/estados o tabla de trabajo si replay demuestra necesidad; no edita B1/B4. Selección: published story con expires_at<=server_now, o reserved sin asociación y antigüedad≥24h. Claim bajo lock comprueba todas las referencias files/claims/story/attachment/event_images/profiles, distingue historia exclusiva expirada de referencias legacy. Marca deleting en TX y conserva tombstone privado; elimina story expirada de lectura antes de limpieza física; no elimina eventos, mensajes ni historiales. File no se borra hasta liberar sus FK técnicas exclusivas; si aparece referencia cruzada→error/quarantine, jamás borrado forzado.

```text
claim_event_media_cleanup(p_limit integer DEFAULT 100) → jsonb[] {upload_id,bucket_name,storage_path,lease_token}
complete_event_media_cleanup(p_upload_id uuid,p_lease_token uuid) → void
fail_event_media_cleanup(p_upload_id uuid,p_lease_token uuid,p_error_code text) → void
```

RPC worker service-only, no PUBLIC/anon/authenticated EXECUTE; funciones privadas si no requieren Data API, wrappers públicos mínimos sólo service_role si Edge necesita REST. Parámetros de error allowlist sin texto de excepción/URL. Edge `r7-media-cleanup` autenticado server-to-server no disponible a usuarios. Cron15min propuesto, **no activado**; pg_cron/pg_net ausentes y requieren permiso de infraestructura. Cleanup retrasado no extiende TTL. Retención técnica tombstone7d propuesta; FK intacta si no se puede purgar de forma segura.

## 6. B9: subscriptions/preferencias/SW

```sql
create table public.push_subscriptions (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp without time zone not null,
  updated_at timestamp without time zone not null,
  disabled_at timestamp without time zone,
  check (length(endpoint) between 1 and 2048),
  check (length(p256dh) between 1 and 256),
  check (length(auth) between 1 and 256)
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public,anon,authenticated;
create index push_subscriptions_active_user on public.push_subscriptions(user_id,id) where disabled_at is null;
create table public.push_preferences (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  show_previews boolean not null,
  updated_at timestamp without time zone not null
);
alter table public.push_preferences enable row level security;
revoke all on public.push_preferences from public,anon,authenticated;
```

Se elige RPC owner-only en vez de SELECT de endpoint/keys; `push_preferences` adicional es propuesta justificada por preferencia de usuario multidispositivo, no campo demográfico ni permiso de negocio. SELECT de preferencias por RPC con auth.uid; mutaciones sólo RPC; no permitir PATCH user_id. Índices FK cubiertos. Private jobs no publican endpoints.

```text
upsert_my_push_subscription(p_id uuid,p_endpoint text,p_p256dh text,p_auth text) → uuid
get_my_push_settings() → jsonb {show_previews,subscriptions:[{id,created_at,updated_at,disabled_at}]}
disable_my_push_subscription(p_id uuid) → uuid
set_my_push_previews(p_show_previews boolean) → boolean
```

Upsert Auth server-side, lock por endpoint, identidad y payload validados; endpoint de otro owner→error genérico, nunca reasignación. Alta repetida propia idempotente; endpoint HTTPS/proveedor soportado, claves base64url con longitud decodificada65/16bytes y punto válido P256, límites aplicados antes I/O. No redirect ni destinos internos en worker. Baja propia idempotente mantiene inbox; no elimina notificaciones históricas. VAPID privada en secret Edge, pública permitida frontend. Preferencia inicial true **sólo tras** explicación y consentimiento opt-in, posibilidad de false desde el principio; no pedir permiso al montar.

SW elegido para revisión: `strategies:'injectManifest',srcDir:'src',filename:'sw.ts',registerType:'autoUpdate'`. Mantener manifest/start_url/scope `/`, globPatterns locales js/css/html/svg/png/woff2; usar precacheAndRoute(self.__WB_MANIFEST), cleanupOutdatedCaches y comportamiento de actualización equivalente (skipWaiting/clientsClaim y registro). Sin runtime caching de Supabase/media/map tiles; navegación de app shell como actual. No crear worker2 con scope competidor. Declarar workbox-* como dependencia directa sólo si fuente propia la importa y lock no garantiza declaración actual; justificar mínimo en B9, no agregar ahora.

Baseline lock: vite-plugin-pwa2.0.0, workbox-build/window7.4.1. SW generado inspeccionado en main ignorado: hash `ecdca1158e29833503e3c0856c26092c9ae506633363086376413292da3cff67`, precache/skipWaiting/clientsClaim sí, listeners push/click no; artefacto no reconstruido en B0. B9 exige build e inspección nuevos, install/offline/update y respuestas privadas fuera de cache. Settings exporta `PushSettings`; wiring Profile/App exclusivo B11. AuthProvider actual restaura getSession y verifica getUser, tiene retry/revision y logout limpia invite; no agregar suscripción automática ahí. Cambio de usuario desmonta providers y limpia datos; B9 debe resolver baja de endpoint anterior y cierre de notificaciones locales explícitamente.

## 7. B10: outbox y envío complementario

```sql
create table planit_private.push_jobs (
  notification_id uuid not null references public.notifications(id) on delete restrict,
  subscription_id uuid not null references public.push_subscriptions(id) on delete restrict,
  state text not null check (state in ('pending','processing','sent','failed','discarded')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  created_at timestamp without time zone not null,
  next_attempt_at timestamp without time zone not null,
  expires_at timestamp without time zone not null,
  lease_token uuid,
  lease_until timestamp without time zone,
  last_error_code text,
  primary key(notification_id,subscription_id),
  check (expires_at > created_at),
  check ((state = 'processing') = (lease_token is not null and lease_until is not null))
);
alter table planit_private.push_jobs enable row level security;
create index push_jobs_subscription on planit_private.push_jobs(subscription_id);
create index push_jobs_ready on planit_private.push_jobs(next_attempt_at,created_at) where state in ('pending','processing');
```

No payload privado persistido, ni endpoint/keys en job/log. Encolado AFTER INSERT notifications y backfill idempotente mediante UNIQUE(notification,subscription); excluir chat grupal, conservar tipos existentes DM/follow/event_full. En fallo de encolado no revertir aviso (subtransacción controlada con error operativo genérico); backfill cubre desde created_at de subscription, sólo ventana de entrega15min y no recrea jobs terminales durante esa ventana. Retención7d mantiene dedupe antes de purga. Worker no llama productores del aviso otra vez.

```text
enqueue_missing_push_jobs(p_limit integer DEFAULT 100) → integer
claim_push_jobs(p_limit integer DEFAULT 100) → jsonb[] {notification_id,subscription_id,lease_token}
get_push_job_delivery(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid) → jsonb
complete_push_job(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid) → void
fail_push_job(p_notification_id uuid,p_subscription_id uuid,p_lease_token uuid,p_error_code text) → void
```

Service-only ACL igual GC. Claim usa FOR UPDATE SKIP LOCKED y lease token60s; actualiza attempts y commit antes de red. Construir payload efímero al enviar, comprobar subscription activa y mismo destinatario, permiso de contenido y show_previews; endpoint validado, no redirect. 404/410 desactiva subscription y descarta sus jobs; 429/5xx/timeouts reintentan como D12, agotado/expired terminal; 2xx sólo proveedor aceptó, no prueba mostrado/leído. ACK exige lease token actual para no pisar worker nuevo. UNIQUE+tag reduce duplicados, no garantiza exactly once si proveedor aceptó y ACK se perdió.

Push wire v1: `{version:1,notification_id,recipient_id,title,body,target}`. Máximo title80/body120 caracteres Unicode (propuesto), campos texto plano/control limpio, target sólo ruta allowlist. SW usa tag notification_id, `event.waitUntil`, parse defensivo y payload inválido fallback genérico; click abre/focaliza mismo origin, consulta sesión/recipient y get_notification_target, sin URL externa. No keys/endpoint/tokens/invite/perfiles privados. Preview DM autorizado muestra remitente+fragmento; oculto/borrado/bloqueado/no autorizado→genérico. Aviso de pantalla bloqueada precede consentimiento. Logout no garantiza deshacer push ya entregado.

## 8. DTO de integración seguro y ownership

```ts
// Propuesta documental. No crear types duplicados todavía.
type EventIntegrationV1 = {
  id: string; title: string; starts_at: string; ends_at: string;
  location_name: string | null; address: string;
  visibility: 'public' | 'unlisted';
  state: 'open' | 'ended' | 'cancelled' | 'archived';
}
type IntegrationPermissionsV1 = {
  can_read_detail: boolean; can_read_stories: boolean;
  can_publish_story: boolean; can_manage_invite: boolean;
}
```

B11 construye DTO allowlist desde `loadEvent/EventRecord` autorizado; no pasa birth_date/sex/contactos/asistentes/conversation/keys/token con objeto completo. Booleans son UX, jamás autorización servidor. B7 `EventCalendarAction({event})`: sólo DTO; helper puro TZ Argentina→UTC/escaping/folding UTF8, ambos .ics/template Google. B8 `EventShareAction({event,canManageInvite,inviteUrl?})`: invite separado efímero proveniente diálogo owner, no fabricar grant ni persistir; sin token no compartir oculto hasta acción separada explícita. Origin de despliegue confiable HTTPS, no localhost en artefactos compartidos de producción.

B4 `storiesApi.ts` exporta lista/publicar/lectura; B5 `EventStoriesEntry({eventId,returnTo,permissions})` recibe retorno validado local, no URL arbitraria. B9 `PushSettings` maneja opt-in/previews/dispositivo. B11 importa entradas y routes; B5/B7/B8 no editan EventDetailPage ni App. B3 sólo adaptador chat/página chat. Ownership de migrations/Edge/SW es el del plan paralelo. Integrador humano no asignado; no inventar nombres de personas ni autorizar merges.

## 9. ACL, errores y validación transversal

Preferir INVOKER donde RLS permite contrato; DEFINER excepcional para reservar/publicar y lectura de metadata privada sin ampliar grants, con auth.uid validado, search_path='', nombres calificados y revocación PUBLIC/anon; EXECUTE sólo authenticated para RPC usuario. Helpers privados sin EXECUTE general salvo policy que lo requiera con guards y sin escape de datos; service wrappers sólo service_role. Grants/owner/policies se cotejan por firma completa, no nombre sin overload.

Errores propuestos: `42501 authentication_required/media_unavailable` sin revelar evento/usuario ajeno; `22023 invalid_media_parameters`; `P0001 event_read_only/invalid_image/media_conflict/upload_unavailable`; mapear a UX legible y retry incierto; no imprimir objeto de error con endpoint/token. Tamaño/MIME inválido falla sin fila publicada. Todos los SQL de este diseño, permisos negativos HTTP, sign/GET TTL, concurrencia/compensación, clientes calendario y Push físicos están **NOT RUN**. Firma humana y pruebas por bloque siguen siendo condiciones necesarias.
