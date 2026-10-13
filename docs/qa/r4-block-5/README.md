# R4 · Bloque 5 — Seguridad de eventos ocultos

13/10/2026 (Argentina). Base inmutable `dacd893` (`origin/main`, PR #43 integrada), rama `codex/r4-block-5`, [PR #44](https://github.com/EnzoG14/PlanIt/pull/44) en borrador. Implementado; QA humana y HTTP/JWT pendientes. Migración aplicada después de la autorización explícita del usuario (acta siguiente); sin merge, deploy de frontend, canje, generación de enlaces ni UX de visibilidad/autorizaciones. Bloques 6–9 pendientes. Las secciones originales conservan el alcance/evidencia de la entrega inicial local y quedan actualizadas por esta acta.

## Aplicación remota autorizada — 13/10/2026

El usuario solicitó «aplica las migraciones a la base remota». Se aplicó exclusivamente `20261014120003_hidden_event_access.sql` a `planit-v2` (`iepeqmvzjguwlhnecsdq`), con `--skip-vault`, sin seeds/roles ni proyecto histórico. Preflight: 21 versiones previas sincronizadas, una pendiente, cero eventos ocultos/confirmados ocultos existentes; dry-run y asesores revisados antes de aplicar.

**Verificación PASS:** 22 versiones sincronizadas y dry-run sin pendientes, RLS de ambas tablas nuevas/events, ACL sin hash SELECT ni mutaciones cliente, eliminación de la política histórica permisiva, índices/constraints/triggers y bucket privado inspeccionados. Los **11 cuerpos de funciones coinciden por hash con Git**, search_path vacío, sin EXECUTE anon; el trigger no tiene EXECUTE authenticated. Asesores antes/después: mismos 23 WARN, cero nuevos/ERROR (22 RPC DEFINER authenticated intencionales y protección de contraseñas filtradas deshabilitada preexistente).

Smoke remoto en transacciones read-only con ROLLBACK: authenticated sin identidad no lee events/grants/hashes ni summary; identidad SQL sintética lee una fila pública y sus RPC summary/organizer. **No JWT real ni datos persistidos de prueba**. Una primera versión del smoke llamó directamente a un helper privado y falló por USAGE intencionalmente revocado; se corrigió el test para usar las tablas/RPC públicas, sin ampliar permisos ni crear otra migración.

[Resumen](remote-migration-summary.json), [historial](remote-migrations.json), [metadata](remote-metadata.json), [consulta reproducible](remote-metadata.sql), [smoke sin identidad](remote-no-identity-results.json), [smoke público](remote-public-role-results.json), [asesores antes](remote-advisors-before.json) y [después](remote-advisors-after.json). Metadata/drift de objetos afectados, historial/dry-run y asesores ya no están NOT RUN; HTTP/JWT/Storage/Realtime reales y aceptación humana **siguen pendientes**. No se avanzó a bloque 6 ni se fusionó la PR.

## Contrato y fuentes inspeccionadas

Se leyeron prompt, plan, STATUS, decisiones A01–A07/D12/D14, arquitectura/modelo, 39 CA, instrucciones de raíz/src/supabase/diseño, PRODUCT/DESIGN, sidecar, integración visual, workflow y bloques Amanecer 3–7. Mockup `release-4.png` abierto como inventario histórico; apariencia Amanecer preservada. También se consultó en modo lectura el documento original [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit): especificación R4 y dominio H del modelo. El resumen local omitía las columnas de accesos; se completa sin cambiar el modelo original. R3 y sus migraciones de cierre/duplicación/asistentes/reincorporación están integradas; A07 no se reabre. Su brecha histórica de evidencia HTTP real/aceptación versionada permanece.

Referencias técnicas: [RLS y grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control). La consulta de `changelog.md` falló por formato/red; no se atribuye una verificación del changelog que no ocurrió. No se adoptan APIs nuevas de Supabase en este bloque.

## Migración e invariantes

`20261014120003_hidden_event_access.sql`: creada con CLI local como `20261013220021`, renombrada para ordenar después de las dependencias R4 ya versionadas `20261014120000–02`. Probada por replay completo en PostgreSQL efímero; **no aplicada remotamente**. Ninguna migración aplicada fue editada.

- `event_access_links`: columnas exactas del dominio H; hash SHA-256 hexadecimal único, UNIQUE parcial `event_id WHERE revoked_at IS NULL`, sin vencimiento, FK RESTRICT e índices. RLS activa desde creación; ningún cliente, ni siquiera dueño, recibe SELECT del hash. Sin RPC que lo proyecte.
- `event_access_grants`: columnas del dominio H, UNIQUE event/user, status active/revoked, fechas Argentina sin zona, checks de estado/cronología, trigger de updated_at. FK compuesta source_link/event impide atribuir a un grant un link de otro evento. SELECT propio o del dueño; sin INSERT/UPDATE/DELETE cliente.
- `planit_private.can_view_event(uuid)`: única decisión de detalle oculto = dueño o grant active. No acepta ID de usuario. Público sin cancelar/archivar conserva lectura autenticada; público histórico cancelado/archivado conserva dueño/participación histórica de R1–R3. Un revoked no limita la lectura pública ni se restaura por ella.
- Se reemplazan las dos políticas permisivas de events por una. La expresión autoriza al organizador directamente sobre la fila para que `INSERT RETURNING` funcione: un lookup STABLE no ve la fila NEW dentro del mismo comando. El permiso por grant sigue centralizado en el helper.
- Trigger interno `protect_event_visibility`, sin EXECUTE cliente ni RPC/UX nueva: public→unlisted toma locks evento→participaciones, rechaza confirmed+revoked antes de insertar y crea sólo grants faltantes, nunca restaura. unlisted→public invalida links activos (D12), conserva grants y participaciones. Falla posterior revierte grants/visibilidad conjuntamente. El bloque 6 deberá exponer la operación autorizada completa y sus mensajes; este trigger sólo impone la invariante de seguridad.
- Registro: público vigente mantiene errores y compatibilidad anteriores; oculto requiere grant active. READ COMMITTED, lock de evento, cupo, removed y trigger de historia conservados. Tener un hash/link en tablas no concede acceso al llamador.
- Reincorporación requiere acceso actual al pedir y grant active del destinatario al aprobar en ocultos; una solicitud pending anterior a revocación no evade la barrera. Rechazo por dueño después del cierre se conserva.
- Chat exige permiso de detalle **y** dueño/confirmed, en helper/RLS/header/mensajes y envío. Los revoked inconsistentes también se deniegan, aunque todavía tengan confirmed en fixtures.

## Inventario de rutas de datos

Firmas, ACL/search_path y políticas efectivas tras replay: [postgres-results.json](postgres-results.json), campos `inventory` y `policies`. No son metadata remota.

| Camino | Tratamiento / barrera final |
| --- | --- |
| `events` REST/joins | Política única, helper sin recursión y dueño directo para NEW |
| `get_event_participation_summary(uuid)` | Reemplazada, exige helper antes de proyectar cupo/status/estado |
| `get_event_organizer(uuid)` | Reemplazada, helper; sólo display_name/username |
| `get_my_rejoin_status(uuid)` | Reemplazada, helper; historial propio no habilita metadatos del evento |
| `get_my_events(text,integer)` | Invoker existente hereda RLS; recorrido de todas las páginas probado |
| `get_my_organized_events(text,integer)` | Invoker y filtro de dueño existentes |
| `get_event_duplicate_source(uuid)` | Invoker y dueño existentes; no hereda grants/links/media |
| `discover_public_events`, `get_home_events`, `search_public_events`, `get_suggested_events` | Invokers, exclusivamente public; probados también como dueño/active |
| `get_event_attendees(uuid,text,text,integer)` | Definer sólo dueño existente; un grant no abre nómina administrativa ni perfiles |
| `get_event_rejoin_requests(uuid,integer)`, `get_event_rejoin_resolution(uuid,uuid)` | Definers sólo dueño existentes, sin concesiones a grants |
| `get_event_chat(uuid)`, `get_event_chat_messages(uuid,timestamp,uuid)` | Definers existentes heredan helper de chat endurecido |
| `send_event_chat_message(uuid,uuid,text)` | Reemplazada, comprueba helper tras lock/membership incluso antes de retorno idempotente |
| `register_for_event(uuid)`, `leave_event(uuid)`, `request_rejoin(uuid)`, `resolve_rejoin(uuid,uuid,text)` | Reemplazadas; autorización antes de respuestas indirectas, lock de evento; no autoridad por token sin canje |
| `create_event(...)`, `update_event(...)` | Contratos existentes; alta sigue pública; sin UPDATE genérico de visibilidad |
| `cancel_event(uuid)`, `archive_event(uuid)`, `remove_participant(uuid,uuid)` | Definers sólo dueño existentes; historial/cupo conservados |
| `add_event_image`, `remove_event_image`, `reorder_event_images`, `get_event_unregistered_uploads` | Definers con lock_gallery/dueño existentes; nunca se amplían por grant |
| `event_images` → `events`; `files` → asociación visible/uploader; `storage.objects` → file visible/propietario | Políticas existentes heredan helper de events; nuevos SELECT después de revoked se deniegan para archivo ajeno exclusivo |
| `profiles`, `user_category_interests`, `set_my_category_interests` | Datos propios; ninguna lectura integral ajena ni columnas privadas nuevas |
| `event_participations`, `participation_history`, `event_rejoin_requests` REST | Auditoría propia conservada; no concede título, ubicación, media ni chat del oculto |
| `get_notification_target`, `get_notifications`, `get_notification_changes`, `mark_notification_read` | Invokers existentes; destino null tras pérdida de acceso; título/body ya entregados siguen siendo historial del destinatario, conforme contrato B0 |
| Helpers de triggers, `lock_gallery`, `can_delete_event_upload` | No retornan contenido de evento; owner/paths, ACL y search_path auditados |
| `public.rls_auto_enable()` | Scaffolding local explícito, versión real no definida por migraciones; EXECUTE público revocado por migración histórica; implementación remota no inspeccionada |

Los helpers DEFINER mínimos evitan ciclos events→grants→events y no exponen filas. Los DEFINER existentes conservan firmas/privilegios; nuevos tienen search_path vacío, referencias calificadas y EXECUTE sólo donde RLS lo requiere (authenticated para can_view_event, nadie cliente para trigger). El cliente no obtiene privilegios generales de escritura.

## Medios, memoria y PWA

APIs de detalle/galería/Mis eventos solicitan URLs de **60 s**, conservadoramente también para filas públicas en esas superficies. Feeds exclusivamente públicos mantienen 300 s. No hay cambios JSX/CSS, composición, rutas, dock, foco, scopes o tokens. La renovación ya existente en foco/retorno/reintento vuelve a pasar por RLS. Detalle se desmonta al cambiar usuario/token; listas/galería están separadas por identidad y las solicitudes tardías están descartadas. Chat limpia caché/canal ante error de autorización y revalida periódicamente.

`vite.config.ts` mantiene `runtimeCaching: []`; el SW generado sólo precachea artefactos estáticos de build, no REST/Auth/Storage. No se añade caché persistente privada. Detalle abierto no recibe una suscripción nueva de revocación en este bloque: revalida al volver/foco/reintentar; el panel de revocación y su invalidación pertenecen al bloque 8. No se afirma borrado inmediato de lo ya visto.

**Límites explícitos:** RLS deniega una **nueva** solicitud después de revocar; no invalida una URL ya emitida. URLs anteriores de 300 s conservan su plazo. 60 s es lo pedido por el frontend, **no un máximo impuesto al API de Storage**: un cliente autorizado podría pedir otra duración; imponer un máximo estricto requeriría emisión controlada del lado servidor y autorización adicional de ese diseño. Bytes descargados y caché HTTP del navegador/CDN no son recuperables por revocación. Un uploader legítimo o un archivo con otra asociación pública/autorizada sigue legible por esa otra razón; se oculta la asociación privada, no se promete exclusividad de bytes compartidos. No cambiar propiedad legítima de medios por este bloque.

## Evidencia y reproducción

[`postgres-results.json`](postgres-results.json): PostgreSQL real efímero, Auth/Storage SQL scaffolding y cuatro identidades ficticias A/B/C/D + anon. Se fuerza SET ROLE authenticated/anon para los asserts; admin sólo prepara fixtures/catálogos/fallos. Sin superusuario para demostrar RLS. 96 combinaciones × rutas directas/indirectas, público/oculto, open/cancelled/archived/ended, grant none/active/revoked y none/confirmed/cancelled/removed. Checks adicionales: sin identidad, hash/ACL/índices/FK, alta con RETURNING, feeds, A04/A05/D12, rollback forzado después de grants, public revoked→register→reocultar, R3 approval, shared file y cinco carreras con espera de locks comprobada en pg_stat_activity. Revocaciones fixture usan SQL admin bajo lock del evento: no se presentan como RPC/UI del bloque 8.

```powershell
# Dependencias de pruebas ya usadas por PlanIt: pg y @embedded-postgres/windows-x64.
# Ajustar PLANIT_TEST_TOOLS_DIR a su instalación local; no usa URL remota.
$env:PLANIT_TEST_TOOLS_DIR = '.participation-test-tools.local/node_modules'
npm run check:hidden-access
```

Build ejecutado como comandos equivalentes del script: `tsc -b` y `vite build`; lint con `oxlint`. Se reutilizaron dependencias instaladas del workspace, sin modificar lockfile ni agregar dependencias. Avisos previos de tamaño de chunks y lint permanecen. No se declara `npm ci` ejecutado. Las restricciones iniciales de loopback exigieron ejecutar pruebas locales fuera del sandbox; no implicaron red remota.

Regresiones en [regressions/results.json](regressions/results.json), salida por suite. R3 `check-rejoin` se actualiza para el contrato R4: histórico removed sin grant ya no puede ver/pedir reingreso en unlisted; con active sí. Los primeros fallos detectaron el caso INSERT RETURNING y compatibilidad de error público en registro, reparados antes de la pasada final. Discovery inicial carecía del PGlite local; se reutilizó la instalación de QA existente. No se sobrescribió evidencia histórica.

Visual: [visual/results.json](visual/results.json), seis pares de capturas de `dacd893` inmutable/implementación, detalle público/active/revoked en 375×812 y 1280×900. Auth/REST/Storage interceptados, WebSocket bloqueado, SVG ilustrativo de fixture. Muestran composición y TTL solicitado, **no** autorización real de Supabase. Sin reflow ni cambios de presentación; sin nueva decisión de foco/scope. No acredita dispositivo físico, lector de pantalla ni nuevos flujos de links.

### HTTP/JWT real — NOT RUN

`scripts/check-hidden-access-http.mjs` preparado, **no ejecutado contra remoto**: requiere migración y fixtures autorizados por separado. Primero verifica `/auth/v1/user` para que una denegación no sea meramente JWT vencido; luego UUID directo, RPC de lectura, hash y firma nueva Storage con A/B/C/D + anon. Sólo GET y POST de lectura/firma; nunca provisiona cuentas, migra, canjea ni muta datos de negocio. JWTs/publishable key sólo por entorno, sin salida de tokens/URLs firmadas. Ejecución: `node scripts/check-hidden-access-http.mjs --run`, con `PLANIT_HTTP_FIXTURES` (ruta a manifiesto), `PLANIT_HTTP_JWT_A/B/C/D` y `PLANIT_HTTP_PUBLISHABLE_KEY`.

El manifiesto debe contener `users: {A,B,C,D}` y `events: [{label,id,file_id,path,actors:{A:{detail:true,chat:true},B:{detail:true,chat:false},C:{detail:false,chat:false},D:{detail:false,chat:false},anon:{detail:false,chat:false}}}]`. Proveer fixtures separados para public/unlisted, estados de cierre, historical confirmed/removed, active/revoked y archivo exclusivo; `media` permite declarar la excepción compartida/propia. Todos los eventos deben tener imagen fixture para evitar falsos PASS por ausencia. Los tests de registro/rollback/concurrencia HTTP requieren autorización de escritura y se registran como pendientes; este runner deliberadamente no los ejecuta.

Storage HTTP real, Realtime real, asesores remotos, drift efectivo, `migration list` remoto y `db push --dry-run` remoto: **NOT RUN**. Son pasos previos a una eventual aprobación de despliegue, no permiso implícito para aplicar la migración. Los 15 CA de links/acceso/revocación siguen pendientes de sus bloques; esta evidencia sólo cubre sus prerrequisitos de seguridad. Ningún CA pasa a «Validado».

## Amenazas

| ID | Amenaza / resultado local o límite |
| --- | --- |
| H01 | UUID oculto conocido por ajeno: SELECT sin filas, RPC denegadas |
| H02 | Removed/cancelled histórico sin grant: sin detalle/media/summary/organizer |
| H03 | Confirmed inconsistente + revoked: sin detalle/chat, incluso reintento idempotente |
| H04 | Grant active sin confirmed: detalle sí, chat/asistentes/gestión no |
| H05 | Anon o authenticated sin auth.uid: sin contenido |
| H06 | Organizador: conserva gestión y lectura de estados históricos |
| H07 | Escritura REST de grants/links: denegada, identidad no elegible por cliente |
| H08 | Hash por REST incluso dueño: denegado; no token claro ni expiración inventada |
| H09 | Dos links activos/hash repetido: UNIQUE; FK impide source_link de otro evento |
| H10 | Participación histórica como política permisiva alternativa: eliminada |
| H11 | RPC DEFINER summary/organizer/rejoin elude RLS: exige predicado común |
| H12 | Retiro/pedido de rejoin como oracle de oculto: misma denegación genérica |
| H13 | Approval pending previo a revoke: falla sin modificar solicitud/historial |
| H14 | Registro oculto sin grant o con revoked: denegado bajo lock |
| H15 | Removed con active: no registra sin aprobación; historial no borrado |
| H16 | Última plaza concurrente: un confirmado; otro event_full |
| H17 | Revocación fixture concurrente con registro: espera evento, luego deniega |
| H18 | Rollback revocación fixture: registro espera y acepta estado previo intacto |
| H19 | Ocultar vs registro en ambos órdenes: deniega o preserva confirmed con active |
| H20 | public→unlisted con confirmed+revoked: conflicto atómico sin resurrección |
| H21 | Falla después de insertar grants al ocultar: rollback de grants y visibilidad |
| H22 | unlisted→public: vuelve lectura sin restaurar revoked; reocultar lo bloquea |
| H23 | D12 al volver público: revoca link activo, preserva grants/participación |
| H24 | Chat por tablas/header/mensajes/envío: helper y membership, sin ampliación por grant |
| H25 | Metadata media y nuevo SELECT Storage tras revoke: sin archivo ajeno exclusivo |
| H26 | URL firmada anterior/copia descargada: límite residual; frontend 60 s no es cap del API |
| H27 | Archivo propio/compartido: acceso legítimo por otra asociación, oculto no se revela |
| H28 | Feeds/mapa/búsqueda/sugerencias: sólo públicos aun con grant/dueño |
| H29 | Listado personal/histórico: hereda RLS en todas las páginas |
| H30 | Notificación previa: destino null, contenido entregado es historial propio |
| H31 | Recursión RLS/cross-account: helpers privados mínimos, auth.uid y FK/owner checks |
| H32 | Service Worker perpetúa payloads: sólo precache estático; runtimeCaching vacío |
| H33 | Estado en UI después de revoke: reconsulta en retorno/foco; no borrado remoto de memoria ya vista |
| H34 | Token válido/nuevo tras revoked, rotación/canje/restauración concurrentes: NOT RUN, bloques 6–8 sin implementar |
| H35 | JWT/Storage/Realtime real y manipulación HTTP: NOT RUN, runner y matriz preparados |

**Cierre:** base de seguridad implementada y probada localmente; revisión humana/HTTP real pendientes. No habilitar enlaces hasta revisar esta PR y completar sus bloques autorizados. Sin aceptación humana ni GO integral de R4.
