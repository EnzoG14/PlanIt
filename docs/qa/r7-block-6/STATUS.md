# R7 · Bloque 6 — Caducidad y limpieza física

17/10/2026, Argentina. **IMPLEMENTADO / SQL y Edge locales PASS / migración remota aplicada y catálogo verificado con autorización posterior / HTTP y GC físico NOT RUN.** [PR draft #85](https://github.com/EnzoG14/PlanIt/pull/85). Entrega técnica `2a3533dc66bbd95c63973b98529cf9262107c878`; los cortes inferiores describen la entrega inicial. Ver actualización remota al final.

Base verificada tras fetch: `0beac193775ec043f1d063637c00ecc82152c42a`, `origin/main`. Rama nueva `codex/r7-block-6`, worktree `r7-block-6-worktree`. Prerequisito B4 integrado por PR #83 (`1364e21`); la base también incluye B5 #84 y B10 #81, sin convertirlos en prerrequisitos. `.env.local` copiado desde `mapbox-worktree` (main), igualdad byte a byte comprobada, ignorado y sin versionar. Checkout inicial y sus cambios ajenos preservados.

El plan/estado/acta B0 conservan cortes históricos. El pedido explícito de implementar B6 habilita esta entrega. Se revisaron prompt, RF/29 CA, plan/decisiones/contratos/ownership/QA R7, instrucciones raíz/src/Supabase/diseño, producto/arquitectura/modelo/sistema visual/workflow, cierre R6 y reporte B4. R6 se mantiene como baseline estable. El mockup original R7 se inspeccionó y se conserva; B6 no cambia frontend ni UI de historias. **Este reporte actualiza el seguimiento del bloque; B11 conserva el ownership de la consolidación global `RELEASE_7_STATUS.md`.**

## Entrega

- Migración incremental `20261017180932_r7_story_gc.sql`, creada con CLI `migration new`: cola privada RLS, lease y cuatro RPC service-only; helper privado de autoridad que comprueba historia vencida, exclusividad, namespace/identidad Storage y ausencia de referencias a avatar/galería/chat. Sin modificaciones a migraciones históricas ni permisos de lectura de B4.
- `supabase/functions/r7-media-cleanup/{index,handler}.ts`, `deno.json` y plantilla manual `schedule.sql`: bearer dedicado de servidor, límites de ejecución, revalidación, Storage API DELETE, confirmación transaccional y retry. No endpoints/credenciales reales del scheduler en Git.
- Suites `scripts/check-r7-expiration*.mjs`, fixture SQL y evidencia bajo esta carpeta. [Operaciones, interfaces, cron, cuotas y recuperación](OPERATIONS.md).

Decisiones aplicadas: D03 (24h de servidor incluso tras fin normal), D04 (inaccesibilidad antes de purga), D09 (Edge/cron/cola), D10 (sin URLs firmadas ni bypass uploader), D13 (exclusividad e idempotencia), D17 (ownership). D12 es una propuesta operativa documentada: 15min, lote máximo100, lease120s y backoff hasta1h; no cuota de producto ni activación aprobada. Se conserva la decisión humana registrada en B4 para cancelación/archivo. El pedido actual no firma otras propuestas ni autoriza operaciones remotas.

## Evidencia por capa

| Capa/caso | Estado | Evidencia y límites |
|---|---|---|
| Replay migraciones | PASS local | 47/47 archivos en PostgreSQL 18.4 real; [hashes y resultados](sql/sql-results.json). Auth/Storage son scaffolds SQL, no Supabase completo. Remoto B4 reportó PostgreSQL17.11; sin afirmar paridad de versión. |
| R7-B6-TC-01 | PASS SQL / HTTP NOT RUN | Acceso positivo antes de24h, igualdad estricta a nivel predicado, denegación posterior en RPC/RLS/target Edge autor y confirmed, aunque objeto aún exista. El instante exacto por transporte desplegado no fue probado. |
| R7-B6-TC-02 | PASS SQL / dispositivo NOT RUN | Hora AR de servidor, sesiones con zonas extremas no recuperan vencidas; sin entrada de fecha cliente. No equivale a mover reloj de un dispositivo real. |
| R7-B6-TC-03 | PASS SQL + handler simulado | Dos claims simultáneos distintos; leases/retry/fencing, fallo final SQL revierte referencias, objeto ausente permite completar. Activas, chat, galería, avatar y huérfanos conservados; reuso concurrente rechazado; identidad alterada en cuarentena. DELETE físico real NOT RUN. |
| R7-B6-TC-04 | PASS SQL + handler simulado | ACL anon/authenticated/missing, secreto inválido sin I/O, snapshot de mensajes/DM/bandeja/galería/avatar intacto. 401/403 desplegado NOT RUN. |
| Edge | PASS unitario | [5 grupos](edge/results.json): handler y entrypoint TS reales, RPC/Storage simulados, transporte DELETE/headers/timeout/redirect, timeout/5xx/429, ACK perdido, target cambiado/path traversal, máximo100, respuesta sin contenido privado. |
| Lector B4 | PASS regresión unitaria | [3 grupos](edge/reader-regression.json): Auth/target/bytes simulados; revalidación después de I/O niega vencimiento/remoción. No se modificó el lector. |
| ACL/RLS | PASS SQL | [Inventario](sql/inventory.json); 5 funciones `search_path=''`, clientes sin EXECUTE, cuatro RPC servicio, tabla privada RLS sin DML directo. |
| Chat/DM | PASS regresión SQL | [9 grupos](regression-chat/sql-results.json), 47 migraciones; v1/v2, texto/imagen, direct sólo texto, aviso único, locks/rollback/cursor/ACL. Metadatos de base/rama del reporte son los del runner B4 reutilizado; lista/hash de47 migraciones acredita ejecución con B6. |
| Tipado Edge | PASS | Deno2.9.6 `check` del entrypoint y su config. |
| Build/lint | PASS | `npm run build`, `npm run lint`; warnings heredados de scripts de diseño/DiscoveryFilters, temporales del harness durante ejecución, bundle Mapbox e inlineDynamicImports. SW conserva86 entradas; no acredita offline/Push. |
| HTTP/JWT/Storage/Scheduler remoto | NOT RUN | [Probe opt-in](http/results.json). Sin entorno/fixtures autorizados, deploy ni cron. No se acredita eliminación física por borrar metadata en un scaffold SQL. |
| UI320/375/390/768/1280, SW/offline, Push físico, E2E R1–R6 | NOT RUN | No cambio visual/SW; regresión local de datos no sustituye E2E. |

El primer intento SQL quedó bloqueado por conexión localhost del sandbox; se repitió con autorización técnica. La primera ejecución completa detectó una expectativa de fixture demasiado específica (`media_conflict` frente a `invalid_avatar`); se corrigió para verificar el rechazo CHECK23514 real. La ejecución final pasó los cinco grupos. No se ocultaron fallos del producto como PASS ni se usaron mocks para acreditar permisos remotos.

| RF-R7-04 | Estado real |
|---|---|
| CA-01 | Lógica servidor y prueba local PASS; frontera HTTP real NOT RUN. |
| CA-02 | Acceso vencido local PASS; worker implementado/probado por capas. Eliminación física Storage y cron desplegado NOT RUN. |
| CA-03 | RPC/RLS/target local niegan vencidas/uploader y firma; transporte directo real NOT RUN. |
| CA-04 | Servidor autoritativo, prueba SQL local PASS; reloj dispositivo real NOT RUN. |

**RF no cerrado como validado integralmente.** Sin DDL remoto, db push, deploy, cambios de secretos, activación cron, merge ni edición del Google Doc.

## Cuatro marcas

| Migración | Creada | Probada SQL local | Aplicada remotamente con aprobación | Verificada remota |
|---|---|---|---|---|
| `20261017180932_r7_story_gc.sql` | Sí, CLI | PASS, replay47/47 | Sí, autorización posterior | PASS catálogo/ACL/RLS |

Compatibilidad: DB sólo cola/funciones nuevas; API usuario/RPC de B4 sin cambios; Storage policies y lectores actuales sin cambios; sin nueva dependencia npm, modificación de SW/PWA ni UI. Invariantes FK/claims siguen efectivas durante lease y al commit. La reserva privada se conserva como tombstone para impedir reuso; métricas sólo agregadas en respuesta, sin historial personal nuevo.

## Reproducción

```powershell
npm ci --ignore-scripts
$env:PLANIT_TEST_TOOLS_DIR='../.participation-test-tools.local/node_modules'
node scripts/check-r7-expiration.mjs
node scripts/check-r7-expiration-edge.mjs
node scripts/check-r7-expiration-http.mjs # NOT RUN sin opt-in/fixture
node scripts/check-r7-stories.mjs --chat-regression
node scripts/check-r7-stories-edge.mjs
$env:DENO_DIR=(Join-Path (Get-Location) '.r7-deno-cache.local')
../r7-block-1-worktree/.r7-test-tools.local/node_modules/@deno/win32-x64/deno.exe check --config supabase/functions/r7-media-cleanup/deno.json supabase/functions/r7-media-cleanup/index.ts
npm run build
npm run lint
git diff --check
```

Los runners de regresión B4 escriben en sus carpetas históricas: copiar la evidencia a B6 y restaurar esos outputs antes del commit; no versionar cambios ajenos al ownership. El harness requiere herramientas PostgreSQL/pg existentes y crea/cierra clústeres temporales locales. Nunca se conecta al remoto.

HTTP opt-in: aprobación expresa del entorno, `PLANIT_EXPIRATION_HTTP_APPROVED=1` y `PLANIT_EXPIRATION_HTTP_FIXTURE` a JSON privado ignorado. Campos: `url` exacta planit-v2, `publicKey,eventId,tokens:{A,B},liveStory:{id},expiredStory:{id,storage_path}`. A autor/organizador, B confirmed, historias ya provisionadas; sólo consultas/GET/firma negativa e invocación negativa del cleanup sin secreto. El probe no publica, modifica fechas ni ejecuta borrados autorizados. La provisión, cruce temporal y ensayo físico GC necesitan permiso separado.

## Gate

Revisar PR draft y autorizar por separado SQL/deploy/secretos/cron y pruebas reales de ciclo de vida. Riesgos pendientes: paridad PG17, transporte Storage/Auth/Edge desplegado, configuración y secretos de cron, backlog/cuota medida, frontera exacta y fallos reales de Storage. Limpieza de huérfanos reservados se audita por separado, no tiene autoridad para borrar en este worker. **Detener B6 aquí; no iniciar el siguiente bloque sin aprobación humana.**

## Actualización remota autorizada — 17/10/2026

El responsable pidió **«hace las migraciones a la base remota pendientes»**. Historial y dry-run confirmaron que sólo estaba pendiente `20261017180932_r7_story_gc.sql`. Se aplicó esa migración en **planit-v2 (`iepeqmvzjguwlhnecsdq`)** usando `db push --linked --project-ref ... --skip-vault --yes`; sin seeds, roles adicionales, secretos, deploy Edge, cron ni merge. El proyecto histórico no se modificó.

Antes:46 versiones. Después:47 versiones, PostgreSQL17.11, dry-run final `upToDate:true`, ninguna migración pendiente. [Catálogo anterior](remote/before.json), [posterior](remote/after.json), [consulta READ ONLY](remote/verify-readonly.sql), [verificador](remote/verify.mjs) y [resumen](remote/summary.json). Sólo esquema/ACL, sin filas personales ni secretos.

**PASS remoto de catálogo:**5/5 cuerpos de funciones idénticos al SQL versionado; `search_path=''`; sin EXECUTE anon/authenticated; cuatro RPC service-only y helper privado; tabla de jobs con RLS y sin SELECT cliente/servicio directo; cinco constraints e índices presentes. Funciones de lectura y policies de files/stories/Storage idénticas antes/después. Asesores de seguridad: **0 ERROR /61 WARN antes y después**, sin nuevas advertencias. No se cambió configuración para silenciarlas.

El primer dry-run se demoró inicializando el rol de conexión mientras había consultas CLI simultáneas. Se detuvo únicamente ese proceso de dry-run y se repitió secuencialmente, con resultado correcto; no hubo intento de aplicación hasta confirmar el alcance. El verificador local se ajustó para reconocer nombres que contienen dígitos (`r7`); el resultado final PASS compara los cinco cuerpos.

Esta autorización completa las marcas **aplicada/verificada remota de la migración**, no la aceptación funcional por HTTP ni la ejecución del worker. No se desplegó `r7-media-cleanup`, no se configuraron secretos y **no se activó cron**. No se invocó GC ni se borraron imágenes. Continúan pendientes las pruebas reales de Storage/JWT/ciclo de vida y su autorización específica. No se inició otro bloque.
