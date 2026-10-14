# Release 5 · Bloque 0 — Auditoría y contratos

**Corte:** 14/10/2026, Argentina. **Base:** `1b77b377e0a335f70bb7458be74122e1de70b43f` (`origin/main`, PR #49 integrada). **Rama:** `codex/r5-block-0`. **Estado:** Implementado; QA pendiente de revisión humana del informe. Entrega exclusivamente de auditoría/documentación: ninguna funcionalidad R5 habilitada, ningún CA declarado PASS y ninguna migración nueva. No avanzar a B1 sin aprobación.

**Entrega:** [PR #50 en borrador](https://github.com/EnzoG14/PlanIt/pull/50), sin fusionar. Revisar C01–C03 y los contratos técnicos antes de autorizar B1.

## 1. Fuentes, entorno y autorización

Se leyeron AGENTS raíz/src/Supabase/diseño, PRODUCT, DESIGN Amanecer, arquitectura/modelo, planes/estados R3/R4, QA y aceptación R4, todos los documentos/prompts R5 y las tres secciones vigentes del [Google Doc original](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit). Se consultaron las guías Supabase, Postgres y Google Drive. Los **8 RF y 33 CA** están presentes en la fuente vigente, incluido R5-08; no usar las releases históricas ni la nota posterior del documento que todavía describe un catálogo anterior de 46 RF. [33 textos literales y hash de lectura](../qa/r5-block-0/source.json). La matriz local contiene resúmenes operativos: se compararon IDs, no se afirmó equivalencia literal de esos resúmenes.

El pedido autoriza rama, auditoría, documentación de seguimiento y PR. Se preservó el checkout inicial con cambios ajenos; se creó un worktree desde `origin/main` actualizado. `.env.local` se copió byte a byte desde `mapbox-worktree`, checkout de `main`, y está ignorado. No se imprimieron ni versionaron claves. **El proyecto histórico no se consultó.**

Lectura remota únicamente en `planit-v2` (`iepeqmvzjguwlhnecsdq`): catálogo/versiones/configuración mediante CLI y transacción `BEGIN READ ONLY … ROLLBACK`, sin filas de perfiles, eventos o mensajes. Se verificaron además cinco denegaciones HTTP **sin sesión**, usando sólo la clave pública de la app. No se provisionaron cuentas ni fixtures remotos, no hubo JWT funcional A/B/C/D, DDL remoto, deploy, merge ni edición de Google Docs. El CLI inicializa su rol de login de plataforma; eso no constituye aplicación de migraciones ni mutación de datos de negocio.

## 2. Dependencias reales y D08

- Git confirma PR R3 #18–#25, refresh Amanecer #27–#34 y R4 #38, #39, #41–#48 integradas en la historia de `main`; #40 es configuración del servidor de desarrollo. PR #49 incorpora el paquete R5.
- **25 versiones SQL** coinciden con Git, incluida la migración inicial vacía aplicada; última `20261014120006_event_access_management`. No se modificó ninguna migración histórica.
- Remoto: **14 tablas públicas, todas con RLS; ninguna vista pública/privada en el inventario**, sin `user_follows`, `user_blocks`, tablas directas ni RPC social R5. Las referencias de `docs/database.md` a follows/blocks son modelo objetivo, no objetos existentes.
- Replay local de esas mismas 25 migraciones en PostgreSQL **18.4** efímero con scaffold Auth/Storage; remoto **17.11**: **55 funciones coinciden en cuerpo, ACL y configuración**, normalizando sólo CRLF→LF. No se afirma prueba en la misma versión mayor. Se excluye `rls_auto_enable`, scaffold de plataforma. [Inventario](../qa/r5-block-0/catalog.json), [comparación](../qa/r5-block-0/comparison.json).
- `planit_private.can_view_event(uuid)` existe; en `unlisted` requiere dueño o grant `active`. `planit_private.can_read_event_chat(uuid)` exige además dueño o participación `confirmed`. Conocer el enlace, tener grant o seguir al organizador no equivale a estar confirmado. La fila `event_participations` y el grant tienen estados independientes.
- R4/B9 y sus 39 CA están **Validados por aceptación humana** según acta versionada. Sus pruebas HTTP JWT/Storage/Realtime funcionales por el agente conservan NOT RUN. R3 conserva la confirmación del responsable registrada por R4/A07 y la brecha histórica de trazabilidad; no se reabre su aceptación.

**D08 resuelta técnicamente:** dependencias Git/catálogo disponibles. Gate futuro: volver a comparar SHA, versiones y helpers antes de B1 y de cada consumidor; resolver los conflictos transversales de la sección 8 antes de activar bloqueos. No confundir esta disponibilidad con PASS de RF-R5-01.

## 3. Mapa de módulos y rutas

| Módulo actual | Contrato observado | Extensión futura mínima |
| --- | --- | --- |
| `src/App.tsx`, `components/AppLayout.tsx` | Rutas protegidas, lazy loading, dock Inicio/Mapa/Mis eventos/Perfil; scopes Amanecer social/gestión; foco por ruta y altura visual de chat | `/users/:id`, `/me/edit`, `/me/follow-requests`, `/users/:id/followers`, `/users/:id/following`, `/messages`, `/messages/:conversationId`; RequireAuth, scopes y retorno explícitos, sin quinto tab |
| `pages/ProfilePage.tsx`, `profile.css` | `/me`, lectura propia de display_name/username/bio/avatar_file_id, email desde sesión propia, placeholder; refresco al foco, estado por identidad/token | Reusar perfil propio; API social separada en `features/social/`, formulario local sin recrear R2 ni exponer email a terceros |
| `pages/EventAttendeesPage.tsx`, `features/events/attendees.ts` | `/events/:id/attendees`: administración sólo dueño, confirmed/removed, búsqueda, offset30, remoción por RPC; no enlaces a perfiles | Reusar entrada/ruta y componentes de lista con modo social separado; confirmado sólo consulta social, jamás obtiene removidos/solicitudes/acciones administrativas |
| `pages/EventDetailPage.tsx`, `features/events/participation.ts` | Summary autoritativo y revalidación de ocultos; dueño tiene entrada administrativa | Entrada social para dueño/confirmed, revalidar al abrir y ante retiro/revocación |
| `pages/EventChatPage.tsx`, `features/events/chat.ts` | Chat de evento con autorización/estado, mensajes paginados, UUID idempotente y limpieza por sesión/revocación | Reusar patrones de compositor/errores; servicios y estado DM separados, sin cambiar permisos del chat grupal |
| `features/notifications/`, `get_notification_target` | Destino por conversación asume evento; `notifications.conversation_id` referencia conversations | Discriminar `kind='event'` antes de construir ruta; no introducir notificaciones DM ni productores R5 fuera de alcance |
| `features/events/{api,gallery,access,invite}.ts` | Signed media de evento, grants y canje específicos R4 | No usar un grant como permiso social; avatar con contrato propio y sin reutilizar objeto de galería |
| `styles/{tokens,amanecer,social}.css`, componentes compartidos | Tokens `--pi-*`, ScreenHeader, FormField, StatusMessage, Icon, diálogos y patrones Amanecer | Estilos scoped y componentes comunes; no paleta/UI kit nuevos |

Rutas ajenas por UUID estable para que un cambio de username no rompa enlaces; username es dato de presentación, no autoridad. IDs mínimos para navegación/autorización, nunca como credencial. Al visitar ID propio, redirigir `/me`. Conservar origen de evento/lista y retorno seguro; no confiar en `location.state` para permisos. Las rutas aquí listadas **no existen todavía** y no se crean vacías en B0.

## 4. Contratos existentes: firmas, proyecciones y permisos

Todas las firmas remotas, defaults, resultados, ACL, hashes, columnas, constraints, índices, triggers, políticas, buckets y publicación están en [catalog.json](../qa/r5-block-0/catalog.json). Las RPC siguientes tienen EXECUTE sólo `authenticated`, `search_path=''`; salvo donde se indica son DEFINER con autorización en cuerpo, no SELECT general de profiles.

| API real | Resultado / actor | Reuso y riesgo |
| --- | --- | --- |
| `get_event_attendees(p_event_id uuid, p_status text='confirmed', p_search text='', p_offset integer=0) → jsonb` | Sólo dueño. title/capacity/event_state, confirmed_count/removed_count/pending_count/has_more; filas participation_id/user_id/status/display_name/username | No ampliar esta RPC a confirmed: filtraría administración R3. Último cuerpo viene de migración de reingresos R3 |
| `remove_participant(uuid, uuid) → void` | Sólo dueño, evento vigente; lock evento→participación e historial | Mantener firma y facultad; identificador de participación no autoriza por sí solo |
| `get_event_organizer(p_event_id uuid) → TABLE(display_name text, username text)` | Cualquier autenticado con `can_view_event`; sin control de privacidad/bloqueo | Proyección heredada mínima, debe revisarse con D01; no es perfil social completo |
| `get_event_chat(uuid) → TABLE(conversation_id uuid,title text,event_state text)` | Dueño/confirmed y detalle autorizado R4 | Helper de lectura grupal vigente, no sirve para lista administrativa |
| `get_event_chat_messages(uuid,timestamp=null,uuid=null) → TABLE(id,sender_id,body,created_at,display_name,username)` | Mismo permiso grupal; cursor completo, 51 filas máximo | Excepción grupal D01: nombres del chat permanecen; no resolverlos llamando RPC social bloqueada |
| `send_event_chat_message(uuid,uuid,text) → uuid` | Remitente auth.uid; READ COMMITTED, evento→participación, texto 1–2000, retry por UUID | No usarla para DM ni ampliar permisos por seguir/grant |
| `get_event_access_grants(uuid,text='active',uuid=null,integer=30) → jsonb` | Sólo dueño de oculto; title/event_state/grants/next_cursor; filas id/user_id/status/username/display_name/avatar_url(null)/is_confirmed | Identidad administrativa R4 sin comprobación de bloqueo; conflicto D01 |
| `get_event_rejoin_requests(uuid,integer=0) → jsonb` | Sólo dueño; request_id/participation_id/status/requested_at/display_name/username más resumen de evento | Conflicto D01 en proyección, no concederla al confirmado |
| `redeem_event_link(p_token text) → uuid` | Autenticado, grant persistente active, sin inscribir; revocado no recanjea | No ejecutado con token real en B0; no habilita social/chat |
| `get_event_participation_summary(uuid) → TABLE(confirmed_count,capacity,available_spots,own_status,is_organizer,event_state)` | Autenticado con detalle autorizado | Tiene ocupación del evento, no contadores de perfil; lectura sola no prueba permiso social |

`profiles` tiene PK/FK auth.users RESTRICT, username UNIQUE lowercase 3–24, display_name 2–60 trim, bio ≤500, public/private, demográficos opcionales y timestamps Argentina. SELECT íntegro está limitado por RLS a `auth.uid()=id`; UPDATE por columnas username/display_name/first_name/last_name/birth_date/sex/bio/**visibility**, propietario y WITH CHECK propio. No hay grant de UPDATE avatar_file_id. **La escritura directa de visibility es una vía real que B1 debe cerrar o proteger transaccionalmente para cumplir D04**, incluso sin formulario frontend.

`files` sólo acepta `event_media`, JPEG/PNG/WebP, 1–5 MiB, path prefijado por uploaded_by y metadata validada contra Storage. `profiles.avatar_file_id → files.id` RESTRICT existe, pero no valida por sí misma dueño/uso avatar. `files` se lee por uploader o asociación con imagen visible de evento; no hay permiso social de avatar. Único bucket `event_media`, privado, 5 MiB, tres MIME; insert propio, select autorizado y delete de staging controlado, sin upsert genérico. `/me` intenta firma de 300 s sólo para archivo propio en ese bucket: **fallback de lectura, no flujo de carga/cambio de avatar implementado**.

Realtime publica `messages` y `notifications`, no `profiles`, follows, blocks, grants ni Storage. Payload messages: id/conversation_id/sender_id/body/created_at; notificaciones incluye actor_id y contexto de evento. RLS restringe audiencia, pero la configuración de publicación no demuestra transporte real ni reconexión segura. Auditar cualquier futura ampliación social sin publicar perfiles completos ni estados de bloqueo a terceros. SW/PWA actual no configura caché privada de Supabase; B0 no ejecutó pruebas de caché.

## 5. Matriz de identidad, autorización y amenazas

Identidades **conceptuales, no cuentas remotas creadas:** A organiza E, B confirmed en E y con grant activo si E es oculto, C grant activo en oculto sin confirmed, D ajeno; anon sin sesión. Ownership de evento **no implica** ownership de perfil, follow ni pertenencia DM. Removed/cancelled no equivalen a confirmed. Los 96 cruces A/B/C/D × public/private × none/pending/accepted/rejected × sin bloqueo/saliente/entrante y las filas propias/anónimas están en [authorization-matrix.csv](../qa/r5-block-0/authorization-matrix.csv): contrato objetivo, **NOT RUN**, no resultados de RLS.

| Recurso | A | B | C | D | anon |
| --- | --- | --- | --- | --- | --- |
| Detalle E oculto | Sí dueño | Sí si grant active | Sí grant active | No | No |
| Lista social E | Sí | Sí confirmed + can_view_event | No | No | No |
| Administración asistentes/remoción/reingresos/grants | Sí según operación y estado E | No | No | No | No |
| profiles íntegro | Sólo perfil propio | Sólo propio | Sólo propio | Sólo propio | No |
| Perfil ajeno social | Regla de audiencia siguiente | Igual | Igual: grant no amplía perfil | Igual | No |
| DM previo | Sólo miembro | Sólo miembro | Sólo miembro | Sólo miembro | No |

Audiencia de perfil ajeno: public/no bloqueo → display_name/username/avatar/bio y eventos públicos vigentes; private/no accepted → **sólo display_name/username/avatar**; private/accepted → esos tres + bio + eventos públicos vigentes. Nunca first_name/last_name/birth_date/sex/email/intereses privados/grants. Pending, rejected y relación inexistente tienen la misma proyección mínima. Bloqueo en cualquiera de los sentidos → respuesta neutra `unavailable`, sin identidad, avatar, bio, eventos ni contadores sociales. El target solicitado se conserva únicamente como contexto del llamador, no como metadato devuelto.

Contadores/listas sociales: filtrar bloqueos bilateralmente **antes** de contar, ordenar, buscar y paginar; no enseñar total global que permita inferir cuentas ocultas. En perfil privado sin accepted, no mostrar contadores ni listas como cuarto dato. Counts y listas sólo para audiencias ampliadas/propio y sobre accepted; pending/rejected sólo consultas propias autorizadas. El estado de seguimiento propio y las capacidades son control de interacción, no columnas del perfil; endpoint separado si es necesario para mantener la proyección de tres campos. En listas de participantes sociales omitir perfiles bloqueados, sin huecos ni identidades; `has_more` se calcula sobre visibles. No usar la ocupación de E como total social de usuarios visibles.

| Amenaza | Superficie y actor | Control objetivo / verificación futura |
| --- | --- | --- |
| SELECT privado/IDOR | REST profiles, A consulta B o anon | Mantener own-row RLS; RPC con auth.uid y allowlist de campos; B1 SQL + HTTP JWT real |
| Link-only enumera participantes | C usa misma URL/RPC que B | can_view_event AND (organizador OR confirmed); denegar antes de paginar incluso vacío; B1/B2 |
| Bloqueo salteado por RPC antigua | A/B consultan organizador/asistentes/grants/reingresos | Resolver sección8, no ocultar sólo botones; probar REST/RPC directo y búsquedas |
| Cambiar visibilidad por PATCH | Propietario escribe profiles.visibility | Revocar grant directo de visibility y centralizar RPC, o trigger equivalente con locks; B1/B4 |
| Perfil privado salteado por archivo | C adivina file_id/path o usa objeto de galería | Avatar separado, policy de lectura por audiencia/bloqueo, sin URL pública ni owner metadata social; B1/B4 |
| Privilegios DEFINER | Anon/tercero invoca función/helper | PUBLIC/anon revocados; schema privado sin USAGE anon/PUBLIC, helpers mínimos authenticated según RLS; search_path vacío, auth.uid y autorización en cuerpo |
| Doble solicitud/resolución | A repite follow; dueño resuelve dos veces | UNIQUE dirigido + generación/version de pending en resolve, locks y condición de estado; B6/B7 |
| DM duplicado/envío tras bloqueo | A→B y B→A; send compite con block | Par canónico UNIQUE, locks comunes, deduplicar UUID de mensaje, validación bajo transacción; B1/B8/B9 |
| Lectura DM por tercero | D llama conversationId o abre canal | RLS miembro independiente de bloqueo para historial; nuevos envíos condicionados; B8 |
| Sesión/caché obsoleta | Cambio de cuenta/accepted/confirmed/visibility/block | Invalidar respuestas/canales/media, reconsultar servidor al foco y tras mutación; polling si no canal seguro; sin cachear respuestas privadas |

## 6. D01–D08 y modelo técnico congelado para revisión

| Decisión | Estado en B0 | Contrato |
| --- | --- | --- |
| D01 | Aprobada previamente; conflictos de integración identificados | Perfil no disponible bilateral; conservar DM histórico y chat de evento. No inventar excepción administrativa |
| D02 | Aprobada previamente | Tres mínimos; accepted añade sólo bio y públicos; propio mantiene datos privados autorizados |
| D03 | Aprobada previamente | DM sin follow, no self, bloqueo impide crear/enviar; una conversación por pareja |
| D04 | Aprobada previamente; falta actualización normativa separada | RPC propia atómica private→public + todos pending válidos→accepted; cerrar PATCH directo; aviso antes de guardar |
| D05 | Aprobada previamente | Bandeja contextual `/messages`, acceso desde `/me` y perfil ajeno, dock de cuatro destinos |
| D06 | Resuelta técnicamente para revisión de PR | **Extender conversations/messages existentes**, no crear direct_conversations/direct_messages; no duplicar almacenamiento |
| D07 | Resuelta técnicamente para revisión de PR | Reusar ruta/entrada asistentes y separar RPC social de administrativa; el conflicto D01 sobre proyecciones heredadas requiere revisión |
| D08 | Resuelta técnicamente; catálogo/Git PASS | R3/R4 disponibles, gate de conflictos D01 y reconfirmación por bloque; no nuevas pruebas funcionales acreditadas |

**D06:** `conversations.kind` hoy CHECK sólo event y event_id NOT NULL UNIQUE. Nueva migración incremental deberá permitir event/direct con CHECK excluyente: event requiere event_id y pareja nula; direct requiere event_id nulo y dos FK profiles RESTRICT ordenadas (`user_low_id < user_high_id`), UNIQUE par canónico. Conservar UNIQUE event_id, UUIDs/historial/FK `notifications.conversation_id`, trigger de creación por evento y todos los índices relevantes. `messages` ya es sólo texto y tiene sender/clock servidor/índice `(conversation_id,created_at DESC,id DESC)`; reutilizarlo. No hay adjuntos/columnas R7 existentes que impidan la separación.

RLS conversations tendrá ramas explícitas: event por helper R4 actual; direct por miembro low/high, **sin check de bloqueo para leer**. messages hereda pertenencia por conversación. Sin grants genéricos de INSERT/UPDATE/DELETE. Creación/envío DM por RPC auth.uid con guard de bloqueo bajo lock; lectura de historial y listados de DM previos continúa para miembros bloqueados, con cabecera neutral que no solicite proyección social. Terceros denegados. APIs/canales de evento permanecen acotados por event_id/conversation_id, y `get_notification_target` debe verificar kind para evitar `/events/null/chat`; no agregar productores DM por inferencia. La extensión sólo es aceptable tras regresión positiva/negativa R2/R3/R4 y prueba de payload Realtime en B1/B8.

**Avatar:** propuesta técnica de B1/B4: reusar files y avatar_file_id con **bucket privado de avatar independiente**, MIME/tamaño5 MiB máximos actuales, objeto inmutable prefijado por auth.uid, validación de dueño y finalidad antes de vincular, sin upsert ni grant de UPDATE avatar_file_id al navegador. No asociar un avatar a event_images: esa asociación abriría su lectura por permisos de evento. Nueva policy no debe convertir event_media en bucket social. Nueva RPC valida metadata/propiedad, cambia referencia atómicamente; carga fallida conserva avatar anterior y staging se reconcilia sin borrar referencias. TTL corto limita reutilización de URLs ya firmadas, pero **no cumple revocación instantánea de bytes**; ver conflicto sección8.

## 7. Contratos RPC nuevos propuestos (no existentes/no desplegados)

Firmas objetivo para B1, a materializar y probar sólo tras aprobación del siguiente bloque. Actor derivado de auth.uid; IDs de destino nunca autorizan; EXECUTE authenticated, PUBLIC/anon revocados, helper interno privado. DEFINER justificado sólo para proyección/operaciones sin permisos genéricos de escritura; search_path vacío y SQL calificado. No agregar overloads ambiguos.

| API propuesta | Parámetros / respuesta mínima | Permiso |
| --- | --- | --- |
| `get_event_social_participants` | `p_event_id uuid,p_after_user_id uuid=null,p_limit integer=30` → jsonb `{participants:[{user_id,display_name,username,avatar}],next_cursor}`; sólo confirmed, orden UUID, limit 1–50 | Dueño o confirmed + can_view_event, sin removidos ni administration IDs |
| `get_social_profile` | `p_user_id uuid` → jsonb `unavailable` o proyección allowlist; eventos/relaciones por llamadas separadas | Autenticado; nivel public/minimal/accepted; self usa contrato propio |
| `get_social_profile_events` | `p_user_id uuid,p_before_starts_at timestamp=null,p_before_id uuid=null,p_limit integer=30` → tarjetas públicas vigentes con cursor | Revalidar audiencia ampliada + bloqueo + public + estado; nunca unlisted aunque el actor tenga grant |
| `update_my_social_profile` | `p_username text,p_display_name text,p_first_name text,p_last_name text,p_birth_date date,p_sex text,p_bio text,p_visibility text` → perfil propio/resultado de conversión | Sólo propio, transacción D04; avatar por operación propia separada para reconciliar Storage |
| `follow_user` / `unfollow_user` | `p_target_id uuid` → estado propio de relación | No self/bloqueo; public accepted, private pending; unfollow elimina relación y permiso |
| `list_follow_requests` | `p_after_requested_at timestamp=null,p_after_follower_id uuid=null,p_limit integer=30` → pending propias/version/identidad autorizada | Sólo destinatario; sin perfiles bloqueados; cursor estable |
| `resolve_follow_request` | `p_follower_id uuid,p_request_version uuid,p_decision text` (accepted/rejected) → estado de esa generación | Sólo seguido, pending y misma generación; impedir que reintento de rechazo resuelva solicitud nueva |
| `list_social_follows` | `p_user_id uuid,p_direction text,p_after_user_id uuid=null,p_limit integer=30` → proyecciones autorizadas | Perfil ampliado/propio, sólo accepted y bloqueos filtrados respecto de viewer y dueño de lista |
| `get_or_create_direct_conversation` | `p_target_id uuid` → conversation_id único | No self, sin bloqueo, no requiere follow |
| `list_direct_conversations` / `get_direct_messages` | Cursor servidor+UUID, limit 1–50; historial y preview mínimo sin proyección bloqueada | Sólo low/high, bloqueo no quita historial; no exponerlo a tercero |
| `send_direct_message` | `p_conversation_id uuid,p_message_id uuid,p_body text` → message_id | Miembro auth.uid, sin bloqueo; UUID retry y texto 1–2000 como patrón existente, sin archivos |
| `block_user` / `unblock_user` | `p_target_id uuid` → estado de bloqueo **propio** | No self; sólo blocker quita su arista; sin restore de follows; no borrar DM |

`request_version uuid` es token opaco de generación, no credencial: UNIQUE(follower_id,followed_id) conserva una fila; al renovar rejected→pending se renueva versión, requested_at y responded_at. No reintentar una mutación con timeout como si hubiese fracasado: releer estado/generación o buscar message_id antes de repetir. Los nombres y respuestas auxiliares de listas DM deben documentarse con firma final en B1, no presentarse como catálogo real en B0.

### Locking propuesto para D04 y operaciones sociales

Propuesta basada en [orden consistente de locks PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS), **sin pruebas de concurrencia R5 ejecutadas en B0**:

1. Todas las mutaciones sociales usan READ COMMITTED y una disciplina única. Operaciones por pareja (follow/unfollow/resolve/block/unblock/createDM/send) toman filas profiles de los dos usuarios en orden UUID ascendente con `FOR NO KEY UPDATE`, antes de relaciones y conversación. Esto serializa también parejas sin follow/DM todavía, evitando depender de locks de filas inexistentes; FKs pueden conservar KEY SHARE sin hacer ciclos artificiales. Ninguna RPC debe tomar relación/conversación antes del perfil.
2. `update_my_social_profile` toma **sólo su perfil** primero, valida y actualiza; private→public convierte pending dirigidas válidas con filtro NOT EXISTS bloqueo bilateral en la misma transacción, manteniendo rejected/accepted y filas borradas intactas. **No** adquirir después perfiles de todos los seguidores: podría invertir el orden global. Dado que follow/block/resolve esperan ese perfil antes de tocar relaciones, no hay inserción pending concurrente mientras ocurre conversión. Tras esperar, follow relee visibility y crea accepted si es público.
3. Orden posterior estable: follows/bloqueos por pareja, conversación, mensaje. Block registra arista dirigida y elimina ambas relaciones en la misma transacción; block que gana hace fallar send/follow, send que ganó puede confirmar antes de block, nunca después como operación nueva autorizada. Unblock sólo quita arista propia; bloqueo inverso permanece vigente. Ninguna operación social adquiere locks de evento/cupo.
4. Cerrar UPDATE directo de visibility (y cualquier escritura social alternativa) en B1; no alcanza con ordenar locks en RPC si REST sigue cambiando privacidad. Opción mínima: revocar UPDATE visibility, RPC propia única; cualquier nuevo trigger debe revisarse por orden/rollback. R4 `set_my_category_interests` bloquea perfil→categorías y no entra en relaciones sociales: probar espera/regresión, no modificar su contrato por defecto.
5. Conversión no inserta relaciones, no acepta rejected ni restaura bloqueadas; repetir con perfil ya public no cuenta otra conversión. Error en username/avatar vinculación/cambio/aceptación revierte toda la operación de BD; Storage upload separado se reconcilia. No capturar excepciones convirtiéndolas en éxito parcial.
6. Pruebas obligatorias B1/B4/B6/B7/B8/B9: 0/1/N pending, rejected, bloqueos ambos sentidos, cambio repetido, dos cambios concurrentes, follow/resolve/block/send simultáneos, rollback inyectado, reintento tras timeout, sesión vencida, UUID duplicado y API PATCH directa. Comprobar waits reales y ausencia de deadlock; el presente razonamiento no los acredita.

## 8. Conflictos que requieren revisión antes de implementar

| ID | Conflicto RF/CA/decisión vs contratos actuales | Propuesta concreta y autorización requerida |
| --- | --- | --- |
| C01 | D01 prohíbe proyección social bilateral; RPC get_event_organizer, get_event_attendees, get_event_rejoin_requests y get_event_access_grants devuelven nombres sin blocker. Excepciones aprobadas sólo DM histórico/chat grupal | Proteger todas esas proyecciones bajo bloqueo con datos neutros; administración conserva sólo IDs operativos necesarios y facultades R3/R4. Evitar búsqueda/orden por nombres ocultos. **Revisión humana del alcance transversal antes de B1**; no asumir excepción administrativa |
| C02 | D01 dice no retornar eventos de contraparte por API directa; R4 y events RLS exponen públicos a cualquier autenticado y grant activo/confirmed conserva ocultos | Propuesta: ocultar asociación/listas de eventos en perfil y proyecciones sociales; conservar autorización de evento independiente R4 y chat. **Esta interpretación requiere decisión expresa**, porque aplicada literalmente D01 exigiría cambios a events/discover/search/suggested/media y contradiría accesos R4 aceptados. No implementar ni declarar resuelto el conflicto |
| C03 | D01 avatar retirado bajo bloqueo vs firmas Storage ya emitidas y bytes en caché | Bucket privado y policy bilateral impiden nuevas lecturas/firmas; TTL breve no invalida las ya emitidas, como documenta [Storage privado](https://supabase.com/docs/guides/storage/serving/downloads). Antes de B1 aprobar ventana residual o diseñar entrega autenticada sin URL bearer reutilizable; ninguna duración está aprobada aquí. Bytes ya descargados no se pueden retirar |
| C04 | D04 autoaceptación no aparece en RF/CA técnico original; PATCH visibility hoy permitido | Mantener 33 CA sin renumerar; agregar pruebas D04 y centralizar escritura. Google Docs sólo con autorización separada; esta PR no lo edita |
| C05 | Tabla de autorización del plan §4 todavía dice privado bloqueado «mínimo o no accesible, decisión pendiente» | D01 ya aprobado prevalece: no disponible y cero proyección. Se corrige esa celda documental en esta PR sin modificar la decisión |
| C06 | Mockup muestra intereses públicos, fotos/eventos asistidos, toggles Mostrar eventos/Permitir mensajes, presencia online, audio/llamada, adjuntos y favoritos | Mantener recorridos de los cinco paneles; omitir funciones no autorizadas. D02 permite sólo eventos públicos **organizados** (especificación organizer_id), no asistencia/intereses privados. D03 no permite toggle arbitrario que restrinja DM sin bloqueo |

El informe cierra la auditoría aunque no resuelve por cuenta propia conflictos de producto. **B1 queda sujeto a revisión de C01–C03 y aprobación explícita del siguiente bloque**; D06–D08 son conclusiones técnicas revisables, no permiso para desplegarlas.

## 9. Mockup original, Amanecer y accesibilidad

Se abrió visualmente [release-5.png](../design/mockups/release-5.png), SHA en evidencia. No se editó, recortó ni sustituyó. Es referencia funcional de cinco paneles, no captura de aplicación ejecutada. Se respeta el sistema aprobado DESIGN Amanecer, sin reintroducir fondo marino/CTA degradado del collage.

| Panel original | Correspondencia autorizada | Diferencia contractual |
| --- | --- | --- |
| Usuarios/asistentes | Lista social por evento, identidad mínima y navegación; administración separada | Confirmed/dueño, no grant-only; sin biografía privada ni presencia inventada; perfil bloqueado omitido |
| Perfil público | Avatar/nombre/username/bio pública, follows y mensaje, eventos públicos | Sin fotos de portada arbitrarias/intereses públicos/favoritos; eventos organizados autorizados, counts según audiencia |
| Editar perfil | Datos propios, avatar y privacidad; intereses ya viven `/me/interests` R4 | Sin toggles nuevos Mostrar eventos/Permitir mensajes; aviso D04 antes de confirmar; bio límite real500, no150 del dibujo |
| Perfil privado | Tres mínimos + Solicitar; accepted añade bio/públicos | Copia no promete fotos ni eventos ocultos; bloqueo reemplaza por «Perfil no disponible» sin avatar |
| Mensajes privados | Texto, historial, compositor, bloqueo sólo lectura y regreso | Sin llamadas/micrófono/imágenes/audio/estado online/confirmación de lectura inventada; dock sin tab nuevo |

B2–B9 deben capturar app real en 320/360/375/390/768/1280, estados loading/empty/error/retry, focus visible, Escape/retorno del diálogo, objetivos ≥44 px, texto ampliado 200%, altura baja/teclado, safe areas, reduced-motion/transparency y fallback de avatar/fuente. Reusar tokens Bricolage autoalojada, foco 3 px y StatusMessage. **B0 no alteró UI y no ejecutó responsive, lector de pantalla, dispositivo físico ni screenshots de app**; no marcar accesibilidad PASS por inspeccionar el mockup.

## 10. Resultados, archivos y gate de salida

| Verificación nueva | Resultado | Límite |
| --- | --- | --- |
| Git/base/dependencias y env ignorado | PASS auditoría | Sin merge; no aceptación funcional R5 |
| Fuente Google Docs 8 RF/33 CA | PASS lectura/IDs | Sin edición; D04 sigue decisión posterior |
| Catálogo remoto read-only | PASS | No pruebas de operaciones con identidades de usuario |
| Replay local de 25 migraciones y 55 funciones vs remoto | PASS catálogo | Auth/Storage scaffold, no stack Supabase completo ni fixtures de negocio |
| HTTP directo anon: profiles/conversations/messages/get_event_attendees/get_event_chat | PASS denegación 401/42501, 5/5 | No JWT real A/B/C/D; no escenarios sociales R5 implementados |
| 33 CA oficiales + casos D01–D05 | **NOT RUN** | Auditoría no implementa ni acredita CA |
| Concurrencia R5/Storage/Realtime/UI/regresiones funcionales/build/lint | **NOT RUN** | Sin cambios de frontend ni DDL R5; reglas build/lint para frontend no se disparan |
| Diff/JSON/enlaces/alcance documental | Resultado en [evidencia](../qa/r5-block-0/README.md) | Checks editoriales, no tests funcionales |

Archivos de esta entrega: este informe; seguimiento `RELEASE_5_STATUS.md`; plan/decisiones con D06–D08 enlazadas y celda obsoleta corregida; matriz `docs/qa/RELEASE_5_ACCEPTANCE.md` con referencias de auditoría y CA NOT RUN; `docs/qa/r5-block-0/` con fuente literal, inventario, comparación, matriz objetivo, consulta read-only, runners de auditoría y evidencia. **Migraciones nuevas: ninguna; probadas local R5: ninguna; aplicadas remotas R5: ninguna/no autorizada; verificadas remotas R5: ninguna.** El replay/catálogo de migraciones existentes se reporta por separado.

Revisión humana: verificar D06 reuso, D07 separación, locks D04 y C01–C03, confirmar límites de evidencia y autorizar B1 cuando corresponda. La PR se deja abierta para revisión, sin fusionar ni continuar bloques.
