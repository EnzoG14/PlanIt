# R7 · Bloque 4 — Publicación y consulta segura de historias

16/10/2026, Argentina. **IMPLEMENTADO / migración remota autorizada aplicada. QA HTTP real pendiente.** Ver actualización remota al final; los gates anteriores describen la entrega inicial.

Entrega técnica `1fcd3f510918b8c204e088069c6e5ae9fe1fc9bf`, [PR draft #83](https://github.com/EnzoG14/PlanIt/pull/83). La PR no autoriza merge, pasos remotos ni el siguiente bloque.

Base tras `git fetch origin`: `b7a3e6a31f328ec375c4dcee1f3923720b42e697`, rama `codex/r7-block-4`, worktree `r7-block-4-worktree`. Prerequisitos integrados: B0 #74, B1 #75 (`3f2a498`), B2 #78 (`cc4e70e`), B3 #79 y correctivas #82. El seguimiento global conserva cortes históricos: este reporte registra B4; B11 consolida `RELEASE_7_STATUS.md` conforme al ownership.

## Decisiones y alcance

El pedido de implementar B4 autoriza código, pruebas locales y PR; no aplicación remota ni deploy. Se leyeron prompt/plan/estado/contratos/acta B0, decisiones, ownership, RF/CA y QA R7; instrucciones raíz/src/Supabase/diseño, documentación de producto/técnica/diseño y cierre R6. El mockup original `docs/design/mockups/release-7.png` fue inspeccionado y conservado. No se cambia UI, estilos, `EventDetailPage.tsx`, `src/App.tsx`, SW ni configuración PWA.

**Confirmación humana de este chat, 16/10/2026:** ante la pregunta de conservar historias al cancelar/archivar hasta 24 horas, siempre que el usuario siga siendo organizador/confirmado y conserve los permisos existentes del evento, el responsable respondió: **«Sí, conservar hasta 24 horas con esos permisos»**. Resuelve el pendiente explícito del acta B0 para B4. No se atribuye una firma general del acta ni permiso para otro bloque.

D01 (JPEG/PNG/WebP, 5 MiB, una foto), D03 (24h desde publicación, incluso fin normal), D04 (vencida inaccesible, limpieza física posterior B6), D10 (sin firmas, servidor autoriza cada descarga), D13 (reservas/claims y UUID inmutables), D15 (sin cuota total de historias), D17 (API aislada) y ownership aplicados. R6 se conserva como baseline aceptada, sin abrir sus pendientes.

## Entrega y contrato para B5/B6

- Nueva migración `20261016193248_r7_stories.sql`: tabla `stories`, RLS desde creación, FKs RESTRICT, CHECK exacto de 24h, índices evento/cursor, vencimiento y autor; sin DML cliente. Trigger de inserción deriva autor y ambas fechas de una sola lectura de reloj servidor AR después de los locks. UPDATE de historias es inmutable.
- `publish_event_story(p_event_id,p_story_id,p_file_id) → uuid`: firma real congelada en B0, usando la reserva B1 en lugar de aceptar paths arbitrarios del cliente. Orden evento → participación → reserva → advisory path → objeto → files/claim/story. Confirma bytes previamente validados por Edge y objeto id/eTag. Una transacción registra archivo, claim exclusivo y story. Igual UUID+payload confirma commit previo sin cambiar fechas; distinto payload/autor/archivo produce conflicto neutral. El retry autorizado puede confirmar el commit tras cierre o vencimiento, **sin rehabilitar lectura ni renovar TTL**. Se deniega antes al perder membresía/acceso.
- `get_event_stories(event_id,before_at?,before_id?,limit=30) → {server_now,items,next_cursor}`: default 30, máximo 50, lookahead y cursor `(created_at,id)` descendente; evento solicitado y permiso servidor, vacío autorizado `items:[]`, acceso ajeno error genérico. Retorna metadatos/path y proyección social acotada, sin datos demográficos/contactos. Bloqueo bilateral neutraliza nombre/username siguiendo R5. No se crea un alias redundante `list_event_stories`.
- Extensiones nuevas de `register_r7_media`, `check_r7_file`, `check_r7_claim_trigger` y `can_read_r7_media`: preservan chat B1/B2 y agregan story con referencia bidireccional, owner/event/purpose concordantes y TTL de servidor. Trigger diferido de stories impide dejar un claim publicado huérfano. Galería y adjuntos no pueden reutilizar esos archivos.
- Storage conserva sus dos policies SELECT disjuntas por bucket. Su rama R7 sigue GET-only con el helper existente; no se agrega otra policy permisiva ni excepción para uploader. `files` y `stories` también niegan vencidas. TTL no depende del scheduler ni de borrar el objeto.
- API `src/features/events/storiesApi.ts`: tipos StoryPage/EventStory/StoryCursor, publicación con ACK exacto y errores tipados (incluye resultado incierto), consulta abortable y descarga Blob autenticada/no-store. Usa `createMediaAttempt(file,eventId,'story')` + `uploadEventMedia` de B1 para subir/validar; no duplica el pipeline de subida, no publica optimistamente ni borra tras timeout. B5 debe conservar IDs y reconciliar antes de retransmitir, descartar respuestas al cambiar sesión/ruta y revocar Blob URLs.

### Descarga real y compatibilidad con B3

La corrección integrada #82 documenta que la API Storage real no permitió el GET autenticado directo pese a la policy operation-aware; el fallback por contexto de request fue revertido. Por eso B4 incluye el lector aislado **`supabase/functions/r7-story-image/`**, siguiendo `r7-chat-image` y sin modificarlo. Es lógica de servidor necesaria para servir bytes privados con la integración vigente, no un nuevo backend.

`GET ?story_id=<uuid>` valida Auth.getUser, deriva viewer sin aceptar identidad/path del navegador y consulta la nueva RPC **service-only** `get_r7_story_image_target(viewer_id,story_id)`. Descarga acotada, verifica SHA-256 y vuelve a consultar autorización/TTL/id/eTag después de I/O. Si vence o pierde permiso entre consultas, no devuelve bytes. Respuestas y fetch son no-store; sin URLs públicas/firmadas, redirects ni logs de contenido/credenciales. Todas las funciones DEFINER usan `search_path=''` y nombres calificados; EXECUTE anon/PUBLIC revocado y grants mínimos. El helper privado con viewer explícito no tiene EXECUTE cliente.

**No está desplegado.** B5 debe consumir este lector después de autorizar migración/deploy y validar transporte real. La descarga directa de historias permanece cerrada si el Storage desplegado no informa la operación GET; no se relaja el gate de firmas para hacerla funcionar. El filtro de tabla/RPC/lector se aplica aunque GC no corra. Como en B0, no se pueden retirar bytes que el usuario ya descargó legítimamente.

## Evidencia por capa y criterio

| Capa/caso | Estado | Evidencia y límites |
|---|---|---|
| Replay | PASS local | 45 archivos de migración desde cero en PostgreSQL 18.4 real; [hashes/resultados](sql/sql-results.json). Remoto histórico 17.11, sin afirmar paridad de versión mayor. |
| R7-B4-TC-01 | PASS SQL local | A organizer/B confirmed publican; C pending/D removed/E link-only/F tercero/missing JWT/anon denegados. Fin/cancelación/archivo impiden nuevas publicaciones; cierre concurrente gana lock. |
| R7-B4-TC-02 | PASS SQL local | Separación entre eventos, retiro del autor, grant oculto revocado, lector service-only, matriz tables/files/Storage; operación Storage es scaffold SQL, no transporte. |
| R7-B4-TC-03 | PASS SQL local | Autor/created_at/expires_at de servidor y diferencia exacta 24h; no parámetros de reloj/autor cliente. Fixture administrativo cambia tiempos sólo en DB temporal para probar acceso a T+23:59:59 y denegación a partir de T+24h. |
| R7-B4-TC-04 | PASS SQL local | Retry simultáneo/reconexión, payload/autor/file alternativo, colisión UUID global entre eventos, exclusividad chat/galería, aislamiento READ COMMITTED, rollback final, metadata/objeto inválido/no verificado. |
| Integridad/ACL | PASS SQL local | Referencias inversas, DML cliente denegado, UPDATE inmutable, índices/RLS/ACL/search_path; [inventario](sql/inventory.json). |
| API TS | PASS unitario | [3 grupos](client/results.json), Supabase/fetch simulados: ACK, retry/errores, cursor/abort, aislamiento de evento, descarga/sesión. |
| Lector Edge | PASS unitario | [3 grupos](edge/edge-results.json): handler TS real con stubs HTTP, SHA/tamaño/path, Auth, revalidación tras I/O (denegación de target por TTL/remoción), errores sin filtrar datos. No despliegue ni JWT real. |
| Tipado Edge | PASS local | `deno check` del entrypoint con Deno 2.9.6; sin dependencia externa nueva. |
| Regresión B2 | PASS SQL local | [9 grupos](regression-chat/sql-results.json) sobre las 45 migraciones, v1/v2/DM, notificación única, NULL DM/imagen direct rechazada, cursores, concurrencia, rollback y privilegios. |
| Pipeline B1 cliente | PASS unitario | [2 grupos](regression-media/client-results.json), límites/MIME/magic/decode, retry/upload no-store/409/validación; decoder y API simulados. |
| Build / lint | PASS | `npm run build`, `npm run lint`, `git diff --check`; warnings heredados de scripts de diseño/DiscoveryFilters y chunk Mapbox. SW injectManifest conserva 86 entradas; no acredita offline/Push. |
| HTTP/JWT, Storage real GET/sign/list/HEAD/transform y frontera temporal desplegada | NOT RUN / gate | Suite opt-in preparada, sin fixtures/JWT remotos ni migración/deploy autorizados. No promover los stubs a aceptación. |
| UI 320/375/390/768/1280, navegación, SW offline, Push físico, E2E R1–R6 | NOT RUN | Sin cambio visual; navegación/visor corresponden B5/B11, limpieza física B6. No afirmar aceptación de las 29 CA. |

| Criterio normativo B4 | Estado real |
|---|---|
| RF-R7-02.CA-01/02/04 | Implementación y SQL local PASS; validación integrada HTTP y presentación B5 pendientes. |
| RF-R7-02.CA-03 | Errores/rollback/ACK y archivo inválido cubiertos en capas locales; mensaje visible al usuario B5 pendiente. |
| RF-R7-03.CA-01/02/04 | Consulta segura/aislada/vigente y vacío implementados; entrada desde ficha, visor y estados visuales B5/B11 pendientes. |
| RF-R7-04.CA-01..04 (base de seguridad, sin cerrar RF) | TTL servidor/denegación SQL/lector cubiertos localmente; transporte real y eliminación física B6 pendientes. |

### Cuatro marcas de migración

| Migración | Creada | Probada SQL local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| `20261016193248_r7_stories.sql` | Sí, CLI `migration new r7_stories` | PASS, replay 45/45 | Sí, autorización posterior | Sí, catálogo/ACL/RLS |

## Reproducción

Desde el worktree, Node 24 y herramientas locales del harness existente:

```powershell
npm ci --ignore-scripts
$env:PLANIT_TEST_TOOLS_DIR='../.participation-test-tools.local/node_modules'
node scripts/check-r7-stories.mjs
node scripts/check-r7-stories.mjs --chat-regression
node scripts/check-r7-stories-client.mjs
node scripts/check-r7-stories-edge.mjs
node scripts/check-r7-stories-http.mjs # NOT RUN sin opt-in/fixture
$env:DENO_DIR=(Join-Path (Get-Location) '.r7-deno-cache.local')
../r7-block-1-worktree/.r7-test-tools.local/node_modules/@deno/win32-x64/deno.exe check --config supabase/functions/r7-story-image/deno.json supabase/functions/r7-story-image/index.ts
npm run build
npm run lint
git diff --check
```

SQL inicializa/cierra clústeres nuevos aislados en loopback y carpetas `.local`; Auth/Storage son scaffolds SQL. No usa Supabase remoto ni elimina bases existentes. Primeras ejecuciones detectaron bloqueo localhost del sandbox y errores de fixture (RLS sobre búsqueda de participación y contrato de reingreso); corregidos, evidencia final PASS. `PLANIT_SQL_OUTPUT` permite guardar evidencia separada.

Suite HTTP: requiere **permiso separado del responsable para entorno/fixtures**, migración aplicada y lector desplegado; luego `PLANIT_STORIES_HTTP_APPROVED=1` y `PLANIT_STORIES_HTTP_FIXTURE` apuntando a JSON privado ignorado. Campos: `url` (sólo planit-v2), `publicKey`, `eventId`, `tokens:{A,B,C,D,E,F}`, `liveStory:{id,file_id,storage_path}`, `expiredStory:{id,storage_path}`. A debe ser autor/organizador; B confirmado; C pendiente; D autor retirado; E sólo enlace; F ajeno. Historias del mismo evento, ya provisionadas. El script no sube, crea historias, modifica reloj, elimina ni despliega; sólo lectura, intento de firma que debe fallar e intento negativo de publicación con un UUID ya existente. No imprime secretos ni cuerpos privados. La provisión/mutación de fixtures y transiciones temporales reales necesitan un ensayo autorizado adicional.

## Revisión y gate humano

Revisión cruzada sólo lectura por `stories_review`: sin hallazgos accionables sobre autorización, TTL, exclusividad o idempotencia; no ejecutó pruebas remotas. Diff propio: migración B4, API TS, lector Edge aislado, runners/fixtures de historias y evidencia bajo esta carpeta. `.env.local` copiado desde `mapbox-worktree` (main), ignorado y no versionado; checkout inicial con cambios ajenos preservado.

Riesgos/pendientes: falta validar PostgreSQL remoto/Storage/Auth/Edge en conjunto y headers reales tras autorización, más pruebas reales de sign/list/HEAD/transforms/cachés y carreras TTL. No cron, GC ni cuota de producto nuevos. No se usa un mock como evidencia de permisos reales. No se aplicaron migraciones, DDL remoto, deploy, secretos, merge ni cambios de Google Doc.

**Revisar PR y autorizar por separado los pasos remotos que correspondan. No GO de aceptación funcional ni del siguiente bloque. B5 y B6 podrán habilitarse tras revisión/integración B4 y aprobación del responsable; no se iniciaron.**

## Actualización remota autorizada — 16/10/2026

El responsable pidió expresamente **«hace las migraciones a la base remota»**. Se aplicó únicamente `20261016193248_r7_stories.sql` en **planit-v2 (`iepeqmvzjguwlhnecsdq`)**, con `--skip-vault`, sin seeds, roles, secretos, deploy Edge, cron ni merge. El CLI terminó correctamente; el proyecto histórico no se modificó.

La inspección previa encontró 45 versiones remotas, incluida B10 `20261016154257_r7_push_jobs.sql`, aplicada por otra tarea pero aún fuera de main. El primer dry-run la detectó ausente localmente. Siguiendo el precedente B3/#82 se preparó un directorio `.r7-b4-remote.local` ignorado con las migraciones de esta rama y esa versión leída de `origin/codex/r7-block-10`. No se reparó ni alteró el historial remoto; B10 no se incorporó a esta PR ni se ejecutó otra vez. El dry-run preparado mostró **sólo B4 pendiente**.

Evidencia de catálogo/ACL/RLS y asesores: [antes](remote/before.json), [después](remote/after.json), [consulta READ ONLY](remote/verify-readonly.sql), [verificador](remote/verify.mjs), [resumen](remote/summary.json). El catálogo se limita al esquema y no contiene filas de usuarios ni secretos.

Verificación posterior **PASS**: 46 versiones en remoto, cero pendientes en dry-run con historial completo; 11/11 cuerpos de función idénticos al SQL de Git, `search_path=''`, RLS/ACL y constraints/índices/triggers de stories correctos. Policies Storage/files intactas. El remoto usa PostgreSQL 17.11. Los permisos por defecto de Supabase en `public` también conceden EXECUTE a service_role para las dos nuevas RPC autenticadas; ningún helper privado concede acceso cliente y el target de bytes sigue exclusivo de servicio. Asesores: **0 ERROR, 61 WARN** frente a 59 previos; los dos nuevos son avisos esperados de RPC SECURITY DEFINER ejecutables por authenticated (`get_event_stories`, `publish_event_story`), cuya autorización explícita fue revisada. No se cambió configuración Auth para silenciar avisos. Una consulta de catálogo demorada se reintentó correctamente; no se reaplicó la migración.

La autorización de migración no despliega `r7-story-image`. HTTP/JWT/Storage reales continúan **NOT RUN**, y el lector de historias requiere deploy separado antes de utilizar su descarga desde B5. No se inició otro bloque.
