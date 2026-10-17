# R7 · Bloque 11 — Composición y QA integral

17/10/2026, Argentina. **Implementado para revisión; NO-GO de aceptación integral.** Base limpia `279af15d09988f43a4e79dd397611c645b0b2808`, rama `codex/r7-block-11`, worktree `r7-block-11-worktree`. La PR draft se registra en el reporte final. No se autoriza ni ejecuta merge, deploy, SQL remoto, secretos, cron o edición del Google Doc.

## Composición y compatibilidad

- `EventDetailPage` conecta `EventCalendarAction`, `EventShareAction` y `EventStoriesEntry`. Construye un DTO explícito con id, título, horarios, lugar, dirección, visibilidad y estado; no exporta descripción, asistentes, estadísticas, grants ni paths de imágenes.
- `EventParticipation` comunica el resumen de la RPC existente mediante callback opcional: no duplica consultas. Retiro/mutación limpia el permiso inmediatamente; error de revalidación también lo retira. La consulta periódica exitosa no desmonta el visor. Los booleanos sólo controlan presentación; RPC/Edge siguen autorizando cada solicitud.
- Historias se abre en el visor modal de B5 desde el detalle y conserva ruta/origen. No se agrega una ruta innecesaria a `App.tsx`. Fin normal conserva lectura, publicación sólo con estado abierto. Cancelación/archivo conservan la decisión de B4 y sus permisos servidor.
- El enlace oculto se comparte exclusivamente dentro del diálogo de `EventLinkPanel`, una vez emitido tras confirmación. Un render prop opcional pasa la acción por `EventManagement`: no levanta ni persiste el token, no recupera hashes ni rota al compartir. Cerrar el diálogo desmonta esa acción y borra la URL. El detalle sin token explica la gestión necesaria.
- `PushSettings` ya está conectado una única vez en Perfil por la ampliación autorizada B10/#81. Se conserva esa ubicación y su API, sin duplicar ajustes ni bandeja.
- Único ajuste visual: separación de integraciones/historias con tokens Amanecer existentes. Mockup original R7 inspeccionado y sin cambios; se conserva su inventario funcional, sin incorporar música, stickers, reacciones, favoritos ni extras ilustrados. Contexto Impeccable leído; `DESIGN.md` sigue siendo autoridad, sin regenerar documentos de diseño.
- DB/API/Storage/SW: ninguna migración nueva ni modificación de SQL, contratos, policies, Edge o SW. No dependencias de producción nuevas. `ical.js@2.2.1` se instaló sólo para QA en carpeta ignorada. `.env.local` copiado desde `mapbox-worktree` (main), igualdad comprobada sin imprimir valores, ignorado y no versionado.

Decisiones utilizadas: D01/D02 límites de imagen y DM, D03/D04/D10 TTL y permisos, D05 visor, D06 ICS/Google, D07 ocultos, D08 preview y opt-out, D09 workers, D13 idempotencia/exclusividad, D15 ausencia de cuota de historias y D17 ownership. Las propuestas operativas de B0 no adquieren aprobación humana por este reporte. R6 mantiene su GO humano histórico como baseline, sin reabrir tareas funcionales.

## Evidencia y ejecución

| Capa | Resultado y evidencia | Límite |
|---|---|---|
| Prerrequisitos | [12 PRs MERGED y bases](prerequisites.json); `check-r7-release-report.mjs` verifica ancestry | Histórico Git/GitHub, no QA funcional |
| Replay/RLS/constraints | `check-r7-media`, `chat`, `stories`, `expiration`, `push-subscriptions`, `push-delivery`; [salidas](suites/) | 47 migraciones, PostgreSQL18.4 real; Auth/Storage son scaffolds SQL, SET ROLE no JWT |
| Edge/cliente | media-client/media-edge/chat-image-edge/stories-client/stories-edge/expiration-edge/push-delivery-edge | WASM decodifica imágenes reales; Auth/RPC/Storage/proveedor simulados en handlers |
| Integración UI | [25 grupos en detalle real](ui/results.json), [capturas antes](ui/before-results.json), ICS descargados | Edge headless, origen HTTPS sintético proxied a Vite; Auth/REST y `navigator.share` simulados |
| Componentes UI | [Resultados y screenshots](regressions/ui.json): Stories, Calendar, Share, Push | Fixtures; no selector nativo ni dispositivos físicos |
| Calendario | `check-r7-calendar`, parser independiente ical.js, cinco TZ, Unicode/escape/folding, Google URL; [salidas](suites/) | Importación en cliente final y guardado Google NOT RUN |
| SW/PWA | [4 grupos PASS](sw/sw-results.json): registro/precache, sin caché Supabase, offline, push/click sintéticos | Actualización entre dos versiones de producción y Push físico NOT RUN |
| Regresión R1–R6 | Foundation/events/tokens; R4 links/access/invite; [R5 social/DM y R6 compare/event_full](regressions/sql.json) | SQL y unitarios, no E2E completo de todas las releases |
| Build/lint | [build](build.txt), [lint](lint.txt) | Warnings previos de diseño/DiscoveryFilters y bundle Mapbox; sin errores |
| Trazabilidad | [29 CA literales](CRITERIA.md), [JSON](criteria.json), [31 checks](report-checks.json) | 4 PASS técnicos locales, 25 BLOCKED, aceptación humana pendiente |

Los JSON internos de runners heredados conservan etiquetas de rama/base B1/B2/B4/R5/R6. Para esta ejecución, la base verdadera es la de este documento y de los JSON externos `results-*.json` / `prerequisites.json`; las listas/hash de 47 migraciones acreditan el replay actual. No se presenta la etiqueta histórica como HEAD de B11. No se sobrescribe evidencia de productores.

Los logs `.txt` se normalizaron a LF sin espacios al final ni líneas vacías de cierre para `git diff --check`; no se eliminaron resultados, fallos ni mensajes. Los archivos ICS conservan su formato generado. Auth validación local también PASS en `auth.txt`, sin flags de signup/live.

El primer `npm ci` falló por DNS restringido; la repetición autorizada completó 372 paquetes y auditoría sin vulnerabilidades. Un build iniciado antes de terminar esa instalación falló por módulo Mapbox incompleto; después de `npm ci` completo, build/lint PASS. No se cambió el lockfile para resolverlo.

El primer test multimedia esperaba `media_conflict` con una historia sin attestation. Ahora la barrera anterior devuelve `image_verification_required`. Se conservó el fallo inicial en `suites/check-r7-media.txt` y se corrigió sólo la fixture: primero comprueba ese rechazo; luego valida el objeto con fixture service-only y comprueba el rechazo de cruce historia/chat. La repetición pasa ambas barreras. No se debilitó la autorización ni se cambió SQL. Un primer agregador se detuvo porque su filtro de suites confundía `delivery` con `live`; los logs previos se conservan y el filtro se corrigió a sufijos explícitos.

## Casos B11 y dictamen

| Caso | Estado | Resultado |
|---|---|---|
| R7-B11-TC-01 | PASS de evaluación, no 29 PASS funcionales | 29/29 CA con texto/hash, capas ejecutadas y gate preciso; [matriz](CRITERIA.md) |
| R7-B11-TC-02 | BLOCKED integral | SQL/handlers PASS para ajenos/TTL/revocación/conservación; HTTP/Storage real, frontera exacta y GC físico no ejecutados |
| R7-B11-TC-03 | BLOCKED integral | SQL cola/preview/DM/grupo y fallos PASS; B10 conserva recepción humana de un DM, sin repetir ni dos dispositivos en B11 |
| R7-B11-TC-04 | BLOCKED por decisión humana | Acta preparada, firma/aceptación pendiente, limitaciones exactas en reporte final |

**NO-GO recomendado.** No hay evidencia de un bypass funcional descubierto en las pruebas ejecutadas. Faltan pruebas de transporte que podrían descubrirlo; no se confunde ausencia de evidencia con seguridad demostrada.

Pendientes operativos concretos: `r7-media-cleanup` y cron aún no desplegados/activados según B6; verificar estado desplegado de `r7-story-image` antes de publicar el circuito; Push requiere invocación manual del worker porque no hay cron autorizado. No se promete entrega automática continua. Medir backlog, cuota Storage, bytes huérfanos y latencia con datos representativos; los límites de lote/lease/retry de B6/B10 son controles técnicos, no cuota de historias. La limpieza de huérfanos reservados no queda acreditada por la de historias vencidas.

Revisión de seguridad: RLS/ACL/search_path y FK/claims se prueban por suites, sin nuevas políticas permisivas OR. No se introdujeron secretos, `service_role`, VAPID privada ni endpoints de suscripciones en frontend/PR. Jobs contienen IDs; error injection verifica respuestas/logs agregados. No se agregó otro productor `notifications`; DM sigue sólo texto, galería/avatar mantienen separación. Performance local de R6 se conserva como evidencia sintética, sin SLA productivo.

## Reproducción

Desde este worktree, dependencias del lockfile (`npm ci --ignore-scripts`). Las herramientas QA existentes se referencian sin añadirlas al proyecto:

```powershell
$env:PLANIT_TEST_TOOLS_DIR='../.participation-test-tools.local/node_modules'
$env:PLANIT_MEDIA_TOOLS_DIR='../r7-block-1-worktree/.r7-test-tools.local/node_modules'
$env:PLANIT_DENO_PATH=(Resolve-Path ../r7-block-1-worktree/.r7-test-tools.local/node_modules/@deno/win32-x64/deno.exe).Path
$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
npm install --prefix .r7-calendar.local --no-audit --no-fund --ignore-scripts ical.js@2.2.1
node scripts/check-r7-release.mjs check-r7-media check-r7-chat check-r7-stories check-r7-expiration check-r7-push-subscriptions check-r7-push-delivery check-r7-media-client check-r7-media-edge check-r7-chat-image-edge check-r7-stories-client check-r7-stories-edge check-r7-expiration-edge check-r7-share check-r7-calendar check-r7-push-delivery-edge check-r7-share-regressions check-foundation check-events check-amanecer-tokens
node scripts/check-r7-release-regressions.mjs
node scripts/check-r7-release-regressions.mjs --ui
node scripts/check-r7-integration-ui.mjs --baseline # before from fixed base279af15
node scripts/check-r7-integration-ui.mjs
npm run build
npm run lint
$env:PLANIT_SW_OUTPUT='docs/qa/r7-block-11/sw'
node scripts/check-r7-push-subscriptions-sw.mjs
node scripts/check-r7-release-report.mjs
git diff --check
```

Ejecutar suites secuencialmente para no compartir temporales de productores. Las carpetas PostgreSQL temporales se detienen mediante el cleanup de cada harness; no `db reset` compartido ni conexión remota. Los runners de B11 conservan las aserciones originales y agregan sólo los scaffolds Storage requeridos por migraciones R7 a bootstraps antiguos. Los comandos no crean cuentas reales, no envían mensajes ni invocan workers remotos.

Plataformas de esta ejecución: Windows/Edge headless (versión exacta en UI/SW JSON). Chrome/Firefox/Android/iOS/Safari instalados, teclado móvil/safe areas físicas y lector de pantalla real **NOT RUN**. Texto200% es emulación, no zoom/teclado físico. El contexto Impeccable informó sidecar de diseño desactualizado; se usó `DESIGN.md`, sin reparación fuera del alcance.

El siguiente paso es revisar esta PR y el [reporte final](../RELEASE_7_TEST_REPORT.md), autorizar por separado los ensayos reales/operación pendientes y registrar aceptación o excepciones humanas. No se inicia otro bloque.
