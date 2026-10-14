# Release 5 · Bloque 1 — Modelo social y frontera de seguridad

**Fecha:** 14/10/2026 (Argentina). **Base:** `da4379f58ba60ddfa4c3d03970103b381856996b`, `origin/main` actualizado, PR #50/B0 integrada. **Rama:** `codex/r5-block-1`. **Estado:** Implementado; QA pendiente. Sólo B1, sin pantallas ni integración de los bloques 2–9. PR para revisión, sin merge, aplicación remota ni deploy.

## Fuentes y decisiones

Se contrastaron plan/estado/paquete R5, auditoría B0, AGENTS raíz/src/Supabase, PRODUCT, DESIGN Amanecer, arquitectura/modelo y plan/estado/QA R3/R4. Nueva lectura de las tres secciones vigentes de [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit): 8 RF y [33 CA literales](../qa/r5-block-1/source.json), sin modificar Google Docs ni sus criterios. D04 sigue siendo decisión posterior pendiente de incorporación normativa con autorización separada.

La matriz de amenazas y autorización de B0 fue el contrato previo a SQL: perfiles propios íntegros, tres mínimos privados, bio/públicos sólo para audiencia ampliada, bloqueo bilateral, historial DM y chat grupal como excepciones. Se mantienen los mockups originales y Amanecer; [evidencia de integridad](../qa/r5-block-1/editorial.json). UI/accesibilidad/capturas de aplicación: NOT RUN, porque B1 no cambia UI.

El responsable resolvió en este chat los dos conflictos abiertos de producto:

- **C02 aprobado:** «Ocultar en perfiles/listas sociales; conservar permisos R4». Eventos/grants, descubrimiento y chat grupal conservan su autorización independiente; la proyección social de eventos niega bloqueos y nunca retorna `unlisted`, incluso si el actor tiene grant.
- **C03 aprobado:** «Aceptar URLs firmadas de hasta 60 segundos». Bucket privado y firma social en servidor con TTL fijo 60, sin nuevas firmas a contraparte bloqueada. URLs entregadas anteriormente y bytes descargados conservan la ventana/limitación aprobada.
- **C01 aplicado conforme a D01 y al alcance autorizado de B1:** organizador oculto bajo bloqueo; asistentes/reingresos/grants administrativos muestran `Perfil no disponible` y username vacío. Conservan IDs operativos, estados, cupos y facultades R3/R4; búsqueda/orden no usan nombres ocultos. No se inventa una excepción administrativa de identidad social.
- D06: se extienden `conversations/messages`, sin tablas duplicadas. D07: RPC social separada de administración. D08: nuevo catálogo remoto read-only coincide con las 25 migraciones históricas y 55 funciones; R3/R4 integradas. Sus aceptaciones históricas no se modifican.

`.env.local` fue copiado byte a byte desde `mapbox-worktree`, checkout de `main`, y permanece ignorado/no versionado. Checkout inicial y demás worktrees preservados. No se imprimieron claves, provisionaron cuentas remotas, configuraron secretos ni consultó el proyecto histórico.

## Migraciones y persistencia

Las tres migraciones se generaron con `supabase migration new`; las 25 históricas están intactas:

| Migración | Cambio | Creada | Probada local | Aplicada remota | Verificada remota |
| --- | --- | --- | --- | --- | --- |
| `20261014133225_social_security_model.sql` | follows/blocks, constraints/FK/índices/RLS/ACL, privacidad/follow/block/DM y proyección de perfil | Sí | PASS | No, no autorizada | No |
| `20261014133547_social_projections_and_avatars.sql` | consultas paginadas, gate social, bucket/avatar, firmas sólo servidor, destino de notificación | Sí | PASS | No, no autorizada | No |
| `20261014133847_social_legacy_projections.sql` | C01 en cuatro proyecciones existentes, mismas firmas y permisos | Sí | PASS | No, no autorizada | No |

`user_follows`: PK dirigida follower/followed, no-self, pending/accepted/rejected, generación UUID, requested/responded con coherencia de estado/cronología. `user_blocks`: PK dirigida blocker/blocked, no-self. FK RESTRICT, fechas propias sin zona Argentina; RLS desde creación. SELECT directo follows sólo a cualquiera de sus extremos; blocks sólo al bloqueador. Sin INSERT/UPDATE/DELETE cliente.

`conversations`: event/direct excluyentes, event conserva event_id UNIQUE y pareja nula; direct tiene event_id nulo, dos profiles FK RESTRICT, pareja ordenada low < high y UNIQUE. IDs/historial/event trigger/messages/índice de cursor/notifications FK preservados. RLS event usa el mismo helper R4; direct sólo low/high, sin negar historial por bloqueo. `messages` mantiene RLS que delega a conversación, payload e índice servidor+UUID; sin grants de escritura ni cambios de publicación Realtime.

`profiles`: SELECT íntegro sigue sólo propio. Se revoca UPDATE directo de visibility; el resto de columnas propias conserva contrato previo. Avatar no tiene UPDATE cliente. RPC controla owner/purpose antes de vincular `files` de bucket `avatars`, nunca galería. Un guard de migración aborta con `legacy_avatar_requires_review` si existen referencias de avatar antiguas a event_media/otro dueño: cualquier reparación de datos requiere revisión separada, sin copias ni borrados automáticos.

## Contratos de API y privilegios

Todas las RPC cliente tienen EXECUTE sólo authenticated, `search_path=''`, identidad `auth.uid()` y nombres/objetos calificados. No overloads. DEFINER justificado para operaciones atómicas sin escritura genérica o allowlists de terceros sin SELECT profiles; consultas de mensajes/bandeja son INVOKER y heredan RLS. Uso del esquema privado sólo authenticated, sin CREATE; lock/helper de triggers no ejecutables por clientes. Helpers de lectura ejecutables son relativos exclusivamente al viewer, sin parámetro de actor.

| RPC / firma | Resultado y autorización |
| --- | --- |
| `get_social_profile(uuid)` | jsonb. Ajeno mínimo exactamente display_name/username/avatar; público/accepted/self añade bio. Bloqueado/inexistente `{unavailable:true}` sin identidad. Avatar es referencia de usuario, sin file_id/path/URL; demográficos jamás retornados |
| `get_social_relationship(uuid)` | Control de interacción separado: visibility/follow propio. Bloqueado/inexistente unavailable + blocked_by_me; permite desbloquear propia arista sin consultar perfil |
| `get_social_profile_events(uuid,timestamp=null,uuid=null,integer=30)` | jsonb events/next_cursor. Sólo audiencia ampliada; sólo organizados públicos no cancelados/archivados y vigentes, nunca ocultos |
| `get_event_social_participants(uuid,uuid=null,integer=30)` | participants/next_cursor; user_id/nombre/username/avatar, sólo confirmed; exige detalle R4 + dueño/confirmed. Bloqueados filtrados antes de LIMIT; sin administración |
| `update_my_social_profile(text,text,text,text,date,text,text,text)` | Parámetros username/display_name/first_name/last_name/birth_date/sex/bio/visibility. Sólo self; retorna visibility/accepted_requests. Constraints/triggers vigentes validan campos; D04 atómico |
| `set_my_avatar(text)` | UUID file propio; null retira referencia. Valida objeto existente/owner/MIME/tamaño y bucket; idempotente. Retiene archivos ya registrados y avatar anterior si falla |
| `follow_user(uuid)` | status/request_version propios; public accepted, private pending; activo idempotente; rejected renueva generación inmediatamente. Sin self/bloqueo |
| `unfollow_user(uuid)` | void, sólo arista propia, idempotente; revoca acceso derivado |
| `resolve_follow_request(uuid,uuid,text)` | follower/version/accepted o rejected; sólo seguido y generación actual. Reintento misma resolución retorna estado, opuesta falla; versión vieja jamás resuelve solicitud nueva |
| `list_follow_requests(timestamp=null,uuid=null,integer=30)` | requests/next_cursor; sólo pendientes propias, generación/nombre/username/avatar; filtra bloqueos antes de paginar |
| `list_social_follows(uuid,text,uuid=null,integer=30)` | users/next_cursor, followers/following sólo accepted; gate audiencia ampliada. Bloqueos de viewer/dueño filtrados antes de paginar |
| `get_social_counts(uuid)` | followers/following accepted, sobre mismo filtro de audiencia/listas; ningún total global de bloqueados |
| `get_or_create_direct_conversation(uuid)` | UUID canónico; cualquier autenticado distinto, sin follow; bloqueo niega apertura/reapertura por esta acción. Historial existente se abre por lectura separada |
| `send_direct_message(uuid,uuid,text)` | UUID mensaje; miembro y no bloqueado, trim Unicode/texto 1–2000, server clock. Mismo UUID/conversación/autor/body retorna efecto anterior; reutilización distinta falla. Retry de efecto anterior puede confirmarse bajo bloqueo posterior, sin insertar mensaje nuevo |
| `get_direct_messages(uuid,timestamp=null,uuid=null,integer=30)` | messages/next_cursor; sólo miembro incluso bloqueado; id/sender_id/body/created_at, sin join de perfiles |
| `list_direct_conversations(timestamp=null,uuid=null,integer=30)` | conversaciones/next_cursor por creación servidor+UUID; id/created_at/peer_id/read_only, sin identidad social. UI de B8 puede combinar consulta de perfil autorizada |
| `block_user(uuid)` / `unblock_user(uuid)` | void. Crear propia arista + borrar follows bilaterales atómicamente; desbloquear sólo propia arista; no restaurar follows ni borrar DM |
| `get_social_avatar_for_signing(uuid,uuid)` | Path o null, **sólo service_role**, jamás cliente. Viewer verificado por Auth en gateway; bloqueo bilateral y propietario/finalidad del archivo comprobados |

Listas limit 1–50, default 30, lookahead y cursor completo validado; permisos reevaluados en cada llamada. `/messages` y resto de rutas aún no se habilitan. `get_notification_target` discrimina kind event: una referencia DM devuelve null, sin fabricar `/events/null/chat` ni agregar productores/notificaciones DM fuera de alcance.

## Autorización y amenazas

| Superficie / columnas | Dueño | Confirmado | Tercero / grant-only | Bloqueado | Anon |
| --- | --- | --- | --- | --- | --- |
| profiles íntegro / demográficos | Sólo self | Sólo self | Sólo self | Sólo self | Denegado |
| perfil mínimo / nombre username avatar | Social sin bloqueo | Social sin bloqueo | Sin ampliación por evento/grant | unavailable bilateral | Denegado |
| bio/eventos públicos/contadores/listas | Self | Sólo public/accepted | Sólo public/accepted | Denegado | Denegado |
| participantes sociales / identidad mínima | Organizador + detalle | confirmed + detalle | Denegado | Omitido de la lista del viewer | Denegado |
| administración R3/R4 / IDs operativos | Organizador | Denegado | Denegado | Nombre neutro, facultad intacta | Denegado |
| DM / cuerpo autor instante | Miembro | No por evento | Sólo miembro | Historial sí, nuevo envío no | Denegado |
| Storage avatar / metadata objeto | Owner | No por evento | Sin SELECT/sign directo | Sin nueva firma social | Denegado |
| chat grupal evento | Contrato R4 | Contrato R4 | Denegado sin confirmed | Contrato R4 sin cambios | Denegado |

Amenazas verificadas localmente: SELECT/PATCH/INSERT/DELETE directo con roles; actor/sender forjado; self-follow/block/DM; fuga de perfiles completos/contadores; grant-only; aceptación obsoleta; duplicación de pareja/mensaje; block vs follow/send/privacy; avatar ajeno/galería/staging; firma larga elegida por cliente; permisos retirados durante firma. La prueba SQL usa SET ROLE, no superusuario como prueba de RLS. Escrituras administrativas sólo crean fixtures en la base efímera.

## Transacciones y concurrencia

Todas las mutaciones sociales exigen READ COMMITTED. Por pareja: perfiles UUID ascendente `FOR NO KEY UPDATE` antes de relaciones/conversación/mensaje. Lock sobre perfiles existentes cubre parejas sin relación; KEY SHARE de FK compatible. Privacidad bloquea sólo self antes de modificar perfil/aceptar pendientes; no toma después locks de perfiles de todos los seguidores, evitando inversión. Follow/block/resolve deben esperar self y releer estado. Conversión sólo UPDATE de pending actuales no bloqueados: rejected/accepted y filas borradas intactos.

Bloquear inserta arista y borra ambas relaciones en la misma transacción. Una operación que ganó el lock puede confirmar antes del bloqueo; la que esperó debe observarlo y negar una nueva acción. UUID de mensaje confirma un efecto anterior tras pérdida de respuesta, no una escritura nueva bajo bloqueo. No se adquieren locks de evento/cupo desde mutaciones sociales.

Avatar: perfil propio → advisory lock de bucket/path → registro files → referencia. DELETE staging usa el mismo lock de objeto y relee files tras esperar; archivo registrado no se borra aunque se reemplace/retire avatar. Sin UPDATE/upsert Storage.

## Firma de avatar y límites de despliegue

Storage SELECT permite solicitar firmas con expiry elegido por cliente ([documentación oficial](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)). Por eso terceros **no** reciben policy SELECT sobre avatars ni `files` metadata. La Edge Function `social-avatar` necesita la credencial server-only ya provista por el runtime Supabase: consulta `/auth/v1/user` con bearer, deriva viewer de respuesta verificada, invoca RPC exclusiva de servicio y firma bucket/path del servidor con `expiresIn:60`. Reconsulta autorización después de firmar, no devuelve URL si hubo bloqueo/cambio de avatar. Cliente sólo envía user_id; body no controla viewer/path/bucket/TTL. Respuestas no-store, errores neutros, timeout 10 s por petición, sin logs de contenido/token/secretos y sin dependencias nuevas.

`verify_jwt=true` preserva también la comprobación de plataforma; el handler valida Auth independientemente ([guía oficial](https://supabase.com/docs/guides/functions/auth)). Usuarios pueden leer/firmar sus propios uploads y compartir voluntariamente sus bytes: la restricción de 60 s se impone a la **entrega social a terceros** por gateway; no promete controlar redistribución por el propietario. Bloqueo posterior a la última autorización conserva hasta 60 s residuales del token emitido. La expiración real de Storage requiere prueba de transporte luego del deploy autorizado.

El [CDN de Storage](https://supabase.com/docs/guides/storage/cdn/smart-cdn) tiene TTL de caché independiente del token: registro/vinculación de avatares exige metadata cacheControl exactamente `max-age=0`, `no-cache` o `no-store`, rechazando el default SDK de una hora. B4 debe cargar con `cacheControl:'0'` (o header REST no-store), sin copy/update del objeto; verificar headers efectivos y expiración CDN en QA remoto antes de aceptación. El scaffold prueba la regla de registro, no el comportamiento del CDN. No se altera caché de event_media ni R4.

**No se desplegó la función ni se configuraron secretos.** No ejecutar db push/deploy ahora. Antes de autorización remota: revisar preflight de avatares antiguos, `migration list`, dry-run y advisors; ejecutar las tres migraciones como entrega revisada y desplegar gateway con aprobación separada. Verificar SQL remoto/HTTP JWT A/B/C/D, firma/expiración/bloqueo Storage y payload Realtime. Activar consumidores de UI sólo en su bloque aprobado. El lector de avatar del perfil propio R2 aún usa su contrato heredado; su integración con avatars/gateway corresponde B4, sin habilitar cargas desde B1.

## Pruebas, archivos y revisión

[Evidencia y comandos reproducibles](../qa/r5-block-1/README.md), [SQL local](../qa/r5-block-1/sql-results.json), [13 regresiones](../qa/r5-block-1/regressions.json), [gateway unitario](../qa/r5-block-1/avatar-unit.json). SQL PASS: 72 combinaciones de audiencia ajena, invariantes/RLS/ACL, D04 0/1/N y rollback, listas/paginación/contadores, DM/idempotencia, C01/C02 y 13 carreras con wait_event_type=Lock observado, sin deadlock. PostgreSQL local **18.4** vs remoto **17.11**; Auth/Storage scaffold SQL, sin stack Supabase completo. Unit gateway transpila handler real pero simula fetch, sin Deno/Storage/Auth reales.

13 suites existentes PASS: profile/chat/notifications/interests/hidden-access/event-links/invite/event-access/gallery/attendees/rejoin/event-actions/edit-event. Se agregó sólo el rol de scaffold service_role a ocho runners que no lo tenían; fixture de avatar de profile usa bucket/RPC R5 en lugar de asignar un file de event_media. No se cambiaron expectativas/CA de negocio ni evidencia histórica. Runner de regresión redirige evidencias a B1.

`npm ci`, build y lint PASS; build conserva aviso de chunks grandes, lint avisos previos. Typecheck estricto del handler PASS. La primera suite detectó falta de USAGE de esquema privado para invoker; se corrigió y repitió completa. No se atribuyen los 33 CA a PASS integral: falta interfaz/HTTP JWT/transporte remoto/aceptación; [matriz](../qa/RELEASE_5_ACCEPTANCE.md) conserva NOT RUN y enlaza verificaciones parciales de seguridad.

Archivos de producto: tres migraciones, config.toml y dos fuentes Edge. Verificación: tres runners R5, ajustes de scaffold de ocho runners existentes y scripts npm. Seguimiento: este contrato, STATUS, plan/decisiones/resumen, matriz de aceptación, arquitectura/modelo y directorio nuevo `docs/qa/r5-block-1/`. Lista exacta y SHA de contenido en editorial/SQL/regresiones. **Frontend, estilos y mockups intactos.**

Revisar allowlists/ACL, orden de locks, guard de legacy avatars, gateway server-only y limitaciones de evidencia antes de aprobar la PR/aplicación remota. Detenerse aquí: B2 permanece pendiente de aprobación expresa.
